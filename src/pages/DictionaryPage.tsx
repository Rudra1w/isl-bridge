import React, { useState, useMemo } from 'react';
import { DictionaryService } from '@/services/dictionaryService';
import { SignAsset } from '@/types/isl';
import { Search, Info } from 'lucide-react';

export const DictionaryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSign, setActiveSign] = useState<SignAsset | null>(null);

  const categories = useMemo(() => {
    return ['all', ...DictionaryService.getCategories()];
  }, []);

  const filteredSigns = useMemo(() => {
    let list = DictionaryService.searchSigns(searchQuery);
    if (selectedCategory !== 'all') {
      list = list.filter((s) => s.category === selectedCategory);
    }
    return list;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Indian Sign Language (ISL) Lexicon & Dictionary
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore authentic ISL vocabulary, two-handed alphabet fingerspelling, and standard gestures.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search signs, words, or letters..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Signs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredSigns.map((sign) => (
          <div
            key={sign.token}
            onClick={() => setActiveSign(sign)}
            className={`cursor-pointer rounded-2xl p-4 bg-slate-900/90 border transition-all duration-200 flex flex-col items-center justify-between group hover:border-indigo-500/60 hover:shadow-lg hover:shadow-indigo-600/10 ${
              activeSign?.token === sign.token
                ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                : 'border-slate-800'
            }`}
          >
            {/* Visual preview */}
            <div className="w-24 h-24 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-800/80 mb-3 group-hover:scale-105 transition-transform">
              <img
                src={sign.url}
                alt={sign.label}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center w-full">
              <div className="text-xs font-bold font-mono text-slate-100 truncate">
                {sign.token}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {sign.label}
              </div>
              {sign.category && (
                <span className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize">
                  {sign.category}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Detail Drawer when a sign is clicked */}
      {activeSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveSign(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-48 h-48 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 p-3 mb-4 shadow-inner">
                <img
                  src={activeSign.url}
                  alt={activeSign.label}
                  className="w-full h-full object-contain"
                />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 mb-1">
                {activeSign.category || 'General'}
              </span>

              <h3 className="text-xl font-bold font-mono text-white mb-1">
                {activeSign.token}
              </h3>
              <p className="text-xs font-semibold text-slate-300 mb-3">
                {activeSign.label}
              </p>

              {activeSign.description && (
                <div className="w-full p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-left text-xs text-slate-400 leading-relaxed mb-4">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    How to perform this sign:
                  </div>
                  {activeSign.description}
                </div>
              )}

              <button
                onClick={() => setActiveSign(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
