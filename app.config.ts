import type { ExpoConfig } from 'expo/config';
import packageJson from './package.json';

// EAS file environment variable or a local private path. Never commit the
// Firebase service-account credentials; Android needs only google-services.json.
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON?.trim();

const config: ExpoConfig = {
  name: 'Muenot Shopkeeper',
  slug: 'muenot-shopkeeper',
  version: packageJson.version,

  scheme: 'muenot',
  orientation: 'portrait',
  userInterfaceStyle: 'light',

  icon: './assets/images/logo-mark.png',

  android: {
    package: 'com.muenot.shopkeeper',
    versionCode: 2,
    softwareKeyboardLayoutMode: 'resize',
    googleServicesFile: googleServicesFile || undefined,
    permissions: ['POST_NOTIFICATIONS', 'REQUEST_INSTALL_PACKAGES'],
  },

  ios: {
    bundleIdentifier: 'com.muenot.shopkeeper',
    supportsTablet: true,
  },

  plugins: [
    './plugins/withMuenotReleaseSigning',
    'expo-router',
    'expo-status-bar',
    'expo-secure-store',
    'expo-web-browser',

    [
      'expo-notifications',
      {
        defaultChannel: 'shopkeeper-messages',
        color: '#00583d',
      },
    ],

    [
      'expo-splash-screen',
      {
        backgroundColor: '#00583d',
        image: './assets/images/logo-mark.png',
        imageWidth: 80,
      },
    ],

    [
      'expo-image-picker',
      {
        photosPermission: 'Choose a product photo for your shop.',
        microphonePermission: false,
      },
    ],
  ],

  extra: {
    eas: {
      projectId: 'b100832b-6df4-4253-94c1-e12e1dfc4742',
    },
  },

  experiments: {
    typedRoutes: true,
  },
};

export default config;
