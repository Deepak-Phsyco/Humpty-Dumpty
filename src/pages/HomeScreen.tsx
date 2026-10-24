import React from 'react';
import { 
  Camera, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Cpu, 
  Compass, 
  Search,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { Equipment } from '../types/equipment';
import { TRANSLATIONS } from '../lib/translations';

interface HomeScreenProps {
  onStartScanning: () => void;
  onBrowseLibrary: (categoryFilter?: string) => void;
  onOpenDemo: () => void;
  onSelectEquipment: (equipment: Equipment) => void;
  allEquipment: Equipment[];
  lang: 'en' | 'hi';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartScanning,
  onBrowseLibrary,
  onOpenDemo,
  onSelectEquipment,
  allEquipment,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  const categories: Array<{ id: 'Measurement' | 'Electronics' | 'Mechanical' | 'Robotics' | 'Safety Gear'; icon: string; count: number }> = [
    { id: 'Measurement', icon: '📐', count: allEquipment.filter(e => e.category === 'Measurement').length },
    { id: 'Electronics', icon: '⚡', count: allEquipment.filter(e => e.category === 'Electronics').length },
    { id: 'Mechanical', icon: '⚙️', count: allEquipment.filter(e => e.category === 'Mechanical').length },
    { id: 'Robotics', icon: '🤖', count: allEquipment.filter(e => e.category === 'Robotics').length },
    { id: 'Safety Gear', icon: '🥽', count: allEquipment.filter(e => e.category === 'Safety Gear').length },
  ];

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col justify-between max-w-5xl mx-auto px-4 py-6 sm:py-10">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative text-center space-y-4 pt-2">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span>Tech Elevate 2026 • Team Humpty Dumpty (Mech-ARE)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Instant AR Guidance for <br className="hidden xs:inline" />
            <span className="bg-gradient-to-r from-brand-400 via-emerald-400 to-brand-300 bg-clip-text text-transparent">
              Every Lab Instrument
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-gray-300 leading-relaxed">
            Point your smartphone camera at any lab tool. LabLens detects it on-device, displays safety protocols first, and guides you through operating steps in real-time.
          </p>

          {/* Primary Action Buttons (Big Touch Targets min 48px) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              onClick={onStartScanning}
              className="w-full sm:w-auto flex-1 min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-elevate-dark font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-brand-500/25 active:scale-[0.98] transition-all"
            >
              <Camera className="w-5 h-5" />
              <span>{t.scanEquipment}</span>
            </button>

            <button
              onClick={() => onBrowseLibrary()}
              className="w-full sm:w-auto flex-1 min-h-[52px] py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <BookOpen className="w-4 h-4 text-brand-400" />
              <span>{t.browseLibrary}</span>
            </button>
          </div>

          {/* Demo Mode Quick Link */}
          <div className="pt-1">
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200 transition-colors bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20"
            >
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>Judges / No camera? Launch <strong>Demo Simulation Mode</strong></span>
            </button>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
            <span>Explore Instrument Categories</span>
            <button 
              onClick={() => onBrowseLibrary()}
              className="text-brand-400 hover:text-brand-300 flex items-center gap-1 lowercase font-normal"
            >
              <span>view all ({allEquipment.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onBrowseLibrary(cat.id)}
                className="p-3.5 rounded-2xl bg-elevate-card hover:bg-white/5 border border-white/10 hover:border-brand-500/40 text-left transition-all group flex flex-col justify-between"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-brand-300 transition-colors">
                    {t.categories[cat.id]}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {cat.count} verified tools
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Standard Lab Instruments */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Commonly Scanned Lab Instruments
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allEquipment.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectEquipment(item)}
                className="p-4 rounded-2xl bg-elevate-card border border-white/10 hover:border-brand-500/40 cursor-pointer group transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-bold text-sm text-white group-hover:text-brand-300 transition-colors truncate">
                    {lang === 'hi' && item.hindiName ? item.hindiName : item.name}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    item.hazardLevel === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    item.hazardLevel === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {item.hazardLevel.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                  {item.safetyPrecautions[0]}
                </p>

                <div className="flex items-center justify-between text-xs text-brand-400 font-semibold pt-2 border-t border-white/5">
                  <span className="text-[11px] text-gray-400">{item.operatingSteps.length} Guided Steps</span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Tagline matching prompt requirements */}
      <footer className="pt-10 pb-4 text-center border-t border-white/5 mt-8 space-y-1">
        <p className="text-xs font-bold tracking-widest uppercase text-brand-400">
          "{t.footerTagline}"
        </p>
        <p className="text-[11px] text-gray-500">
          Tech Elevate 2026 Hackathon • Team Humpty Dumpty (Mech-ARE)
        </p>
      </footer>
    </div>
  );
};
