import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  RefreshCw, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Trash2,
  CornerDownLeft,
  Info,
  CheckCircle2,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { Equipment } from '../types/equipment';
import { sendChatMessage, checkBackendHealth, clearSavedSession, getSavedSessionId } from '../lib/chatApi';
import { speechService } from '../lib/speech';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  equipmentName?: string;
  isError?: boolean;
}

interface LabLensChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  activeEquipment?: Equipment | null;
  lang: 'en' | 'hi';
  onClearActiveEquipment?: () => void;
  mode?: 'modal' | 'embedded';
}

export const LabLensChatbot: React.FC<LabLensChatbotProps> = ({
  isOpen,
  onClose,
  activeEquipment,
  lang,
  onClearActiveEquipment,
  mode = 'modal',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Suggested quick prompts based on whether equipment is selected
  const suggestedPrompts = activeEquipment
    ? [
        `What safety rules are critical for ${activeEquipment.name}?`,
        `Walk me step-by-step through operating ${activeEquipment.name}.`,
        `What common student mistakes should I avoid with this tool?`,
        `What PPE must I wear before using ${activeEquipment.name}?`,
      ]
    : [
        'How do I safely measure high voltage in an electrical lab?',
        'What should I do if an instrument gives fluctuating readings?',
        'What are the standard lab safety protocols for undergraduate students?',
        'Which PPE is mandatory in electronic and mechanical labs?',
      ];

  // 1. Initial Backend Health Check & Welcome message
  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      setBackendStatus('checking');
      const health = await checkBackendHealth();
      if (isMounted) {
        if (health.isOnline) {
          setBackendStatus('online');
          setBackendInfo(health.data);
        } else {
          setBackendStatus('offline');
          setBackendInfo(null);
        }
      }
    }

    if (isOpen) {
      checkHealth();
    }

    return () => {
      isMounted = false;
      speechService.stop();
    };
  }, [isOpen]);

  // 2. Initialize default welcome messages when equipment changes
  useEffect(() => {
    if (messages.length === 0) {
      const providerLabel = backendInfo?.provider === 'deepseek' ? 'DeepSeek Harness' : 'Google Gemini 3.8 Flash';
      const initialGreeting: ChatMessage = {
        id: 'welcome-init',
        role: 'assistant',
        content: activeEquipment
          ? `👋 **Hello! I am your LabLens AI Guide**, powered by **${providerLabel}** with verified lab grounding.\n\nI have loaded the verified laboratory placards and safety procedures for **${activeEquipment.name}** (${activeEquipment.category}).\n\nAsk me anything about its working principle, operating steps, safety rules, or common troubleshooting tips!`
          : `👋 **Hello! I am your LabLens AI Guide**, powered by **${providerLabel}** with verified lab grounding.\n\nI can answer questions regarding lab safety, scientific apparatus, measurement techniques, and verified operating procedures. Point your camera at an instrument or select one from the library to unlock specific guide context!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        equipmentName: activeEquipment?.name,
      };
      setMessages([initialGreeting]);
    }
  }, [activeEquipment, messages.length, backendInfo?.provider]);


  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      equipmentName: activeEquipment?.name,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setLastError(null);

    try {
      // Build lightweight conversation history
      const history = messages
        .filter(m => !m.isError)
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await sendChatMessage({
        message: text,
        equipmentId: activeEquipment?.id,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        equipmentName: activeEquipment?.name,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[Chatbot] Send error:', err);
      const errMsg = err?.message || 'Failed to connect to DeepSeek Harness backend.';
      setLastError(errMsg);

      const errorReply: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Connection or Processing Error**:\n${errMsg}\n\nPlease verify that the Node.js backend server is running (\`npm run server\`) and that your network connection is active.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    speechService.stop();
    setSpeakingMessageId(null);
    clearSavedSession();
    setMessages([]);
    setLastError(null);
  };

  const handleToggleSpeech = (msg: ChatMessage) => {
    if (speakingMessageId === msg.id) {
      speechService.stop();
      setSpeakingMessageId(null);
    } else {
      speechService.stop();
      setSpeakingMessageId(msg.id);
      speechService.speak(msg.content, lang, () => {
        setSpeakingMessageId(null);
      });
    }
  };

  // Render markdown with nice formatting
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const text = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-gray-200 my-0.5 leading-relaxed">
            {formatBoldText(text)}
          </li>
        );
      }
      // Numbered step
      if (/^\d+\.\s/.test(line.trim())) {
        const text = line.trim().replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className="ml-4 list-decimal text-gray-200 my-0.5 leading-relaxed">
            {formatBoldText(text)}
          </li>
        );
      }
      // Warning or Notice
      if (line.includes('⚠️') || line.includes('❌') || line.includes('Notice:')) {
        return (
          <div key={idx} className="my-1.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium">
            {formatBoldText(line)}
          </div>
        );
      }
      // Header
      if (line.trim().startsWith('### ') || line.trim().startsWith('## ')) {
        const text = line.trim().replace(/^#{2,3}\s/, '');
        return (
          <h4 key={idx} className="font-extrabold text-white text-xs mt-2.5 mb-1 text-brand-300">
            {text}
          </h4>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {formatBoldText(line)}
        </p>
      );
    });
  };

  // Bold markdown parsing helper
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-black/40 text-brand-300 font-mono text-[11px] border border-white/10">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  const containerClasses = mode === 'modal'
    ? `fixed z-50 transition-all duration-300 ${
        isExpanded 
          ? 'inset-2 sm:inset-6' 
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[460px] h-[580px] max-h-[85vh]'
      } flex flex-col bg-elevate-dark/95 backdrop-blur-2xl border border-brand-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden`
    : 'w-full h-[520px] flex flex-col bg-elevate-card/90 border border-white/10 rounded-2xl overflow-hidden';

  return (
    <div className={containerClasses}>
      {/* 1. CHAT HEADER */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-elevate-card via-elevate-dark to-elevate-card border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/25">
            <div className="w-full h-full bg-elevate-dark rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                backendStatus === 'online' ? 'bg-emerald-400' : backendStatus === 'checking' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                backendStatus === 'online' ? 'bg-emerald-500' : backendStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                LabLens <span className="text-brand-400">AI Assistant</span>
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-wider">
                {backendInfo?.provider === 'deepseek' ? 'DEEPSEEK HARNESS' : 'GEMINI 3.8 FLASH'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {backendStatus === 'online' ? 'Runtime Connected' : backendStatus === 'checking' ? 'Connecting to Runtime...' : 'Offline (Local guide)'}
              </span>
              <span>•</span>
              <span className="font-mono text-gray-400 truncate max-w-[130px]">
                {backendInfo?.activeModel || backendInfo?.harness?.model || 'gemini-3.8-flash'}
              </span>
            </div>

          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Clear Session */}
          <button
            onClick={handleClearConversation}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-red-400 border border-white/10 transition-colors"
            title="Clear conversation history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Expand / Minimize (Modal mode only) */}
          {mode === 'modal' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors hidden sm:block"
              title={isExpanded ? 'Restore window size' : 'Expand window'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close */}
          {mode === 'modal' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              title="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. ACTIVE INSTRUMENT CONTEXT BANNER */}
      {activeEquipment && (
        <div className="px-3.5 py-2 bg-brand-500/10 border-b border-brand-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shrink-0" />
            <span className="text-gray-300 truncate">
              Active Context: <strong className="text-white">{activeEquipment.name}</strong>
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase shrink-0 ${
              activeEquipment.hazardLevel === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
              activeEquipment.hazardLevel === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {activeEquipment.hazardLevel} Hazard
            </span>
          </div>

          {onClearActiveEquipment && (
            <button
              onClick={onClearActiveEquipment}
              className="text-[10px] text-gray-400 hover:text-white underline ml-2 shrink-0"
              title="Clear instrument and switch to general laboratory assistant"
            >
              General mode
            </button>
          )}
        </div>
      )}

      {/* 3. MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}
          >
            {/* Header / Role Info */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1 px-1">
              <span>{msg.role === 'user' ? 'You' : 'LabLens Guide'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
              {msg.equipmentName && (
                <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] text-gray-300">
                  {msg.equipmentName}
                </span>
              )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 sm:p-3.5 shadow-md ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white rounded-br-none shadow-brand-500/10'
                  : msg.isError
                  ? 'bg-red-950/40 border border-red-500/40 text-red-200 rounded-bl-none'
                  : 'bg-elevate-card border border-white/10 text-gray-100 rounded-bl-none'
              }`}
            >
              {renderMessageContent(msg.content)}

              {/* Text-To-Speech Listen Action for Assistant */}
              {msg.role === 'assistant' && !msg.isError && (
                <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400">
                  <button
                    onClick={() => handleToggleSpeech(msg)}
                    className="flex items-center gap-1 text-brand-300 hover:text-brand-200 transition-colors"
                    title="Listen aloud at your lab bench"
                  >
                    {speakingMessageId === msg.id ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>Stop reading</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Listen aloud</span>
                      </>
                    )}
                  </button>
                  <span className="text-[9px] text-gray-500">
                    Verified by {backendInfo?.provider === 'deepseek' ? 'DeepSeek Harness' : 'Google Gemini Flash'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/40 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            </div>
            <div className="bg-elevate-card border border-white/10 rounded-2xl rounded-bl-none p-3 shadow-md">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <RefreshCw className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                <span>{backendInfo?.provider === 'deepseek' ? 'DeepSeek Harness' : 'Gemini AI'} is analyzing verified lab protocols...</span>
              </div>

              <div className="flex gap-1 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Retry Button if last message was an error */}
        {lastError && !isLoading && (
          <div className="flex justify-center pt-1">
            <button
              onClick={() => handleSendMessage(messages[messages.length - 2]?.content || 'retry')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry last question</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. SUGGESTED PROMPT CHIPS */}
      {messages.length <= 3 && !isLoading && (
        <div className="px-3.5 py-1.5 border-t border-white/5 bg-black/30 shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-400" />
            <span>Suggested questions:</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. INPUT FORM */}
      <div className="p-3 bg-elevate-card/95 border-t border-white/10 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1 relative rounded-2xl bg-black/50 border border-white/15 focus-within:border-brand-500/60 focus-within:ring-1 focus-within:ring-brand-500/40 transition-all">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeEquipment ? `Ask about ${activeEquipment.name} safety, steps, or specs...` : 'Ask any lab equipment or safety question...'}
              rows={1}
              maxLength={2000}
              className="w-full bg-transparent px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none resize-none max-h-28"
            />
            <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{inputText.length}/2000</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-2xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-elevate-dark font-black shadow-lg shadow-brand-500/20 transition-all shrink-0 active:scale-95"
            title="Send question to DeepSeek Harness"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
