import type { AppConfigFactory } from '@nocobase/app-server/config';
import { definePwaConfig, type PwaConfig } from '@nocobase/app-server/spa';

// Installation as a standalone app. The name follows client.app.title unless pwa.name is set; see config.example.yml.
const pwa: AppConfigFactory<PwaConfig> = definePwaConfig();

export default pwa;
