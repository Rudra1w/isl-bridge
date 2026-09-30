import React from 'react';
import { ConversationPanel } from '@/components/conversation/ConversationPanel';
import { MessageSquareText, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const ConversationPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Two-Way Conversation Bridge
              </h1>
              <Badge variant="brand" size="sm" dot>
                Live Dialogue
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Natural real-time dialogue connecting Indian Sign Language (ISL) users with spoken and typed English speakers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simultaneous 2-Way</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local & Private</span>
          </div>
        </div>
      </div>

      {/* Main Conversation Engine */}
      <ConversationPanel />
    </div>
  );
};
