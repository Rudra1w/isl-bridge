import { SpeechEngineState, SpeechLocaleOption } from '@/types/speech';
import { configManager } from '@/config/appConfig';

// Define browser SpeechRecognition types safely for TypeScript
interface IWindowSpeechRecognition extends Window {
  SpeechRecognition?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const SUPPORTED_LOCALES: SpeechLocaleOption[] = [
  { code: 'en-IN', label: 'English (India)', regionalVariant: 'Indian English' },
  { code: 'hi-IN', label: 'Hindi (India)', regionalVariant: 'Standard Hindi' },
  { code: 'en-US', label: 'English (US)', regionalVariant: 'American English' },
  { code: 'en-GB', label: 'English (UK)', regionalVariant: 'British English' },
];

export class SpeechRecognitionEngine {
  private static instance: SpeechRecognitionEngine;
  private recognition: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private state: SpeechEngineState;
  private listeners: Set<(state: SpeechEngineState) => void> = new Set();
  private onFinalCallback: ((finalText: string) => void) | null = null;
  private shouldRestartOnEnd: boolean = false;

  private constructor() {
    const isSupported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const config = configManager.getConfig();

    this.state = {
      isListening: false,
      isSupported,
      locale: config.speech.defaultLocale || 'en-IN',
      error: null,
      interimTranscript: '',
      finalTranscript: '',
    };

    if (isSupported) {
      this.initRecognition();
    }
  }

  public static getInstance(): SpeechRecognitionEngine {
    if (!SpeechRecognitionEngine.instance) {
      SpeechRecognitionEngine.instance = new SpeechRecognitionEngine();
    }
    return SpeechRecognitionEngine.instance;
  }

  private initRecognition(): void {
    const win = window as unknown as IWindowSpeechRecognition;
    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      this.state.isSupported = false;
      this.notify();
      return;
    }

    try {
      this.recognition = new SpeechConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.state.locale;

      this.recognition.onstart = () => {
        this.state.isListening = true;
        this.state.error = null;
        this.notify();
      };

      this.recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        let interim = '';
        let newlyFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newlyFinal += transcriptSegment;
          } else {
            interim += transcriptSegment;
          }
        }

        this.state.interimTranscript = interim;

        if (newlyFinal.trim()) {
          const updatedFinal = this.state.finalTranscript
            ? `${this.state.finalTranscript.trim()} ${newlyFinal.trim()}`
            : newlyFinal.trim();

          this.state.finalTranscript = updatedFinal;
          if (this.onFinalCallback) {
            this.onFinalCallback(updatedFinal);
          }
        }

        this.notify();
      };

      this.recognition.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        // Ignore normal aborts
        if (event.error === 'aborted') return;

        let errorMsg = `Speech recognition error: ${event.error}`;
        if (event.error === 'not-allowed') {
          errorMsg = 'Microphone permission denied. Please allow microphone access.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'No speech detected. Please speak into your microphone.';
        }

        this.state.error = errorMsg;
        this.state.isListening = false;
        this.notify();
      };

      this.recognition.onend = () => {
        if (this.shouldRestartOnEnd && this.state.isListening) {
          try {
            this.recognition.start();
            return;
          } catch {
            // failed to restart
          }
        }
        this.state.isListening = false;
        this.notify();
      };
    } catch (err: unknown) {
      this.state.isSupported = false;
      this.state.error = err instanceof Error ? err.message : 'Failed to initialize speech recognition';
      this.notify();
    }
  }

  public setLocale(newLocale: string): void {
    if (this.state.locale === newLocale) return;
    this.state.locale = newLocale;
    const wasListening = this.state.isListening;
    if (wasListening) {
      this.stop();
    }
    if (this.recognition) {
      this.recognition.lang = newLocale;
    }
    this.notify();
    if (wasListening) {
      this.start();
    }
  }

  public start(): void {
    if (!this.state.isSupported) {
      this.state.error = 'Speech recognition is not supported in this browser. Please use Chrome/Edge or type directly.';
      this.notify();
      return;
    }

    if (this.state.isListening) return;

    this.shouldRestartOnEnd = true;
    this.state.error = null;

    try {
      this.recognition.lang = this.state.locale;
      this.recognition.start();
    } catch (err: unknown) {
      this.state.error = err instanceof Error ? err.message : 'Could not start speech recognition';
      this.notify();
    }
  }

  public stop(): void {
    this.shouldRestartOnEnd = false;
    if (this.recognition && this.state.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // already stopped
      }
    }
    this.state.isListening = false;
    this.notify();
  }

  public clear(): void {
    this.state.interimTranscript = '';
    this.state.finalTranscript = '';
    this.notify();
  }

  public getState(): SpeechEngineState {
    return { ...this.state };
  }

  public setOnFinalListener(cb: (finalText: string) => void): void {
    this.onFinalCallback = cb;
  }

  public subscribe(listener: (state: SpeechEngineState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }
}

export const speechEngine = SpeechRecognitionEngine.getInstance();
