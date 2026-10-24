/**
 * Web Speech API text-to-speech helper
 * Supports both English and Hindi accents/voices where available
 */
class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(text: string, lang: 'en' | 'hi' = 'en', onEnd?: () => void): void {
    if (!this.synth) {
      console.warn('SpeechSynthesis not supported on this device/browser.');
      return;
    }

    // Cancel ongoing speech
    this.stop();

    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95; // Slightly slower for clear instruction comprehension
    utterance.pitch = 1.0;

    // Pick appropriate voice if loaded
    const voices = this.synth.getVoices();
    if (voices && voices.length > 0) {
      const targetLangPrefix = lang === 'hi' ? 'hi' : 'en';
      const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangPrefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public getSpeakingState(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechService = new SpeechService();
