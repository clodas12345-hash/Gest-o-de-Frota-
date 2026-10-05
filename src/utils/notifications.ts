import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'fleet_notifications';
const PREFS_STORAGE_KEY = 'fleet_notification_preferences';
const BatteryOptimization = registerPlugin<any>('BatteryOptimization');

export type NotificationEventKey =
  | 'maint_overdue'
  | 'maint_near'
  | 'maint_scheduled_date'
  | 'maint_logged'
  | 'vistoria_friday'
  | 'vistoria_scheduled_date'
  | 'vistoria_completed'
  | 'vistoria_approved'
  | 'payment_registered'
  | 'receipt_received'
  | 'receipt_approved'
  | 'contract_generated'
  | 'contract_expiring'
  | 'contract_finalized'
  | 'cnh_expiring'
  | 'insurance_expiring'
  | 'tire_wear_alert'
  | 'sinistro_logged'
  | 'fuel_low_alert'
  | 'document_uploaded'
  | 'caucao_updated'
  | 'backup_completed'
  | 'fipe_updated'
  | 'fipe_monthly_sync';

export interface NotificationOptionDefinition {
  key: NotificationEventKey;
  number: number;
  title: string;
  description: string;
  category: 'Manutenção e Pneus' | 'Vistorias' | 'Financeiro e Pagamentos' | 'Contratos e CNH' | 'Operação e Sistema';
  sampleTitle: string;
  sampleBody: string;
}

