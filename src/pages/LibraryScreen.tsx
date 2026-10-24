import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Bookmark, 
  ArrowRight, 
  Sliders, 
  ShieldAlert, 
  Flame, 
  Zap,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Equipment, HazardLevel } from '../types/equipment';
import { toggleBookmark } from '../lib/db';
import { TRANSLATIONS } from '../lib/translations';

interface LibraryScreenProps {
  allEquipment: Equipment[];
  onSelectEquipment: (equipment: Equipment) => void;
  onSimulateInScan: (equipment: Equipment) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (equipmentId: string) => void;
  initialCategory?: string;
  lang: 'en' | 'hi';
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  allEquipment,
  onSelectEquipment,
  onSimulateInScan,
  bookmarkedIds,
  onToggleBookmark,
  initialCategory = 'All',
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const t = TRANSLATIONS[lang];

  const categories = ['All', 'Measurement', 'Electronics', 'Mechanical', 'Robotics', 'Safety Gear'];

  const filteredEquipment = allEquipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.hindiName && item.hindiName.includes(searchQuery)) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      Object.entries(item.specs).some(([k, v]) => 
        k.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesHazard = selectedHazard === 'all' || item.hazardLevel === selectedHazard;

    return matchesSearch && matchesCategory && matchesHazard;
  });

  const getHazardBadge = (level: HazardLevel) => {
    switch (level) {
      case 'high':
        return {
          bg: 'bg-red-500/15 border-red-500/30 text-red-400',
          icon: <Flame className="w-3.5 h-3.5" />,
          label: t.hazardLevels.high,
        };
      case 'medium':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          icon: <Zap className="w-3.5 h-3.5" />,
          label: t.hazardLevels.medium,
        };
      case 'low':
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: t.hazardLevels.low,
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Equipment Knowledge Library
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Complete offline index of certified specifications, safe operational procedures, and hazard protocols.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-elevate-card border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-400 shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-500 text-elevate-dark shadow-md shadow-brand-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
            }`}
          >
            {cat === 'All' ? t.allCategories : t.categories[cat as keyof typeof t.categories] || cat}
          </button>
        ))}
      </div>

      {/* Instruments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item) => {
          const badge = getHazardBadge(item.hazardLevel);
          const isFav = bookmarkedIds.has(item.id);

          return (
            <div
              key={item.id}
              className="rounded-2xl bg-elevate-card border border-white/10 hover:border-brand-500/40 p-4 sm:p-5 flex flex-col justify-between transition-all group hover:shadow-xl hover:shadow-brand-500/5"
            >
              <div>
                {/* Header row: Name + Bookmark */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="truncate">
                    <h3 className="font-extrabold text-base text-white group-hover:text-brand-300 transition-colors truncate">
                      {lang === 'hi' && item.hindiName ? item.hindiName : item.name}
                    </h3>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.operatingSteps.length} Steps</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleBookmark(item.id)}
                    className={`p-2 rounded-xl border transition-colors shrink-0 ${
                      isFav
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 border-white/5'
                    }`}
                    title={isFav ? 'Remove bookmark' : 'Bookmark for quick study'}
                  >
                    <Bookmark className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Badges: Staff Reviewed & Hazard */}
                <div className="flex flex-wrap items-center gap-2 my-2.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                    {badge.icon}
                    {badge.label}
                  </span>

                  {item.staffReviewed && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/30">
                      <CheckCircle className="w-3 h-3 text-brand-400" />
                      Staff Reviewed
                    </span>
                  )}
                </div>

                {/* Safety Snippet Preview */}
                <p className="text-xs text-gray-300 line-clamp-2 my-3 bg-black/20 p-2.5 rounded-xl border border-white/5">
                  ⚠️ {item.safetyPrecautions[0]}
                </p>

                {/* Specs Snippet */}
                <div className="space-y-1 my-3 text-[11px]">
                  {Object.entries(item.specs).slice(0, 2).map(([key, val], i) => (
                    <div key={i} className="flex items-center justify-between text-gray-400">
                      <span className="truncate pr-2">{key}:</span>
                      <span className="font-medium text-gray-200 shrink-0">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={() => onSelectEquipment(item)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Study Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onSimulateInScan(item)}
                  className="py-2 px-3 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/40 text-brand-300 text-xs font-bold transition-colors whitespace-nowrap"
                  title="Test in live AR scanner"
                >
                  AR Scan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-16 bg-elevate-card/40 rounded-3xl border border-white/5">
          <p className="text-sm font-semibold text-gray-300">No lab instruments matched "{searchQuery}"</p>
          <p className="text-xs text-gray-500 mt-1">Try another keyword or reset the category filter.</p>
        </div>
      )}
    </div>
  );
};
