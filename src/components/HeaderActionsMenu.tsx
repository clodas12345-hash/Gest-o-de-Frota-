import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Plus, 
  FolderArchive, 
  HelpCircle, 
  BookOpen, 
  Paperclip, 
  Download, 
  Upload, 
  RefreshCw, 
  Sparkles,
  ChevronDown,
  Car,
  Settings,
  FileText,
  MessageCircle
} from 'lucide-react';

interface HeaderActionsMenuProps {
  onAddVehicle: () => void;
  onOpenRentalContract?: () => void;
  onOpenFinalizedContracts: () => void;
  finalizedContractsCount: number;
  unviewedContractsCount?: number;
  onOpenHelp: () => void;
  onOpenAgenda: () => void;
  onOpenDocumentUpload: () => void;
  onOpenSettings?: () => void;
  onOpenChecklistConfig?: () => void;
  onDownloadBackup: () => void;
  onUploadBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
}

export function HeaderActionsMenu({
  onAddVehicle,
  onOpenRentalContract,
  onOpenFinalizedContracts,
  finalizedContractsCount,
  unviewedContractsCount = 0,
  onOpenHelp,
  onOpenAgenda,
  onOpenDocumentUpload,
  onOpenSettings,
  onOpenChecklistConfig,
  onDownloadBackup,
  onUploadBackup,
  onResetData
}: HeaderActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (actionFn: () => void) => {
    actionFn();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer border shadow-lg ${
          isOpen
            ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/20'
            : 'bg-white/10 hover:bg-white/15 text-white border-white/10 hover:border-white/20'
        }`}
        id="btn-main-actions-menu"
      >
        <Menu className="w-4 h-4 text-blue-400" />
        <span>Menu de Opções</span>
        {unviewedContractsCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Dropdown Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-end p-4 sm:p-6 pt-16 sm:pt-20 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop click to close */}
          <div 
            className="absolute inset-0" 
            onClick={() => setIsOpen(false)} 
          />

          {/* Modal Content Card */}
          <div className="relative w-full sm:w-80 max-w-[95vw] max-h-[85vh] overflow-y-auto bg-[#141414] border border-white/20 rounded-2xl shadow-2xl z-[1000] p-3 space-y-2 animate-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-white/20">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#141414] z-10">
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Menu de Opções</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Fechar menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: Adicionar Carro */}
            <button
              type="button"
              onClick={() => handleAction(onAddVehicle)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-left group transition-all cursor-pointer border border-blue-500/20 hover:border-blue-500/40"
            >
              <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-blue-500/20">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-300">Adicionar Veículo</p>
                <p className="text-[10px] text-gray-400">Cadastrar novo carro na frota</p>
              </div>
            </button>

            {/* Option: Gerar Contrato de Locação */}
            {onOpenRentalContract && (
              <button
                type="button"
                onClick={() => handleAction(onOpenRentalContract)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-left group transition-all cursor-pointer border border-emerald-500/20 hover:border-emerald-500/40"
              >
                <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300">Gerar Contrato de Locação</p>
                  <p className="text-[10px] text-gray-400">Dados do locatário e PDF oficial</p>
                </div>
              </button>
            )}

            {/* Option 2: Contratos Finalizados */}
            <button
              type="button"
              onClick={() => handleAction(onOpenFinalizedContracts)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-left group transition-all cursor-pointer border border-amber-500/20 hover:border-amber-500/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-amber-500/20">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-amber-300">Contratos Finalizados</p>
                  <p className="text-[10px] text-gray-400">Pasta com relatórios em PDF</p>
                </div>
              </div>
              {finalizedContractsCount > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  unviewedContractsCount > 0
                    ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                    : 'bg-amber-500/30 text-amber-200 border-amber-500/40'
                }`}>
                  {finalizedContractsCount}
                </span>
              )}
            </button>

            {/* Option 3: Central de Ajuda */}
            <button
              type="button"
              onClick={() => handleAction(onOpenHelp)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-left group transition-all cursor-pointer border border-indigo-500/20 hover:border-indigo-500/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-indigo-500/20">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300">Ajuda e Suporte IA</p>
                  <p className="text-[10px] text-gray-400">Tirar dúvidas e instruções</p>
                </div>
              </div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-indigo-500/30">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" /> IA
              </span>
            </button>

            {/* Option: Configurações */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => handleAction(onOpenSettings)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-left group transition-all cursor-pointer border border-white/10 hover:border-white/20"
              >
                <div className="p-2 bg-slate-700 text-white rounded-lg group-hover:scale-105 transition-transform shadow-md">
                  <Settings className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-300">Configurações</p>
                  <p className="text-[10px] text-gray-400">Lembretes de vistoria e notificações</p>
                </div>
              </button>
            )}

            <div className="my-1 border-t border-white/10" />

            {/* Option: Agenda de Contatos & Locatários */}
            <button
              type="button"
              onClick={() => handleAction(onOpenAgenda)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-left group transition-all cursor-pointer border border-teal-500/20 hover:border-teal-500/40"
            >
              <div className="p-2 bg-teal-600 text-white rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-teal-500/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-teal-300">Agenda Telefônica & Locatários</p>
                <p className="text-[10px] text-gray-400">Contatos, telefones e regiões</p>
              </div>
            </button>

            {/* Option: Fale Conosco / Suporte WhatsApp */}
            <button
              type="button"
              onClick={() => {
                const phone = '5511953292570';
                const text = 'Olá! Gostaria de enviar uma sugestão para o aplicativo Gestão de Frota: ';
                const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-left group transition-all cursor-pointer border border-emerald-500/20 hover:border-emerald-500/40"
            >
              <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-300">Fale Conosco (WhatsApp)</p>
                <p className="text-[10px] text-gray-400">Enviar sugestão para o Aplicativo</p>
              </div>
            </button>

            {/* Option 5: Enviar Documento */}
            <button
              type="button"
              onClick={() => handleAction(onOpenDocumentUpload)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-left group transition-colors cursor-pointer border border-transparent hover:border-white/10"
            >
              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Paperclip className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-200 group-hover:text-white">Carregar Documento</p>
                <p className="text-[10px] text-gray-400">Contratos, fotos e arquivos</p>
              </div>
            </button>

            <div className="my-1 border-t border-white/10" />

            {/* Option 6, 7, 8: Backup & Reset */}
            <div className="pt-1 px-1 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => handleAction(onDownloadBackup)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Baixar Backup JSON"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Backup</span>
              </button>

              <label
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Restaurar Backup JSON"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restaurar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    onUploadBackup(e);
                    setIsOpen(false);
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => handleAction(onResetData)}
                className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Redefinir para dados demonstrativos"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
