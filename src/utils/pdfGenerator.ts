import { jsPDF } from 'jspdf';
import { Vehicle, MaintenanceLog, ExpenseLog, Vistoria, FuelLog } from '../types';
import { getSavedContractClauses, replaceClauseVariables, getFullContractTextTemplate, groupClausesByTopic } from './contractClauses';

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

export async function generateVehiclePDF(
  vehicle: Vehicle,
  maintenanceLogs: MaintenanceLog[],
  expenseLogs: ExpenseLog[],
  vistorias: Vistoria[],
  fuelLogs: FuelLog[]
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

  const vehicleFields = [
    [`Marca / Modelo:`, `${vehicle.brand} ${vehicle.model}`],
    [`Placa:`, `${vehicle.plate}`],
    [`Ano / Cor:`, `${vehicle.year} / ${vehicle.color}`],
    [`Odômetro Final:`, `${(vehicle.currentKm || 0).toLocaleString('pt-BR')} km`],
    [`Locadora / Empresa:`, vehicle.rentalCompany || 'Não informada'],
    [`Valor Recebido Acumulado:`, `R$ ${(vehicle.valorRecebido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
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

  // Section 2: Dados do Locatário / Motorista
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. DADOS DO LOCATÁRIO / MOTORISTA', 18, y + 5);

  y += 12;

  const driverFields = [
    [`Nome do Motorista:`, vehicle.driver || 'Não cadastrado'],
    [`Telefone:`, vehicle.driverPhone || 'Não informado'],
    [`Data Início Locação:`, vehicle.startDate ? new Date(vehicle.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada']
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

  y += (Math.ceil(driverFields.length / 2) * 6) + 6;

  // Section 3: Histórico Financeiro e Pagamentos
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. HISTÓRICO DE PAGAMENTOS E FINANCEIRO', 18, y + 5);

  y += 12;

  const payments = vehicle.weeklyPayments || [];
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de parcelas pagas registradas: R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${payments.length} parcela(s))`, 18, y);
  y += 6;

  // Payments table header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.rect(14, y, 182, 6, 'F');
  doc.text('Data Registro', 18, y + 4.5);
  doc.text('Valor do Pagamento (R$)', 80, y + 4.5);

  y += 6;
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('helvetica', 'normal');

  const displayPayments = payments.slice(0, 10);
  if (displayPayments.length === 0) {
    doc.text('Nenhum pagamento registrado no cartão.', 18, y + 5);
    y += 8;
  } else {
    displayPayments.forEach((p, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 5.5, 'F');
      }
      doc.text(new Date(p.date + 'T12:00:00').toLocaleDateString('pt-BR'), 18, y + 4);
      doc.text(`R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 80, y + 4);
      y += 5.5;
    });
  }

  y += 4;

  // Check page overflow
  if (y > 230) {
    doc.addPage();
    y = 15;
  }

  // Section 4: Histórico de Manutenções e Despesas
  const vehMaint = maintenanceLogs.filter((m) => m.vehicleId === vehicle.id);
  const vehExp = expenseLogs.filter((e) => e.vehicleId === vehicle.id);
  const vehVistorias = vistorias.filter((v) => v.vehicleId === vehicle.id);

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

  // Maintenance list details
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
    y += 4;
  }

  // Section 5: Detalhamento de Vistorias
  if (y > 240) { doc.addPage(); y = 15; }

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`5. HISTÓRICO E LAUDOS DE VISTORIAS (${vehVistorias.length})`, 18, y + 5);

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

      // Vistoria Photos
      if (v.photos && v.photos.length > 0) {
        if (y > 220) { doc.addPage(); y = 15; }
        doc.setFont('helvetica', 'bold');
        doc.text(`Fotos Anexadas à Vistoria (${v.photos.length}):`, 22, y);
        y += 6;

        let imgX = 22;
        for (const photoUrl of v.photos) {
          if (!photoUrl) continue;
          const imgData = await urlToDataUrl(photoUrl);
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
      }

      y += 4;
    }
  }

  // Section 6: Documentos e Anexos do Veículo
  if (y > 240) { doc.addPage(); y = 15; }

  const docs = vehicle.documents || [];
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`6. DOCUMENTOS E ANEXOS REGISTRADOS DO VEÍCULO (${docs.length})`, 18, y + 5);

  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  if (docs.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum documento anexado ao cadastro do veículo.', 18, y);
    y += 8;
  } else {
    for (const d of docs) {
      if (y > 250) { doc.addPage(); y = 15; }

      doc.setFont('helvetica', 'bold');
      doc.text(`• [${d.category || 'Geral'}] ${d.name}`, 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`(Enviado em: ${d.uploadDate || 'S/D'} ${d.fileSize ? `- ${d.fileSize}` : ''})`, 110, y);
      y += 5;

      // If document image contentUrl is embedded
      if (d.contentUrl) {
        const docImgData = await urlToDataUrl(d.contentUrl);
        if (docImgData) {
          try {
            if (y > 220) { doc.addPage(); y = 15; }
            doc.addImage(docImgData.dataUrl, docImgData.format, 22, y, 55, 38);
            y += 42;
          } catch (err) {
            console.warn('Erro ao inserir imagem do documento no PDF:', err);
          }
        }
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
  const cleanPlate = vehicle.plate ? vehicle.plate.replace(/[^a-zA-Z0-9]/g, '') : 'VEICULO';
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
    PLACA: vehicle.plate || 'BRANCO',
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
    doc.text(
      `Contrato de Locação - Veículo ${vehicle.brand} ${vehicle.model} (${vehicle.plate}) | Página ${i} de ${pageCount}`,
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
      .filter((wp) => isSelectedPeriod(wp.date))
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const receita = weeklyInMonth > 0 ? weeklyInMonth : (v.valorRecebido || 0);
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

