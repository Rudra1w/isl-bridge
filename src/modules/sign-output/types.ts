export type SignAssetType = 'image' | 'gif' | 'video' | 'svg' | 'fingerspell';

export type SignCategory =
  | 'greeting'
  | 'number'
  | 'alphabet'
  | 'common'
  | 'medical'
  | 'query'
  | 'time'
  | 'action'
  | 'emergency';

export interface SignEntry {
  token: string;
  label: string;
  type: SignAssetType;
  src: string;
  fallbackSrc?: string;
  remoteUrl?: string;
  durationMs?: number; // Duration to display static image/SVG (ms)
  category: SignCategory;
  description?: string;
  source?: string;       // e.g. "ISL Bridge Local Library", "Deaf Enabled Foundation"
  license?: string;      // e.g. "CC-BY-4.0", "MIT", "Open Access"
  attribution?: string;  // Explicit attribution credits
}

export interface ResolvedSign {
  id: string;
  token: string;
  label: string;
  type: SignAssetType;
  src: string;
  durationMs: number;
  isAvailable: boolean;
  isFingerspelled: boolean;
  category?: SignCategory;
  description?: string;
  source?: string;
  license?: string;
  attribution?: string;
  note?: string;
}

export type PlayerStatus =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'loading'
  | 'error';

export interface SequencePlayerState {
  status: PlayerStatus;
  currentIndex: number;
  totalCount: number;
  playbackSpeed: number; // 0.5 to 2.0
  isPlaying: boolean;
  currentSign: ResolvedSign | null;
  progressPercent: number;
}
