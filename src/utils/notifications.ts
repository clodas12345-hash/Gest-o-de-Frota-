import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function setupNotificationChannel() {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'default',
        name: 'Alertas e Lembretes',
        description: 'Notificações de revisões, metas e fechamentos da frota',
        importance: 5, // High importance: popup / heads-up notification
        visibility: 1, // Public on lockscreen
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#34d399'
      });
    } catch (e) {
      console.warn('LocalNotifications.createChannel falhou:', e);
    }
  }
}

// Inicializa o canal na carga do módulo
setupNotificationChannel();

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
      let status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        status = await LocalNotifications.requestPermissions();
      }
      return status.display === 'granted';
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

export interface ScheduleNotificationOptions {
  id?: number;
  body?: string;
  icon?: string;
  scheduleAt?: Date;
  every?: 'year' | 'month' | 'two-weeks' | 'week' | 'day' | 'hour' | 'minute';
  count?: number;
}

/**
 * Agenda notificações que disparam mesmo com o aplicativo fechado no Android através do AlarmManager
 */
export async function scheduleAppNotification(
  title: string,
  options: ScheduleNotificationOptions
): Promise<boolean> {
  const notifId = options?.id || Math.floor(Math.random() * 1000000) + 1;
  const notifBody = options?.body || '';

  if (Capacitor.isNativePlatform()) {
    try {
      await setupNotificationChannel();

      // Checa/solicita permissão
      let status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        status = await LocalNotifications.requestPermissions();
      }

      const scheduleConfig: any = {
        allowWhileIdle: true // Permite disparar mesmo com o app fechado ou dispositivo em modo de economia/doze
      };

      if (options.scheduleAt) {
        scheduleConfig.at = options.scheduleAt;
      }
      if (options.every) {
        scheduleConfig.every = options.every;
      }
      if (options.count) {
        scheduleConfig.count = options.count;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: notifBody,
            id: notifId,
            channelId: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#34d399',
            sound: 'default',
            schedule: scheduleConfig
          }
        ]
      });
      return true;
    } catch (err) {
      console.warn('Erro ao agendar notificação nativa:', err);
    }
  }

  // Fallback para navegador
  if (options.scheduleAt) {
    const delay = options.scheduleAt.getTime() - Date.now();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        sendAppNotification(title, { body: notifBody, id: notifId, icon: options.icon });
      }, delay);
    }
  } else {
    sendAppNotification(title, { body: notifBody, id: notifId, icon: options.icon });
  }
  return false;
}

export async function sendAppNotification(title: string, options?: { body?: string; id?: number; icon?: string }) {
  const notifId = options?.id || Math.floor(Math.random() * 1000000) + 1;
  const notifBody = options?.body || '';

  if (Capacitor.isNativePlatform()) {
    try {
      await setupNotificationChannel();

      // Garante que a permissão foi concedida
      let status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        status = await LocalNotifications.requestPermissions();
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: notifBody,
            id: notifId,
            channelId: 'default',
            smallIcon: 'ic_stat_icon',
            iconColor: '#34d399',
            sound: 'default'
          }
        ]
      });
      return;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule falhou, tentando fallback simples:', capErr);
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body: notifBody,
              id: notifId
            }
          ]
        });
        return;
      } catch (e2) {
        console.error('Falha crítica ao agendar notificação nativa:', e2);
      }
    }
  }

  // Fallback para Web / PWA / Navegador móvel
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
      }

      // Se houver ServiceWorker registrado (recomendado para Android Chrome/PWA)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body: notifBody,
              icon: options?.icon || '/logo.png',
              badge: '/favicon.png',
              tag: `fleet-notif-${notifId}`
            } as NotificationOptions);
            return;
          }
        } catch (swErr) {
          console.warn('ServiceWorker.showNotification falhou, tentando new Notification:', swErr);
        }
      }

      // Fallback padrão de Notification da janela
      new Notification(title, { 
        body: notifBody,
        icon: options?.icon || '/logo.png',
        badge: '/favicon.png'
      });
    } catch (err) {
      console.warn('Web Notification falhou:', err);
    }
  }
}

/**
 * Solicita a permissão de notificações na primeira abertura do app e agenda alertas recorrentes
 */
export async function initAppNotificationsOnFirstLaunch(): Promise<boolean> {
  try {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      // Agenda lembrete de vistoria de toda sexta-feira às 09:00 mesmo com app fechado
      const nextFriday = new Date();
      const dayOfWeek = nextFriday.getDay();
      const daysUntilFriday = (5 + 7 - dayOfWeek) % 7;
      nextFriday.setDate(nextFriday.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
      nextFriday.setHours(9, 0, 0, 0);

      await scheduleAppNotification('📋 Lembrete de Vistoria Semanal', {
        id: 5001,
        body: 'Sexta-feira é dia de vistoria! Lembre-se de enviar os links de vistoria para os motoristas da frota.',
        scheduleAt: nextFriday,
        every: 'week'
      });
    }
    return granted;
  } catch (e) {
    console.warn('Erro ao inicializar permissão na primeira abertura:', e);
  }
  return false;
}
