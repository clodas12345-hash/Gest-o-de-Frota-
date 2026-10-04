import React, { useState } from 'react';
import { Vehicle, Vistoria, WeeklyPayment } from '../types';
import { 
  Car, 
  DollarSign, 
  ShieldCheck, 
  Calendar, 
  Copy, 
  Check, 
  Download, 
  UploadCloud, 
  MessageCircle, 
  ArrowLeft,
  Clock,
  Sparkles,
  FileText,
  AlertCircle
} from 'lucide-react';
import { generatePaymentReceiptPDF } from '../utils/pdfGenerator';

interface DriverPortalViewProps {
  vehicle: Vehicle;
  vistorias?: Vistoria[];
  onExit: () => void;
  onOpenVistoriaForm: () => void;
  onOpenReceiptUpload: () => void;
}

export const DriverPortalView: React.FC<DriverPortalViewProps> = ({
  vehicle,
  vistorias = [],
  onExit,
  onOpenVistoriaForm,
  onOpenReceiptUpload
}) => {
  const [copiedPix, setCopiedPix] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  const vehicleVistorias = vistorias.filter(
    v => v.vehicleId === vehicle.id || (v.vehiclePlate && v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === vehicle.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase())
  );

  const weeklyPayments = vehicle.weeklyPayments || [];
  const totalPaid = weeklyPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Default pix key or landlord info
  const defaultPixKey = vehicle.driverPhone || '473118395752';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(defaultPixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleDownloadReceipt = async (payment: WeeklyPayment) => {
    setDownloadingReceiptId(payment.id);
    try {
      const { doc, fileName } = await generatePaymentReceiptPDF(vehicle, payment);
      doc.save(fileName);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar recibo em PDF.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d10] text-gray-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#141418]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Portal do Locatário</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {vehicle.plate}
              </span>
            </h1>
            <p className="text-[10px] text-gray-400">
              {vehicle.brand} {vehicle.model} • {vehicle.driver || 'Motorista'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReceiptUpload}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Enviar Comprovante</span>
        </button>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Vehicle & Rental Overview Card */}
        <div className="bg-[#16161c] border border-white/10 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Contrato de Locação Ativo
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {vehicle.brand} {vehicle.model}
              </h2>
              <p className="text-xs text-gray-400">
                Placa: <strong className="text-white font-mono">{vehicle.plate}</strong> • Cor: {vehicle.color || 'Prata'} • Ano: {vehicle.year || 2024}
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Semanalidade</span>
              <span className="text-lg sm:text-xl font-mono font-bold text-emerald-400">
                R$ {(vehicle.valorSemanal || vehicle.valorRecebido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Caução Paga</span>
              <span className="text-sm font-mono font-bold text-white mt-1 block">
                R$ {(vehicle.caucaoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Pago</span>
              <span className="text-sm font-mono font-bold text-emerald-400 mt-1 block">
                R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Odômetro Atual</span>
              <span className="text-sm font-mono font-bold text-white mt-1 block">
                {(vehicle.currentKm || 0).toLocaleString('pt-BR')} KM
              </span>
            </div>
            <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Vistorias Feitas</span>
              <span className="text-sm font-mono font-bold text-purple-300 mt-1 block">
                {vehicleVistorias.length} Realizadas
              </span>
            </div>
          </div>
        </div>

        {/* Action Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Quick Vistoria */}
          <div className="bg-[#16161c] border border-purple-500/20 rounded-2xl p-5 space-y-3 shadow-lg flex flex-col justify-between">
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Vistoria Digital Obrigatória</h3>
              <p className="text-xs text-gray-400">
                Realize a vistoria periódica semanal com fotos do painel, câmera, cartão de memória e checklist.
              </p>
            </div>
            <button
              onClick={onOpenVistoriaForm}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Realizar Vistoria Agora</span>
            </button>
          </div>

          {/* Pix Payment Info */}
          <div className="bg-[#16161c] border border-emerald-500/20 rounded-2xl p-5 space-y-3 shadow-lg flex flex-col justify-between">
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Pagamento Semanal via Pix</h3>
              <p className="text-xs text-gray-400">
                Pague sua semanalidade via Pix e envie o comprovante diretamente pelo portal.
              </p>
            </div>
            <button
              onClick={handleCopyPix}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedPix ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPix ? 'Chave Pix Copiada!' : 'Copiar Chave Pix'}</span>
            </button>
          </div>
        </div>

        {/* Extrato de Pagamentos Realizados */}
        <div className="bg-[#16161c] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Extrato de Pagamentos & Recibos
            </h3>
            <span className="text-[10px] text-gray-500">{weeklyPayments.length} parcelas registradas</span>
          </div>

          {weeklyPayments.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              Nenhum pagamento registrado no extrato deste contrato até o momento.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {weeklyPayments.map((p, idx) => (
                <div 
                  key={p.id || idx}
                  className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/15 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Parcela Semanal #{weeklyPayments.length - idx}</span>
                      <span className="text-[10px] text-gray-400">{p.date || 'Data não informada'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400">
                      R$ {(p.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDownloadReceipt(p)}
                      disabled={downloadingReceiptId === p.id}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                      title="Baixar Recibo em PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Vistorias */}
        <div className="bg-[#16161c] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Histórico de Vistorias do Veículo
            </h3>
            <span className="text-[10px] text-gray-500">{vehicleVistorias.length} laudos emitidos</span>
          </div>

          {vehicleVistorias.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              Nenhuma vistoria registrada para este veículo.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {vehicleVistorias.map((v) => (
                <div 
                  key={v.id}
                  className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-white/15 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">{v.type || 'Vistoria'}</span>
                      <span className="text-[10px] text-gray-400">
                        {v.date} • {v.photos?.length || 0} fotos {v.km ? `• ${v.km.toLocaleString('pt-BR')} KM` : ''}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    v.status === 'approved' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {v.status === 'approved' ? 'Aprovada' : 'Realizada'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
