import { tfjsISLRecognizer } from '@/modules/isl-recognition/TensorFlowISLRecognizer';
import { speechEngine } from '@/modules/speech/SpeechRecognitionEngine';
import { geminiService } from '@/services/geminiService';
import { signAssetResolver } from '@/modules/sign-output/SignAssetResolver';
import { configManager } from '@/config/appConfig';

export interface SystemStatusSnapshot {
  camera: 'READY' | 'ACTIVE' | 'ERROR' | 'OFF';
  cameraDetail?: string;
  handTracking: 'READY' | 'ACTIVE' | 'INITIALIZING' | 'ERROR';
  islModel: 'READY' | 'NOT LOADED' | 'DEMO HEURISTIC';
  islModelDetail?: string;
  speechRecognition: 'READY' | 'UNSUPPORTED' | 'LISTENING' | 'ERROR';
  gemini: 'CONNECTED' | 'OFFLINE' | 'LOCAL FALLBACK';
  geminiDetail?: string;
  signAssetsCount: number;
  signAssetsDetail: string;
  network: 'ONLINE' | 'OFFLINE';
  performanceMode: 'high' | 'balanced' | 'low';
  lastChecked: number;
}

export class SystemStatusService {
  private static instance: SystemStatusService;
  private cameraStatus: 'READY' | 'ACTIVE' | 'ERROR' | 'OFF' = 'OFF';
  private cameraDetail = 'Webcam stream is inactive';
  private isNetworkOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(status: SystemStatusSnapshot) => void> = new Set();

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isNetworkOnline = true;
        this.notify();
      });
      window.addEventListener('offline', () => {
        this.isNetworkOnline = false;
        this.notify();
      });
    }
  }

  public static getInstance(): SystemStatusService {
    if (!SystemStatusService.instance) {
      SystemStatusService.instance = new SystemStatusService();
    }
    return SystemStatusService.instance;
  }

  public updateCameraStatus(status: 'READY' | 'ACTIVE' | 'ERROR' | 'OFF', detail?: string): void {
    this.cameraStatus = status;
    if (detail !== undefined) this.cameraDetail = detail;
    this.notify();
  }

  public getSnapshot(): SystemStatusSnapshot {
    const config = configManager.getConfig();

    // 1. ISL Model Status
    const modelStatus = tfjsISLRecognizer.status;
    let islModel: 'READY' | 'NOT LOADED' | 'DEMO HEURISTIC' = 'DEMO HEURISTIC';
    let islModelDetail = 'Running uncalibrated geometric heuristic baseline';

    if (modelStatus === 'ready' && tfjsISLRecognizer.modelType === 'tensorflow') {
      islModel = 'READY';
      islModelDetail = 'TensorFlow.js neural model loaded and executing';
    } else if (modelStatus === 'model_not_found' || tfjsISLRecognizer.modelType === 'demo-heuristic') {
      islModel = 'NOT LOADED';
      islModelDetail = 'Neural checkpoint not mounted; safely running Demo Heuristic Fallback';
    }

    // 2. Speech Recognition Status
    const speechState = speechEngine.getState();
    let speechRecognition: 'READY' | 'UNSUPPORTED' | 'LISTENING' | 'ERROR' = 'READY';

    if (!speechState.isSupported) {
      speechRecognition = 'UNSUPPORTED';
    } else if (speechState.isListening) {
      speechRecognition = 'LISTENING';
    } else if (speechState.errorMessage) {
      speechRecognition = 'ERROR';
    }

    // 3. Gemini Status
    const isGeminiAvail = geminiService.isAvailable();
    let gemini: 'CONNECTED' | 'OFFLINE' | 'LOCAL FALLBACK' = 'LOCAL FALLBACK';
    let geminiDetail = 'Local ISL SOV heuristics and phrase dictionary active (100% offline)';

    if (!this.isNetworkOnline) {
      gemini = 'OFFLINE';
      geminiDetail = 'No internet connection; using local offline rule engine';
    } else if (isGeminiAvail) {
      gemini = 'CONNECTED';
      geminiDetail = geminiService.getProxyUrl()
        ? `Connected via secure backend proxy: ${geminiService.getProxyUrl()}`
        : 'Direct client-side Gemini 2.5 Flash API active';
    }

    // 4. Sign Assets
    const allSigns = signAssetResolver.getAll();
    const signAssetsCount = allSigns.length;
    const signAssetsDetail = `${signAssetsCount} verified vocabulary signs + 26-letter manual alphabet`;

    // 5. Hand Tracking
    let handTracking: 'READY' | 'ACTIVE' | 'INITIALIZING' | 'ERROR' = 'READY';
    if (this.cameraStatus === 'ACTIVE') {
      handTracking = 'ACTIVE';
    } else if (this.cameraStatus === 'ERROR') {
      handTracking = 'ERROR';
    }

    return {
      camera: this.cameraStatus,
      cameraDetail: this.cameraDetail,
      handTracking,
      islModel,
      islModelDetail,
      speechRecognition,
      gemini,
      geminiDetail,
      signAssetsCount,
      signAssetsDetail,
      network: this.isNetworkOnline ? 'ONLINE' : 'OFFLINE',
      performanceMode: config.performance.mode,
      lastChecked: Date.now(),
    };
  }

  public subscribe(listener: (status: SystemStatusSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((l) => l(snap));
  }
}

export const systemStatusService = SystemStatusService.getInstance();
