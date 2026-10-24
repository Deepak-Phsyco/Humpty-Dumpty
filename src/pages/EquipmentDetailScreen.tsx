import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Bookmark, 
  Sparkles, 
  ShieldAlert, 
  ListOrdered, 
  Sliders, 
  Info, 
  Camera,
  ExternalLink,
  Award,
  CheckCircle
} from 'lucide-react';
import { Equipment } from '../types/equipment';
import { SafetyCard } from '../components/SafetyCard';
import { StepsGuide } from '../components/StepsGuide';
import { SpecsView, MoreInfoView } from '../components/SpecsView';
import { TRANSLATIONS } from '../lib/translations';

interface EquipmentDetailScreenProps {
  equipment: Equipment;
  onBack: () => void;
  onOpenInAR: (equipment: Equipment) => void;
  isBookmarked: boolean;
  onToggleBookmark: (equipmentId: string) => void;
  acknowledgedSafetyIds: Set<string>;
  onAcknowledgeSafety: (equipmentId: string) => void;
  lang: 'en' | 'hi';
}

export const EquipmentDetailScreen: React.FC<EquipmentDetailScreenProps> = ({
  equipment,
  onBack,
  onOpenInAR,
  isBookmarked,
  onToggleBookmark,
  acknowledgedSafetyIds,
  onAcknowledgeSafety,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'safety' | 'steps' | 'specs' | 'more'>('safety');
  const t = TRANSLATIONS[lang];

  const isSafetyAcknowledged = acknowledgedSafetyIds.has(equipment.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          {/* AR Scan Launch Button */}
          <button
            onClick={() => onOpenInAR(equipment)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-xs font-bold transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open in AR</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(equipment.id)}
            className={`p-2 rounded-xl border transition-colors ${
              isBookmarked
                ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for offline study'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Equipment Header Card */}
      <div className="rounded-3xl bg-elevate-card border border-white/10 p-5 sm:p-6 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {lang === 'hi' && equipment.hindiName ? equipment.hindiName : equipment.name}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Category: <strong className="text-brand-300">{equipment.category}</strong>
            </p>
          </div>

          {equipment.staffReviewed && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/30 text-xs font-semibold">
              <Award className="w-4 h-4 text-brand-400" />
              <span>Verified by {equipment.reviewerName || 'Staff'}</span>
            </div>
          )}
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 pt-2">
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
      </div>

      {/* Tab Panels */}
      <div>
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
  );
};
