const PUBLIC_WEB_ORIGIN = 'https://ais-dev-nxg4lixniko7ymx3t5cstw-473118395752.us-west2.run.app';
const WHATSAPP_TEMPLATES_STORAGE_KEY = 'fleet_whatsapp_templates';

export type WhatsAppTemplateKey =
  | 'lembrete'
  | 'hoje'
  | 'atrasado'
  | 'atrasado_com_juros'
  | 'bloqueado'
  | 'renovacao';

export type CoreWhatsAppTemplateCategory = 'pagamento' | 'atraso' | 'renovacao';

export const CORE_TO_TEMPLATE_KEY: Record<CoreWhatsAppTemplateCategory, WhatsAppTemplateKey> = {
  pagamento: 'lembrete',
  atraso: 'atrasado',
  renovacao: 'renovacao',
};

export const DEFAULT_WHATSAPP_TEMPLATES: Record<WhatsAppTemplateKey, string> = {
  lembrete: `Olá, *{motorista}*! Tudo bem? 😊\n\nPassando para lembrar do pagamento semanal referente ao veículo *{veiculo}* ({placa}).\n\n💵 *Valor:* R$ {valor}\n📅 *Vencimento:* {vencimento}\n🔑 *Chave PIX:* {chave_pix}\n\n(👉 *Caso a mensagem esteja cortada, clique em "LER MAIS" para que o link esteja todo disponível*)\nEnvie o comprovante de pagamento pelo link:\n🔗 {link_comprovante}\n\nAbraços!`,
  hoje: `Olá, *{motorista}*! Tudo bem?\n\nLembrete: *Hoje* é o dia do pagamento semanal referente ao veículo *{veiculo}* ({placa}).\n\n💵 *Valor:* R$ {valor}\n🗓️ *Vencimento:* Hoje ({vencimento})\n🔑 *Chave PIX:* {chave_pix}\n\n(👉 *Caso a mensagem esteja cortada, clique em "LER MAIS" para que o link esteja todo disponível*)\nEnvie o comprovante pelo link:\n🔗 {link_comprovante}\n\nAgradeço a parceria! 👍`,
  atrasado: `Olá, *{motorista}*.\n\nIdentificamos que o pagamento semanal referente ao veículo *{veiculo}* ({placa}) com vencimento em *{vencimento}* consta em *atraso*.\n\n⚠️ *Valor em aberto:* R$ {valor}\n🔑 *Chave PIX:* {chave_pix}\n\n(👉 *Caso a mensagem esteja cortada, clique em "LER MAIS" para que o link esteja todo disponível*)\nRegularize e envie o comprovante pelo link:\n🔗 {link_comprovante}\n\nFicamos no aguardo. Obrigado!`,
  atrasado_com_juros: `Olá, *{motorista}*.\n\nIdentificamos que o pagamento semanal do veículo *{veiculo}* ({placa}) está em *atraso*.\n\n⚠️ *Valor original:* R$ {valor}\n➕ *Juros/Multa:* R$ {juros}\n💰 *Total com Juros:* R$ {total_com_juros}\n🔑 *Chave PIX:* {chave_pix}\n\n(👉 *Caso a mensagem esteja cortada, clique em "LER MAIS" para que o link esteja todo disponível*)\nRegularize e envie o comprovante pelo link:\n🔗 {link_comprovante}\n\nFicamos no aguardo. Obrigado!`,
  bloqueado: `🚨 *AVISO DE BLOQUEIO DO VEÍCULO* 🚨\n\nOlá, *{motorista}*!\n\nInformamos que devido à inadimplência e falta de pagamento do aluguel semanal referente ao veículo *{veiculo}* ({placa}), o sistema realizou o *bloqueio remoto* do veículo por falta de pagamento.\n\n⚠️ *Valor em aberto:* R$ {valor}\n🗓️ *Vencimento original:* {vencimento}\n\n(👉 *Caso a mensagem esteja cortada, clique em "LER MAIS" para que o link esteja todo disponível*)\nPara efetuar a regularização e solicitar o desbloqueio, envie o comprovante de pagamento pelo link:\n🔗 {link_comprovante}\n\nAssim que o pagamento for confirmado, o acesso será liberado. Evite medidas contratuais adicionais.`,
  renovacao: `Olá, *{motorista}*! Tudo bem? 🔄\n\nO período atual do seu contrato de locação do veículo *{veiculo}* (Placa: *{placa}*) está próximo da data de *renovação* (*{vencimento}*).\n\n💵 *Valor semanal vigente:* R$ {valor}\n\nPor favor, confirme se deseja seguir com a renovação do contrato para mantermos tudo regularizado!\n\nQualquer dúvida estou à disposição. 🤝`,
};

export interface WhatsAppTemplateVariableDef {
  token: string;
  label: string;
  example: string;
}

export const WHATSAPP_TEMPLATE_VARIABLES: WhatsAppTemplateVariableDef[] = [
  { token: '{motorista}', label: 'Motorista', example: 'João Silva' },
  { token: '{veiculo}', label: 'Veículo', example: 'Fiat Mobi Like' },
  { token: '{placa}', label: 'Placa', example: 'ABC-1D23' },
  { token: '{valor}', label: 'Valor', example: '650,00' },
  { token: '{vencimento}', label: 'Vencimento / Data', example: '25/11/2026' },
  { token: '{chave_pix}', label: 'Chave PIX', example: '11953292570' },
  { token: '{juros}', label: 'Juros/Multa', example: '65,00' },
  { token: '{total_com_juros}', label: 'Total c/ Juros', example: '715,00' },
  { token: '{link_comprovante}', label: 'Link Comprovante', example: 'https://...' },
];

