import React from 'react';
import { X, Keyboard, MousePointer, Info } from 'lucide-react';
import { usePresentation } from '../../state/PresentationContext';

export const HelpModal: React.FC = () => {
  const { isHelpOpen, setIsHelpOpen, timing } = usePresentation();

  if (!isHelpOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-none">Navigation & Keyboard Shortcuts</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Presentation mode control guide</p>
            </div>
          </div>
          <button
            onClick={() => setIsHelpOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Spacebar distinction callout */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 flex gap-3 items-start">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Spacebar Dual Mode:</span> In <strong>Manual Mode</strong>, Spacebar advances to the <strong>Next Word</strong> (same as <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-amber-300 dark:border-amber-700 text-[11px] font-mono">→</kbd>). In <strong>Auto Mode</strong>, Spacebar toggles <strong>Play / Pause ▶⏸</strong> at the current word without resetting.
            </div>
          </div>

          {/* Shortcuts Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Next Word</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  →
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Previous Word</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  ←
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">
                  {timing.useAutoTiming ? 'Play / Pause' : 'Next Word'}
                </span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  Space
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Next Sentence</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  Enter / ↓
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Previous Sentence</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  ↑
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Beginning of Lesson</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  Home
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">End of Lesson</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  End
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Auto Play / Pause</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  P
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Toggle Fullscreen</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  F
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Toggle Controls</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  H
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Exit / Show Controls</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  Esc
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Undo / Redo (Editor)</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  Ctrl+Z / Y
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-600 dark:text-stone-300">Recording Studio</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 font-mono text-[11px] font-semibold">
                  R
                </kbd>
              </div>
            </div>
          </div>

          {/* Mouse Gestures */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5" />
              Mouse Navigation in Presentation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-0.5">Left Click Canvas</span>
                <span className="text-stone-500 text-[11px]">Advances to next word</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-0.5">Right Click Canvas</span>
                <span className="text-stone-500 text-[11px]">Steps backward across timeline</span>
              </div>
              <div className="col-span-2 p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block mb-0.5">Click Any Word Directly</span>
                <span className="text-stone-500 text-[11px]">Directly jumps and focuses on that specific word token</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex justify-end">
          <button
            onClick={() => setIsHelpOpen(false)}
            className="px-4 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-white transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
