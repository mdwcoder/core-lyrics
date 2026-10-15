import React from 'react';
import { X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2, Download } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onNativeInstall?: () => void;
  canNativeInstall?: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  onNativeInstall,
  canNativeInstall = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#10111a] border border-[#2b2d42] rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232536] bg-[#141522]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-cyan-400 p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0b10] rounded-[6px] flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-urban-display font-bold text-white leading-tight">
                Instalar CoreLyrics
              </h3>
              <p className="text-[11px] text-slate-400">App web progresiva (PWA)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2132] transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto text-xs text-slate-300">
          {/* Features badge */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141624] border border-[#26283c]">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Funciona 100% Offline</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141624] border border-[#26283c]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pantalla Completa Nativa</span>
            </div>
          </div>

          {canNativeInstall ? (
            /* Android / Chromium 1-click install */
            <div className="flex flex-col gap-3 py-2">
              <p className="text-slate-300">
                Instala CoreLyrics en tu dispositivo para acceder rápidamente con un toque, sin barras de navegación y con máxima fluidez.
              </p>
              <button
                onClick={() => {
                  onNativeInstall?.();
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 text-black font-urban-display font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Instalar Ahora en mi Dispositivo</span>
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Instructions */
            <div className="flex flex-col gap-3">
              <p className="text-slate-300 font-medium">
                Sigue estos 3 sencillos pasos en Safari para añadir la app a tu pantalla de inicio:
              </p>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141624] border border-[#26283c]">
                  <div className="w-7 h-7 rounded-lg bg-[#1f2134] text-cyan-400 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block mb-0.5">1. Pulsa el botón Compartir</span>
                    <span className="text-slate-400 text-[11px]">
                      En la barra inferior o superior de Safari, toca el icono de compartir (el cuadrado con la flecha hacia arriba).
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141624] border border-[#26283c]">
                  <div className="w-7 h-7 rounded-lg bg-[#1f2134] text-amber-400 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block mb-0.5">2. Selecciona "Añadir a pantalla de inicio"</span>
                    <span className="text-slate-400 text-[11px]">
                      Desliza hacia abajo en las opciones y toca en <strong>Añadir a pantalla de inicio</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141624] border border-[#26283c]">
                  <div className="w-7 h-7 rounded-lg bg-[#1f2134] text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block mb-0.5">3. Pulsa "Añadir"</span>
                    <span className="text-slate-400 text-[11px]">
                      Toca en "Añadir" en la esquina superior derecha y CoreLyrics aparecerá como una app en tu móvil.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop / other browsers manual note */
            <div className="flex flex-col gap-3 py-2 text-slate-300">
              <p>
                Puedes instalar CoreLyrics haciendo clic en el icono de instalación ⊕ en la barra de direcciones de tu navegador (Chrome, Edge, Brave o Firefox).
              </p>
            </div>
          )}

          <div className="pt-2 text-center text-slate-500 text-[10px]">
            CoreLyrics PWA · Sin descargas pesadas · Ocupa menos de 1 MB
          </div>
        </div>
      </div>
    </div>
  );
};
