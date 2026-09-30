import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { landmarkRecorder } from '@/modules/isl-recognition/LandmarkDatasetRecorder';
import { HandLandmarks } from '@/types/recognition';
import { Video, Download, Trash2, Radio, Layers, Sparkles } from 'lucide-react';

interface LandmarkRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeHands: HandLandmarks[];
}

export const LandmarkRecorderModal: React.FC<LandmarkRecorderModalProps> = ({
  isOpen,
  onClose,
  activeHands,
}) => {
  const [label, setLabel] = useState<string>('HELLO');
  const [mode, setMode] = useState<'static' | 'dynamic'>('static');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedFramesCount, setRecordedFramesCount] = useState<number>(0);
  const [sampleCounts, setSampleCounts] = useState<Record<string, number>>({});
  const [flashSuccess, setFlashSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSampleCounts(landmarkRecorder.getSamplesCountByClass());
    }
  }, [isOpen]);

  // Feed frames while recording is active
  useEffect(() => {
    if (!isRecording) return;

    if (activeHands.length > 0) {
      const result = landmarkRecorder.recordFrame(activeHands);
      setRecordedFramesCount(result.framesCount);

      if (result.isComplete) {
        setIsRecording(false);
        setSampleCounts(landmarkRecorder.getSamplesCountByClass());
        setFlashSuccess(true);
        setTimeout(() => setFlashSuccess(false), 1200);
      }
    }
  }, [isRecording, activeHands]);

  const handleStartRecording = () => {
    if (!label.trim()) return;
    landmarkRecorder.startRecording(label, mode);
    setIsRecording(true);
    setRecordedFramesCount(0);
  };

  const handleDownload = () => {
    landmarkRecorder.downloadDataset();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all recorded training samples?')) {
      landmarkRecorder.clearSamples();
      setSampleCounts({});
    }
  };

  const totalSamples = Object.values(sampleCounts).reduce((a, b) => a + b, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ISL Landmark Dataset Recording Tool"
      description="Record 3D hand landmark coordinates directly from your webcam to train and calibrate ISL neural classifiers."
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="danger"
            size="sm"
            onClick={handleClear}
            disabled={totalSamples === 0}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Samples
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={totalSamples === 0}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Download Dataset JSON ({totalSamples})
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Step 1: Label Input & Gesture Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
          <div>
            <label className="font-bold text-slate-300 block mb-1">
              Sign Label / Gloss Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value.toUpperCase())}
              placeholder="e.g. NAMASTE, HELLO, WATER"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 uppercase"
            />
          </div>

          <div>
            <label className="font-bold text-slate-300 block mb-1">Gesture Motion Type</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('static')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-colors ${
                  mode === 'static'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Radio className="w-3 h-3" />
                Static (1 frame)
              </button>

              <button
                type="button"
                onClick={() => setMode('dynamic')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border font-medium transition-colors ${
                  mode === 'dynamic'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <Layers className="w-3 h-3" />
                Dynamic (30 frames)
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Live Recording Trigger */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${activeHands.length > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-slate-400 text-[11px]">
              {activeHands.length > 0
                ? `${activeHands.length} hand(s) in webcam frame`
                : 'Position hands in front of camera'}
            </span>
          </div>

          <Button
            variant={isRecording ? 'danger' : 'accent'}
            size="lg"
            disabled={!label.trim() || activeHands.length === 0}
            onClick={handleStartRecording}
            leftIcon={isRecording ? <Video className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
            className="w-full sm:w-auto px-8"
          >
            {isRecording
              ? `Recording ${label} (${recordedFramesCount}/${mode === 'static' ? 1 : 30})...`
              : flashSuccess
              ? 'Sample Captured Successfully!'
              : `Record Sample for "${label}"`}
          </Button>

          {isRecording && mode === 'dynamic' && (
            <div className="w-full max-w-xs mt-3 bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-75"
                style={{ width: `${(recordedFramesCount / 30) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Step 3: Dataset Summary */}
        <div>
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
            Recorded Dataset Classes ({totalSamples} Total Samples)
          </span>

          {Object.keys(sampleCounts).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {Object.entries(sampleCounts).map(([cls, count]) => (
                <div
                  key={cls}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <span className="font-mono font-bold text-slate-200 truncate">{cls}</span>
                  <Badge variant="brand" size="sm">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center text-slate-500 italic text-[11px]">
              No samples recorded yet. Enter a label and click "Record Sample" while showing the sign.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
