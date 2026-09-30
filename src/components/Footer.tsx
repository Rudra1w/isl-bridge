import { Info, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-slate-300 font-semibold mb-0.5">ISL Linguistic Integrity Notice</h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Indian Sign Language (ISL) is an authentic, independent visual-spatial natural language with its own morphology, spatial syntax, and non-manual markers. It is not a code for spoken English. Gloss transformations generated here are algorithmic approximations designed to assist communication and remain extensible for validated linguistic neural models.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span>Built for the Deaf & Hard-of-Hearing Community across India</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side Privacy
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>React + TypeScript + Vite</span>
            <span>•</span>
            <span>MediaPipe Hands</span>
            <span>•</span>
            <span>Web Speech API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
