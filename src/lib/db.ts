import Dexie, { Table } from 'dexie';
import { Equipment, ScanRecord } from '../types/equipment';
import initialEquipmentData from '../data/equipment.json';

class LabLensDatabase extends Dexie {
  equipment!: Table<Equipment, string>;
  history!: Table<ScanRecord, number>;
  bookmarks!: Table<{ id?: number; equipmentId: string; savedAt: string }, number>;

  constructor() {
    super('LabLensDB');

    this.version(1).stores({
      equipment: 'id, name, category, hazardLevel, staffReviewed',
      history: '++id, equipmentId, timestamp, hazardLevel',
      bookmarks: '++id, equipmentId, savedAt'
    });
  }
}

export const db = new LabLensDatabase();

/**
 * Ensures the Dexie database is seeded with initial 15 items if empty
 */
export async function initEquipmentDatabase(): Promise<Equipment[]> {
  try {
    const count = await db.equipment.count();
    if (count === 0) {
      console.log('Seeding Dexie IndexedDB with 15 standard instruments...');
      await db.equipment.bulkAdd(initialEquipmentData as unknown as Equipment[]);
    }
    return await db.equipment.toArray();
  } catch (error) {
    console.error('Dexie DB initialization failed:', error);
    // Fallback to in-memory JSON data if IndexedDB fails in strict incognito mode
    return initialEquipmentData as unknown as Equipment[];
  }
}

/**
 * Fetch a single equipment item by ID or alias
 */
export async function getEquipmentById(id: string): Promise<Equipment | undefined> {
  try {
    const item = await db.equipment.get(id);
    if (item) return item;
    
    // Check aliases
    const all = await db.equipment.toArray();
    return all.find(e => 
      e.id.toLowerCase() === id.toLowerCase() ||
      e.aliases.some(a => a.toLowerCase() === id.toLowerCase()) ||
      e.name.toLowerCase() === id.toLowerCase()
    );
  } catch (e) {
    return (initialEquipmentData as unknown as Equipment[]).find(item => item.id === id);
  }
}

/**
 * Log a scan into the local scan history (keeps last 20 scans)
 */
export async function recordScan(equipment: Equipment, confidence: number): Promise<void> {
  try {
    const record: ScanRecord = {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      category: equipment.category,
      timestamp: new Date().toISOString(),
      confidence: Math.round(confidence * 100),
      hazardLevel: equipment.hazardLevel
    };

    await db.history.add(record);

    // Prune history to last 20 records
    const all = await db.history.orderBy('id').toArray();
    if (all.length > 20) {
      const excess = all.slice(0, all.length - 20);
      for (const item of excess) {
        if (item.id) await db.history.delete(item.id);
      }
    }
  } catch (err) {
    console.warn('Failed to record scan in history:', err);
  }
}

/**
 * Toggle bookmark/favorite for an instrument
 */
export async function toggleBookmark(equipmentId: string): Promise<boolean> {
  try {
    const existing = await db.bookmarks.where('equipmentId').equals(equipmentId).first();
    if (existing && existing.id) {
      await db.bookmarks.delete(existing.id);
      return false;
    } else {
      await db.bookmarks.add({ equipmentId, savedAt: new Date().toISOString() });
      return true;
    }
  } catch (err) {
    console.error('Bookmark error:', err);
    return false;
  }
}

/**
 * Check if an instrument is bookmarked
 */
export async function isBookmarked(equipmentId: string): Promise<boolean> {
  try {
    const match = await db.bookmarks.where('equipmentId').equals(equipmentId).first();
    return !!match;
  } catch {
    return false;
  }
}
