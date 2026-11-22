import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { Vehicle, MaintenanceLog, ExpenseLog, Vistoria, FuelLog, SinistroLog, CaucaoSettlementData, LateContractDebit, getFineAdminFee, getFineTotal, isWeeklyPaymentPaid } from '../types';
import { getSavedContractClauses, replaceClauseVariables, getFullContractTextTemplate, groupClausesByTopic } from './contractClauses';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization:', e);
}

export async function urlToDataUrl(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
  if (!url) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 300;
        
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = canvas.width;
        let height = canvas.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ dataUrl, format: 'JPEG' });
          return;
        }
      } catch (e) {
        console.warn('Canvas conversion failed:', e);
      }
      
      if (url.startsWith('data:image/png')) {
        resolve({ dataUrl: url, format: 'PNG' });
      } else if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
        resolve({ dataUrl: url, format: 'JPEG' });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      if (url.startsWith('data:image/png')) {
        resolve({ dataUrl: url, format: 'PNG' });
      } else if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
        resolve({ dataUrl: url, format: 'JPEG' });
      } else {
        resolve(null);
      }
    };
    img.src = url;
  });
}

async function urlToDataUrlWithDimensions(
  url: string
): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG'; width: number; height: number } | null> {
  if (!url) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width || 400;
        const naturalH = img.naturalHeight || img.height || 300;
        const MAX_DIM = 1000;
        let width = naturalW;
        let height = naturalH;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          resolve({ dataUrl, format: 'JPEG', width, height });
          return;
        }
      } catch (e) {
        console.warn('Canvas conversion with dimensions failed:', e);
      }

      if (url.startsWith('data:image/png')) {
        resolve({ dataUrl: url, format: 'PNG', width: 800, height: 600 });
      } else if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
        resolve({ dataUrl: url, format: 'JPEG', width: 800, height: 600 });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function pdfDataUrlToImages(
  pdfUrl: string
): Promise<Array<{ dataUrl: string; format: 'JPEG'; width: number; height: number }>> {
  if (!pdfUrl) return [];
  try {
    let pdfData: Uint8Array;
    if (pdfUrl.startsWith('data:')) {
      const base64Index = pdfUrl.indexOf(';base64,');
      if (base64Index !== -1) {
        const base64 = pdfUrl.substring(base64Index + 8);
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfData = bytes;
      } else {
        const res = await fetch(pdfUrl);
        const buffer = await res.arrayBuffer();
        pdfData = new Uint8Array(buffer);
      }
    } else if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('http')) {
      const res = await fetch(pdfUrl);
      const buffer = await res.arrayBuffer();
      pdfData = new Uint8Array(buffer);
    } else {
      const binaryString = window.atob(pdfUrl);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfData = bytes;
    }

    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    const pages: Array<{ dataUrl: string; format: 'JPEG'; width: number; height: number }> = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          pages.push({
            dataUrl: canvas.toDataURL('image/jpeg', 0.74),
            format: 'JPEG',
            width: canvas.width,
            height: canvas.height,
          });
        }
      } catch (pageErr) {
        console.warn(`Erro ao renderizar página ${pageNum} do PDF anexo:`, pageErr);
      }
    }

    return pages;
  } catch (err) {
    console.warn('Erro ao extrair páginas de PDF anexo para o PDF final:', err);
    return [];
  }
}

function isPdfAttachment(url: string, fileType?: string, fileName?: string): boolean {
  if (fileType === 'pdf') return true;
  if (url.startsWith('data:application/pdf')) return true;
  if (fileName && fileName.toLowerCase().endsWith('.pdf')) return true;
  return false;
}

