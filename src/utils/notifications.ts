import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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

export async function sendAppNotification(title: string, options?: { body?: string; id?: number; icon?: string }) {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: options?.id || Math.floor(Math.random() * 1000000) + 1,
            smallIcon: 'ic_stat_icon',
            iconColor: '#34d399',
            sound: 'default'
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
