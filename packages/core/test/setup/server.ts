import { initEnv } from '@nocobase/cli-v1';

process.env.APP_ENV_PATH = process.env.APP_ENV_PATH || '.env.test';

initEnv();
