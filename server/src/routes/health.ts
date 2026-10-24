import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { harnessService } from '../harness/harnessService.js';
import { getAllTrustedEquipment } from '../data/trustedEquipment.js';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  const instruments = getAllTrustedEquipment();
  const isConfigured = harnessService.isConfigured();
  const activeModel = config.aiProvider === 'gemini' ? config.geminiModel : config.deepseekModel;

  res.status(200).json({
    status: 'ok',
    service: 'LabLens AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    provider: config.aiProvider,
    activeModel,
    isConfigured,
    gemini: {
      model: config.geminiModel,
      isConfigured: Boolean(config.geminiApiKey),
    },
    harness: {
      provider: config.aiProvider === 'gemini' ? 'google-gemini' : 'deepseek-official',
      model: activeModel,
      isConfigured,
      runtime: config.aiProvider === 'gemini' ? '@google/genai' : '@deepseek-ai/dsh-sdk-client (v0.2.1-rc.3)',
      safetyProfile: 'Grounding in authoritative server-side equipment database',
    },
    trustedInstruments: {
      total: instruments.length,
      sampleIds: instruments.slice(0, 5).map(i => i.id)
    }
  });
});

