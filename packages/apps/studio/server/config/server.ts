import {
  defineAppConfig,
  envBoolean,
  envInteger,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { NodeServerConfig } from '@nocobase/app-server/node';

const server: AppConfigFactory<NodeServerConfig> = defineAppConfig({
  defaults: { host: '127.0.0.1', port: 13000, startLog: true },
  env: {
    APP_SERVER_HOST: envString('host', {
      description: 'The address the server listens on.',
    }),
    APP_SERVER_PORT: envInteger('port', {
      description: 'The port the server listens on.',
    }),
    // `pnpm dev` sets it to false: it prints its own ready banner and public URL.
    APP_SERVER_START_LOG: envBoolean('startLog', {
      description: 'Whether the server logs its address once it is ready.',
    }),
  },
});

export default server;
