import {
  SpeechSynthesisState,
  SpeechSynthesisConfig,
  SpeechSynthesisVoiceOption,
} from './types';

export class SpeechSynthesisService {
  private static instance: SpeechSynthesisService;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private state: SpeechSynthesisState;
  private listeners: Set<(state: SpeechSynthesisState) => void> = new Set();
  private voices: SpeechSynthesisVoice[] = [];

  private constructor() {
    const isSupported =
      typeof window !== 'undefined' && 'speechSynthesis' in window;

    this.synth = isSupported ? window.speechSynthesis : null;

    this.state = {
      status: isSupported ? 'idle' : 'unsupported',
      isSupported,
      isSpeaking: false,
      isPaused: false,
      currentText: null,
      selectedVoiceURI: null,
      availableVoices: [],
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      errorMessage: isSupported
        ? null
        : 'Speech synthesis is not supported in this browser.',
    };

    if (isSupported && this.synth) {
      this.initVoices();
    }
  }

  public static getInstance(): SpeechSynthesisService {
    if (!SpeechSynthesisService.instance) {
      SpeechSynthesisService.instance = new SpeechSynthesisService();
    }
    return SpeechSynthesisService.instance;
  }

  private initVoices(): void {
    if (!this.synth) return;

    const populateVoices = () => {
      this.voices = this.synth?.getVoices() || [];
      const voiceOptions: SpeechSynthesisVoiceOption[] = this.voices.map((v) => ({
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        isDefault: v.default,
        isIndianEnglish:
          v.lang.toLowerCase() === 'en-in' ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi'),
      }));

      this.state.availableVoices = voiceOptions;

      // Auto-select Indian English voice if available and none selected yet
      if (!this.state.selectedVoiceURI && voiceOptions.length > 0) {
        const indianVoice = voiceOptions.find((v) => v.isIndianEnglish);
        const englishVoice = voiceOptions.find((v) => v.lang.startsWith('en'));
        const defaultVoice = voiceOptions.find((v) => v.isDefault);

        const chosen = indianVoice || englishVoice || defaultVoice || voiceOptions[0];
        this.state.selectedVoiceURI = chosen.voiceURI;
      }

      this.notify();
    };

    populateVoices();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  public async speak(
    text: string,
    options?: Partial<SpeechSynthesisConfig>
  ): Promise<void> {
    if (!this.synth || !this.state.isSupported) {
      this.state.status = 'unsupported';
      this.state.errorMessage = 'Speech synthesis is not supported in this browser.';
      this.notify();
      return;
    }

    const clean = text.trim();
    if (!clean) return;

    // Cancel any ongoing utterance first
    this.cancel();

    return new Promise<void>((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(clean);

        // Apply voice
        const voiceUri = options?.voiceURI || this.state.selectedVoiceURI;
        if (voiceUri) {
          const matched = this.voices.find((v) => v.voiceURI === voiceUri);
          if (matched) {
            utterance.voice = matched;
          }
        }

        // Apply rate, pitch, volume
        utterance.rate = options?.rate ?? this.state.rate;
        utterance.pitch = options?.pitch ?? this.state.pitch;
        utterance.volume = options?.volume ?? this.state.volume;
        utterance.lang = options?.lang || utterance.voice?.lang || 'en-IN';

        utterance.onstart = () => {
          this.state.isSpeaking = true;
          this.state.isPaused = false;
          this.state.status = 'speaking';
          this.state.currentText = clean;
          this.state.errorMessage = null;
          this.notify();
        };

        utterance.onpause = () => {
          this.state.isPaused = true;
          this.state.status = 'paused';
          this.notify();
        };

        utterance.onresume = () => {
          this.state.isPaused = false;
          this.state.status = 'speaking';
          this.notify();
        };

        utterance.onend = () => {
          this.state.isSpeaking = false;
          this.state.isPaused = false;
          this.state.status = 'idle';
          this.state.currentText = null;
          this.currentUtterance = null;
          this.notify();
          resolve();
        };

        utterance.onerror = (e) => {
          // If user clicked cancel or interrupted, ignore as harmless cancel
          if (e.error === 'canceled' || e.error === 'interrupted') {
            this.state.isSpeaking = false;
            this.state.isPaused = false;
            this.state.status = 'idle';
            this.state.currentText = null;
            this.currentUtterance = null;
            this.notify();
            resolve();
            return;
          }

          this.state.isSpeaking = false;
          this.state.isPaused = false;
          this.state.status = 'error';
          this.state.errorMessage = `Speech synthesis error: ${e.error}`;
          this.currentUtterance = null;
          this.notify();
          reject(new Error(this.state.errorMessage));
        };

        this.currentUtterance = utterance;
        this.synth?.speak(utterance);
      } catch (err: unknown) {
        this.state.isSpeaking = false;
        this.state.status = 'error';
        this.state.errorMessage =
          err instanceof Error ? err.message : 'Unknown speech synthesis error';
        this.notify();
        reject(err);
      }
    });
  }

  public pause(): void {
    if (this.synth && this.state.isSpeaking && !this.state.isPaused) {
      try {
        this.synth.pause();
        this.state.isPaused = true;
        this.state.status = 'paused';
        this.notify();
      } catch (err) {
        console.warn('SpeechSynthesis pause error:', err);
      }
    }
  }

  public resume(): void {
    if (this.synth && this.state.isPaused) {
      try {
        this.synth.resume();
        this.state.isPaused = false;
        this.state.status = 'speaking';
        this.notify();
      } catch (err) {
        console.warn('SpeechSynthesis resume error:', err);
      }
    }
  }

  public cancel(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (err) {
        console.warn('SpeechSynthesis cancel error:', err);
      }
    }
    this.currentUtterance = null;
    this.state.isSpeaking = false;
    this.state.isPaused = false;
    if (this.state.status !== 'unsupported') {
      this.state.status = 'idle';
    }
    this.state.currentText = null;
    this.notify();
  }

  public getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public setVoice(voiceURI: string): void {
    this.state.selectedVoiceURI = voiceURI;
    this.notify();
  }

  public setRate(rate: number): void {
    // Clamped between 0.5 and 2.0
    this.state.rate = Math.max(0.5, Math.min(2.0, rate));
    this.notify();
  }

  public setPitch(pitch: number): void {
    // Clamped between 0.5 and 1.5
    this.state.pitch = Math.max(0.5, Math.min(1.5, pitch));
    this.notify();
  }

  public setVolume(volume: number): void {
    // Clamped between 0.0 and 1.0
    this.state.volume = Math.max(0.0, Math.min(1.0, volume));
    this.notify();
  }

  public getState(): SpeechSynthesisState {
    return { ...this.state };
  }

  public subscribe(listener: (state: SpeechSynthesisState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = { ...this.state };
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const speechSynthesisService = SpeechSynthesisService.getInstance();
