import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, X, ShieldCheck, FileCheck2, Trash2, Send, Info, ZoomIn, Gauge, Sparkles, Radio, HardDrive, Video } from 'lucide-react';
import { Vehicle, Vistoria } from '../types';
import { generateVistoriaPDF } from '../utils/pdfGenerator';
import { LogoViewerModal } from './LogoViewerModal';
import logoImg from '../assets/logo.png';

interface DriverVistoriaFormProps {
  vehicle: Vehicle | undefined;
  plateRequested: string;
  checklistConfig: string[];
  existingVistorias?: Vistoria[];
  onSaveVistoria: (v: Vistoria, pdfDataUrl?: string, pdfFileName?: string) => void;
  onSavePaymentReceipt?: (receipt: { id: string; date: string; amount?: number; photoUrl: string; notes?: string; driverName?: string }) => void;
  onExit: () => void;
  initialType?: 'entrega' | 'periódica' | 'devolução';
  isPaymentMode?: boolean;
  initialParams?: URLSearchParams;
}

export function DriverVistoriaForm({ 
  vehicle, 
  plateRequested, 
  checklistConfig,
  existingVistorias = [],
  onSaveVistoria, 
  onSavePaymentReceipt,
  onExit,
  initialType,
  isPaymentMode,
  initialParams
}: DriverVistoriaFormProps) {
  
  useEffect(() => {
    document.title = 'Vistoria Veicular';
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Vistoria Veicular');
    }
  }, []);

  const getParamFromUrlOrProps = (key: string): string => {
    const targetKey = key.toLowerCase();
    
    // 1. Check window.location.href first (direct URL query string)
    if (typeof window !== 'undefined' && window.location.href) {
      const href = window.location.href;
      if (href.includes('?')) {
        const queryStr = href.substring(href.indexOf('?') + 1);
        const urlParams = new URLSearchParams(queryStr);
        for (const [k, v] of urlParams.entries()) {
          if (k.toLowerCase() === targetKey && v && v.trim() !== '') return v.trim();
        }
      }
    }

    // 2. Check initialParams if provided
    if (initialParams) {
      for (const [k, v] of initialParams.entries()) {
        if (k.toLowerCase() === targetKey && v && v.trim() !== '') return v.trim();
      }
    }

    // 3. Check window.location.search
    if (typeof window !== 'undefined') {
      if (window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        for (const [k, v] of searchParams.entries()) {
          if (k.toLowerCase() === targetKey && v && v.trim() !== '') return v.trim();
        }
      }

      // 4. Check window.location.hash
      if (window.location.hash && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
        const hashParams = new URLSearchParams(hashQuery);
        for (const [k, v] of hashParams.entries()) {
          if (k.toLowerCase() === targetKey && v && v.trim() !== '') return v.trim();
        }
      }
    }

    return '';
  };

  const [vistoriaType, setVistoriaType] = useState<'entrega' | 'periódica' | 'devolução'>(() => {
    const rawType = getParamFromUrlOrProps('type') || getParamFromUrlOrProps('vistoriaType') || (initialType ? String(initialType) : '');
    const decoded = decodeURIComponent(rawType).toLowerCase().trim();
    if (decoded.includes('entrega')) return 'entrega';
    if (decoded.includes('devolu')) return 'devolução';
    if (decoded.includes('periódica') || decoded.includes('periodica')) return 'periódica';
    return 'periódica';
  });

  useEffect(() => {
    const rawType = getParamFromUrlOrProps('type') || getParamFromUrlOrProps('vistoriaType') || (initialType ? String(initialType) : '');
    const decoded = decodeURIComponent(rawType).toLowerCase().trim();
    if (decoded.includes('entrega')) {
      setVistoriaType('entrega');
    } else if (decoded.includes('devolu')) {
      setVistoriaType('devolução');
    } else if (decoded.includes('periódica') || decoded.includes('periodica')) {
      setVistoriaType('periódica');
    }
  }, [initialParams, initialType]);

  const [checklist, setChecklist] = useState<Record<string, { isOk: boolean, photoUrl: string | null }>>(() => {
    const itemsFromUrl = getParamFromUrlOrProps('items') || getParamFromUrlOrProps('item');
    if (itemsFromUrl && itemsFromUrl.trim().length > 0) {
      const parsedItems = itemsFromUrl.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean);
      if (parsedItems.length > 0) {
        const initial: Record<string, { isOk: boolean, photoUrl: string | null }> = {};
        parsedItems.forEach(item => {
          initial[item] = { isOk: true, photoUrl: null };
        });
        return initial;
      }
    }

    const rawType = getParamFromUrlOrProps('type') || (initialType ? String(initialType) : '');
    const isPeriodica = rawType.toLowerCase().includes('periódica') || rawType.toLowerCase().includes('periodica');

    let baseList: string[] = [];
    if (checklistConfig && checklistConfig.length > 0) {
      baseList = [...checklistConfig];
    } else {
      baseList = isPeriodica ? [
        'Frente do carro',
        'Fundo do carro',
        'Lateral direita',
        'Lateral esquerda',
        'Estofados frente',
        'Estofados trás',
        'Nível de combustivel'
      ] : [
        'Estepe',
        'Chaves de roda',
        'Triângulo',
        'Frente do carro',
        'Fundo do carro',
        'Lateral direita',
        'Lateral esquerda',
        'Estofados frente',
        'Estofados trás',
        'Nível de combustivel'
      ];
    }

    if (isPeriodica) {
      baseList = baseList.filter(item => {
        const lower = item.toLowerCase();
        return !lower.includes('estepe') && !lower.includes('step') && !lower.includes('chave de roda') && !lower.includes('chaves de roda') && !lower.includes('triângulo') && !lower.includes('triangulo');
      });
    }

    const initial: Record<string, { isOk: boolean, photoUrl: string | null }> = {};
    baseList.forEach(item => {
      initial[item] = { isOk: true, photoUrl: null };
    });

    return initial;
  });

  useEffect(() => {
    const itemsFromUrl = getParamFromUrlOrProps('items') || getParamFromUrlOrProps('item');
    if (itemsFromUrl && itemsFromUrl.trim().length > 0) {
      const parsedItems = itemsFromUrl.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean);
      if (parsedItems.length > 0) {
        const newChecklist: Record<string, { isOk: boolean, photoUrl: string | null }> = {};
        parsedItems.forEach(item => {
          newChecklist[item] = { isOk: true, photoUrl: null };
        });
        setChecklist(newChecklist);
      }
    }
  }, [initialParams]);

      <main className="flex-1 p-4 max-w-lg w-full mx-auto pb-32">
        {!vehicle ? (

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col fixed inset-0 z-50 overflow-y-auto items-center justify-start sm:py-6 sm:px-4 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="w-full sm:max-w-md sm:min-h-[90vh] sm:rounded-3xl sm:border sm:border-white/15 sm:shadow-2xl sm:overflow-hidden bg-black flex flex-col min-h-screen sm:min-h-0 relative">
      <header className="bg-[#111111] border-b border-white/5 py-3 px-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLogoViewerOpen(true)}
            className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl p-0.5 transition-all shrink-0"
            title="Clique para ver o logotipo em tamanho grande"
          >
            <img 
              src={logoImg} 
              alt="Gestão de Frota" 
              className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 border border-white/10 shrink-0 shadow-md group-hover:scale-105 transition-all" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow-md" />
            </div>
          </button>
          <div>
            <h1 className="text-sm font-bold text-emerald-400 tracking-wider">
              {isPaymentMode 
                ? 'COMPROVANTE' 
                : (vistoriaType?.toLowerCase().includes('devolu') 
                    ? 'DEVOLUÇÃO' 
                    : vistoriaType?.toLowerCase().includes('entrega') 
                    ? 'ENTREGA' 
                    : 'PERIÓDICA')}
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Gestão de Frota</p>
          </div>
        </div>
        {vehicle && (
          <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExit}
            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Voltar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Placa</span>
            <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
              {vehicle.plate}
            </span>
          </div>
        </div>
        )}
      </header>
      <main className="flex-1 p-4 max-w-lg w-full mx-auto pb-32">
        {/* PAINEL DE DIAGNÓSTICO VISÍVEL */}
        <div className="bg-amber-950/80 border border-amber-500/40 rounded-2xl p-4 mb-4 text-xs text-amber-200 font-mono shadow-xl space-y-2">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              🔍 DIAGNÓSTICO DE VISTORIA (LOG DE INVESTIGAÇÃO)
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
              LOG ATIVO
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="bg-black/50 p-2 rounded border border-amber-500/20">
              <span className="text-amber-400 font-bold block">1) Query String / Parâmetros da URL:</span>
              <div className="text-gray-300 break-all text-[10px] mt-1 font-mono">
                <b>Full URL:</b> {debugFullUrl}<br/>
                <b>Query:</b> {debugQueryString || '(nenhum)'}
              </div>
              <div className="mt-1.5 text-amber-300 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <span>vehicleId: <b className="text-white">"{debugVehicleIdFromUrl || 'vazio'}"</b></span>
                <span>placa: <b className="text-white">"{debugPlacaFromUrl || 'vazio'}"</b></span>
                <span>type: <b className="text-white">"{debugRawTypeFromUrl || 'vazio'}"</b></span>
                <span>items: <b className="text-white">"{debugRawItemsFromUrl || 'vazio'}"</b></span>
              </div>
            </div>

            <div className="bg-black/50 p-2 rounded border border-amber-500/20">
              <span className="text-amber-400 font-bold block">2) Resultado da Busca do Veículo no Banco:</span>
              {vehicle ? (
                <div className="text-emerald-300 font-bold text-[11px] mt-1">
                  ✅ Veículo Encontrado: {vehicle.brand} {vehicle.model} (Placa: {vehicle.plate}) | ID: {vehicle.id}
                </div>
              ) : (
                <div className="text-red-400 font-bold text-[11px] mt-1">
                  ❌ Nenhum veículo cadastrado correspondeu a este ID ({debugVehicleIdFromUrl}) ou Placa ({debugPlacaFromUrl})
                </div>
              )}
            </div>

            <div className="bg-black/50 p-2 rounded border border-amber-500/20">
              <span className="text-amber-400 font-bold block">3) Processamento do Tipo e Itens:</span>
              <div className="mt-1 text-[11px] space-y-1">
                <div>• Type na URL: <b className="text-white">"{debugRawTypeFromUrl || 'vazio'}"</b></div>
                <div>• Type em Prop (initialType): <b className="text-white">"{initialType || 'vazio'}"</b></div>
                <div>• <b>TYPE FINAL EXIBIDO NA TELA: <span className="text-emerald-400 uppercase font-black">{vistoriaType}</span></b></div>
                <div className="pt-1.5">• Items na URL: <b className="text-white">"{debugRawItemsFromUrl || 'vazio'}"</b></div>
                <div>• <b>ITEMS FINAIS NO CHECKLIST NA TELA ({Object.keys(checklist).length}):</b></div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.keys(checklist).map((it, idx) => (
                    <span key={idx} className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!vehicle ? (
          <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Placa Não Identificada</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Não conseguimos identificar o veículo para o link acessado. 
                {plateRequested && (
                  <>
                    <br />Placa informada: <span className="font-mono text-red-400 font-semibold">{plateRequested.toUpperCase()}</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-gray-500 italic mt-2">
                Este link serve exclusivamente para envio de fotos e vistorias. Entre em contato com o responsável pela frota para solicitar um novo link.
              </p>
            </div>
          </div>
        ) : (alreadySubmittedBefore && !isSubmitted) ? (
          <div className="bg-[#111111] border border-amber-500/20 rounded-2xl p-6 text-center shadow-xl space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Info className="w-8 h-8 text-amber-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-amber-400">Link Único Já Utilizado</h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Este link {isPaymentMode ? 'de comprovante' : 'de vistoria'} é de <strong>utilização única</strong> e já foi preenchido e enviado anteriormente.
              </p>
              {requestToken && (
                <p className="text-[11px] font-mono text-amber-300/80 bg-amber-500/10 border border-amber-500/20 py-1 px-2.5 rounded-lg inline-block">
                  Token: #{requestToken} (Expirado)
                </p>
              )}
              <p className="text-[11px] text-gray-500 italic pt-2">
                Para realizar uma nova vistoria, solicite um novo link único ao gestor da frota.
              </p>
            </div>
          </div>
        ) : isSubmitted ? (
          <div className="bg-[#111111] border border-emerald-500/20 rounded-2xl p-6 text-center shadow-xl space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-emerald-400">
                {isPaymentMode ? 'Comprovante Enviado!' : 'Vistoria Concluída!'}
              </h2>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {isPaymentMode 
                  ? 'O comprovante foi enviado com sucesso para o gestor. Após a aprovação, ele será anexado aos documentos do veículo.' 
                  : 'As informações e fotos foram salvas com sucesso no sistema.'}
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              {!isPaymentMode && (
                <button
                  onClick={handleSendWhatsAppConfirmation}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  id="btn-send-whatsapp-confirm"
                >
                  <Send className="w-5 h-5" />
                  <span>Compartilhar Relatório + Fotos</span>
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Obrigado! O envio foi concluído e você já pode fechar esta página com segurança.
              </p>
            </div>
          </div>
        ) : isPaymentMode ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!paymentPhoto) {
              alert('Por favor, tire ou envie a foto do comprovante.');
              return;
            }
            if (vehicle) {
              if (requestToken) {
                localStorage.setItem(getSubmissionStorageKey(), 'true');
              }
              setAlreadySubmittedBefore(true);
              if (onSavePaymentReceipt) {
                onSavePaymentReceipt({
                  id: `rec-${Date.now()}`,
                  date: new Date().toISOString().split('T')[0],
                  amount: paymentAmount,
                  photoUrl: paymentPhoto,
                  notes: notes.trim(),
                  driverName: vehicle.driver
                });
              }
            }
            setIsSubmitted(true);
          }} className="space-y-6">
            <div className="bg-[#111111] border border-emerald-500/20 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                    Envio de Comprovante de Pagamento
                  </span>
                  <h3 className="text-sm font-bold text-emerald-400 mt-0.5">
                    Aluguel Semanal
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                Valor do Pagamento (R$)
              </h3>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-hidden font-mono font-bold"
                placeholder="0,00"
              />
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4.5 h-4.5 text-emerald-400" />
                  Foto do Comprovante *
                </h3>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        const dataUrl = ev.target.result as string;
                        setPaymentPhoto(dataUrl);
                        runImageOcr(dataUrl, 'receipt');
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              {ocrStatusMsg && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-300 font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{ocrStatusMsg}</span>
                </div>
              )}
              {!paymentPhoto ? (
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-center cursor-pointer text-emerald-400 text-xs font-bold uppercase tracking-wider"
                >
                  <Camera className="w-5 h-5 text-emerald-400" />
                  Tirar Foto ou Enviar Comprovante
                </button>
              ) : (
                <div 
                  className="relative group rounded-xl overflow-hidden border border-emerald-500/20 w-full h-48 cursor-pointer"
                  onClick={() => openEnlargedPhoto(paymentPhoto, 'Comprovante de Pagamento')}
                >
                  <img src={paymentPhoto} alt="Comprovante" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Alterar Foto
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                Observações (Opcional)
              </h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Insira detalhes do pagamento..."
                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-hidden h-20 resize-none font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={!paymentPhoto}
              className={`w-full py-3.5 ${!paymentPhoto ? 'opacity-50 grayscale' : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'} text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer`}
            >
              <Check className="w-4 h-4" />
              <span>Enviar Comprovante de Pagamento</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#111111] border border-emerald-500/20 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">
                    Vistoria
                  </span>
                  <h3 className="text-sm font-bold text-emerald-400 mt-0.5">
                    {vistoriaType?.toLowerCase().includes('devolu') 
                      ? 'Devolução' 
                      : vistoriaType?.toLowerCase().includes('entrega') 
                      ? 'Entrega' 
                      : 'periódica'}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider shrink-0">
                {vistoriaType?.toLowerCase().includes('devolu') 
                  ? 'Devolução' 
                  : vistoriaType?.toLowerCase().includes('entrega') 
                  ? 'Entrega' 
                  : 'periódica'}
              </span>
            </div>

            {/* Campo para Adicionar os KM / Odômetro do Veículo */}
            <div className="bg-[#111111] border border-emerald-500/20 rounded-2xl p-4 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>Odômetro / Quilometragem Atual (KM) *</span>
                </label>
                <div className="flex items-center gap-2">
                  {vehicle?.currentKm ? (
                    <span className="text-[10px] text-gray-400 font-mono">
                      Último: {vehicle.currentKm.toLocaleString('pt-BR')} KM
                    </span>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={odometerCameraRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            runImageOcr(ev.target.result as string, 'odometer');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isOcrLoading}
                    onClick={() => odometerCameraRef.current?.click()}
                    className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    title="Fotografar painel para ler a quilometragem automaticamente"
                  >
                    <Sparkles className="w-3 h-3 text-blue-400" />
                    <span>{isOcrLoading ? 'Lendo...' : 'Ler Painel por Foto (IA)'}</span>
                  </button>
                </div>
              </div>
              {ocrStatusMsg && (
                <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-[10px] text-blue-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{ocrStatusMsg}</span>
                </div>
              )}
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Informe a quilometragem exata marcada no painel do veículo ou clique em "Ler Painel por Foto". Esse valor atualizará o odômetro e a manutenção preventiva do carro.
              </p>
              <div className="relative flex items-center">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="Ex: 48500"
                  value={kmOdometer}
                  onChange={(e) => setKmOdometer(e.target.value)}
                  className="w-full text-sm bg-black/60 border border-white/15 rounded-xl pl-3.5 pr-14 py-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500 transition-colors"
                  required
                />
                <span className="absolute right-3.5 text-xs font-mono font-bold text-emerald-400 select-none">
                  KM
                </span>
              </div>
            </div>

            {/* Campo para Nível de Combustível */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Nível de Combustível</h3>
              <div className="grid grid-cols-5 gap-2">
                {[0, 25, 50, 75, 100].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFuelLevel(level)}
                    className={`py-2 rounded-xl text-xs font-bold border ${fuelLevel === level ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black/40 text-gray-400 border-white/10'}`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                Checklist de Inspeção
              </h3>
              <div className="space-y-3">
                {Object.entries(checklist).map(([key, state]: [string, {isOk: boolean, photoUrl: string | null}]) => {
                  const lower = key.toLowerCase();
                  const isCameraItem = lower.includes('câmera') || lower.includes('camera');
                  const isSdItem = lower.includes('cartão') || lower.includes('cartao') || lower.includes('memória') || lower.includes('memoria');
                  const isTrackerItem = lower.includes('rastreador');

                  return (
                    <div 
                      key={key} 
                      className={`bg-black/40 rounded-xl border transition-all overflow-hidden ${
                        isTrackerItem 
                          ? 'border-indigo-500/30 shadow-indigo-950/20 shadow-lg' 
                          : isCameraItem || isSdItem
                          ? 'border-emerald-500/30 shadow-emerald-950/20 shadow-lg'
                          : 'border-white/5'
                      }`}
                    >
                      {/* Item Header / Title */}
                      <div 
                        onClick={() => handleToggleChecklist(key)}
                        className={`flex items-center justify-between p-3.5 transition-all cursor-pointer select-none ${
                          state.isOk ? 'bg-emerald-500/5 text-white' : 'bg-red-500/5 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isCameraItem && <Video className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {isSdItem && <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {isTrackerItem && <Radio className="w-4 h-4 text-indigo-400 shrink-0" />}
                          
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                              {key}
                              {(isCameraItem || isSdItem) && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  📸 Foto Obrigatória
                                </span>
                              )}
                              {isTrackerItem && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  📡 Verificação de Segurança
                                </span>
                              )}
                            </span>
                            {isCameraItem && (
                              <span className="text-[10px] text-gray-400 mt-0.5">Tirar foto nítida da câmera instalada no veículo</span>
                            )}
                            {isSdItem && (
                              <span className="text-[10px] text-gray-400 mt-0.5">Tirar foto do cartão de memória inserido/retirado</span>
                            )}
                            {isTrackerItem && (
                              <span className="text-[10px] text-indigo-300/80 mt-0.5 font-medium">
                                Confirmar se o rastreador está ativo, comunicando e operacional
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Toggle / Icon */}
                        {isTrackerItem ? (
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setChecklist(prev => ({ ...prev, [key]: { ...prev[key], isOk: true } }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                state.isOk 
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black' 
                                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setChecklist(prev => ({ ...prev, [key]: { ...prev[key], isOk: false } }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                !state.isOk 
                                  ? 'bg-rose-500 text-white border-rose-400 shadow-md font-black' 
                                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                            state.isOk ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {state.isOk ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </div>
                        )}
                      </div>

                      {/* Photo Capture Section - Not needed for Rastreador (Sim/Não only) */}
                      {!isTrackerItem && (
                        <div className="p-3 border-t border-white/5 flex flex-col gap-2 bg-black/20">
                          {!state.photoUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetPhotoItem(key);
                                cameraInputRef.current?.click();
                              }}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                isCameraItem || isSdItem
                                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-xs'
                                  : 'bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10'
                              }`}
                            >
                              <Camera className="w-4 h-4" /> 
                              {isCameraItem ? 'Tirar Foto da Câmera do Carro' : isSdItem ? 'Tirar Foto do Cartão de Memória' : `Bater Foto: ${key}`}
                            </button>
                          ) : (
                            <div 
                              className="relative group rounded-lg overflow-hidden border border-emerald-500/20 w-full h-32 cursor-pointer"
                              onClick={() => state.photoUrl && openEnlargedPhoto(state.photoUrl, `Foto: ${key}`)}
                              title="Clique para ver foto grande"
                            >
                              <img src={state.photoUrl} alt={key} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="px-2 py-1 bg-black/70 text-white text-[10px] font-semibold rounded flex items-center gap-1">
                                  <ZoomIn className="w-3 h-3 text-emerald-400" /> Ver Grande
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                   e.stopPropagation();
                                   setTargetPhotoItem(key);
                                   cameraInputRef.current?.click();
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" /> Refazer
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4.5 h-4.5 text-emerald-400" />
                  Fotos Extras (Opcional)
                </h3>
                <span className="text-[10px] text-gray-500">Tire ou envie fotos</span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                  type="button"
                  onClick={() => { setTargetPhotoItem(null); cameraInputRef.current?.click(); }}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-center cursor-pointer text-gray-300 text-xs font-bold uppercase tracking-wider"
                >
                  <Camera className="w-5 h-5 text-gray-400" />
                  Adicionar Foto Extra
              </button>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {photos.map((photo, idx) => (
                    <div 
                      key={idx} 
                      className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/50 cursor-pointer"
                      onClick={() => openEnlargedPhoto(photo, `Foto Extra #${idx + 1}`)}
                      title="Clique para ver foto grande"
                    >
                      <img
                        src={photo}
                        alt={`Preview ${idx}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-2 py-1 bg-black/70 text-white text-[10px] font-semibold rounded flex items-center gap-1">
                          <ZoomIn className="w-3 h-3 text-emerald-400" /> Ver Grande
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(idx);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600/95 hover:bg-red-500 text-white rounded-md transition-colors cursor-pointer z-10"
                        title="Remover Foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                Observações Adicionais
              </h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Descreva pendências, riscos, nível exato de combustível ou outras avarias identificadas..."
                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:border-emerald-500/50 h-28 resize-none font-sans"
              />
            </div>
            
            {!allPhotosTaken && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                <span className="text-xs font-bold text-red-400">
                  ⚠️ Tire a foto de todos os itens do checklist para liberar o envio.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isGeneratingPdf || !allPhotosTaken}
              className={`w-full py-3.5 ${!allPhotosTaken ? 'opacity-50 grayscale' : isGeneratingPdf ? 'bg-emerald-600/50' : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'} text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer`}
            >
              {isGeneratingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gerando PDF e Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Concluir e Enviar Vistoria</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
      <footer className="bg-[#0d0d0d] border-t border-white/5 py-6 text-center text-[11px] text-gray-500 shrink-0">
        <p>© 2026 Gestão de Frota • Plataforma de Vistoria de Veículos Alugados.</p>
      </footer>

      {/* Enlarged Photo Modal with Swipe / Arrows */}
      {previewEnlargedPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setPreviewEnlargedPhoto(null)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[92vh] flex flex-col items-center justify-center p-3 sm:p-4 bg-zinc-950 rounded-2xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-2.5 mb-2 border-b border-white/10 text-white">
              <span className="font-bold text-sm tracking-wide text-emerald-400">
                {previewEnlargedPhoto.title || 'Foto'} ({previewEnlargedPhoto.index + 1} de {previewEnlargedPhoto.photos.length})
              </span>
              <button
                type="button"
                onClick={() => setPreviewEnlargedPhoto(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                title="Fechar visualização"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div 
              className="relative w-full flex items-center justify-center p-2 bg-black rounded-xl overflow-hidden min-h-[300px] max-h-[70vh] touch-pan-y cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              {previewEnlargedPhoto.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewEnlargedPhoto(prev => prev ? { 
                        ...prev, 
                        index: (prev.index - 1 + prev.photos.length) % prev.photos.length,
                        title: `Foto ${((prev.index - 1 + prev.photos.length) % prev.photos.length) + 1} de ${prev.photos.length}`
                      } : null);
                    }}
                    className="absolute left-2 sm:left-4 z-40 w-11 h-11 bg-black/85 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full border border-white/30 shadow-2xl flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
                    title="Foto Anterior"
                  >
                    ❮
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewEnlargedPhoto(prev => prev ? { 
                        ...prev, 
                        index: (prev.index + 1) % prev.photos.length,
                        title: `Foto ${((prev.index + 1) % prev.photos.length) + 1} de ${prev.photos.length}`
                      } : null);
                    }}
                    className="absolute right-2 sm:right-4 z-40 w-11 h-11 bg-black/85 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-full border border-white/30 shadow-2xl flex items-center justify-center text-lg font-bold transition-all cursor-pointer"
                    title="Próxima Foto"
                  >
                    ❯
                  </button>
                </>
              )}
              <img
                src={previewEnlargedPhoto.photos[previewEnlargedPhoto.index]}
                alt={previewEnlargedPhoto.title}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg select-none pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Pagination dots */}
            {previewEnlargedPhoto.photos.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2.5 overflow-x-auto max-w-full py-1">
                {previewEnlargedPhoto.photos.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewEnlargedPhoto(prev => prev ? { 
                        ...prev, 
                        index: dotIdx,
                        title: `Foto ${dotIdx + 1} de ${prev.photos.length}`
                      } : null);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      dotIdx === previewEnlargedPhoto.index 
                        ? 'w-6 bg-emerald-400' 
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                    title={`Ir para foto ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="mt-1.5 text-center text-[11px] text-gray-400 font-medium">
              👆 Arraste para o lado ou use as setas ❮ ❯ para navegar entre as fotos
            </div>
          </div>
        </div>
      )}

      {/* Large Fullscreen Logo Viewer Modal */}
      <LogoViewerModal
        isOpen={isLogoViewerOpen}
        onClose={() => setIsLogoViewerOpen(false)}
      />
      </div>
    </div>
  );
}
