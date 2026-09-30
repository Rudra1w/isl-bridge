import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Search, BookOpen, Clock, ShieldCheck, Tag, Info, Eye } from 'lucide-react';
import { signAssetResolver } from '@/modules/sign-output/SignAssetResolver';
import { SignEntry } from '@/modules/sign-output/types';

interface SignDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSign?: (token: string) => void;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Signs', value: 'all' },
  { label: 'Greetings', value: 'greeting' },
  { label: 'Common & Pronouns', value: 'common' },
  { label: 'Time', value: 'time' },
  { label: 'Actions', value: 'action' },
  { label: 'Medical', value: 'medical' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Questions', value: 'query' },
];

export const SignDictionaryModal: React.FC<SignDictionaryModalProps> = ({
  isOpen,
  onClose,
  onSelectSign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSign, setSelectedSign] = useState<SignEntry | null>(null);

  const allSigns = useMemo(() => signAssetResolver.getAll(), []);

  const filteredSigns = useMemo(() => {
    return signAssetResolver.search(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified ISL Sign Dictionary"
      description="Local verified Indian Sign Language (ISL) vocabulary, handshapes, and linguistic attributions."
      maxWidth="2xl"
    >
      {/* Top Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sign token, English label, or gesture description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout: Grid + Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Left/Middle Column: Signs Grid */}
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>
              Showing <strong className="text-slate-200">{filteredSigns.length}</strong> of{' '}
              {allSigns.length} signs
            </span>
            <span className="text-[10px] text-slate-500">Local-first verified repository</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredSigns.map((sign) => {
              const isSelected = selectedSign?.token === sign.token;
              return (
                <button
                  key={sign.token}
                  onClick={() => setSelectedSign(sign)}
                  className={`group flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Thumbnail / Vector graphic */}
                  <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center p-1.5 mb-2 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                    {sign.type === 'svg' || sign.type === 'image' ? (
                      <img
                        src={sign.src}
                        alt={sign.label}
                        className="w-full h-full object-contain filter drop-shadow-sm"
                        loading="lazy"
                      />
                    ) : sign.type === 'video' ? (
                      <div className="text-indigo-400 font-mono text-xs font-bold">VIDEO</div>
                    ) : (
                      <div className="text-indigo-400 font-mono text-xs font-bold">{sign.token}</div>
                    )}
                  </div>

                  <span className="text-xs font-bold font-mono text-slate-100 group-hover:text-indigo-300">
                    {sign.token}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                    {sign.label}
                  </span>

                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                      {sign.type}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredSigns.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No signs match your search or filter.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Try searching for 'hello', 'water', or 'tomorrow'.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sign Inspector Details */}
        <div className="md:col-span-1 rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 flex flex-col justify-between">
          {selectedSign ? (
            <div className="space-y-3">
              <div className="text-center pb-2 border-b border-slate-800">
                <div className="w-24 h-24 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 mb-2 shadow-lg">
                  <img
                    src={selectedSign.src}
                    alt={selectedSign.label}
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <h4 className="text-sm font-bold font-mono text-white">{selectedSign.token}</h4>
                <p className="text-xs text-indigo-400 font-medium">{selectedSign.label}</p>
              </div>

              {/* Attributes */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Gesture Description
                  </span>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {selectedSign.description || 'Verified standard gesture.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" /> Category
                    </span>
                    <span className="text-[11px] font-medium text-slate-300 capitalize">
                      {selectedSign.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Duration
                    </span>
                    <span className="text-[11px] font-mono text-slate-300">
                      {selectedSign.durationMs || 1500} ms
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Origin & License
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Source: <strong className="text-slate-300">{selectedSign.source || 'ISLRTC'}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    License: <strong className="text-slate-300">{selectedSign.license || 'CC-BY-4.0'}</strong>
                  </p>
                  {selectedSign.attribution && (
                    <p className="text-[10px] text-slate-500 mt-0.5 italic">
                      Attribution: {selectedSign.attribution}
                    </p>
                  )}
                </div>
              </div>

              {onSelectSign && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      onSelectSign(selectedSign.token);
                      onClose();
                    }}
                  >
                    Select in Player
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
              <Eye className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs text-slate-400">Select any sign</p>
              <p className="text-[10px] text-slate-500 mt-1">
                View gesture mechanics, linguistic attribution, and timing specifications.
              </p>
            </div>
          )}

          {/* Local-first Notice */}
          <div className="mt-3 p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/30 text-[10px] text-indigo-300 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-400" />
            <span>
              All signs load directly from <code className="text-indigo-200">public/signs/</code>. No random web scraping.
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
