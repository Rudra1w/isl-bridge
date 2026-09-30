import React, { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Footer } from '@/components/Footer';
import { DashboardPage } from '@/pages/DashboardPage';
import { DictionaryPage } from '@/pages/DictionaryPage';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { configManager } from '@/config/appConfig';
import { AppConfig } from '@/types/config';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'dashboard' | 'dictionary'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<AppConfig>(configManager.getConfig());

  useEffect(() => {
    const unsubscribe = configManager.subscribe(setConfig);
    return () => unsubscribe();
  }, []);

  return (
    <AccessibilityProvider>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
        {/* Universal Top Header */}
        <Header
          config={config}
          activePage={activePage}
          onPageChange={setActivePage}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1">
          {activePage === 'dashboard' ? (
            <DashboardPage
              isSettingsOpen={isSettingsOpen}
              isShortcutsOpen={isShortcutsOpen}
              onOpenShortcuts={() => setIsShortcutsOpen(true)}
              onCloseSettings={() => setIsSettingsOpen(false)}
              onCloseShortcuts={() => setIsShortcutsOpen(false)}
            />
          ) : (
            <DictionaryPage />
          )}
        </main>

        {/* Informational Footer */}
        <Footer />
      </div>
    </AccessibilityProvider>
  );
};

export default App;
