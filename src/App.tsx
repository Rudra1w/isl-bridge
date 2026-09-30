import React, { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { ModeNavigation } from '@/components/layout/ModeNavigation';
import { Footer } from '@/components/Footer';
import { ConversationPage } from '@/pages/ConversationPage';
import { SignToTextPage } from '@/pages/SignToTextPage';
import { SpeechToTextPage } from '@/pages/SpeechToTextPage';
import { SpeechToSignPage } from '@/pages/SpeechToSignPage';
import { TextToSpeechPage } from '@/pages/TextToSpeechPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DictionaryPage } from '@/pages/DictionaryPage';
import { SettingsModal } from '@/components/SettingsModal';
import { KeyboardShortcutsModal } from '@/components/dashboard/KeyboardShortcutsModal';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import { configManager } from '@/config/appConfig';
import { AppConfig } from '@/types/config';
import { AppNavigationMode } from '@/types/conversation';

export const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppNavigationMode>('conversation');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<AppConfig>(configManager.getConfig());

  useEffect(() => {
    const unsubscribe = configManager.subscribe(setConfig);
    return () => unsubscribe();
  }, []);

  const renderActiveModeContent = () => {
    switch (activeMode) {
      case 'conversation':
        return <ConversationPage />;
      case 'sign-to-text':
        return (
          <SignToTextPage
            onNavigateToConversation={() => setActiveMode('conversation')}
          />
        );
      case 'speech-to-text':
        return (
          <SpeechToTextPage
            onNavigateToConversation={() => setActiveMode('conversation')}
          />
        );
      case 'text-to-sign':
        return (
          <SpeechToSignPage
            onNavigateToConversation={() => setActiveMode('conversation')}
          />
        );
      case 'text-to-speech':
        return (
          <TextToSpeechPage
            onNavigateToConversation={() => setActiveMode('conversation')}
          />
        );
      case 'dictionary':
        return <DictionaryPage />;
      case 'dashboard':
      default:
        return (
          <DashboardPage
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
        );
    }
  };

  return (
    <AccessibilityProvider>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
        {/* Universal Top Header */}
        <Header
          config={config}
          activeMode={activeMode}
          onModeChange={setActiveMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        {/* Global Mode Switcher Navigation Ribbon */}
        <ModeNavigation
          activeMode={activeMode}
          onModeChange={setActiveMode}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1">{renderActiveModeContent()}</main>

        {/* Global Modals accessible across all modes */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* Informational Footer */}
        <Footer />
      </div>
    </AccessibilityProvider>
  );
};

export default App;
