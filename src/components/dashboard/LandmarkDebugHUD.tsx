import React, { useState } from 'react';
import { HandLandmarks } from '@/types/recognition';
import { Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface LandmarkDebugHUDProps {
  landmarks: HandLandmarks[];
  fps: number;
  confidence: number;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const LandmarkDebugHUD: React.FC<LandmarkDebugHUDProps> = ({
  landmarks,
  fps,
  confidence,
  isOpen,
  onToggle,
  className = '',
}) => {
  const [selectedHandIndex, setSelectedHandIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'normalized' | 'bbox'>('raw');

  const activeHand = landmarks[selectedHandIndex] || landmarks[0] || null;

  const handleCopyJSON = () => {
    if (!activeHand) return;
    navigator.clipboard.writeText(JSON.stringify(activeHand, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const keypointNames: Record<number, string> = {
    0: 'Wrist',
    1: 'Thumb CMC',
    2: 'Thumb MCP',
    3: 'Thumb IP',
    4: 'Thumb Tip',
    5: 'Index MCP',
    6: 'Index PIP',
    7: 'Index DIP',
    8: 'Index Tip',
    9: 'Middle MCP',
    10: 'Middle PIP',
    11: 'Middle DIP',
    12: 'Middle Tip',
    13: 'Ring MCP',
    14: 'Ring PIP',
    15: 'Ring DIP',
    16: 'Ring Tip',
    17: 'Pinky MCP',
    18: 'Pinky PIP',
    19: 'Pinky DIP',
    20: 'Pinky Tip',
  };

  return (
    <div className={`rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden text-xs ${className}`}>
      {/* Top Bar Toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800/80 transition-colors text-slate-300 font-mono"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-bold text-[11px] text-white">
            Landmark Debug Inspector
          </span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
            {landmarks.length} Hand{landmarks.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span>{fps} FPS</span>
          {confidence > 0 && <span>• {(confidence * 100).toFixed(0)}% Conf</span>}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Debug Drawer */}
      {isOpen && (
        <div className="p-3.5 space-y-3 max-h-[300px] overflow-y-auto font-mono text-[11px] scrollbar-thin scrollbar-thumb-slate-800">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
            {/* Hand Switcher if two hands detected */}
            <div className="flex items-center gap-1.5">
              {landmarks.length > 0 ? (
                landmarks.map((h, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedHandIndex(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      selectedHandIndex === idx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {h.handedness} Hand #{idx + 1}
                  </button>
                ))
              ) : (
                <span className="text-slate-500 italic text-[10px]">No active hand data</span>
              )}
            </div>

            {/* View Mode Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeTab === 'raw' ? 'bg-indigo-500/30 text-indigo-200 font-bold' : 'text-slate-400'
                }`}
              >
                Raw (0-1)
              </button>
              <button
                onClick={() => setActiveTab('normalized')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeTab === 'normalized' ? 'bg-indigo-500/30 text-indigo-200 font-bold' : 'text-slate-400'
                }`}
              >
                Invariant (dx,dy,dz)
              </button>
              <button
                onClick={() => setActiveTab('bbox')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  activeTab === 'bbox' ? 'bg-indigo-500/30 text-indigo-200 font-bold' : 'text-slate-400'
                }`}
              >
                BBox
              </button>

              <button
                onClick={handleCopyJSON}
                disabled={!activeHand}
                title="Copy landmark JSON"
                className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 ml-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {activeHand ? (
            <div>
              {/* Telemetry metadata */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 mb-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Handedness: </span>
                  <span className="text-slate-200 font-bold">{activeHand.handedness}</span>
                </div>
                <div>
                  <span className="text-slate-500">Score: </span>
                  <span className="text-emerald-400 font-bold">
                    {(activeHand.score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* BBox Tab */}
              {activeTab === 'bbox' && activeHand.boundingBox && (
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-[11px]">
                  <div>xMin: {activeHand.boundingBox.xMin.toFixed(4)}</div>
                  <div>yMin: {activeHand.boundingBox.yMin.toFixed(4)}</div>
                  <div>xMax: {activeHand.boundingBox.xMax.toFixed(4)}</div>
                  <div>yMax: {activeHand.boundingBox.yMax.toFixed(4)}</div>
                  <div>Width: {activeHand.boundingBox.width.toFixed(4)}</div>
                  <div>Height: {activeHand.boundingBox.height.toFixed(4)}</div>
                </div>
              )}

              {/* Raw Coordinates Tab */}
              {activeTab === 'raw' && (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 text-[10px] text-slate-500 font-bold border-b border-slate-800 pb-1">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Name</span>
                    <span className="col-span-2">X</span>
                    <span className="col-span-2">Y</span>
                    <span className="col-span-2">Z</span>
                  </div>
                  {activeHand.landmarks.map((pt, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 text-[10px] text-slate-300 py-0.5 hover:bg-slate-900 rounded px-1"
                    >
                      <span className="col-span-1 text-slate-500">{idx}</span>
                      <span className="col-span-5 text-indigo-300 truncate">
                        {keypointNames[idx] || `Point ${idx}`}
                      </span>
                      <span className="col-span-2">{pt.x.toFixed(3)}</span>
                      <span className="col-span-2">{pt.y.toFixed(3)}</span>
                      <span className="col-span-2">{pt.z.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Normalized Scale-Invariant Coordinates Tab */}
              {activeTab === 'normalized' && activeHand.normalizedLandmarks && (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 text-[10px] text-slate-500 font-bold border-b border-slate-800 pb-1">
                    <span className="col-span-1">#</span>
                    <span className="col-span-5">Name</span>
                    <span className="col-span-2">dX</span>
                    <span className="col-span-2">dY</span>
                    <span className="col-span-2">dZ</span>
                  </div>
                  {activeHand.normalizedLandmarks.map((pt, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 text-[10px] text-slate-300 py-0.5 hover:bg-slate-900 rounded px-1"
                    >
                      <span className="col-span-1 text-slate-500">{idx}</span>
                      <span className="col-span-5 text-indigo-300 truncate">
                        {keypointNames[idx] || `Point ${idx}`}
                      </span>
                      <span className="col-span-2">{pt.x.toFixed(3)}</span>
                      <span className="col-span-2">{pt.y.toFixed(3)}</span>
                      <span className="col-span-2">{pt.z.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 text-[11px]">
              No hands currently visible. Position hand in front of camera to view live coordinates.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
