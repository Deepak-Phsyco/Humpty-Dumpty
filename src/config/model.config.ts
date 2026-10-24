import { ModelConfig } from '../types/equipment';

/**
 * ============================================================================
 * LABLENS MODEL CONFIGURATION
 * ============================================================================
 * You can switch between:
 * 1) 'coco-ssd': Standard on-device COCO-SSD object detector mapped to lab instruments.
 * 2) 'teachable-machine': Custom image classifier trained on Google Teachable Machine.
 *    Simply paste your exported Teachable Machine model URL below!
 * 3) 'custom-tflite': Converted TF.js model files hosted locally or on CDN.
 * ============================================================================
 */
export const MODEL_CONFIG: ModelConfig = {
  // Switch to 'teachable-machine' when you export a custom model from https://teachablemachine.withgoogle.com/
  modelType: 'coco-ssd',

  // Google Teachable Machine model URL (model.json + metadata.json)
  // Example: "https://teachablemachine.withgoogle.com/models/xyz123abc/"
  modelUrl: '',

  // Minimum confidence to lock in an AR guide (60% as required by prompt)
  confidenceThreshold: 0.60,

  // Run detection 6-8 times per second (approx 130ms between frames) without freezing UI
  detectionIntervalMs: 130,

  // Object must remain stably detected for ~1 second (1000ms) before full AR guide triggers
  lockStabilityDurationMs: 1000,

  /**
   * MAP DETECTION CLASS LABELS TO EQUIPMENT DATABASE IDs
   * Whenever the vision model outputs a label, LabLens queries this dictionary
   * to fetch the matching specifications, safety protocols, and steps.
   */
  classToEquipmentMap: {
    // Electronics & Tools
    'cell phone': 'digital-multimeter',
    'remote': 'digital-multimeter',
    'mouse': 'vernier-caliper',
    'keyboard': 'breadboard',
    'laptop': 'oscilloscope',
    'tv': 'oscilloscope',
    'microwave': 'dc-power-supply',
    'toaster': 'soldering-iron',
    'hair drier': 'soldering-iron',
    'clock': 'stopwatch-tachometer',

    // Mechanical & Chemistry
    'bottle': 'beaker-measuring-cylinder',
    'cup': 'beaker-measuring-cylinder',
    'wine glass': 'beaker-measuring-cylinder',
    'vase': 'bunsen-burner',
    'scissors': 'vernier-caliper',
    'knife': 'micrometer-screw-gauge',
    'book': 'arduino-uno',

    // Robotics & Safety
    'toothbrush': 'micrometer-screw-gauge',
    'eye glasses': 'safety-goggles-lab-coat',
    'sunglasses': 'safety-goggles-lab-coat',
    'backpack': 'safety-goggles-lab-coat',

    // Direct custom class names (for custom Teachable Machine models)
    'digital multimeter': 'digital-multimeter',
    'vernier caliper': 'vernier-caliper',
    'micrometer screw gauge': 'micrometer-screw-gauge',
    'oscilloscope': 'oscilloscope',
    'function generator': 'function-generator',
    'dc power supply': 'dc-power-supply',
    'breadboard': 'breadboard',
    'soldering iron': 'soldering-iron',
    'arduino uno': 'arduino-uno',
    'raspberry pi': 'raspberry-pi',
    'bunsen burner': 'bunsen-burner',
    'beaker': 'beaker-measuring-cylinder',
    'measuring cylinder': 'beaker-measuring-cylinder',
    'digital balance': 'digital-weighing-balance',
    'tachometer': 'stopwatch-tachometer',
    'safety goggles': 'safety-goggles-lab-coat',
  }
};
