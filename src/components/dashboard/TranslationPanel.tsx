import React, { useState } from 'react';
import { MessageSquare, RotateCcw, Delete, Volume2, Copy, Check, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatConfidence } from '@/utils/formatters';
import { SignPrediction } from '@/types/recognition';

export interface RecognitionHistoryItem {
  id: string;
  signId: string;
  label: string;
  gloss: string;
  confidence: number;
  timestamp: Date;
}

interface TranslationPanelProps {
  currentSign: SignPrediction | null;
  recognizedSentence: string[];
  recognitionHistory: RecognitionHistoryItem[];
  onClear: () => void;
  onUndo: () => void;
  onSpeak: () => void;
  className?: string;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  currentSign,
  recognizedSentence,
  recognitionHistory,
  onClear,
  onUndo,
  onSpeak,
  className = '',
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const sentenceText = recognizedSentence.join(' ');

  const handleCopy = () => {
    if (!sentenceText) return;
    navigator.clipboard.writeText(sentenceText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className={`flex flex-col h-full border-slate-800 ${className}`}>
      {/* Header */}
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Sign Translation & Sentence</CardTitle>
            <span className="text-[11px] text-slate-400">Continuous ISL Gesture Stream</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="neutral" size="sm">
            {recognizedSentence.length} word{recognizedSentence.length === 1 ? '' : 's'}
          </Badge>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="space-y-4">
        {/* Active Recognized Sign Callout */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Current Recognized Sign
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                {currentSign ? currentSign.label : 'Waiting for gesture...'}
              </span>
              {currentSign && (
                <span className="text-xs font-mono text-indigo-400 font-semibold">
                  ({currentSign.gloss})
                </span>
              )}
            </div>
          </div>

          {currentSign ? (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block mb-0.5">Confidence</span>
              <Badge variant="success" size="sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                {formatConfidence(currentSign.confidence)}
              </Badge>
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
          )}
        </div>

        {/* Current Sentence Accumulator Canvas */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Accumulated Sentence
            </label>
            <span className="text-[10px] text-slate-500">Live sentence output</span>
          </div>

          <div
            tabIndex={0}
            aria-label="Accumulated sentence from sign gestures"
            className="min-h-[110px] p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-wrap items-start content-start gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {recognizedSentence.length > 0 ? (
              recognizedSentence.map((word, idx) => (
                <span
                  key={`${word}-${idx}`}
                  className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 text-sm font-semibold animate-in fade-in zoom-in-95 duration-150 shadow-sm"
                >
                  {word}
                </span>
              ))
            ) : (
              <div className="w-full h-20 flex flex-col items-center justify-center text-slate-500 text-xs text-center select-none">
                <span>Gestures detected by camera will compile here as an English sentence.</span>
                <span className="text-[10px] text-slate-600 mt-1">
                  Try gestures like "Hello", "Namaste", or count with fingers.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls for Sentence */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={recognizedSentence.length === 0}
              leftIcon={<Delete className="w-3.5 h-3.5" />}
              title="Remove last recognized sign (Shortcut: Z)"
            >
              Undo Sign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={recognizedSentence.length === 0}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Clear sentence (Shortcut: X)"
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onSpeak}
              disabled={!sentenceText}
              leftIcon={<Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
              title="Speak sentence using Text-to-Speech (Shortcut: S)"
            >
              Speak
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopy}
              disabled={!sentenceText}
              leftIcon={
                copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />
              }
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Timestamped Recognition History Stream */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              Recent Recognition Feed
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {recognitionHistory.length} events
            </span>
          </div>

          <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {recognitionHistory.length > 0 ? (
              recognitionHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-100">{item.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">[{item.gloss}]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {formatConfidence(item.confidence)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-600 italic">
                Recognition history will log here as gestures are identified.
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <span className="text-[11px] text-slate-500">
          Temporal hysteresis smoothing active (150ms pose confirmation)
        </span>
      </CardFooter>
    </Card>
  );
};
