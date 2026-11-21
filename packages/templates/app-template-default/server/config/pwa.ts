import type { AppConfigFactory } from '@nocobase/app-server/config';
import { definePwaConfig, type PwaConfig } from '@nocobase/app-server/spa';

// Installation as a standalone app. The name follows client.app.title unless pwa.name is set; see config.example.yml.
// The colors match the brand color and light background of index.html; change them with the icons.
const pwa: AppConfigFactory<PwaConfig> = definePwaConfig({
  themeColor: '#002ad1',
  backgroundColor: '#ffffff',
});

export default pwa;
