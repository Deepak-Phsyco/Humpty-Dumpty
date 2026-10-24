import React, { useEffect, useState } from 'react';
import { 
  History, 
  Trash2, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Bookmark,
  Camera
} from 'lucide-react';
import { db } from '../lib/db';
import { ScanRecord, Equipment } from '../types/equipment';
import { TRANSLATIONS } from '../lib/translations';

interface HistoryScreenProps {
  onSelectEquipmentById: (id: string) => void;
  onSimulateInAR: (id: string) => void;
  lang: 'en' | 'hi';
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onSelectEquipmentById,
  onSimulateInAR,
  lang,
}) => {
  const [historyItems, setHistoryItems] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  const loadHistory = async () => {
    try {
      const records = await db.history.reverse().toArray();
      setHistoryItems(records);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    if (confirm('Clear all local scan logs?')) {
      await db.history.clear();
      setHistoryItems([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-400" />
            <span>{t.history}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Automatic log of your last 20 verified instrument scans
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500">Loading scan logs...</div>
      ) : historyItems.length === 0 ? (
        <div className="text-center py-16 bg-elevate-card/40 rounded-3xl border border-white/5 space-y-2">
          <Clock className="w-10 h-10 text-gray-600 mx-auto" />
          <p className="text-sm font-semibold text-gray-300">No scans recorded yet</p>
          <p className="text-xs text-gray-500">Point your camera at a lab instrument to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {historyItems.map((record) => (
            <div
              key={record.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-elevate-card border border-white/5 hover:border-brand-500/30 flex items-center justify-between gap-3 transition-all"
            >
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white truncate">
                    {record.equipmentName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {record.confidence}% match
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                  <span>{record.category}</span>
                  <span>•</span>
                  <span>{new Date(record.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSimulateInAR(record.equipmentId)}
                  className="p-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 text-xs"
                  title="Re-open in AR Scan"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSelectEquipmentById(record.equipmentId)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
