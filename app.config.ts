import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Muenot Shopkeeper', slug: 'muenot-shopkeeper', version: '1.0.0',
  scheme: 'muenot', orientation: 'portrait', userInterfaceStyle: 'light',
  icon: './assets/images/logo-mark.png',
  android: { package: 'com.muenot.shopkeeper', softwareKeyboardLayoutMode: 'resize' },
  ios: { bundleIdentifier: 'com.muenot.shopkeeper', supportsTablet: true },
  plugins: ['expo-router', 'expo-status-bar', 'expo-secure-store', ['expo-splash-screen', {
    backgroundColor: '#00583d', image: './assets/images/logo-mark.png', imageWidth: 80,
  }], ['expo-image-picker', { photosPermission: 'Choose a product photo for your shop.', microphonePermission: false }]],
  experiments: { typedRoutes: true },
};
export default config;
