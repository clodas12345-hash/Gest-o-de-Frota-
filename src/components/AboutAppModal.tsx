import React from 'react';
import { X, CheckCircle2, Shield, Car, DollarSign, ClipboardCheck, Wrench, FileText, BarChart3, Info, ZoomIn } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogoViewer?: () => void;
  totalVehicles?: number;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({
  isOpen,
  onClose,
  onOpenLogoViewer,
  totalVehicles = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="about-app-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161616]">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <Info className="w-5 h-5 text-blue-400" />
            <span>Sobre o Aplicativo</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-gray-300 text-sm">
          {/* Brand Presentation */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-[#181818] to-slate-900/40 border border-blue-500/20">
            <button
              type="button"
              onClick={onOpenLogoViewer}
              className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-2xl p-0.5 transition-all shrink-0"
              title="Clique para ver o logotipo em tamanho grande"
            >
              <img 
                src={logoImg} 
                alt="GKD Mobility Logo" 
                className="w-20 h-20 rounded-2xl bg-white p-1 border border-white/20 object-contain shadow-lg shadow-blue-500/10 group-hover:scale-105 group-hover:border-blue-400 transition-all"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                <ZoomIn className="w-5 h-5 text-white drop-shadow-md" />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider">Ampliar</span>
              </div>
            </button>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">GKD Mobility</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Gestão de Frota
                </span>
              </div>
              <p className="text-xs text-blue-300/90 font-medium">
                Plataforma Completa para Controle e Gestão de Veículos Alugados
              </p>
              <p className="text-xs text-gray-400">
                Atualmente gerenciando <span className="text-white font-semibold">{totalVehicles} veículos</span> cadastrados.
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              O que é o GKD Mobility?
            </h3>
            <p className="leading-relaxed text-gray-300 text-sm">
              O <strong className="text-white">GKD Mobility</strong> é um sistema inteligente e integrado desenvolvido especialmente para proprietários e gestores de frotas de locação de veículos (motoristas de app, aluguéis semanais e frotas comerciais). Ele centraliza toda a operação do seu negócio em um único lugar, eliminando planilhas desorganizadas e garantindo total segurança jurídica e financeira.
            </p>
          </div>

          {/* Core Modules Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Principais Módulos e Recursos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <Car className="w-4 h-4 text-blue-400" />
                  <span>Controle de Veículos & Motoristas</span>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  Cadastro de carros, dados dos condutores, controle de caução, parcelamentos e limites de quilometragem.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                  <span>Vistorias Digitais com Fotos</span>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  Checklist fotográfico completo (4 lados, painel, pneus, estepe), geração de laudo em PDF e envio direto pelo WhatsApp.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>Gestão Financeira & Recebimentos</span>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  Controle rigoroso de repasses semanais, status de pagamento, receitas, custos de despesas e cálculo do lucro líquido mensal.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <Wrench className="w-4 h-4 text-purple-400" />
                  <span>Manutenções & Revisões</span>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  Alertas preventivos de troca de óleo e revisões por Km, controle de oficinas e histórico de peças substituídas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Contratos & Documentação</span>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  Emissão de contratos em PDF personalizados, termos de vistoria e arquivo de encerramento de locações finalizadas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-white font-medium text-xs">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Relatórios & Calendário</span>
                </div>
                <p className="text-xs text-gray-400 leading-normal">
                  Painel analítico mensal, comparativo de despesas por veículo, agenda de recebimentos e backup seguro em nuvem.
                </p>
              </div>
            </div>
          </div>

          {/* Key Advantages Checklist */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Vantagens Operacionais
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Totalmente responsivo e otimizado para celulares e computadores.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Disparo prático de relatórios e cobranças diretamente para o WhatsApp do motorista.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sincronização segura em tempo real e persistência em nuvem.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#161616] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-blue-500/15"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
