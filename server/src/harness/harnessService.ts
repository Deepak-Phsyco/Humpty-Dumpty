import { 
  DeepSeekHarness, 
  type RunResult,
  JsonRpcResponseError, 
  RequestTimeoutError, 
  SdkProtocolError, 
  TransportClosedError 
} from '@deepseek-ai/dsh-sdk-client';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { getTrustedEquipment, buildLabLensSystemPrompt, type TrustedEquipment } from '../data/trustedEquipment.js';

export interface ChatMessageRequest {
  message: string;
  sessionId?: string;
  equipmentId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatMessageResponse {
  reply: string;
  sessionId: string;
  equipmentId?: string;
  timestamp: string;
  model: string;
}

interface GeminiContentTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export class HarnessService {
  private harness: DeepSeekHarness | null = null;
  private knownSessions: Set<string> = new Set();
  private isInitializing: Promise<void> | null = null;
  private geminiClient: GoogleGenAI | null = null;
  private geminiSessions: Map<string, GeminiContentTurn[]> = new Map();

  constructor() {
    this.ensureDshHome();
  }

  private ensureDshHome() {
    try {
      if (!fs.existsSync(config.dshHome)) {
        fs.mkdirSync(config.dshHome, { recursive: true });
      }
    } catch (err) {
      console.warn('[HarnessService] Could not create DSH_HOME:', err);
    }
  }

  /**
   * Checks if the active AI provider has a valid API key configured.
   */
  public isConfigured(): boolean {
    if (config.aiProvider === 'gemini') {
      return Boolean(config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here');
    }
    return Boolean(config.deepseekApiKey && config.deepseekApiKey !== 'your_deepseek_api_key_here');
  }

  /**
   * Returns a singleton GoogleGenAI client instance.
   */
  private getGeminiClient(): GoogleGenAI {
    if (!this.geminiClient) {
      this.geminiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
    return this.geminiClient;
  }

  /**
   * Lazily initializes and returns the DeepSeekHarness instance.
   */
  private async getHarnessInstance(): Promise<DeepSeekHarness> {
    if (this.harness) {
      return this.harness;
    }

    if (this.isInitializing) {
      await this.isInitializing;
      if (this.harness) return this.harness;
    }

    this.isInitializing = (async () => {
      this.ensureDshHome();

      // Check if patch file exists
      const patches: string[] = [];
      if (fs.existsSync(config.dshPatchPath)) {
        patches.push(config.dshPatchPath);
      }

      const harnessEnv: NodeJS.ProcessEnv = {
        ...process.env,
        DEEPSEEK_API_KEY: config.deepseekApiKey,
      };
      delete harnessEnv.DSH_HOME;

      console.log(`[HarnessService] Initializing DeepSeek Harness runtime (model: ${config.deepseekModel})...`);

      const instance = new DeepSeekHarness({
        profile: 'sdk',
        patches: patches.length > 0 ? patches : undefined,
        provider: 'deepseek-official',
        model: config.deepseekModel,
        env: harnessEnv,
        initializeTimeoutMs: 60000,
        requestTimeoutMs: config.requestTimeoutMs,
      });

      this.harness = instance;
    })();

    await this.isInitializing;
    this.isInitializing = null;
    return this.harness!;
  }

  /**
   * Dispatches chat query to either Google Gemini or DeepSeek Harness depending on active configuration.
   */
  public async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const { message, equipmentId } = request;
    const sessionId = (request.sessionId && request.sessionId.trim()) 
      ? request.sessionId.trim() 
      : `session-${randomUUID().replaceAll('-', '')}`;

    // Verify equipment ID from trusted server-side store
    const equipment: TrustedEquipment | undefined = equipmentId ? getTrustedEquipment(equipmentId) : undefined;

    // Check configuration
    if (!this.isConfigured()) {
      if (config.aiProvider === 'gemini') {
        return this.handleUnconfiguredGeminiResponse(message, sessionId, equipment);
      }
      return this.handleUnconfiguredDeepSeekResponse(message, sessionId, equipment);
    }

    // Branch to Google Gemini
    if (config.aiProvider === 'gemini') {
      return this.sendGeminiMessage(request, sessionId, equipment);
    }

    // Branch to DeepSeek Harness
    return this.sendDeepSeekMessage(request, sessionId, equipment);
  }

  /**
   * Processes request using Google Gemini with authoritative LabLens equipment grounding.
   */
  private async sendGeminiMessage(
    request: ChatMessageRequest,
    sessionId: string,
    equipment?: TrustedEquipment
  ): Promise<ChatMessageResponse> {
    const { message } = request;

    try {
      const ai = this.getGeminiClient();
      const systemInstruction = buildLabLensSystemPrompt(equipment);

      let history = this.geminiSessions.get(sessionId);
      if (!history) {
        history = [];
        this.geminiSessions.set(sessionId, history);
      }

      // If session is newly tracked and client sent history, adopt recent turns
      if (history.length === 0 && request.history && request.history.length > 0) {
        for (const h of request.history.slice(-6)) {
          history.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          });
        }
      }

      // Contextual message
      let turnPrompt = message;
      if (equipment && history.length > 0) {
        turnPrompt = `[EQUIPMENT CONTEXT: ${equipment.name} (${equipment.category}) - Hazard: ${equipment.hazardLevel.toUpperCase()}]\n${message}`;
      }

      const currentTurn: GeminiContentTurn = {
        role: 'user',
        parts: [{ text: turnPrompt }]
      };

      const contents = [...history, currentTurn];

      const candidateModels = [
        config.geminiModel,
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.8-flash'
      ].filter((m, idx, arr) => arr.indexOf(m) === idx);

      let response: any = null;
      let usedModel = config.geminiModel;
      let lastErr: any = null;

      for (const candidate of candidateModels) {
        try {
          console.log(`[HarnessService] Invoking Gemini API (${candidate}) for session ${sessionId}...`);
          response = await ai.models.generateContent({
            model: candidate,
            contents,
            config: {
              systemInstruction,
            }
          });
          usedModel = candidate;
          break;
        } catch (err: any) {
          lastErr = err;
          const status = err?.status || err?.code;
          const msg = err?.message || '';
          console.warn(`[HarnessService] Candidate model ${candidate} failed (status: ${status}): ${msg}. Attempting next model...`);
        }
      }

      if (!response) {
        throw lastErr || new Error('All Gemini candidate models failed to respond.');
      }

      const replyText = response.text?.trim() || 'I received your request, but the model generated an empty response. Please consult your laboratory instructor.';

      // Save turns to session history
      history.push(currentTurn);
      history.push({
        role: 'model',
        parts: [{ text: replyText }]
      });

      // Keep recent 20 turns
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      return {
        reply: replyText,
        sessionId,
        equipmentId: equipment?.id,
        timestamp: new Date().toISOString(),
        model: usedModel,
      };

    } catch (error: any) {
      console.error('[HarnessService] Error in Gemini request:', error);
      const errMsg = error?.message || 'Gemini inference failed';
      throw new Error(`Google Gemini API error: ${errMsg}`);
    }
  }


