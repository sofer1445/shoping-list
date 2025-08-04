import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e06212b818db4fda998876613c1ee17d',
  appName: 'shopping-list',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://e06212b8-18db-4fda-9988-76613c1ee17d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;