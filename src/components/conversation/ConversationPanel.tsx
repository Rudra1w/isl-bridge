import React, { useState, useEffect, useRef } from 'react';
import { conversationService } from '@/services/conversationService';
import { ConversationMessage } from '@/types/conversation';
import { ConversationBubble } from './ConversationBubble';
import { SignPlaybackModal } from './SignPlaybackModal';
import { ISLGlossEngine } from '@/modules/nlp/islGlossEngine';
import { speechSynthesisService } from '@/modules/speech/SpeechSynthesisService';
import { speechEngine } from '@/modules/speech/SpeechRecognitionEngine';
import { useHandTracking } from '@/modules/camera/useHandTracking';
import { tfjsISLRecognizer } from '@/modules/isl-recognition/TensorFlowISLRecognizer';
import { TemporalSmoother } from '@/modules/isl-recognition/TemporalSmoother';
import {
  Mic,
  MicOff,
  Send,
  VideoOff,
  RotateCcw,
  Trash2,
  Ear,
  Hand,
  Volume2,
  Sparkles,
  Delete,
  Keyboard,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const ConversationPanel: React.FC = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>(() =>
    conversationService.getMessages()
  );

  // Hearing Side State
  const [hearingInputType, setHearingInputType] = useState<'speech' | 'typed'>('speech');
  const [typedText, setTypedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState('');
  const [isTranslatingHearing, setIsTranslatingHearing] = useState(false);

  // Signer Side State
  const [signerTokens, setSignerTokens] = useState<string[]>([]);
  const [currentPredictedSign, setCurrentPredictedSign] = useState<string | null>(null);
  const [autoSpeakSigner, setAutoSpeakSigner] = useState(true);

  // Sign Playback Modal
  const [playbackModal, setPlaybackModal] = useState<{
    isOpen: boolean;
    title: string;
    tokens: string[];
  }>({
    isOpen: false,
    title: '',
    tokens: [],
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Smoother instance for stable predictions & duplicate prevention
  const smootherRef = useRef(
    new TemporalSmoother({
      confidenceThreshold: 0.7,
      requiredConsecutiveFrames: 6,
      cooldownMs: 1400,
    })
  );
  const isPredictingRef = useRef(false);

  // Hand Tracking Camera
  const {
    videoRef,
    canvasRef,
    landmarks,
    isRunning: isCameraRunning,
    startCamera,
    stopCamera,
    fps,
  } = useHandTracking(false);

  // Subscribe to conversation messages
  useEffect(() => {
    const unsub = conversationService.subscribe((updated) => {
      setMessages(updated);
    });
    return () => unsub();
  }, []);

  // Auto scroll to bottom when message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition Listener
  useEffect(() => {
    const unsub = speechEngine.subscribe((state) => {
      setIsListening(state.isListening);
      if (state.interimTranscript) {
        setSpeechInterim(state.interimTranscript);
      }
      if (state.finalTranscript) {
        setTypedText(state.finalTranscript);
        setSpeechInterim('');
      }
    });
    return () => unsub();
  }, []);

  // Computer Vision Sign Classification Loop
  useEffect(() => {
    if (landmarks.length === 0) {
      smootherRef.current.process(null);
      setCurrentPredictedSign(null);
      return;
    }

    let isMounted = true;

    const runInference = async () => {
      if (isPredictingRef.current) return;
      isPredictingRef.current = true;

      try {
        const raw = await tfjsISLRecognizer.predict({
          hands: landmarks,
          timestamp: Date.now(),
        });

        if (!isMounted) return;

        const { stablePrediction, shouldCommit, committedWord } =
          smootherRef.current.process(raw);

        if (stablePrediction) {
          setCurrentPredictedSign(stablePrediction.gloss || stablePrediction.label);
        } else {
          setCurrentPredictedSign(null);
        }

        // Duplicate prevention & commit check
        if (shouldCommit && committedWord) {
          const upper = committedWord.toUpperCase().trim();
          setSignerTokens((prev) => {
            // Prevent exact consecutive duplicate word if just added
            if (prev.length > 0 && prev[prev.length - 1] === upper) {
              return prev;
            }
            return [...prev, upper];
          });
        }
      } catch (err) {
        console.warn('Vision inference frame error:', err);
      } finally {
        isPredictingRef.current = false;
      }
    };

    runInference();

    return () => {
      isMounted = false;
    };
  }, [landmarks]);

  // Toggle Microphone
  const toggleMicrophone = async () => {
    if (isListening) {
      speechEngine.stop();
    } else {
      await speechEngine.start();
    }
  };

  // Submit Hearing User Message
  const handleSendHearingMessage = async () => {
    const textToSend = typedText.trim() || speechInterim.trim();
    if (!textToSend || isTranslatingHearing) return;

    setIsTranslatingHearing(true);
    try {
      // 1. NLP translation into ISL gloss tokens
      const nlpEngine = ISLGlossEngine.getInstance();
      const result = await nlpEngine.translateTextToGloss(textToSend);

      const glossTokens =
        result.tokens.length > 0
          ? result.tokens.map((t) => t.gloss || t.originalWord)
          : textToSend.toUpperCase().split(/\s+/);

      // 2. Add message to conversation service
      conversationService.addMessage(
        'hearing',
        'Hearing User',
        hearingInputType === 'speech' ? 'speech' : 'typed',
        textToSend,
        glossTokens,
        result.confidence || 0.95
      );

      // 3. Clear inputs
      setTypedText('');
      setSpeechInterim('');
      speechEngine.clear();
    } catch (e) {
      console.error('Failed to translate and send hearing message:', e);
    } finally {
      setIsTranslatingHearing(false);
    }
  };

  // Submit Signer User Message
  const handleSendSignerMessage = () => {
    if (signerTokens.length === 0) return;

    const naturalText = signerTokens.join(' ');

    // 1. Add message
    conversationService.addMessage(
      'signer',
      'ISL Signer',
      isCameraRunning ? 'sign_camera' : 'sign_selector',
      naturalText,
      [...signerTokens],
      0.94
    );

    // 2. Automatic text-to-speech for hearing user if enabled
    if (autoSpeakSigner) {
      speechSynthesisService.speak(naturalText);
    }

    // 3. Reset signer tokens
    setSignerTokens([]);
  };

  // Quick token injection for signer
  const handleQuickAddToken = (token: string) => {
    setSignerTokens((prev) => {
      if (prev.length > 0 && prev[prev.length - 1] === token) {
        return prev;
      }
      return [...prev, token];
    });
  };

  // Bubble Action Handlers
  const handleBubbleSpeak = (msg: ConversationMessage) => {
    speechSynthesisService.speak(msg.text || msg.gloss.join(' '));
  };

  const handleBubbleSign = (msg: ConversationMessage) => {
    const tokens = msg.gloss && msg.gloss.length > 0 ? msg.gloss : msg.text.toUpperCase().split(' ');
    setPlaybackModal({
      isOpen: true,
      title: `${msg.senderName}: "${msg.text}"`,
      tokens,
    });
  };

  const handleBubbleReplay = (msg: ConversationMessage) => {
    handleBubbleSpeak(msg);
    handleBubbleSign(msg);
  };

  const handleBubbleDelete = (id: string) => {
    conversationService.deleteMessage(id);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header & Conversation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Two-Way Conversation Session
              <Badge variant="brand" size="sm">
                Active Dialogue
              </Badge>
            </h2>
            <p className="text-[11px] text-slate-400">
              Hearing English Speaker ↔ Deaf / ISL Signer live communication
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => conversationService.resetToSample()}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            title="Reset conversation to demo sample"
          >
            Reset Sample
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => conversationService.clearConversation()}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
            title="Clear all conversation messages"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 min-h-[380px] max-h-[460px] overflow-y-auto space-y-4 shadow-inner scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <Sparkles className="w-8 h-8 mb-2 opacity-40 text-indigo-400" />
            <p className="text-xs font-semibold text-slate-300">Conversation thread is empty</p>
            <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
              Speak or type on the Hearing Side, or sign into the camera on the Signer Side to begin your two-way dialogue.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ConversationBubble
              key={msg.id}
              message={msg}
              onSpeak={handleBubbleSpeak}
              onSign={handleBubbleSign}
              onReplay={handleBubbleReplay}
              onDelete={handleBubbleDelete}
            />
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Dual Interaction Columns: Side A (Hearing) & Side B (Signer) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ========================================================================= */}
        {/* SIDE A: HEARING USER (Mic or Keyboard -> Text -> ISL Gloss) */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Ear className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Hearing User Input
                </span>
              </div>

              {/* Mode switch: Speech vs Typed */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800">
                <button
                  onClick={() => setHearingInputType('speech')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    hearingInputType === 'speech'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  Voice
                </button>
                <button
                  onClick={() => setHearingInputType('typed')}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    hearingInputType === 'typed'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Keyboard className="w-3 h-3" />
                  Type
                </button>
              </div>
            </div>

            {/* Input Form */}
            <div className="py-3 space-y-2.5">
              {hearingInputType === 'speech' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMicrophone}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
                      isListening
                        ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        Stop Mic
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Start Speaking
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-400">
                    {isListening
                      ? 'Listening in English (India)...'
                      : 'Click microphone to capture voice'}
                  </span>
                </div>
              )}

              {/* Text Input area */}
              <div className="relative">
                <textarea
                  rows={2}
                  value={typedText || speechInterim}
                  onChange={(e) => setTypedText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendHearingMessage();
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Listening to speech...'
                      : 'Type message for signer (e.g., Where are you going?)...'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Sample Quick Hearing Phrases */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Where are you going?',
                  'How are you?',
                  'I need a doctor please',
                  'Thank you very much',
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setTypedText(sample)}
                    className="px-2 py-0.5 rounded-md bg-slate-950/80 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 border border-slate-800/80 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">
              Translates to ISL Gloss Sequence
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendHearingMessage}
              disabled={!(typedText.trim() || speechInterim.trim()) || isTranslatingHearing}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isTranslatingHearing ? 'Translating...' : 'Send to Signer'}
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SIDE B: ISL SIGNER (Webcam Vision or Sign Palette -> Sentence -> TTS) */}
        {/* ========================================================================= */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Hand className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-200">
                  ISL Signer Input
                </span>
              </div>

              {/* Camera toggle */}
              <button
                onClick={isCameraRunning ? () => stopCamera() : () => startCamera()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCameraRunning
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isCameraRunning ? (
                  <>
                    <VideoOff className="w-3.5 h-3.5" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Start Camera
                  </>
                )}
              </button>
            </div>

            {/* Video preview / Detection strip */}
            <div className="py-2.5 space-y-2">
              {isCameraRunning ? (
                <div className="relative aspect-video max-h-[140px] w-full rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100"
                  />

                  {/* Real-time sign prediction badge */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-slate-400">Sign:</span>
                    <strong className="text-indigo-300 font-mono">
                      {currentPredictedSign || 'Detecting...'}
                    </strong>
                    <span className="text-slate-500">({fps} FPS)</span>
                  </div>
                </div>
              ) : null}

              {/* Active Sentence Builder Strip */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="font-semibold uppercase tracking-wider">
                    Sign Sentence Builder
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSignerTokens((p) => p.slice(0, -1))}
                      disabled={signerTokens.length === 0}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-40"
                      title="Remove last sign"
                    >
                      <Delete className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setSignerTokens([])}
                      disabled={signerTokens.length === 0}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-40"
                      title="Clear tokens"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                  {signerTokens.length > 0 ? (
                    signerTokens.map((token, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 font-mono text-xs font-bold flex items-center gap-1"
                      >
                        {token}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-600 italic">
                      {isCameraRunning
                        ? 'Perform signs in front of camera or click quick tokens below...'
                        : 'Click tokens below or start camera to sign...'}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Sign Token Palette */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Quick ISL Lexicon Tokens:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[
                    'HELLO',
                    'NAMASTE',
                    'ME',
                    'YOU',
                    'COLLEGE',
                    'SCHOOL',
                    'GO',
                    'WATER',
                    'FOOD',
                    'HELP',
                    'HOSPITAL',
                    'DOCTOR',
                    'WHERE',
                    'YES',
                    'NO',
                    'THANK-YOU',
                  ].map((tok) => (
                    <button
                      key={tok}
                      onClick={() => handleQuickAddToken(tok)}
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono font-semibold text-slate-300 hover:text-indigo-300 transition-colors border border-slate-700/60"
                    >
                      +{tok}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSpeakSigner}
                onChange={(e) => setAutoSpeakSigner(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <Volume2 className="w-3 h-3 text-emerald-400" />
              <span>Auto-Speak (TTS) for Hearing User</span>
            </label>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSendSignerMessage}
              disabled={signerTokens.length === 0}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Send to Speaker
            </Button>
          </div>
        </div>
      </div>

      {/* Sign Sequence Playback Modal for Bubble Preview */}
      <SignPlaybackModal
        isOpen={playbackModal.isOpen}
        onClose={() => setPlaybackModal({ isOpen: false, title: '', tokens: [] })}
        title={playbackModal.title}
        tokens={playbackModal.tokens}
      />
    </div>
  );
};
