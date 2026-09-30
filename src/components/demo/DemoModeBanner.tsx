import React, { useState, useEffect } from 'react';
import {
  demoSimulationService,
  DemoStep,
} from '@/modules/demo/demoSimulationService';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  X,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { conversationService } from '@/services/conversationService';
import { useAccessibility } from '@/context/AccessibilityContext';

export const DemoModeBanner: React.FC = () => {
  const [isActive, setIsActive] = useState(demoSimulationService.isActive);
  const [isPlaying, setIsPlaying] = useState(demoSimulationService.isPlaying);
  const [, setTick] = useState(0);
  const { speakText } = useAccessibility();

  useEffect(() => {
    const unsub = demoSimulationService.subscribe(() => {
      setIsActive(demoSimulationService.isActive);
      setIsPlaying(demoSimulationService.isPlaying);
      setTick((t) => t + 1);
    });
    return () => unsub();
  }, []);

  if (!isActive) return null;

  const currentScenario = demoSimulationService.currentScenario;
  const currentStep = demoSimulationService.currentStep;
  const stepIndex = demoSimulationService.stepIndex;
  const totalSteps = currentScenario.steps.length;

  const handleApplyStep = (step: DemoStep | null) => {
    if (!step) return;

    if (step.source === 'isl_user' && step.signToken) {
      // Inject into conversation as ISL User
      conversationService.addMessage(
        'signer',
        'ISL Signer (Demo)',
        'sign_camera',
        step.signToken,
        [step.signToken],
        0.95
      );
      speakText(step.signToken.toLowerCase());
    } else if (step.source === 'hearing_user' && step.spokenText) {
      // Inject into conversation as Hearing User
      conversationService.addMessage(
        'hearing',
        'Hearing User (Demo)',
        'speech',
        step.spokenText,
        step.glossTokens || [step.spokenText.toUpperCase()],
        0.98
      );
    }
  };

  const handleNext = () => {
    const next = demoSimulationService.nextStep();
    if (next) handleApplyStep(next);
  };

  const handleAutoPlay = () => {
    demoSimulationService.toggleAutoPlay((step) => {
      handleApplyStep(step);
    });
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-950 via-slate-950 to-indigo-950 border-b-2 border-amber-500 shadow-2xl relative z-50 px-4 py-2.5">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Transparency Warning & Disclaimer */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wider text-amber-300">
                Demo Simulation Mode Active
              </span>
              <Badge variant="warning" size="sm">
                Stage / Offline Replay
              </Badge>
            </div>
            <p className="text-[11px] text-slate-300 opacity-90 mt-0.5">
              Simulated demonstration sequence. Pre-recorded benchmarks for presentations; <strong>NOT</strong> real-time webcam inference.
            </p>
          </div>
        </div>

        {/* Center: Scenario Selection & Current Step Info */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <select
            value={currentScenario.id}
            onChange={(e) => demoSimulationService.setScenario(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold text-xs focus:outline-none cursor-pointer"
          >
            {demoSimulationService.scenarios.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                {s.title}
              </option>
            ))}
          </select>

          <span className="text-slate-600">|</span>

          <span className="text-[11px] font-mono text-slate-400">
            Step {stepIndex + 1}/{totalSteps}:
          </span>

          <span className="text-[11px] font-bold text-amber-300 truncate max-w-xs sm:max-w-sm">
            {currentStep?.actionDescription || 'End of scenario'}
          </span>
        </div>

        {/* Right: Interactive Step & Playback Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAutoPlay}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            title="Auto-play all steps with timed intervals"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>

          <button
            onClick={handleNext}
            disabled={stepIndex >= totalSteps - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition-colors"
            title="Advance to next simulated step"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Next Step</span>
          </button>

          <button
            onClick={() => demoSimulationService.resetScenario()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset current scenario"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => demoSimulationService.stopDemo()}
            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white transition-colors ml-1"
            title="Exit Demo Simulation Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
