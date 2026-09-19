import React from 'react';
import { AppProvider, useApp } from './state/AppContext';
import { ThemeProvider } from './state/ThemeContext';
import { PresentationProvider } from './state/PresentationContext';
import { Navbar } from './components/common/Navbar';
import { HelpModal } from './components/common/HelpModal';
import { SettingsModal } from './components/common/SettingsModal';
import { LibraryView } from './components/library/LibraryView';
import { EditorLayout } from './components/editor/EditorLayout';
import { PresentationView } from './components/presentation/PresentationView';
import { RecordingView } from './components/recording/RecordingView';
import { AudioStudioView } from './components/audio/AudioStudioView';
import { ImportCenterView } from './components/import/ImportCenterView';
import { LearningView } from './components/learning/LearningView';

const AppContent: React.FC = () => {
  const { view } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-200 selection:text-stone-900 transition-colors">
      {/* Standalone Fullscreen / Dedicated Views */}
      {view === 'presentation' ? (
        <PresentationView />
      ) : view === 'recording' ? (
        <RecordingView />
      ) : view === 'audio' || view === 'audioStudio' ? (
        <AudioStudioView />
      ) : view === 'import' || view === 'importCenter' ? (
        <ImportCenterView />
      ) : view === 'learning' || view === 'reader' ? (
        <LearningView />
      ) : (
        <>
          <Navbar />
          <main className="flex-1 flex flex-col min-h-0">
            {view === 'library' ? <LibraryView /> : <EditorLayout />}
          </main>
        </>
      )}

      {/* Global Modals */}
      <HelpModal />
      <SettingsModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <PresentationProvider>
          <AppContent />
        </PresentationProvider>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;
