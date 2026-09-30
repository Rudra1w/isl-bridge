import React from 'react';
import { ConversationMessage } from '@/types/conversation';
import {
  Volume2,
  Hand,
  RotateCcw,
  Trash2,
  Mic,
  Keyboard,
  Camera,
  Layers,
  User,
  Ear,
} from 'lucide-react';

interface ConversationBubbleProps {
  message: ConversationMessage;
  onSpeak: (message: ConversationMessage) => void;
  onSign: (message: ConversationMessage) => void;
  onReplay: (message: ConversationMessage) => void;
  onDelete: (id: string) => void;
}

export const ConversationBubble: React.FC<ConversationBubbleProps> = ({
  message,
  onSpeak,
  onSign,
  onReplay,
  onDelete,
}) => {
  const isSigner = message.sender === 'signer';

  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getSourceIcon = () => {
    switch (message.sourceType) {
      case 'speech':
        return (
          <span title="Speech input">
            <Mic className="w-3 h-3 text-emerald-400" />
          </span>
        );
      case 'typed':
        return (
          <span title="Keyboard typed">
            <Keyboard className="w-3 h-3 text-cyan-400" />
          </span>
        );
      case 'sign_camera':
        return (
          <span title="Webcam ISL Recognition">
            <Camera className="w-3 h-3 text-indigo-400" />
          </span>
        );
      case 'sign_selector':
        return (
          <span title="ISL Sign Palette">
            <Layers className="w-3 h-3 text-purple-400" />
          </span>
        );
      default:
        return null;
    }
  };

  const getSourceLabel = () => {
    switch (message.sourceType) {
      case 'speech':
        return 'Spoken Audio';
      case 'typed':
        return 'Typed English';
      case 'sign_camera':
        return 'Camera Vision';
      case 'sign_selector':
        return 'Sign Vocabulary';
      default:
        return 'Direct';
    }
  };

  return (
    <div
      className={`flex items-start gap-3 w-full group ${
        isSigner ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Hearing User Avatar */}
      {!isSigner && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md ring-1 ring-white/10 mt-1">
          <Ear className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 transition-all duration-150 ${
          isSigner
            ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-800/40 text-slate-100 shadow-xl shadow-indigo-950/20'
            : 'bg-slate-900/90 border border-slate-800 text-slate-100 shadow-lg'
        }`}
      >
        {/* Header: Sender & Source Metadata */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold">
            <span
              className={isSigner ? 'text-indigo-300' : 'text-emerald-300'}
            >
              {message.senderName}
            </span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400">
              {getSourceIcon()}
              <span className="hidden sm:inline">{getSourceLabel()}</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Primary Message Content */}
        <div className="py-2.5 space-y-2">
          {/* Natural English Sentence */}
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-0.5">
              {isSigner ? 'Generated English' : 'Original Spoken / Typed Text'}
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
              {message.text}
            </p>
          </div>

          {/* ISL Sign Gloss Tokens */}
          {message.gloss && message.gloss.length > 0 && (
            <div className="pt-1.5 border-t border-slate-800/60">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400/90 mb-1 flex items-center gap-1">
                <Hand className="w-3 h-3" />
                <span>ISL Sign Sequence</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {message.gloss.map((token, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-indigo-600/25 border border-indigo-500/40 text-indigo-200 font-mono text-xs font-bold shadow-sm"
                  >
                    [{token}]
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1">
            {/* Speak Button */}
            <button
              onClick={() => onSpeak(message)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              title="Speak sentence aloud via TTS"
            >
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>Speak</span>
            </button>

            {/* Sign Button */}
            <button
              onClick={() => onSign(message)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              title="Play visual ISL sign representation"
            >
              <Hand className="w-3 h-3 text-indigo-400" />
              <span>Sign</span>
            </button>

            {/* Replay Button */}
            <button
              onClick={() => onReplay(message)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
              title="Replay both sign sequence and speech"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Replay</span>
            </button>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(message.id)}
            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Delete message from history"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ISL Signer Avatar */}
      {isSigner && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md ring-1 ring-white/10 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
