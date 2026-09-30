import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  demoSimulationService,
  DEMO_SCENARIOS,
} from '@/modules/demo/demoSimulationService';
import {
  Play,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModeModal: React.FC<DemoModeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleLaunchScenario = (scenarioId: string) => {
    demoSimulationService.startDemo(scenarioId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hackathon Presentation Demo Mode"
      description="Simulate complete end-to-end communication workflows for stage evaluations or low-lighting environments."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Ethical Transparency Alert */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-amber-300">
                Linguistic & Scientific Transparency Notice
              </h5>
              <p className="mt-1 leading-relaxed opacity-90">
                Demo Mode uses <strong>pre-scripted, verified benchmark sequences</strong> to showcase the full bidirectional communication cycle. When active, an explicit banner is visible at the top of the application to ensure simulated data is never misrepresented as real-time AI inference.
              </p>
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Select a Presentation Scenario:
          </span>

          <div className="grid grid-cols-1 gap-2.5">
            {DEMO_SCENARIOS.map((scen, idx) => (
              <div
                key={scen.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {scen.title}
                    </h4>
                    <Badge variant="brand" size="sm">
                      {scen.steps.length} Steps
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                    {scen.description}
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLaunchScenario(scen.id)}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  Launch
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* What gets demonstrated checklist */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <span className="font-bold text-slate-300 block mb-1">What this demonstrates:</span>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulated ISL hand gesture recognition into text tokens</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spoken English voice transcript conversion into ISL Gloss</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Visual sign sequencing and audio speech synthesis playback</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
