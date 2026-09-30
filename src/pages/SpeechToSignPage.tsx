import React, { useState } from 'react';
import { SpeechInputPanel } from '@/modules/speech/SpeechInputPanel';
import { useISLGloss } from '@/modules/nlp/useISLGloss';
import { SignPlayer } from '@/modules/sign-output/SignPlayer';
import { ArrowRight, Sparkles, Lightbulb, AlertCircle } from 'lucide-react';
import { StorageService } from '@/services/storageService';

const SAMPLE_SENTENCES = [
  'What is your name?',
  'Hello, I need water please.',
  'Where is the hospital?',
  'Thank you, I am going home tomorrow.',
  'Doctor, please help me.',
  'Namaste, welcome to my home.',
];

export const SpeechToSignPage: React.FC = () => {
  const [textInput, setTextInput] = useState<string>('');
  const { result, isLoading, error, translate } = useISLGloss();

  const handleTranslate = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    translate(trimmed);

    StorageService.addHistory({
      type: 'speech-to-sign',
      input: trimmed,
      output: 'ISL Gloss generated',
    });
  };

  const handleSampleClick = (sample: string) => {
    setTextInput(sample);
    handleTranslate(sample);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Speech / Text → Visual ISL Sign Translation
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Speak into the microphone or type below. Sentences are translated into ISL gloss notation and played sequentially using authentic sign representations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Options (Speech & Manual Input) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Microphone Speech Panel */}
          <SpeechInputPanel
            onTranscriptChange={(finalText) => {
              setTextInput(finalText);
              handleTranslate(finalText);
            }}
          />

          {/* Manual Text Input Card */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
            <h2 className="font-semibold text-slate-100 text-sm mb-3">Or Type Any Sentence</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTranslate(textInput);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <textarea
                  rows={3}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g. Where is the doctor? I need help tomorrow."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {textInput.length} characters
                </span>
                <button
                  type="submit"
                  disabled={!textInput.trim() || isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      Translate to Signs
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Sample Prompts */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Common Conversation Prompts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_SENTENCES.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleClick(sample)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] text-slate-300 transition-colors border border-slate-700/50"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Visual ISL Sign Player */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Translation Notice: </span>
                {error}
              </div>
            </div>
          )}

          <SignPlayer translationResult={result} />
        </div>
      </div>
    </div>
  );
};
