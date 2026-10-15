import React from 'react';
import { FlowMarker } from '../lib/phonetics/rhymeDetector';
import { Zap, PauseCircle, Music, Gauge, ArrowRight } from 'lucide-react';

interface FlowMarkerSelectorProps {
  currentMarker: FlowMarker;
  onChange: (marker: FlowMarker) => void;
  onClose?: () => void;
}

export const FLOW_MARKER_CONFIG: Record<FlowMarker, {
  label: string;
  badge: string;
  color: string;
  border: string;
  bg: string;
  icon: typeof Zap;
  description: string;
}> = {
  default: {
    label: '4/4 Estándar',
    badge: '4/4',
    color: 'text-slate-400',
    border: 'border-slate-700/60',
    bg: 'bg-slate-800/40',
    icon: ArrowRight,
    description: 'Cadencia regular en compás de cuatro tiempos'
  },
  triplet: {
    label: 'Tresillo / Triplet',
    badge: '3-ILLO',
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    icon: Gauge,
    description: 'Tres sílabas por pulso (cadencia estilo trap y southern bounce)'
  },
  double_tempo: {
    label: 'Doble Tempo',
    badge: '2X VELOZ',
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
    icon: Zap,
    description: 'Aceleración métrica al doble de velocidad sobre el bombo'
  },
  pause: {
    label: 'Pausa / Punchline',
    badge: 'STOP',
    color: 'text-rose-400',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    icon: PauseCircle,
    description: 'Silencio súbito en el compás para dar impacto al remate'
  },
  melodic: {
    label: 'Flow Melódico',
    badge: 'MELODÍA',
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    icon: Music,
    description: 'Variación armónica entonada en el verso'
  }
};

export const FlowMarkerSelector: React.FC<FlowMarkerSelectorProps> = ({
  currentMarker,
  onChange,
  onClose
}) => {
  const options: FlowMarker[] = ['default', 'triplet', 'double_tempo', 'pause', 'melodic'];

  return (
    <div className="p-2 bg-[#12131e] border border-[#2b2d42] rounded-xl shadow-2xl min-w-[220px] z-50">
      <div className="text-[10px] uppercase font-urban-display font-bold text-slate-500 px-2 py-1 mb-1 tracking-wider border-b border-[#232536]">
        Cambio de Ritmo / Flow
      </div>
      <div className="flex flex-col gap-1">
        {options.map((key) => {
          const cfg = FLOW_MARKER_CONFIG[key];
          const Icon = cfg.icon;
          const isSelected = currentMarker === key;

          return (
            <button
              key={key}
              onClick={() => {
                onChange(key);
                onClose?.();
              }}
              className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400/15 border border-amber-400/30 text-white'
                  : 'hover:bg-[#1a1c2b] text-slate-300'
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-urban-heading font-semibold text-white">
                    {cfg.label}
                  </span>
                  <span className={`text-[9px] font-code font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {cfg.badge}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  {cfg.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
