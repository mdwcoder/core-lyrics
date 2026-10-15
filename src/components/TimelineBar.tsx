import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Upload, Trash2, RotateCcw, Sparkles, Loader2, Check } from 'lucide-react';
import { rapAudioEngine, MetronomeState } from '../lib/audio/metronome';
import { analyzeBeatFromAudioFile, formatTimestampTag } from '../lib/audio/beatAnalyzer';

interface TimelineBarProps {
  currentBarIndex: number;
  totalBars: number;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  timeOffset: number;
  onTimeOffsetChange: (offset: number) => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  currentBarIndex: _currentBarIndex,
  totalBars: _totalBars,
  bpm,
  onBpmChange,
  timeOffset,
  onTimeOffsetChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [audioBar, setAudioBar] = useState(1);
  const [hasAudioFile, setHasAudioFile] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioFileName, setAudioFileName] = useState('');

  // Audio beat analyzer states
  const [isAnalyzingBeat, setIsAnalyzingBeat] = useState(false);
  const [analysisResultMsg, setAnalysisResultMsg] = useState<string | null>(null);

  // References
  const tapTimesRef = useRef<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const uploadedFileRef = useRef<File | null>(null);

  useEffect(() => {
    rapAudioEngine.setOnTick((beat, bar) => {
      setCurrentBeat(beat);
      setAudioBar(bar);
    });

    rapAudioEngine.setOnStateChange((state: Partial<MetronomeState>) => {
      if (state.isPlaying !== undefined) setIsPlaying(state.isPlaying);
      if (state.bpm !== undefined && state.bpm !== bpm) onBpmChange(state.bpm);
      if (state.timeOffset !== undefined && state.timeOffset !== timeOffset) onTimeOffsetChange(state.timeOffset);
      if (state.isMuted !== undefined) setIsMuted(state.isMuted);
      if (state.volume !== undefined) setVolume(state.volume);
      if (state.currentBeat !== undefined) setCurrentBeat(state.currentBeat);
      if (state.currentBar !== undefined) setAudioBar(state.currentBar);
      if (state.hasAudioFile !== undefined) setHasAudioFile(state.hasAudioFile);
      if (state.audioDuration !== undefined) setAudioDuration(state.audioDuration);
      if (state.currentTime !== undefined) setCurrentTime(state.currentTime);
    });

    return () => {
      rapAudioEngine.pause();
    };
  }, [bpm, onBpmChange, timeOffset, onTimeOffsetChange]);

  const handleTogglePlay = () => {
    rapAudioEngine.toggle();
  };

  const handleRestart = () => {
    rapAudioEngine.restart();
  };

  const handleBpmUpdate = (newBpm: number) => {
    const val = Math.max(40, Math.min(240, newBpm));
    onBpmChange(val);
    rapAudioEngine.setBpm(val);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    taps.push(now);

    const recent = taps.filter(t => now - t < 3000);
    tapTimesRef.current = recent;

    if (recent.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recent.length; i++) {
        intervals.push(recent[i] - recent[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        handleBpmUpdate(calculatedBpm);
      }
    }
  };

  const handleOffsetUpdate = (newOffset: number) => {
    const val = Math.max(0, newOffset);
    onTimeOffsetChange(val);
    rapAudioEngine.setTimeOffset(val);
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    rapAudioEngine.setMuted(next);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    rapAudioEngine.setVolume(newVol);
  };

  const runBeatAnalysis = async (file: File) => {
    setIsAnalyzingBeat(true);
    setAnalysisResultMsg(null);

    try {
      const result = await analyzeBeatFromAudioFile(file);
      handleBpmUpdate(result.bpm);
      handleOffsetUpdate(result.startOffset);

      const tag = formatTimestampTag(result.startOffset);
      setAnalysisResultMsg(`✓ Auto-detectado: ${result.bpm} BPM · Inicio: ${result.startOffset}s (${tag})`);
    } catch (err) {
      console.warn('Error analyzing audio beat client-side:', err);
      setAnalysisResultMsg('No se pudo determinar el tempo automáticamente.');
    } finally {
      setIsAnalyzingBeat(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadedFileRef.current = file;
      setAudioFileName(file.name);
      rapAudioEngine.loadAudioFile(file);
      runBeatAnalysis(file);
    }
  };

  const handleRemoveAudio = () => {
    rapAudioEngine.removeAudioFile();
    uploadedFileRef.current = null;
    setAudioFileName('');
    setAnalysisResultMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || audioDuration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = percentage * audioDuration;
    rapAudioEngine.seek(targetSeconds);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="w-full bg-[#10111a] border-b border-[#232536] px-4 sm:px-6 py-3 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left Section: Transport Controls & Metronome */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer font-bold ${
                isPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
                  : 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-400/20'
              }`}
              title={isPlaying ? 'Pausar (Ctrl+Espacio)' : 'Reproducir (Ctrl+Espacio)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Rewind / Restart Button */}
            <button
              onClick={handleRestart}
              className="w-10 h-10 rounded-lg bg-[#171926] hover:bg-[#202334] border border-[#2b2d42] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Reiniciar al compás 1 y segundo 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* BPM Input and Tap Tempo */}
            <div className="flex items-center bg-[#171926] border border-[#2b2d42] rounded-lg p-1 gap-1.5">
              <span className="text-[10px] font-urban-display uppercase tracking-wider text-slate-400 px-2 font-bold">
                BPM
              </span>
              <input
                type="number"
                min={40}
                max={240}
                value={bpm}
                onChange={(e) => handleBpmUpdate(parseInt(e.target.value) || 90)}
                className="w-14 bg-[#0d0e16] border border-[#30334d] text-center text-sm font-code font-bold text-amber-300 rounded px-1.5 py-1 focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleTapTempo}
                className="px-2 py-1 text-[11px] font-urban-heading font-semibold text-slate-300 hover:text-white bg-[#222436] hover:bg-[#2c2f48] rounded transition-colors cursor-pointer"
                title="Haz clic rítmicamente para calcular el tempo"
              >
                TAP
              </button>
            </div>

            {/* Genre BPM Presets */}
            <div className="hidden sm:flex items-center gap-1">
              {[
                { label: '85 BoomBap', val: 85 },
                { label: '90 Clásico', val: 90 },
                { label: '120 Trap', val: 120 },
                { label: '140 Drill', val: 140 }
              ].map(p => (
                <button
                  key={p.val}
                  onClick={() => handleBpmUpdate(p.val)}
                  className={`text-[11px] px-2 py-1 rounded transition-colors cursor-pointer font-code ${
                    bpm === p.val
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1c2b]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Beat 1-2-3-4 Pulse Meter */}
            <div className="flex items-center gap-1.5 bg-[#0d0e16] border border-[#232536] px-3 py-1.5 rounded-lg">
              <span className="text-[10px] uppercase font-urban-display text-slate-500 font-bold mr-1">Compás</span>
              {[0, 1, 2, 3].map((b) => {
                const isCurrent = isPlaying && currentBeat === b;
                const isAccent = b === 0;
                return (
                  <div
                    key={b}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-code font-bold transition-all ${
                      isCurrent
                        ? isAccent
                          ? 'bg-amber-400 text-black scale-110 shadow-md shadow-amber-400/50'
                          : 'bg-cyan-400 text-black scale-105 shadow-md shadow-cyan-400/40'
                        : 'bg-[#181926] text-slate-500'
                    }`}
                  >
                    {b + 1}
                  </div>
                );
              })}
              <div className="ml-2 pl-2 border-l border-[#282a3d] text-xs font-code text-slate-300">
                Barra <span className="text-amber-400 font-bold">#{audioBar}</span>
              </div>
            </div>

            {/* Volume Control & Mute */}
            <div className="relative flex items-center">
              <button
                onClick={handleToggleMute}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowVolumeSlider(!showVolumeSlider);
                }}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-[#181926] border-[#2b2d42] text-slate-300 hover:text-white'
                }`}
                title={isMuted ? 'Activar sonido (Click derecho para volumen)' : 'Silenciar click (Click derecho para volumen)'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className="text-[10px] font-code text-slate-400 hover:text-amber-300 ml-1.5 px-1 py-0.5 rounded cursor-pointer"
                title="Ajustar volumen"
              >
                {Math.round(volume * 100)}%
              </button>

              {showVolumeSlider && (
                <div className="absolute left-0 top-full mt-2 p-3 bg-[#141522] border border-[#2b2d42] rounded-xl shadow-2xl z-50 flex items-center gap-2 min-w-[150px]">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-24 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] font-code text-slate-300 w-8 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Instrumental Base File & Offset */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Base start offset in seconds */}
            <div className="flex items-center bg-[#171926] border border-[#2b2d42] rounded-lg px-2.5 py-1 gap-2">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                Inicio base:
              </span>
              <input
                type="number"
                step={0.1}
                min={0}
                value={timeOffset}
                onChange={(e) => handleOffsetUpdate(parseFloat(e.target.value) || 0)}
                className="w-14 bg-[#0d0e16] border border-[#30334d] text-center text-xs font-code font-bold text-cyan-300 rounded px-1 py-0.5 focus:outline-none focus:border-cyan-400"
                title="Offset en segundos antes de que empiece el primer compás"
              />
              <span className="text-[10px] text-slate-500 font-code">seg</span>
            </div>

            {/* Audio instrumental file loader and auto-analysis */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
              />

              {hasAudioFile ? (
                <div className="flex items-center gap-2 bg-cyan-950/30 border border-cyan-800/40 rounded-lg px-3 py-1">
                  <div className="max-w-[130px] truncate text-xs text-cyan-300 font-medium" title={audioFileName}>
                    {audioFileName}
                  </div>
                  {audioDuration > 0 && (
                    <span className="text-[10px] font-code text-cyan-400/80">
                      {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </span>
                  )}

                  {/* Re-analyze button */}
                  <button
                    onClick={() => {
                      if (uploadedFileRef.current) {
                        runBeatAnalysis(uploadedFileRef.current);
                      }
                    }}
                    disabled={isAnalyzingBeat}
                    className="p-1 hover:text-amber-300 text-slate-400 transition-colors cursor-pointer disabled:opacity-50"
                    title="Auto-detectar BPM e inicio del beat con Web Audio"
                  >
                    {isAnalyzingBeat ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>

                  <button
                    onClick={handleRemoveAudio}
                    className="p-1 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
                    title="Eliminar base"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="audio-upload"
                  className="px-3 py-1.5 text-xs font-urban-heading font-medium bg-[#171926] hover:bg-[#202334] text-slate-300 hover:text-white border border-[#2b2d42] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Carga una instrumental MP3 o WAV (analiza BPM e inicio 100% en el cliente)"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subir Base (Auto BPM)</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Audio Analysis Feedback Badge */}
        {isAnalyzingBeat && (
          <div className="flex items-center gap-2 text-xs font-code text-amber-300 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-lg animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analizando transitorios de bombo y tempo en el navegador (Web Audio API)...</span>
          </div>
        )}

        {!isAnalyzingBeat && analysisResultMsg && (
          <div className="flex items-center justify-between gap-2 text-xs font-code text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{analysisResultMsg}</span>
            </div>
            <span className="text-[10px] text-slate-400">Configurado automáticamente</span>
          </div>
        )}

        {/* Audio Scrubber / Seek Bar (visible when audio file is loaded) */}
        {hasAudioFile && audioDuration > 0 && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[10px] font-code text-slate-400 w-10">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              className="flex-1 bg-[#1a1c2b] hover:bg-[#222538] h-2 rounded-full cursor-pointer relative overflow-hidden transition-colors"
              title="Haz clic para saltar en la pista de audio"
            >
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 transition-all duration-100 rounded-full"
              />
            </div>
            <span className="text-[10px] font-code text-slate-500 w-10 text-right">
              {formatTime(audioDuration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
