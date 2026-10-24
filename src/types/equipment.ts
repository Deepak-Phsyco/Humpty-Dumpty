export type HazardLevel = 'low' | 'medium' | 'high';

export interface Equipment {
  id: string;
  name: string;
  hindiName?: string;
  category: 'Measurement' | 'Electronics' | 'Mechanical' | 'Robotics' | 'Safety Gear';
  aliases: string[];
  hazardLevel: HazardLevel;
  staffReviewed: boolean;
  reviewerName?: string;
  reviewDate?: string;
  imageUrl: string;
  manualLink: string;
  specs: Record<string, string>;
  safetyPrecautions: string[];
  safetyPrecautionsHindi?: string[];
  requiredPPE: string[];
  operatingSteps: string[];
  operatingStepsHindi?: string[];
  commonMistakes: string[];
  isCustom?: boolean;
  createdAt?: string;
}

export interface ScanRecord {
  id?: number;
  equipmentId: string;
  equipmentName: string;
  category: string;
  timestamp: string;
  confidence: number;
  hazardLevel: HazardLevel;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionPrediction {
  equipmentId: string;
  displayName: string;
  category: string;
  confidence: number;
  bbox: BoundingBox;
  rawClass: string;
}

export interface ModelConfig {
  modelType: 'coco-ssd' | 'teachable-machine' | 'custom-tflite';
  modelUrl?: string;
  confidenceThreshold: number; // e.g. 0.60 (60%)
  detectionIntervalMs: number; // throttled 5-10 fps (e.g. 120ms)
  lockStabilityDurationMs: number; // e.g. 1000ms
  classToEquipmentMap: Record<string, string>;
}
