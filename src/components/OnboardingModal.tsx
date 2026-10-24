import React, { useState } from 'react';
import { 
  Camera, 
  ShieldAlert, 
  ListOrdered, 
  ChevronRight, 
  Check, 
  X, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'hi';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [slide, setSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "Point & Recognize Live in AR",
      hindiTitle: "कैमरा इंगित करें और लाइव पहचानें",
      description: "Point your phone's camera at any lab instrument. LabLens runs neural object detection directly on your device in real-time, even in offline labs with zero Wi-Fi signal.",
      icon: <Camera className="w-8 h-8 text-brand-400" />,
      accent: "from-brand-500/20 to-emerald-500/10 border-brand-500/30",
    },
    {
      title: "Safety First Protocol",
      hindiTitle: "सुरक्षा सर्वोपरि प्रोटोकॉल",
      description: "Before you touch anything, LabLens highlights high-voltage, thermal, or chemical hazards and required PPE. Operating steps stay locked until you confirm understanding.",
      icon: <ShieldAlert className="w-8 h-8 text-amber-400" />,
      accent: "from-amber-500/20 to-red-500/10 border-amber-500/30",
    },
    {
      title: "Step-by-Step Guided Walkthrough",
      hindiTitle: "चरण-दर-चरण निर्देशित निर्देश",
      description: "Never guess dial settings or probe jacks again. Follow interactive steps with voice narration in English or Hindi, verified by certified lab instructors.",
      icon: <ListOrdered className="w-8 h-8 text-cyan-400" />,
      accent: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30",
    },
  ];

  const current = slides[slide];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(prev => prev + 1);
    } else {
      localStorage.setItem('lablens_has_seen_onboarding', 'true');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-elevate-card border border-white/10 p-6 shadow-2xl overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Slide Indicator Dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === slide ? 'w-6 bg-brand-400' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Card Graphic */}
        <div className={`p-6 rounded-2xl bg-gradient-to-b ${current.accent} border mb-5 flex flex-col items-center text-center`}>
          <div className="w-16 h-16 rounded-2xl bg-elevate-dark/80 border border-white/10 flex items-center justify-center shadow-inner mb-3">
            {current.icon}
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white mb-2">
            {lang === 'hi' ? current.hindiTitle : current.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Next / Get Started Action */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-elevate-dark font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 active:scale-[0.98] transition-all"
        >
          <span>{slide === slides.length - 1 ? "Get Started with LabLens" : "Next"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