export const NOTIFICATION_OPTIONS: NotificationOptionDefinition[] = [
  {
    key: 'maint_overdue',
    number: 1,
    title: 'Manutenção Preventiva Vencida (KM Atingido)',
    description: 'Alerta crítico quando a quilometragem atual do veículo atinge ou ultrapassa o limite da revisão.',
    category: 'Manutenção e Pneus',
    sampleTitle: '🚨 MANUTENÇÃO VENCIDA: Fiat Mobi (ABC-1234)',
    sampleBody: 'O veículo atingiu 50.200 KM (limite era 50.000 KM). Providencie a revisão imediatamente!'
  },
  {
    key: 'maint_near',
    number: 2,
    title: 'Revisão Preventiva Próxima (Faltando ≤ 500 KM)',
    description: 'Aviso preventivo antecipado quando faltam 500 KM ou menos para a próxima troca de óleo/revisão.',
    category: 'Manutenção e Pneus',
    sampleTitle: '⚠️ Revisão Próxima: Chevrolet Onix (DEF-5678)',
    sampleBody: 'Faltam apenas 350 KM para a próxima manutenção preventiva programada.'
  },
  {
    key: 'maint_scheduled_date',
    number: 3,
    title: 'Data Programada de Revisão Preventiva',
    description: 'Notificação agendada para a data de revisão definida no cadastro de manutenção do veículo.',
    category: 'Manutenção e Pneus',
    sampleTitle: '🔧 Hoje é Dia de Revisão: Renault Kwid (GHI-9012)',
    sampleBody: 'A manutenção preventiva deste veículo está agendada para hoje.'
  },
  {
    key: 'maint_logged',
    number: 4,
    title: 'Nova Manutenção / Oficina Registrada',
    description: 'Confirmação disparada sempre que um novo serviço ou reparo de oficina é salvo no histórico.',
    category: 'Manutenção e Pneus',
    sampleTitle: '🛠️ Manutenção Registrada: Troca de Pastilhas',
    sampleBody: 'Serviço registrado com sucesso no histórico de manutenção da frota.'
  },
  {
    key: 'tire_wear_alert',
    number: 5,
    title: 'Alerta de Desgaste ou Troca de Pneus',
    description: 'Notifica quando um pneu é marcado com status de Atenção ou Troca Necessária.',
    category: 'Manutenção e Pneus',
    sampleTitle: '🛞 Alerta de Pneus: Volkswagen Gol (JKL-3456)',
    sampleBody: 'Há pneu(s) com status de desgaste crítico ou atenção precisando de avaliação.'
  },
  {
    key: 'vistoria_friday',
    number: 6,
    title: 'Lembrete de Vistoria Semanal (Sexta-Feira às 09h)',
    description: 'Agendamento automático toda sexta-feira pela manhã para cobrar fotos e vistorias dos motoristas.',
    category: 'Vistorias',
    sampleTitle: '📋 Lembrete de Vistoria Semanal',
    sampleBody: 'Hoje é sexta-feira! Lembre-se de solicitar as vistorias semanais aos motoristas da sua frota.'
  },
  {
    key: 'vistoria_scheduled_date',
    number: 7,
    title: 'Vistoria Agendada para o Dia (Data Programada)',
    description: 'Alerta enviado na data específica em que uma vistoria periódica ou de entrega/devolução foi agendada.',
    category: 'Vistorias',
    sampleTitle: '📅 Vistoria Agendada para Hoje',
    sampleBody: 'Existe uma vistoria programada para hoje em um veículo da sua frota.'
  },
  {
    key: 'vistoria_completed',
    number: 8,
    title: 'Vistoria Concluída e PDF Gerado',
    description: 'Confirmação quando uma vistoria com fotos é salva e anexada aos documentos do veículo.',
    category: 'Vistorias',
    sampleTitle: '📋 Vistoria Registrada: Hyundai HB20 (MNO-7890)',
    sampleBody: 'Vistoria concluída com sucesso e PDF anexado aos documentos do veículo.'
  },
  {
    key: 'vistoria_approved',
    number: 9,
    title: 'Vistoria Aprovada e Arquivada',
    description: 'Notificação ao aprovar um laudo de vistoria para arquivamento com documentos e contratos.',
    category: 'Vistorias',
    sampleTitle: '✅ Vistoria Aprovada & Arquivada: Hyundai HB20 (MNO-7890)',
    sampleBody: 'Laudo de vistoria aprovado e arquivado com sucesso junto a todos os documentos e contratos.'
  },
  {
    key: 'payment_registered',
    number: 10,
    title: 'Pagamento Semanal Registrado',
    description: 'Notificação ao lançar um novo pagamento semanal de aluguel recebido do motorista.',
    category: 'Financeiro e Pagamentos',
    sampleTitle: '💰 Pagamento Registrado: R$ 650,00',
    sampleBody: 'Novo pagamento semanal registrado com sucesso no controle financeiro do veículo.'
  },
  {
    key: 'receipt_received',
    number: 11,
    title: 'Novo Comprovante Pendente Recebido',
    description: 'Alerta quando um novo comprovante de pagamento é enviado pelo motorista para análise.',
    category: 'Financeiro e Pagamentos',
    sampleTitle: '🧾 Novo Comprovante Pendente de Análise',
    sampleBody: 'Um comprovante de pagamento foi anexado e aguarda sua aprovação.'
  },
  {
    key: 'receipt_approved',
    number: 12,
    title: 'Comprovante do Motorista Aprovado',
    description: 'Confirmação quando você aprova um comprovante pendente e o valor entra no caixa do veículo.',
    category: 'Financeiro e Pagamentos',
    sampleTitle: '✅ Comprovante Aprovado!',
    sampleBody: 'O comprovante do motorista foi aprovado e contabilizado nos pagamentos semanais.'
  },
  {
    key: 'caucao_updated',
    number: 13,
    title: 'Registro ou Atualização de Caução',
    description: 'Notifica quando o valor ou observação de caução de um motorista é atualizado no veículo.',
    category: 'Financeiro e Pagamentos',
    sampleTitle: '🛡️ Caução Atualizada no Veículo',
    sampleBody: 'Os dados de garantia/caução do motorista foram atualizados com sucesso.'
  },
  {
    key: 'contract_generated',
    number: 14,
    title: 'Novo Contrato de Locação Gerado',
    description: 'Confirmação ao emitir e salvar um novo contrato PDF de locação para um motorista.',
    category: 'Contratos e CNH',
    sampleTitle: '📄 Contrato de Locação Gerado',
    sampleBody: 'O contrato PDF foi gerado e anexado à pasta de documentos do veículo.'
  },
  {
    key: 'contract_expiring',
    number: 15,
    title: 'Contrato de Locação Próximo do Vencimento / Vencido',
    description: 'Alerta quando a data final de um contrato ativo está vencendo nos próximos 7 dias ou já venceu.',
    category: 'Contratos e CNH',
    sampleTitle: '⏳ Alerta de Vencimento de Contrato',
    sampleBody: 'O contrato de locação de um veículo está próximo da data final de encerramento.'
  },
  {
    key: 'contract_finalized',
    number: 16,
    title: 'Contrato Encerrado e Arquivado',
    description: 'Notificação ao finalizar um contrato ativo e arquivar o histórico completo na pasta Contratos Finalizados.',
    category: 'Contratos e CNH',
    sampleTitle: '📁 Contrato Finalizado e Arquivado',
    sampleBody: 'O contrato foi encerrado e o dossiê completo em PDF foi salvo em Contratos Finalizados.'
  },
  {
    key: 'cnh_expiring',
    number: 17,
    title: 'CNH do Motorista Vencida ou Próxima de Vencer',
    description: 'Alerta de segurança quando a CNH cadastrada para o motorista está vencida ou vence em até 30 dias.',
    category: 'Contratos e CNH',
    sampleTitle: '🪪 Alerta de CNH do Motorista!',
    sampleBody: 'A CNH do motorista responsável pelo veículo está vencida ou próxima do vencimento.'
  },
  {
    key: 'insurance_expiring',
    number: 18,
    title: 'Vencimento do Seguro do Veículo (15 dias de antecedência)',
    description: 'Alerta automático emitido com 15 dias de antecedência (ou quando vencido) para lembrar da renovação do seguro da frota.',
    category: 'Contratos e CNH',
    sampleTitle: '🛡️ Vencimento do Seguro: Chevrolet Onix (ABC-1234)',
    sampleBody: 'O seguro deste veículo vence em 15 dias! Lembre-se de cotar e renovar a apólice com a seguradora.'
  },
  {
    key: 'sinistro_logged',
    number: 19,
    title: 'Registro de Sinistro / Acidente ou Avaria',
    description: 'Alerta imediato ao registrar uma ocorrência de batida, avaria ou sinistro em um veículo da frota.',
    category: 'Operação e Sistema',
    sampleTitle: '🚨 Sinistro Registrado na Frota',
    sampleBody: 'Uma nova ocorrência de sinistro/avaria foi registrada com fotos e custos.'
  },
  {
    key: 'fuel_low_alert',
    number: 20,
    title: 'Alerta de Reserva / Combustível Baixo',
    description: 'Notifica quando o nível de combustível do veículo é registrado na reserva (≤ 1/8 do tanque).',
    category: 'Operação e Sistema',
    sampleTitle: '⛽ Alerta de Combustível na Reserva',
    sampleBody: 'O veículo foi registrado com nível crítico de combustível no tanque.'
  },
  {
    key: 'backup_completed',
    number: 21,
    title: 'Backup Completo Exportado ou Restaurado',
    description: 'Confirmação de segurança ao exportar ou restaurar um arquivo JSON de backup completo da frota.',
    category: 'Operação e Sistema',
    sampleTitle: '💾 Backup Completo da Frota Concluído',
    sampleBody: 'Todos os dados, fotos e documentos da frota foram salvos com sucesso.'
  }
];

