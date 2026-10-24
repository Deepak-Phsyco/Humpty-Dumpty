import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Glasses,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import { Equipment, HazardLevel } from '../types/equipment';
import { speechService } from '../lib/speech';
import { TRANSLATIONS } from '../lib/translations';

interface SafetyCardProps {
  equipment: Equipment;
  isUnlocked: boolean;
  onAcknowledge: () => void;
  lang: 'en' | 'hi';
}

export const SafetyCard: React.FC<SafetyCardProps> = ({
  equipment,
  isUnlocked,
  onAcknowledge,
  lang,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const t = TRANSLATIONS[lang];

  const getHazardBadge = (level: HazardLevel) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-500/15 border-red-500/40 text-red-400',
          icon: <Flame className="w-4 h-4 text-red-400 animate-pulse" />,
          label: t.hazardLevels.high,
          bar: 'bg-red-500',
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          label: t.hazardLevels.medium,
          bar: 'bg-amber-500',
        };
      case 'low':
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: t.hazardLevels.low,
          bar: 'bg-emerald-500',
        };
    }
  };

  const badge = getHazardBadge(equipment.hazardLevel);
  const precautions = (lang === 'hi' && equipment.safetyPrecautionsHindi && equipment.safetyPrecautionsHindi.length > 0)
    ? equipment.safetyPrecautionsHindi
    : equipment.safetyPrecautions;

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const fullText = `Safety Precautions for ${lang === 'hi' && equipment.hindiName ? equipment.hindiName : equipment.name}. Required PPE: ${equipment.requiredPPE.join(', ')}. Precautions: ${precautions.join('. ')}`;
      setIsSpeaking(true);
      speechService.speak(fullText, lang, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="relative rounded-2xl bg-elevate-card/95 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Top Hazard Accent Bar */}
      <div className={`h-1.5 w-full ${badge.bar}`} />

      <div className="p-4 sm:p-5">
        {/* Header & Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${badge.bg}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-white">
                  {t.safetyFirstNotice}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{t.safetyFirstPrompt}</p>
            </div>
          </div>

          {/* Audio TTS Button */}
          <button
            onClick={handleToggleSpeech}
            className={`p-2.5 rounded-xl border transition-all ${
              isSpeaking
                ? 'bg-brand-500 text-black border-brand-400 shadow-lg shadow-brand-500/30 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title={isSpeaking ? t.stopAudio : t.readAloud}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-brand-400" />}
          </button>
        </div>

        {/* Required PPE Section */}
        <div className="mb-4 bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-2">
            <Glasses className="w-4 h-4 text-brand-400" />
            <span>MANDATORY PERSONAL PROTECTIVE EQUIPMENT (PPE)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {equipment.requiredPPE.map((ppe, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/30 text-xs font-medium"
              >
                <CheckCircle2 className="w-3 h-3 text-brand-400 shrink-0" />
                {ppe}
              </span>
            ))}
          </div>
        </div>

        {/* Safety Precautions List */}
        <div className="space-y-2.5 mb-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>CRITICAL SAFETY DIRECTIVES</span>
          </div>
          <ul className="space-y-2">
            {precautions.map((precaution, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-200 bg-black/20 p-2.5 rounded-xl border border-white/5"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{precaution}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button: "I Understand" */}
        {isUnlocked ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{t.unlockedSteps}</span>
          </div>
        ) : (
          <button
            onClick={() => {
              speechService.stop();
              setIsSpeaking(false);
              onAcknowledge();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-elevate-dark font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.iUnderstand}</span>
          </button>
        )}
      </div>
    </div>
  );
};