export const getPublicWebBaseUrlForTemplates = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const orig = window.location.origin;
    if (!orig.includes('localhost') && !orig.includes('127.0.0.1') && !orig.includes('capacitor://')) {
      return orig.replace(/\/+$/, '');
    }
  }
  return PUBLIC_WEB_ORIGIN.replace(/\/+$/, '');
};

export function getAllWhatsAppTemplates(): Record<WhatsAppTemplateKey, string> {
  const result: Record<WhatsAppTemplateKey, string> = { ...DEFAULT_WHATSAPP_TEMPLATES };
  if (typeof window === 'undefined' || !window.localStorage) return result;

  try {
    const rawMap = localStorage.getItem(WHATSAPP_TEMPLATES_STORAGE_KEY);
    if (rawMap) {
      const parsed = JSON.parse(rawMap);
      (Object.keys(DEFAULT_WHATSAPP_TEMPLATES) as WhatsAppTemplateKey[]).forEach((k) => {
        if (typeof parsed?.[k] === 'string' && parsed[k].trim().length > 0) {
          result[k] = parsed[k];
        }
      });
    }
  } catch {
    // ignore malformed JSON
  }

  // Backward-compatible override / sync from individual fleet_payment_msg_* keys
  (Object.keys(DEFAULT_WHATSAPP_TEMPLATES) as WhatsAppTemplateKey[]).forEach((k) => {
    const legacyVal = localStorage.getItem(`fleet_payment_msg_${k}`);
    if (legacyVal && legacyVal.trim().length > 0) {
      result[k] = legacyVal;
    }
  });

  return result;
}

export function getWhatsAppTemplate(key: WhatsAppTemplateKey): string {
  return getAllWhatsAppTemplates()[key] || DEFAULT_WHATSAPP_TEMPLATES[key];
}

export function saveWhatsAppTemplate(key: WhatsAppTemplateKey, text: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const current = getAllWhatsAppTemplates();
  const next = { ...current, [key]: text };
  localStorage.setItem(WHATSAPP_TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem(`fleet_payment_msg_${key}`, text);
}

export function saveAllWhatsAppTemplates(templates: Partial<Record<WhatsAppTemplateKey, string>>): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const current = getAllWhatsAppTemplates();
  const next: Record<WhatsAppTemplateKey, string> = { ...current, ...templates } as Record<WhatsAppTemplateKey, string>;
  localStorage.setItem(WHATSAPP_TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  (Object.keys(next) as WhatsAppTemplateKey[]).forEach((k) => {
    localStorage.setItem(`fleet_payment_msg_${k}`, next[k]);
  });
}

export function resetWhatsAppTemplate(key: WhatsAppTemplateKey): string {
  const def = DEFAULT_WHATSAPP_TEMPLATES[key];
  saveWhatsAppTemplate(key, def);
  return def;
}

export function formatWhatsAppTemplateText(
  template: string,
  driverName: string,
  brand: string,
  model: string,
  plate: string,
  amount: number,
  dueDateStr: string,
  returnLink?: string,
  vehicleId?: string,
  juros?: number,
  diasAtraso?: number
): string {
  const formattedAmount = amount
    ? amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';
  const jurosVal = juros || 0;
  const totalComJurosVal = amount + jurosVal;
  const formattedJuros = jurosVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedTotal = totalComJurosVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let formattedDate = 'Hoje';
  if (dueDateStr) {
    const parts = dueDateStr.split('-');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
      formattedDate = dueDateStr;
    }
  }

  const baseLink =
    returnLink && !returnLink.includes('localhost')
      ? returnLink
      : getPublicWebBaseUrlForTemplates();
  const sep = baseLink.includes('?') ? '&' : '?';
  const vehParam = vehicleId ? `&vehicleId=${encodeURIComponent(vehicleId)}` : '';
  const paymentLink = `${baseLink}${sep}mode=pagamento${vehParam}&placa=${encodeURIComponent(plate)}&reqId=${Date.now().toString(36)}`;

  const fullVehicle = `${brand || ''} ${model || ''}`.trim() || 'Veículo';
  const pixKey = (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('fleet_landlord_pix') : '') || '11953292570';
  const landlordName = (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('fleet_landlord_name') : '') || '';

  return template
    .replace(/\{motorista\}/gi, driverName || 'Locatário')
    .replace(/\{driver\}/gi, driverName || 'Locatário')
    .replace(/\{veiculo\}/gi, fullVehicle)
    .replace(/\{brand\}/gi, brand || 'Veículo')
    .replace(/\{model\}/gi, model || '')
    .replace(/\{placa\}/gi, plate || '')
    .replace(/\{plate\}/gi, plate || '')
    .replace(/\{valor\}/gi, formattedAmount)
    .replace(/\{juros\}/gi, formattedJuros)
    .replace(/\{total_com_juros\}/gi, formattedTotal)
    .replace(/\{vencimento\}/gi, formattedDate)
    .replace(/\{data_vencimento\}/gi, formattedDate)
    .replace(/\{chave_pix\}/gi, pixKey)
    .replace(/\{pix\}/gi, pixKey)
    .replace(/\{locador\}/gi, landlordName)
    .replace(/\{dias_atraso\}/gi, String(diasAtraso ?? 0))
    .replace(/\{link_comprovante\}/gi, paymentLink);
}