export const DEFAULT_NOTIFICATION_PREFERENCES: Record<NotificationEventKey, boolean> = {
  maint_overdue: true,
  maint_near: true,
  maint_scheduled_date: true,
  maint_logged: true,
  vistoria_friday: true,
  vistoria_scheduled_date: true,
  vistoria_completed: true,
  vistoria_approved: true,
  payment_registered: true,
  receipt_received: true,
  receipt_approved: true,
  contract_generated: true,
  contract_expiring: true,
  contract_finalized: true,
  cnh_expiring: true,
  insurance_expiring: true,
  tire_wear_alert: true,
  sinistro_logged: true,
  fuel_low_alert: true,
  document_uploaded: true,
  caucao_updated: true,
  backup_completed: true,
  fipe_updated: true,
  fipe_monthly_sync: true
};

export function getNotificationPreferences(): Record<NotificationEventKey, boolean> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function setNotificationPreferences(prefs: Record<NotificationEventKey, boolean>): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Erro ao salvar preferências de notificações:', e);
    }
  }
}

export function isNotificationEventEnabled(eventKey?: NotificationEventKey): boolean {
  if (!eventKey) return true;
  const prefs = getNotificationPreferences();
  return prefs[eventKey] !== false;
}

export async function setupNotificationChannel() {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: 'Alertas e Lembretes da Frota',
        description: 'Notificações de revisões de manutenção, cobranças, contratos e vistorias da frota',
        importance: 5, // High importance (heads-up notification + sound)
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#34d399'
      });
    } catch (err) {
      console.warn('Erro ao configurar canal de notificação:', err);
    }
  }
}

