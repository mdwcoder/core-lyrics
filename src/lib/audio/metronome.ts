/**
 * CORE-LYRICS · Web Audio API Metronome & Beat Sync Engine
 * Reproducción de instrumentales, metrónomo sintetizado 4/4 con acento, volumen, seek y tap tempo.
 */

export interface MetronomeState {
  isPlaying: boolean;
  bpm: number;
  currentBeat: number; // 0..3 (para 4/4)
  currentBar: number;
  timeOffset: number; // Offset en segundos antes del golpe 1
  isMuted: boolean;
  volume: number; // 0..1
  audioDuration: number;
  currentTime: number;
  hasAudioFile: boolean;
}

export class RapAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private bpm = 90;
  private timeOffset = 0; // En segundos
  private timerId: number | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0; // 0, 1, 2, 3
  private currentBar = 1;
  private isMuted = false;
  private volume = 0.8;

  // External audio track handling
  private audioElement: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

  // Subscribed callbacks
  private onTickCallback: ((beat: number, bar: number, time: number) => void) | null = null;
  private onStateChangeCallback: ((state: Partial<MetronomeState>) => void) | null = null;

  constructor() {
    // AudioContext is initialized on first user interaction
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setOnTick(callback: (beat: number, bar: number, time: number) => void) {
    this.onTickCallback = callback;
  }

  public setOnStateChange(callback: (state: Partial<MetronomeState>) => void) {
    this.onStateChangeCallback = callback;
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(40, Math.min(240, newBpm));
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ bpm: this.bpm });
    }
  }

  public setTimeOffset(offsetSec: number) {
    this.timeOffset = Math.max(0, offsetSec);
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ timeOffset: this.timeOffset });
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ isMuted: this.isMuted });
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ volume: this.volume });
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public loadAudioFile(file: File) {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
    this.audioUrl = URL.createObjectURL(file);
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.addEventListener('ended', () => {
        this.restart();
      });
      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.onStateChangeCallback) {
          const t = this.audioElement.currentTime;
          this.onStateChangeCallback({
            currentTime: t,
            audioDuration: this.audioElement.duration || 0
          });
        }
      });
    }
    this.audioElement.src = this.audioUrl;
    this.audioElement.volume = this.volume;
    this.audioElement.load();
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ hasAudioFile: true });
    }
  }

  public removeAudioFile() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ hasAudioFile: false, currentTime: 0, audioDuration: 0 });
    }
  }

  public seek(seconds: number) {
    const secPerBar = (60.0 / this.bpm) * 4;
    const targetBar = Math.max(1, Math.floor(seconds / secPerBar) + 1);

    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }

    this.currentBar = targetBar;
    this.currentBeat = 0;

    if (this.audioCtx) {
      this.nextNoteTime = this.audioCtx.currentTime + 0.05;
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        currentTime: seconds,
        currentBar: this.currentBar,
        currentBeat: 0
      });
    }

    if (this.onTickCallback) {
      this.onTickCallback(0, this.currentBar, seconds);
    }
  }

  private playClick(time: number, isAccent: boolean) {
    if (!this.audioCtx || this.isMuted) return;

    // High precision synthesis of drum rimshot/metronome
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = isAccent ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

    const baseGain = (isAccent ? 0.8 : 0.4) * this.volume;
    gain.gain.setValueAtTime(baseGain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private scheduleNext() {
    if (!this.audioCtx) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const lookahead = 0.1; // 100ms
    const scheduleAheadTime = 0.2; // 200ms

    while (this.nextNoteTime < this.audioCtx.currentTime + scheduleAheadTime) {
      const isAccent = this.currentBeat === 0;
      this.playClick(this.nextNoteTime, isAccent);

      if (this.onTickCallback) {
        // Schedule notification synchronized with audio context
        const beatNum = this.currentBeat;
        const barNum = this.currentBar;
        const t = this.nextNoteTime;
        const delay = Math.max(0, (t - this.audioCtx.currentTime) * 1000);
        setTimeout(() => {
          if (this.isPlaying) {
            this.onTickCallback?.(beatNum, barNum, t);
          }
        }, delay);
      }

      this.nextNoteTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % 4;
      if (this.currentBeat === 0) {
        this.currentBar++;
      }
    }

    if (this.isPlaying) {
      this.timerId = window.setTimeout(() => this.scheduleNext(), lookahead * 1000);
    }
  }

  public start() {
    this.initContext();
    if (!this.audioCtx) return;

    this.isPlaying = true;
    this.nextNoteTime = this.audioCtx.currentTime + this.timeOffset;

    if (this.audioElement && this.audioUrl) {
      this.audioElement.volume = this.volume;
      this.audioElement.play().catch(() => {});
    }

    this.scheduleNext();

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ isPlaying: true });
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isPlaying: false,
        currentTime: this.audioElement ? this.audioElement.currentTime : 0
      });
    }
  }

  public stop() {
    this.pause();
  }

  public restart() {
    this.pause();
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
    }
    this.currentBeat = 0;
    this.currentBar = 1;

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isPlaying: false,
        currentBeat: 0,
        currentBar: 1,
        currentTime: 0
      });
    }

    if (this.onTickCallback) {
      this.onTickCallback(0, 1, 0);
    }
  }

  public toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.start();
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const rapAudioEngine = new RapAudioEngine();
