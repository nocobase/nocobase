import type { AppConfigFactory } from '@nocobase/app-server/config';
import { defineApiConfig, type ApiConfig } from '@nocobase/app-server/router';

// Limits every /api request meets ahead of its route: bodyLimit, timeout and rateLimit. Each is off until config.yml
// sets it; see the commented api section in config.example.yml. API_BODY_LIMIT and API_TIMEOUT set the first two.
const api: AppConfigFactory<ApiConfig> = defineApiConfig();

export default api;
