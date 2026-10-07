import { randomBytes } from 'node:crypto';

import type { Hono } from 'hono';
import {
  createSessionManager,
  createSessionMiddleware,
  type AppSessionConfig,
} from '@nocobase/session';
import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';

import { assertSecretIsNotPlaceholder } from '../config/placeholder-secret.js';
import type { AppPluginApplication } from '../plugins/index.js';
import {
  defineHttpMiddleware,
  type AppHttpMiddleware,
} from '../router/index.js';
import { secretsServiceToken } from '../secrets/token.js';
import { type AppSessionConfigInput } from './config.js';
import { sessionManagerToken } from './token.js';

export class SessionProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/session';
  private readonly ephemeralSecret: string =
    randomBytes(32).toString('base64url');

  public override register(): void {
    this.app.container.singleton(sessionManagerToken, (container) =>
      createSessionManager(
        resolveAppSessionConfig(
          this.app.config.get<AppSessionConfigInput>('session')!,
          this.fallbackSecrets(container),
        ),
      ),
    );
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(sessionManagerToken)?.dispose();
  }

  /**
   * The cookie keys used when `session.secret` is not set: derived from the secrets keys, current first, so adding a
   * key keeps existing cookies readable. Without secrets keys, a key made up for this process.
   */
  private fallbackSecrets(container: ServiceResolver): AppSessionSecrets {
    if (container.has(secretsServiceToken)) {
      const secrets = container.resolve(secretsServiceToken);
      if (secrets.ready) {
        const [current, ...previous] = secrets.keyring(SESSION_COOKIE_PURPOSE);
        return {
          secret: current.value,
          previousSecrets: previous.map((entry) => entry.value),
        };
      }
    }
    return { secret: this.ephemeralSecret, previousSecrets: [] };
  }
}

/** The purpose session cookie keys are derived for from the secrets keys. */
export const SESSION_COOKIE_PURPOSE = '@nocobase/session/cookie';

/** The keys a session cookie is encrypted with when `session.secret` is not set. */
export interface AppSessionSecrets {
  readonly secret: string;
  readonly previousSecrets: readonly string[];
}

export function resolveAppSessionConfig(
  configured: AppSessionConfigInput,
  fallback: string | AppSessionSecrets,
): AppSessionConfig {
  const { gcLottery: configuredGcLottery, secret, ...rest } = configured;
  // Before the fallback below, because a placeholder is a value that was configured rather than one that was left
  // unset, and silently replacing it with an ephemeral secret would hide the mistake rather than report it.
  assertSecretIsNotPlaceholder(secret, 'session.secret');
  const gcLottery = configuredGcLottery ?? { hits: 2, total: 100 };
  if (gcLottery.hits > gcLottery.total) {
    throw new Error(
      'session.gcLottery.hits must not exceed session.gcLottery.total.',
    );
  }
  const derived =
    typeof fallback === 'string'
      ? { secret: fallback, previousSecrets: [] }
      : fallback;
  return {
    ...rest,
    ...(secret
      ? { secret }
      : {
          secret: derived.secret,
          previousSecrets: [
            ...derived.previousSecrets,
            ...(rest.previousSecrets ?? []),
          ],
        }),
    gcLottery: [gcLottery.hits, gcLottery.total],
  };
}

export const sessionHttpMiddleware: AppHttpMiddleware<AppPluginApplication> =
  defineHttpMiddleware({
    name: '@nocobase/app-server/session/http',
    register(router: Hono, app: AppPluginApplication): void {
      router.use(
        '*',
        createSessionMiddleware(app.container.resolve(sessionManagerToken)),
      );
    },
  });
