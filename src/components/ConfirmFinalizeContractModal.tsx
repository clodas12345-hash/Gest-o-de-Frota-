import React, { useState, useEffect } from 'react';
import { Archive, CheckCircle2, X, ShieldCheck, Calculator, MessageCircle } from 'lucide-react';
import { Vehicle } from '../types';
import CurrencyInput from './CurrencyInput';

export interface CaucaoSettlementData {
  caucaoOriginal: number;
  descontoAluguelPendente: number;
  descontoAvarias: number;
  descontoCombustivel: number;
  descontoMultas: number;
  observacoesAcerto: string;
  saldoFinal: number;
}

interface ConfirmFinalizeContractModalProps {
  isOpen: boolean;
  vehicle: Vehicle | null;
  isLoading?: boolean;
  onConfirm: (settlement?: CaucaoSettlementData) => void;
  onCancel: () => void;
}

export function ConfirmFinalizeContractModal({
  isOpen,
  vehicle,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmFinalizeContractModalProps) {
  const [caucaoOriginal, setCaucaoOriginal] = useState<number>(0);
  const [descontoAluguelPendente, setDescontoAluguelPendente] = useState<number>(0);
  const [descontoAvarias, setDescontoAvarias] = useState<number>(0);
  const [descontoCombustivel, setDescontoCombustivel] = useState<number>(0);
  const [descontoMultas, setDescontoMultas] = useState<number>(0);
  const [observacoesAcerto, setObservacoesAcerto] = useState<string>('');

  useEffect(() => {
    if (isOpen && vehicle) {
      setCaucaoOriginal(vehicle.caucaoValor || 0);
      setDescontoAluguelPendente(0);
      setDescontoAvarias(0);
      setDescontoCombustivel(0);
      setDescontoMultas(0);
      setObservacoesAcerto('');
    }
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const totalDescontos =
    (descontoAluguelPendente || 0) +
    (descontoAvarias || 0) +
    (descontoCombustivel || 0) +
    (descontoMultas || 0);

  const saldoFinal = (caucaoOriginal || 0) - totalDescontos;

  const formatBRL = (val: number) =>
    `R$ ${Math.abs(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSendSettlementWhatsApp = () => {
    let cleanPhone = (vehicle.driverPhone || '').replace(/\D/g, '');
    if (cleanPhone && !cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const statusLine =
      saldoFinal >= 0
        ? `✅ *SALDO A DEVOLVER AO LOCATÁRIO:* ${formatBRL(saldoFinal)}`
        : `⚠️ *SALDO DEVEDOR A PAGAR PELO LOCATÁRIO:* ${formatBRL(saldoFinal)}`;

    const text = `📋 *FECHAMENTO E ACERTO DE CAUÇÃO - DEVOLUÇÃO DE VEÍCULO*\n\n🚗 *Veículo:* ${vehicle.brand} ${vehicle.model} (${vehicle.plate})\n👤 *Locatário:* ${vehicle.driver || 'Não informado'}\n📅 *Data do Encerramento:* ${new Date().toLocaleDateString('pt-BR')}\n\n💰 *Caução Depositada:* ${formatBRL(caucaoOriginal)}\n➖ *Aluguéis/Dias Pendentes:* ${formatBRL(descontoAluguelPendente)}\n➖ *Avarias / Oficina:* ${formatBRL(descontoAvarias)}\n➖ *Diferença de Combustível:* ${formatBRL(descontoCombustivel)}\n➖ *Multas / Pedágios:* ${formatBRL(descontoMultas)}\n${observacoesAcerto ? `📝 *Obs:* ${observacoesAcerto}\n` : ''}\n${statusLine}`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onCancel} 
      />

      <div className="relative w-full max-w-lg bg-[#141414] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden z-[2001] animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/20 bg-amber-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Finalizar Contrato + Acerto de Caução</h2>
              <p className="text-[11px] text-amber-300/80">Checklist financeiro de devolução e arquivamento</p>
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
        <div className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">
                {vehicle.brand} {vehicle.model} - <span className="font-mono text-amber-300">{vehicle.plate}</span>
              </p>
              <p className="text-[11px] text-gray-400">
                Motorista: <strong className="text-gray-200">{vehicle.driver || 'Não cadastrado'}</strong>
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Caução: {formatBRL(caucaoOriginal)}
            </span>
          </div>

          {/* Calculadora de Acerto de Caução (#8) */}
          <div className="p-3.5 bg-black/50 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Calculator className="w-3.5 h-3.5" />
                Calculadora de Devolução & Acerto de Caução
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  Caução Depositada (R$)
                </label>
                <CurrencyInput
                  value={caucaoOriginal}
                  onChange={setCaucaoOriginal}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  (-) Aluguéis / Dias em Aberto
                </label>
                <CurrencyInput
                  value={descontoAluguelPendente}
                  onChange={setDescontoAluguelPendente}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  (-) Avarias / Reparos Vistoria
                </label>
                <CurrencyInput
                  value={descontoAvarias}
                  onChange={setDescontoAvarias}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  (-) Diferença Combustível
                </label>
                <CurrencyInput
                  value={descontoCombustivel}
                  onChange={setDescontoCombustivel}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  (-) Multas / Pedágios
                </label>
                <CurrencyInput
                  value={descontoMultas}
                  onChange={setDescontoMultas}
                  placeholder="0,00"
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold">
                  Observação do Acerto
                </label>
                <input
                  type="text"
                  value={observacoesAcerto}
                  onChange={(e) => setObservacoesAcerto(e.target.value)}
                  placeholder="Ex: Desconto para-choque..."
                  className="w-full text-xs bg-[#141414] border border-white/15 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            {/* Resultado Automático */}
            <div
              className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                saldoFinal >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold block opacity-80">
                  {saldoFinal >= 0 ? 'Saldo a Devolver ao Motorista:' : 'Saldo Devedor a Cobrar do Motorista:'}
                </span>
                <span className="text-base font-extrabold font-mono">
                  {formatBRL(saldoFinal)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSendSettlementWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Enviar resumo do acerto de caução para o WhatsApp do motorista"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar Acerto no WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>O que é mantido no sistema:</span>
            </p>
            <p className="text-gray-300 text-[10px] leading-relaxed">
              O veículo continua salvo na frota para novas locações, mantendo KM atual, manutenção preventiva e dossiê arquivado em <strong className="text-amber-300">'Contratos Finalizados'</strong>.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#181818] flex items-center justify-end gap-2.5 shrink-0">
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
            onClick={() =>
              onConfirm({
                caucaoOriginal,
                descontoAluguelPendente,
                descontoAvarias,
                descontoCombustivel,
                descontoMultas,
                observacoesAcerto,
                saldoFinal
              })
            }
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-400/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Finalizando...' : 'Confirmar e Finalizar Contrato'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
