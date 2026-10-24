import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TrustedEquipment {
  id: string;
  name: string;
  hindiName?: string;
  category: string;
  aliases?: string[];
  hazardLevel: 'low' | 'medium' | 'high';
  staffReviewed?: boolean;
  reviewerName?: string;
  reviewDate?: string;
  imageUrl?: string;
  manualLink?: string;
  specs: Record<string, string>;
  safetyPrecautions: string[];
  requiredPPE: string[];
  operatingSteps: string[];
  commonMistakes: string[];
}

// Locate equipment.json from src/data/equipment.json
let equipmentDatabase: Map<string, TrustedEquipment> = new Map();

function loadEquipmentData(): Map<string, TrustedEquipment> {
  const map = new Map<string, TrustedEquipment>();
  const possiblePaths = [
    path.resolve(process.cwd(), 'src/data/equipment.json'),
    path.resolve(process.cwd(), '../src/data/equipment.json'),
    path.resolve(__dirname, '../../../src/data/equipment.json'),
    path.resolve(__dirname, '../../src/data/equipment.json'),
  ];

  let rawData = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        rawData = fs.readFileSync(p, 'utf-8');
        break;
      } catch {
        // try next path
      }
    }
  }

  if (rawData) {
    try {
      const items: TrustedEquipment[] = JSON.parse(rawData);
      for (const item of items) {
        if (item.id) {
          map.set(item.id.toLowerCase().trim(), item);
        }
      }
    } catch (err) {
      console.error('[TrustedEquipment] Error parsing equipment.json:', err);
    }
  }

  return map;
}

equipmentDatabase = loadEquipmentData();

export function getAllTrustedEquipment(): TrustedEquipment[] {
  if (equipmentDatabase.size === 0) {
    equipmentDatabase = loadEquipmentData();
  }
  return Array.from(equipmentDatabase.values());
}

export function getTrustedEquipment(id?: string): TrustedEquipment | undefined {
  if (!id) return undefined;
  if (equipmentDatabase.size === 0) {
    equipmentDatabase = loadEquipmentData();
  }
  return equipmentDatabase.get(id.toLowerCase().trim());
}

export function isValidEquipmentId(id?: string): boolean {
  if (!id) return false;
  if (equipmentDatabase.size === 0) {
    equipmentDatabase = loadEquipmentData();
  }
  return equipmentDatabase.has(id.toLowerCase().trim());
}

/**
 * Builds authoritative laboratory guidance context for DeepSeek Harness.
 * Follows LabLens pedagogical rules:
 * - Beginner friendly, clear explanations
 * - Safety precautions and PPE emphasized first
 * - Verified specs and operating steps
 * - Common student mistakes & troubleshooting
 * - Strict prohibition against hallucinating specs or safety hazards
 */
export function buildLabLensSystemPrompt(equipment?: TrustedEquipment): string {
  const baseRules = `You are LabLens AI Assistant, a specialized, beginner-friendly laboratory instructor and equipment expert powered by DeepSeek Harness.
Your mission is to guide engineering, science, and technical students to safely, accurately, and confidently understand and operate laboratory equipment.

CORE TEACHING & SAFETY PRINCIPLES:
1. SAFETY FIRST: Always highlight hazards, required Personal Protective Equipment (PPE), and critical safety precautions before explaining operational steps.
2. BEGINNER-FRIENDLY: Explain working principles and concepts in clear, easy-to-understand terms suitable for undergraduate students, without condescension.
3. GROUNDED IN TRUTH: Never invent or hallucinate specifications, operating procedures, pinouts, or safety tolerances. If specific details (e.g., exact calibration coefficients or unverified manufacturer specs) are uncertain or missing, explicitly state your uncertainty and advise the student to consult the physical lab manual or ask the laboratory assistant/instructor in charge.
4. TROUBLESHOOTING AWARENESS: Actively alert students to common beginner mistakes (such as short circuits, measuring resistance on live circuits, zero errors, or thermal hazards).
5. STRUCTURED CLARITY: Use clean formatting (bullet points, clear headers, numbered steps) so students can read instructions easily at their lab bench.`;

  if (!equipment) {
    return `${baseRules}

GENERAL LAB CONTEXT:
The student has not selected a specific instrument yet. Answer laboratory questions, explain general scientific apparatus, measurement principles, laboratory safety guidelines, and invite the student to select or scan an instrument in LabLens for specific step-by-step guidance.`;
  }

  const specsText = Object.entries(equipment.specs || {})
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const ppeText = (equipment.requiredPPE || []).map(p => `- ${p}`).join('\n') || '- Standard Lab Coat & Safety Glasses';

  const safetyText = (equipment.safetyPrecautions || [])
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  const stepsText = (equipment.operatingSteps || [])
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  const mistakesText = (equipment.commonMistakes || [])
    .map(m => `- ${m}`)
    .join('\n');

  const aliasesText = equipment.aliases?.length ? `Aliases: ${equipment.aliases.join(', ')}` : '';

  return `${baseRules}

AUTHORITATIVE INSTRUMENT CONTEXT (VERIFIED SERVER-SIDE):
Instrument Name: ${equipment.name} ${equipment.hindiName ? `(${equipment.hindiName})` : ''}
Stable ID: ${equipment.id}
Category: ${equipment.category}
${aliasesText}
Hazard Level: ${equipment.hazardLevel.toUpperCase()}
Verification Status: ${equipment.staffReviewed ? `Verified by ${equipment.reviewerName || 'Laboratory Staff'}` : 'Verified in LabLens Registry'}

VERIFIED SPECIFICATIONS:
${specsText || 'Consult laboratory instrument placard'}

REQUIRED PERSONAL PROTECTIVE EQUIPMENT (PPE):
${ppeText}

VERIFIED MANDATORY SAFETY PRECAUTIONS:
${safetyText || 'Follow general laboratory safety protocol.'}

VERIFIED STANDARD OPERATING PROCEDURE:
${stepsText || 'Consult instructor manual.'}

COMMON STUDENT MISTAKES & TROUBLESHOOTING:
${mistakesText || 'Ensure connections are firm and power supplies are off during wiring.'}

INSTRUCTION FOR THIS INSTRUMENT:
When the student asks questions about this instrument:
- Reference the verified specifications and operating steps provided above.
- Ensure any safety warning relevant to their question is prominently stated.
- If they ask for Hindi or bilingual explanations, provide helpful Hindi translations alongside English terminology.
- Remind them of verified operating parameters and warn against known common mistakes.`;
}
