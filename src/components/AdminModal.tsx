import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  Lock, 
  KeyRound,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Equipment, HazardLevel } from '../types/equipment';
import { db } from '../lib/db';
import { TRANSLATIONS } from '../lib/translations';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipmentUpdated: () => void;
  allEquipment: Equipment[];
  lang: 'en' | 'hi';
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onEquipmentUpdated,
  allEquipment,
  lang,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Equipment Form State
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formHindiName, setFormHindiName] = useState('');
  const [formCategory, setFormCategory] = useState<'Measurement' | 'Electronics' | 'Mechanical' | 'Robotics' | 'Safety Gear'>('Electronics');
  const [formHazardLevel, setFormHazardLevel] = useState<HazardLevel>('medium');
  const [formStaffReviewed, setFormStaffReviewed] = useState(true);
  const [formReviewerName, setFormReviewerName] = useState('Prof. A. K. Sen');
  const [formSpecs, setFormSpecs] = useState('Operating Range: 0-50V\nAccuracy: ±1%\nPower: 60W');
  const [formPrecautions, setFormPrecautions] = useState('Wear safety goggles at all times.\nInspect electrical cords before powering up.');
  const [formPPE, setFormPPE] = useState('Safety Goggles, Lab Coat');
  const [formSteps, setFormSteps] = useState('Inspect device casing.\nPlug in safety power cord.\nAdjust control dial to target setting.\nRecord reading.');
  const [formMistakes, setFormMistakes] = useState('Operating without ground wire.\nTouching hot elements.');

  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default demo passwords for judges / staff
    if (passwordInput === 'elevate2026' || passwordInput === 'admin123' || passwordInput === 'admin') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid password. Demo password is: elevate2026');
    }
  };

  /**
   * ============================================================================
   * HOW TO ADD A NEW INSTRUMENT IN UNDER 2 MINUTES:
   * 1. Fill in ID (lowercase-hyphenated, e.g. "spectrophotometer")
   * 2. Fill in Name, Category, and Hazard level
   * 3. Paste Specs (key: value format) and Steps (one per line)
   * 4. Check "Staff-Reviewed", enter your name, and click "Save to Database"
   * ============================================================================
   */
  const handleSaveNewInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId || !formName) return;

    // Parse specs from multiline text
    const specsMap: Record<string, string> = {};
    formSpecs.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        specsMap[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });

    const newEquipment: Equipment = {
      id: formId.trim().toLowerCase().replace(/\s+/g, '-'),
      name: formName.trim(),
      hindiName: formHindiName.trim() || undefined,
      category: formCategory,
      aliases: [formName.trim()],
      hazardLevel: formHazardLevel,
      staffReviewed: formStaffReviewed,
      reviewerName: formStaffReviewed ? formReviewerName : undefined,
      reviewDate: new Date().toISOString().split('T')[0],
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      manualLink: 'https://en.wikipedia.org/wiki/Laboratory_equipment',
      specs: Object.keys(specsMap).length > 0 ? specsMap : { "Standard": "Laboratory Grade" },
      safetyPrecautions: formPrecautions.split('\n').filter(Boolean),
      requiredPPE: formPPE.split(',').map(s => s.trim()).filter(Boolean),
      operatingSteps: formSteps.split('\n').filter(Boolean),
      commonMistakes: formMistakes.split('\n').filter(Boolean),
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    try {
      await db.equipment.put(newEquipment);
      onEquipmentUpdated();
      setShowAddForm(false);
      // Reset form
      setFormId('');
      setFormName('');
      setFormHindiName('');
    } catch (err) {
      console.error('Failed to add equipment:', err);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (confirm(`Are you sure you want to delete instrument "${id}"?`)) {
      await db.equipment.delete(id);
      onEquipmentUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-elevate-card border border-brand-500/30 p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Staff & Instructor Portal</h3>
              <p className="text-xs text-gray-400">Institutional review, equipment registry & safety compliance</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="py-8 px-4 flex flex-col items-center max-w-sm mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-brand-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Instructor Authentication</h4>
            <p className="text-xs text-gray-400 mb-4">
              Enter staff authorization password. For hackathon judges: <code className="text-brand-300 font-mono">elevate2026</code>
            </p>

            <div className="w-full space-y-3">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-400 text-center tracking-widest"
                autoFocus
              />

              {authError && (
                <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-400 hover:from-brand-500 hover:to-emerald-300 text-elevate-dark font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20 transition-all"
              >
                Access Portal
              </button>
            </div>
          </form>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="py-3 space-y-4 flex-1 overflow-y-auto">
            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-gray-300">
                Total Registered Instruments: <strong className="text-white">{allEquipment.length}</strong>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="py-1.5 px-3 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Cancel' : 'Add New Instrument'}</span>
              </button>
            </div>

            {/* Quick 2-Minute Adding Guide Notice */}
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Staff review takes &lt; 2 minutes. Entries saved here immediately update the offline IndexedDB cache.
              </span>
            </div>

            {/* Add Instrument Form */}
            {showAddForm && (
              <form onSubmit={handleSaveNewInstrument} className="p-4 rounded-2xl bg-black/40 border border-brand-500/30 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-brand-300">New Equipment Profile</h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Equipment ID (hyphenated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. spectrophotometer"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Display Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UV-Vis Spectrophotometer"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Hindi Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. स्पेक्ट्रोफोटोमीटर"
                      value={formHindiName}
                      onChange={(e) => setFormHindiName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg bg-elevate-card border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
                    >
                      <option value="Measurement">Measurement</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Robotics">Robotics</option>
                      <option value="Safety Gear">Safety Gear</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Hazard Level</label>
                    <select
                      value={formHazardLevel}
                      onChange={(e) => setFormHazardLevel(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-lg bg-elevate-card border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
                    >
                      <option value="low">Low Risk</option>
                      <option value="medium">Medium Caution</option>
                      <option value="high">High Danger</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Required PPE (comma separated)</label>
                    <input
                      type="text"
                      value={formPPE}
                      onChange={(e) => setFormPPE(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Specs (key: value per line)</label>
                  <textarea
                    rows={2}
                    value={formSpecs}
                    onChange={(e) => setFormSpecs(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Operating Steps (one per line)</label>
                  <textarea
                    rows={3}
                    value={formSteps}
                    onChange={(e) => setFormSteps(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-brand-400"
                  />
                </div>

                {/* Staff Review Checkbox */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={formStaffReviewed}
                      onChange={(e) => setFormStaffReviewed(e.target.checked)}
                      className="rounded text-brand-500 focus:ring-0"
                    />
                    <span className="font-semibold">Mark as "Staff-Reviewed"</span>
                  </label>

                  {formStaffReviewed && (
                    <input
                      type="text"
                      placeholder="Reviewer Name"
                      value={formReviewerName}
                      onChange={(e) => setFormReviewerName(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs text-brand-300"
                    />
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-400 text-elevate-dark font-extrabold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Save to IndexedDB Database
                </button>
              </form>
            )}

            {/* List of Existing Equipment with Review Badges */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Database Records</h5>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {allEquipment.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="truncate">
                      <div className="font-bold text-white flex items-center gap-2 truncate">
                        <span>{eq.name}</span>
                        {eq.staffReviewed && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3 text-brand-400" />
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {eq.category} • Hazard: {eq.hazardLevel} • {eq.reviewerName || 'Unassigned'}
                      </div>
                    </div>

                    {eq.isCustom && (
                      <button
                        onClick={() => handleDeleteEquipment(eq.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors shrink-0"
                        title="Delete custom instrument"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
