/**
 * Browser-native Screen Recording Controller using MediaStream & MediaRecorder APIs.
 */

export interface RecorderState {
  isSupported: boolean;
  isRecording: boolean;
  durationSeconds: number;
  blobUrl: string | null;
  mimeType: string | null;
  errorMessage: string | null;
}

export class ScreenRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private timerId: number | null = null;
  private onStateChange: (state: Partial<RecorderState>) => void;

  constructor(onStateChange: (state: Partial<RecorderState>) => void) {
    this.onStateChange = onStateChange;
  }

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!window.navigator?.mediaDevices?.getDisplayMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  public async startRecording(): Promise<boolean> {
    if (!ScreenRecorder.isSupported()) {
      this.onStateChange({
        errorMessage: 'Browser screen recording is not available here. Use your device\'s screen recorder or OBS.',
        isRecording: false,
      });
      return false;
    }

    try {
      this.recordedChunks = [];
      // Request screen / window / tab capture
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: true,
      });

      // Handle user clicking native "Stop sharing" chrome banner
      this.mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopRecording();
      });

      // Determine supported mime types, prioritizing webm
      let chosenMime = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(chosenMime)) {
        chosenMime = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(chosenMime)) {
        chosenMime = 'video/webm';
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: chosenMime,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const finalBlob = new Blob(this.recordedChunks, { type: chosenMime });
        const blobUrl = URL.createObjectURL(finalBlob);
        this.onStateChange({
          isRecording: false,
          blobUrl,
          mimeType: chosenMime,
        });
        this.cleanup();
      };

      this.mediaRecorder.start(500); // chunk every 500ms for safety

      // Start duration timer
      let seconds = 0;
      this.timerId = window.setInterval(() => {
        seconds++;
        this.onStateChange({ durationSeconds: seconds });
      }, 1000);

      this.onStateChange({
        isRecording: true,
        durationSeconds: 0,
        blobUrl: null,
        errorMessage: null,
      });

      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        // User cancelled the prompt
        this.onStateChange({ isRecording: false });
      } else {
        this.onStateChange({
          errorMessage: err.message || 'Failed to start screen recording.',
          isRecording: false,
        });
      }
      this.cleanup();
      return false;
    }
  }

  public stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
  }
}
