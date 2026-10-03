import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'fleet_notifications';

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

export async function sendAppNotification(
  title: string, 
  options?: { 
    body?: string; 
    id?: number; 
    icon?: string;
    extra?: Record<string, any>;
  }
) {
  if (Capacitor.isNativePlatform()) {
    try {
      await setupNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: options?.id || Math.floor(Math.random() * 1000000) + 1,
            smallIcon: 'ic_stat_icon',
            iconColor: '#34d399',
            sound: 'default',
            channelId: CHANNEL_ID,
            extra: options?.extra
          }
        ]
      });
      return;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule falhou:', capErr);
    }
  } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/logo.png'
      });
    } catch (err) {
      console.warn('Web Notification falhou:', err);
    }
  }
}
