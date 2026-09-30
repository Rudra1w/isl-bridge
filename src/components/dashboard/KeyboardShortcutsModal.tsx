import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  description: string;
  category: 'Vision & Camera' | 'Speech & Audio' | 'Translation & Editing' | 'Navigation';
}

const SHORTCUTS: ShortcutItem[] = [
  { key: 'Space', description: 'Start / Stop microphone recording', category: 'Speech & Audio' },
  { key: 'C', description: 'Toggle webcam continuous stream', category: 'Vision & Camera' },
  { key: 'S', description: 'Speak recognized sentence aloud (TTS)', category: 'Speech & Audio' },
  { key: 'Z', description: 'Undo / remove last recognized sign', category: 'Translation & Editing' },
  { key: 'X', description: 'Clear accumulated sentence', category: 'Translation & Editing' },
  { key: 'F', description: 'Toggle camera fullscreen view', category: 'Vision & Camera' },
  { key: '?', description: 'Open this keyboard shortcuts guide', category: 'Navigation' },
  { key: 'Esc', description: 'Close modals or active popups', category: 'Navigation' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Accessibility Shortcuts"
      description="Quick single-key controls designed for high accessibility and efficient usage without a mouse."
      maxWidth="lg"
      footer={
        <Button variant="primary" size="md" onClick={onClose}>
          Got it
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 text-xs text-indigo-300">
          <Command className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Shortcuts are active when you are not currently typing into a text field or search bar.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
            >
              <span className="text-slate-300 font-medium">{s.description}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-indigo-300 font-mono font-bold text-xs shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
