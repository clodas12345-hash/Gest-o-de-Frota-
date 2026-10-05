import React, { useState, useEffect } from 'react';
import { Gauge, X, CheckCircle2, Wrench, Save } from 'lucide-react';
import { Vehicle } from '../types';
import { sendAppNotification } from '../utils/notifications';

interface BatchOdometerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onBatchUpdateVehicles: (updatedVehicles: Vehicle[]) => void;
}

export function BatchOdometerModal({
  isOpen,
  onClose,
  vehicles,
  onBatchUpdateVehicles
}: BatchOdometerModalProps) {
  const [kmValues, setKmValues] = useState<Record<string, string>>({});
  const [nextKmValues, setNextKmValues] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialKm: Record<string, string> = {};
      const initialNextKm: Record<string, string> = {};
      vehicles.forEach((v) => {
        initialKm[v.id] = String(v.preventiveMaintCurrentKm || v.currentKm || 0);
        initialNextKm[v.id] = String(v.preventiveMaintNextKm || 0);
      });
      setKmValues(initialKm);
      setNextKmValues(initialNextKm);
      setSavedSuccess(false);
    }
  }, [isOpen, vehicles]);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    const updatedList = vehicles.map((v) => {
      const rawKm = parseInt((kmValues[v.id] || '').replace(/\D/g, ''), 10);
      const rawNext = parseInt((nextKmValues[v.id] || '').replace(/\D/g, ''), 10);
      const newCurKm = !isNaN(rawKm) ? rawKm : (v.currentKm || 0);
      const newNextKm = !isNaN(rawNext) ? rawNext : (v.preventiveMaintNextKm || 0);

      if (newNextKm > 0 && newCurKm >= newNextKm && (v.preventiveMaintCurrentKm || v.currentKm || 0) < newNextKm) {
        sendAppNotification(`🚨 MANUTENÇÃO VENCIDA: ${v.brand} (${v.plate})`, {
          body: `Odômetro atualizado para ${newCurKm.toLocaleString('pt-BR')} KM (limite de revisão era ${newNextKm.toLocaleString('pt-BR')} KM).`,
          eventKey: 'maint_overdue'
        });
      }

      return {
        ...v,
        currentKm: newCurKm,
        preventiveMaintCurrentKm: newCurKm,
        preventiveMaintNextKm: newNextKm > 0 ? newNextKm : v.preventiveMaintNextKm
      };
    });

    onBatchUpdateVehicles(updatedList);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[2001] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#181818] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Modo Odômetro — Atualização Rápida de KM em Lote</h2>
              <p className="text-[11px] text-gray-400">Atualize a quilometragem de toda a frota de uma só vez</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
          {savedSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Quilometragens atualizadas com sucesso em toda a frota!</span>
            </div>
          )}

          <div className="space-y-2">
            {vehicles.map((v) => {
              const curVal = parseInt((kmValues[v.id] || '0').replace(/\D/g, ''), 10) || 0;
              const nextVal = parseInt((nextKmValues[v.id] || '0').replace(/\D/g, ''), 10) || 0;
              const diff = nextVal - curVal;
              const isOverdue = nextVal > 0 && curVal >= nextVal;
              const isNear = nextVal > 0 && !isOverdue && diff <= 500;

              return (
                <div
                  key={v.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOverdue
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : isNear
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {v.brand} {v.model}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {v.plate}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Revisão Vencida!
                        </span>
                      )}
                      {isNear && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Faltam {diff.toLocaleString('pt-BR')} KM
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Motorista: <strong className="text-gray-200">{v.driver || 'Disponível'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div>
                      <label className="text-[9px] text-gray-400 block mb-0.5 uppercase font-bold">
                        KM Atual
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={kmValues[v.id] ?? ''}
                        onChange={(e) =>
                          setKmValues((prev) => ({
                            ...prev,
                            [v.id]: e.target.value
                          }))
                        }
                        className="w-28 text-xs bg-black border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-hidden focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-gray-400 block mb-0.5 uppercase font-bold">
                        Próx. Revisão (KM)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={nextKmValues[v.id] ?? ''}
                        onChange={(e) =>
                          setNextKmValues((prev) => ({
                            ...prev,
                            [v.id]: e.target.value
                          }))
                        }
                        className="w-28 text-xs bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-gray-200 font-mono focus:outline-hidden focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#181818] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/10"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all cursor-pointer shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todos os KMs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
