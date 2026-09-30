import { Prediction } from '@/types/recognition';

export interface TemporalSmootherConfig {
  confidenceThreshold: number; // Minimum confidence to accept (e.g. 0.70)
  requiredConsecutiveFrames: number; // Must be consistent across N frames (e.g. 6)
  cooldownMs: number; // Minimum time before repeating the exact same sign (e.g. 1200ms)
}

export interface SmoothingResult {
  stablePrediction: Prediction | null;
  shouldCommit: boolean;
  committedWord: string | null;
}

export class TemporalSmoother {
  private config: TemporalSmootherConfig;
  private consecutiveCount = 0;
  private candidatePrediction: Prediction | null = null;
  private lastCommittedGloss: string | null = null;
  private lastCommitTimestamp = 0;

  constructor(
    config: Partial<TemporalSmootherConfig> = {}
  ) {
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 0.70,
      requiredConsecutiveFrames: config.requiredConsecutiveFrames ?? 6,
      cooldownMs: config.cooldownMs ?? 1200,
    };
  }

  public updateConfig(partial: Partial<TemporalSmootherConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  public getConfig(): TemporalSmootherConfig {
    return { ...this.config };
  }

  /**
   * Evaluates raw frame prediction against temporal stability, confidence thresholds, and cooldowns.
   */
  public process(rawPrediction: Prediction | null): SmoothingResult {
    const now = Date.now();

    // 1. Filter out predictions below confidence threshold
    if (!rawPrediction || rawPrediction.confidence < this.config.confidenceThreshold) {
      this.consecutiveCount = 0;
      this.candidatePrediction = null;
      return {
        stablePrediction: null,
        shouldCommit: false,
        committedWord: null,
      };
    }

    // 2. Track consecutive frame consistency
    if (this.candidatePrediction && this.candidatePrediction.gloss === rawPrediction.gloss) {
      this.consecutiveCount++;
    } else {
      this.candidatePrediction = rawPrediction;
      this.consecutiveCount = 1;
    }

    // 3. Check if stable threshold reached
    const isStable = this.consecutiveCount >= this.config.requiredConsecutiveFrames;

    if (!isStable) {
      return {
        stablePrediction: this.candidatePrediction,
        shouldCommit: false,
        committedWord: null,
      };
    }

    // 4. Enforce Cooldown & Duplicate Elimination
    // If it's the exact same word as last committed, enforce cooldown
    const isSameWord = this.lastCommittedGloss === rawPrediction.gloss;
    const timeSinceLastCommit = now - this.lastCommitTimestamp;

    if (isSameWord && timeSinceLastCommit < this.config.cooldownMs) {
      // Still in cooldown period for this sign
      return {
        stablePrediction: rawPrediction,
        shouldCommit: false,
        committedWord: null,
      };
    }

    // 5. Commit word!
    this.lastCommittedGloss = rawPrediction.gloss;
    this.lastCommitTimestamp = now;
    this.consecutiveCount = 0; // Reset after commit to prevent spamming

    return {
      stablePrediction: rawPrediction,
      shouldCommit: true,
      committedWord: rawPrediction.label,
    };
  }

  public reset(): void {
    this.consecutiveCount = 0;
    this.candidatePrediction = null;
    this.lastCommittedGloss = null;
    this.lastCommitTimestamp = 0;
  }
}
