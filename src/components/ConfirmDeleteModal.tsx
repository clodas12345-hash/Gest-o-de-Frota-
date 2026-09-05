import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningNote?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
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
  onConfirm,
  onCancel
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onCancel} 
      />

      <div className="relative w-full max-w-md bg-[#141414] border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden z-[2001] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-rose-500/20 bg-rose-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{title}</h2>
              <p className="text-[11px] text-rose-300/80">Confirmação necessária</p>
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
          <p className="text-xs text-gray-300 leading-relaxed font-medium">
            {description}
          </p>

          {warningNote && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Informação de Arquivamento:</span>
              </p>
              <p className="text-gray-300">{warningNote}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#181818] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/10"
          >
            {cancelButtonText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isLoading ? 'Processando...' : confirmButtonText}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
