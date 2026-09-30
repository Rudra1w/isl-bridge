import { ResolvedSign, SequencePlayerState, PlayerStatus } from './types';

export type PlayerListener = (state: SequencePlayerState) => void;

/**
 * SignSequencePlayer: Sequential playback controller for ISL sign representation.
 *
 * Controls playback of sequenced sign assets:
 * - Handles static images, SVGs, and GIFs with configurable duration timers adjusted by playback speed.
 * - Handles videos by waiting for onended / video completion events before advancing.
 * - Supports autoplay, pause, next, previous, restart, seek, and variable playback speeds.
 */
export class SignSequencePlayer {
  private signs: ResolvedSign[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;
  private status: PlayerStatus = 'idle';
  private timer: any = null;
  private listeners: Set<PlayerListener> = new Set();
  private maxVideoTimeout: any = null;

  constructor(signs: ResolvedSign[] = [], initialSpeed: number = 1.0) {
    this.signs = signs;
    this.playbackSpeed = Math.max(0.5, Math.min(2.0, initialSpeed));
    this.currentIndex = 0;
    this.status = signs.length > 0 ? 'paused' : 'idle';
  }

  public subscribe(listener: PlayerListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('SignSequencePlayer listener error:', err);
      }
    });
  }

  public getState(): SequencePlayerState {
    const currentSign = this.signs[this.currentIndex] || null;
    const totalCount = this.signs.length;
    const progressPercent = totalCount > 0 ? Math.round(((this.currentIndex + 1) / totalCount) * 100) : 0;

    return {
      status: this.status,
      currentIndex: this.currentIndex,
      totalCount,
      playbackSpeed: this.playbackSpeed,
      isPlaying: this.isPlaying,
      currentSign,
      progressPercent,
    };
  }

  public setSequence(signs: ResolvedSign[], autoPlay: boolean = false): void {
    this.clearTimers();
    this.signs = signs;
    this.currentIndex = 0;
    this.isPlaying = autoPlay && signs.length > 0;
    this.status = signs.length === 0 ? 'idle' : this.isPlaying ? 'playing' : 'paused';
    this.notify();

    if (this.isPlaying) {
      this.scheduleCurrentSign();
    }
  }

  public play(): void {
    if (this.signs.length === 0) return;

    if (this.currentIndex >= this.signs.length - 1 && this.status === 'ended') {
      this.currentIndex = 0;
    }

    this.isPlaying = true;
    this.status = 'playing';
    this.notify();
    this.scheduleCurrentSign();
  }

  public pause(): void {
    this.clearTimers();
    this.isPlaying = false;
    this.status = 'paused';
    this.notify();
  }

  public togglePlayPause(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public restart(): void {
    this.clearTimers();
    this.currentIndex = 0;
    this.isPlaying = this.signs.length > 0;
    this.status = this.isPlaying ? 'playing' : 'idle';
    this.notify();

    if (this.isPlaying) {
      this.scheduleCurrentSign();
    }
  }

  public next(): void {
    this.clearTimers();
    if (this.currentIndex < this.signs.length - 1) {
      this.currentIndex += 1;
      this.notify();
      if (this.isPlaying) {
        this.scheduleCurrentSign();
      }
    } else {
      this.isPlaying = false;
      this.status = 'ended';
      this.notify();
    }
  }

  public previous(): void {
    this.clearTimers();
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      this.status = this.isPlaying ? 'playing' : 'paused';
      this.notify();
      if (this.isPlaying) {
        this.scheduleCurrentSign();
      }
    }
  }

  public seek(index: number): void {
    if (index < 0 || index >= this.signs.length) return;
    this.clearTimers();
    this.currentIndex = index;
    this.status = this.isPlaying ? 'playing' : 'paused';
    this.notify();

    if (this.isPlaying) {
      this.scheduleCurrentSign();
    }
  }

  public setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.5, Math.min(2.0, speed));
    this.notify();

    // If currently playing a timed asset, reschedule with new speed
    if (this.isPlaying) {
      const current = this.signs[this.currentIndex];
      if (current && current.type !== 'video') {
        this.clearTimers();
        this.scheduleCurrentSign();
      }
    }
  }

  /**
   * Called by video player component when the current video finishes playback.
   */
  public onVideoEnded(): void {
    if (!this.isPlaying) return;
    this.clearTimers();
    this.next();
  }

  /**
   * Called when an asset encounters a load error.
   */
  public onAssetError(): void {
    // If an asset fails to load, gracefully wait a brief moment and advance if playing
    if (this.isPlaying) {
      this.clearTimers();
      this.timer = setTimeout(() => {
        this.next();
      }, 1000);
    }
  }

  private scheduleCurrentSign(): void {
    this.clearTimers();
    if (!this.isPlaying || this.currentIndex >= this.signs.length) return;

    const sign = this.signs[this.currentIndex];
    if (!sign) return;

    if (sign.type === 'video') {
      // For video assets, advance is triggered by onVideoEnded().
      // Set a fallback guard timeout (e.g. 15s) in case video never triggers onended.
      this.maxVideoTimeout = setTimeout(() => {
        if (this.isPlaying && this.signs[this.currentIndex]?.id === sign.id) {
          this.next();
        }
      }, 15000);
      return;
    }

    // For images, GIFs, SVGs, or fingerspell cards, duration is scaled by playbackSpeed
    const baseDuration = sign.durationMs || 1500;
    const duration = Math.max(300, Math.round(baseDuration / this.playbackSpeed));

    this.timer = setTimeout(() => {
      this.next();
    }, duration);
  }

  private clearTimers(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.maxVideoTimeout) {
      clearTimeout(this.maxVideoTimeout);
      this.maxVideoTimeout = null;
    }
  }

  public destroy(): void {
    this.clearTimers();
    this.listeners.clear();
  }
}
