import { appConfig } from '@/constants/config';

/** API transport foundation. ERP paths are deliberately not defined before API handoff. */
export const apiClient = {
  baseUrl: appConfig.apiBaseUrl,
  isConfigured: Boolean(appConfig.apiBaseUrl),
};