  /**
   * Processes request using the official DeepSeek Harness SDK runtime subprocess.
   */
  private async sendDeepSeekMessage(
    request: ChatMessageRequest,
    sessionId: string,
    equipment?: TrustedEquipment
  ): Promise<ChatMessageResponse> {
    const { message } = request;
    const isFirstTurn = !this.knownSessions.has(sessionId);

    try {
      const harness = await this.getHarnessInstance();

      // Assemble full contextual prompt
      let fullPrompt = '';
      if (isFirstTurn) {
        const systemPrompt = buildLabLensSystemPrompt(equipment);
        fullPrompt = `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n\n[STUDENT INQUIRY]\n${message}`;
      } else {
        if (equipment) {
          fullPrompt = `[CURRENT INSTRUMENT CONTEXT: ${equipment.name} (${equipment.category}) - Hazard Level: ${equipment.hazardLevel.toUpperCase()}]\n${message}`;
        } else {
          fullPrompt = message;
        }
      }

      console.log(`[HarnessService] Executing DeepSeek Harness run on session ${sessionId}...`);
      const result: RunResult = await harness.run(fullPrompt, { sessionId });
      this.knownSessions.add(sessionId);

      let replyText = result.finalResponse?.trim();

      if (!replyText && result.events) {
        for (const ev of result.events as any[]) {
          const streamErr = ev?.data?.stream?.find?.((s: any) => s.chunk?.reason?.kind === 'error')?.chunk?.reason?.failure?.message;
          const turnErr = ev?.data?.reason?.error?.message;
          const candidateErr = streamErr || turnErr;

          if (candidateErr) {
            if (candidateErr.toLowerCase().includes('balance') || candidateErr.toLowerCase().includes('quota') || candidateErr.includes('402')) {
              replyText = `⚠️ **DeepSeek Account Notice**:
Your DeepSeek API key was authenticated successfully, but your account balance is depleted (\`Insufficient Balance - HTTP 402\`).
${equipment ? `\n\n📌 **Server-Verified Placard for ${equipment.name}**:\n- **Hazard Level**: ${equipment.hazardLevel.toUpperCase()}\n- **Mandatory PPE**: ${equipment.requiredPPE.join(', ')}\n- **Key Safety Rule**: ${equipment.safetyPrecautions[0]}\n- **Operating Step**: ${equipment.operatingSteps[0]}` : ''}`;
              break;
            } else {
              replyText = `⚠️ **DeepSeek Harness Model Notice**: ${candidateErr}`;
              break;
            }
          }
        }
      }

      if (!replyText) {
        replyText = 'I received your request, but the model provided an empty response. Please check your query or verify with your lab instructor.';
      }

      return {
        reply: replyText,
        sessionId,
        equipmentId: equipment?.id,
        timestamp: new Date().toISOString(),
        model: config.deepseekModel,
      };

    } catch (error: any) {
      console.error('[HarnessService] Error during DeepSeek Harness execution:', error);

      if (error instanceof RequestTimeoutError) {
        throw new Error('The DeepSeek Harness runtime timed out while processing your request.');
      }
      if (error instanceof TransportClosedError) {
        await this.close();
        throw new Error('DeepSeek Harness runtime subprocess disconnected unexpectedly. The runtime is resetting; please retry your request.');
      }
      if (error instanceof JsonRpcResponseError) {
        const wireMessage = error.message || 'DeepSeek Harness JSON-RPC error';
        if (wireMessage.toLowerCase().includes('auth') || wireMessage.toLowerCase().includes('key')) {
          throw new Error('DeepSeek API authentication failed. Please verify that your DEEPSEEK_API_KEY is valid.');
        }
        throw new Error(`DeepSeek Harness returned an error: ${wireMessage}`);
      }
      if (error instanceof SdkProtocolError) {
        throw new Error('DeepSeek Harness protocol violation encountered during communication with runtime.');
      }

      const errMsg = error?.message || '';
      if (errMsg.includes('ENOENT') || errMsg.includes('spawn')) {
        throw new Error('Unable to spawn DeepSeek Harness (dsh) runtime process.');
      }

      throw new Error('An error occurred while communicating with the AI runtime.');
    }
  }

