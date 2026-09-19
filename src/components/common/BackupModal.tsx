import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  HardDrive,
  Database,
  Check,
  AlertCircle,
  RefreshCw,
  Archive,
  ShieldCheck,
} from 'lucide-react';
import JSZip from 'jszip';
import { StorageService, getAllCourses, saveCourse } from '../../services/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number; percent: number }>({
    used: 0,
    quota: 0,
    percent: 0,
  });

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadQuota();
    }
  }, [isOpen]);

  const loadQuota = async () => {
    const est = await StorageService.getStorageEstimate();
    setStorageInfo({
      used: est.usage,
      quota: est.quota,
      percent: est.usagePercent,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Full Project .zip Export
  const handleExportZip = async () => {
    setIsExporting(true);
    setFeedback(null);

    try {
      const zip = new JSZip();
      const allCourses = await getAllCourses();
      const allBooks = await StorageService.getAllBooks();
      const allVocab = await StorageService.getAllVocabulary();
      const allQuiz = await StorageService.getAllQuizResults();

      // Manifest
      const manifest = {
        app: 'PCJha LearnSync',
        schemaVersion: 2,
        exportedAt: Date.now(),
        courseCount: allCourses.length,
        bookCount: allBooks.length,
      };

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('data/courses.json', JSON.stringify(allCourses, null, 2));
      zip.file('data/library.json', JSON.stringify(allBooks, null, 2));
      zip.file('data/vocabulary.json', JSON.stringify(allVocab, null, 2));
      zip.file('data/quizResults.json', JSON.stringify(allQuiz, null, 2));

      // Generate Zip blob
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(zipBlob);
      const dateStr = new Date().toISOString().slice(0, 10);

      const a = document.createElement('a');
      a.href = url;
      a.download = `PCJha-LearnSync-FullBackup-${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({ type: 'success', text: 'Backup archive (.zip) downloaded successfully!' });
      loadQuota();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Export failed.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Import & Restore .zip or .json backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setFeedback(null);

    try {
      if (file.name.endsWith('.zip')) {
        // Zip Archive
        const zip = await JSZip.loadAsync(file);
        const coursesFile = zip.file('data/courses.json');

        if (coursesFile) {
          const coursesJson = await coursesFile.async('string');
          const courses = JSON.parse(coursesJson);
          if (Array.isArray(courses)) {
            for (const c of courses) {
              await saveCourse(c);
            }
          }
        }

        const vocabFile = zip.file('data/vocabulary.json');
        if (vocabFile) {
          const vocabJson = await vocabFile.async('string');
          const vocabList = JSON.parse(vocabJson);
          if (Array.isArray(vocabList)) {
            for (const v of vocabList) {
              await StorageService.saveVocabulary(v);
            }
          }
        }

        setFeedback({
          type: 'success',
          text: 'Backup restored successfully! Refreshing data...',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else if (file.name.endsWith('.json')) {
        // Legacy JSON file
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed && parsed.id && parsed.chapters) {
          await saveCourse(parsed);
          setFeedback({
            type: 'success',
            text: 'Course JSON restored! Refreshing data...',
          });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Failed to restore backup: ' + err.message });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 text-stone-100">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Project Backup & Storage Manager</h2>
              <p className="text-xs text-stone-400">IndexedDB local quota, .zip backup & restore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/50 border-red-800 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* IndexedDB Storage Quota Meter */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                <span>Browser Storage Meter</span>
              </span>
              <span className="font-mono text-stone-400">
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)} ({storageInfo.percent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(1, storageInfo.percent)}%` }}
                className="h-full bg-amber-500 transition-all duration-500"
              />
            </div>

            <p className="text-[11px] text-stone-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Client-Side Privacy: All lessons & media stay on your device.</span>
            </p>
          </div>

          {/* Action Cards */}
          <div className="space-y-3">
            {/* Export */}
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-amber-500" />
                  <span>Full Project .zip Backup</span>
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Packages courses, audio, vocabulary, and quiz history into a single zip file.
                </p>
              </div>

              <button
                onClick={handleExportZip}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow transition disabled:opacity-50 flex-shrink-0"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .zip</span>
                  </>
                )}
              </button>
            </div>

            {/* Import */}
            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>Restore from Backup</span>
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Upload a previously exported .zip or course .json file to restore.
                </p>
              </div>

              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 transition flex-shrink-0">
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".zip,.json"
                  onChange={handleImportFile}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
