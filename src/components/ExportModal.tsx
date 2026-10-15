import React, { useState, useEffect, useRef } from 'react';
import { SongAnalysis, FlowMarker } from '../lib/phonetics/rhymeDetector';
import { X, Download, Copy, Check, FileJson, FileText, Music, UploadCloud } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  analysis: SongAnalysis;
  flowMarkers: Record<number, FlowMarker>;
  bpm: number;
  initialMode?: 'export' | 'import';
  onImportProject?: (project: { rawText: string; flowMarkers?: Record<number, FlowMarker>; bpm?: number }) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  rawText,
  analysis,
  flowMarkers,
  bpm,
  initialMode = 'export',
  onImportProject
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialMode);
  const [exportFormat, setExportFormat] = useState<'txt_metrics' | 'txt_clean' | 'json' | 'lrc'>('txt_metrics');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setImportError(null);
      setImportSuccess(false);
    }
  }, [isOpen, initialMode]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Generate content based on selected format
  const generateExportContent = (): string => {
    if (exportFormat === 'txt_clean') {
      return rawText;
    }

    if (exportFormat === 'txt_metrics') {
      let out = `CORE-LYRICS · LETRA Y MÉTRICA DE RAP\n`;
      out += `BPM: ${bpm} | Total Barras: ${analysis.totalBars} | Total Sílabas: ${analysis.totalSyllables}\n`;
      out += `--------------------------------------------------------\n\n`;

      analysis.lines.forEach((l) => {
        const markerTag = l.flowMarker !== 'default' ? ` [${l.flowMarker.toUpperCase()}]` : '';
        const rhymeTag = l.rhymeLetter ? ` [RIMA ${l.rhymeLetter}]` : '';
        out += `[#${String(l.barNumber).padStart(2, '0')}] (${String(l.metricSyllables).padStart(2, ' ')} síl)${markerTag}${rhymeTag}: ${l.rawText}\n`;
      });

      return out;
    }

    if (exportFormat === 'lrc') {
      // Generate synchronized LRC based on BPM (4 beats per bar)
      const secPerBeat = 60.0 / bpm;
      const secPerBar = secPerBeat * 4;
      let out = `[ti:Rap Track]\n[ar:MC]\n[al:CoreLyrics Project]\n[by:CoreLyrics Studio]\n`;

      analysis.lines.forEach((l, idx) => {
        const timeInSec = idx * secPerBar;
        const mins = Math.floor(timeInSec / 60);
        const secs = Math.floor(timeInSec % 60);
        const hundredths = Math.floor((timeInSec % 1) * 100);
        const timeTag = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}]`;
        out += `${timeTag}${l.rawText}\n`;
      });

      return out;
    }

    if (exportFormat === 'json') {
      const projectData = {
        app: "core-lyrics",
        version: "1.0.0",
        title: "Rap Song Project",
        createdAt: new Date().toISOString(),
        bpm,
        rawText,
        flowMarkers,
        metrics: {
          totalBars: analysis.totalBars,
          totalSyllables: analysis.totalSyllables,
          averageSyllablesPerBar: analysis.averageSyllablesPerBar,
          rhymeFamiliesCount: analysis.rhymeFamilies.length
        }
      };
      return JSON.stringify(projectData, null, 2);
    }

    return rawText;
  };

  const content = generateExportContent();

  const handleDownload = () => {
    let filename = 'letra_rap.txt';
    let mimeType = 'text/plain';

    if (exportFormat === 'json') {
      filename = 'core_lyrics_proyecto.json';
      mimeType = 'application/json';
    } else if (exportFormat === 'lrc') {
      filename = 'letra_sincronizada.lrc';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessImport = (jsonStr: string) => {
    try {
      setImportError(null);
      const parsed = JSON.parse(jsonStr);

      let textToLoad = '';
      if (typeof parsed.rawText === 'string') {
        textToLoad = parsed.rawText;
      } else if (typeof parsed.lyrics === 'string') {
        textToLoad = parsed.lyrics;
      } else {
        throw new Error('El JSON no contiene un campo "rawText" o "lyrics" válido.');
      }

      const importedFlowMarkers = parsed.flowMarkers || {};
      const importedBpm = typeof parsed.bpm === 'number' ? parsed.bpm : undefined;

      if (onImportProject) {
        onImportProject({
          rawText: textToLoad,
          flowMarkers: importedFlowMarkers,
          bpm: importedBpm
        });
      }

      setImportSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al parsear el archivo JSON.';
      setImportError(msg);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result;
      if (typeof res === 'string') {
        setImportText(res);
        handleProcessImport(res);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#10111a] border border-[#2b2d42] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header with Mode Switch */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232536] bg-[#141522]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 text-sm font-urban-display font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 text-sm font-urban-display font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Importar Proyecto</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2132] transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: Export View */}
        {activeTab === 'export' && (
          <div className="p-6 flex flex-col gap-4">
            {/* Format selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'txt_metrics', label: 'Texto + Métrica', icon: FileText },
                { id: 'txt_clean', label: 'Texto Limpio', icon: FileText },
                { id: 'json', label: 'Proyecto JSON', icon: FileJson },
                { id: 'lrc', label: 'LRC Sincronizado', icon: Music }
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setExportFormat(f.id as typeof exportFormat)}
                    className={`p-2.5 rounded-xl border text-xs font-urban-heading font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      exportFormat === f.id
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-bold'
                        : 'bg-[#151724] border-[#25273b] text-slate-400 hover:text-white hover:border-[#353852]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Preview box */}
            <div className="relative">
              <pre className="w-full h-64 p-3 bg-[#0a0b12] border border-[#212334] rounded-xl text-xs font-code text-slate-300 overflow-y-auto whitespace-pre-wrap select-all">
                {content}
              </pre>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-[#181928] hover:bg-[#222438] text-slate-300 hover:text-white border border-[#2b2d42] rounded-xl text-xs font-urban-heading font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-urban-heading font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Import View */}
        {activeTab === 'import' && (
          <div className="p-6 flex flex-col gap-4">
            <p className="text-xs text-slate-300">
              Carga un archivo de proyecto exportado anteriormente en formato <strong className="text-amber-400">JSON</strong> (con barras, marcadores de flow y BPM) o pega su contenido a continuación.
            </p>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-import-file"
              />
              <label
                htmlFor="json-import-file"
                className="px-4 py-2 bg-[#171926] hover:bg-[#202334] text-white border border-[#2b2d42] rounded-xl text-xs font-urban-heading font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FileJson className="w-4 h-4 text-amber-400" />
                <span>Seleccionar archivo .json</span>
              </label>
              <span className="text-xs text-slate-500">o pega el texto abajo:</span>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Pega aquí el contenido JSON del proyecto..."
              className="w-full h-48 p-3 bg-[#0a0b12] border border-[#212334] rounded-xl text-xs font-code text-slate-200 resize-none outline-none focus:border-amber-400"
            />

            {importError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/50 text-rose-400 text-xs font-urban-heading">
                {importError}
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs font-urban-heading flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>¡Proyecto cargado con éxito en el editor!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleProcessImport(importText)}
                disabled={!importText.trim()}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-urban-heading font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Cargar en el Editor</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
