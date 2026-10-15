/**
 * CORE-LYRICS · Rap Songwriting Studio
 * Live multi-syllabic rhyme analysis, syllable metric counter, rhythm timeline,
 * client-side Web Audio BPM & onset detection, and //-//MM:SS:CC//-// timestamp export.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { TimelineBar } from './components/TimelineBar';
import { LyricEditor } from './components/LyricEditor';
import { RhymeInspector } from './components/RhymeInspector';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import {
  analyzeSongLyrics,
  FlowMarker,
  SongAnalysis
} from './lib/phonetics/rhymeDetector';
import { rapAudioEngine } from './lib/audio/metronome';
import { Check } from 'lucide-react';

// Default demo displaying authentic Spanish rap techniques: alliteration, retruécano, multi-syllabic and compound schemes
const DEMO_LYRICS = `Rompo ritmos rudos con rimas reales
Tres tristes traidores trayendo males
No vivo para rimar, rimo para vivir
Buscando en cada barra una razón para existir

Bajo la noche camino sin rumbo fijo
El asfalto me llama como a su propio hijo
Siento en el pecho toda esta furia ciega
Mientras la tormenta cae como lluvia negra`;

// Snapshot structure for undo/redo history stack
interface HistorySnapshot {
  rawText: string;
  flowMarkers: Record<number, FlowMarker>;
}

export default function App() {
  const [rawText, setRawText] = useState<string>(() => {
    return localStorage.getItem('core_lyrics_lyrics') ||
      localStorage.getItem('rhymeflow_lyrics') ||
      DEMO_LYRICS;
  });

  const [flowMarkers, setFlowMarkers] = useState<Record<number, FlowMarker>>(() => {
    try {
      const saved = localStorage.getItem('core_lyrics_flow_markers') ||
        localStorage.getItem('rhymeflow_flow_markers');
      return saved ? JSON.parse(saved) : { 2: 'triplet', 3: 'triplet', 6: 'double_tempo' };
    } catch {
      return {};
    }
  });

  // Global Undo / Redo History Stacks
  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);

  const currentStateRef = useRef<HistorySnapshot>({ rawText, flowMarkers });
  useEffect(() => {
    currentStateRef.current = { rawText, flowMarkers };
  }, [rawText, flowMarkers]);

  const isTypingBurstRef = useRef<boolean>(false);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBurstTimeRef = useRef<number>(Date.now());

  const handleUndo = useCallback(() => {
    if (burstTimeoutRef.current) {
      clearTimeout(burstTimeoutRef.current);
      burstTimeoutRef.current = null;
    }
    isTypingBurstRef.current = false;

    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previousSnapshot = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      const currentSnapshot = currentStateRef.current;
      setFuture((prevFuture) => [currentSnapshot, ...prevFuture.slice(0, 99)]);

      currentStateRef.current = previousSnapshot;
      setRawText(previousSnapshot.rawText);
      setFlowMarkers(previousSnapshot.flowMarkers);

      return newPast;
    });
  }, []);

  const handleRedo = useCallback(() => {
    if (burstTimeoutRef.current) {
      clearTimeout(burstTimeoutRef.current);
      burstTimeoutRef.current = null;
    }
    isTypingBurstRef.current = false;

    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const nextSnapshot = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      const currentSnapshot = currentStateRef.current;
      setPast((prevPast) => [...prevPast.slice(-99), currentSnapshot]);

      currentStateRef.current = nextSnapshot;
      setRawText(nextSnapshot.rawText);
      setFlowMarkers(nextSnapshot.flowMarkers);

      return newFuture;
    });
  }, []);

  // Intelligent text change recorder: records checkpoints on pauses, line breaks, or large text changes
  const handleTextChange = useCallback((newText: string) => {
    const currentSnapshot = currentStateRef.current;
    const now = Date.now();
    const timeSinceLastBurst = now - lastBurstTimeRef.current;
    const isLengthJump = Math.abs(newText.length - currentSnapshot.rawText.length) > 2;
    const isLineCountChange = newText.split('\n').length !== currentSnapshot.rawText.split('\n').length;
    const endsWithWhitespace = newText.endsWith(' ') || newText.endsWith('\n');

    if (!isTypingBurstRef.current || isLengthJump || isLineCountChange || timeSinceLastBurst > 1500) {
      setPast((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].rawText === currentSnapshot.rawText) {
          return prev;
        }
        return [...prev.slice(-99), currentSnapshot];
      });
      setFuture([]);
      isTypingBurstRef.current = !endsWithWhitespace && !isLineCountChange;
      lastBurstTimeRef.current = now;
    }

    if (burstTimeoutRef.current) {
      clearTimeout(burstTimeoutRef.current);
    }

    burstTimeoutRef.current = setTimeout(() => {
      isTypingBurstRef.current = false;
    }, 750);

    currentStateRef.current = { rawText: newText, flowMarkers: currentSnapshot.flowMarkers };
    setRawText(newText);
  }, []);

  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(90);
  const [timeOffset, setTimeOffset] = useState<number>(() => {
    const saved = localStorage.getItem('core_lyrics_time_offset');
    return saved ? parseFloat(saved) : 0;
  });

  const [activeRhymeHover, setActiveRhymeHover] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportModalMode, setExportModalMode] = useState<'export' | 'import'>('export');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Auto-save changes to localStorage (migrated to core_lyrics namespace)
  useEffect(() => {
    localStorage.setItem('core_lyrics_lyrics', rawText);
  }, [rawText]);

  useEffect(() => {
    localStorage.setItem('core_lyrics_flow_markers', JSON.stringify(flowMarkers));
  }, [flowMarkers]);

  useEffect(() => {
    localStorage.setItem('core_lyrics_time_offset', String(timeOffset));
  }, [timeOffset]);

  // Compute live phonetic analysis on every space, enter, or character change
  const songAnalysis: SongAnalysis = useMemo(() => {
    return analyzeSongLyrics(rawText, flowMarkers);
  }, [rawText, flowMarkers]);

  const handleFlowMarkerChange = useCallback((lineIndex: number, marker: FlowMarker) => {
    const currentSnapshot = currentStateRef.current;
    setPast((prev) => [...prev.slice(-99), currentSnapshot]);
    setFuture([]);
    setFlowMarkers((prev) => {
      const updated = {
        ...prev,
        [lineIndex]: marker
      };
      currentStateRef.current = { rawText: currentSnapshot.rawText, flowMarkers: updated };
      return updated;
    });
  }, []);

  const handleManualSave = useCallback(() => {
    localStorage.setItem('core_lyrics_lyrics', rawText);
    localStorage.setItem('core_lyrics_flow_markers', JSON.stringify(flowMarkers));
    localStorage.setItem('core_lyrics_time_offset', String(timeOffset));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }, [rawText, flowMarkers, timeOffset]);

  const handleImportProject = useCallback((project: { rawText: string; flowMarkers?: Record<number, FlowMarker>; bpm?: number; timeOffset?: number }) => {
    const currentSnapshot = currentStateRef.current;
    setPast((prev) => [...prev.slice(-99), currentSnapshot]);
    setFuture([]);
    setRawText(project.rawText);
    if (project.flowMarkers) {
      setFlowMarkers(project.flowMarkers);
    }
    if (typeof project.bpm === 'number') {
      setBpm(project.bpm);
      rapAudioEngine.setBpm(project.bpm);
    }
    if (typeof project.timeOffset === 'number') {
      setTimeOffset(project.timeOffset);
      rapAudioEngine.setTimeOffset(project.timeOffset);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }, []);

  const handleNewSong = useCallback(() => {
    if (rawText.trim().length > 0 && !window.confirm('¿Quieres iniciar una nueva letra? Se vaciará el editor actual.')) {
      return;
    }
    const currentSnapshot = currentStateRef.current;
    setPast((prev) => [...prev.slice(-99), currentSnapshot]);
    setFuture([]);
    setRawText('');
    setFlowMarkers({});
  }, [rawText]);

  const handleLoadTemplate = useCallback(() => {
    const template16Bars = `Entro en el compás marcando bien el paso
No dejo que mi pluma caiga en el fracaso
Camino por la calle buscando mi destino
Dejando una huella firme por el camino

Cierro los ojos y siento la furia ciega
Mientras el cielo llora con lluvia negra
El bombo me golpea como un latido fuerte
Rimando con destreza desafiando a la muerte

Quiero que el mensaje viaje por el viento
Expresando con palabras todo lo que siento
La tinta en el papel derrama fuego ardiente
Un estilo genuino que despierta la mente

Termino los compases con total certeza
Elevando la barra con máxima destreza
Esta es mi disciplina grabada en el papel
Un flow indestructible para coronar el nivel`;

    const newMarkers: Record<number, FlowMarker> = {
      4: 'triplet',
      5: 'triplet',
      8: 'double_tempo',
      9: 'double_tempo',
      12: 'melodic',
      14: 'pause'
    };

    const currentSnapshot = currentStateRef.current;
    setPast((prev) => [...prev.slice(-99), currentSnapshot]);
    setFuture([]);
    setRawText(template16Bars);
    setFlowMarkers(newMarkers);
  }, []);

  // Global keyboard shortcut listeners (Cmd+Z / Ctrl+Z, Ctrl+Space for Beat, Ctrl+S for Save)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Audio beat toggle: Ctrl+Space, Cmd+Space, Alt+Space
      if ((e.ctrlKey || e.metaKey || e.altKey) && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        rapAudioEngine.toggle();
        return;
      }

      // Save shortcut: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleManualSave();
        return;
      }

      // Global Undo/Redo across entire app (Cmd+Z on Mac, Ctrl+Z on PC/Linux)
      const target = e.target as HTMLElement | null;
      const isInput = target && target.tagName === 'INPUT';
      if (!isInput) {
        const isZ = e.key === 'z' || e.key === 'Z';
        const isY = e.key === 'y' || e.key === 'Y';
        const isModifier = e.metaKey || e.ctrlKey;

        if (isModifier && !e.altKey) {
          if ((e.shiftKey && isZ) || (!e.metaKey && !e.shiftKey && isY)) {
            e.preventDefault();
            handleRedo();
            return;
          }
          if (!e.shiftKey && isZ) {
            e.preventDefault();
            handleUndo();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleManualSave, handleUndo, handleRedo]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f3f4f6] flex flex-col selection:bg-amber-400 selection:text-black relative">
      {/* Top Navigation */}
      <TopBar
        onNewSong={handleNewSong}
        onLoadTemplate={handleLoadTemplate}
        onOpenExport={() => {
          setExportModalMode('export');
          setIsExportOpen(true);
        }}
        onImportClick={() => {
          setExportModalMode('import');
          setIsExportOpen(true);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
        isTimelineOpen={isTimelineOpen}
        onToggleTimeline={() => setIsTimelineOpen(!isTimelineOpen)}
        totalBars={songAnalysis.totalBars}
        totalSyllables={songAnalysis.totalSyllables}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Optional Rhythm Timeline & Beat Sync */}
      {isTimelineOpen && (
        <TimelineBar
          currentBarIndex={1}
          totalBars={songAnalysis.totalBars}
          bpm={bpm}
          onBpmChange={setBpm}
          timeOffset={timeOffset}
          onTimeOffsetChange={setTimeOffset}
        />
      )}

      {/* Workspace: Lyric Editor & Rhyme Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Bar Worksheet Editor */}
        <LyricEditor
          rawText={rawText}
          analysis={songAnalysis}
          onTextChange={handleTextChange}
          flowMarkers={flowMarkers}
          onFlowMarkerChange={handleFlowMarkerChange}
          activeRhymeHover={activeRhymeHover}
          onRhymeHover={setActiveRhymeHover}
          onManualSave={handleManualSave}
          bpm={bpm}
          timeOffset={timeOffset}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* Sidebar Rhyme Inspector, Dictionary & Stats */}
        <RhymeInspector
          analysis={songAnalysis}
          activeRhymeHover={activeRhymeHover}
          onRhymeHover={setActiveRhymeHover}
        />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rawText={rawText}
        analysis={songAnalysis}
        flowMarkers={flowMarkers}
        bpm={bpm}
        timeOffset={timeOffset}
        initialMode={exportModalMode}
        onImportProject={handleImportProject}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161828] border border-amber-400/50 shadow-2xl shadow-amber-400/20 text-white px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-urban-heading font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>Proyecto guardado en CoreLyrics</span>
        </div>
      )}
    </div>
  );
}
