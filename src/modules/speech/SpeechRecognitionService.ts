import {
  SpeechRecognitionState,
  SpeechRecognitionStatus,
  SpeechLocaleOption,
} from './types';
import { configManager } from '@/config/appConfig';

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

export class SpeechRecognitionService {
  private static instance: SpeechRecognitionService;
  private recognition: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private state: SpeechRecognitionState;
  private listeners: Set<(state: SpeechRecognitionState) => void> = new Set();
  private onFinalCallback: ((finalText: string, normalizedText: string, confidence: number) => void) | null = null;
  private shouldBeListening: boolean = false;
  private restartTimeout: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  private isStarting: boolean = false;

  private constructor() {
    const isSupported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    const config = configManager.getConfig();

    this.state = {
      status: isSupported ? 'ready' : 'unsupported',
      isListening: false,
      isSupported,
      hasPermission: null,
      locale: config.speech.defaultLocale || 'en-IN',
      interimTranscript: '',
      finalTranscript: '',
      normalizedTranscript: '',
      confidence: 0,
      errorMessage: isSupported
        ? null
        : 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.',
      lastActiveTimestamp: Date.now(),
    };

    if (isSupported) {
      this.initRecognition();
      this.checkPermissionStatus();
    }
  }

  public static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService();
    }
    return SpeechRecognitionService.instance;
  }

  /**
   * Normalizes raw speech transcript for subsequent ISL/NLP translation pipeline:
   * 1. Trims whitespace
   * 2. Collapses redundant spaces
   * 3. Removes common filler vocalizations
   * 4. Capitalizes the first character
   */
  public static normalizeTranscript(raw: string): string {
    if (!raw) return '';
    let normalized = raw.trim();

    // Collapse multiple whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Filter out common isolated fillers: um, uh, ah, er, hmm
    normalized = normalized
      .replace(/\b(um|uh|er|ah|hmm)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure sentence capitalization
    if (normalized.length > 0) {
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    return normalized;
  }

  private async checkPermissionStatus(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        this.state.hasPermission = permissionStatus.state === 'granted';
        if (permissionStatus.state === 'denied') {
          this.state.status = 'blocked';
          this.state.errorMessage = 'Microphone permission is blocked. Please allow microphone access in your browser.';
          this.notify();
        }

        permissionStatus.onchange = () => {
          this.state.hasPermission = permissionStatus.state === 'granted';
          if (permissionStatus.state === 'denied') {
            this.state.status = 'blocked';
            this.state.errorMessage = 'Microphone permission is blocked.';
            this.stop();
          } else if (permissionStatus.state === 'granted' && this.state.status === 'blocked') {
            this.state.status = 'ready';
            this.state.errorMessage = null;
          }
          this.notify();
        };
      }
    } catch {
      // Permission API not supported or microphone query not permitted
    }
  }

  /**
   * Explicitly requests microphone permissions from user
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.state.status = 'unsupported';
      this.state.errorMessage = 'Media devices not supported in this browser.';
      this.notify();
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop track after getting permission
      stream.getTracks().forEach((track) => track.stop());
      this.state.hasPermission = true;
      if (this.state.status === 'blocked' || this.state.status === 'error') {
        this.state.status = 'ready';
        this.state.errorMessage = null;
      }
      this.notify();
      return true;
    } catch (err: unknown) {
      this.state.hasPermission = false;
      this.state.status = 'blocked';
      this.state.errorMessage = 'Microphone access was denied. Please allow microphone permissions in browser settings.';
      this.notify();
      return false;
    }
  }

  private initRecognition(): void {
    const win = window as unknown as IWindowSpeechRecognition;
    const SpeechConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechConstructor) {
      this.state.isSupported = false;
      this.state.status = 'unsupported';
      this.state.errorMessage = 'Speech recognition is not supported in this browser.';
      this.notify();
      return;
    }

    try {
      this.recognition = new SpeechConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.state.locale;

      this.recognition.onstart = () => {
        this.isStarting = false;
        this.state.isListening = true;
        this.state.status = 'listening';
        this.state.errorMessage = null;
        this.state.lastActiveTimestamp = Date.now();
        this.notify();
      };

      this.recognition.onaudiostart = () => {
        if (this.state.isListening) {
          this.state.status = 'listening';
          this.notify();
        }
      };

      this.recognition.onspeechstart = () => {
        if (this.state.isListening) {
          this.state.status = 'processing';
          this.notify();
        }
      };

      this.recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        let interim = '';
        let newlyFinal = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptSegment = result[0].transcript;
          const conf = result[0].confidence || 0.85;

          if (result.isFinal) {
            newlyFinal += transcriptSegment;
            if (conf > maxConfidence) maxConfidence = conf;
          } else {
            interim += transcriptSegment;
          }
        }

        this.state.interimTranscript = interim;
        if (interim) {
          this.state.status = 'processing';
        }

        if (newlyFinal.trim()) {
          const updatedFinal = this.state.finalTranscript
            ? `${this.state.finalTranscript.trim()} ${newlyFinal.trim()}`
            : newlyFinal.trim();

          const normalized = SpeechRecognitionService.normalizeTranscript(updatedFinal);

          this.state.finalTranscript = updatedFinal;
          this.state.normalizedTranscript = normalized;
          this.state.confidence = maxConfidence || 0.9;
          this.state.status = 'recognized';
          this.state.lastActiveTimestamp = Date.now();

          if (this.onFinalCallback) {
            this.onFinalCallback(updatedFinal, normalized, this.state.confidence);
          }

          // Return to listening state after a brief moment if continuous
          setTimeout(() => {
            if (this.state.isListening) {
              this.state.status = 'listening';
              this.notify();
            }
          }, 800);
        }

        this.notify();
      };

      this.recognition.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        this.isStarting = false;
        const errType = event.error;

        // Aborted is triggered on normal stop
        if (errType === 'aborted') {
          if (!this.shouldBeListening) {
            this.state.status = 'ready';
            this.state.isListening = false;
            this.notify();
          }
          return;
        }

        let status: SpeechRecognitionStatus = 'error';
        let errorMessage = `Speech recognition error: ${errType}`;

        if (errType === 'not-allowed') {
          status = 'blocked';
          errorMessage = 'Microphone permission was blocked or denied. Please click the camera/mic icon in the browser address bar to allow access.';
          this.shouldBeListening = false;
          this.state.hasPermission = false;
        } else if (errType === 'audio-capture') {
          status = 'blocked';
          errorMessage = 'No microphone was found or the microphone is currently busy in another application.';
          this.shouldBeListening = false;
        } else if (errType === 'network') {
          status = 'service-unavailable';
          errorMessage = 'Network error: Unable to connect to browser speech recognition cloud service. Please check your internet connection.';
        } else if (errType === 'service-not-allowed') {
          status = 'service-unavailable';
          errorMessage = 'Speech service is not allowed by your browser or operating system security policy.';
          this.shouldBeListening = false;
        } else if (errType === 'no-speech') {
          status = 'ready';
          errorMessage = 'No speech was detected. Please check microphone input or speak clearly.';
          // Do not cancel shouldBeListening, allow subsequent speech to be caught
        } else if (errType === 'language-not-supported') {
          status = 'service-unavailable';
          errorMessage = `The selected language (${this.state.locale}) is not supported on this browser engine.`;
          this.shouldBeListening = false;
        }

        this.state.status = status;
        this.state.errorMessage = errorMessage;
        this.state.isListening = false;
        this.notify();
      };

      this.recognition.onend = () => {
        this.isStarting = false;

        // If continuous listening was requested and no fatal blocking error occurred, restart seamlessly
        if (
          this.shouldBeListening &&
          this.state.status !== 'blocked' &&
          this.state.status !== 'unsupported' &&
          this.state.status !== 'service-unavailable'
        ) {
          clearTimeout(this.restartTimeout);
          this.restartTimeout = setTimeout(() => {
            if (this.shouldBeListening) {
              try {
                this.recognition.start();
              } catch {
                // Ignore transient start collision
              }
            }
          }, 300);
          return;
        }

        this.state.isListening = false;
        if (this.state.status === 'listening' || this.state.status === 'processing') {
          this.state.status = 'ready';
        }
        this.notify();
      };
    } catch (err: unknown) {
      this.state.isSupported = false;
      this.state.status = 'unsupported';
      this.state.errorMessage = err instanceof Error ? err.message : 'Failed to instantiate speech recognition';
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

  public async start(): Promise<void> {
    if (!this.state.isSupported) {
      this.state.status = 'unsupported';
      this.state.errorMessage = 'Speech recognition is not supported in this browser. Please use Chrome/Edge or type directly.';
      this.notify();
      return;
    }

    if (this.state.isListening || this.isStarting) {
      return;
    }

    // If permission was previously blocked, prompt user again
    if (this.state.hasPermission === false || this.state.status === 'blocked') {
      const granted = await this.requestMicrophonePermission();
      if (!granted) return;
    }

    this.shouldBeListening = true;
    this.isStarting = true;
    this.state.errorMessage = null;

    try {
      this.recognition.lang = this.state.locale;
      this.recognition.start();
    } catch (err: unknown) {
      this.isStarting = false;
      const msg = err instanceof Error ? err.message : 'Could not start speech recognition';
      // In case already started
      if (msg.includes('already started')) {
        this.state.isListening = true;
        this.state.status = 'listening';
      } else {
        this.state.status = 'error';
        this.state.errorMessage = msg;
      }
      this.notify();
    }
  }

  public stop(): void {
    this.shouldBeListening = false;
    clearTimeout(this.restartTimeout);
    this.isStarting = false;

    if (this.recognition && this.state.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
    }

    this.state.isListening = false;
    if (this.state.status === 'listening' || this.state.status === 'processing') {
      this.state.status = 'ready';
    }
    this.notify();
  }

  public toggle(): void {
    if (this.state.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  public clear(): void {
    this.state.interimTranscript = '';
    this.state.finalTranscript = '';
    this.state.normalizedTranscript = '';
    this.state.confidence = 0;
    if (this.state.status === 'recognized') {
      this.state.status = this.state.isListening ? 'listening' : 'ready';
    }
    this.notify();
  }

  public getState(): SpeechRecognitionState {
    return { ...this.state };
  }

  public setOnFinalListener(
    cb: (finalText: string, normalizedText: string, confidence: number) => void
  ): void {
    this.onFinalCallback = cb;
  }

  public subscribe(listener: (state: SpeechRecognitionState) => void): () => void {
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

export const speechRecognitionService = SpeechRecognitionService.getInstance();
