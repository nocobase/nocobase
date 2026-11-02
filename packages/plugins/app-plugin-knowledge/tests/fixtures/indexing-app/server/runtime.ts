import authentication, {
  defineAuthConfig,
} from '@nocobase/app-plugin-authentication/server';
import authorization from '@nocobase/app-plugin-authorization/server';
import agents from '@nocobase/app-plugin-agents/server';
import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  type AppIdentityConfig,
} from '@nocobase/app-server/config';
import { defineAppDatabaseConfig } from '@nocobase/app-server/database';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  type AppRuntimeDefinition,
} from '@nocobase/app-server/runtime';
import { createKnowledgePlugin } from '../../../../server/index.js';
import type { KnowledgeIndexingExtension } from '../../../../server/indexing/index.js';
import { defineKnowledgeConfig } from '../../../../config.js';

export function createIndexingAppRuntime(
  indexingExtensions: readonly KnowledgeIndexingExtension[] = [],
  withAgents = true,
): AppRuntimeDefinition {
  return defineAppRuntime({
    createAppConfig(context) {
      const config = new AppConfig();
      const configPath =
        context.configPath ?? context.environment.APP_CONFIG_FILE;
      if (configPath) config.loadFile(context.paths.root(configPath));
      return config;
    },
    defaultConfigs: defaultAppConfigs({
      app: defineAppConfig<AppIdentityConfig>({
        defaults: {
          name: 'main',
          publicBasePath: '/main',
          internalBasePath: '',
          publicApiUrl: '/main/api',
          publicOrigin: 'http://localhost',
        },
      }),
      auth: defineAuthConfig({
        defaults: {
          secret: 'knowledge-indexing-test-secret-32-characters',
          trustedOrigins: ['http://localhost'],
          emailAndPassword: { enabled: true, autoSignIn: false },
        },
      }),
      logging: defineAppConfig({
        defaults: {
          level: 'error',
          file: { enabled: false },
          console: { enabled: false },
        },
      }),
      caching: defineAppConfig({
        defaults: {
          default: 'memory',
          providers: { memory: { driver: 'memory' } },
        },
      }),
      snowflake: defineAppConfig({ defaults: { workerId: 1 } }),
      database: defineAppDatabaseConfig(() => ({
        default: 'main',
        connections: {},
      })),
      knowledge: defineKnowledgeConfig({ indexingExtensions }),
      secrets: defineAppConfig({
        defaults: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
      }),
    }),
    plugins: defineServerPlugins([
      authentication,
      authorization,
      ...(withAgents ? [agents] : []),
      createKnowledgePlugin({ indexingExtensions }),
    ]),
    serviceProviders: [],
    routes: [],
  });
}
export default createIndexingAppRuntime();
