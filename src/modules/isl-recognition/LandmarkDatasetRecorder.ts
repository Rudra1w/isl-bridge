import { HandLandmarks, RecordedSignSample, RecordedDataset } from '@/types/recognition';

const STORAGE_KEY = 'isl_bridge_recorded_dataset_v1';

export class LandmarkDatasetRecorder {
  private static instance: LandmarkDatasetRecorder;
  private currentSamples: RecordedSignSample[] = [];
  private isRecording = false;
  private currentLabel = '';
  private currentMode: 'static' | 'dynamic' = 'static';
  private frameBuffer: RecordedSignSample['frames'] = [];
  private targetFrames = 30; // 30 frames for a 1-second dynamic gesture sequence

  private constructor() {
    this.loadPersistedDataset();
  }

  public static getInstance(): LandmarkDatasetRecorder {
    if (!LandmarkDatasetRecorder.instance) {
      LandmarkDatasetRecorder.instance = new LandmarkDatasetRecorder();
    }
    return LandmarkDatasetRecorder.instance;
  }

  private loadPersistedDataset(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.currentSamples = JSON.parse(stored);
      }
    } catch {
      this.currentSamples = [];
    }
  }

  private persistDataset(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSamples));
    } catch {
      // quota or storage unavailable
    }
  }

  public startRecording(label: string, mode: 'static' | 'dynamic' = 'static'): void {
    this.currentLabel = label.trim().toUpperCase();
    this.currentMode = mode;
    this.isRecording = true;
    this.frameBuffer = [];
  }

  public stopRecording(): RecordedSignSample | null {
    if (!this.isRecording || this.frameBuffer.length === 0) {
      this.isRecording = false;
      this.frameBuffer = [];
      return null;
    }

    const sample: RecordedSignSample = {
      id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: this.currentLabel,
      type: this.currentMode,
      timestamp: Date.now(),
      frames: [...this.frameBuffer],
    };

    this.currentSamples.push(sample);
    this.persistDataset();

    this.isRecording = false;
    this.frameBuffer = [];

    return sample;
  }

  /**
   * Called on every video frame when recording is active.
   */
  public recordFrame(hands: HandLandmarks[]): { isComplete: boolean; framesCount: number } {
    if (!this.isRecording) {
      return { isComplete: false, framesCount: 0 };
    }

    if (hands.length === 0) {
      return { isComplete: false, framesCount: this.frameBuffer.length };
    }

    const frameData = {
      timestamp: Date.now(),
      hands: hands.map((h) => ({
        handedness: h.handedness,
        landmarks: h.landmarks,
        normalizedLandmarks: h.normalizedLandmarks,
        boundingBox: h.boundingBox,
        score: h.score,
      })),
    };

    this.frameBuffer.push(frameData);

    // Static mode: 1 frame is enough
    if (this.currentMode === 'static' && this.frameBuffer.length >= 1) {
      this.stopRecording();
      return { isComplete: true, framesCount: 1 };
    }

    // Dynamic mode: target e.g. 30 frames
    if (this.currentMode === 'dynamic' && this.frameBuffer.length >= this.targetFrames) {
      this.stopRecording();
      return { isComplete: true, framesCount: this.targetFrames };
    }

    return { isComplete: false, framesCount: this.frameBuffer.length };
  }

  public getSamples(): RecordedSignSample[] {
    return [...this.currentSamples];
  }

  public getSamplesCountByClass(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const s of this.currentSamples) {
      counts[s.label] = (counts[s.label] || 0) + 1;
    }
    return counts;
  }

  public clearSamples(): void {
    this.currentSamples = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  public exportDatasetJSON(): string {
    const classes = Array.from(new Set(this.currentSamples.map((s) => s.label)));
    const dataset: RecordedDataset = {
      name: 'ISL-Bridge-Landmark-Dataset',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      classes,
      totalSamples: this.currentSamples.length,
      samples: this.currentSamples,
    };
    return JSON.stringify(dataset, null, 2);
  }

  public downloadDataset(): void {
    const jsonStr = this.exportDatasetJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isl_landmarks_dataset_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const landmarkRecorder = LandmarkDatasetRecorder.getInstance();
