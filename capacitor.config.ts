import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hayirhah.app',
  appName: 'Hayırhah',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  backgroundColor: '#064E3B',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeInDuration: 300,
      backgroundColor: '#064E3B',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#064E3B',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#059669',
      sound: 'adhan_chime.wav',
    },
  },
};

export default config;
