import React, { useState } from 'react';
import {
  X,
  Sliders,
  Clock,
  Palette,
  Type,
  Eye,
  Video,
  Database,
  Pause,
  Download,
  Upload,
  Trash2,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { usePresentation } from '../../state/PresentationContext';
import { useTheme, THEME_PRESETS } from '../../state/ThemeContext';
import { useApp } from '../../state/AppContext';
import {
  exportToCSV,
  exportToPlainText,
  downloadFile,
  exportStandaloneHTML,
} from '../../services/importExport';
import type {
  HighlightStyle,
  LineFocus,
  WordFocus,
  TextAlignment,
  TextWidth,
  AutoScrollMode,
  ControlsVisibility,
  ProgressPosition,
  CanvasPreset,
} from '../../types';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    timing,
    updateTimingProp,
    presentationConfig,
    updatePresentationConfigProp,
  } = usePresentation();

  const {
    theme,
    updateThemeProp,
    applyPreset,
    customThemes,
    saveCustomTheme,
    deleteCustomTheme,
    typography,
    updateTypographyProp,
  } = useTheme();

  const { currentChapter, currentLesson, importFullCourse, currentCourse } = useApp();

  const [activeTab, setActiveTab] = useState<
    'presentation' | 'timing' | 'pause' | 'highlight' | 'typography' | 'theme' | 'controls' | 'recording' | 'data'
  >('presentation');

  const [customThemeName, setCustomThemeName] = useState('');

  // Custom timing builder helpers
  const [customTimingValue, setCustomTimingValue] = useState<number>(1);
  const [customTimingUnit, setCustomTimingUnit] = useState<'ms' | 'sec' | 'min' | 'hr'>('sec');

  if (!isSettingsOpen) return null;

  const TIMING_PRESETS = [
    { label: '100 ms', ms: 100 },
    { label: '250 ms', ms: 250 },
    { label: '500 ms', ms: 500 },
    { label: '750 ms', ms: 750 },
    { label: '1 sec', ms: 1000 },
    { label: '1.5 sec', ms: 1500 },
    { label: '2 sec', ms: 2000 },
    { label: '3 sec', ms: 3000 },
    { label: '5 sec', ms: 5000 },
    { label: '10 sec', ms: 10000 },
    { label: '30 sec', ms: 30000 },
    { label: '1 min', ms: 60000 },
    { label: '5 min', ms: 300000 },
    { label: '10 min', ms: 600000 },
    { label: '30 min', ms: 1800000 },
    { label: '1 hr', ms: 3600000 },
  ];

  const applyCustomTiming = () => {
    let multiplier = 1;
    if (customTimingUnit === 'ms') multiplier = 1;
    if (customTimingUnit === 'sec') multiplier = 1000;
    if (customTimingUnit === 'min') multiplier = 60000;
    if (customTimingUnit === 'hr') multiplier = 3600000;

    const finalMs = Math.max(50, customTimingValue * multiplier);
    updateTimingProp('wordIntervalMs', finalMs);
  };

  const handleSaveTheme = () => {
    if (!customThemeName.trim()) return;
    const newCustom = {
      ...theme,
      id: `custom-${Date.now()}`,
      name: customThemeName.trim(),
    };
    saveCustomTheme(newCustom);
    setCustomThemeName('');
  };

  // Export handlers
  const handleExportJSON = () => {
    if (!currentCourse) return;
    const jsonStr = JSON.stringify(currentCourse, null, 2);
    downloadFile(jsonStr, `PCJha-LearnSync-${currentChapter?.title || 'course'}.json`, 'application/json');
  };

  const handleExportCSV = () => {
    if (!currentLesson) return;
    const csvStr = exportToCSV(currentLesson.sentences);
    downloadFile(csvStr, `PCJha-LearnSync-${currentLesson.title}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportPlainText = () => {
    if (!currentLesson) return;
    const txtStr = exportToPlainText(currentLesson.sentences);
    downloadFile(txtStr, `PCJha-LearnSync-${currentLesson.title}.txt`, 'text/plain;charset=utf-8;');
  };

  const handleExportHTML = () => {
    if (!currentChapter || !currentLesson) return;
    const html = exportStandaloneHTML(currentChapter, currentLesson, theme, typography);
    downloadFile(html, `PCJha-Presentation-${currentChapter.title}-${currentLesson.title}.html`, 'text/html');
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.id && parsed.chapters) {
          importFullCourse(parsed);
          alert('Course imported successfully!');
        } else {
          alert('Invalid course format: missing chapters or id.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-4xl w-full h-[88vh] shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold">Studio & Presentation Settings</h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main: Sidebar + Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category Tabs */}
          <div className="w-48 sm:w-56 border-r border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/50 p-2 sm:p-3 flex flex-col gap-1 overflow-y-auto flex-shrink-0 text-xs">
            <button
              onClick={() => setActiveTab('presentation')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'presentation'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Presentation</span>
            </button>

            <button
              onClick={() => setActiveTab('timing')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'timing'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Timing & Playback</span>
            </button>

            <button
              onClick={() => setActiveTab('pause')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'pause'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Pause className="w-4 h-4" />
              <span>Section Pause</span>
            </button>

            <button
              onClick={() => setActiveTab('highlight')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'highlight'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Highlight Style</span>
            </button>

            <button
              onClick={() => setActiveTab('typography')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'typography'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Typography</span>
            </button>

            <button
              onClick={() => setActiveTab('theme')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'theme'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Theme Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'controls'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Controls & UI</span>
            </button>

            <button
              onClick={() => setActiveTab('recording')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'recording'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Recording Canvas</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition ${
                activeTab === 'data'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Backup & Exports</span>
            </button>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
            {/* 1. PRESENTATION */}
            {activeTab === 'presentation' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold">Text Alignment</h3>
                  <p className="text-stone-500 mb-3">Alignment of lines in presentation mode</p>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as TextAlignment[]).map((align) => (
                      <button
                        key={align}
                        onClick={() => updatePresentationConfigProp('alignment', align)}
                        className={`px-4 py-2 rounded-lg capitalize border font-medium transition ${
                          presentationConfig.alignment === align
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Presentation Text Width</h3>
                  <p className="text-stone-500 mb-3">Controls reading line length</p>
                  <div className="flex flex-wrap gap-2">
                    {(['narrow', 'medium', 'wide', 'full', 'custom'] as TextWidth[]).map((w) => (
                      <button
                        key={w}
                        onClick={() => updatePresentationConfigProp('textWidth', w)}
                        className={`px-3 py-1.5 rounded-lg capitalize border font-medium transition ${
                          presentationConfig.textWidth === w
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  {presentationConfig.textWidth === 'custom' && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-stone-500">Max Width (px):</span>
                      <input
                        type="number"
                        min="400"
                        max="2400"
                        value={presentationConfig.customMaxWidthPx}
                        onChange={(e) =>
                          updatePresentationConfigProp('customMaxWidthPx', Number(e.target.value))
                        }
                        className="w-24 px-2 py-1 rounded border border-stone-300 dark:border-stone-700 dark:bg-stone-800"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold">Line Focus</h3>
                  <p className="text-stone-500 mb-3">Dims non-active lines to focus learner attention</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'none', label: 'None' },
                        { id: 'activeLine', label: 'Active Line Only' },
                        { id: 'activeAndPrev', label: 'Active + Previous' },
                        { id: 'activeAndNext', label: 'Active + Next' },
                        { id: 'activeSentence', label: 'Active Sentence' },
                      ] as { id: LineFocus; label: string }[]
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => updatePresentationConfigProp('lineFocus', item.id)}
                        className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                          presentationConfig.lineFocus === item.id
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Word Focus</h3>
                  <p className="text-stone-500 mb-3">Softly dims non-active words on the active line</p>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'off', label: 'Off' },
                        { id: 'currentWord', label: 'Current Word Only' },
                        { id: 'currentAndSurrounding', label: 'Current + Surrounding' },
                      ] as { id: WordFocus; label: string }[]
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => updatePresentationConfigProp('wordFocus', item.id)}
                        className={`px-3 py-1.5 rounded-lg border font-medium transition ${
                          presentationConfig.wordFocus === item.id
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Auto Scroll</h3>
                  <p className="text-stone-500 mb-3">Keeps active sentence in viewport during presentation</p>
                  <div className="flex gap-2">
                    {(['off', 'center', 'top', 'smooth'] as AutoScrollMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updatePresentationConfigProp('autoScroll', mode)}
                        className={`px-3 py-1.5 rounded-lg capitalize border font-medium transition ${
                          presentationConfig.autoScroll === mode
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={presentationConfig.showIntroCover}
                      onChange={(e) => updatePresentationConfigProp('showIntroCover', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-semibold block">Show Chapter Intro Cover</span>
                      <span className="text-stone-500 text-[11px]">Displays chapter title & "Start Lesson" button before first sentence</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={presentationConfig.showCompletionScreen}
                      onChange={(e) => updatePresentationConfigProp('showCompletionScreen', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-semibold block">Show Lesson Complete Screen</span>
                      <span className="text-stone-500 text-[11px]">Shows completion summary with Restart and Next Lesson options</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* 2. TIMING */}
            {activeTab === 'timing' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-bold text-amber-950 dark:text-amber-200 block">
                        Use Automatic Timing
                      </span>
                      <span className="text-stone-600 dark:text-stone-400 text-xs">
                        When OFF, presentation is in strictly Manual Mode where every word requires a user click or keypress.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={timing.useAutoTiming}
                      onChange={(e) => updateTimingProp('useAutoTiming', e.target.checked)}
                      className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Word Highlighting Interval</h3>
                  <p className="text-stone-500 mb-3">
                    Currently selected: <strong className="text-amber-600">{timing.wordIntervalMs >= 1000 ? `${timing.wordIntervalMs / 1000}s` : `${timing.wordIntervalMs}ms`}</strong>
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMING_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => updateTimingProp('wordIntervalMs', preset.ms)}
                        className={`p-2 rounded-lg border text-center font-medium transition ${
                          timing.wordIntervalMs === preset.ms
                            ? 'bg-amber-600 text-white border-amber-600 font-bold'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                  <h4 className="font-semibold text-stone-700 dark:text-stone-300">Custom Word Interval</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={customTimingValue}
                      onChange={(e) => setCustomTimingValue(Math.max(1, Number(e.target.value)))}
                      className="w-24 px-2 py-1 rounded border border-stone-300 dark:border-stone-700 dark:bg-stone-800"
                    />
                    <select
                      value={customTimingUnit}
                      onChange={(e) => setCustomTimingUnit(e.target.value as any)}
                      className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 dark:bg-stone-800"
                    >
                      <option value="ms">milliseconds</option>
                      <option value="sec">seconds</option>
                      <option value="min">minutes</option>
                      <option value="hr">hours</option>
                    </select>
                    <button
                      onClick={applyCustomTiming}
                      className="px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded font-medium hover:bg-stone-800 transition"
                    >
                      Set Interval
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Repeat Sentence (Auto Mode)</h3>
                  <p className="text-stone-500 mb-3">Repeats current sentence cycle before advancing</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 'unlimited'].map((rep) => (
                      <button
                        key={rep}
                        onClick={() => updateTimingProp('repeatCount', rep as any)}
                        className={`px-4 py-1.5 rounded-lg border font-medium capitalize transition ${
                          timing.repeatCount === rep
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {rep === 1 ? 'Once (1x)' : rep === 'unlimited' ? 'Loop ∞' : `${rep} Times`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. PAUSE */}
            {activeTab === 'pause' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Enable Pause Between Sections</span>
                      <span className="text-stone-500 text-xs">
                        Inserts configurable breathing pauses between Hindi, Pronunciation, and English.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={timing.enablePause}
                      onChange={(e) => updateTimingProp('enablePause', e.target.checked)}
                      className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                    />
                  </label>
                </div>

                {timing.enablePause && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Pause after Hindi completes</span>
                        <span className="text-amber-600">{timing.pauseAfterHindiMs / 1000}s</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={timing.pauseAfterHindiMs}
                        onChange={(e) => updateTimingProp('pauseAfterHindiMs', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Pause after Pronunciation completes</span>
                        <span className="text-amber-600">{timing.pauseAfterPronunciationMs / 1000}s</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={timing.pauseAfterPronunciationMs}
                        onChange={(e) => updateTimingProp('pauseAfterPronunciationMs', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Pause after English completes</span>
                        <span className="text-amber-600">{timing.pauseAfterEnglishMs / 1000}s</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={timing.pauseAfterEnglishMs}
                        onChange={(e) => updateTimingProp('pauseAfterEnglishMs', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Pause after Sentence finishes</span>
                        <span className="text-amber-600">{timing.pauseAfterSentenceMs / 1000}s</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="10000"
                        step="500"
                        value={timing.pauseAfterSentenceMs}
                        onChange={(e) => updateTimingProp('pauseAfterSentenceMs', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. HIGHLIGHT */}
            {activeTab === 'highlight' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold">Highlight Style</h3>
                  <p className="text-stone-500 mb-3">Visual treatment for the active highlighted word</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['background', 'textColor', 'underline', 'pill', 'glow', 'bold'] as HighlightStyle[]).map(
                      (style) => (
                        <button
                          key={style}
                          onClick={() => updateThemeProp('highlightStyle', style)}
                          className={`p-2.5 rounded-lg border font-medium capitalize text-center transition ${
                            theme.highlightStyle === style
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                          }`}
                        >
                          {style}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Highlight Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.highlightBg}
                        onChange={(e) => updateThemeProp('highlightBg', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.highlightBg}
                        onChange={(e) => updateThemeProp('highlightBg', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-stone-300 dark:border-stone-700 font-mono text-xs dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Active Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.highlightText}
                        onChange={(e) => updateThemeProp('highlightText', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.highlightText}
                        onChange={(e) => updateThemeProp('highlightText', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-stone-300 dark:border-stone-700 font-mono text-xs dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Inactive Words Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.inactiveText}
                        onChange={(e) => updateThemeProp('inactiveText', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.inactiveText}
                        onChange={(e) => updateThemeProp('inactiveText', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-stone-300 dark:border-stone-700 font-mono text-xs dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Previous Words Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.previousText}
                        onChange={(e) => updateThemeProp('previousText', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.previousText}
                        onChange={(e) => updateThemeProp('previousText', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-stone-300 dark:border-stone-700 font-mono text-xs dark:bg-stone-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Highlight Opacity</span>
                      <span>{Math.round(theme.highlightOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={theme.highlightOpacity}
                      onChange={(e) => updateThemeProp('highlightOpacity', Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Border Radius</span>
                      <span>{theme.highlightBorderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={theme.highlightBorderRadius}
                      onChange={(e) => updateThemeProp('highlightBorderRadius', Number(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Horizontal Padding</span>
                        <span>{theme.highlightPaddingX}px</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="24"
                        value={theme.highlightPaddingX}
                        onChange={(e) => updateThemeProp('highlightPaddingX', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Vertical Padding</span>
                        <span>{theme.highlightPaddingY}px</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="16"
                        value={theme.highlightPaddingY}
                        onChange={(e) => updateThemeProp('highlightPaddingY', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TYPOGRAPHY */}
            {activeTab === 'typography' && (
              <div className="space-y-6">
                {/* Hindi Typography */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400">1. Hindi Sentence Typography</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">Font Family</label>
                      <select
                        value={typography.hindi.fontFamily}
                        onChange={(e) => updateTypographyProp('hindi', 'fontFamily', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 dark:bg-stone-800"
                      >
                        <option value="'Noto Sans Devanagari', sans-serif">Noto Sans Devanagari</option>
                        <option value="'Noto Serif Devanagari', serif">Noto Serif Devanagari</option>
                        <option value="'Mukta', sans-serif">Mukta</option>
                        <option value="'Hind', sans-serif">Hind</option>
                        <option value="'Tiro Devanagari Hindi', serif">Tiro Devanagari</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        Font Size: {typography.hindi.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="72"
                        value={typography.hindi.fontSize}
                        onChange={(e) => updateTypographyProp('hindi', 'fontSize', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Pronunciation Typography */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="font-bold text-sm text-sky-700 dark:text-sky-400">2. Hindi Pronunciation (Devanagari)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">Font Family</label>
                      <select
                        value={typography.pronunciation.fontFamily}
                        onChange={(e) => updateTypographyProp('pronunciation', 'fontFamily', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 dark:bg-stone-800"
                      >
                        <option value="'Noto Sans Devanagari', sans-serif">Noto Sans Devanagari</option>
                        <option value="'Noto Serif Devanagari', serif">Noto Serif Devanagari</option>
                        <option value="'Mukta', sans-serif">Mukta</option>
                        <option value="'Hind', sans-serif">Hind</option>
                        <option value="'Tiro Devanagari Hindi', serif">Tiro Devanagari</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        Font Size: {typography.pronunciation.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="18"
                        max="60"
                        value={typography.pronunciation.fontSize}
                        onChange={(e) => updateTypographyProp('pronunciation', 'fontSize', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>

                {/* English Typography */}
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 space-y-3">
                  <h4 className="font-bold text-sm text-stone-700 dark:text-stone-300">3. English Sentence Typography</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">Font Family</label>
                      <select
                        value={typography.english.fontFamily}
                        onChange={(e) => updateTypographyProp('english', 'fontFamily', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 dark:bg-stone-800"
                      >
                        <option value="'Inter', sans-serif">Inter</option>
                        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                        <option value="'DM Sans', sans-serif">DM Sans</option>
                        <option value="'Source Sans 3', sans-serif">Source Sans 3</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-500 mb-1">
                        Font Size: {typography.english.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="52"
                        value={typography.english.fontSize}
                        onChange={(e) => updateTypographyProp('english', 'fontSize', Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. THEME STUDIO */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold">Theme Presets</h3>
                  <p className="text-stone-500 mb-3">Instant professional palettes</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Object.values(THEME_PRESETS).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                          theme.id === p.id
                            ? 'border-amber-600 ring-2 ring-amber-600/30'
                            : 'border-stone-200 dark:border-stone-700 hover:border-stone-400'
                        }`}
                        style={{ backgroundColor: p.bg }}
                      >
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.hindiText }} />
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.pronunciationText }} />
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.highlightBg }} />
                        </div>
                        <span
                          className="font-bold text-[11px]"
                          style={{ color: p.hindiText }}
                        >
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div>
                    <label className="font-semibold block mb-1">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.bg}
                        onChange={(e) => updateThemeProp('bg', e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.bg}
                        onChange={(e) => updateThemeProp('bg', e.target.value)}
                        className="w-20 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px] dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Hindi Text</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.hindiText}
                        onChange={(e) => updateThemeProp('hindiText', e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.hindiText}
                        onChange={(e) => updateThemeProp('hindiText', e.target.value)}
                        className="w-20 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px] dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Pronunciation Text</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.pronunciationText}
                        onChange={(e) => updateThemeProp('pronunciationText', e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.pronunciationText}
                        onChange={(e) => updateThemeProp('pronunciationText', e.target.value)}
                        className="w-20 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px] dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">English Text</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.englishText}
                        onChange={(e) => updateThemeProp('englishText', e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.englishText}
                        onChange={(e) => updateThemeProp('englishText', e.target.value)}
                        className="w-20 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px] dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Progress Bar</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.progressBar}
                        onChange={(e) => updateThemeProp('progressBar', e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.progressBar}
                        onChange={(e) => updateThemeProp('progressBar', e.target.value)}
                        className="w-20 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px] dark:bg-stone-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Secondary / Counter</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={theme.secondary}
                        onChange={(e) => updateThemeProp('secondary', e.target.value)}
                        className="w-7 h-7 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.secondary}
                        onChange={(e) => updateThemeProp('secondary', e.target.value)}
                        className="w-20 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700 font-mono text-[11px] dark:bg-stone-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Save as Custom Theme */}
                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
                  <h4 className="font-semibold">Save Current Palette as Custom Theme</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Theme Name (e.g. My Studio Warm)"
                      value={customThemeName}
                      onChange={(e) => setCustomThemeName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-xs dark:bg-stone-800"
                    />
                    <button
                      onClick={handleSaveTheme}
                      disabled={!customThemeName.trim()}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-lg font-medium transition"
                    >
                      Save Theme
                    </button>
                  </div>

                  {customThemes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[11px] text-stone-500 font-semibold block">Your Custom Themes:</span>
                      {customThemes.map((ct) => (
                        <div
                          key={ct.id}
                          className="flex items-center justify-between p-2 rounded bg-stone-50 dark:bg-stone-800/60"
                        >
                          <button
                            onClick={() => applyPreset(ct.id)}
                            className="font-medium hover:text-amber-600"
                          >
                            {ct.name}
                          </button>
                          <button
                            onClick={() => deleteCustomTheme(ct.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. CONTROLS */}
            {activeTab === 'controls' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold">Controls Auto-Hide Inactivity Timer</h3>
                  <p className="text-stone-500 mb-3">Controls automatically fade out after mouse stops moving</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(['always', '1s', '2s', '3s', '5s', 'never'] as ControlsVisibility[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePresentationConfigProp('controlsVisibility', v)}
                        className={`p-2 rounded-lg border text-center font-medium capitalize transition ${
                          presentationConfig.controlsVisibility === v
                            ? 'bg-amber-600 text-white border-amber-600 font-bold'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Progress Bar Position</h3>
                  <p className="text-stone-500 mb-3">Placement of the sentence progress track</p>
                  <div className="flex gap-2">
                    {(['bottom', 'top', 'hidden'] as ProgressPosition[]).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => updatePresentationConfigProp('progressPosition', pos)}
                        className={`px-4 py-1.5 rounded-lg border font-medium capitalize transition ${
                          presentationConfig.progressPosition === pos
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <h3 className="text-sm font-bold">Visible Floating Control Buttons</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(presentationConfig.showControlButtons).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            updatePresentationConfigProp('showControlButtons', {
                              ...presentationConfig.showControlButtons,
                              [key]: e.target.checked,
                            })
                          }
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="capitalize font-medium text-stone-700 dark:text-stone-300">
                          {key === 'playPause' ? 'Play / Pause' : key}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 8. RECORDING CANVAS */}
            {activeTab === 'recording' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold">Recording Canvas Aspect Ratio</h3>
                  <p className="text-stone-500 mb-3">Choose fixed canvas proportions for video capture</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { id: '16:9', label: '1920 × 1080', desc: '16:9 YouTube / Lecture' },
                        { id: '9:16', label: '1080 × 1920', desc: '9:16 Shorts / Reels' },
                        { id: '1:1', label: '1080 × 1080', desc: '1:1 Square' },
                        { id: '720p', label: '1280 × 720', desc: '16:9 HD' },
                      ] as { id: CanvasPreset; label: string; desc: string }[]
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 text-left hover:border-amber-500 transition"
                      >
                        <span className="font-bold text-xs block">{preset.label}</span>
                        <span className="text-[10px] text-stone-500">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60">
                  <h4 className="font-semibold text-xs mb-1">Recording Safe Area Guides</h4>
                  <p className="text-[11px] text-stone-500 mb-3">
                    Guides display in setup only and will never appear in the final video.
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs">Margin: 5%</span>
                    <span className="text-xs text-stone-400">Fixed bounds prevent subtitle clipping</span>
                  </div>
                </div>
              </div>
            )}

            {/* 9. DATA & BACKUP */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold">Export Lesson Data</h3>
                  <p className="text-stone-500 mb-3">Download complete lesson files for backup or sharing</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleExportJSON}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-left flex items-start gap-3 transition"
                    >
                      <Download className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs block">Export JSON File</span>
                        <span className="text-[11px] text-stone-500">Complete course & lesson backup</span>
                      </div>
                    </button>

                    <button
                      onClick={handleExportCSV}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-left flex items-start gap-3 transition"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs block">Export CSV Table</span>
                        <span className="text-[11px] text-stone-500">Spreadsheet table of sentences</span>
                      </div>
                    </button>

                    <button
                      onClick={handleExportPlainText}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 text-left flex items-start gap-3 transition"
                    >
                      <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs block">Export Plain Text</span>
                        <span className="text-[11px] text-stone-500">Readable 3-line format</span>
                      </div>
                    </button>

                    <button
                      onClick={handleExportHTML}
                      className="p-3 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 text-left flex items-start gap-3 transition"
                    >
                      <FileCode className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs block text-amber-950 dark:text-amber-200">
                          Export Standalone HTML Presentation
                        </span>
                        <span className="text-[11px] text-stone-600 dark:text-stone-400">
                          Runs anywhere offline in any web browser
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <h3 className="text-sm font-bold mb-1">Import Course / Chapter JSON</h3>
                  <p className="text-stone-500 mb-3 text-xs">Restore from previously exported JSON backup</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-medium cursor-pointer hover:bg-stone-800 transition">
                    <Upload className="w-4 h-4" />
                    <span>Select JSON File</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportJSONFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-stone-400">Changes apply live in preview and presentation</span>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold rounded-lg hover:bg-stone-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
