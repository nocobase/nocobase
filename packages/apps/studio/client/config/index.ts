import app from './app.js';
import api from './api.js';
import { defaultAppConfigs, type AppConfigFactory } from '@nocobase/app-client';
import type { AuthConfig } from '@nocobase/app-plugin-authentication/client';
import auth from './auth.js';

const defaultConfigs: AppConfigFactory<{
  auth: AuthConfig;
  app: ReturnType<typeof app>;
  api: ReturnType<typeof api>;
}> = defaultAppConfigs({
  auth,
  app,
  api,
});

export default defaultConfigs;