export async function checkBatteryOptimizationExemption(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await BatteryOptimization.isIgnoringBatteryOptimizations();
      return !!res?.isIgnoring;
    } catch (err) {
      console.warn('Erro ao verificar otimização de bateria:', err);
    }
  }
  return true;
}

export async function requestIgnoreBatteryOptimization(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await BatteryOptimization.requestIgnoreBatteryOptimizations();
      await BatteryOptimization.requestScheduleExactAlarm();
    } catch (err) {
      console.warn('Erro ao solicitar exceção de otimização de bateria:', err);
    }
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('LocalNotifications.checkPermissions falhou:', err);
      return false;
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await setupNotificationChannel();
      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === 'granted';
      if (granted) {
        await requestIgnoreBatteryOptimization();
        if (isNotificationEventEnabled('vistoria_friday')) {
          await scheduleFridayInspectionNotification();
        }
      }
      return granted;
    } catch (err) {
      console.warn('LocalNotifications.requestPermissions falhou:', err);
      return false;
    }
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') return true;
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (err) {
      console.warn('Notification.requestPermission falhou:', err);
      return false;
    }
  }
  return false;
}

export async function scheduleAppNotification(
  title: string,
  options?: {
    body?: string;
    id?: number;
    at?: Date;
    extra?: Record<string, any>;
    eventKey?: NotificationEventKey;
    force?: boolean;
  }
): Promise<number> {
  if (!options?.force && options?.eventKey && !isNotificationEventEnabled(options.eventKey)) {
    return -1;
  }

  const notificationId = options?.id || Math.floor(Math.random() * 1000000) + 1;
  const targetDate = options?.at || new Date(Date.now() + 1000);

  if (Capacitor.isNativePlatform()) {
    try {
      await setupNotificationChannel();

      const notificationItem: any = {
        title,
        body: options?.body || '',
        id: notificationId,
        smallIcon: 'ic_stat_icon',
        iconColor: '#34d399',
        sound: 'default',
        channelId: CHANNEL_ID,
        extra: options?.extra,
        schedule: {
          at: targetDate,
          allowWhileIdle: true
        },
        trigger: {
          at: targetDate,
          allowWhileIdle: true
        }
      };

      await LocalNotifications.schedule({
        notifications: [notificationItem]
      });
      return notificationId;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule falhou:', capErr);
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const delay = Math.max(0, targetDate.getTime() - Date.now());
      if (delay <= 1000) {
        new Notification(title, {
          body: options?.body,
          icon: '/logo.png'
        });
      } else {
        setTimeout(() => {
          new Notification(title, {
            body: options?.body,
            icon: '/logo.png'
          });
        }, delay);
      }
    } catch (err) {
      console.warn('Web Notification falhou:', err);
    }
  }
  return notificationId;
}

export async function sendAppNotification(
  title: string,
  options?: {
    body?: string;
    id?: number;
    icon?: string;
    extra?: Record<string, any>;
    eventKey?: NotificationEventKey;
    force?: boolean;
  }
) {
  return scheduleAppNotification(title, {
    ...options,
    at: new Date(Date.now() + 500)
  });
}

export function getNextFriday9AM(): Date {
  const now = new Date();
  const result = new Date();
  result.setHours(9, 0, 0, 0);

  const dayOfWeek = now.getDay(); // 0 = Sun, 5 = Fri
  let daysUntilFriday = (5 - dayOfWeek + 7) % 7;

  if (daysUntilFriday === 0 && now.getTime() >= result.getTime()) {
    daysUntilFriday = 7;
  }

  result.setDate(now.getDate() + daysUntilFriday);
  return result;
}

export async function scheduleFridayInspectionNotification() {
  if (!isNotificationEventEnabled('vistoria_friday')) return;
  const fridayDate = getNextFriday9AM();
  await scheduleAppNotification('📋 Lembrete de Vistoria Semanal', {
    id: 888001,
    body: 'Hoje é sexta-feira! Lembre-se de solicitar as vistorias aos motoristas da sua frota.',
    at: fridayDate,
    eventKey: 'vistoria_friday'
  });
}
