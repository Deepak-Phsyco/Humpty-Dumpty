import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Sliders, 
  ListOrdered, 
  Info, 
  X, 
  RotateCw, 
  Compass, 
  Eye, 
  CheckCircle, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp,
  Bot
} from 'lucide-react';
import { DetectionPrediction, Equipment } from '../types/equipment';
import { SafetyCard } from './SafetyCard';
import { StepsGuide } from './StepsGuide';
import { SpecsView, MoreInfoView } from './SpecsView';
import { TRANSLATIONS } from '../lib/translations';

interface AROverlayProps {
  prediction: DetectionPrediction | null;
  equipment: Equipment | null;
  isLocked: boolean;
  onCloseGuide: () => void;
  lang: 'en' | 'hi';
  onAcknowledgeSafety: (equipmentId: string) => void;
  acknowledgedSafetyIds: Set<string>;
  onOpenChatbot?: (equipment: Equipment) => void;
}

export const AROverlay: React.FC<AROverlayProps> = ({
  prediction,
  equipment,
  isLocked,
  onCloseGuide,
  lang,
  onAcknowledgeSafety,
  acknowledgedSafetyIds,
  onOpenChatbot,
}) => {
  const [activeTab, setActiveTab] = useState<'safety' | 'steps' | 'specs' | 'more'>('safety');
  const [is3DMode, setIs3DMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = TRANSLATIONS[lang];

  const isSafetyAcknowledged = equipment ? acknowledgedSafetyIds.has(equipment.id) : false;

  // Enforce SAFETY FIRST: default to safety tab until acknowledged
  useEffect(() => {
    if (equipment && !acknowledgedSafetyIds.has(equipment.id)) {
      setActiveTab('safety');
    }
  }, [equipment, acknowledgedSafetyIds]);

  if (!prediction) return null;

  const { bbox, confidence, displayName, rawClass } = prediction;
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* 1. ANIMATED BOUNDING BOX WITH TARGETING RETICLES */}
      <div
        className="absolute transition-all duration-150 ease-out border-2 border-brand-400 rounded-2xl shadow-[0_0_25px_rgba(34,187,128,0.45)]"
        style={{
          left: `${Math.max(10, bbox.x)}px`,
          top: `${Math.max(10, bbox.y)}px`,
          width: `${Math.max(60, bbox.width)}px`,
          height: `${Math.max(60, bbox.height)}px`,
        }}
      >
        {/* Reticle Corner Brackets */}
        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-white rounded-tl" />
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-white rounded-tr" />
        <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-white rounded-bl" />
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-white rounded-br" />

        {/* Center Target Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-brand-400/50 flex items-center justify-center animate-ping opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
          </div>
        </div>

        {/* Floating Tracking Label (Name + Confidence %) */}
        <div className="absolute -top-9 left-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-brand-400/50 text-white shadow-lg pointer-events-auto whitespace-nowrap animate-float">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-xs font-bold">{displayName}</span>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {confidencePercent}%
          </span>
        </div>

        {/* 3D Arrow / Spatial Vector Indicator */}
        {is3DMode && (
          <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-auto">
            <div className="w-9 h-9 rounded-full bg-brand-500/30 border border-brand-400 backdrop-blur flex items-center justify-center animate-spin">
              <Compass className="w-5 h-5 text-brand-300" />
            </div>
            <span className="text-[9px] font-mono font-bold text-brand-300 bg-black/60 px-1 rounded">
              Z: 0.85m
            </span>
          </div>
        )}
      </div>

      {/* 2. ANCHORED AR GUIDE CARD (LOCKED STATE) */}
      {isLocked && equipment && (
        <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto px-3 pb-5 pt-2 pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-xl mx-auto rounded-3xl bg-elevate-dark/95 border border-brand-500/30 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
            {/* Guide Card Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-elevate-card via-elevate-dark to-elevate-card border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                      {lang === 'hi' && equipment.hindiName ? equipment.hindiName : equipment.name}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase">
                      AR LOCKED
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Category: <span className="text-gray-200">{equipment.category}</span>
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Ask DeepSeek AI Assistant */}
                {onOpenChatbot && (
                  <button
                    onClick={() => onOpenChatbot(equipment)}
                    className="p-2 rounded-xl bg-gradient-to-r from-brand-600/30 to-emerald-500/30 hover:from-brand-600/50 hover:to-emerald-500/50 text-brand-300 border border-brand-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                    title="Ask DeepSeek AI Assistant about this instrument"
                  >
                    <Bot className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-[10px]">Ask AI</span>
                  </button>
                )}

                {/* 3D Mode Toggle */}
                <button
                  onClick={() => setIs3DMode(!is3DMode)}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    is3DMode
                      ? 'bg-brand-500 text-elevate-dark border-brand-400'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                  }`}
                  title="Toggle 3D spatial overlay mode"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">3D</span>
                </button>

                {/* Collapse / Expand */}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
                  title={isCollapsed ? 'Expand guide' : 'Collapse guide'}
                >
                  {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Dismiss / Close Guide */}
                <button
                  onClick={onCloseGuide}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-300 border border-white/10 transition-colors"
                  title="Close guide & scan next item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collapsible Body */}
            {!isCollapsed && (
              <div className="p-3 sm:p-4 space-y-3">
                {/* 4 Tappable Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/40 border border-white/10">
                  {/* Safety Tab (First) */}
                  <button
                    onClick={() => setActiveTab('safety')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      activeTab === 'safety'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.tabs.safety}</span>
                  </button>

                  {/* Steps Tab (Locked until safety acknowledged) */}
                  <button
                    onClick={() => setActiveTab('steps')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      activeTab === 'steps'
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
                        : !isSafetyAcknowledged
                        ? 'text-gray-500 hover:text-gray-400 opacity-60'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.tabs.steps}</span>
                  </button>

                  {/* Specs Tab */}
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      activeTab === 'specs'
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.tabs.specs}</span>
                  </button>

                  {/* More Tab */}
                  <button
                    onClick={() => setActiveTab('more')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      activeTab === 'more'
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.tabs.more}</span>
                  </button>
                </div>

                {/* Tab Content Display */}
                <div className="transition-all duration-200">
                  {activeTab === 'safety' && (
                    <SafetyCard
                      equipment={equipment}
                      isUnlocked={isSafetyAcknowledged}
                      onAcknowledge={() => {
                        onAcknowledgeSafety(equipment.id);
                        setActiveTab('steps');
                      }}
                      lang={lang}
                    />
                  )}

                  {activeTab === 'steps' && (
                    <StepsGuide
                      equipment={equipment}
                      isUnlocked={isSafetyAcknowledged}
                      onGoToSafety={() => setActiveTab('safety')}
                      lang={lang}
                    />
                  )}

                  {activeTab === 'specs' && (
                    <SpecsView equipment={equipment} lang={lang} />
                  )}

                  {activeTab === 'more' && (
                    <MoreInfoView equipment={equipment} lang={lang} />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
