import React, { useEffect, useState } from 'react';
import { 
  Scan, 
  Wifi, 
  WifiOff, 
  Languages, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Bookmark, 
  History, 
  HelpCircle,
  PlayCircle
} from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';

interface TopNavProps {
  lang: 'en' | 'hi';
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAdmin: () => void;
  onOpenOnboarding: () => void;
  onOpenDemo: () => void;
  onNavigate: (screen: 'home' | 'scan' | 'library' | 'history' | 'bookmarks') => void;
  currentScreen: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  lang,
  onToggleLang,
  darkMode,
  onToggleDarkMode,
  onOpenAdmin,
  onOpenOnboarding,
  onOpenDemo,
  onNavigate,
  currentScreen,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-elevate-dark/90 border-b border-white/10 px-3 py-2.5 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <button 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-elevate-dark rounded-[10px] flex items-center justify-center">
              <Scan className="w-5 h-5 text-brand-400 group-hover:rotate-45 transition-transform" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center">
                Lab<span className="text-brand-400">Lens</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                AR
              </span>
            </div>
            <span className="text-[10px] text-gray-400 hidden sm:block">Tech Elevate 2026 • Humpty Dumpty</span>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Online/Offline Status Indicator */}
          <div 
            className={`hidden xs:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              isOnline 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
            }`}
            title={isOnline ? 'Online mode - live sync enabled' : 'Offline mode - PWA cached database active'}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-[11px] font-medium">{isOnline ? t.online : t.offline}</span>
          </div>

          {/* Demo Mode Button */}
          <button
            onClick={onOpenDemo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors shadow-sm"
            title="Try with simulated instruments without camera"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Demo</span>
          </button>

          {/* Language Toggle (EN / HI) */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold transition-colors"
            title="Toggle English / Hindi"
          >
            <Languages className="w-3.5 h-3.5 text-brand-400" />
            <span>{lang === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Dark / Light Mode */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-gray-300" />}
          </button>

          {/* Scan History */}
          <button
            onClick={() => onNavigate('history')}
            className={`p-2 rounded-lg border transition-colors ${
              currentScreen === 'history'
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title="Scan history (last 20 scans)"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Bookmarks */}
          <button
            onClick={() => onNavigate('bookmarks')}
            className={`p-2 rounded-lg border transition-colors ${
              currentScreen === 'bookmarks'
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title="Saved equipment"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Admin Portal */}
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
            title="Instructor & Admin Portal"
          >
            <ShieldCheck className="w-4 h-4 text-brand-400" />
          </button>

          {/* How It Works Help */}
          <button
            onClick={onOpenOnboarding}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors"
            title="How LabLens works"
          >
            <HelpCircle className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
