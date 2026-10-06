import { jsPDF } from 'jspdf';
import { Vehicle, MaintenanceLog, ExpenseLog, Vistoria, FuelLog } from '../types';
import { getSavedContractClauses, replaceClauseVariables } from './contractClauses';

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

function valorPorExtensoReais(valor: number): string {
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

  // 1. DAS PARTES
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
      `${contract.tenantName || '[Nome Completo]'}, portador(a) da CNH nº ${contract.tenantCnh || '[Número da CNH]'} com EAR (atividade remunerada), CPF nº ${contract.tenantCpfCnpj || '[Número do CPF]'}, RG nº ${contract.tenantRg || '[Número do RG]'}, residente e domiciliado(a) à ${contract.tenantAddress || '[Endereço Completo]'}. Telefone: ${contract.tenantPhone || '[Número de Telefone]'}.`
    );
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
    LOCATARIO_FONE: contract.tenantPhone || '[Número de Telefone]'
  };

  const savedClauses = getSavedContractClauses();
  const clauseMap = new Map(savedClauses.map(c => [c.id, c]));

  const getClause = (id: string, defaultLabel: string, defaultTpl: string) => {
    const c = clauseMap.get(id);
    const label = c?.clauseLabel || defaultLabel;
    const rawTpl = c?.text || defaultTpl;
    const text = replaceClauseVariables(rawTpl, variables);
    return { label, text };
  };

  // 2. DO OBJETO
  addSectionTitle('2. DO OBJETO');
  const c1 = getClause(
    'clausula_1_objeto',
    'Cláusula 1ª',
    `O objeto deste contrato é a locação do veículo de propriedade do LOCADOR, com as seguintes características: Marca/Modelo: {MARCA_MODELO} | Ano/Modelo: {ANO_MODELO} | Placa: {PLACA} | Cor: {COR}. O veículo é entregue com tanque cheio (álcool/gasolina) e quilometragem inicial de {KM_INICIAL} km.`
  );
  addClause(c1.label, c1.text);

  // 3. DA FINALIDADE EXCLUSIVA
  addSectionTitle('3. DA FINALIDADE EXCLUSIVA');
  const c2 = getClause(
    'clausula_2_finalidade',
    'Cláusula 2ª',
    'O veículo destina-se exclusivamente à prestação de serviços de transporte privado de passageiros por meio de aplicativos regulamentados (ex.: Uber, 99, InDrive).'
  );
  addClause(c2.label, c2.text);

  const c2p = getClause(
    'clausula_2_paragrafo',
    '• Parágrafo Único',
    'É expressamente proibida a sublocação, o empréstimo ou a cessão a terceiros (mesmo que parentes), sob pena de rescisão imediata e retomada do veículo.'
  );
  addClause(c2p.label, c2p.text);

  // 4. DO PRAZO E RENOVAÇÃO
  addSectionTitle('4. DO PRAZO E RENOVAÇÃO');
  const c3 = getClause(
    'clausula_3_prazo',
    'Cláusula 3ª',
    'A vigência tem início em {DATA_INICIO}, com duração inicial de 30 (trinta) dias, renovável automaticamente a cada 7 (sete) dias, por prazo indeterminado.'
  );
  addClause(c3.label, c3.text);

  const c4 = getClause(
    'clausula_4_rescisao',
    'Cláusula 4ª',
    'A rescisão por qualquer das partes exige aviso prévio por escrito com antecedência mínima de 48 (quarenta e oito) horas, ressalvadas as hipóteses de retomada imediata previstas neste instrumento.'
  );
  addClause(c4.label, c4.text);

  // 5. DOS VALORES, PAGAMENTO E CAUÇÃO
  addSectionTitle('5. DOS VALORES, PAGAMENTO E CAUÇÃO');
  const c5 = getClause(
    'clausula_5_valores',
    'Cláusula 5ª',
    'O aluguel semanal é de R$ {VALOR_SEMANAL} ({VALOR_SEMANAL_EXTENSO}). A primeira semana é paga no prazo de 7 (sete) dias corridos a contar da retirada do veículo, e os pagamentos subsequentes ocorrem {DIA_VENCIMENTO}, via PIX para a chave (telefone) {CHAVE_PIX}.'
  );
  addClause(c5.label, c5.text);

  const c6 = getClause(
    'clausula_6_mora',
    'Cláusula 6ª (Multa, Juros e Bloqueio por Atraso)',
    'O não pagamento do aluguel ou dos valores acessórios até às 23h59 da data de vencimento constitui o LOCATÁRIO em mora automática, gerando multa fixa de {TAXA_MULTA}% ({TAXA_MULTA_EXTENSO}) sobre o valor da semana vencida, acrescida de juros moratórios de {TAXA_JUROS}% ao mês (pro rata die) logo a partir do 1º (primeiro) dia de atraso. Caso o pagamento não seja regularizado, o LOCADOR notificará o LOCATÁRIO, via aplicativo, SMS ou WhatsApp, para que estacione o veículo em local seguro, realizando o bloqueio remoto do veículo, sem prejuízo de outras sanções legais.'
  );
  addClause(c6.label, c6.text);

  const c7 = getClause(
    'clausula_7_caucao',
    'Cláusula 7ª (Caução)',
    'O LOCATÁRIO pagará R$ {VALOR_CAUCAO} ({VALOR_CAUCAO_EXTENSO}) a título de caução à vista, no ato da retirada do veículo. O valor da caução não pode, em hipótese alguma, ser utilizado para abatimento ou pagamento de aluguel semanal, sendo restituído integralmente em até 30 (trinta) dias após a devolução do veículo, desde que inexistam danos, multas ou pendências financeiras.'
  );
  addClause(c7.label, c7.text);

  const c8 = getClause(
    'clausula_8_semparar',
    'Cláusula 8ª (Sem Parar)',
    'O LOCADOR será reembolsado integralmente pelo LOCATÁRIO na primeira semana de cada mês, mediante a apresentação de extrato detalhado de utilização do sistema de pedágio/estacionamento automático.'
  );
  addClause(c8.label, c8.text);

  // 6. DAS MULTAS DE TRÂNSITO
  addSectionTitle('6. DAS MULTAS DE TRÂNSITO');
  const c9 = getClause(
    'clausula_9_multas',
    'Cláusula 9ª',
    'O LOCATÁRIO é o único responsável pelas multas de trânsito cometidas durante a vigência do contrato, contadas desde a retirada até a efetiva devolução do veículo, ainda que a notificação seja emitida ou entregue após a restituição do automóvel ou da caução. Infrações cometidas após a devolução formal do veículo não são de responsabilidade do LOCATÁRIO.'
  );
  addClause(c9.label, c9.text);

  const c9p1 = getClause(
    'clausula_9_paragrafo_1',
    '• Parágrafo Primeiro',
    'O valor das multas de trânsito será cobrado junto ao aluguel semanal 15 dias após a notificação, integrando o montante devido para todos os efeitos, inclusive incidência de mora, multa e bloqueio previstos na Cláusula 6ª.'
  );
  addClause(c9p1.label, c9p1.text);

  const c9p2 = getClause(
    'clausula_9_paragrafo_2',
    '• Parágrafo Segundo',
    'Multas de infrações cometidas durante a vigência do contrato, mas notificadas após a devolução do veículo, deverão ser pagas em até 15 (quinze) dias corridos a contar da notificação, sob pena de execução e cobrança judicial. A data e o horário da infração registrados no órgão competente definem a responsabilidade temporal.'
  );
  addClause(c9p2.label, c9p2.text);

  // 7. DA MANUTENÇÃO, USO E SEGURANÇA
  addSectionTitle('7. DA MANUTENÇÃO, USO E SEGURANÇA');
  const c10 = getClause(
    'clausula_10_manutencao',
    'Cláusula 10ª',
    'O veículo possui limite de quilometragem de {LIMITE_KM} rodados por mês. Caso este limite seja ultrapassado e torne-se necessário antecipar a revisão, os custos da manutenção preventiva antecipada serão rateados em 50/50 entre LOCADOR e LOCATÁRIO. A manutenção preventiva regular ocorre a cada 7.000 km rodados{OFICINA_NOME}.'
  );
  addClause(c10.label, c10.text);

  const c10p = getClause(
    'clausula_10_paragrafo',
    '• Parágrafo Único',
    'Despesas com troca de óleo e filtros correm por conta do LOCADOR; o desgaste natural de peças de uso periódico é dividido igualmente (50/50); e eventuais danos decorrentes de mau uso, imperícia ou negligência são de responsabilidade integral do LOCATÁRIO.'
  );
  addClause(c10p.label, c10p.text);

  const c11 = getClause(
    'clausula_11_seguranca',
    'Cláusula 11ª',
    'É expressamente proibido fumar no interior do veículo. O veículo é equipado com rastreador e câmeras internas/externas, sendo proibida qualquer tentativa de obstrução, violação ou desligamento desses dispositivos.'
  );
  addClause(c11.label, c11.text);

  const c12 = getClause(
    'clausula_12_combustivel',
    'Cláusula 12ª',
    'Caso a luz de injeção acenda por suspeita de abastecimento com combustível de baixa qualidade, o LOCATÁRIO obriga-se a realizar a troca imediata do combustível para a devida verificação e solução do problema.'
  );
  addClause(c12.label, c12.text);

  const c13 = getClause(
    'clausula_13_bloqueio',
    'Cláusula 13ª (Bloqueio Remoto e Retomada Imediata)',
    'O LOCADOR poderá realizar o bloqueio remoto do veículo e declarar o contrato rescindido com retomada imediata, sem aviso prévio, nas seguintes hipóteses: (i) inadimplência superior a 2 (dois) dias; (ii) uso indevido, sublocação ou condução por terceiros não autorizados; (iii) abandono do veículo; ou (iv) descumprimento de qualquer cláusula deste instrumento. O bloqueio remoto não desobriga o LOCATÁRIO do pagamento dos valores devidos da locação.'
  );
  addClause(c13.label, c13.text);

  const c13p = getClause(
    'clausula_13_paragrafo',
    '• Parágrafo Único',
    'A recusa injustificada em restituir o veículo ao LOCADOR após a rescisão ou notificação de retomada configurará crime de Apropriação Indébita (art. 168 do Código Penal), autorizando o acionamento imediato das autoridades policiais e medidas judiciais de busca e apreensão.'
  );
  addClause(c13p.label, c13p.text);

  const c14 = getClause(
    'clausula_14_modificacoes',
    'Cláusula 14ª (Modificações e Documentos)',
    'É proibido modificar, adesivar, plotar, remover peças ou instalar equipamentos no veículo sem autorização prévia e por escrito do LOCADOR. O LOCATÁRIO deverá portar e manter o CRLV (físico ou digital) válido e acessível durante a condução, devolvendo-o incontinenti ao término do contrato e abstendo-se de entregá-lo a terceiros.'
  );
  addClause(c14.label, c14.text);

  // 8. DA DEVOLUÇÃO E AVARIAS
  addSectionTitle('8. DA DEVOLUÇÃO E AVARIAS');
  const c15 = getClause(
    'clausula_15_avarias',
    'Cláusula 15ª',
    'Em caso de avarias decorrentes de mau uso que exijam reparo em oficina, o LOCATÁRIO arcará com o valor integral do conserto em até 20 (vinte) dias corridos da ocorrência, restando expressamente estabelecido que a obrigatoriedade do pagamento do aluguel com o carro parado continua sendo do LOCATÁRIO.'
  );
  addClause(c15.label, c15.text);

  const c16 = getClause(
    'clausula_16_termos_devolucao',
    'Cláusula 16ª (Termos de Devolução)',
    'O veículo deverá ser devolvido limpo, com o tanque de combustível no mesmo nível da retirada e acompanhado das fotos/vídeos comparativos de vistoria.'
  );
  addClause(c16.label, c16.text);

  const c16p1 = getClause(
    'clausula_16_paragrafo_1',
    '• Parágrafo Primeiro',
    'Caso o veículo seja devolvido com combustível abaixo do nível da retirada, o LOCATÁRIO reembolsará o valor correspondente. Se for devolvido em condições de sujeira excessiva que exijam higienização profissional, será cobrada a taxa correspondente de R$ 150,00 (ou o valor equivalente à higienização).'
  );
  addClause(c16p1.label, c16p1.text);

  const c16p2 = getClause(
    'clausula_16_paragrafo_2',
    '• Parágrafo Segundo',
    'A devolução realizada após o horário combinado implicará a cobrança de diária proporcional de 1/7 do valor do aluguel semanal por dia de atraso, sem prejuízo das penalidades por quebra contratual.'
  );
  addClause(c16p2.label, c16p2.text);

  // 9. DA VISTORIA E MONITORAMENTO (LGPD)
  addSectionTitle('9. DA VISTORIA E MONITORAMENTO (LGPD)');
  const c17 = getClause(
    'clausula_17_vistoria',
    'Cláusula 17ª',
    'É obrigatório o registro fotográfico e em vídeo do painel, pneus e lataria no momento da retirada e da devolução. O LOCATÁRIO obriga-se, ainda, a enviar a vistoria semanal por aplicativo ou WhatsApp em dia e horário previamente ajustados com o LOCADOR.'
  );
  addClause(c17.label, c17.text);

  const c18 = getClause(
    'clausula_18_lgpd',
    'Cláusula 18ª (Privacidade e LGPD)',
    'O LOCATÁRIO autoriza expressamente o monitoramento do veículo por meio de rastreador e câmeras, abrangendo localização em tempo real, rotas, velocidades, imagens e áudio interno, para fins estritos de segurança, gestão de frota, prevenção de fraudes e defesa jurídica em eventuais litígios, em total conformidade com a Lei nº 13.709/2018 (LGPD).'
  );
  addClause(c18.label, c18.text);

  // 10. DOS SINISTROS E TRATATIVAS COM TERCEIROS
  addSectionTitle('10. DOS SINISTROS E TRATATIVAS COM TERCEIROS');
  const c19 = getClause(
    'clausula_19_sinistros',
    'Cláusula 19ª',
    'Em caso de acidente, colisão, furto, roubo ou qualquer sinistro envolvendo terceiros, o LOCATÁRIO deverá comunicar o LOCADOR imediatamente e registrar o respectivo Boletim de Ocorrência (B.O.).'
  );
  addClause(c19.label, c19.text);

  const c19p1 = getClause(
    'clausula_19_paragrafo_1',
    '• Parágrafo Primeiro',
    'Qualquer negociação, acordo, tratativa ou contato com terceiros envolvidos ou com as seguradoras respectivas deverá ser conduzido e autorizado estritamente pelo LOCADOR. É vedado ao LOCATÁRIO firmar acordos ou prometer pagamentos em nome do proprietário.'
  );
  addClause(c19p1.label, c19p1.text);

  const c19p2 = getClause(
    'clausula_19_paragrafo_2',
    '• Parágrafo Segundo',
    'O CPF e os documentos pessoais do LOCATÁRIO não poderão ser utilizados por terceiros para abertura de reclamações, processos ou acionamentos de seguros, sendo tal prerrogativa exclusiva do LOCADOR.'
  );
  addClause(c19p2.label, c19p2.text);

  const c19p3 = getClause(
    'clausula_19_paragrafo_3',
    '• Parágrafo Terceiro',
    'A violação desta cláusula caracteriza infração contratual grave, ensejando rescisão imediata do contrato e responsabilização civil e criminal do LOCATÁRIO por eventuais prejuízos.'
  );
  addClause(c19p3.label, c19p3.text);

  // 11. DO SEGURO (LOOVI SEGUROS)
  addSectionTitle(`11. DO SEGURO (${insCompany.toUpperCase()})`);
  const c20 = getClause(
    'clausula_20_seguro',
    'Cláusula 20ª',
    `O veículo possui apólice de seguro contratada junto à Loovi Seguros (${insCompany}), contemplando assistência 24 horas, cobertura para furto/roubo, colisão completa (danos próprios e a terceiros), carro reserva e proteção de vidros.`
  );
  addClause(c20.label, c20.text);

  const c20p1 = getClause(
    'clausula_20_paragrafo_1',
    '• Parágrafo Primeiro',
    'Em caso de sinistro com necessidade de acionamento do seguro, a franquia e eventuais despesas acessórias serão de responsabilidade integral do LOCATÁRIO.'
  );
  addClause(c20p1.label, c20p1.text);

  const c20p2 = getClause(
    'clausula_20_paragrafo_2',
    '• Parágrafo Segundo',
    'É permitido apenas 01 (um) acionamento por mês para serviços de assistência 24 horas. Acionamentos adicionais correrão exclusivamente por conta do LOCATÁRIO.'
  );
  addClause(c20p2.label, c20p2.text);

  const c20p3 = getClause(
    'clausula_20_paragrafo_3',
    '• Parágrafo Terceiro',
    `Contatos de emergência do seguro: ${insPhones}.`
  );
  addClause(c20p3.label, c20p3.text);

  // Cláusulas personalizadas criadas pelo usuário
  const customClausesList = savedClauses.filter(c => c.isCustom);
  if (customClausesList.length > 0) {
    addSectionTitle('CLÁUSULAS ADICIONAIS PERSONALIZADAS');
    customClausesList.forEach(cc => {
      const text = replaceClauseVariables(cc.text, variables);
      addClause(cc.clauseLabel, text);
    });
  }

  // Cláusulas especiais informadas no formulário (opcional)
  let sectionIndex = 12;
  if (contract.customClauses && contract.customClauses.trim().length > 0) {
    addSectionTitle(`${sectionIndex}. OBSERVAÇÕES E CONDIÇÕES ESPECÍFICAS`);
    addClause('', contract.customClauses.trim());
    sectionIndex++;
  }

  // DO FORO E DISPOSIÇÕES FINAIS
  addSectionTitle(`${sectionIndex}. DO FORO E DISPOSIÇÕES FINAIS`);
  const c21 = getClause(
    'clausula_21_foro',
    'Cláusula 21ª',
    'Para dirimir quaisquer controvérsias ou litígios oriundos do presente contrato, as partes elegem expressamente o Foro da Comarca de São Paulo/SP, renunciando a qualquer outro, por mais privilegiado que seja.'
  );
  addClause(c21.label, c21.text);
  addClause(
    '',
    'E por estarem assim justas e contratadas, as partes assinam o presente instrumento em 02 (duas) vias de igual teor e forma para um só efeito legal.'
  );

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

