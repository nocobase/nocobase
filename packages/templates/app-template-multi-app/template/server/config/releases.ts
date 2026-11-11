import {
  defineAppConfig,
  envBoolean,
  envInteger,
  envString,
} from '@nocobase/app-server/config';
import type { ReleasesPluginConfig } from '@nocobase/app-plugin-releases/server';

export default defineAppConfig<ReleasesPluginConfig>({
  defaults: ({ paths }) => ({
    artifact: {
      driver: 'fs',
      location: paths.storage('artifacts'),
      visibility: 'private',
    },
    dataDir: paths.storage('releases'),
    host: {
      enabled: false,
      driver: 'auto',
      host: '0.0.0.0',
      port: 13231,
      appRevisionsDir: paths.storage('host/revisions'),
      appVolumesDir: paths.storage('host/volumes'),
      configPath: paths.storage('host/config.yml'),
      controlDir: paths.storage('host/control'),
      childOutputDir: paths.storage('host/output'),
      env: { allow: ['PATH', 'LANG', 'TZ', 'NODE_ENV'] },
    },
  }),
  env: {
    EXAMPLE_HOST_ENABLED: envBoolean('host.enabled', {
      description: 'Start the one managed App Host for application instances.',
    }),
    EXAMPLE_HOST_PORT: envInteger('host.port', {
      description: 'LAN listener port of the managed App Host.',
    }),
    EXAMPLE_HOST_PUBLIC_URL: envString('host.publicUrl', {
      description: 'Public origin of the managed App Host.',
    }),
  },
});
