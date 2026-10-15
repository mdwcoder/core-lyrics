import React, { useState } from 'react';
import {
  Download,
  FileText,
  Sparkles,
  Clock,
  Music2,
  HelpCircle,
  UploadCloud,
  Undo2,
  Redo2,
  Menu,
  X,
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface TopBarProps {
  onNewSong: () => void;
  onLoadTemplate: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onImportClick?: () => void;
  isTimelineOpen: boolean;
  onToggleTimeline: () => void;
  totalBars: number;
  totalSyllables: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onOpenInstall?: () => void;
  canInstall?: boolean;
  isAppInstalled?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onNewSong,
  onLoadTemplate,
  onOpenExport,
  onOpenHelp,
  onImportClick,
  isTimelineOpen,
  onToggleTimeline,
  totalBars: _totalBars,
  totalSyllables: _totalSyllables,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenInstall,
  canInstall = false,
  isAppInstalled = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[#232536] bg-[#0d0e16]/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
        {/* Zone 1: Wordmark & Undo/Redo quick actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2 group text-decoration-none cursor-default"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <div className="w-full h-full bg-[#0a0b10] rounded-[6px] flex items-center justify-center">
                <Music2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              </div>
            </div>
            <span className="text-lg sm:text-xl font-urban-display tracking-tight text-white whitespace-nowrap">
              CORE<span className="text-amber-400">LYRICS</span>
            </span>
          </a>

          {/* Undo / Redo Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1 border-l border-[#232536] pl-1.5 sm:pl-2.5 ml-0.5 sm:ml-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 text-slate-400 p-1.5 rounded hover:bg-[#1a1c2b] transition-colors cursor-pointer disabled:cursor-default"
              title="Deshacer (Cmd+Z en Mac / Ctrl+Z en PC)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="hover:text-white disabled:opacity-30 disabled:hover:text-slate-500 text-slate-400 p-1.5 rounded hover:bg-[#1a1c2b] transition-colors cursor-pointer disabled:cursor-default"
              title="Rehacer (Cmd+Shift+Z en Mac / Ctrl+Shift+Z / Ctrl+Y en PC)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links (Hidden on small mobile) */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={onNewSong}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
            title="Nuevo verso en blanco"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Nuevo Verso</span>
          </button>

          <button
            onClick={onLoadTemplate}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
            title="Cargar plantilla de 16 barras de rap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Plantilla 16 Barras</span>
          </button>

          {onImportClick && (
            <button
              onClick={onImportClick}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
              title="Importar proyecto JSON o texto con marcas //-//"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar</span>
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
            title="Exportar letra y proyecto en TXT, JSON o LRC"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
            title="Guía de métrica, aliteraciones, retruécanos y atajos"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Ayuda</span>
          </button>
        </nav>

        {/* Zone 3: Actions (PWA install, Timeline toggle, Mobile Menu burger) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* PWA Install Button (desktop & mobile) */}
          {canInstall && !isAppInstalled && onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gradient-to-r from-amber-400/15 via-rose-500/15 to-cyan-400/15 hover:from-amber-400/25 hover:via-rose-500/25 hover:to-cyan-400/25 border border-amber-400/30 text-amber-300 rounded-lg text-xs font-urban-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-400/10"
              title="Instalar CoreLyrics como app en tu pantalla de inicio"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Instalar App</span>
              <span className="sm:hidden text-[11px]">Instalar</span>
            </button>
          )}

          {/* Desktop Timeline & BPM button */}
          <button
            onClick={onToggleTimeline}
            className={`hidden md:flex px-3 sm:px-4 py-2 text-xs font-urban-heading font-bold rounded-lg transition-all items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 border ${
              isTimelineOpen
                ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/20'
                : 'bg-[#151724] text-slate-200 border-[#2b2d42] hover:bg-[#1e2032] hover:border-amber-400/40'
            }`}
            title="Activa o desactiva la barra de tiempo, BPM y metrónomo"
          >
            <Clock className={`w-3.5 h-3.5 ${isTimelineOpen ? 'text-black' : 'text-amber-400'}`} />
            <span>{isTimelineOpen ? 'Ocultar Timeline' : 'Timeline y BPM'}</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-300 hover:text-white bg-[#151724] border border-[#2b2d42] rounded-lg transition-colors cursor-pointer"
            aria-label="Abrir menú"
            title="Menú"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Slide-Over Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div
            className="w-4/5 max-w-xs bg-[#0f1019] border-l border-[#232536] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#232536] bg-[#141524]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                  <Music2 className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="font-urban-display text-sm font-bold text-white tracking-wide">
                  Menú CoreLyrics
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202236] transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Actions List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 text-xs font-urban-heading">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNewSong();
                }}
                className="w-full p-3 rounded-xl bg-[#141624] hover:bg-[#1a1c2d] active:bg-[#22253c] border border-[#232536] flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Nuevo Verso en Blanco</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLoadTemplate();
                }}
                className="w-full p-3 rounded-xl bg-[#141624] hover:bg-[#1a1c2d] active:bg-[#22253c] border border-[#232536] flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Plantilla 16 Barras</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {onImportClick && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onImportClick();
                  }}
                  className="w-full p-3 rounded-xl bg-[#141624] hover:bg-[#1a1c2d] active:bg-[#22253c] border border-[#232536] flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span>Importar Proyecto</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenExport();
                }}
                className="w-full p-3 rounded-xl bg-[#141624] hover:bg-[#1a1c2d] active:bg-[#22253c] border border-[#232536] flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Exportar Letra (TXT / Timestamps)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onToggleTimeline();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  isTimelineOpen
                    ? 'bg-amber-400/15 border-amber-400/40 text-amber-300 font-bold'
                    : 'bg-[#141624] hover:bg-[#1a1c2d] active:bg-[#22253c] border-[#232536] text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{isTimelineOpen ? 'Ocultar Timeline Beat' : 'Ver Timeline & BPM'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenHelp();
                }}
                className="w-full p-3 rounded-xl bg-[#141624] hover:bg-[#1a1c2d] active:bg-[#22253c] border border-[#232536] flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Guía & Atajos de Teclado</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {onOpenInstall && (
                <div className="pt-2 mt-auto">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenInstall();
                    }}
                    className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 text-black font-urban-display font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 stroke-[2.5]" />
                    <span>{isAppInstalled ? 'App Instalada ✓' : 'Instalar como App PWA'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 text-center border-t border-[#232536] text-[10px] text-slate-500 font-code">
              CORE-LYRICS · PWA Studio 1.0.0
            </div>
          </div>
        </div>
      )}
    </>
  );
};
