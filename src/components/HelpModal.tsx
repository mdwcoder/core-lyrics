import React, { useEffect } from 'react';
import { X, Sparkles, Layers, Music, Keyboard, Repeat, Radio } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#10111a] border border-[#2b2d42] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232536] bg-[#141522]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-urban-display font-bold text-white">
              Guía de Técnicas de Rap, Métrica & Atajos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2132] transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300 leading-relaxed font-urban-heading">
          {/* Advanced Rap Techniques */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-urban-display font-bold text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Técnicas Avanzadas Detectadas en Tiempo Real</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#141624] border border-[#26283c] rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                  <Radio className="w-3.5 h-3.5" />
                  <span>1. Aliteración (Sonidos "r", "tr", "s", etc.)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Repetición reiterada de un fonema o grupo consonántico para crear ritmo percutivo. Ejemplo: <em>"<strong>tr</strong>es <strong>tr</strong>istes <strong>tr</strong>amposos"</em> o <em>"<strong>r</strong>ompo <strong>r</strong>itmos <strong>r</strong>udos con <strong>r</strong>imas <strong>r</strong>eales"</em>.
                </p>
              </div>

              <div className="p-3 bg-[#141624] border border-[#26283c] rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                  <Repeat className="w-3.5 h-3.5" />
                  <span>2. Retruécano / Quiasmo ("Versos al revés")</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Invertir los términos o el orden de dos palabras o rimas en versos contiguos. Ejemplo: <em>"No vivo para rimar, rimo para vivir"</em>, o cuando el verso 1 tiene rimas <strong>C-B</strong> y el verso 2 tiene rimas <strong>B-C</strong>.
                </p>
              </div>

              <div className="p-3 bg-[#141624] border border-[#26283c] rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. Esquemas Multirrima (CB, BC, AA, AA)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Cada barra puede contener una rima interna (cesura) y una rima final de remate, formando esquemas cruzados en espejo como <strong>CB / BC</strong> o dobles impactos <strong>AA / AA</strong>.
                </p>
              </div>

              <div className="p-3 bg-[#141624] border border-[#26283c] rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>4. Rimas Multisilábicas (2 a 4+ sílabas)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Coincidencia de múltiples vocales o sílabas al final del verso. Ejemplo: <em>"furia ciega"</em> con <em>"lluvia negra"</em>, o <em>"sin camino"</em> con <em>"mi destino"</em>.
                </p>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-urban-display font-bold text-cyan-400 flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />
              <span>Conteo de Sílabas Poéticas y de Rap</span>
            </h4>
            <div className="p-3.5 bg-[#141624] border border-[#26283c] rounded-xl text-[11px] text-slate-300 flex flex-col gap-2">
              <p>
                El motor analiza automáticamente las <strong>sinalefas</strong> (cuando una palabra termina en vocal y la siguiente empieza por vocal o "y") y aplica la regla métrica española:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>Palabra final <strong>Aguda</strong> (ej. <em>razón, compás, ley, estoy</em>): suma +1 sílaba métrica.</li>
                <li>Palabra final <strong>Llana</strong> (ej. <em>casa, ritmo, calle</em>): mantiene el conteo natural.</li>
                <li>Palabra final <strong>Esdrújula</strong> (ej. <em>música, clásica</em>): resta -1 sílaba métrica.</li>
              </ul>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-urban-display font-bold text-emerald-400 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-emerald-400" />
              <span>Atajos de Teclado del Estudio</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141624] border border-[#26283c]">
                <span className="text-slate-400">Play / Pausa Beat & Metrónomo</span>
                <kbd className="px-2 py-0.5 bg-[#1d1f33] rounded font-code text-amber-300 font-bold">Ctrl + Espacio</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141624] border border-[#26283c]">
                <span className="text-slate-400">Guardar Proyecto</span>
                <kbd className="px-2 py-0.5 bg-[#1d1f33] rounded font-code text-cyan-300 font-bold">Ctrl + S</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141624] border border-[#26283c]">
                <span className="text-slate-400">Crear nueva barra</span>
                <kbd className="px-2 py-0.5 bg-[#1d1f33] rounded font-code text-white">Enter</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141624] border border-[#26283c]">
                <span className="text-slate-400">Indentación en editor</span>
                <kbd className="px-2 py-0.5 bg-[#1d1f33] rounded font-code text-white">Tab</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141624] border border-[#26283c]">
                <span className="text-slate-400">Cerrar modales / menús</span>
                <kbd className="px-2 py-0.5 bg-[#1d1f33] rounded font-code text-white">Escape</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141624] border border-[#26283c]">
                <span className="text-slate-400">Analizar fonética en vivo</span>
                <span className="font-code text-slate-300">Automático al escribir</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
