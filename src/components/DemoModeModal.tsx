import React, { useState } from 'react';
import { 
  Play, 
  X, 
  Check, 
  Sparkles, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Gauge, 
  Flame, 
  Search
} from 'lucide-react';
import { Equipment } from '../types/equipment';
import initialEquipmentData from '../data/equipment.json';
import { TRANSLATIONS } from '../lib/translations';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInstrumentForDemo: (equipment: Equipment) => void;
  lang: 'en' | 'hi';
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  isOpen,
  onClose,
  onSelectInstrumentForDemo,
  lang,
}) => {
  const [selectedId, setSelectedId] = useState<string>('digital-multimeter');
  const [searchQuery, setSearchQuery] = useState('');
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const equipmentList = initialEquipmentData as unknown as Equipment[];
  const filteredList = equipmentList.filter(eq =>
    eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedEquipment = equipmentList.find(e => e.id === selectedId) || equipmentList[0];

  const handleLaunch = () => {
    onSelectInstrumentForDemo(selectedEquipment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-elevate-card border border-brand-500/30 p-5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Judge Demo Mode</h3>
              <p className="text-xs text-gray-400">Simulate AR detection without physical lab equipment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Selector */}
        <div className="py-3 space-y-3 flex-1 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter demo instruments..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredList.map((eq) => {
              const isSelected = eq.id === selectedId;
              return (
                <button
                  key={eq.id}
                  onClick={() => setSelectedId(eq.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-brand-500/20 border-brand-400 shadow-md text-white'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">
                      {lang === 'hi' && eq.hindiName ? eq.hindiName : eq.name}
                    </div>
                    <div className="text-[10px] text-gray-400">{eq.category}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Selected Instrument Preview Card */}
          {selectedEquipment && (
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span>SIMULATION TARGET:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  selectedEquipment.hazardLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                  selectedEquipment.hazardLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  Hazard: {selectedEquipment.hazardLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                {selectedEquipment.safetyPrecautions[0]}
              </p>
              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                <span>PPE: {selectedEquipment.requiredPPE.slice(0, 2).join(', ')}</span>
                <span>•</span>
                <span>{selectedEquipment.operatingSteps.length} operating steps</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Launch Button */}
        <div className="pt-3 border-t border-white/10">
          <button
            onClick={handleLaunch}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-elevate-dark font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 active:scale-[0.98] transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Live AR Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
