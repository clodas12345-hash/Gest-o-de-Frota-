import React from 'react';
import { Archive, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { Vehicle } from '../types';

interface ConfirmFinalizeContractModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmFinalizeContractModal({
  isOpen,
  vehicle,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmFinalizeContractModalProps) {
  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onCancel} 
      />

      <div className="relative w-full max-w-md bg-[#141414] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-[2001] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/20 bg-amber-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Finalizar Contrato de Locação</h2>
              <p className="text-[11px] text-amber-300/80">Arquivamento sem exclusão do veículo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
            <p className="text-xs font-bold text-white">
              {vehicle.brand} {vehicle.model} - <span className="font-mono text-amber-300">{vehicle.plate}</span>
            </p>
            <p className="text-[11px] text-gray-400">
              Motorista Atual: <strong className="text-gray-200">{vehicle.driver || 'Não cadastrado'}</strong>
            </p>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Ao confirmar, o contrato atual será finalizado. O relatório PDF completo será salvo na pasta <strong className="text-amber-300">'Contratos Finalizados'</strong> e também nos documentos do carro.
          </p>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>O que é mantido no sistema:</span>
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-0.5 text-[10px]">
              <li>O <strong className="text-white">veículo continua salvo</strong> na frota para novas locações.</li>
              <li>Histórico de <strong className="text-white">última manutenção preventiva</strong> e KM atual permanecem intactos.</li>
              <li>Todas as vistorias e comprovantes anteriores continuam gravados.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#181818] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/10"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-400/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Finalizando...' : 'Sim, Finalizar Contrato'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
