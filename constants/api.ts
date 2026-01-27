import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_API_PORT = 5000;

// Get your base URL for local testing
const getDeviceBaseUrl = () => {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_API_PORT}/api/v1`;
  }

  const isPhysicalDevice = Constants.isDevice;
  if (isPhysicalDevice) {
    console.warn(
      'EXPO_PUBLIC_API_URL is not set. Physical devices need a LAN URL like http://<your-ip>:5000/api/v1'
    );
  }

  if (Platform.OS === 'ios') {
    return `http://localhost:${DEFAULT_API_PORT}/api/v1`;
  }

  if (Platform.OS === 'android') {
    // Android emulator maps host localhost to 10.0.2.2
    return isPhysicalDevice
      ? `http://localhost:${DEFAULT_API_PORT}/api/v1`
      : `http://10.0.2.2:${DEFAULT_API_PORT}/api/v1`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api/v1`;
};

export const API_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ??
    (__DEV__ ? getDeviceBaseUrl() : 'https://your-production-api.com/api/v1'),
  TIMEOUT: 10000,

  // Additional device-specific URLs
  DEVICE_URLS: {
    SIMULATOR: `http://localhost:${DEFAULT_API_PORT}/api/v1`,
    ANDROID_EMULATOR: `http://10.0.2.2:${DEFAULT_API_PORT}/api/v1`,
  },
};
