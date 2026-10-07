import {
  defineAppConfig,
  envString,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { AppSessionConfigInput } from '@nocobase/app-server/session';

const session: AppConfigFactory<AppSessionConfigInput> = defineAppConfig({
  env: {
    SESSION_SECRET: envString('secret', {
      description:
        'The legacy session signing secret; keys are derived from SECRETS_KEYS when it is set.',
      secret: true,
      generate: 'secret',
    }),
  },
  defaults: ({ paths, env }) => ({
    enabled: true,
    default: 'memory',
    cookie: {
      name: 'nocobase_session',
      path: '/',
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
      partitioned: false,
      expireOnClose: false,
    },
    lifetime: {
      absolute: '2h',
      rolling: true,
    },
    previousSecrets: [],
    gcLottery: { hits: 2, total: 100 },
    stores: {
      memory: {
        driver: 'memory',
        base: 'nocobase:session:',
      },
      fs: {
        driver: 'fs',
        base: paths.storage('sessions'),
      },
      redis: {
        driver: 'redis',
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        base: 'nocobase:session:',
        tls: false,
      },
      null: { driver: 'null' },
    },
  }),
});

export default session;
