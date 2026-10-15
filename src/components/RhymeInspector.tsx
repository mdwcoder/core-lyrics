import React, { useState } from 'react';
import {
  SongAnalysis,
  RhymeColorDefinition
} from '../lib/phonetics/rhymeDetector';
import { findRhymes, RhymeSuggestion } from '../lib/phonetics/rhymeDictionary';
import {
  Sparkles,
  Search,
  BarChart2,
  Copy,
  Check,
  Zap,
  Layers,
  ChevronRight,
  Flame,
  Volume2,
  Repeat,
  Radio
} from 'lucide-react';

interface RhymeInspectorProps {
  analysis: SongAnalysis;
  activeRhymeHover: string | null;
  onRhymeHover: (letter: string | null) => void;
}

export const RhymeInspector: React.FC<RhymeInspectorProps> = ({
  analysis,
  activeRhymeHover,
  onRhymeHover
}) => {
  const [activeTab, setActiveTab] = useState<'families' | 'dictionary' | 'stats'>('families');
  const [dictQuery, setDictQuery] = useState('');
  const [dictResults, setDictResults] = useState<RhymeSuggestion[]>([]);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  const handleSearchRhymes = (query: string) => {
    setDictQuery(query);
    if (query.trim().length >= 2) {
      const results = findRhymes(query);
      setDictResults(results);
    } else {
      setDictResults([]);
    }
  };

  const handleCopyWord = (word: string) => {
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 1500);
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-[#0c0d15] border-l border-[#202232] flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Sidebar Tabs */}
      <div className="flex items-center border-b border-[#202232] bg-[#0e0f17] p-1 gap-1">
        <button
          onClick={() => setActiveTab('families')}
          className={`flex-1 py-2 text-xs font-urban-heading font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'families'
              ? 'bg-[#181a28] text-amber-400 border border-amber-400/30 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Familias ({analysis.rhymeFamilies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('dictionary')}
          className={`flex-1 py-2 text-xs font-urban-heading font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'dictionary'
              ? 'bg-[#181a28] text-cyan-400 border border-cyan-400/30 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscador</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 text-xs font-urban-heading font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'stats'
              ? 'bg-[#181a28] text-rose-400 border border-rose-400/30 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Técnicas</span>
        </button>
      </div>

      {/* Tab 1: Rhyme Families */}
      {activeTab === 'families' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="text-[11px] text-slate-400 font-urban-heading flex items-center justify-between">
            <span>Familias de rima detectadas</span>
            <span className="text-[10px] font-code text-slate-500">Pasa el cursor para iluminar</span>
          </div>

          {analysis.rhymeFamilies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 text-xs gap-2">
              <Sparkles className="w-8 h-8 text-slate-600 mb-1" />
              <p className="font-urban-heading font-medium text-slate-400">
                Aún no hay rimas detectadas
              </p>
              <p className="text-[11px] max-w-[200px]">
                Escribe al menos dos versos que rimen (asonantes, consonantes o multisilábicas).
              </p>
            </div>
          ) : (
            analysis.rhymeFamilies.map((fam) => {
              const isHovered = activeRhymeHover === fam.letter;
              const typeColor =
                fam.type === 'multisyllabic'
                  ? 'text-amber-400'
                  : fam.type === 'consonant'
                  ? 'text-cyan-400'
                  : fam.type === 'repetition'
                  ? 'text-rose-400'
                  : 'text-purple-400';

              return (
                <div
                  key={fam.letter}
                  onMouseEnter={() => onRhymeHover(fam.letter)}
                  onMouseLeave={() => onRhymeHover(null)}
                  onClick={() => onRhymeHover(isHovered ? null : fam.letter)}
                  style={{
                    borderColor: isHovered ? fam.color.border : '#222436',
                    backgroundColor: isHovered ? fam.color.bg : '#11121d'
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isHovered ? 'scale-[1.02] shadow-lg ring-1 ring-amber-400/50' : 'hover:border-[#2f324a]'
                  }`}
                  title="Haz clic para fijar el resaltado de esta familia"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          backgroundColor: fam.color.hex,
                          color: '#000000'
                        }}
                        className="w-6 h-6 rounded-md font-urban-display font-bold flex items-center justify-center text-xs shadow-sm"
                      >
                        {fam.letter}
                      </span>
                      <span className="text-xs font-urban-heading font-bold text-white">
                        Familia {fam.letter}
                      </span>
                    </div>

                    <span className={`text-[10px] font-code font-bold uppercase ${typeColor}`}>
                      {fam.type === 'multisyllabic'
                        ? 'Multisilábica'
                        : fam.type === 'consonant'
                        ? 'Consonante'
                        : fam.type === 'repetition'
                        ? 'Repetición'
                        : 'Asonante'}
                    </span>
                  </div>

                  {/* Pattern & Words */}
                  <div className="text-[11px] font-code text-slate-300 bg-[#0a0b12] rounded-lg p-2 border border-[#1b1c2b]">
                    <div className="text-amber-400/90 font-medium mb-1">
                      {fam.pattern}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {fam.sampleWords.map((w, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-[#161828] text-slate-200 border border-[#27293d]"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-code pt-0.5">
                    <span>
                      Barras: {fam.lines.map((b) => `#${b}`).join(', ')}
                    </span>
                    <span>{fam.wordCount} apariciones</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Rhyme Search Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-urban-heading font-semibold text-slate-300">
              Buscador Fonético de Rimas (Español)
            </label>
            <div className="relative">
              <input
                type="text"
                value={dictQuery}
                onChange={(e) => handleSearchRhymes(e.target.value)}
                placeholder="Escribe una palabra (ej. fuego, destino, calle)..."
                className="w-full bg-[#11121d] border border-[#232536] focus:border-cyan-400 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-slate-500 font-urban-heading mr-1">Rápidos:</span>
            {['fuego', 'camino', 'fuerza', 'corazón', 'calle', 'verso'].map((qw) => (
              <button
                key={qw}
                onClick={() => handleSearchRhymes(qw)}
                className="text-[10px] font-code px-2 py-0.5 rounded bg-[#151726] hover:bg-[#1f2238] text-slate-300 border border-[#232536] transition-colors cursor-pointer"
              >
                {qw}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {dictQuery.trim().length > 0 && dictResults.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No se encontraron rimas directas para "{dictQuery}".
              </div>
            ) : (
              dictResults.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#11121d] border border-[#1f2130] hover:border-cyan-500/40 transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-urban-heading font-semibold text-white">
                      {item.word}
                    </span>
                    <span className="text-[10px] font-code text-cyan-400">
                      {item.highlight}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-code px-1.5 py-0.5 rounded bg-[#181928] text-slate-400 border border-[#27293d]">
                      {item.syllables} síl
                    </span>
                    <span
                      className={`text-[9px] font-code font-bold uppercase ${
                        item.type === 'consonante'
                          ? 'text-cyan-400'
                          : item.type === 'multisilábica'
                          ? 'text-amber-400'
                          : 'text-purple-400'
                      }`}
                    >
                      {item.type}
                    </span>
                    <button
                      onClick={() => handleCopyWord(item.word)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-[#1e2032] rounded transition-colors cursor-pointer"
                      title="Copiar palabra"
                    >
                      {copiedWord === item.word ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Stats & Techniques */}
      {activeTab === 'stats' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
          {/* General metrics */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-urban-heading font-semibold text-slate-300">
              Métricas y Complejidad
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-[#11121d] border border-[#222436] rounded-xl flex flex-col">
                <span className="text-[10px] uppercase font-urban-display text-slate-500">
                  Total Barras
                </span>
                <span className="text-xl font-urban-display font-bold text-white mt-1">
                  {analysis.totalBars}
                </span>
              </div>

              <div className="p-3 bg-[#11121d] border border-[#222436] rounded-xl flex flex-col">
                <span className="text-[10px] uppercase font-urban-display text-slate-500">
                  Total Sílabas
                </span>
                <span className="text-xl font-urban-display font-bold text-cyan-400 mt-1">
                  {analysis.totalSyllables}
                </span>
              </div>

              <div className="p-3 bg-[#11121d] border border-[#222436] rounded-xl flex flex-col">
                <span className="text-[10px] uppercase font-urban-display text-slate-500">
                  Aliteraciones
                </span>
                <span className="text-xl font-urban-display font-bold text-emerald-400 mt-1">
                  {analysis.alliterationsCount}
                </span>
              </div>

              <div className="p-3 bg-[#11121d] border border-[#222436] rounded-xl flex flex-col">
                <span className="text-[10px] uppercase font-urban-display text-slate-500">
                  Retruécanos / Quiasmos
                </span>
                <span className="text-xl font-urban-display font-bold text-rose-400 mt-1">
                  {analysis.mirrorVersesCount}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown of Rhyme Techniques */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-urban-heading font-semibold text-slate-300">
              Técnicas Detectadas
            </span>
            <div className="flex flex-col gap-2 bg-[#11121d] border border-[#222436] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-300 font-medium">Multisilábicas</span>
                </div>
                <span className="font-code font-bold text-amber-400">
                  {analysis.multisyllabicCount} familias
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-300 font-medium">Consonantes</span>
                </div>
                <span className="font-code font-bold text-cyan-400">
                  {analysis.consonantCount} familias
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-medium">Aliteraciones (sonidos 'r', 'tr'...)</span>
                </div>
                <span className="font-code font-bold text-emerald-400">
                  {analysis.alliterationsCount} versos
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="text-slate-300 font-medium">Retruécano / Versos en espejo</span>
                </div>
                <span className="font-code font-bold text-rose-400">
                  {analysis.mirrorVersesCount} detectados
                </span>
              </div>
            </div>
          </div>

          {/* Song Stanza Structure with Compound Schemes (CB BC AA AA) */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-urban-heading font-semibold text-slate-300">
              Esquemas de Estrofa & Multirrimas
            </span>
            <div className="flex flex-col gap-1.5">
              {analysis.stanzas.map((stz) => (
                <div
                  key={stz.stanzaIndex}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#11121d] border border-[#1f2130] font-code text-[11px]"
                >
                  <span className="text-slate-400 font-urban-heading">
                    Estrofa {stz.stanzaIndex + 1}
                  </span>
                  <span className="text-amber-400 font-bold px-2 py-0.5 rounded bg-[#171926] border border-[#27293d] tracking-wide">
                    {stz.scheme || 'Libre'}
                  </span>
                  <span className="text-slate-500">
                    {stz.totalMetricSyllables} síl
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
