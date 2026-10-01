import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { HubPluginConfig } from '@nocobase/app-plugin-hub/server';

const hub: AppConfigFactory<HubPluginConfig> = defineAppConfig(
  ({ paths, env }) => ({
    publicHostUrl: '/',
    desiredConfigsDir: paths.storage('hub/desired-configs'),
    uploadsDir: paths.storage('hub/uploads'),
    logging: {
      deployments: {
        directory: paths.storage('hub/logs/deployments'),
        enabled: true,
        retentionDays: 30,
        maxFileSizeMB: 50,
        maxTotalSizeMB: 1024,
      },
      apps: {
        level: 'info',
        file: {
          enabled: true,
          name: 'app',
          retentionDays: 7,
          maxFileSizeMB: 10,
          maxTotalSizeMB: 500,
        },
        console: { enabled: true, pretty: env.NODE_ENV !== 'production' },
      },
    },
    artifact: {
      driver: 'fs',
      location: paths.storage('apps/artifacts'),
      visibility: 'private',
    },
    host: {
      enabled: true,
      driver: env.NODE_ENV === 'production' ? 'node' : 'auto',
      appRevisionsDir: paths.storage('apps/revisions'),
      appVolumesDir: paths.storage('apps/volumes'),
      configPath: paths.storage('host/runtime/config.yml'),
      childOutputDir: paths.storage('host/logs/child-output'),
      logging: {
        file: {
          directory: paths.storage('host/logs/host'),
        },
      },
      host: '127.0.0.1',
      startTimeoutMs: 30000,
      ipcTimeoutMs: 300000,
      shutdownTimeoutMs: 30000,
      autoRestart: true,
      maxAutomaticRestarts: 5,
      automaticRestartWindowMs: 60000,
      automaticRestartBaseDelayMs: 250,
    },
  }),
);

export default hub;
