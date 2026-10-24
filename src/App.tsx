import React, { useState, useEffect } from 'react';
import { TopNav } from './components/TopNav';
import { HomeScreen } from './pages/HomeScreen';
import { ScanScreen } from './pages/ScanScreen';
import { LibraryScreen } from './pages/LibraryScreen';
import { EquipmentDetailScreen } from './pages/EquipmentDetailScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import { DemoModeModal } from './components/DemoModeModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AdminModal } from './components/AdminModal';
import { Equipment } from './types/equipment';
import { initEquipmentDatabase, db, toggleBookmark } from './lib/db';
import initialEquipmentData from './data/equipment.json';
import { Download, Sparkles, X, Bot } from 'lucide-react';
import { LabLensChatbot } from './components/LabLensChatbot';

export const App: React.FC = () => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<'home' | 'scan' | 'library' | 'detail' | 'history' | 'bookmarks'>('home');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [libraryCategoryFilter, setLibraryCategoryFilter] = useState<string>('All');

  // Simulation / Demo Mode State
  const [demoEquipmentToSimulate, setDemoEquipmentToSimulate] = useState<Equipment | null>(null);

  // Localization & Theme
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Safety Gatekeeper Acknowledgement: IDs of instruments where user acknowledged hazards
  const [acknowledgedSafetyIds, setAcknowledgedSafetyIds] = useState<Set<string>>(new Set());

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // All Loaded Equipment from Dexie IndexedDB
  const [allEquipment, setAllEquipment] = useState<Equipment[]>(initialEquipmentData as unknown as Equipment[]);

  // Modals & Chatbot
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatActiveEquipment, setChatActiveEquipment] = useState<Equipment | null>(null);

  const handleOpenChatbot = (equipment?: Equipment | null) => {
    setChatActiveEquipment(equipment || selectedEquipment || demoEquipmentToSimulate || null);
    setIsChatbotOpen(true);
  };

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // 1. Initialize Dexie DB & Onboarding Check
  useEffect(() => {
    async function loadData() {
      const items = await initEquipmentDatabase();
      setAllEquipment(items);

      // Load saved bookmarks
      try {
        const saved = await db.bookmarks.toArray();
        setBookmarkedIds(new Set(saved.map(b => b.equipmentId)));
      } catch (e) {
        console.warn('Bookmarks load error:', e);
      }
    }
    loadData();

    // Check if first-time user
    const hasSeen = localStorage.getItem('lablens_has_seen_onboarding');
    if (!hasSeen) {
      setIsOnboardingOpen(true);
    }

    // PWA Install Prompt Listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleToggleBookmark = async (id: string) => {
    const isNowFav = await toggleBookmark(id);
    setBookmarkedIds(prev => {
      const updated = new Set(prev);
      if (isNowFav) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  };

  const handleAcknowledgeSafety = (id: string) => {
    setAcknowledgedSafetyIds(prev => new Set(prev).add(id));
  };

  const handleEquipmentUpdated = async () => {
    const fresh = await db.equipment.toArray();
    setAllEquipment(fresh);
  };

  const handleSelectEquipmentForDemo = (equipment: Equipment) => {
    setDemoEquipmentToSimulate(equipment);
    setCurrentScreen('scan');
  };

  const handleOpenEquipmentDetail = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setCurrentScreen('detail');
  };

  const handleOpenInAR = (equipment: Equipment) => {
    setDemoEquipmentToSimulate(equipment);
    setCurrentScreen('scan');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-elevate-dark text-gray-100' : 'bg-gray-100 text-gray-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="bg-brand-600 text-elevate-dark px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Install LabLens for instant offline AR access in the laboratory</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallApp}
              className="bg-elevate-dark text-white px-3 py-1 rounded-lg text-xs font-extrabold hover:bg-black transition-colors"
            >
              Install App
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-elevate-dark hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Persistent Navigation Header */}
      <TopNav
        lang={lang}
        onToggleLang={() => setLang(prev => prev === 'en' ? 'hi' : 'en')}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenDemo={() => setIsDemoOpen(true)}
        onOpenChatbot={() => handleOpenChatbot()}
        onNavigate={(screen) => {
          if (screen === 'bookmarks') {
            setLibraryCategoryFilter('All');
            setCurrentScreen('library');
          } else {
            setCurrentScreen(screen);
          }
        }}
        currentScreen={currentScreen}
      />

      {/* Screen Router */}
      <main className="flex-1 relative">
        {currentScreen === 'home' && (
          <HomeScreen
            onStartScanning={() => {
              setDemoEquipmentToSimulate(null);
              setCurrentScreen('scan');
            }}
            onBrowseLibrary={(cat) => {
              if (cat) setLibraryCategoryFilter(cat);
              else setLibraryCategoryFilter('All');
              setCurrentScreen('library');
            }}
            onOpenDemo={() => setIsDemoOpen(true)}
            onOpenChatbot={() => handleOpenChatbot()}
            onSelectEquipment={handleOpenEquipmentDetail}
            allEquipment={allEquipment}
            lang={lang}
          />
        )}

        {currentScreen === 'scan' && (
          <ScanScreen
            onBack={() => {
              setDemoEquipmentToSimulate(null);
              setCurrentScreen('home');
            }}
            onOpenManualSearch={() => setCurrentScreen('library')}
            lang={lang}
            acknowledgedSafetyIds={acknowledgedSafetyIds}
            onAcknowledgeSafety={handleAcknowledgeSafety}
            demoEquipmentToSimulate={demoEquipmentToSimulate}
            onClearDemoSimulation={() => setDemoEquipmentToSimulate(null)}
            onOpenChatbot={handleOpenChatbot}
          />
        )}

        {currentScreen === 'library' && (
          <LibraryScreen
            allEquipment={allEquipment}
            onSelectEquipment={handleOpenEquipmentDetail}
            onSimulateInScan={handleOpenInAR}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            initialCategory={libraryCategoryFilter}
            lang={lang}
          />
        )}

        {currentScreen === 'detail' && selectedEquipment && (
          <EquipmentDetailScreen
            equipment={selectedEquipment}
            onBack={() => setCurrentScreen('library')}
            onOpenInAR={handleOpenInAR}
            isBookmarked={bookmarkedIds.has(selectedEquipment.id)}
            onToggleBookmark={handleToggleBookmark}
            acknowledgedSafetyIds={acknowledgedSafetyIds}
            onAcknowledgeSafety={handleAcknowledgeSafety}
            lang={lang}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            onSelectEquipmentById={async (id) => {
              const eq = allEquipment.find(e => e.id === id);
              if (eq) handleOpenEquipmentDetail(eq);
            }}
            onSimulateInAR={async (id) => {
              const eq = allEquipment.find(e => e.id === id);
              if (eq) handleOpenInAR(eq);
            }}
            lang={lang}
          />
        )}
      </main>

      {/* Floating LabLens AI Assistant Launcher (when chat is closed) */}
      {!isChatbotOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
          <button
            onClick={() => handleOpenChatbot()}
            className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-elevate-dark font-black text-xs shadow-2xl shadow-brand-500/40 border border-white/25 active:scale-95 transition-all"
            title="Ask LabLens AI Guide (DeepSeek Harness)"
          >
            <div className="w-5 h-5 rounded-lg bg-elevate-dark/90 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-brand-400 group-hover:rotate-12 transition-transform" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="font-extrabold tracking-tight">Ask Lab AI</span>
              <span className="text-[9px] font-semibold opacity-90 truncate max-w-[110px]">
                {chatActiveEquipment ? chatActiveEquipment.name : 'DeepSeek Guide'}
              </span>
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
            </span>
          </button>
        </div>
      )}

      {/* DeepSeek Harness AI Chatbot Modal */}
      <LabLensChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        activeEquipment={chatActiveEquipment || selectedEquipment || demoEquipmentToSimulate || null}
        onClearActiveEquipment={() => setChatActiveEquipment(null)}
        lang={lang}
        mode="modal"
      />

      {/* Global Modals */}
      <DemoModeModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onSelectInstrumentForDemo={handleSelectEquipmentForDemo}
        lang={lang}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        lang={lang}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onEquipmentUpdated={handleEquipmentUpdated}
        allEquipment={allEquipment}
        lang={lang}
      />
    </div>
  );
};

export default App;
