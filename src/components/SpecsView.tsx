import React from 'react';
import { 
  CheckCircle, 
  ExternalLink, 
  Sliders, 
  AlertCircle, 
  Award,
  Layers,
  FileText
} from 'lucide-react';
import { Equipment } from '../types/equipment';
import { TRANSLATIONS } from '../lib/translations';

interface SpecsViewProps {
  equipment: Equipment;
  lang: 'en' | 'hi';
}

export const SpecsView: React.FC<SpecsViewProps> = ({ equipment, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="rounded-2xl bg-elevate-card/95 border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Staff Reviewed Badge */}
      {equipment.staffReviewed && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-xs">
          <Award className="w-5 h-5 text-brand-400 shrink-0" />
          <div>
            <div className="font-bold text-brand-300 flex items-center gap-1">
              <span>{t.staffReviewed}</span>
              <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
            </div>
            <p className="text-gray-400 text-[11px]">
              {t.verifiedBy} {equipment.reviewerName || 'Senior Lab Staff'} ({equipment.reviewDate || '2026'})
            </p>
          </div>
        </div>
      )}

      {/* Specifications Table */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 mb-3">
          <Sliders className="w-4 h-4 text-brand-400" />
          <span>TECHNICAL SPECIFICATIONS & RATINGS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(equipment.specs).map(([specKey, specVal], idx) => (
            <div 
              key={idx} 
              className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between"
            >
              <span className="text-[11px] text-gray-400 font-medium">{specKey}</span>
              <span className="text-xs sm:text-sm font-semibold text-white mt-1">{specVal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aliases & Category */}
      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Layers className="w-3.5 h-3.5 text-brand-400" />
          <span>Category: <strong className="text-gray-200">{equipment.category}</strong></span>
        </div>
        <div className="flex flex-wrap gap-1">
          {equipment.aliases.map((alias, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">
              {alias}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MoreInfoView: React.FC<SpecsViewProps> = ({ equipment, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="rounded-2xl bg-elevate-card/95 border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Common Mistakes */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>{t.commonMistakes}</span>
        </div>

        <div className="space-y-2">
          {equipment.commonMistakes.map((mistake, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-100 flex items-start gap-2.5"
            >
              <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                !
              </span>
              <span className="leading-relaxed">{mistake}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Official Manual Link */}
      <div className="pt-2 border-t border-white/10">
        <a
          href={equipment.manualLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-between text-xs font-semibold group transition-all"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-400 group-hover:scale-110 transition-transform" />
            <span>Open Manufacturer Specification & Operating Manual</span>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </a>
      </div>
    </div>
  );
};
