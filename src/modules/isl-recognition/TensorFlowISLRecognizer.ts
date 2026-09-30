import * as tf from '@tensorflow/tfjs';
import {
  ISLRecognizer,
  HandLandmarkFrame,
  TemporalSequenceFrame,
  Prediction,
  ModelType,
  ModelStatus,
} from '@/types/recognition';
import { FeatureExtractor } from './FeatureExtractor';
import { ISLDemoHeuristicRecognizer } from './ISLDemoHeuristicRecognizer';

export interface ModelMetadata {
  classes: string[];
  version?: string;
  isDynamic?: boolean;
}

export class TensorFlowISLRecognizer implements ISLRecognizer {
  public readonly id = 'tfjs-isl-recognizer-v1';
  public readonly name = 'TensorFlow.js ISL Neural Classifier';
  public readonly version = '1.0.0';
  public modelType: ModelType = 'tensorflow';
  public status: ModelStatus = 'uninitialized';
  public lastInferenceLatencyMs: number = 0;

  private model: tf.LayersModel | tf.GraphModel | null = null;
  private modelUrl: string;
  private labelsUrl: string;
  private labels: string[] = [];
  private demoFallback: ISLDemoHeuristicRecognizer;

  constructor(
    modelUrl = '/models/isl-classifier/model.json',
    labelsUrl = '/models/isl-classifier/labels.json'
  ) {
    this.modelUrl = modelUrl;
    this.labelsUrl = labelsUrl;
    this.demoFallback = new ISLDemoHeuristicRecognizer();
  }

  public get isReady(): boolean {
    return this.status === 'ready' && this.model !== null;
  }

  public get supportedSigns(): string[] {
    if (this.labels.length > 0) return this.labels;
    return this.demoFallback.supportedSigns;
  }

  public async initialize(): Promise<void> {
    if (this.status === 'loading') return;
    this.status = 'loading';

    try {
      // 1. Check if model file exists before invoking tf.loadLayersModel to prevent unhandled 404 noise
      const response = await fetch(this.modelUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.info(
          `[ISL Recognizer] No trained neural checkpoint found at ${this.modelUrl}. ` +
          `Gracefully running in DEMO_FALLBACK mode. (Use training/ pipeline to export trained models).`
        );
        this.status = 'model_not_found';
        this.modelType = 'demo-heuristic';
        await this.demoFallback.initialize();
        return;
      }

      // 2. Load TF.js model
      try {
        this.model = await tf.loadLayersModel(this.modelUrl);
      } catch {
        this.model = await tf.loadGraphModel(this.modelUrl);
      }

      // 3. Load class labels metadata if available
      try {
        const labelsRes = await fetch(this.labelsUrl);
        if (labelsRes.ok) {
          const meta: ModelMetadata = await labelsRes.json();
          this.labels = meta.classes || [];
        }
      } catch {
        this.labels = [];
      }

      this.status = 'ready';
      this.modelType = 'tensorflow';
    } catch (err: unknown) {
      console.warn('[ISL Recognizer] Model loading failed, falling back to demo heuristic:', err);
      this.status = 'demo_fallback';
      this.modelType = 'demo-heuristic';
      await this.demoFallback.initialize();
    }
  }

  public async predict(
    input: HandLandmarkFrame | TemporalSequenceFrame
  ): Promise<Prediction | null> {
    const t0 = performance.now();

    // If neural model is not active, delegate cleanly to demo heuristic
    if (this.status !== 'ready' || !this.model) {
      return this.demoFallback.predict(input);
    }

    const frame: HandLandmarkFrame = 'frames' in input
      ? input.frames[input.frames.length - 1]
      : input;

    if (!frame.hands || frame.hands.length === 0) {
      return null;
    }

    const model = this.model;
    const outputTensor = tf.tidy(() => {
      // Extract feature vector
      const features = FeatureExtractor.extractFrameFeatures(frame);
      const inputTensor = tf.tensor2d([features], [1, features.length]);

      // Inference
      const prediction = model.predict(inputTensor) as tf.Tensor;
      return prediction.softmax();
    });

    const probabilities = outputTensor.dataSync();
    outputTensor.dispose();

    // Find top class
    let maxIdx = 0;
    let maxProb = 0;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        maxIdx = i;
      }
    }

    const label = this.labels[maxIdx] || `Sign_${maxIdx}`;
    this.lastInferenceLatencyMs = Math.round(performance.now() - t0);

    return {
      label,
      gloss: label.toUpperCase().replace(/\s+/g, '-'),
      confidence: maxProb,
      timestamp: frame.timestamp || Date.now(),
      isFallback: false,
      modelType: 'tensorflow',
      notes: `TensorFlow.js neural model inference. Class index: ${maxIdx}. Latency: ${this.lastInferenceLatencyMs}ms.`,
    };
  }

  public getMemoryInfo(): { numTensors: number; numBytes: number } {
    try {
      const mem = tf.memory();
      return {
        numTensors: mem.numTensors,
        numBytes: mem.numBytes,
      };
    } catch {
      return { numTensors: 0, numBytes: 0 };
    }
  }

  public dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.demoFallback.dispose();
    try {
      tf.disposeVariables();
    } catch {
      // ignore
    }
    this.status = 'uninitialized';
  }
}

export const tfjsISLRecognizer = new TensorFlowISLRecognizer();
