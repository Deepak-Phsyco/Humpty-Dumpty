import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from server directory or root directory
const rootEnvPath = path.resolve(process.cwd(), '.env');
const serverEnvPath = path.resolve(process.cwd(), 'server', '.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  aiProvider: 'gemini' | 'deepseek';
  geminiApiKey: string;
  geminiModel: string;
  deepseekApiKey: string;
  deepseekModel: string;
  dshHome: string;
  dshPatchPath: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  requestTimeoutMs: number;
}

const defaultPort = 3001;
const rawCors = process.env.CORS_ORIGIN || 'http://localhost:5173,https://deepak-phsyco.github.io';
const corsOrigins = rawCors
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const provider = (process.env.AI_PROVIDER?.toLowerCase() === 'deepseek')
  ? 'deepseek'
  : (process.env.GEMINI_API_KEY ? 'gemini' : (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'gemini'));

export const config: AppConfig = {
  port: parseInt(process.env.PORT || `${defaultPort}`, 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: corsOrigins.length > 0 ? corsOrigins : ['*'],
  aiProvider: provider as 'gemini' | 'deepseek',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',

  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  dshHome: path.resolve(process.env.DSH_HOME || path.resolve(process.cwd(), '.dsh')),
  dshPatchPath: path.resolve(__dirname, '../cordis.patch.yml'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '60000', 10),
};
