import React, { useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SignPlayer } from '@/modules/sign-output/SignPlayer';
import { GlossTranslationResult } from '@/types/isl';

interface SignPlaybackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tokens: string[];
}

export const SignPlaybackModal: React.FC<SignPlaybackModalProps> = ({
  isOpen,
  onClose,
  title,
  tokens,
}) => {
  const dummyResult: GlossTranslationResult = useMemo(() => {
    return {
      sourceText: tokens.join(' '),
      tokens: tokens.map((token, idx) => ({
        id: `dialogue-${idx}-${token}`,
        originalWord: token,
        gloss: token,
        isFingerspelled: false,
      })),
      source: 'gemini',
      confidence: 0.95,
      linguisticNotes: [`Displaying authentic visual sign representations for [${tokens.join(' ')}]`],
      isFallback: false,
    };
  }, [tokens]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description="Visual sign sequence playback for conversation message."
      maxWidth="lg"
    >
      <div className="pt-1">
        <SignPlayer translationResult={dummyResult} />
      </div>
    </Modal>
  );
};
