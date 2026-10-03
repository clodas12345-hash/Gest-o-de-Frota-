import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.controle.frota',
  appName: 'Gestão de Frota',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_launcher',
      iconColor: '#34d399',
      sound: 'default'
    }
  }
};

export default config;
