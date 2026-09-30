import React, { useState, useEffect } from 'react';
import { Navbar, ActivePage } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SettingsModal } from '@/components/SettingsModal';
import { TwoWayPage } from '@/pages/TwoWayPage';
import { SignToTextPage } from '@/pages/SignToTextPage';
import { SpeechToSignPage } from '@/pages/SpeechToSignPage';
import { DictionaryPage } from '@/pages/DictionaryPage';
import { configManager } from '@/config/appConfig';
import { AppConfig } from '@/types/config';
import { Sliders, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('two-way');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<AppConfig>(configManager.getConfig());

  useEffect(() => {
    const unsubscribe = configManager.subscribe(setConfig);
    return () => unsubscribe();
  }, []);

  // Check if current page is disabled by feature flag
  const isPageEnabled = () => {
    switch (activePage) {
      case 'sign-to-text':
        return config.features.enableSignRecognition;
      case 'speech-to-sign':
        return config.features.enableSpeechRecognition || config.features.enableSignOutput;
      case 'two-way':
        return true;
      case 'dictionary':
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Global Navbar */}
      <Navbar
        activePage={activePage}
        onPageChange={setActivePage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        config={config}
      />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {isPageEnabled() ? (
          <>
            {activePage === 'two-way' && <TwoWayPage />}
            {activePage === 'sign-to-text' && <SignToTextPage />}
            {activePage === 'speech-to-sign' && <SpeechToSignPage />}
            {activePage === 'dictionary' && <DictionaryPage />}
          </>
        ) : (
          <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-100 mb-1">Module Disabled</h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              This capability is currently disabled via feature flags in your system configuration.
            </p>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Sliders className="w-3.5 h-3.5" />
              Open Settings to Enable
            </button>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default App;