async function renderAttachmentIntoPdf(
  doc: jsPDF,
  url: string,
  label: string,
  startY: number,
  options?: { fileType?: string; fileName?: string; maxW?: number; maxH?: number; x?: number }
): Promise<number> {
  if (!url) return startY;
  let y = startY;
  const x = options?.x ?? 18;
  const maxW = options?.maxW ?? 174;
  const maxH = options?.maxH ?? 210;

  if (isPdfAttachment(url, options?.fileType, options?.fileName)) {
    const pages = await pdfDataUrlToImages(url);
    if (pages.length === 0) {
      if (y > 272) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text(`[Anexo PDF: ${label} — não foi possível renderizar visualmente]`, x, y);
      return y + 6;
    }

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const ratio = p.width > 0 && p.height > 0 ? p.height / p.width : 1.414;
      let drawW = maxW;
      let drawH = drawW * ratio;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH / ratio;
      }

      if (y + drawH + 10 > 282) {
        doc.addPage();
        y = 15;
      }

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${label}${pages.length > 1 ? ` (Página ${i + 1}/${pages.length})` : ''}`, x, y);
      y += 4;

      try {
        doc.setDrawColor(203, 213, 225);
        doc.rect(x, y, drawW, drawH);
        doc.addImage(p.dataUrl, p.format, x, y, drawW, drawH);
        y += drawH + 6;
      } catch (err) {
        console.warn('Erro ao inserir página de PDF anexo:', err);
        y += 6;
      }
    }
    doc.setTextColor(51, 65, 85);
    return y;
  }

  const imgData = await urlToDataUrlWithDimensions(url);
  if (!imgData) return y;

  const ratio = imgData.width > 0 && imgData.height > 0 ? imgData.height / imgData.width : 0.75;
  let drawW = Math.min(maxW, 150);
  let drawH = drawW * ratio;
  const capH = Math.min(maxH, 115);
  if (drawH > capH) {
    drawH = capH;
    drawW = drawH / ratio;
  }

  if (y + drawH + 10 > 282) {
    doc.addPage();
    y = 15;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(label, x, y);
  y += 4;

  try {
    doc.setDrawColor(203, 213, 225);
    doc.rect(x, y, drawW, drawH);
    doc.addImage(imgData.dataUrl, imgData.format, x, y, drawW, drawH);
    y += drawH + 6;
  } catch (err) {
    console.warn('Erro ao inserir imagem anexa no PDF:', err);
  }
  doc.setTextColor(51, 65, 85);
  return y;
}

export async function generateVehiclePDF(
  vehicle: Vehicle,
  maintenanceLogs: MaintenanceLog[],
  expenseLogs: ExpenseLog[],
  vistorias: Vistoria[],
  fuelLogs: FuelLog[],
  options?: {
    settlement?: CaucaoSettlementData;
    sinistroLogs?: SinistroLog[];
  }
): Promise<{ doc: jsPDF; fileName: string; pdfDataUrl: string }> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const formattedNow = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fileName = `Contrato_Finalizado_${vehicle.plate.replace(/[^a-zA-Z0-9]/g, '')}_${now.toISOString().split('T')[0]}.pdf`;

  // Colors
  const primaryColor = [30, 41, 59]; // Navy slate
  const textColor = [51, 65, 85];

  let y = 15;

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('RELATÓRIO FINAL DE CONTRATO - ENCERRAMENTO DE LOCAÇÃO', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pasta: Contratos Finalizados | Data de Encerramento: ${formattedNow}`, 14, 20);

  y = 36;

  // Section 1: Dados do Veículo
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. DADOS IDENTIFICADORES DO VEÍCULO', 18, y + 5);

  y += 12;

  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const payments = (vehicle.weeklyPayments || []).filter(isWeeklyPaymentPaid);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const vehicleFields = [
    [`Marca / Modelo:`, `${vehicle.brand} ${vehicle.model}`],
    [`Placa:`, `${vehicle.plate}`],
    [`Ano / Cor:`, `${vehicle.year} / ${vehicle.color}`],
    [`Odômetro Final:`, `${(vehicle.currentKm || 0).toLocaleString('pt-BR')} km`],
    [`Locadora / Empresa:`, vehicle.rentalCompany || 'Não informada'],
    [`Total Recebido (Pago):`, `R$ ${(totalPaid > 0 ? totalPaid : (vehicle.valorRecebido || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    [`Nível Combustível:`, `${vehicle.fuelLevel || 8}/8 (${((vehicle.fuelLevel || 8) / 8 * 100).toFixed(0)}%)`],
    [`Seguro / IPVA:`, `R$ ${(vehicle.seguro || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ ${(vehicle.ipva || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]
  ];

  vehicleFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = col === 0 ? 18 : 110;
    const yPos = y + (row * 6);

    doc.setFont('helvetica', 'bold');
    doc.text(field[0], xPos, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(field[1], xPos + doc.getTextWidth(field[0]) + 2, yPos);
  });

  y += (Math.ceil(vehicleFields.length / 2) * 6) + 6;

  // Section 2: Dados do Locatário / Motorista + CNH & Comprovante de Endereço
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. DADOS E ANEXOS DO LOCATÁRIO / MOTORISTA', 18, y + 5);

  y += 12;
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const driverFields: [string, string][] = [
    [`Nome do Motorista:`, vehicle.driver || 'Não cadastrado'],
    [`Telefone:`, vehicle.driverPhone || 'Não informado'],
    [`CPF / CNPJ:`, vehicle.tenantCpfCnpj || 'Não informado'],
    [`RG:`, vehicle.tenantRg || 'Não informado'],
    [`CNH:`, `${vehicle.tenantCnh || 'Não informada'}${vehicle.driverCnhExpiration ? ` (Val: ${new Date(vehicle.driverCnhExpiration + 'T12:00:00').toLocaleDateString('pt-BR')})` : ''}`],
    [`Data Início Locação:`, vehicle.startDate ? new Date(vehicle.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada'],
  ];

  driverFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = col === 0 ? 18 : 110;
    const yPos = y + (row * 6);

    doc.setFont('helvetica', 'bold');
    doc.text(field[0], xPos, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(field[1], xPos + doc.getTextWidth(field[0]) + 2, yPos);
  });

  y += (Math.ceil(driverFields.length / 2) * 6) + 2;

  if (vehicle.tenantAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', 18, y);
    doc.setFont('helvetica', 'normal');
    const addrLines = doc.splitTextToSize(vehicle.tenantAddress, 155);
    doc.text(addrLines, 38, y);
    y += addrLines.length * 5 + 2;
  }

  if (vehicle.driverCnhPhotoUrl) {
    y = await renderAttachmentIntoPdf(doc, vehicle.driverCnhPhotoUrl, 'Anexo do Motorista: CNH Digitalizada / Foto', y);
  }
  if (vehicle.driverAddressProofUrl) {
    y = await renderAttachmentIntoPdf(doc, vehicle.driverAddressProofUrl, 'Anexo do Motorista: Comprovante de Endereço', y);
  }

  y += 4;
  if (y > 235) { doc.addPage(); y = 15; }

  // Section 3: Histórico Financeiro, Pagamentos e Acerto da Caução
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. HISTÓRICO DE PAGAMENTOS E ACERTO DE CAUÇÃO', 18, y + 5);

  y += 12;

  const totalPaidPromises = (vehicle.promisePayments || []).filter(p => p.isPaid).reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPromises = (vehicle.promisePayments || []).reduce((acc, p) => acc + (p.amount || 0), 0);

  doc.text(`Caução Inicial: R$ ${(vehicle.caucaoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Promessas de Caução: R$ ${totalPromises.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Pagas: R$ ${totalPaidPromises.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 18, y);
  y += 5.5;
  doc.text(`Total de parcelas semanais pagas registradas: R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${payments.length} parcela(s))`, 18, y);
  y += 6;

  // Payments table header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.rect(14, y, 182, 6, 'F');
  doc.text('Data Pagamento', 18, y + 4.5);
  doc.text('Valor Pago (R$)', 80, y + 4.5);

  y += 6;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');

  if (payments.length === 0) {
    doc.text('Nenhum pagamento confirmado registrado.', 18, y + 5);
    y += 8;
  } else {
    payments.forEach((p, idx) => {
      if (y > 268) {
        doc.addPage();
        y = 15;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 5.5, 'F');
      }
      const dateStr = new Date((p.paidDate || p.date) + 'T12:00:00').toLocaleDateString('pt-BR');
      doc.text(dateStr, 18, y + 4);
      doc.text(`R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, y + 4);
      y += 5.5;
    });
  }

  // Resumo do Acerto de Caução (se informado no fechamento)
  if (options?.settlement) {
    const s = options.settlement;
    y += 5;
    if (y > 235) { doc.addPage(); y = 15; }
    doc.setFillColor(254, 249, 195);
    doc.rect(14, y, 182, 6.5, 'F');
    doc.setTextColor(133, 77, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('RESUMO DO ACERTO DA CAUÇÃO NA DEVOLUÇÃO', 18, y + 4.5);
    y += 9;

    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const settlementRows = [
      ['Caução Depositada:', `+ R$ ${s.caucaoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['(-) Aluguéis / Dias em Aberto:', `- R$ ${s.descontoAluguelPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['(-) Avarias / Reparos:', `- R$ ${s.descontoAvarias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['(-) Lavagem / Higienização:', `- R$ ${(s.descontoLavagem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['(-) Diferença de Combustível:', `- R$ ${s.descontoCombustivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['(-) Multas (Trânsito + Adm.):', `- R$ ${s.descontoMultas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['(-) Pedágios / Tag:', `- R$ ${(s.descontoPedagios || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ];
    settlementRows.forEach(([k, v], idx) => {
      if (y > 270) { doc.addPage(); y = 15; }
      const col = idx % 2;
      const xPos = col === 0 ? 18 : 108;
      doc.setFont('helvetica', 'bold');
      doc.text(k, xPos, y);
      doc.setFont('helvetica', 'normal');
      doc.text(v, xPos + 50, y);
      if (col === 1 || idx === settlementRows.length - 1) y += 5;
    });
    if (s.observacoesAcerto) {
      doc.setFont('helvetica', 'italic');
      doc.text(`Obs. Acerto: ${s.observacoesAcerto}`, 18, y);
      y += 5.5;
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(s.saldoFinal >= 0 ? 5 : 190, s.saldoFinal >= 0 ? 150 : 18, s.saldoFinal >= 0 ? 105 : 60);
    doc.text(
      `${s.saldoFinal >= 0 ? 'SALDO A DEVOLVER AO LOCATÁRIO' : 'SALDO DEVEDOR DO LOCATÁRIO'}: R$ ${Math.abs(s.saldoFinal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      18,
      y + 1
    );
    y += 7;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  }

  y += 4;
  if (y > 235) { doc.addPage(); y = 15; }

  // Section 4: Histórico de Manutenções e Despesas
  const vehMaint = maintenanceLogs.filter((m) => m.vehicleId === vehicle.id);
  const vehExp = expenseLogs.filter((e) => e.vehicleId === vehicle.id);
  const cleanPlate = vehicle.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const vehVistorias = vistorias.filter(
    (v) =>
      v.vehicleId === vehicle.id ||
      (v.vehiclePlate && v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanPlate)
  );
  const vehSinistros = (options?.sinistroLogs || []).filter((s) => s.vehicleId === vehicle.id);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. MANUTENÇÕES E DESPESAS', 18, y + 5);

  y += 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const totalMaintCost = vehMaint.reduce((acc, m) => acc + m.cost, 0);
  const totalExpCost = vehExp.reduce((acc, e) => acc + e.cost, 0);

  doc.text(`Total em Manutenções (${vehMaint.length} registro(s)): R$ ${totalMaintCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 18, y);
  y += 5;
  doc.text(`Total em Despesas Eventuais (${vehExp.length} registro(s)): R$ ${totalExpCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 18, y);
  y += 8;

  if (vehMaint.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Registros de Manutenção:', 18, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    vehMaint.forEach((m) => {
      if (y > 270) { doc.addPage(); y = 15; }
      let extraInfo = '';
      if (m.boNumber) extraInfo += ` [B.O.: ${m.boNumber}]`;
      if (m.partsReplaced) extraInfo += ` [Peças: ${m.partsReplaced}]`;
      doc.text(`• ${m.date ? new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'S/D'} - [${m.type}] ${m.description}${extraInfo} (R$ ${(m.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 22, y);
      y += 5.5;
    });
    y += 3;
  }

  if (vehExp.length > 0) {
    if (y > 265) { doc.addPage(); y = 15; }
    doc.setFont('helvetica', 'bold');
    doc.text('Despesas Eventuais / Pedágios / Taxas:', 18, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    vehExp.forEach((e) => {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.text(`• ${e.date ? new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'S/D'} - [${e.category}] ${e.description || '-'} (R$ ${(e.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 22, y);
      y += 5.5;
    });
    y += 3;
  }

  // Section 5: Multas e Sinistros (com anexos)
  const vehFines = vehicle.fines || [];
  if (vehFines.length > 0 || vehSinistros.length > 0) {
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`5. MULTAS E SINISTROS (${vehFines.length} multa(s), ${vehSinistros.length} sinistro(s))`, 18, y + 5);
    y += 12;
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    for (const f of vehFines) {
      if (y > 265) { doc.addPage(); y = 15; }
      const adminFee = getFineAdminFee(f);
      const totalF = getFineTotal(f);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${f.dataHora} - ${f.descricao} | Total: R$ ${totalF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} [${f.status}]`, 20, y);
      y += 5;
      if (adminFee > 0 || (f.extraAdminFineAmount || 0) > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text(`  (Nominal: R$ ${(f.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${adminFee > 0 ? ` + Taxa Adm ${f.adminFeePct ?? 20}%: R$ ${adminFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${(f.extraAdminFineAmount || 0) > 0 ? ` + Multa Adm: R$ ${(f.extraAdminFineAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''})`, 22, y);
        y += 5;
      }
      if (f.notificationUrl) {
        y = await renderAttachmentIntoPdf(doc, f.notificationUrl, `Notificação da Multa (${f.dataHora})`, y, { maxW: 140, maxH: 100 });
      }
    }

    for (const sin of vehSinistros) {
      if (y > 265) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.text(`• Sinistro ${sin.date ? new Date(sin.date + 'T12:00:00').toLocaleDateString('pt-BR') : ''} - ${sin.description} (Custo: R$ ${(sin.repairCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 20, y);
      y += 5;
      if (sin.boUrl) {
        y = await renderAttachmentIntoPdf(doc, sin.boUrl, 'Anexo B.O. do Sinistro', y, { maxW: 150, maxH: 110 });
      }
      for (let idx = 0; idx < (sin.photos || []).length; idx++) {
        y = await renderAttachmentIntoPdf(doc, sin.photos[idx], `Foto Sinistro #${idx + 1}`, y, { maxW: 130, maxH: 90 });
      }
    }
  }

  // Section 6: Detalhamento de Vistorias
  if (y > 240) { doc.addPage(); y = 15; }

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`6. HISTÓRICO E LAUDOS DE VISTORIAS (${vehVistorias.length})`, 18, y + 5);

  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  if (vehVistorias.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhuma vistoria registrada para este veículo.', 18, y);
    y += 8;
  } else {
    for (let index = 0; index < vehVistorias.length; index++) {
      const v = vehVistorias[index];
      if (y > 230) { doc.addPage(); y = 15; }

      const vDate = v.date ? new Date(v.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Data não informada';
      const vType = v.type || 'Semanal';

      // Header block per vistoria
      doc.setFillColor(248, 250, 252);
      doc.rect(18, y, 174, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(`Vistoria #${index + 1} - ${vType} (${vDate})`, 22, y + 4.5);
      y += 8;

      // Checklist items
      if (v.checklist) {
        doc.setFont('helvetica', 'normal');
        const items = Object.entries(v.checklist);
        const approvedCount = items.filter(([_, val]) => val).length;
        doc.text(`Status do Checklist: ${approvedCount}/${items.length} itens aprovados`, 22, y);
        y += 5;

        // Print items in 2 columns
        items.forEach(([itemKey, isOk], idx) => {
          if (y > 270) { doc.addPage(); y = 15; }
          const col = idx % 2;
          const xPos = col === 0 ? 22 : 110;
          const isTracker = itemKey.toLowerCase().includes('rastreador');
          const statusText = isTracker
            ? (isOk ? '[SIM]' : '[NÃO]')
            : (isOk ? '[OK]' : '[PENDENTE]');
          doc.setFont('helvetica', isOk ? 'normal' : 'bold');
          if (!isOk) doc.setTextColor(225, 29, 72);
          doc.text(`${statusText} ${itemKey}`, xPos, y);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);

          if (col === 1 || idx === items.length - 1) {
            y += 4.5;
          }
        });
        y += 2;
      }

      if (v.notes) {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.text('Observações:', 22, y);
        doc.setFont('helvetica', 'italic');
        doc.text(v.notes, 48, y);
        y += 5;
      }

      // Vistoria Photos (converting to JPEG via canvas with aspect ratio)
      if (v.photos && v.photos.length > 0) {
        if (y > 220) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.text(`Fotos Anexadas à Vistoria (${v.photos.length}):`, 22, y);
        y += 6;

        let imgX = 22;
        for (const photoUrl of v.photos) {
          if (!photoUrl) continue;
          const imgData = await urlToDataUrlWithDimensions(photoUrl);
          if (imgData) {
            try {
              if (imgX + 45 > 190) {
                imgX = 22;
                y += 35;
                if (y > 240) { doc.addPage(); y = 15; }
              }
              doc.addImage(imgData.dataUrl, imgData.format, imgX, y, 42, 30);
              imgX += 46;
            } catch (err) {
              console.warn('Não foi possível renderizar imagem da vistoria no PDF:', err);
            }
          }
        }
        if (imgX > 22) {
          y += 34;
        }
      } else if (v.pdfDataUrl) {
        y = await renderAttachmentIntoPdf(doc, v.pdfDataUrl, `Laudo PDF Vistoria #${index + 1}`, y, { fileType: 'pdf' });
      }

      y += 4;
    }
  }

  // Section 7: Documentos e Anexos do Veículo / Contrato (Imagens e PDFs completos)
  if (y > 240) { doc.addPage(); y = 15; }

  const docs = vehicle.documents || [];
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`7. DOCUMENTOS E ANEXOS DO CONTRATO E VEÍCULO (${docs.length})`, 18, y + 5);

  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  if (docs.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum documento anexado ao contrato/veículo.', 18, y);
    y += 8;
  } else {
    for (const d of docs) {
      if (y > 255) { doc.addPage(); y = 15; }

      doc.setFont('helvetica', 'bold');
      doc.text(`• [${d.category || 'Geral'}] ${d.name}`, 18, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Enviado em: ${d.uploadDate || 'S/D'}${d.fileSize ? ` • ${d.fileSize}` : ''}`, 22, y);
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      y += 5;

      if (d.contentUrl) {
        y = await renderAttachmentIntoPdf(
          doc,
          d.contentUrl,
          `Anexo: [${d.category || 'Geral'}] ${d.name}`,
          y,
          { fileType: d.fileType, fileName: d.name }
        );
      }
    }
  }

  y += 8;

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // Footer Signatures
  doc.setDrawColor(203, 213, 225);
  doc.line(18, y + 20, 90, y + 20);
  doc.line(118, y + 20, 190, y + 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura do Gestor da Frota', 18, y + 25);
  doc.text('Assinatura do Locatário / Motorista', 118, y + 25);

  // Generate data URL
  const pdfDataUrl = doc.output('datauristring');

  return { doc, fileName, pdfDataUrl };
}

function formatDateBrSafe(isoDate?: string): string {
  if (!isoDate) return 'Não informada';
  if (/^\d{4}-\d{2}-\d{2}/.test(isoDate)) {
    const clean = isoDate.slice(0, 10);
    return new Date(`${clean}T12:00:00`).toLocaleDateString('pt-BR');
  }
  return isoDate;
}

function formatMoneyBr(val: number): string {
  return `R$ ${(Number(val) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function appendVehicleDossierSections(
  doc: jsPDF,
  vehicle: Vehicle,
  maintenanceLogs: MaintenanceLog[],
  expenseLogs: ExpenseLog[],
  vistorias: Vistoria[],
  options?: {
    settlement?: CaucaoSettlementData;
    sinistroLogs?: SinistroLog[];
  }
) {
  const primaryColor = [30, 41, 59];
  const textColor = [51, 65, 85];
  let y = 16;

  // Section 1: Dados do Veículo
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. DADOS IDENTIFICADORES DO VEÍCULO', 18, y + 5);

  y += 12;
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const payments = (vehicle.weeklyPayments || []).filter(isWeeklyPaymentPaid);
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  const vehicleFields = [
    [`Marca / Modelo:`, `${vehicle.brand} ${vehicle.model}`],
    [`Placa:`, `${vehicle.plate}`],
    [`Ano / Cor:`, `${vehicle.year} / ${vehicle.color}`],
    [`Odômetro Final:`, `${(vehicle.currentKm || 0).toLocaleString('pt-BR')} km`],
    [`Locadora / Empresa:`, vehicle.rentalCompany || 'Não informada'],
    [`Total Recebido (Pago):`, formatMoneyBr(totalPaid > 0 ? totalPaid : (vehicle.valorRecebido || 0))],
    [`Nível Combustível:`, `${vehicle.fuelLevel || 8}/8 (${((vehicle.fuelLevel || 8) / 8 * 100).toFixed(0)}%)`],
    [`Seguro / IPVA:`, `${formatMoneyBr(vehicle.seguro || 0)} / ${formatMoneyBr(vehicle.ipva || 0)}`]
  ];

  vehicleFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = col === 0 ? 18 : 110;
    const yPos = y + (row * 6);
    doc.setFont('helvetica', 'bold');
    doc.text(field[0], xPos, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(field[1], xPos + doc.getTextWidth(field[0]) + 2, yPos);
  });

  y += (Math.ceil(vehicleFields.length / 2) * 6) + 6;

  // Section 2: Dados do Locatário / Motorista + CNH & Comprovante de Endereço
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. DADOS E ANEXOS DO LOCATÁRIO / MOTORISTA', 18, y + 5);

  y += 12;
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const driverFields: [string, string][] = [
    [`Nome do Motorista:`, vehicle.driver || 'Não cadastrado'],
    [`Telefone:`, vehicle.driverPhone || 'Não informado'],
    [`CPF / CNPJ:`, vehicle.tenantCpfCnpj || 'Não informado'],
    [`RG:`, vehicle.tenantRg || 'Não informado'],
    [`CNH:`, `${vehicle.tenantCnh || 'Não informada'}${vehicle.driverCnhExpiration ? ` (Val: ${formatDateBrSafe(vehicle.driverCnhExpiration)})` : ''}`],
    [`Data Início Locação:`, formatDateBrSafe(vehicle.startDate)],
  ];

  driverFields.forEach((field, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = col === 0 ? 18 : 110;
    const yPos = y + (row * 6);
    doc.setFont('helvetica', 'bold');
    doc.text(field[0], xPos, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(field[1], xPos + doc.getTextWidth(field[0]) + 2, yPos);
  });

  y += (Math.ceil(driverFields.length / 2) * 6) + 2;

  if (vehicle.tenantAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', 18, y);
    doc.setFont('helvetica', 'normal');
    const addrLines = doc.splitTextToSize(vehicle.tenantAddress, 155);
    doc.text(addrLines, 38, y);
    y += addrLines.length * 5 + 2;
  }

  if (vehicle.driverCnhPhotoUrl) {
    y = await renderAttachmentIntoPdf(doc, vehicle.driverCnhPhotoUrl, 'Anexo do Motorista: CNH Digitalizada / Foto', y);
  }
  if (vehicle.driverAddressProofUrl) {
    y = await renderAttachmentIntoPdf(doc, vehicle.driverAddressProofUrl, 'Anexo do Motorista: Comprovante de Endereço', y);
  }

  y += 4;
  if (y > 235) { doc.addPage(); y = 15; }

  // Section 3: Histórico Financeiro e Pagamentos
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. HISTÓRICO DE PAGAMENTOS SEMANAIS', 18, y + 5);

  y += 12;
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');

  const totalPaidPromises = (vehicle.promisePayments || []).filter(p => p.isPaid).reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPromises = (vehicle.promisePayments || []).reduce((acc, p) => acc + (p.amount || 0), 0);

  doc.text(`Caução Inicial: ${formatMoneyBr(vehicle.caucaoValor || 0)} | Promessas de Caução: ${formatMoneyBr(totalPromises)} (Pagas: ${formatMoneyBr(totalPaidPromises)})`, 18, y);
  y += 5.5;
  doc.text(`Total de parcelas semanais pagas registradas: ${formatMoneyBr(totalPaid)} (${payments.length} parcela(s))`, 18, y);
  y += 6;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.rect(14, y, 182, 6, 'F');
  doc.text('Data Pagamento', 18, y + 4.5);
  doc.text('Valor Pago (R$)', 80, y + 4.5);

  y += 6;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');

  if (payments.length === 0) {
    doc.text('Nenhum pagamento confirmado registrado.', 18, y + 5);
    y += 8;
  } else {
    payments.forEach((p, idx) => {
      if (y > 268) { doc.addPage(); y = 15; }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 5.5, 'F');
      }
      const dateStr = formatDateBrSafe(p.paidDate || p.date);
      doc.text(dateStr, 18, y + 4);
      doc.text(formatMoneyBr(p.amount), 80, y + 4);
      y += 5.5;
    });
  }

  y += 4;
  if (y > 235) { doc.addPage(); y = 15; }

  // Section 4: Manutenções e Despesas
  const vehMaint = maintenanceLogs.filter((m) => m.vehicleId === vehicle.id);
  const vehExp = expenseLogs.filter((e) => e.vehicleId === vehicle.id);
  const cleanPlate = vehicle.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const vehVistorias = vistorias.filter(
    (v) =>
      v.vehicleId === vehicle.id ||
      (v.vehiclePlate && v.vehiclePlate.replace(/[^A-Z0-9]/gi, '').toUpperCase() === cleanPlate)
  );
  const vehSinistros = (options?.sinistroLogs || []).filter((s) => s.vehicleId === vehicle.id);

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. MANUTENÇÕES E DESPESAS', 18, y + 5);

  y += 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  const totalMaintCost = vehMaint.reduce((acc, m) => acc + m.cost, 0);
  const totalExpCost = vehExp.reduce((acc, e) => acc + e.cost, 0);

  doc.text(`Total em Manutenções (${vehMaint.length} registro(s)): ${formatMoneyBr(totalMaintCost)}`, 18, y);
  y += 5;
  doc.text(`Total em Despesas Eventuais (${vehExp.length} registro(s)): ${formatMoneyBr(totalExpCost)}`, 18, y);
  y += 8;

  if (vehMaint.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Registros de Manutenção:', 18, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    vehMaint.forEach((m) => {
      if (y > 270) { doc.addPage(); y = 15; }
      let extraInfo = '';
      if (m.boNumber) extraInfo += ` [B.O.: ${m.boNumber}]`;
      if (m.partsReplaced) extraInfo += ` [Peças: ${m.partsReplaced}]`;
      doc.text(`• ${m.date ? formatDateBrSafe(m.date) : 'S/D'} - [${m.type}] ${m.description}${extraInfo} (${formatMoneyBr(m.cost || 0)})`, 22, y);
      y += 5.5;
    });
    y += 3;
  }

  if (vehExp.length > 0) {
    if (y > 265) { doc.addPage(); y = 15; }
    doc.setFont('helvetica', 'bold');
    doc.text('Despesas Eventuais / Pedágios / Taxas:', 18, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    vehExp.forEach((e) => {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.text(`• ${e.date ? formatDateBrSafe(e.date) : 'S/D'} - [${e.category}] ${e.description || '-'} (${formatMoneyBr(e.cost || 0)})`, 22, y);
      y += 5.5;
    });
    y += 3;
  }

  // Section 5: Multas e Sinistros
  const vehFines = vehicle.fines || [];
  if (vehFines.length > 0 || vehSinistros.length > 0) {
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`5. MULTAS E SINISTROS (${vehFines.length} multa(s), ${vehSinistros.length} sinistro(s))`, 18, y + 5);
    y += 12;
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    for (const f of vehFines) {
      if (y > 265) { doc.addPage(); y = 15; }
      const adminFee = getFineAdminFee(f);
      const totalF = getFineTotal(f);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${f.dataHora} - ${f.descricao} | Total: ${formatMoneyBr(totalF)} [${f.status}]`, 20, y);
      y += 5;
      if (adminFee > 0 || (f.extraAdminFineAmount || 0) > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text(`  (Nominal: ${formatMoneyBr(f.valor || 0)}${adminFee > 0 ? ` + Taxa Adm ${f.adminFeePct ?? 20}%: ${formatMoneyBr(adminFee)}` : ''}${(f.extraAdminFineAmount || 0) > 0 ? ` + Multa Adm: ${formatMoneyBr(f.extraAdminFineAmount || 0)}` : ''})`, 22, y);
        y += 5;
      }
      if (f.notificationUrl) {
        y = await renderAttachmentIntoPdf(doc, f.notificationUrl, `Notificação da Multa (${f.dataHora})`, y, { maxW: 140, maxH: 100 });
      }
    }

    for (const sin of vehSinistros) {
      if (y > 265) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.text(`• Sinistro ${sin.date ? formatDateBrSafe(sin.date) : ''} - ${sin.description} (Custo: ${formatMoneyBr(sin.repairCost || 0)})`, 20, y);
      y += 5;
      if (sin.boUrl) {
        y = await renderAttachmentIntoPdf(doc, sin.boUrl, 'Anexo B.O. do Sinistro', y, { maxW: 150, maxH: 110 });
      }
      for (let idx = 0; idx < (sin.photos || []).length; idx++) {
        y = await renderAttachmentIntoPdf(doc, sin.photos[idx], `Foto Sinistro #${idx + 1}`, y, { maxW: 130, maxH: 90 });
      }
    }
  }

  // Section 6: Vistorias
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`6. HISTÓRICO E LAUDOS DE VISTORIAS (${vehVistorias.length})`, 18, y + 5);

  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  if (vehVistorias.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhuma vistoria registrada para este veículo.', 18, y);
    y += 8;
  } else {
    for (let index = 0; index < vehVistorias.length; index++) {
      const v = vehVistorias[index];
      if (y > 230) { doc.addPage(); y = 15; }
      const vDate = v.date ? formatDateBrSafe(v.date) : 'Data não informada';
      const vType = v.type || 'Semanal';

      doc.setFillColor(248, 250, 252);
      doc.rect(18, y, 174, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text(`Vistoria #${index + 1} - ${vType} (${vDate})`, 22, y + 4.5);
      y += 8;

      if (v.checklist) {
        doc.setFont('helvetica', 'normal');
        const items = Object.entries(v.checklist);
        const approvedCount = items.filter(([_, val]) => val).length;
        doc.text(`Status do Checklist: ${approvedCount}/${items.length} itens aprovados`, 22, y);
        y += 5;

        items.forEach(([itemKey, isOk], idx) => {
          if (y > 270) { doc.addPage(); y = 15; }
          const col = idx % 2;
          const xPos = col === 0 ? 22 : 110;
          const isTracker = itemKey.toLowerCase().includes('rastreador');
          const statusText = isTracker ? (isOk ? '[SIM]' : '[NÃO]') : (isOk ? '[OK]' : '[PENDENTE]');
          doc.setFont('helvetica', isOk ? 'normal' : 'bold');
          if (!isOk) doc.setTextColor(225, 29, 72);
          doc.text(`${statusText} ${itemKey}`, xPos, y);
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
          if (col === 1 || idx === items.length - 1) y += 4.5;
        });
        y += 2;
      }

      if (v.notes) {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.text('Observações:', 22, y);
        doc.setFont('helvetica', 'italic');
        doc.text(v.notes, 48, y);
        y += 5;
      }

      if (v.photos && v.photos.length > 0) {
        if (y > 220) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.text(`Fotos Anexadas à Vistoria (${v.photos.length}):`, 22, y);
        y += 6;

        let imgX = 22;
        for (const photoUrl of v.photos) {
          if (!photoUrl) continue;
          const imgData = await urlToDataUrlWithDimensions(photoUrl);
          if (imgData) {
            try {
              if (imgX + 45 > 190) {
                imgX = 22;
                y += 35;
                if (y > 240) { doc.addPage(); y = 15; }
              }
              doc.addImage(imgData.dataUrl, imgData.format, imgX, y, 42, 30);
              imgX += 46;
            } catch (err) {
              console.warn('Não foi possível renderizar imagem da vistoria no PDF:', err);
            }
          }
        }
        if (imgX > 22) y += 34;
      } else if (v.pdfDataUrl) {
        y = await renderAttachmentIntoPdf(doc, v.pdfDataUrl, `Laudo PDF Vistoria #${index + 1}`, y, { fileType: 'pdf' });
      }
      y += 4;
    }
  }

  // Section 7: Documentos e Anexos
  if (y > 240) { doc.addPage(); y = 15; }
  const docs = vehicle.documents || [];
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`7. DOCUMENTOS E ANEXOS DO CONTRATO E VEÍCULO (${docs.length})`, 18, y + 5);

  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  if (docs.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum documento anexado ao contrato/veículo.', 18, y);
    y += 8;
  } else {
    for (const d of docs) {
      if (y > 255) { doc.addPage(); y = 15; }
      doc.setFont('helvetica', 'bold');
      doc.text(`• [${d.category || 'Geral'}] ${d.name}`, 18, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Enviado em: ${d.uploadDate || 'S/D'}${d.fileSize ? ` • ${d.fileSize}` : ''}`, 22, y);
      doc.setFontSize(9);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      y += 5;

      if (d.contentUrl) {
        y = await renderAttachmentIntoPdf(
          doc,
          d.contentUrl,
          `Anexo: [${d.category || 'Geral'}] ${d.name}`,
          y,
          { fileType: d.fileType, fileName: d.name }
        );
      }
    }
  }
}

/**
 * 1º MOMENTO: Termo de Encerramento de Contrato (Devolução / Pré-Finalização — Aguardando 30 Dias)
 */
export async function generateTermoEncerramentoPDF(
  vehicle: Vehicle,
  settlement: CaucaoSettlementData,
  options?: {
    returnDate?: string;
    dueDate30Days?: string;
  }
): Promise<{ doc: jsPDF; fileName: string; pdfDataUrl: string }> {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const now = new Date();
  const formattedNow = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const cleanPlate = (vehicle.plate || 'VEICULO').replace(/[^a-zA-Z0-9]/g, '');
  const returnIso = options?.returnDate || settlement.returnDate || now.toISOString().split('T')[0];
  const fileName = `Termo_Encerramento_${cleanPlate}_${returnIso}.pdf`;

  const dueIso =
    options?.dueDate30Days ||
    (() => {
      const d = new Date(`${returnIso}T12:00:00`);
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })();

  const primaryColor = [30, 41, 59];
  const amberAccent = [180, 83, 9];
  const textColor = [51, 65, 85];

  // Top Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 31, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 31, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TERMO DE ENCERRAMENTO DE CONTRATO DE LOCAÇÃO', 14, 12);

  doc.setFontSize(9.5);
  doc.setTextColor(253, 230, 138);
  doc.text('1ª ETAPA: DEVOLUÇÃO DO VEÍCULO & PRÉVIA DETALHADA A PAGAR / RECEBER (PRAZO 30 DIAS)', 14, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Emitido em: ${formattedNow} | Contrato nº: ${vehicle.contractNumber || 'LOC-' + cleanPlate}`, 14, 26);

  let y = 40;

  // Section 1: Partes & Veículo
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. IDENTIFICAÇÃO DO VEÍCULO, LOCATÁRIO E DEVOLUÇÃO', 17, y + 4.8);
  y += 11;

  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const infoRows: [string, string][] = [
    ['Locatário / Motorista:', vehicle.driver || 'Não informado'],
    ['CPF / CNPJ:', vehicle.tenantCpfCnpj || 'Não informado'],
    ['CNH:', vehicle.tenantCnh || 'Não informada'],
    ['Telefone:', vehicle.driverPhone || 'Não informado'],
    ['Veículo:', `${vehicle.brand} ${vehicle.model} (${vehicle.color || 'Padrão'})`],
    ['Placa:', vehicle.plate || '---'],
    ['Data Início Locação:', formatDateBrSafe(vehicle.startDate)],
    ['Data Real da Devolução:', formatDateBrSafe(returnIso)],
    ['KM na Devolução:', `${(vehicle.currentKm || 0).toLocaleString('pt-BR')} km`],
    ['Prazo de Quitação (30d):', formatDateBrSafe(dueIso)]
  ];

  infoRows.forEach(([lbl, val], idx) => {
    const col = idx % 2;
    const xPos = col === 0 ? 16 : 108;
    doc.setFont('helvetica', 'bold');
    doc.text(lbl, xPos, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val).slice(0, 38), xPos + doc.getTextWidth(lbl) + 2, y);
    if (col === 1 || idx === infoRows.length - 1) y += 5.5;
  });

  if (vehicle.tenantAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('Endereço do Locatário:', 16, y);
    doc.setFont('helvetica', 'normal');
    const addr = doc.splitTextToSize(vehicle.tenantAddress, 138);
    doc.text(addr, 55, y);
    y += addr.length * 4.5 + 2;
  }

  y += 3;

  // Section 2: Memória dos Aluguéis (se disponível)
  if (vehicle.startDate || settlement.expectedTotal !== undefined) {
    doc.setFillColor(239, 246, 255);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. MEMÓRIA DE CÁLCULO DA LOCAÇÃO (DIÁRIAS E SEMANAIS)', 17, y + 4.8);
    y += 11;

    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const daysTxt = `${settlement.daysUsed ?? 0} dia(s) rodado(s)${settlement.missingDays && settlement.missingDays > 0 ? ` + ${settlement.missingDays}d p/ mínimo 30d (multa ${settlement.earlyFineRatePct ?? 20}%)` : ''}`;
    doc.setFont('helvetica', 'bold');
    doc.text('Período Apurado:', 16, y);
    doc.setFont('helvetica', 'normal');
    doc.text(daysTxt, 48, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Valor Semanal / Diária:', 16, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatMoneyBr(settlement.weeklyRate || 0)}/sem (${formatMoneyBr(settlement.dailyRate || 0)}/dia)`, 56, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Total Devido do Período:', 16, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatMoneyBr(settlement.expectedTotal || 0), 58, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Total Já Pago:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatMoneyBr(settlement.totalPaid || 0), 135, y);
    y += 8;
  }

  // Section 3: Prévia Detalhada — A Pagar e a Receber
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. PRÉVIA DETALHADA DE VALORES A RECEBER E A PAGAR (ACERTO DA CAUÇÃO)', 17, y + 4.8);
  y += 10;

  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESCRIÇÃO DO LANÇAMENTO', 17, y + 4.5);
  doc.text('NATUREZA', 122, y + 4.5);
  doc.text('VALOR (R$)', 192, y + 4.5, { align: 'right' });
  y += 6.5;

  const totalDescontos =
    (settlement.descontoAluguelPendente || 0) +
    (settlement.descontoAvarias || 0) +
    (settlement.descontoLavagem || 0) +
    (settlement.descontoCombustivel || 0) +
    (settlement.descontoMultas || 0) +
    (settlement.descontoPedagios || 0);

  const tableRows: Array<{ desc: string; nature: string; val: string; isCredit?: boolean; isZero?: boolean }> = [
    { desc: '(+) Caução Depositada em Garantia', nature: 'Crédito Locatário', val: `+ ${formatMoneyBr(settlement.caucaoOriginal)}`, isCredit: true },
    { desc: '(-) Aluguéis / Dias Proporcionais / Rescisão em Aberto', nature: 'Débito / A Receber', val: `- ${formatMoneyBr(settlement.descontoAluguelPendente)}`, isZero: settlement.descontoAluguelPendente <= 0 },
    { desc: '(-) Avarias, Peças e Orçamentos de Oficina Apurados', nature: 'Débito / A Receber', val: `- ${formatMoneyBr(settlement.descontoAvarias)}`, isZero: settlement.descontoAvarias <= 0 },
    { desc: '(-) Lavagem e Higienização do Veículo', nature: 'Débito / A Receber', val: `- ${formatMoneyBr(settlement.descontoLavagem || 0)}`, isZero: (settlement.descontoLavagem || 0) <= 0 },
    { desc: '(-) Diferença de Nível de Combustível na Devolução', nature: 'Débito / A Receber', val: `- ${formatMoneyBr(settlement.descontoCombustivel)}`, isZero: settlement.descontoCombustivel <= 0 },
    { desc: '(-) Multas de Trânsito Apuradas até a Data (+ Taxa Adm.)', nature: 'Débito / A Receber', val: `- ${formatMoneyBr(settlement.descontoMultas)}`, isZero: settlement.descontoMultas <= 0 },
    { desc: '(-) Pedágios / Tag / Estacionamentos', nature: 'Débito / A Receber', val: `- ${formatMoneyBr(settlement.descontoPedagios || 0)}`, isZero: (settlement.descontoPedagios || 0) <= 0 },
  ];

  tableRows.forEach((row, idx) => {
    if (y > 265) { doc.addPage(); y = 15; }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 6, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 6, 196, y + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', row.isCredit ? 'bold' : 'normal');
    doc.setTextColor(row.isCredit ? 5 : row.isZero ? 148 : 51, row.isCredit ? 150 : row.isZero ? 163 : 65, row.isCredit ? 105 : row.isZero ? 184 : 85);
    doc.text(row.desc, 17, y + 4.2);
    doc.text(row.nature, 122, y + 4.2);
    doc.setFont('helvetica', 'bold');
    doc.text(row.val, 192, y + 4.2, { align: 'right' });
    y += 6;
  });

  // Subtotal discounts row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6.5, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TOTAL DE DÉBITOS APURADOS NA DEVOLUÇÃO:', 17, y + 4.5);
  doc.text(`- ${formatMoneyBr(totalDescontos)}`, 192, y + 4.5, { align: 'right' });
  y += 9;

  // Highlighted Prev Saldo Box
  const isRefund = settlement.saldoFinal >= 0;
  doc.setFillColor(isRefund ? 236 : 255, isRefund ? 253 : 241, isRefund ? 245 : 242);
  doc.setDrawColor(isRefund ? 16 : 225, isRefund ? 185 : 29, isRefund ? 129 : 72);
  doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');

  doc.setTextColor(isRefund ? 6 : 159, isRefund ? 95 : 18, isRefund ? 70 : 57);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    isRefund
      ? 'PRÉVIA: SALDO PREVISTO A DEVOLVER AO LOCATÁRIO (APÓS PRAZO DE 30 DIAS):'
      : 'PRÉVIA: SALDO DEVEDOR A PAGAR PELO LOCATÁRIO:',
    18,
    y + 6.5
  );
  doc.setFontSize(12);
  doc.text(formatMoneyBr(Math.abs(settlement.saldoFinal)), 18, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Sujeito a confirmação/abatimento de novas multas e avarias nos próximos 30 dias.', 192, y + 13, { align: 'right' });
  y += 20;

  if (settlement.observacoesAcerto?.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Observações Registradas na Devolução:', 14, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    const obsLines = doc.splitTextToSize(settlement.observacoesAcerto.trim(), 182);
    doc.text(obsLines, 14, y);
    y += obsLines.length * 4.5 + 3;
  }

  // Pending fines listed on vehicle if any
  const pendingFines = (vehicle.fines || []).filter(
    (f) => f.status !== 'Paga pelo Locatário' && f.status !== 'Paga pela Locadora'
  );
  if (pendingFines.length > 0) {
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(amberAccent[0], amberAccent[1], amberAccent[2]);
    doc.text(`Multas Constantes até a Data (${pendingFines.length}):`, 14, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    pendingFines.forEach((f) => {
      if (y > 268) { doc.addPage(); y = 15; }
      doc.text(`• ${f.dataHora} - ${f.descricao} (${formatMoneyBr(getFineTotal(f))})`, 16, y);
      y += 4.2;
    });
    y += 3;
  }

  // Section 4: Cláusula 30 dias
  if (y > 215) { doc.addPage(); y = 15; }
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(245, 158, 11);
  const clauseText = `As partes declaram que o veículo acima identificado foi devidamente devolvido ao LOCADOR em ${formatDateBrSafe(returnIso)}, cessando a partir desta data a cobrança de novas diárias de locação e liberando o veículo para operação pela frota. Conforme previsto contratualmente, fica estabelecido o prazo de 30 (trinta) dias corridos a contar da devolução (com previsão de encerramento definitivo em ${formatDateBrSafe(dueIso)}) para apuração de eventuais autos de infração de trânsito (DETRAN/RENAINF), passagens em pedágios eletrônicos e conclusão de orçamentos de reparo referentes ao período em que o veículo esteve sob posse do LOCATÁRIO. Decorrido o prazo de 30 dias e deduzidos eventuais novos débitos comprovados, será emitido o Termo de Encerramento e Quitação de Débitos com a liquidação definitiva do saldo da caução.`;
  const clauseLines = doc.splitTextToSize(clauseText, 174);
  const boxH = 12 + clauseLines.length * 4.2;
  doc.roundedRect(14, y, 182, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(146, 64, 14);
  doc.text('4. CLÁUSULA DE PRAZO DE 30 DIAS PARA QUITAÇÃO E DEVOLUÇÃO DA CAUÇÃO', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text(clauseLines, 18, y + 11.5);
  y += boxH + 10;

  if (y > 245) { doc.addPage(); y = 20; }
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`São Paulo, ${formatDateBrSafe(returnIso)}.`, 14, y);
  y += 16;

  doc.setDrawColor(148, 163, 184);
  doc.line(18, y, 92, y);
  doc.line(118, y, 192, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('LOCADOR / GESTOR DA FROTA', 55, y + 4.5, { align: 'center' });
  doc.text(`LOCATÁRIO: ${(vehicle.driver || 'MOTORISTA').toUpperCase().slice(0, 30)}`, 155, y + 4.5, { align: 'center' });

  const pdfDataUrl = doc.output('datauristring');
  return { doc, fileName, pdfDataUrl };
}

/**
 * 2º MOMENTO: Termo de Encerramento e Quitação de Débitos (Após 30 Dias ou Finalização Definitiva)
 */
export async function generateTermoQuitacaoPDF(
  vehicle: Vehicle,
  maintenanceLogs: MaintenanceLog[],
  expenseLogs: ExpenseLog[],
  vistorias: Vistoria[],
  fuelLogs: FuelLog[],
  options?: {
    settlement?: CaucaoSettlementData;
    initialSettlement?: CaucaoSettlementData;
    lateDebits?: LateContractDebit[];
    sinistroLogs?: SinistroLog[];
    returnDate?: string;
    dueDate30Days?: string;
    quitationDate?: string;
  }
): Promise<{ doc: jsPDF; fileName: string; pdfDataUrl: string }> {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const now = new Date();
  const formattedNow = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const todayIsoLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const printDownloadIso = todayIsoLocal;
  const quitationIso = options?.quitationDate || todayIsoLocal;
  const contractFinalizationIso = options?.returnDate || options?.settlement?.returnDate || vehicle.endDate || quitationIso;
  const cleanPlate = (vehicle.plate || 'VEICULO').replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `Termo_Quitacao_Debitos_${cleanPlate}_${printDownloadIso}.pdf`;

  const primaryColor = [15, 23, 42];
  const emeraldDark = [6, 95, 70];
  const textColor = [51, 65, 85];

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 31, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 31, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TERMO DE ENCERRAMENTO E QUITAÇÃO DE DÉBITOS', 14, 12);

  doc.setFontSize(9.5);
  doc.setTextColor(167, 243, 208);
  doc.text('2ª ETAPA: CONSOLIDAÇÃO DEFINITIVA PÓS-DEVOLUÇÃO (MULTAS, AVARIAS E CAUÇÃO)', 14, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Emitido em: ${formattedNow} | Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`, 14, 26);

  let y = 40;

  // Section 1: Partes & Prazos
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. DADOS DAS PARTES, CONTRATO E PRAZO DE APURAÇÃO', 17, y + 4.8);
  y += 11;

  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const headerRows: [string, string][] = [
    ['Locatário / Motorista:', vehicle.driver || 'Não informado'],
    ['CPF / CNPJ:', vehicle.tenantCpfCnpj || 'Não informado'],
    ['CNH:', vehicle.tenantCnh || 'Não informada'],
    ['Telefone:', vehicle.driverPhone || 'Não informado'],
    ['Veículo / Placa:', `${vehicle.brand} ${vehicle.model} — ${vehicle.plate}`],
    ['Contrato nº:', vehicle.contractNumber || `LOC-${cleanPlate}`],
    ['Início da Locação:', formatDateBrSafe(vehicle.startDate)],
    ['Finalização do Contrato:', formatDateBrSafe(contractFinalizationIso)],
    ['Previsão 30 Dias:', formatDateBrSafe(options?.dueDate30Days)],
    ['Data da Quitação Final:', formatDateBrSafe(quitationIso)]
  ];

  headerRows.forEach(([lbl, val], idx) => {
    const col = idx % 2;
    const xPos = col === 0 ? 16 : 108;
    doc.setFont('helvetica', 'bold');
    doc.text(lbl, xPos, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val).slice(0, 38), xPos + doc.getTextWidth(lbl) + 2, y);
    if (col === 1 || idx === headerRows.length - 1) y += 5.5;
  });

  y += 4;

  // Consolidated settlement math
  const finalSet = options?.settlement;
  const initSet = options?.initialSettlement || finalSet;
  const lateDebits = options?.lateDebits || [];
  const lateDebitsTotal = lateDebits.reduce((sum, d) => sum + (d.amount || 0), 0);

  if (finalSet) {
    // Quadro 2: Valores Iniciais na Devolução
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('2. APURAÇÃO NA DEVOLUÇÃO + NOVOS LANÇAMENTOS DOS 30 DIAS', 17, y + 4.8);
    y += 10;

    const initDiscounts = initSet
      ? (initSet.descontoAluguelPendente || 0) +
        (initSet.descontoAvarias || 0) +
        (initSet.descontoLavagem || 0) +
        (initSet.descontoCombustivel || 0) +
        (initSet.descontoMultas || 0) +
        (initSet.descontoPedagios || 0)
      : 0;

    const consolidatedRows: Array<[string, string, boolean?]> = [
      ['(+) Caução Depositada pelo Locatário:', `+ ${formatMoneyBr(finalSet.caucaoOriginal)}`, true],
      ['(-) Aluguéis / Dias Proporcionais / Rescisão:', `- ${formatMoneyBr(finalSet.descontoAluguelPendente)}`],
      ['(-) Avarias e Reparos (Total Consolidado):', `- ${formatMoneyBr(finalSet.descontoAvarias)}`],
      ['(-) Lavagem / Higienização:', `- ${formatMoneyBr(finalSet.descontoLavagem || 0)}`],
      ['(-) Diferença de Combustível:', `- ${formatMoneyBr(finalSet.descontoCombustivel)}`],
      ['(-) Multas de Trânsito + Taxas Adm. (Total Consolidado):', `- ${formatMoneyBr(finalSet.descontoMultas)}`],
      ['(-) Pedágios / Tag / Outros Débitos:', `- ${formatMoneyBr(finalSet.descontoPedagios || 0)}`],
    ];

    consolidatedRows.forEach(([lbl, val, isCredit], idx) => {
      if (y > 265) { doc.addPage(); y = 15; }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 5.8, 'F');
      }
      doc.setFontSize(8.5);
      doc.setFont('helvetica', isCredit ? 'bold' : 'normal');
      doc.setTextColor(isCredit ? 5 : 51, isCredit ? 150 : 65, isCredit ? 105 : 85);
      doc.text(lbl, 17, y + 4.1);
      doc.setFont('helvetica', 'bold');
      doc.text(val, 192, y + 4.1, { align: 'right' });
      y += 5.8;
    });

    y += 4;

    // Quadro específico de lançamentos recebidos durante os 30 dias
    doc.setFillColor(254, 243, 199);
    doc.rect(14, y, 182, 6.5, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`LANÇAMENTOS APURADOS DURANTE O PRAZO DE 30 DIAS (${lateDebits.length} registro(s))`, 17, y + 4.5);
    y += 8.5;

    if (lateDebits.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('• Nenhum novo débito de multa, avaria ou pedágio foi registrado no período de 30 dias após a devolução.', 17, y);
      y += 7;
    } else {
      for (const item of lateDebits) {
        if (y > 260) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text(
          `• ${formatDateBrSafe(item.date)} [${item.category}] ${item.description}`,
          17,
          y
        );
        doc.text(`- ${formatMoneyBr(item.amount)}`, 192, y, { align: 'right' });
        y += 4.5;
        if (item.notes || item.adminFeeAmount) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.8);
          doc.setTextColor(100, 116, 139);
          const extra = [
            item.adminFeeAmount ? `Inclui taxa adm (${item.adminFeePct ?? 20}%): ${formatMoneyBr(item.adminFeeAmount)}` : '',
            item.notes || ''
          ].filter(Boolean).join(' • ');
          doc.text(`  ${extra}`, 19, y);
          y += 4.2;
        }
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Subtotal de Lançamentos dos 30 Dias: - ${formatMoneyBr(lateDebitsTotal)} (Débitos iniciais na devolução: - ${formatMoneyBr(initDiscounts)})`,
        17,
        y + 1
      );
      y += 7;
    }

    // Final Balance Highlight Box
    if (y > 240) { doc.addPage(); y = 15; }
    const isFinalRefund = finalSet.saldoFinal >= 0;
    doc.setFillColor(isFinalRefund ? 236 : 255, isFinalRefund ? 253 : 241, isFinalRefund ? 245 : 242);
    doc.setDrawColor(isFinalRefund ? 5 : 225, isFinalRefund ? 150 : 29, isFinalRefund ? 105 : 72);
    doc.roundedRect(14, y, 182, 16, 2, 2, 'FD');

    doc.setTextColor(isFinalRefund ? emeraldDark[0] : 159, isFinalRefund ? emeraldDark[1] : 18, isFinalRefund ? emeraldDark[2] : 57);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(
      isFinalRefund
        ? 'VALOR DEFINITIVO A DEVOLVER AO LOCATÁRIO (QUITAÇÃO DE CAUÇÃO):'
        : 'SALDO DEVEDOR DEFINITIVO A QUITAR PELO LOCATÁRIO:',
      18,
      y + 6.5
    );
    doc.setFontSize(12.5);
    doc.text(formatMoneyBr(Math.abs(finalSet.saldoFinal)), 18, y + 13.2);
    y += 20;

    if (finalSet.observacoesAcerto?.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Observações Finais do Acerto:', 14, y);
      y += 4.5;
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(finalSet.observacoesAcerto.trim(), 182);
      doc.text(obsLines, 14, y);
      y += obsLines.length * 4.5 + 4;
    }
  }

  // Declaração de Quitação de Débitos
  if (y > 220) { doc.addPage(); y = 15; }
  const quitationText = finalSet
    ? finalSet.saldoFinal >= 0
      ? `Pelo presente TERMO DE ENCERRAMENTO E QUITAÇÃO DE DÉBITOS, declara-se encerrado em definitivo o contrato de locação do veículo ${vehicle.brand} ${vehicle.model} (placa ${vehicle.plate}), com finalização do contrato em ${formatDateBrSafe(contractFinalizationIso)}. Apurados todos os aluguéis, eventuais avarias, multas de trânsito e pedágios no prazo regulamentar, resta consolidado o saldo final de ${formatMoneyBr(finalSet.saldoFinal)} a ser restituído ao LOCATÁRIO, conferindo plena e irrevogável quitação dos valores acima discriminados com a efetivação do respectivo pagamento, dispensada a necessidade de assinatura do LOCATÁRIO neste termo.`
      : `Pelo presente TERMO DE ENCERRAMENTO E QUITAÇÃO DE DÉBITOS, declara-se encerrado o contrato de locação do veículo ${vehicle.brand} ${vehicle.model} (placa ${vehicle.plate}), com finalização do contrato em ${formatDateBrSafe(contractFinalizationIso)}. Após compensação integral da caução inicialmente depositada frente aos débitos apurados na devolução e no prazo de 30 dias, permanece apurado o saldo devedor remanescente de ${formatMoneyBr(Math.abs(finalSet.saldoFinal))} em favor do LOCADOR, obrigando-se o LOCATÁRIO à sua liquidação integral, dispensada a necessidade de assinatura do LOCATÁRIO neste termo.`
    : `Pelo presente TERMO DE ENCERRAMENTO E QUITAÇÃO DE DÉBITOS, formaliza-se o encerramento definitivo do contrato de locação do veículo ${vehicle.brand} ${vehicle.model} (placa ${vehicle.plate}), com finalização do contrato em ${formatDateBrSafe(contractFinalizationIso)}, e o arquivamento integral do histórico e anexos da locação, dispensada a necessidade de assinatura do LOCATÁRIO neste termo.`;

  const qLines = doc.splitTextToSize(quitationText, 174);
  const qBoxH = 12 + qLines.length * 4.2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(14, y, 182, qBoxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. DECLARAÇÃO DE ENCERRAMENTO E QUITAÇÃO DE DÉBITOS', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text(qLines, 18, y + 11.5);
  y += qBoxH + 10;

  if (y > 245) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`São Paulo, ${formatDateBrSafe(printDownloadIso)}.`, 105, y, { align: 'center' });
  y += 16;
  doc.setDrawColor(148, 163, 184);
  doc.line(58, y, 152, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('LOCADOR / GESTOR DA FROTA', 105, y + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Dispensada a assinatura do locatário.', 105, y + 9, { align: 'center' });

  // Render attachments from lateDebits (multas / orçamentos chegados nos 30 dias)
  const lateWithAttachments = lateDebits.filter((d) => Boolean(d.attachmentUrl));
  if (lateWithAttachments.length > 0) {
    doc.addPage();
    y = 16;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 7, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`COMPROVANTES E NOTIFICAÇÕES APURADOS NOS 30 DIAS (${lateWithAttachments.length})`, 17, y + 4.8);
    y += 12;

    for (const item of lateWithAttachments) {
      if (item.attachmentUrl) {
        y = await renderAttachmentIntoPdf(
          doc,
          item.attachmentUrl,
          `${formatDateBrSafe(item.date)} • [${item.category}] ${item.description} (${formatMoneyBr(item.amount)})`,
          y,
          { fileType: item.attachmentType, fileName: item.attachmentName }
        );
      }
    }
  }

  // Append Full Historical Dossier (veículo, motorista, pagamentos, manutenções, multas, vistorias e documentos)
  doc.addPage();
  await appendVehicleDossierSections(doc, vehicle, maintenanceLogs, expenseLogs, vistorias, options);

  const pdfDataUrl = doc.output('datauristring');
  return { doc, fileName, pdfDataUrl };
}
export async function generateVistoriaPDF(
  vehicle: Vehicle,
  vistoria: Vistoria
): Promise<{ doc: jsPDF; fileName: string; pdfDataUrl: string }> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const formattedNow = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fileName = `Vistoria_${vehicle.plate.replace(/[^a-zA-Z0-9]/g, '')}_${now.toISOString().split('T')[0]}.pdf`;

  const primaryColor = [30, 41, 59];
  const textColor = [51, 65, 85];
  let y = 15;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const cleanType = vistoria.type?.toLowerCase().includes('devolu')
    ? 'DEVOLUÇÃO'
    : vistoria.type?.toLowerCase().includes('entrega')
    ? 'ENTREGA'
    : 'PERIÓDICA';
  doc.text(`LAUDO DE VISTORIA • ${cleanType}`, 14, 12);
  doc.setFontSize(9);
  const kmToDisplay = vistoria.km
    ? `${vistoria.km.toLocaleString('pt-BR')} KM`
    : (vehicle.currentKm ? `${vehicle.currentKm.toLocaleString('pt-BR')} KM` : null);

  const headerInfo = kmToDisplay
    ? `Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate}) | Odômetro: ${kmToDisplay} | Data: ${formattedNow}`
    : `Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate}) | Data: ${formattedNow}`;
  doc.text(headerInfo, 14, 20);

  if (vistoria.status === 'approved') {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(145, 7, 51, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('VISTORIA APROVADA', 170.5, 12.2, { align: 'center' });
  }

  y = 36;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  if (vistoria.checklist) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CHECKLIST DE INSPEÇÃO', 14, y);
    y += 8;
    
    const items = Object.entries(vistoria.checklist);
    items.forEach(([itemKey, isOk], idx) => {
      if (y > 270) { doc.addPage(); y = 15; }
      const col = idx % 2;
      const xPos = col === 0 ? 14 : 110;
      const isTracker = itemKey.toLowerCase().includes('rastreador');
      const statusText = isTracker 
        ? (isOk ? '[SIM]' : '[NÃO]') 
        : (isOk ? '[OK]' : '[PENDENTE]');
      doc.setFont('helvetica', isOk ? 'normal' : 'bold');
      if (!isOk) doc.setTextColor(225, 29, 72);
      doc.text(`${statusText} ${itemKey}`, xPos, y);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      if (col === 1 || idx === items.length - 1) {
        y += 6;
      }
    });
    y += 4;
  }

  if (vistoria.notes) {
    if (y > 270) { doc.addPage(); y = 15; }
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES:', 14, y);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(vistoria.notes, 180);
    y += 6;
    doc.text(splitNotes, 14, y);
    y += splitNotes.length * 5 + 4;
  }

  if (vistoria.photos && vistoria.photos.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFont('helvetica', 'bold');
    doc.text(`FOTOS ANEXADAS (${vistoria.photos.length}):`, 14, y);
    y += 8;

    let imgX = 14;
    for (const photoUrl of vistoria.photos) {
      if (!photoUrl) continue;
      const imgData = await urlToDataUrl(photoUrl);
      if (imgData) {
        try {
          if (imgX + 85 > 200) {
            imgX = 14;
            y += 65;
            if (y > 230) { doc.addPage(); y = 15; }
          }
          doc.addImage(imgData.dataUrl, imgData.format, imgX, y, 85, 60);
          imgX += 90;
        } catch (err) {
          console.warn('Não foi possível renderizar imagem da vistoria no PDF:', err);
        }
      }
    }
  }

  const pdfDataUrl = doc.output('datauristring');
  return { doc, fileName, pdfDataUrl };
}

export interface RentalContractData {
  contractNumber: string;
  tenantName: string;
  tenantCpfCnpj: string;
  tenantRg?: string;
  tenantCnh?: string;
  tenantPhone: string;
  tenantEmail?: string;
  tenantAddress: string;
  landlordName: string;
  landlordCpfCnpj: string;
  landlordRg?: string;
  landlordPhone: string;
  landlordAddress: string;
  pixKey?: string;
  startDate: string;
  endDate?: string;
  rentalValue: number;
  paymentPeriod: string;
  dueDay?: string;
  caucaoValue: number;
  kmLimit?: string;
  workshopName?: string;
  insuranceCompany?: string;
  insurancePhones?: string;
  customClauses?: string;
  fineRate?: number;
  interestRate?: number;
  hideLandlordPersonalData?: boolean;
}

export function valorPorExtensoReais(valor: number): string {
  const rounded = Math.round(valor);
  if (rounded === 960) return 'novecentos e sessenta reais';
  if (rounded === 1920) return 'mil novecentos e vinte reais';
  if (rounded === 1000) return 'mil reais';
  if (rounded === 800) return 'oitocentos reais';
  if (rounded === 850) return 'oitocentos e cinquenta reais';
  if (rounded === 900) return 'novecentos reais';
  if (rounded === 950) return 'novecentos e cinquenta reais';
  if (rounded === 1100) return 'mil e cem reais';
  if (rounded === 1200) return 'mil e duzentos reais';
  if (rounded === 1500) return 'mil e quinhentos reais';
  if (rounded === 2000) return 'dois mil reais';
  if (rounded === 2500) return 'dois mil e quinhentos reais';
  if (rounded === 3000) return 'três mil reais';

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const converterCentena = (n: number): string => {
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    const partes: string[] = [];
    if (c > 0) partes.push(centenas[c]);
    if (d === 1) {
      partes.push(especiais[u]);
    } else {
      if (d > 1) partes.push(dezenas[d]);
      if (u > 0) partes.push(unidades[u]);
    }
    return partes.join(' e ');
  };

  if (rounded < 1000) {
    const texto = converterCentena(rounded);
    return `${texto} ${rounded === 1 ? 'real' : 'reais'}`;
  }

  const milhares = Math.floor(rounded / 1000);
  const resto = rounded % 1000;
  const milTexto = milhares === 1 ? 'mil' : `${converterCentena(milhares)} mil`;
  if (resto > 0) {
    const restoTexto = converterCentena(resto);
    return `${milTexto} e ${restoTexto} reais`;
  }
  return `${milTexto} reais`;
}

export async function generateRentalContractPDF(
  vehicle: Vehicle,
  contract: RentalContractData
): Promise<{ doc: jsPDF; fileName: string; pdfDataUrl: string }> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const cleanPlate = contract.hideLandlordPersonalData
    ? 'EM_BRANCO'
    : (vehicle.plate ? vehicle.plate.replace(/[^a-zA-Z0-9]/g, '') : 'VEICULO');
  const fileName = `Contrato_Locacao_${cleanPlate}_${now.toISOString().split('T')[0]}.pdf`;

  const primaryColor = [15, 23, 42]; // Slate-900
  const textColor = [30, 41, 59];    // Slate-800
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 275) {
      doc.addPage();
      y = 16;
    }
  };

  // Main Document Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, y, 182, 11, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    contract.hideLandlordPersonalData
      ? 'CONTRATO DE LOCAÇÃO DE VEÍCULO AUTOMOTOR (MINUTA PARA LEITURA PRÉVIA)'
      : 'CONTRATO DE LOCAÇÃO DE VEÍCULO AUTOMOTOR PARA TRANSPORTE PRIVADO DE PASSAGEIROS POR APLICATIVO',
    105,
    y + 7,
    { align: 'center' }
  );

  y += 15;

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Contrato nº ${contract.hideLandlordPersonalData ? 'MINUTA / EM BRANCO' : contract.contractNumber} | Emissão: ${dateFormatted}`,
    14,
    y
  );
  y += 5.5;

  const addSectionTitle = (title: string) => {
    checkPageBreak(12);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 5.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 5.5, 'S');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(title, 17, y + 4.0);
    y += 8.0;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(8.0);
    doc.setFont('helvetica', 'normal');
  };

  const addClause = (label: string, text: string) => {
    const fullText = label ? `${label}: ${text}` : text;
    const lines = doc.splitTextToSize(fullText, 182);
    checkPageBreak(lines.length * 3.8 + 2.5);

    lines.forEach((line: string, index: number) => {
      if (index === 0 && line.includes(':')) {
        const colonIdx = line.indexOf(':');
        const prefix = line.substring(0, colonIdx + 1);
        const rest = line.substring(colonIdx + 1);
        doc.setFont('helvetica', 'bold');
        doc.text(prefix, 14, y);
        const prefixWidth = doc.getTextWidth(prefix + ' ');
        doc.setFont('helvetica', 'normal');
        doc.text(rest.trimStart(), 14 + prefixWidth, y);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text(line, 14, y);
      }
      y += 3.8;
    });
    y += 1.4;
  };

  const savedClauses = getSavedContractClauses();
  const clauseMap = new Map(savedClauses.map(c => [c.id, c]));
  const customFullText = getFullContractTextTemplate();
  const hasCustomFullText = Boolean(customFullText && customFullText.trim().length > 0);
  const customIncludesParties = hasCustomFullText && /1\.\s*DAS\s+PARTES/i.test(customFullText!);

  // 1. DAS PARTES (omitido se o modelo personalizado já traz 1. DAS PARTES com dados completos)
  if (!customIncludesParties || contract.hideLandlordPersonalData) {
    addSectionTitle('1. DAS PARTES');
    if (contract.hideLandlordPersonalData) {
      addClause(
        '• LOCADOR',
        '(Dados cadastrais e pessoais do Locador omitidos nesta minuta prévia para leitura — constarão devidamente preenchidos na via definitiva para assinatura).'
      );
      addClause(
        '• LOCATÁRIO',
        '[Nome Completo], portador(a) da CNH nº [Número da CNH] com EAR (atividade remunerada), CPF nº [Número do CPF], RG nº [Número do RG], residente e domiciliado(a) à [Endereço Completo]. Telefone: [Número de Telefone].'
      );
    } else {
      addClause(
        '• LOCADOR',
        `${contract.landlordName || 'Cláudio Oliveira da Silva'}, portador do CPF nº ${contract.landlordCpfCnpj || '065.426.576-30'} e RG nº ${contract.landlordRg || '39.508.321-7'}, residente e domiciliado à ${contract.landlordAddress || 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP 03735-180'}.`
      );
      addClause(
        '• LOCATÁRIO',
        `${contract.tenantName || '[Nome Completo]'}, portador(a) da CNH nº ${contract.tenantCnh || '[Número da CNH]'} com EAR (atividade remunerada), CPF nº ${contract.tenantCpfCnpj || '[Número do CPF]'}, RG nº ${contract.tenantRg || '[Número do RG]'}, residente e domiciliado(a) à ${contract.tenantAddress || '[Endereço Completo]'}. Telefone: ${contract.tenantPhone || '[Número de Telefone]'}${contract.tenantEmail ? `, E-mail: ${contract.tenantEmail}` : ''}.`
      );
    }
  }

  // Load configured clauses and prepare variable substitution
  const kmDisplay = contract.hideLandlordPersonalData
    ? '*****'
    : (vehicle.initialKm || vehicle.currentKm || 0).toLocaleString('pt-BR');
  const yearDisplay = vehicle.yearFab && vehicle.yearModel
    ? `${vehicle.yearFab}/${vehicle.yearModel}`
    : `${vehicle.year}`;

  const rentNumber = Number(contract.rentalValue) > 0 ? Number(contract.rentalValue) : 960;
  const rentVal = rentNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const rentExtenso = valorPorExtensoReais(rentNumber);

  const caucaoNumber = Number(contract.caucaoValue) > 0 ? Number(contract.caucaoValue) : 1920;
  const caucaoVal = caucaoNumber.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const caucaoExtenso = valorPorExtensoReais(caucaoNumber);

  const pix = contract.hideLandlordPersonalData
    ? '(Chave informada no ato da assinatura definitiva)'
    : (contract.pixKey || contract.landlordPhone || '11953292570');

  const startFormatted = contract.startDate
    ? new Date(contract.startDate + 'T12:00:00').toLocaleDateString('pt-BR')
    : (contract.hideLandlordPersonalData ? '[Data de Início]' : dateFormatted);

  const fineRateNum = contract.fineRate !== undefined && contract.fineRate !== null ? contract.fineRate : 10;
  const interestRateNum = contract.interestRate !== undefined && contract.interestRate !== null ? contract.interestRate : 1;
  const fineExtenso = fineRateNum === 10 ? 'dez por cento' : `${fineRateNum}%`;

  const insCompany = contract.insuranceCompany || 'LOOVI SEGUROS';
  const insPhones =
    contract.insurancePhones ||
    'Assistência 24h: 0800 948 4888 | Furto/Roubo: 0800 607 2007 | Central: 4000 1762';

  const variables: Record<string, string> = {
    MARCA_MODELO: `${vehicle.brand} ${vehicle.model}`,
    ANO_MODELO: yearDisplay,
    PLACA: contract.hideLandlordPersonalData ? '*****' : (vehicle.plate || 'BRANCO'),
    COR: vehicle.color || 'Branco',
    KM_INICIAL: kmDisplay,
    DATA_INICIO: startFormatted,
    VALOR_SEMANAL: rentVal,
    VALOR_SEMANAL_EXTENSO: rentExtenso,
    DIA_VENCIMENTO: contract.dueDay || 'toda segunda-feira, com vencimento até às 23h59',
    CHAVE_PIX: pix,
    VALOR_CAUCAO: caucaoVal,
    VALOR_CAUCAO_EXTENSO: caucaoExtenso,
    TAXA_MULTA: String(fineRateNum),
    TAXA_MULTA_EXTENSO: fineExtenso,
    TAXA_JUROS: String(interestRateNum),
    LIMITE_KM: contract.kmLimit || '5.000 km por mês',
    OFICINA_NOME: contract.workshopName ? ` na oficina "${contract.workshopName}"` : '',
    SEGURADORA_NOME: insCompany,
    SEGURADORA_FONES: insPhones,
    LOCADOR_NOME: contract.landlordName || 'Cláudio Oliveira da Silva',
    LOCADOR_CPF: contract.landlordCpfCnpj || '065.426.576-30',
    LOCADOR_RG: contract.landlordRg || '39.508.321-7',
    LOCADOR_ENDERECO: contract.landlordAddress || 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP 03735-180',
    LOCATARIO_NOME: contract.tenantName || '[Nome Completo]',
    LOCATARIO_CNH: contract.tenantCnh || '[Número da CNH]',
    LOCATARIO_CPF: contract.tenantCpfCnpj || '[Número do CPF]',
    LOCATARIO_RG: contract.tenantRg || '[Número do RG]',
    LOCATARIO_ENDERECO: contract.tenantAddress || '[Endereço Completo]',
    LOCATARIO_FONE: contract.tenantPhone || '[Número de Telefone]',
    LOCATARIO_EMAIL: contract.tenantEmail || '',
    DATA_ATUAL: dateFormatted
  };

  const getClause = (id: string, defaultLabel: string, defaultTpl: string) => {
    const c = clauseMap.get(id);
    const label = c?.clauseLabel || defaultLabel;
    const rawTpl = c?.text || defaultTpl;
    const text = replaceClauseVariables(rawTpl, variables);
    return { label, text };
  };

  let hasForoSection = false;
  let hasClosingBoilerplate = false;
  if (hasCustomFullText && customFullText) {
    let textToRender = customFullText;
    if (contract.hideLandlordPersonalData && customIncludesParties) {
      // Remove the personal 1. DAS PARTES block if this is an anonymized preview
      textToRender = textToRender.replace(/1\.\s*DAS\s+PARTES[\s\S]*?(?=\n\s*(?:2\.|As partes acima))/i, '');
    }
    let replacedFullText = replaceClauseVariables(textToRender, variables);
    hasForoSection = /DO\s+FORO/i.test(replacedFullText);
    hasClosingBoilerplate = /E\s+por\s+estarem\s+assim\s+justas/i.test(replacedFullText);

    // Strip trailing plain-text signature block if present so vector signature lines draw cleanly below
    replacedFullText = replacedFullText.replace(/\n*\s*São Paulo\/SP,[\s\S]*?_{5,}[\s\S]*$/i, '').replace(/\n*\s*_{5,}[\s\S]*$/, '');

    const lines = replacedFullText.split(/\r?\n/);
    let currentParagraph = '';

    const flushParagraph = () => {
      if (!currentParagraph) return;
      const cleaned = currentParagraph.trim();
      if (cleaned.startsWith('*') || /^Cláusula\s+\d+/i.test(cleaned) || /^•\s*Parágrafo/i.test(cleaned)) {
        const body = cleaned.replace(/^\*\s*/, '');
        const colonIdx = body.indexOf(':');
        if (colonIdx > 0 && colonIdx < 120) {
          addClause(body.slice(0, colonIdx).trim(), body.slice(colonIdx + 1).trim());
        } else {
          addClause('', body);
        }
      } else {
        addClause('', cleaned);
      }
      currentParagraph = '';
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        continue;
      }
      if (
        line.startsWith('---') ||
        line.startsWith('===') ||
        line.startsWith('CONTRATO DE LOCAÇÃO') ||
        line.startsWith('TRANSPORTE PRIVADO DE PASSAGEIROS') ||
        line === 'APLICATIVO'
      ) {
        continue;
      }
      if (
        (!line.startsWith('*') && !line.startsWith('•') && /^[0-9]+\.\s+[^\n:]{2,90}$/.test(line)) ||
        (!line.startsWith('*') && !line.startsWith('•') && /^[A-ZÀ-ÿ0-9\s/()\-]{4,80}$/.test(line) && !line.includes(':'))
      ) {
        flushParagraph();
        addSectionTitle(line.toUpperCase());
      } else if (line.startsWith('*') || line.startsWith('•')) {
        flushParagraph();
        currentParagraph = line;
      } else {
        currentParagraph = currentParagraph ? `${currentParagraph} ${line}` : line;
      }
    }
    flushParagraph();
  } else {
    const topicGroups = groupClausesByTopic(savedClauses);

    const renderSection = (secTitle: string, secClauses: typeof savedClauses) => {
      const upperTitle = secTitle.toUpperCase();
      if (upperTitle.includes('DO FORO')) {
        hasForoSection = true;
      }
      addSectionTitle(upperTitle);
      secClauses.forEach((c) => {
        const label = `${c.clauseLabel}${c.title ? ` (${c.title})` : ''}`;
        const text = replaceClauseVariables(c.text, variables);
        addClause(label, text);
      });
    };

    topicGroups.forEach(({ topic, clauses: secClauses }) => {
      if (topic.toUpperCase().includes('DO FORO') && contract.customClauses && contract.customClauses.trim().length > 0) {
        addSectionTitle('CONDIÇÕES ESPECÍFICAS ADICIONAIS');
        addClause('', contract.customClauses.trim());
      }
      renderSection(topic, secClauses);
    });

    if (!topicGroups.some((g) => g.topic.toUpperCase().includes('DO FORO')) && contract.customClauses && contract.customClauses.trim().length > 0) {
      addSectionTitle('CONDIÇÕES ESPECÍFICAS ADICIONAIS');
      addClause('', contract.customClauses.trim());
    }
  }

  // DO FORO E DISPOSIÇÕES FINAIS (garantir que sempre conste sem duplicar seção já renderizada)
  if (!hasForoSection) {
    addSectionTitle('13. DO FORO E DISPOSIÇÕES FINAIS');
    const c22 = clauseMap.has('clausula_22_foro')
      ? getClause(
          'clausula_22_foro',
          'Cláusula 22ª (Eleição de Foro)',
          'Para dirimir quaisquer controvérsias ou litígios oriundos do presente contrato, as partes elegem expressamente o Foro da Comarca de São Paulo/SP, renunciando a qualquer outro, por mais privilegiado que seja.'
        )
      : getClause(
          'clausula_21_foro',
          'Cláusula 21ª (Eleição de Foro)',
          'Para dirimir quaisquer controvérsias ou litígios oriundos do presente contrato, as partes elegem expressamente o Foro da Comarca de São Paulo/SP, renunciando a qualquer outro, por mais privilegiado que seja.'
        );
    addClause(c22.label, c22.text);
  }
  if (!hasClosingBoilerplate) {
    addClause(
      '',
      'E por estarem assim justas e contratadas, as partes assinam o presente instrumento em 02 (duas) vias de igual teor e forma para um só efeito legal.'
    );
  }

  // Local, data e assinaturas
  checkPageBreak(40);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`São Paulo/SP, ${startFormatted}.`, 16, y);

  y += 20;

  checkPageBreak(30);

  // Signature lines
  doc.setLineWidth(0.4);
  doc.setDrawColor(100, 116, 139);
  doc.line(18, y, 92, y);
  doc.line(118, y, 192, y);

  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(
    contract.hideLandlordPersonalData ? 'LOCADOR' : (contract.landlordName || 'Cláudio Oliveira da Silva'),
    18,
    y
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    contract.hideLandlordPersonalData ? '(Assinatura na via definitiva)' : '(Locador)',
    18,
    y + 3.8
  );

  doc.setFont('helvetica', 'bold');
  doc.text(
    contract.hideLandlordPersonalData ? 'LOCATÁRIO' : (contract.tenantName || '[Nome Completo]'),
    118,
    y
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    contract.hideLandlordPersonalData ? '(Assinatura na via definitiva)' : '(Locatário)',
    118,
    y + 3.8
  );

  // Add page numbers at the footer of each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    const footerVehicleInfo = contract.hideLandlordPersonalData
      ? `${vehicle.brand} ${vehicle.model}`
      : `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`;
    doc.text(
      `Contrato de Locação - Veículo ${footerVehicleInfo} | Página ${i} de ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const pdfDataUrl = doc.output('datauristring');
  return { doc, fileName, pdfDataUrl };
}


export async function generatePaymentReceiptPDF(
  vehicle: Vehicle,
  payment: { id: string; date: string; amount: number }
): Promise<{ doc: jsPDF; fileName: string; pdfDataUrl: string; whatsappText: string }> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const formattedDate = new Date((payment.date || new Date().toISOString().split('T')[0]) + 'T12:00:00').toLocaleDateString('pt-BR');
  const formattedAmount = (payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const fileName = `Recibo_${vehicle.plate.replace(/[^a-zA-Z0-9]/g, '')}_${payment.date}.pdf`;

  // Header
  doc.setFillColor(16, 185, 129); // Emerald
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('RECIBO DE PAGAMENTO DE LOCAÇÃO SEMANAL', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Comprovante Oficial de Quitação Semanal | Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 14, 24);

  // Box Principal
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 42, 182, 85, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`VALOR RECEBIDO: R$ ${formattedAmount}`, 20, 55);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  const bodyText = `Recebemos de ${vehicle.driver || 'Locatário Responsável'} a importância de R$ ${formattedAmount}, referente ao pagamento semanal da locação do veículo ${vehicle.brand} ${vehicle.model}, placa ${vehicle.plate}, na data de referência ${formattedDate}.`;
  const splitBody = doc.splitTextToSize(bodyText, 170);
  doc.text(splitBody, 20, 67);

  // Dados resumidos
  doc.setFont('helvetica', 'bold');
  doc.text('Dados da Locação:', 20, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.color || 'Cor padrão'})`, 22, 95);
  doc.text(`• Placa: ${vehicle.plate}`, 22, 102);
  doc.text(`• Locatário / Motorista: ${vehicle.driver || 'Não informado'}`, 22, 109);
  doc.text(`• Data do Pagamento: ${formattedDate}   |   Status: QUITADO / APROVADO`, 22, 116);

  // Assinatura
  doc.setDrawColor(100, 116, 139);
  doc.line(65, 155, 145, 155);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('GESTÃO DE FROTA - LOCADOR RESPONSÁVEL', 105, 161, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Quitação confirmada eletronicamente no sistema de Gestão de Frota', 105, 166, { align: 'center' });

  const pdfDataUrl = doc.output('datauristring');
  const whatsappText = `✅ *RECIBO DE PAGAMENTO CONFIRMADO*\n\nOlá *${vehicle.driver || 'Motorista'}*!\nConfirmamos o recebimento do pagamento semanal:\n\n🚗 *Veículo:* ${vehicle.brand} ${vehicle.model} (${vehicle.plate})\n💰 *Valor Pago:* R$ ${formattedAmount}\n📅 *Data:* ${formattedDate}\n📄 *Status:* Quitado com sucesso!\n\nObrigado pela pontualidade!`;

  return { doc, fileName, pdfDataUrl, whatsappText };
}

export async function generateExecutiveMonthlyPDF(
  vehicles: Vehicle[],
  maintenanceLogs: MaintenanceLog[],
  expenseLogs: ExpenseLog[],
  selectedMonth: number,
  selectedYear: number
): Promise<{ doc: jsPDF; fileName: string; pdfDataUrl: string }> {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthLabel = `${monthNames[selectedMonth] || 'Mês'} de ${selectedYear}`;
  const fileName = `Relatorio_Executivo_Frota_${String(selectedMonth + 1).padStart(2, '0')}_${selectedYear}.pdf`;

  const isSelectedPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const yr = parseInt(parts[0], 10);
      const mo = parseInt(parts[1], 10) - 1;
      return yr === selectedYear && mo === selectedMonth;
    }
    return false;
  };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('RELATÓRIO EXECUTIVO MENSAL - CONTABILIDADE & INVESTIDOR', 14, 13);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Competência: ${monthLabel} | Total de Veículos: ${vehicles.length} | Emitido em ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

  let y = 38;

  let totalFrotaReceita = 0;
  let totalFrotaFixas = 0;
  let totalFrotaManut = 0;
  let totalFrotaExtras = 0;

  const rows = vehicles.map((v) => {
    const weeklyInMonth = (v.weeklyPayments || [])
      .filter((wp) => isWeeklyPaymentPaid(wp) && isSelectedPeriod(wp.date))
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const receita = (v.weeklyPayments && v.weeklyPayments.length > 0) ? weeklyInMonth : (v.valorRecebido || 0);
    const fixas = (v.financiamento || 0) + (v.seguro || 0) + (v.ipva || 0) + (v.manutencaoPreventiva || 0) + (v.custoExtra || 0);
    const manutMes = maintenanceLogs
      .filter((m) => m.vehicleId === v.id && isSelectedPeriod(m.date))
      .reduce((acc, m) => acc + (m.cost || 0), 0);
    const expMes = expenseLogs
      .filter((e) => e.vehicleId === v.id && isSelectedPeriod(e.date))
      .reduce((acc, e) => acc + (e.cost || 0), 0);

    const liquido = receita - fixas - manutMes - expMes;

    totalFrotaReceita += receita;
    totalFrotaFixas += fixas;
    totalFrotaManut += manutMes;
    totalFrotaExtras += expMes;

    return {
      car: `${v.brand} ${v.model} (${v.plate})`,
      driver: v.driver || 'Disponível',
      receita,
      fixas,
      manutMes: manutMes + expMes,
      liquido
    };
  });

  const totalFrotaLiquido = totalFrotaReceita - totalFrotaFixas - totalFrotaManut - totalFrotaExtras;

  // KPIs Summary Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, 182, 24, 2, 2, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`FATURAMENTO BRUTO: R$ ${totalFrotaReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 18, y + 8);
  doc.text(`DESPESAS FIXAS: R$ ${totalFrotaFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 18, y + 17);
  doc.text(`MANUTENÇÕES / EXTRAS: R$ ${(totalFrotaManut + totalFrotaExtras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 108, y + 8);

  if (totalFrotaLiquido >= 0) {
    doc.setTextColor(5, 150, 105);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.setFontSize(10.5);
  doc.text(`LUCRO LÍQUIDO REAL: R$ ${totalFrotaLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 108, y + 17);

  y += 32;

  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('VEÍCULO / PLACA', 16, y + 5.5);
  doc.text('MOTORISTA', 68, y + 5.5);
  doc.text('RECEITA', 110, y + 5.5);
  doc.text('CUSTO FIXO', 135, y + 5.5);
  doc.text('MANUT/EXT', 160, y + 5.5);
  doc.text('LÍQUIDO', 181, y + 5.5);

  y += 8;

  rows.forEach((r, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 7.5, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(r.car.substring(0, 27), 16, y + 5);
    doc.text(r.driver.substring(0, 20), 68, y + 5);
    doc.text(`R$ ${r.receita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, 110, y + 5);
    doc.text(`R$ ${r.fixas.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, 135, y + 5);
    doc.text(`R$ ${r.manutMes.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, 160, y + 5);

    doc.setFont('helvetica', 'bold');
    if (r.liquido >= 0) {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(`R$ ${r.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, 180, y + 5);
    y += 7.5;
  });

  const pdfDataUrl = doc.output('datauristring');
  return { doc, fileName, pdfDataUrl };
}

