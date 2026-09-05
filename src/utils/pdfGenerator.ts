import { jsPDF } from 'jspdf';
import { Vehicle, MaintenanceLog, ExpenseLog, Vistoria, FuelLog } from '../types';

async function urlToDataUrl(url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' } | null> {
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
      doc.text(`• ${m.date ? new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'S/D'} - ${m.description || m.type} (R$ ${(m.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`, 22, y);
      y += 4.5;
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
          const statusText = isOk ? '[OK]' : '[PENDENTE]';
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
  doc.setFontSize(15);
  doc.text('LAUDO DE VISTORIA DO VEÍCULO', 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Veículo: ${vehicle.brand} ${vehicle.model} (${vehicle.plate}) | Data: ${formattedNow}`, 14, 20);

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
      const statusText = isOk ? '[OK]' : '[PENDENTE]';
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
  const cleanPlate = vehicle.plate.replace(/[^a-zA-Z0-9]/g, '');
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
  doc.rect(14, y, 182, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CONTRATO DE LOCAÇÃO DE VEÍCULO PARA APLICATIVO', 105, y + 7.5, { align: 'center' });

  y += 16;

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° do Contrato: ${contract.contractNumber} | Emissão: ${dateFormatted}`, 14, y);
  y += 6;

  const addSectionTitle = (title: string) => {
    checkPageBreak(12);
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, y, 182, 6, 'S');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, 17, y + 4.2);
    y += 9;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
  };

  const addParagraph = (text: string, isBoldPrefix = false) => {
    const lines = doc.splitTextToSize(text, 178);
    checkPageBreak(lines.length * 4 + 2);
    lines.forEach((line: string, index: number) => {
      if (isBoldPrefix && index === 0 && line.includes(':')) {
        const parts = line.split(':');
        doc.setFont('helvetica', 'bold');
        doc.text(parts[0] + ':', 16, y);
        doc.setFont('helvetica', 'normal');
        doc.text(parts.slice(1).join(':'), 16 + doc.getTextWidth(parts[0] + ': '), y);
      } else {
        doc.text(line, 16, y);
      }
      y += 4;
    });
    y += 1.5;
  };

  // 1. PARTES
  addSectionTitle('1. PARTES');
  addParagraph(
    `LOCADOR: ${contract.landlordName || 'CLAUDIO OLIVEIRA DA SILVA'}, portador do CPF ${contract.landlordCpfCnpj || '065.426.576-30'}, RG ${contract.landlordRg || '39.508.321-7'}, residente e domiciliado à ${contract.landlordAddress || 'Rua Manuel Leiroz, 230, apto 1306 - Cangaíba, São Paulo/SP, CEP: 03735-180'}.`,
    true
  );
  addParagraph(
    `LOCATÁRIO: ${contract.tenantName}, portador da CNH nº ${contract.tenantCnh || 'Não informada'}, CPF nº ${contract.tenantCpfCnpj || 'Não informado'}, RG ${contract.tenantRg || 'Não informado'}, residente e domiciliado à ${contract.tenantAddress || 'Não informado'}.${contract.tenantPhone ? ` Telefone: ${contract.tenantPhone}.` : ''}`,
    true
  );

  // 2. OBJETO E VEÍCULO
  addSectionTitle('2. OBJETO E VEÍCULO');
  addParagraph(
    `Veículo ${vehicle.brand} ${vehicle.model} (Placa: ${vehicle.plate}, Ano: ${vehicle.year}, Cor: ${vehicle.color}), entregue com tanque cheio (álcool/gasolina).`
  );
  addParagraph(`Quilometragem inicial: ${(vehicle.initialKm || vehicle.currentKm || 55922).toLocaleString('pt-BR')} km.`);
  addParagraph(`Destinação: Uso exclusivo em aplicativos de transporte.`);

  // 3. PRAZO E RENOVAÇÃO
  addSectionTitle('3. PRAZO E RENOVAÇÃO');
  const startFormatted = contract.startDate
    ? new Date(contract.startDate + 'T12:00:00').toLocaleDateString('pt-BR')
    : dateFormatted;
  addParagraph(
    `Vigência: Início em ${startFormatted}, com duração inicial de 30 dias, renovável automaticamente a cada 7 dias por tempo indeterminado.`
  );
  addParagraph(`Rescisão: Avisar com antecedência mínima de 48 horas.`);

  // 4. VALORES, PAGAMENTO E CAUÇÃO
  addSectionTitle('4. VALORES, PAGAMENTO E CAUÇÃO');
  const rentVal = (contract.rentalValue || 960).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const caucaoVal = (contract.caucaoValue || 1920).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const pix = contract.pixKey || contract.landlordPhone || '11953292570';

  addParagraph(`Aluguel Semanal: R$ ${rentVal}, pagos de forma vencida.`);
  addParagraph(`Vencimento: O pagamento deverá ser efetuado até às 23:59 de cada sexta-feira.`);
  addParagraph(
    `Caução (Garantia): R$ ${caucaoVal}, a ser pago em até 20 dias corridos a contar da data de início do contrato. O valor da caução não pode, em hipótese alguma, ser utilizado para abatimento ou pagamento do aluguel semanal.`
  );
  addParagraph(
    `Sem Parar: Reembolso integral ao LOCADOR na primeira semana de cada mês, mediante apresentação de extrato detalhado.`
  );
  addParagraph(
    `Devolução da Caução: Em até 30 dias após a devolução do veículo, mediante inexistência de danos ou multas.`
  );
  addParagraph(`Multas: Responsabilidade do LOCATÁRIO, mesmo após a devolução da caução.`);
  addParagraph(`Meio de Pagamento: PIX para a chave (telefone): ${pix}.`);

  // 5. INFRAÇÕES DE TRÂNSITO E MULTAS
  addSectionTitle('5. INFRAÇÕES DE TRÂNSITO E MULTAS');
  addParagraph(
    `O LOCATÁRIO é o principal condutor, sendo obrigatória a indicação via CNH Digital. Todas as multas são de sua total responsabilidade até o vencimento.`
  );

  // 6. MANUTENÇÃO, USO E SEGURANÇA
  addSectionTitle('6. MANUTENÇÃO, USO E SEGURANÇA');
  const workshop = contract.workshopName || 'Pneus Andriatti (Penha, SP)';
  const limitKm = contract.kmLimit || '5.000 km';
  addParagraph(
    `Quilometragem e Manutenção: O veículo possui limite de ${limitKm} rodados por mês. Caso o limite seja ultrapassado e seja necessário adiantar a revisão, os custos da manutenção preventiva serão divididos igualmente (50/50) entre LOCADOR e LOCATÁRIO. A manutenção preventiva regular ocorre a cada 7.000 km na oficina "${workshop}".`
  );
  addParagraph(`Custos: Óleo/filtros (LOCADOR); Desgaste natural (50/50); Mau uso (LOCATÁRIO).`);
  addParagraph(`Higiene: Proibido fumar no interior.`);
  addParagraph(`Monitoramento: Veículo possui rastreador e câmeras. É proibida a obstrução desses dispositivos.`);
  addParagraph(
    `Luz de Injeção: Caso a luz acenda por combustível de baixa qualidade, o LOCATÁRIO deve trocar o combustível para verificar o problema.`
  );
  addParagraph(
    `Bloqueio Remoto: O LOCADOR pode realizar o bloqueio em caso de inadimplência superior a dois dias, uso indevido, abandono ou descumprimento contratual. O bloqueio não isenta o LOCATÁRIO da obrigação de pagamento do aluguel.`
  );
  addParagraph(
    `Imobilização por Avaria: Em caso de avarias decorrentes de mau uso que necessitem de reparo em oficina, o LOCATÁRIO será responsável pelo pagamento de valor compensatório equivalente ao aluguel proporcional pelos dias em que o veículo permanecer imobilizado.`
  );

  // 7. VISTORIA
  addSectionTitle('7. VISTORIA');
  addParagraph(`Obrigatória a troca de fotos/vídeos do painel e avarias na retirada e devolução.`);
  addParagraph(
    `Vistoria Semanal: Obrigatória, a ser enviada pelo LOCATÁRIO via app ou WhatsApp em dia/horário combinado.`
  );

  // 8. SEGURO
  const insCompany = contract.insuranceCompany || 'LOOVI SEGUROS';
  const insPhones =
    contract.insurancePhones ||
    '0800 948 4888 (Assistência); 0800 607 2007 (Furto/Roubo); 4000 1762 (Central)';

  addSectionTitle(`8. SEGURO (${insCompany.toUpperCase()})`);
  addParagraph(`Cobertura: Assistência 24h, Furto/Roubo, Colisão Completa + Terceiros, Carro reserva e Vidros.`);
  addParagraph(`Franquia: Responsabilidade do LOCATÁRIO.`);
  addParagraph(`Limitação: É permitido apenas 01 (um) acionamento por mês para serviços de assistência.`);
  addParagraph(`Emergências: ${insPhones}.`);

  // Cláusulas especiais (opcional)
  if (contract.customClauses) {
    addSectionTitle('9. OBSERVAÇÕES E CLÁUSULAS ADICIONAIS');
    addParagraph(contract.customClauses);
  }

  // Local, data e assinaturas
  checkPageBreak(40);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`São Paulo, ${startFormatted}.`, 16, y);

  y += 22;

  checkPageBreak(30);

  // Signature lines
  doc.setLineWidth(0.4);
  doc.setDrawColor(100, 116, 139);
  doc.line(18, y, 92, y);
  doc.line(118, y, 192, y);

  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(contract.landlordName || 'CLAUDIO OLIVEIRA DA SILVA', 18, y);
  doc.setFont('helvetica', 'normal');
  doc.text('(Locador)', 18, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.text(contract.tenantName || 'FABIO PEREIRA ALVES', 118, y);
  doc.setFont('helvetica', 'normal');
  doc.text('(Locatário)', 118, y + 4);

  const pdfDataUrl = doc.output('datauristring');
  return { doc, fileName, pdfDataUrl };
}
