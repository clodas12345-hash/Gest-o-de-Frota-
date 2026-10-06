import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningNote?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  requireDoubleConfirmation?: boolean;
  secondTitle?: string;
  secondDescription?: string;
  secondConfirmButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  warningNote,
  confirmButtonText = 'Sim, Excluir',
  cancelButtonText = 'Cancelar',
  isLoading = false,
  requireDoubleConfirmation = false,
  secondTitle = 'Confirmação Final (2/2)',
  secondDescription = 'Tem certeza absoluta? Esta exclusão é permanente e o documento não poderá ser recuperado.',
  secondConfirmButtonText = 'Confirmar Exclusão Definitiva',
  onConfirm,
  onCancel
}: ConfirmDeleteModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSecondStep = requireDoubleConfirmation && step === 2;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => {
          setStep(1);
          onCancel();
        }} 
      />

      <div className={`relative w-full max-w-md bg-[#141414] border ${isSecondStep ? 'border-red-500/60 shadow-red-900/20' : 'border-rose-500/30'} rounded-2xl shadow-2xl overflow-hidden z-[2001] animate-in zoom-in-95 duration-150`}>
        
        {/* Header */}
        <div className={`px-5 py-4 border-b ${isSecondStep ? 'border-red-500/30 bg-red-950/40' : 'border-rose-500/20 bg-rose-950/30'} flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 ${isSecondStep ? 'bg-red-500/25 text-red-400 border-red-500/40 animate-pulse' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'} rounded-xl border`}>
              {isSecondStep ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isSecondStep ? secondTitle : title}
              </h2>
              <p className="text-[11px] text-rose-300/80">
                {requireDoubleConfirmation 
                  ? (isSecondStep ? 'Etapa 2 de 2 • Ação Irreversível' : 'Etapa 1 de 2 • Confirmação Inicial')
                  : 'Confirmação necessária'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              onCancel();
            }}
            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-200 leading-relaxed font-medium">
            {isSecondStep ? secondDescription : description}
          </p>

          {warningNote && !isSecondStep && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Atenção:</span>
              </p>
              <p className="text-gray-300">{warningNote}</p>
            </div>
          )}

          {isSecondStep && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-[11px] text-red-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Segunda Confirmação Obrigatória:</span>
              </p>
              <p className="text-gray-300">
                Clique em <strong>"{secondConfirmButtonText}"</strong> abaixo para apagar definitivamente este documento do sistema.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#181818] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setStep(1);
              onCancel();
            }}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/10"
          >
            {cancelButtonText}
          </button>

          {requireDoubleConfirmation && step === 1 ? (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-600/30 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Sim, Continuar (1/2)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                onConfirm();
              }}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isLoading ? 'Processando...' : (isSecondStep ? secondConfirmButtonText : confirmButtonText)}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

