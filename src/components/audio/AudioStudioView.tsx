import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Save,
  ChevronLeft,
  ChevronRight,
  Clock,
  Music,
  Check,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { StorageService } from '../../services/storage';
import { tokenizeText } from '../../services/tokenizer';
import type { AudioTiming, AudioAsset, Sentence } from '../../types';

export const AudioStudioView: React.FC = () => {
  const { currentChapter, currentLesson, activeLessonId, updateSentence, setView } = useApp();

  // Navigation
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number>(0);

  // Audio State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Mic Recording State
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Waveform state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Timings State
  const [timings, setTimings] = useState<AudioTiming[]>([]);
  const [activeSyncWordIndex, setActiveSyncWordIndex] = useState<number>(-1);
  const [isTapSyncMode, setIsTapSyncMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const sentences = currentLesson?.sentences || [];
  const currentSentence: Sentence | undefined = sentences[selectedSentenceIndex];
  const hindiTokens = tokenizeText(currentSentence?.hindi || '');

  // Load sentence existing audio & timings when selected sentence changes
  useEffect(() => {
    if (!currentSentence) return;

    if (currentSentence.audioTimings && currentSentence.audioTimings.length > 0) {
      setTimings(currentSentence.audioTimings);
    } else {
      // Initialize default token placeholders
      const initial = hindiTokens.map((t) => ({
        wordId: t.id,
        text: t.text,
        startTime: 0,
        endTime: 0,
      }));
      setTimings(initial);
    }

    // If sentence already has an audio asset saved in IndexedDB
    if (currentSentence.audioId) {
      StorageService.getAudioAsset(currentSentence.audioId).then((asset) => {
        if (asset && asset.blob) {
          const url = URL.createObjectURL(asset.blob);
          setAudioBlob(asset.blob);
          setAudioUrl(url);
          setAudioDuration(asset.duration);
          decodeWaveform(asset.blob);
        }
      });
    } else {
      setAudioBlob(null);
      setAudioUrl(null);
      setAudioDuration(0);
      setWaveformData([]);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [selectedSentenceIndex, currentSentence?.id]);

  // Decode audio data for visual waveform
  const decodeWaveform = async (blob: Blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const decoded = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0));
      const channelData = decoded.getChannelData(0);
      const samples = 120; // 120 bars
      const blockSize = Math.floor(channelData.length / samples);
      const peaks: number[] = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        const start = i * blockSize;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[start + j] || 0);
        }
        peaks.push(Math.min(1, (sum / blockSize) * 3.5)); // Normalized with slight gain
      }
      setWaveformData(peaks);
      setAudioDuration(decoded.duration);
    } catch (err) {
      console.warn('Could not decode waveform directly:', err);
    }
  };

  // Draw Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, width, height);

    // Draw bars
    if (waveformData.length > 0) {
      const barWidth = width / waveformData.length;
      const progressPercent = audioDuration > 0 ? currentTime / audioDuration : 0;
      const progressX = progressPercent * width;

      waveformData.forEach((peak, i) => {
        const x = i * barWidth;
        const barHeight = Math.max(4, peak * (height * 0.8));
        const y = (height - barHeight) / 2;

        ctx.fillStyle = x <= progressX ? '#d97706' : '#57534e';
        ctx.fillRect(x + 1, y, Math.max(1, barWidth - 2), barHeight);
      });

      // Playhead vertical line
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(progressX - 1, 0, 2.5, height);

      // Draw word timing bounds on top of waveform
      timings.forEach((t) => {
        if (t.endTime > t.startTime && audioDuration > 0) {
          const startX = (t.startTime / audioDuration) * width;
          const endX = (t.endTime / audioDuration) * width;

          ctx.fillStyle = 'rgba(217, 119, 6, 0.2)';
          ctx.fillRect(startX, 0, endX - startX, height);

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(startX, 0);
          ctx.lineTo(startX, height);
          ctx.stroke();

          // Word tag text
          ctx.font = '10px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#fef3c7';
          ctx.fillText(t.text, startX + 3, 14);
        }
      });
    } else {
      ctx.fillStyle = '#78716c';
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Record mic audio or upload an audio file to view waveform', width / 2, height / 2 + 4);
    }
  }, [waveformData, currentTime, audioDuration, timings]);

  // Audio Play / Pause
  const togglePlay = () => {
    if (!audioElementRef.current || !audioUrl) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.playbackRate = playbackRate;
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      const cur = audioElementRef.current.currentTime;
      setCurrentTime(cur);

      // Check which word is actively playing
      const activeIdx = timings.findIndex((t) => cur >= t.startTime && cur < t.endTime);
      setActiveSyncWordIndex(activeIdx);
    }
  };

  // Click on Waveform to seek
  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || audioDuration <= 0 || !audioElementRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percent * audioDuration;
    audioElementRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Mic Recording Implementation
  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        decodeWaveform(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecordingMic(true);
      setRecordSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      alert('Could not access microphone. Please ensure microphone permissions are granted in your browser.');
    }
  };

  const stopMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current !== null) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecordingMic(false);
  };

  // Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioBlob(file);
    setAudioUrl(url);
    decodeWaveform(file);
  };

  // Auto-Distribute Word Timings based on audio duration
  const autoDistributeTimings = () => {
    if (audioDuration <= 0 || hindiTokens.length === 0) {
      alert('Please record or upload audio first so duration is known.');
      return;
    }

    const totalChars = hindiTokens.reduce((sum, t) => sum + Math.max(1, t.text.length), 0);
    let cumulative = 0;
    const updated: AudioTiming[] = hindiTokens.map((t) => {
      const share = (Math.max(1, t.text.length) / totalChars) * audioDuration;
      const startTime = cumulative;
      const endTime = Math.min(audioDuration, cumulative + share);
      cumulative = endTime;
      return {
        wordId: t.id,
        text: t.text,
        startTime: parseFloat(startTime.toFixed(2)),
        endTime: parseFloat(endTime.toFixed(2)),
      };
    });

    setTimings(updated);
  };

  // Tap-to-Sync: As audio plays, pressing Spacebar or tapping "Stamp Word" marks the end time
  const handleStampCurrentWord = useCallback(() => {
    if (!isTapSyncMode || !isPlaying) return;

    setTimings((prev) => {
      const next = [...prev];
      const stampIdx = next.findIndex((t) => t.endTime === 0 || t.endTime <= t.startTime);
      if (stampIdx !== -1) {
        if (stampIdx > 0 && next[stampIdx - 1].endTime === 0) {
          next[stampIdx - 1].endTime = parseFloat(currentTime.toFixed(2));
        }
        next[stampIdx].startTime = stampIdx === 0 ? 0 : next[stampIdx - 1].endTime;
        next[stampIdx].endTime = parseFloat(currentTime.toFixed(2));
      }
      return next;
    });
  }, [isTapSyncMode, isPlaying, currentTime]);

  // Spacebar keydown for Tap-to-Sync
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isTapSyncMode && isPlaying) {
        e.preventDefault();
        handleStampCurrentWord();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTapSyncMode, isPlaying, handleStampCurrentWord]);

  // Preview individual word slice
  const playWordSlice = (start: number, end: number) => {
    if (!audioElementRef.current || !audioUrl) return;
    audioElementRef.current.currentTime = start;
    audioElementRef.current.play();
    setIsPlaying(true);

    const stopHandler = () => {
      if (audioElementRef.current && audioElementRef.current.currentTime >= end) {
        audioElementRef.current.pause();
        setIsPlaying(false);
        audioElementRef.current.removeEventListener('timeupdate', stopHandler);
      }
    };
    audioElementRef.current.addEventListener('timeupdate', stopHandler);
  };

  // Save Audio & Word Timings to IndexedDB & Lesson
  const handleSaveSync = async () => {
    if (!currentSentence) return;
    setSaveStatus('Saving...');

    try {
      let audioId = currentSentence.audioId;

      if (audioBlob) {
        const asset: AudioAsset = {
          id: audioId || `audio-${Date.now()}`,
          name: `Sentence-${selectedSentenceIndex + 1}-Audio`,
          blob: audioBlob,
          mimeType: audioBlob.type || 'audio/webm',
          duration: audioDuration,
          createdAt: Date.now(),
        };
        await StorageService.saveAudioAsset(asset);
        audioId = asset.id;
      }

      updateSentence(activeLessonId, currentSentence.id, {
        audioId,
        audioTimings: timings,
      });

      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err: any) {
      setSaveStatus('Error saving: ' + (err.message || 'Storage error'));
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Hidden HTML Audio Element */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Top Header Bar */}
      <header className="h-16 px-6 border-b border-stone-800 bg-stone-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('editor')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          <div className="h-4 w-px bg-stone-800" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Audio & Word Sync Studio</h1>
              <p className="text-[11px] text-stone-400">
                {currentChapter?.title} • {currentLesson?.title}
              </p>
            </div>
          </div>
        </div>

        {/* Sentence Stepper */}
        <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 rounded-xl px-2 py-1 text-xs">
          <button
            onClick={() => setSelectedSentenceIndex((i) => Math.max(0, i - 1))}
            disabled={selectedSentenceIndex === 0}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-stone-300">
            Sentence {selectedSentenceIndex + 1} of {sentences.length}
          </span>
          <button
            onClick={() => setSelectedSentenceIndex((i) => Math.min(sentences.length - 1, i + 1))}
            disabled={selectedSentenceIndex >= sentences.length - 1}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSaveSync}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-lg transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Sync to Lesson</span>
          </button>
        </div>
      </header>

      {/* Studio Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Sentence Card Highlight Display */}
        <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 shadow-xl space-y-3">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
            Sentence Under Edit
          </span>
          <div className="space-y-2">
            <div className="text-2xl font-bold font-hindi text-white flex flex-wrap gap-2">
              {hindiTokens.map((t, idx) => {
                const isActive = activeSyncWordIndex === idx;
                return (
                  <span
                    key={t.id}
                    onClick={() => {
                      const tm = timings[idx];
                      if (tm && tm.endTime > tm.startTime) {
                        playWordSlice(tm.startTime, tm.endTime);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 font-black scale-105 shadow-md'
                        : 'hover:bg-stone-800 text-stone-200'
                    }`}
                    title="Click to preview word audio"
                  >
                    {t.text}
                  </span>
                );
              })}
            </div>

            {currentSentence?.pronunciation && (
              <p className="text-sm font-hindi text-amber-300/80">
                {currentSentence.pronunciation}
              </p>
            )}

            {currentSentence?.english && (
              <p className="text-sm text-stone-400">
                {currentSentence.english}
              </p>
            )}
          </div>
        </div>

        {/* Audio Recording & Upload Control Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Microphone Card */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
                <Mic className="w-4 h-4 text-amber-500" />
                <span>Microphone Voice Recording</span>
              </div>
              {isRecordingMic && (
                <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-mono text-[11px] animate-pulse">
                  REC {formatSec(recordSeconds)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isRecordingMic ? (
                <button
                  onClick={startMicRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Start Mic Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopMicRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-bold text-xs shadow transition"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop & Save Voice</span>
                </button>
              )}

              <span className="text-xs text-stone-500">Record natural teacher voice for this sentence</span>
            </div>
          </div>

          {/* Audio Upload Card */}
          <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-300">
              <Upload className="w-4 h-4 text-amber-500" />
              <span>Upload Audio File</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs border border-stone-700 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose MP3 / WAV / M4A</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-stone-500">
                {audioBlob ? `${(audioBlob.size / 1024).toFixed(0)} KB loaded` : 'No file loaded'}
              </span>
            </div>
          </div>
        </div>

        {/* Waveform Canvas & Playback Bar */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-xs text-stone-300">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Audio Waveform & Word Markers</span>
            </div>
            <div className="font-mono text-xs text-stone-400">
              <span className="text-amber-400">{formatSec(currentTime)}</span> / {formatSec(audioDuration)}
            </div>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={960}
            height={140}
            onClick={handleWaveformClick}
            className="w-full h-32 rounded-2xl cursor-pointer shadow-inner border border-stone-800"
          />

          {/* Playback Controls & Synchronization Tools */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                disabled={!audioUrl}
                className="w-10 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center shadow transition disabled:opacity-30"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
              </button>

              <button
                onClick={() => {
                  if (audioElementRef.current) {
                    audioElementRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }
                }}
                disabled={!audioUrl}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition disabled:opacity-30"
                title="Rewind to start"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Speed dropdown */}
              <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-0.5 text-xs">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (audioElementRef.current) audioElementRef.current.playbackRate = rate;
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      playbackRate === rate ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Timings & Tap Sync Modes */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={autoDistributeTimings}
                disabled={audioDuration <= 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition disabled:opacity-30"
                title="Evenly distribute duration across tokens"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Estimate Timings</span>
              </button>

              <button
                onClick={() => setIsTapSyncMode(!isTapSyncMode)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition ${
                  isTapSyncMode
                    ? 'border-amber-500 bg-amber-950/60 text-amber-300'
                    : 'border-stone-700 bg-stone-800 text-stone-300 hover:text-white'
                }`}
                title="Tap spacebar while playing audio to stamp each word"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isTapSyncMode ? 'Tap Sync: Active (Press Space)' : 'Tap-to-Sync Mode'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Word-by-Word Timing Editor Table */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Word Timestamps Matrix
            </h3>
            <span className="text-xs text-stone-500">
              Adjust start and end seconds for each word token
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/60 text-stone-500 border-b border-stone-800">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4 font-hindi">Word Token</th>
                  <th className="py-2.5 px-4">Start (s)</th>
                  <th className="py-2.5 px-4">End (s)</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {timings.map((t, idx) => {
                  const isWordActive = activeSyncWordIndex === idx;
                  const wordDuration = Math.max(0, t.endTime - t.startTime);

                  return (
                    <tr
                      key={t.wordId || idx}
                      className={`hover:bg-stone-800/40 transition ${
                        isWordActive ? 'bg-amber-950/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono text-stone-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-hindi font-bold text-base text-white">
                        {t.text}
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={t.startTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTimings((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, startTime: val } : item))
                            );
                          }}
                          className="w-20 px-2 py-1 bg-stone-950 border border-stone-800 rounded-lg font-mono text-xs text-white focus:outline-hidden focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={t.endTime}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTimings((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, endTime: val } : item))
                            );
                          }}
                          className="w-20 px-2 py-1 bg-stone-950 border border-stone-800 rounded-lg font-mono text-xs text-white focus:outline-hidden focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-mono text-stone-400">
                        {wordDuration.toFixed(2)}s
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => playWordSlice(t.startTime, t.endTime)}
                          disabled={!audioUrl || t.endTime <= t.startTime}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-600 hover:text-white text-stone-300 transition disabled:opacity-20"
                          title="Play word slice"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
