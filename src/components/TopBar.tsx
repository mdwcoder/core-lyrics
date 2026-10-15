import React from 'react';
import { Download, FileText, Sparkles, Clock, Music2, HelpCircle, UploadCloud } from 'lucide-react';

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
  totalSyllables: _totalSyllables
}) => {
  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-[#232536] bg-[#0d0e16]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 group text-decoration-none cursor-default">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-cyan-400 p-[1.5px] flex items-center justify-center shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#0a0b10] rounded-[6px] flex items-center justify-center">
              <Music2 className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <span className="text-xl font-urban-display tracking-tight text-white whitespace-nowrap">
            CORE<span className="text-amber-400">LYRICS</span>
          </span>
        </a>
      </div>

      {/* Zone 2: Navigation links / actions */}
      <nav className="flex items-center gap-2 sm:gap-4 md:gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={onNewSong}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider p-1 sm:p-0"
          title="Nuevo verso en blanco"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Nuevo Verso</span>
        </button>

        <button
          onClick={onLoadTemplate}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider p-1 sm:p-0"
          title="Cargar plantilla de 16 barras de rap"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Plantilla 16 Barras</span>
          <span className="hidden sm:inline md:hidden">16 Barras</span>
        </button>

        {onImportClick && (
          <button
            onClick={onImportClick}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider p-1 sm:p-0"
            title="Importar proyecto JSON"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Importar</span>
          </button>
        )}

        <button
          onClick={onOpenExport}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider p-1 sm:p-0"
          title="Exportar letra y proyecto en TXT, JSON o LRC"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Exportar</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider p-1 sm:p-0"
          title="Guía de métrica, aliteraciones, retruécanos y atajos"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Ayuda</span>
        </button>
      </nav>

      {/* Zone 3: Primary action button: Timeline & BPM toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleTimeline}
          className={`px-3 sm:px-4 py-2 text-xs font-urban-heading font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 border ${
            isTimelineOpen
              ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/20'
              : 'bg-[#151724] text-slate-200 border-[#2b2d42] hover:bg-[#1e2032] hover:border-amber-400/40'
          }`}
          title="Activa o desactiva la barra de tiempo, BPM y metrónomo"
        >
          <Clock className={`w-3.5 h-3.5 ${isTimelineOpen ? 'text-black' : 'text-amber-400'}`} />
          <span>{isTimelineOpen ? 'Ocultar Timeline' : 'Timeline y BPM'}</span>
        </button>
      </div>
    </header>
  );
};
