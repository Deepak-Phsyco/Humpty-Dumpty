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
import { Download, Sparkles, X } from 'lucide-react';

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

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

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
