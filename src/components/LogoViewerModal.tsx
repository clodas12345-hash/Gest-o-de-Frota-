import React from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';
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
          <h3 className="text-lg font-bold text-white tracking-wide">GKD Mobility</h3>
          <p className="text-xs text-blue-400 font-medium tracking-widest uppercase">Logotipo Oficial em Alta Resolução</p>
        </div>

        {/* Large Logo Container */}
        <div className="relative group w-full flex items-center justify-center bg-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <img 
            src={logoImg} 
            alt="GKD Mobility - Logotipo Oficial Grande" 
            className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl drop-shadow-xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 w-full">
          <a
            href={logoImg}
            download="GKD_Mobility_Logo.png"
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Imagem</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 bg-white/10 hover:bg-white/15 text-gray-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
