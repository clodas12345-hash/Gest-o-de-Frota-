import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'fleet_notifications';
const BatteryOptimization = registerPlugin<any>('BatteryOptimization');

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
        await scheduleFridayInspectionNotification();
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
  }
): Promise<number> {
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
  const fridayDate = getNextFriday9AM();
  await scheduleAppNotification('📋 Lembrete de Vistoria Semanal', {
    id: 888001,
    body: 'Hoje é sexta-feira! Lembre-se de solicitar as vistorias aos motoristas da sua frota.',
    at: fridayDate
  });
}
