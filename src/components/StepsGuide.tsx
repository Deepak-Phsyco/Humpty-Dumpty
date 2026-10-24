import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  Lock, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Equipment } from '../types/equipment';
import { speechService } from '../lib/speech';
import { TRANSLATIONS } from '../lib/translations';

interface StepsGuideProps {
  equipment: Equipment;
  isUnlocked: boolean;
  onGoToSafety: () => void;
  lang: 'en' | 'hi';
}

export const StepsGuide: React.FC<StepsGuideProps> = ({
  equipment,
  isUnlocked,
  onGoToSafety,
  lang,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const t = TRANSLATIONS[lang];

  const steps = (lang === 'hi' && equipment.operatingStepsHindi && equipment.operatingStepsHindi.length > 0)
    ? equipment.operatingStepsHindi
    : equipment.operatingSteps;

  const currentStep = steps[currentStepIndex] || '';

  const handleNext = () => {
    speechService.stop();
    setIsSpeaking(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handlePrev = () => {
    speechService.stop();
    setIsSpeaking(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setIsCompleted(false);
    }
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const stepText = `${t.stepPrefix} ${currentStepIndex + 1}: ${currentStep}`;
      setIsSpeaking(true);
      speechService.speak(stepText, lang, () => setIsSpeaking(false));
    }
  };

  // If user hasn't accepted safety precautions yet:
  if (!isUnlocked) {
    return (
      <div className="rounded-2xl bg-elevate-card/90 border border-white/10 p-6 text-center backdrop-blur-xl">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-amber-400" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">Steps are Locked for Safety</h4>
        <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
          Institutional protocol requires you to review and acknowledge hazards and required PPE before operating this instrument.
        </p>
        <button
          onClick={onGoToSafety}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-elevate-dark font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20"
        >
          Review Safety Precautions First
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-elevate-card/95 border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-1.5">
        <div 
          className="bg-gradient-to-r from-brand-600 to-emerald-400 h-1.5 transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="p-4 sm:p-5">
        {/* Step Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/30">
              {t.stepPrefix} {currentStepIndex + 1} / {steps.length}
            </span>
            <span className="text-xs text-gray-400 hidden xs:inline">Interactive Guide</span>
          </div>

          <button
            onClick={handleToggleSpeech}
            className={`p-2 rounded-xl border transition-colors ${
              isSpeaking
                ? 'bg-brand-500 text-black border-brand-400 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title={isSpeaking ? t.stopAudio : t.readAloud}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-brand-400" />}
          </button>
        </div>

        {/* Active Step Content */}
        {!isCompleted ? (
          <div className="my-4 p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-brand-500/20 min-h-[110px] flex items-center shadow-inner">
            <p className="text-sm sm:text-base text-gray-100 font-medium leading-relaxed">
              {currentStep}
            </p>
          </div>
        ) : (
          <div className="my-4 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Operating Sequence Completed!</h4>
            <p className="text-xs text-gray-300">
              Great job! You have safely executed all operating steps for this instrument.
            </p>
          </div>
        )}

        {/* Step Breadcrumb Indicators */}
        <div className="flex items-center justify-center gap-1.5 my-3">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                speechService.stop();
                setIsSpeaking(false);
                setCurrentStepIndex(idx);
                setIsCompleted(false);
              }}
              className={`h-2 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-6 bg-brand-400'
                  : idx < currentStepIndex
                  ? 'w-2 bg-emerald-500/60'
                  : 'w-2 bg-white/20'
              }`}
              title={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all ${
              currentStepIndex === 0
                ? 'opacity-40 cursor-not-allowed border-white/5 text-gray-500'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t.prevStep}</span>
          </button>

          {!isCompleted ? (
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-elevate-dark flex items-center justify-center gap-1.5 text-xs font-extrabold shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              <span>{currentStepIndex === steps.length - 1 ? t.finishSteps : t.nextStep}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsCompleted(false);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Repeat Steps</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
