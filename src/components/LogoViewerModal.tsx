import React from 'react';
import { X, ZoomIn, ExternalLink } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface LogoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoViewerModal: React.FC<LogoViewerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#141414] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full flex flex-col items-center gap-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="logo-viewer-modal"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer shadow-lg z-10"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white tracking-wide">Gestão de Frota</h3>
          <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Identidade Visual do Aplicativo</p>
        </div>

        {/* Large Logo Container */}
        <div className="relative group w-full flex items-center justify-center bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <img 
            src={logoImg} 
            alt="Gestão de Frota - Logotipo Oficial Grande" 
            className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Description */}
        <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4 w-full">
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Este é o logotipo do aplicativo <strong>Gestão de Frota</strong>. O sistema foi desenvolvido sob medida para controle de veículos, gerenciamento de motoristas, registros de manutenções preventivas, vistorias fotográficas com geração de PDF, lançamentos de repasses e despesas financeiras em tempo real.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full justify-center">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-blue-500/20"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
