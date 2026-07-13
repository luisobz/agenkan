import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.agenkan.app',
  appName: 'AgenKan',
  // The mobile app IS the web app: same bundle, wrapped in a WebView.
  webDir: '../web/dist',
  server: {
    // Allows connecting to home servers exposed over plain http://ip:port.
    cleartext: true,
    androidScheme: 'http'
  }
}

export default config
