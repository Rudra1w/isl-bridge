import { useState, useEffect, useRef } from 'react';
import { ResolvedSign, SequencePlayerState } from './types';
import { SignSequencePlayer } from './SignSequencePlayer';

export function useSignSequencePlayer(
  signs: ResolvedSign[],
  initialSpeed: number = 1.0,
  autoPlay: boolean = true
) {
  const playerRef = useRef<SignSequencePlayer | null>(null);

  if (!playerRef.current) {
    playerRef.current = new SignSequencePlayer(signs, initialSpeed);
  }

  const [state, setState] = useState<SequencePlayerState>(() =>
    playerRef.current!.getState()
  );

  useEffect(() => {
    const player = playerRef.current!;
    const unsubscribe = player.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  // Whenever sequence changes, update player
  useEffect(() => {
    playerRef.current?.setSequence(signs, autoPlay);
  }, [signs, autoPlay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  return {
    ...state,
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    togglePlayPause: () => playerRef.current?.togglePlayPause(),
    restart: () => playerRef.current?.restart(),
    next: () => playerRef.current?.next(),
    previous: () => playerRef.current?.previous(),
    seek: (idx: number) => playerRef.current?.seek(idx),
    setPlaybackSpeed: (speed: number) => playerRef.current?.setPlaybackSpeed(speed),
    onVideoEnded: () => playerRef.current?.onVideoEnded(),
    onAssetError: () => playerRef.current?.onAssetError(),
  };
}
