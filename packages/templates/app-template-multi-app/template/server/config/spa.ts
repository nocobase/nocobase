import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { SpaConfig } from '@nocobase/app-server/spa';

const spa: AppConfigFactory<SpaConfig> = defineAppConfig({
  defaults: ({ paths }) => ({
    indexPath: paths.client('index.html'),
  }),
  env: {
    // The Vite dev server `pnpm dev` proxies to; `false` or `0` serves the built client instead.
    APP_VITE_DEV_URL: {
      path: 'viteDevUrl',
      description:
        'The Vite dev server pnpm dev proxies the client to; false or 0 serves the built client.',
      required: false,
      parse: (value): string | null =>
        value === 'false' || value === '0' ? null : value,
    },
  },
});

export default spa;
