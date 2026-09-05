import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleDocument, Vistoria } from '../types';
import { generateRentalContractPDF, RentalContractData } from '../utils/pdfGenerator';
import { generateNextContractNumber } from '../utils/contractHelper';
import { DriverVistoriaForm } from './DriverVistoriaForm';
import { 
  X, 
  FileText, 
  User, 
  Phone, 
  Calendar, 
  DollarSign, 
  MapPin, 
  CreditCard, 
  Save, 
  Printer, 
  Share2, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Car,
  Clock,
  Sparkles,
  Edit3,
  FileDown,
  Check,
  Gauge,
  ClipboardCheck,
  Copy
} from 'lucide-react';

interface RentalContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
  vehicles?: Vehicle[];
  onUpdateVehicle: (updatedVehicle: Vehicle) => void;
  checklistConfig?: string[];
  onSaveVistoria?: (v: Vistoria, pdfDataUrl?: string, pdfFileName?: string) => void;
}

export const RentalContractModal: React.FC<RentalContractModalProps> = ({
  isOpen,
  onClose,
  vehicle: initialVehicle,
  vehicles = [],
  onUpdateVehicle,
  checklistConfig = [],
  onSaveVistoria
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [showVistoriaForm, setShowVistoriaForm] = useState(false);
  const [copiedLinkNotification, setCopiedLinkNotification] = useState(false);
  const [vistoriaSuccessMsg, setVistoriaSuccessMsg] = useState(false);
  
  // Locatário / Renter Personal Details
  const [tenantName, setTenantName] = useState('');
  const [tenantCpfCnpj, setTenantCpfCnpj] = useState('');
  const [tenantRg, setTenantRg] = useState('');
  const [tenantCnh, setTenantCnh] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantAddress, setTenantAddress] = useState('');

  // Locador / Landlord Details (Pre-filled with Claudio's data)
  const [landlordName, setLandlordName] = useState('CLAUDIO OLIVEIRA DA SILVA');
  const [landlordCpfCnpj, setLandlordCpfCnpj] = useState('065.426.576-30');
  const [landlordRg, setLandlordRg] = useState('39.508.321-7');
  const [landlordPhone, setLandlordPhone] = useState('(11) 95329-2570');
  const [landlordAddress, setLandlordAddress] = useState('Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP: 03735-180');
  const [pixKey, setPixKey] = useState('11953292570');

  // Contract Terms
  const [contractNumber, setContractNumber] = useState('');
  const [odometerKm, setOdometerKm] = useState<number>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalValue, setRentalValue] = useState<number>(960);
  const [paymentPeriod, setPaymentPeriod] = useState<string>('Semanal');
  const [dueDay, setDueDay] = useState<string>('Toda sexta-feira até 23:59');
  const [caucaoValue, setCaucaoValue] = useState<number>(1920);
  const [kmLimit, setKmLimit] = useState<string>('5.000 km por mês');
  const [workshopName, setWorkshopName] = useState('Pneus Andriatti (Penha, SP)');
  const [insuranceCompany, setInsuranceCompany] = useState('LOOVI SEGUROS');
  const [insurancePhones, setInsurancePhones] = useState('0800 948 4888 (Assistência); 0800 607 2007 (Furto/Roubo); 4000 1762 (Central)');
  const [customClauses, setCustomClauses] = useState('');

  // Generated state
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedPdfFileName, setGeneratedPdfFileName] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavedNotification, setIsSavedNotification] = useState(false);

  // Function to save contract details directly to vehicle without generating PDF
  const handleSaveOnly = () => {
    const currentVeh = vehicles.find(v => v.id === selectedVehicleId) || initialVehicle;
    if (!currentVeh) {
      alert('Por favor, selecione um veículo.');
      return;
    }
    if (!tenantName.trim()) {
      alert('Por favor, informe o nome do locatário.');
      return;
    }

    const updatedVehicle: Vehicle = {
      ...currentVeh,
      initialKm: Number(odometerKm) > 0 ? Number(odometerKm) : currentVeh.initialKm,
      currentKm: Number(odometerKm) > 0 ? Number(odometerKm) : currentVeh.currentKm,
      driver: tenantName.trim() !== '' ? tenantName.trim() : currentVeh.driver,
      tenantCpfCnpj: tenantCpfCnpj.trim() !== '' ? tenantCpfCnpj.trim() : currentVeh.tenantCpfCnpj,
      tenantRg: tenantRg.trim() !== '' ? tenantRg.trim() : currentVeh.tenantRg,
      tenantCnh: tenantCnh.trim() !== '' ? tenantCnh.trim() : currentVeh.tenantCnh,
      driverPhone: tenantPhone.trim() !== '' ? tenantPhone.trim() : currentVeh.driverPhone,
      tenantEmail: tenantEmail.trim() !== '' ? tenantEmail.trim() : currentVeh.tenantEmail,
      tenantAddress: tenantAddress.trim() !== '' ? tenantAddress.trim() : currentVeh.tenantAddress,
      startDate: startDate || currentVeh.startDate,
      endDate: endDate !== undefined ? endDate : currentVeh.endDate,
      valorSemanal: Number(rentalValue) > 0 ? Number(rentalValue) : currentVeh.valorSemanal,
      caucaoValor: Number(caucaoValue) > 0 ? Number(caucaoValue) : currentVeh.caucaoValor,
      contractNumber: contractNumber.trim() !== '' ? contractNumber.trim() : currentVeh.contractNumber,
      rentalCompany: landlordName.trim() !== '' ? landlordName.trim() : currentVeh.rentalCompany,
    };

    onUpdateVehicle(updatedVehicle);
    setIsSavedNotification(true);
    setTimeout(() => setIsSavedNotification(false), 3500);
  };

  // Vistoria helper functions
  const getVistoriaLink = () => {
    const currentVeh = vehicles.find(v => v.id === selectedVehicleId) || initialVehicle;
    const origin = window.location.origin + window.location.pathname;
    const plate = currentVeh?.plate ? currentVeh.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase() : '';
    const brand = currentVeh?.brand || 'Veículo';
    const model = currentVeh?.model || '';
    const driver = tenantName || currentVeh?.driver || '';
    return `${origin}?mode=vistoria_retorno&placa=${encodeURIComponent(plate)}&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}&driver=${encodeURIComponent(driver)}&type=Entrega%20de%20Ve%C3%ADculo`;
  };

  const handleSendVistoriaWhatsApp = () => {
    const currentVeh = vehicles.find(v => v.id === selectedVehicleId) || initialVehicle;
    if (!currentVeh) return;
    const link = getVistoriaLink();
    const name = tenantName || currentVeh.driver || 'Motorista';
    let cleanPhone = (tenantPhone || currentVeh.driverPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Por favor, informe o número de telefone do locatário/motorista.');
      return;
    }
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }
    const text = `Olá ${name}! 🚗

Segue o link para realizar a *Vistoria de Entrega do Veículo* ${currentVeh.brand} ${currentVeh.model} (${currentVeh.plate}):

${link}

Por favor, preencha as fotos e o checklist de entrega ao retirar o veículo.`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyVistoriaLink = () => {
    const link = getVistoriaLink();
    navigator.clipboard.writeText(link);
    setCopiedLinkNotification(true);
    setTimeout(() => setCopiedLinkNotification(false), 3000);
  };

  // Synchronize state when vehicle changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const activeVehicle = initialVehicle || (vehicles.length > 0 ? vehicles[0] : null);
      if (activeVehicle) {
        setSelectedVehicleId(activeVehicle.id);
        populateFieldsFromVehicle(activeVehicle);
      }
      setIsSuccess(false);
      setGeneratedPdfUrl(null);
    }
  }, [isOpen, initialVehicle]);

  const populateFieldsFromVehicle = (veh: Vehicle) => {
    setTenantName(veh.driver || '');
    setTenantCpfCnpj(veh.tenantCpfCnpj || '');
    setTenantRg(veh.tenantRg || '');
    setTenantCnh(veh.tenantCnh || '');
    setTenantPhone(veh.driverPhone || '');
    setTenantEmail(veh.tenantEmail || '');
    setTenantAddress(veh.tenantAddress || '');
    setOdometerKm(veh.currentKm || veh.initialKm || 0);
    setStartDate(veh.startDate || new Date().toISOString().split('T')[0]);
    setEndDate(veh.endDate || '');
    setRentalValue(veh.valorSemanal || 0);
    setCaucaoValue(veh.caucaoValor || 0);
    setContractNumber(veh.contractNumber || generateNextContractNumber(veh.plate, vehicles, `${veh.brand} ${veh.model}`));
    setLandlordName(veh.rentalCompany || 'CLAUDIO OLIVEIRA DA SILVA');
  };

  const handleVehicleChange = (vehId: string) => {
    setSelectedVehicleId(vehId);
    const found = vehicles.find(v => v.id === vehId);
    if (found) {
      populateFieldsFromVehicle(found);
    }
  };

  if (!isOpen) return null;

  const currentVehicle = vehicles.find(v => v.id === selectedVehicleId) || initialVehicle;

  const handleGenerateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) {
      alert('Por favor, selecione um veículo.');
      return;
    }
    if (!tenantName.trim()) {
      alert('Por favor, informe o nome do locatário.');
      return;
    }

    setIsGenerating(true);

    try {
      const contractData: RentalContractData = {
        contractNumber: contractNumber || generateNextContractNumber(currentVehicle.plate, vehicles, `${currentVehicle.brand} ${currentVehicle.model}`),
        tenantName: tenantName.trim(),
        tenantCpfCnpj: tenantCpfCnpj.trim(),
        tenantRg: tenantRg.trim(),
        tenantCnh: tenantCnh.trim(),
        tenantPhone: tenantPhone.trim(),
        tenantEmail: tenantEmail.trim(),
        tenantAddress: tenantAddress.trim(),
        landlordName: landlordName.trim() || 'CLAUDIO OLIVEIRA DA SILVA',
        landlordCpfCnpj: landlordCpfCnpj.trim() || '065.426.576-30',
        landlordRg: landlordRg.trim() || '39.508.321-7',
        landlordPhone: landlordPhone.trim() || '(11) 95329-2570',
        landlordAddress: landlordAddress.trim() || 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP: 03735-180',
        pixKey: pixKey.trim() || '11953292570',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || 'Prazo Indeterminado',
        rentalValue: Number(rentalValue) || 960,
        paymentPeriod,
        dueDay,
        caucaoValue: Number(caucaoValue) || 1920,
        kmLimit,
        workshopName,
        insuranceCompany,
        insurancePhones,
        customClauses: customClauses.trim()
      };

      // Prepare vehicle with updated odometer and driver info
      const vehicleToUse: Vehicle = {
        ...currentVehicle,
        initialKm: Number(odometerKm) > 0 ? Number(odometerKm) : currentVehicle.initialKm,
        currentKm: Number(odometerKm) > 0 ? Number(odometerKm) : currentVehicle.currentKm,
        driver: contractData.tenantName || currentVehicle.driver,
        tenantCpfCnpj: contractData.tenantCpfCnpj || currentVehicle.tenantCpfCnpj,
        tenantRg: contractData.tenantRg || currentVehicle.tenantRg,
        tenantCnh: contractData.tenantCnh || currentVehicle.tenantCnh,
        driverPhone: contractData.tenantPhone || currentVehicle.driverPhone,
        tenantEmail: contractData.tenantEmail || currentVehicle.tenantEmail,
        tenantAddress: contractData.tenantAddress || currentVehicle.tenantAddress,
        startDate: contractData.startDate || currentVehicle.startDate,
        endDate: endDate !== undefined ? endDate : currentVehicle.endDate,
        valorSemanal: contractData.rentalValue > 0 ? contractData.rentalValue : currentVehicle.valorSemanal,
        caucaoValor: contractData.caucaoValue > 0 ? contractData.caucaoValue : currentVehicle.caucaoValor,
        contractNumber: contractData.contractNumber,
        rentalCompany: contractData.landlordName || currentVehicle.rentalCompany,
      };

      // Generate PDF with vehicleToUse
      const { fileName, pdfDataUrl } = await generateRentalContractPDF(vehicleToUse, contractData);

      // Create vehicle document
      const newDoc: VehicleDocument = {
        id: `doc-contract-${Date.now()}`,
        name: `Contrato de Locação - ${contractData.tenantName} (${vehicleToUse.plate}).pdf`,
        category: 'Contrato',
        uploadDate: new Date().toISOString().split('T')[0],
        fileSize: 'PDF Oficial',
        fileType: 'pdf',
        contentUrl: pdfDataUrl
      };

      // Update vehicle with document & updated tenant info
      const existingDocs = vehicleToUse.documents || [];
      const updatedVehicle: Vehicle = {
        ...vehicleToUse,
        documents: [newDoc, ...existingDocs]
      };

      onUpdateVehicle(updatedVehicle);

      setGeneratedPdfUrl(pdfDataUrl);
      setGeneratedPdfFileName(fileName);
      setIsSuccess(true);
    } catch (err) {
      console.error('Erro ao gerar e salvar contrato:', err);
      alert('Ocorreu um erro ao gerar o contrato em PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPdf = () => {
    if (!generatedPdfUrl) return;
    const printWindow = window.open(generatedPdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      // Fallback
      const a = document.createElement('a');
      a.href = generatedPdfUrl;
      a.download = generatedPdfFileName || 'Contrato_Locacao.pdf';
      a.click();
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedPdfUrl) return;
    const a = document.createElement('a');
    a.href = generatedPdfUrl;
    a.download = generatedPdfFileName || 'Contrato_Locacao.pdf';
    a.click();
  };

  const handleSendWhatsApp = () => {
    if (!currentVehicle) return;
    let cleanPhone = (tenantPhone || currentVehicle.driverPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Por favor, informe o número de telefone do locatário.');
      return;
    }
    if (!cleanPhone.startsWith('55')) {
      cleanPhone = '55' + cleanPhone;
    }

    const text = `📋 *CONTRATO DE LOCAÇÃO GERADO*
🚗 *Veículo:* ${currentVehicle.brand} ${currentVehicle.model} (${currentVehicle.plate})
👤 *Locatário:* ${tenantName}
💵 *Valor:* R$ ${Number(rentalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / ${paymentPeriod}
📅 *Início:* ${startDate ? new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Hoje'}
📄 *N° Contrato:* ${contractNumber}

O contrato oficial em PDF já foi gerado e está arquivado nos documentos do veículo.`;
    
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#121212] border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-[#181818] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/20 shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Contrato de Locação Digital
              </h2>
              <p className="text-[11px] text-gray-400">Preencha os dados do locatário e gere o PDF oficial para o carro</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / Form */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-white/20">

          {/* Formulário de Vistoria de Entrega Inline */}
          {showVistoriaForm ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 p-3.5 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <ClipboardCheck className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                      Vistoria de Entrega do Veículo
                    </h3>
                    <p className="text-[10px] text-purple-300/80">
                      {currentVehicle?.brand} {currentVehicle?.model} ({currentVehicle?.plate}) - Motorista: {tenantName || currentVehicle?.driver || 'Novo Motorista'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVistoriaForm(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Voltar ao Contrato
                </button>
              </div>

              <DriverVistoriaForm
                vehicle={currentVehicle}
                plateRequested={currentVehicle?.plate || ''}
                checklistConfig={checklistConfig}
                initialType="Entrega de Veículo"
                onSaveVistoria={(v, pdfUrl, pdfName) => {
                  if (onSaveVistoria) {
                    onSaveVistoria(v, pdfUrl, pdfName);
                  }
                  setShowVistoriaForm(false);
                  setVistoriaSuccessMsg(true);
                  setTimeout(() => setVistoriaSuccessMsg(false), 5000);
                }}
                onExit={() => setShowVistoriaForm(false)}
              />
            </div>
          ) : isSuccess ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Contrato Gerado e Anexado com Sucesso!</h3>
                <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
                  O contrato de locação do motorista <strong className="text-emerald-400">{tenantName}</strong> referente ao veículo <strong className="text-white">{currentVehicle?.brand} {currentVehicle?.model} ({currentVehicle?.plate})</strong> foi salvo e anexado automaticamente na aba de <strong>Documentos do Veículo</strong>.
                </p>
              </div>

              {/* Action buttons in Success view */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Editar Contrato</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveOnly}
                  className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  <Save className="w-4 h-4 text-blue-400" />
                  <span>Salvar Dados</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Abrir PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
                >
                  <FileDown className="w-4 h-4 text-emerald-400" />
                  <span>Baixar PDF</span>
                </button>

                {tenantPhone && (
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Avisar no WhatsApp</span>
                  </button>
                )}
              </div>

              {isSavedNotification && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-200 max-w-md mx-auto">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dados do contrato salvos com sucesso no veículo!</span>
                </div>
              )}

              {/* Seção de Vistoria de Entrega do Veículo */}
              <div className="bg-[#181818] border border-purple-500/30 rounded-2xl p-5 text-left space-y-4 shadow-xl shadow-purple-950/20 mt-4">
                <div className="flex items-start gap-3 border-b border-white/10 pb-3">
                  <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      Vistoria de Entrega do Veículo
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[9px] font-black">
                        RECOMENDADO
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Após formalizar o contrato, realize a vistoria de entrega para registrar as fotos e condições iniciais do veículo para <strong className="text-purple-300">{tenantName || 'o motorista'}</strong>.
                    </p>
                  </div>
                </div>

                {/* Opções de Vistoria */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowVistoriaForm(true)}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-900/30 border border-purple-400/30 hover:scale-[1.01]"
                  >
                    <ClipboardCheck className="w-4 h-4 text-purple-200" />
                    <span>Realizar Vistoria Agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendVistoriaWhatsApp}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 hover:scale-[1.01]"
                  >
                    <Share2 className="w-4 h-4 text-emerald-100" />
                    <span>Enviar Link no WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyVistoriaLink}
                    className="px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10 hover:scale-[1.01]"
                  >
                    <Copy className="w-4 h-4 text-gray-300" />
                    <span>Copiar Link Vistoria</span>
                  </button>
                </div>

                {copiedLinkNotification && (
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-200">
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Link da Vistoria de Entrega copiado para a área de transferência!</span>
                  </div>
                )}

                {vistoriaSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Vistoria de Entrega realizada com sucesso e anexada aos documentos do veículo!</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                >
                  Voltar ao formulário para fazer alterações
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerateAndSave} className="space-y-6 text-xs">
              
              {/* 1. Seleção de Veículo */}
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-white/5">
                  <Car className="w-4 h-4 text-blue-400" />
                  <span>1. Veículo da Locação</span>
                </div>

                {vehicles.length > 0 && !initialVehicle ? (
                  <div>
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                      Selecione o Veículo *
                    </label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => handleVehicleChange(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:border-blue-500/50 cursor-pointer text-xs font-medium"
                      required
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.brand} {v.model} - Placa: {v.plate} ({v.driver ? `Motorista: ${v.driver}` : 'Disponível'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : currentVehicle ? (
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase block">Carro Selecionado</span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {currentVehicle.brand} {currentVehicle.model} <span className="text-blue-400 font-mono">({currentVehicle.plate})</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block font-mono">Ano: {currentVehicle.year} | Cor: {currentVehicle.color}</span>
                    </div>
                  </div>
                ) : null}

                {/* Campo de Odômetro / Quilometragem */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                    Odômetro / Quilometragem Atual (km) *
                  </label>
                  <div className="relative">
                    <Gauge className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      value={odometerKm || ''}
                      onChange={(e) => setOdometerKm(Number(e.target.value))}
                      placeholder="Ex: 55922"
                      className="w-full bg-[#111111] border border-amber-500/30 rounded-xl pl-9 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-hidden focus:border-amber-400"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 2. Dados do Locatário (Pessoa que vai alugar) */}
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-white/5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>2. Dados Pessoais do Locatário (Pessoa que vai alugar)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Nome Completo do Locatário *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        id="tenantNameInput"
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        placeholder="Ex: João da Silva Santos"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      CPF ou CNPJ
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={tenantCpfCnpj}
                        onChange={(e) => setTenantCpfCnpj(e.target.value)}
                        placeholder="Ex: 000.000.000-00"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      RG / Órgão Emissor
                    </label>
                    <input
                      type="text"
                      value={tenantRg}
                      onChange={(e) => setTenantRg(e.target.value)}
                      placeholder="Ex: 12.345.678-9 SSP/SP"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Número da CNH (Carteira de Habilitação)
                    </label>
                    <input
                      type="text"
                      value={tenantCnh}
                      onChange={(e) => setTenantCnh(e.target.value)}
                      placeholder="Ex: 01234567890 (Cat. B)"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Telefone / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={tenantPhone}
                        onChange={(e) => setTenantPhone(e.target.value)}
                        placeholder="Ex: (11) 98765-4321"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Endereço Residencial Completo
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={tenantAddress}
                        onChange={(e) => setTenantAddress(e.target.value)}
                        placeholder="Rua, Número, Bairro, Cidade/UF - CEP"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-hidden focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Condições da Locação e Valores */}
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-white/5">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span>3. Condições da Locação e Pagamento</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      N° do Contrato / Código
                    </label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      placeholder="Ex: CT-GKD-ABC2323-08-2026-01"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Valor do Aluguel (R$) *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                      <input
                        type="number"
                        step="any"
                        value={rentalValue || ''}
                        onChange={(e) => setRentalValue(Number(e.target.value))}
                        placeholder="Ex: 650.00"
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white font-mono font-bold text-sm focus:outline-hidden focus:border-amber-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Periodicidade de Pagamento
                    </label>
                    <select
                      value={paymentPeriod}
                      onChange={(e) => setPaymentPeriod(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
                    >
                      <option value="Semanal">Semanal (Toda semana)</option>
                      <option value="Quinzenal">Quinzenal</option>
                      <option value="Mensal">Mensal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Dia de Vencimento
                    </label>
                    <input
                      type="text"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      placeholder="Ex: Toda Segunda-feira"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Data de Início *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500/50 scheme-dark"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Data de Término
                    </label>
                    <input
                      type="text"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Deixe em branco p/ indeterminado"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Depósito Caução (R$) <span className="text-[9px] text-emerald-400/80 font-normal lowercase">(Informativo - Não somar)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={caucaoValue || ''}
                      onChange={(e) => setCaucaoValue(Number(e.target.value))}
                      placeholder="Ex: 1000.00"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Franquia / Limite de Quilometragem
                    </label>
                    <input
                      type="text"
                      value={kmLimit}
                      onChange={(e) => setKmLimit(e.target.value)}
                      placeholder="Ex: Livre, 1.000 km / semana"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Dados do Locador (Salvos por padrão) */}
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px] pb-2 border-b border-white/5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>4. Dados do Locador (Seus Dados Salvos)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Nome Completo do Locador
                    </label>
                    <input
                      type="text"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder="Ex: CLAUDIO OLIVEIRA DA SILVA"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      CPF do Locador
                    </label>
                    <input
                      type="text"
                      value={landlordCpfCnpj}
                      onChange={(e) => setLandlordCpfCnpj(e.target.value)}
                      placeholder="Ex: 065.426.576-30"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      RG do Locador
                    </label>
                    <input
                      type="text"
                      value={landlordRg}
                      onChange={(e) => setLandlordRg(e.target.value)}
                      placeholder="Ex: 39.508.321-7"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Telefone / WhatsApp do Locador
                    </label>
                    <input
                      type="text"
                      value={landlordPhone}
                      onChange={(e) => setLandlordPhone(e.target.value)}
                      placeholder="Ex: (11) 95329-2570"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Chave PIX para Recebimento
                    </label>
                    <input
                      type="text"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Ex: 11953292570"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white font-mono focus:outline-hidden focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                      Endereço do Locador
                    </label>
                    <input
                      type="text"
                      value={landlordAddress}
                      onChange={(e) => setLandlordAddress(e.target.value)}
                      placeholder="Ex: Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Cláusulas Personalizadas */}
              <div className="bg-[#181818] border border-white/10 rounded-2xl p-4 space-y-2">
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                  Observações ou Cláusulas Especiais
                </label>
                <textarea
                  value={customClauses}
                  onChange={(e) => setCustomClauses(e.target.value)}
                  placeholder="Ex: Proibido fumantes no interior do veículo. Vistoria semanal obrigatória todas as sextas-feiras."
                  rows={2}
                  className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-white focus:outline-hidden focus:border-blue-500/50 text-xs"
                />
              </div>

              {/* Saved Notification Banner */}
              {isSavedNotification && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dados do contrato salvos com sucesso no veículo!</span>
                </div>
              )}

              {/* Submit / Action Bar */}
              <div className="p-4 bg-[#181818] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[10px] text-gray-400 leading-tight">
                  ⚡ Escolha uma ação: <strong className="text-blue-400">Salvar Dados</strong> no veículo, <strong className="text-amber-400">Editar</strong> as informações ou <strong className="text-emerald-400">Gerar PDF</strong> oficial.
                </p>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    Cancelar
                  </button>

                  {/* Botão 1: Salvar */}
                  <button
                    type="button"
                    onClick={handleSaveOnly}
                    className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs shadow-md shadow-blue-500/10"
                    title="Salvar apenas os dados cadastrais no veículo sem gerar arquivo PDF"
                  >
                    <Save className="w-4 h-4 text-blue-400" />
                    <span>Salvar Dados</span>
                  </button>

                  {/* Botão 2: Editar */}
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('tenantNameInput');
                      if (input) input.focus();
                    }}
                    className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs"
                    title="Modo de Edição dos campos do contrato"
                  >
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>Editar Contrato</span>
                  </button>

                  {/* Botão Vistoria de Entrega */}
                  <button
                    type="button"
                    onClick={() => setShowVistoriaForm(true)}
                    className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-xs shadow-md shadow-purple-500/10"
                    title="Realizar a Vistoria de Entrega do veículo agora"
                  >
                    <ClipboardCheck className="w-4 h-4 text-purple-400" />
                    <span>Vistoria de Entrega</span>
                  </button>

                  {/* Botão 3: Gerar PDF */}
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer text-xs disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span>Gerando PDF...</span>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Gerar PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