  /**
   * Informative pedagogical response when Gemini API key is not yet configured.
   */
  private handleUnconfiguredGeminiResponse(message: string, sessionId: string, equipment?: TrustedEquipment): ChatMessageResponse {
    let guideSummary = '';
    if (equipment) {
      guideSummary = `\n\n📌 **Server-Verified Record for ${equipment.name}**:
- **Hazard Level**: ${equipment.hazardLevel.toUpperCase()}
- **PPE Required**: ${equipment.requiredPPE.join(', ')}
- **Key Safety Rule**: ${equipment.safetyPrecautions[0] || 'Follow standard lab protocol'}
- **First Step**: ${equipment.operatingSteps[0] || 'Inspect device before powering on'}`;
    }

    const reply = `⚠️ **Google Gemini Integration Notice**:
The secure Node.js backend is operational, but **GEMINI_API_KEY** is not configured or is using placeholder credentials on this server.

To enable live Gemini inference:
1. Open the backend configuration file (\`.env\`).
2. Add your official Gemini API key: \`GEMINI_API_KEY=AIza...\`.
3. Restart the backend server.
${guideSummary}`;

    return {
      reply,
      sessionId,
      equipmentId: equipment?.id,
      timestamp: new Date().toISOString(),
      model: `${config.geminiModel} (awaiting GEMINI_API_KEY)`,
    };
  }

  /**
   * Informative pedagogical response when DeepSeek API key is not yet configured.
   */
  private handleUnconfiguredDeepSeekResponse(message: string, sessionId: string, equipment?: TrustedEquipment): ChatMessageResponse {
    let guideSummary = '';
    if (equipment) {
      guideSummary = `\n\n📌 **Server-Verified Record for ${equipment.name}**:
- **Hazard Level**: ${equipment.hazardLevel.toUpperCase()}
- **PPE Required**: ${equipment.requiredPPE.join(', ')}
- **Key Safety Rule**: ${equipment.safetyPrecautions[0] || 'Follow standard lab protocol'}
- **First Step**: ${equipment.operatingSteps[0] || 'Inspect device before powering on'}`;
    }

    const reply = `⚠️ **DeepSeek Harness Integration Notice**:
The secure Node.js backend is operational, but **DEEPSEEK_API_KEY** is not configured.
${guideSummary}`;

    return {
      reply,
      sessionId,
      equipmentId: equipment?.id,
      timestamp: new Date().toISOString(),
      model: `${config.deepseekModel} (awaiting DEEPSEEK_API_KEY)`,
    };
  }

  /**
   * Gracefully close and reap the DeepSeek Harness runtime subprocess.
   */
  public async close(): Promise<void> {
    if (this.harness) {
      console.log('[HarnessService] Closing DeepSeek Harness child process...');
      try {
        await this.harness.close();
      } catch (err) {
        console.warn('[HarnessService] Error closing harness:', err);
      } finally {
        this.harness = null;
      }
    }
  }
}

export const harnessService = new HarnessService();

