import React, { useState, useRef } from 'react';
import {
  SongAnalysis,
  LineAnalysis,
  FlowMarker,
  RhymeColorDefinition,
  RHYME_PALETTE
} from '../lib/phonetics/rhymeDetector';
import { FLOW_MARKER_CONFIG, FlowMarkerSelector } from './FlowMarkerSelector';
import { rapAudioEngine } from '../lib/audio/metronome';
import {
  Plus,
  ChevronDown,
  Flame,
  Repeat
} from 'lucide-react';

interface LyricEditorProps {
  rawText: string;
  analysis: SongAnalysis;
  onTextChange: (text: string) => void;
  flowMarkers: Record<number, FlowMarker>;
  onFlowMarkerChange: (lineIndex: number, marker: FlowMarker) => void;
  activeRhymeHover: string | null;
  onRhymeHover: (letter: string | null) => void;
  onManualSave?: () => void;
}

const LINE_HEIGHT = 46; // Fixed line height for 100% synchronized gutter & in-place highlight

export const LyricEditor: React.FC<LyricEditorProps> = ({
  rawText,
  analysis,
  onTextChange,
  flowMarkers,
  onFlowMarkerChange,
  activeRhymeHover,
  onRhymeHover,
  onManualSave
}) => {
  const [activeSelectorLine, setActiveSelectorLine] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const gutterLeftRef = useRef<HTMLDivElement>(null);
  const gutterRightRef = useRef<HTMLDivElement>(null);

  // Synchronize scrolling between textarea, mirror highlight layer, and gutters
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (mirrorRef.current) {
      mirrorRef.current.scrollTop = scrollTop;
      mirrorRef.current.scrollLeft = scrollLeft;
    }
    if (gutterLeftRef.current) {
      gutterLeftRef.current.scrollTop = scrollTop;
    }
    if (gutterRightRef.current) {
      gutterRightRef.current.scrollTop = scrollTop;
    }
  };

  const lines = rawText.split('\n');

  // Quick insert bar at end
  const handleAddBar = () => {
    const newText = rawText ? `${rawText}\n` : '';
    onTextChange(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
      }
    }, 10);
  };

  // Helper to get color definition for a letter
  const getColorForLetter = (letter: string): RhymeColorDefinition => {
    return RHYME_PALETTE.find((c) => c.id === letter) || RHYME_PALETTE[0];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Space or Alt+Space to toggle audio playback
    if ((e.ctrlKey || e.metaKey || e.altKey) && (e.code === 'Space' || e.key === ' ')) {
      e.preventDefault();
      rapAudioEngine.toggle();
      return;
    }

    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      onManualSave?.();
      return;
    }

    // Escape closes flow marker dropdown
    if (e.key === 'Escape') {
      if (activeSelectorLine !== null) {
        e.preventDefault();
        setActiveSelectorLine(null);
      }
      return;
    }

    // Tab key handling (insert 2 spaces instead of leaving textarea)
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const spaces = '  ';
      const updated = rawText.substring(0, start) + spaces + rawText.substring(end);
      onTextChange(updated);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + spaces.length;
          textareaRef.current.selectionEnd = start + spaces.length;
        }
      }, 0);
    }
  };

  // Render highlighted spans for a specific line in the mirror layer
  const renderLineContent = (lineText: string, lineAnalysis?: LineAnalysis) => {
    if (!lineText) {
      return '\u00A0';
    }

    if (!lineAnalysis || lineAnalysis.highlightSpans.length === 0) {
      return <span className="text-[#f3f4f6]">{lineText}</span>;
    }

    const sortedSpans = [...lineAnalysis.highlightSpans].sort((a, b) => a.start - b.start);
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedSpans.forEach((span, i) => {
      if (span.start > lastIndex) {
        elements.push(
          <span key={`plain-${i}`} className="text-[#f3f4f6]">
            {lineText.substring(lastIndex, span.start)}
          </span>
        );
      }

      const isFamilyHovered = activeRhymeHover === span.letter;

      elements.push(
        <span
          key={`span-${i}`}
          style={{
            backgroundColor: isFamilyHovered ? span.color.hex : span.color.bg,
            color: isFamilyHovered ? '#000000' : span.color.text,
            borderBottom: `2.5px solid ${span.color.border}`,
            boxShadow: isFamilyHovered
              ? `0 0 12px ${span.color.hex}90`
              : `0 0 6px ${span.color.hex}30`,
            fontWeight: 700
          }}
          className="rounded-xs transition-colors"
          title={`${span.letter} · ${span.pattern}`}
        >
          {span.text}
        </span>
      );

      lastIndex = span.end;
    });

    if (lastIndex < lineText.length) {
      elements.push(
        <span key="plain-end" className="text-[#f3f4f6]">
          {lineText.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#090a0f] relative overflow-hidden select-none">
      {/* Top Banner: Metrics & In-place status */}
      <div className="flex items-center justify-between px-6 py-2 bg-[#0e0f17] border-b border-[#1f2130] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-urban-display font-bold uppercase tracking-wider text-[11px]">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>Escritura & Métrica en Vivo</span>
          </div>

          <span className="text-slate-600">·</span>

          <span className="text-slate-400 text-[11px] hidden md:inline">
            Aliteraciones, retruécanos y esquemas multirrima (CB, BC, AA) se detectan al vuelo.
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-code">
          <span className="text-slate-400">
            Barras: <strong className="text-white">{analysis.totalBars}</strong>
          </span>
          <span className="text-slate-400">
            Sílabas: <strong className="text-cyan-400">{analysis.totalSyllables}</strong>
          </span>
          {analysis.alliterationsCount > 0 && (
            <span className="text-emerald-400 font-bold hidden sm:inline" title="Repetición de fonemas consonantes">
              {analysis.alliterationsCount} aliterac.
            </span>
          )}
          {analysis.mirrorVersesCount > 0 && (
            <span className="text-rose-400 font-bold hidden sm:inline" title="Retruécanos o quiasmos de rima (versos en espejo)">
              {analysis.mirrorVersesCount} retruécano(s)
            </span>
          )}
          <button
            onClick={handleAddBar}
            className="px-2.5 py-1 bg-[#1a1c2b] hover:bg-[#25283d] text-slate-200 hover:text-white border border-[#2b2d42] rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-urban-heading text-[11px]"
          >
            <Plus className="w-3 h-3 text-amber-400" />
            <span>Añadir Barra</span>
          </button>
        </div>
      </div>

      {/* Main Studio Editor Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT GUTTER: Bar Numbers, Syllables, Flow Markers & Alliteration Badges */}
        <div
          ref={gutterLeftRef}
          className="w-52 md:w-64 bg-[#0b0c14] border-r border-[#1f2130] shrink-0 overflow-hidden select-none py-4"
        >
          {lines.map((lineText, idx) => {
            const isBlank = lineText.trim().length === 0;
            const lineAnalysis = analysis.lines.find((l) => l.lineIndex === idx);
            const marker = flowMarkers[idx] || 'default';
            const markerCfg = FLOW_MARKER_CONFIG[marker];

            if (isBlank) {
              return (
                <div
                  key={idx}
                  style={{ height: `${LINE_HEIGHT}px` }}
                  className="flex items-center justify-center px-2 text-[10px] font-code text-slate-600 border-y border-[#181926]/50 bg-[#0d0e17]/50"
                >
                  <span>── Salto Estrofa ──</span>
                </div>
              );
            }

            const barNum = lineAnalysis ? lineAnalysis.barNumber : idx + 1;
            const syllables = lineAnalysis ? lineAnalysis.metricSyllables : 0;
            const alliteration = lineAnalysis?.alliteration;
            const mirror = lineAnalysis?.mirrorVerse;

            return (
              <div
                key={idx}
                style={{ height: `${LINE_HEIGHT}px` }}
                className="flex items-center justify-between px-3 group hover:bg-[#131422] transition-colors gap-1.5"
              >
                {/* Bar Number */}
                <span className="text-[11px] font-code font-bold text-slate-500 group-hover:text-amber-400 transition-colors w-7 shrink-0">
                  #{String(barNum).padStart(2, '0')}
                </span>

                {/* Syllable Counter Badge */}
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-[#141524] border border-[#232538] rounded text-[10px] font-code text-slate-300 shrink-0"
                  title={`Métrica: ${syllables} sílabas con sinalefas`}
                >
                  <span className="text-cyan-400 font-bold">{syllables}</span>
                  <span className="text-[9px] text-slate-500 font-urban-heading">síl</span>
                </div>

                {/* Flow Switch Badge */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveSelectorLine(activeSelectorLine === idx ? null : idx)}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-code font-bold border transition-all cursor-pointer ${markerCfg.bg} ${markerCfg.color} ${markerCfg.border}`}
                    title={`Flow rítmico: ${markerCfg.label} (Clic para cambiar)`}
                  >
                    <span>{markerCfg.badge}</span>
                    <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                  </button>

                  {/* Flow Dropdown */}
                  {activeSelectorLine === idx && (
                    <>
                      <div
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSelectorLine(null);
                        }}
                      />
                      <div className="absolute left-0 top-full mt-1 z-50">
                        <FlowMarkerSelector
                          currentMarker={marker}
                          onChange={(newMarker) => {
                            onFlowMarkerChange(idx, newMarker);
                            setActiveSelectorLine(null);
                          }}
                          onClose={() => setActiveSelectorLine(null)}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Special Rap Technique Indicator: Alliteration or Retruécano */}
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {alliteration && (
                    <span
                      className="px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[9px] font-code font-bold truncate shrink-0"
                      title={`Aliteración: repetición del sonido "${alliteration.sound}" (${alliteration.count} veces)`}
                    >
                      alit:"{alliteration.sound}"
                    </span>
                  )}
                  {mirror && (
                    <span
                      className="px-1 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[9px] font-code font-bold truncate shrink-0 flex items-center gap-0.5"
                      title={`${mirror.detail} (con barra #${mirror.partnerLine})`}
                    >
                      <Repeat className="w-2.5 h-2.5" />
                      <span>⇄#{mirror.partnerLine}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CENTER WRITING AREA: In-Place Highlighting Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#090a0f]">
          {/* Layer 1: Mirror Highlight Canvas (directly under typing caret) */}
          <div
            ref={mirrorRef}
            className="absolute inset-0 p-4 font-code text-[15px] select-none pointer-events-none overflow-hidden whitespace-pre"
            style={{
              lineHeight: `${LINE_HEIGHT}px`,
              fontFamily: "'Space Mono', monospace"
            }}
            aria-hidden="true"
          >
            {lines.map((lineText, idx) => {
              const lineAnalysis = analysis.lines.find((l) => l.lineIndex === idx);
              return (
                <div
                  key={idx}
                  style={{ height: `${LINE_HEIGHT}px` }}
                  className="whitespace-pre overflow-hidden flex items-center"
                >
                  {renderLineContent(lineText, lineAnalysis)}
                </div>
              );
            })}
          </div>

          {/* Layer 2: Native Textarea (transparent text, visible caret) */}
          <textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            placeholder="Escribe tus rimas aquí... Al pulsar espacio o enter se colorearán las rimas A-color a, B-color b en el mismo sitio... Usa Ctrl+Espacio para el beat y Ctrl+S para guardar."
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-amber-400 font-code text-[15px] resize-none outline-none overflow-auto whitespace-pre selection:bg-amber-400/30 selection:text-transparent"
            style={{
              lineHeight: `${LINE_HEIGHT}px`,
              fontFamily: "'Space Mono', monospace"
            }}
          />
        </div>

        {/* RIGHT GUTTER: Compound Rhyme Schemes (e.g. CB, BC, AA, A) */}
        <div
          ref={gutterRightRef}
          className="w-24 md:w-32 bg-[#0b0c14] border-l border-[#1f2130] shrink-0 overflow-hidden select-none py-4"
        >
          {lines.map((lineText, idx) => {
            const isBlank = lineText.trim().length === 0;
            const lineAnalysis = analysis.lines.find((l) => l.lineIndex === idx);

            if (isBlank) {
              return (
                <div
                  key={idx}
                  style={{ height: `${LINE_HEIGHT}px` }}
                  className="h-[46px]"
                />
              );
            }

            const barScheme = lineAnalysis?.barScheme || '-';
            const hasRhyme = barScheme !== '-';
            const isChiasmus = lineAnalysis?.mirrorVerse?.type === 'quiasmo_rima';

            return (
              <div
                key={idx}
                style={{ height: `${LINE_HEIGHT}px` }}
                className="flex items-center justify-center px-2 group hover:bg-[#131422] transition-colors"
              >
                {hasRhyme ? (
                  <div className="flex items-center gap-1">
                    {/* Render each letter of the barScheme (e.g. 'C' and 'B' for 'CB') */}
                    {barScheme.split('').map((char, charIdx) => {
                      const colorDef = getColorForLetter(char);
                      const isHovered = activeRhymeHover === char;

                      return (
                        <button
                          key={charIdx}
                          onMouseEnter={() => onRhymeHover(char)}
                          onMouseLeave={() => onRhymeHover(null)}
                          onClick={() => onRhymeHover(activeRhymeHover === char ? null : char)}
                          style={{
                            backgroundColor: isHovered ? colorDef.hex : colorDef.bg,
                            borderColor: colorDef.border,
                            color: isHovered ? '#000000' : colorDef.text
                          }}
                          className={`w-6 h-6 rounded border text-[11px] font-urban-display font-bold flex items-center justify-center transition-all cursor-pointer ${
                            isHovered ? 'scale-110 shadow-md shadow-amber-400/30 font-extrabold' : ''
                          } ${isChiasmus ? 'ring-1 ring-rose-400/80 ring-offset-1 ring-offset-[#0b0c14]' : ''}`}
                          title={`Familia ${char} (Esquema de barra: ${barScheme})`}
                        >
                          {char}
                        </button>
                      );
                    })}

                    {/* Badge if it's a mirror/chiasmus line */}
                    {isChiasmus && (
                      <span className="text-[9px] text-rose-400 font-bold ml-0.5" title="Quiasmo rítmico (esquema en espejo)">
                        ⇄
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] font-code text-slate-700">
                    -
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
