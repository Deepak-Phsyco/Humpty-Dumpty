import React from 'react';
import { HelpCircle, ChevronRight, Zap } from 'lucide-react';
import { Equipment } from '../types/equipment';
import { TRANSLATIONS } from '../lib/translations';

interface LowConfidencePickerProps {
  candidates: Array<{ equipment: Equipment; confidence: number }>;
  onSelectCandidate: (equipment: Equipment) => void;
  lang: 'en' | 'hi';
}

export const LowConfidencePicker: React.FC<LowConfidencePickerProps> = ({
  candidates,
  onSelectCandidate,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  if (candidates.length === 0) return null;

  return (
    <div className="absolute inset-x-3 bottom-24 z-30 pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-md mx-auto rounded-2xl bg-elevate-card/95 border border-amber-500/40 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-2.5 mb-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-200">
              {t.lowConfidenceTitle}
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t.topMatchesPrompt}
            </p>
          </div>
        </div>

        {/* Top 3 Candidate Match Buttons */}
        <div className="space-y-1.5 mt-2">
          {candidates.slice(0, 3).map(({ equipment, confidence }, idx) => (
            <button
              key={equipment.id || idx}
              onClick={() => onSelectCandidate(equipment)}
              className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-brand-500/20 border border-white/10 hover:border-brand-500/40 flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 rounded-full bg-white/10 text-gray-300 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                    {lang === 'hi' && equipment.hindiName ? equipment.hindiName : equipment.name}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1.5">
                    <span>{equipment.category}</span>
                    <span>•</span>
                    <span className="text-amber-400 font-mono">
                      Match ~{Math.round(confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-brand-400 shrink-0">
                <span className="text-[11px] font-bold hidden sm:inline">Confirm</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
