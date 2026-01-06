import axios from 'axios';
import { config } from '../config/env.js';

/**
 * Creates a configured axios client for the OneSearch API
 * Safe to call at module level - config is validated on import
 *
 * @returns Configured axios instance with base URL and authentication headers
 */
export function createApiClient() {
  return axios.create({
    baseURL: config.api.baseUrl,
    timeout: 10_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      apikey: config.api.key,
      apiuser: config.api.user,
    },
  });
}

/**
 * Shared axios instance for OneSearch API
 * Safe to use at module level because config validation happens before this module loads
 */
export const apiClient = createApiClient();
