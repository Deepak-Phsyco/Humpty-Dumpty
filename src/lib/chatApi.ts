/**
 * LabLens AI Chatbot Client API
 * Connects the frontend to the DeepSeek Harness Node.js/Express backend.
 */

export interface ChatApiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  equipmentId?: string;
  isError?: boolean;
}

export interface ChatApiResponse {
  reply: string;
  sessionId: string;
  equipmentId?: string;
  timestamp: string;
  model: string;
}

export interface BackendHealthResponse {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
  harness: {
    provider: string;
    model: string;
    isConfigured: boolean;
    runtime: string;
    safetyProfile: string;
  };
  trustedInstruments: {
    total: number;
    sampleIds: string[];
  };
}

const SESSION_STORAGE_KEY = 'lablens_ai_session_id';

export function getApiBaseUrl(): string {
  // 1. Explicit Vite env variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return (import.meta.env.VITE_API_BASE_URL as string).replace(/\/+$/, '');
  }
  // 2. Localhost development fallback
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3001';
  }
  // 3. In production, if served from same origin or reverse proxy
  return '';
}

export function getSavedSessionId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(SESSION_STORAGE_KEY) || '';
}

export function saveSessionId(sessionId: string): void {
  if (typeof window !== 'undefined' && sessionId) {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
}

export function clearSavedSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/**
 * Checks the status of the DeepSeek Harness backend and runtime.
 */
export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  harnessReady: boolean;
  data?: BackendHealthResponse;
  error?: string;
}> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/health`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        isOnline: false,
        harnessReady: false,
        error: `Backend responded with HTTP status ${res.status}`
      };
    }

    const data: BackendHealthResponse = await res.json();
    return {
      isOnline: true,
      harnessReady: Boolean(data.harness?.isConfigured),
      data
    };
  } catch (err: any) {
    return {
      isOnline: false,
      harnessReady: false,
      error: err?.message || 'Unable to connect to DeepSeek Harness backend'
    };
  }
}

/**
 * Sends a student query with instrument context to the DeepSeek Harness backend.
 */
export async function sendChatMessage(payload: {
  message: string;
  sessionId?: string;
  equipmentId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<ChatApiResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/chat`;

  const controller = new AbortController();
  const timeoutMs = 65000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: payload.message,
        sessionId: payload.sessionId || getSavedSessionId() || undefined,
        equipmentId: payload.equipmentId,
        history: payload.history
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    const json = await res.json();

    if (!res.ok) {
      const errorMsg = json?.error || `Server responded with status code ${res.status}`;
      throw new Error(errorMsg);
    }

    if (json.sessionId) {
      saveSessionId(json.sessionId);
    }

    return json as ChatApiResponse;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The DeepSeek Harness backend took too long to respond. Please try again.');
    }
    throw err;
  }
}
