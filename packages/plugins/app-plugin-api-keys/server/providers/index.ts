import {
  authenticationToken,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication/server';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type {
  AppPluginApplication,
  AppPluginProviderConstructor,
} from '@nocobase/app-server/plugins';
import { loggingToken } from '@nocobase/app-server/logging';
import { apiDocsToken } from '@nocobase/app-server/router';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  createApiKeyApiDocsAccess,
  createApiKeySecurityFragment,
} from '../api-docs.js';
import {
  connectOwnKeyPolicy,
  ScopedApiKeys,
  type ApiKeysConfig,
} from '../scoped-keys.js';
import { registerApiKeySettings } from '../settings.js';
import { apiKeyScopesToken, createApiKeyScopes } from '../scopes.js';
import { IdleKeys, type IdleReminder } from '../idle.js';
import { MemberKeys } from '../member-keys.js';
import { SystemApiKeys } from '../system-keys.js';
import {
  idleApiKeysToken,
  memberApiKeysToken,
  scopedApiKeysToken,
  systemApiKeysToken,
} from '../tokens.js';

/** The scheduler target that sweeps idle keys, and the schedule that runs it once a day. */
const IDLE_TARGET = 'api-keys.idle';
const DEFAULT_INBOX_CHANNEL = 'inbox';

/**
 * Binds the key-scope registry and the scoped-key service, and at boot teaches authentication and authorization to
 * recognize a scoped key: `auth.required()` refuses one unless the route opts in, and the authorization identity of a
 * request made with one carries its `keyScope`. Also lets a request carrying a valid API key read the application's API
 * documentation, and adds the API key header to the document as a security scheme.
 */
export class ApiKeysProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-api-keys';
  private readonly releases: (() => void)[] = [];
  private booted = false;
  private upgrade: Promise<void> | undefined;

  public override register(): void {
    const { container } = this.app;
    container.singleton(apiKeyScopesToken, () => createApiKeyScopes());
    container.singleton(
      scopedApiKeysToken,
      (resolver) =>
        new ScopedApiKeys({
          auth: resolver.resolve(authenticationToken),
          connection: () => resolver.resolve(databaseManagerToken).connection(),
          scopes: resolver.resolve(apiKeyScopesToken),
          authorization: () =>
            container.has(authorizationToken)
              ? resolver.resolve(authorizationToken)
              : undefined,
          config: () => this.app.config.get<ApiKeysConfig>('apiKeys'),
        }),
    );
    container.singleton(
      systemApiKeysToken,
      (resolver) =>
        new SystemApiKeys({
          connection: () => resolver.resolve(databaseManagerToken).connection(),
          keys: resolver.resolve(scopedApiKeysToken),
          users: () => resolver.resolve(userAdministrationServiceToken),
          authorization: () =>
            container.has(authorizationToken)
              ? resolver.resolve(authorizationToken)
              : undefined,
        }),
    );
    container.singleton(
      memberApiKeysToken,
      (resolver) =>
        new MemberKeys({
          connection: () => resolver.resolve(databaseManagerToken).connection(),
          keys: resolver.resolve(scopedApiKeysToken),
        }),
    );
    container.singleton(
      idleApiKeysToken,
      (resolver) =>
        new IdleKeys({
          connection: () => resolver.resolve(databaseManagerToken).connection(),
          config: () => this.app.config.get<ApiKeysConfig>('apiKeys'),
          systemKeys: resolver.resolve(systemApiKeysToken),
          remind: (reminder) => this.remind(reminder),
        }),
    );
  }

  /** Tells a key's person or owner, in the in-app inbox, that it is disabled soon unless used, or expires soon. */
  private async remind(reminder: IdleReminder): Promise<void> {
    const { container } = this.app;
    if (!container.has(notificationServiceToken)) return;
    const channel =
      this.app.config.get<ApiKeysConfig>('apiKeys')?.inboxChannel ??
      DEFAULT_INBOX_CHANNEL;
    const name = reminder.keyName ?? 'API key';
    const day = reminder.disableAt.toISOString().slice(0, 10);
    await container.resolve(notificationServiceToken).send({
      idempotencyKey: `api-keys:${reminder.kind}:${reminder.keyId}:${day}`,
      source: { type: 'api-keys', referenceId: reminder.keyId },
      messages: {
        [channel]: {
          to: [reminder.userId],
          title:
            reminder.kind === 'expiry'
              ? `The API key “${name}” expires soon`
              : `The API key “${name}” will be disabled`,
          body:
            reminder.kind === 'expiry'
              ? `“${name}” expires on ${day}. Rotate it before then to keep it working.`
              : `“${name}” has not been used for a while. Unless it is used, it is disabled on ${day}.`,
          target: {
            type: 'route',
            path: reminder.system
              ? '/settings/api-keys'
              : `/me/api-keys/${encodeURIComponent(reminder.keyId)}`,
          },
        },
      },
    });
  }

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (
      this.booted ||
      !container.has(authenticationToken) ||
      !container.has(databaseManagerToken)
    )
      return;
    this.booted = true;
    if (container.has(apiDocsToken)) {
      const apiDocs = container.resolve(apiDocsToken);
      const resolveAuth = () => container.resolve(authenticationToken);
      apiDocs.addAccess(createApiKeyApiDocsAccess(resolveAuth));
      // Resolved on the first request for the document, like the access check, so starting the application builds nothing.
      apiDocs.addFragment(() => createApiKeySecurityFragment(resolveAuth));
    }
    const keys = container.resolve(scopedApiKeysToken);
    const auth = container.resolve(authenticationToken);
    this.releases.push(await connectOwnKeyPolicy(auth, keys));
    this.releases.push(
      auth.addScopedCredentialCheck(
        async (session, request) =>
          (await keys.resolve(session, request)) !== null,
      ),
    );
    if (container.has(authorizationToken)) {
      registerApiKeySettings(container.resolve(authorizationToken));
      const systemKeys = container.resolve(systemApiKeysToken);
      // Sets an application had named in the reserved prefix before it was reserved keep working as they are: the
      // upgrade listed them once, so every process leaves out the same ones, whenever it starts.
      const logger = container.has(loggingToken)
        ? container.resolve(loggingToken).getLogger('api-keys')
        : undefined;
      let exempt: string[] = [];
      try {
        exempt = await systemKeys.exemptions();
        if (exempt.length)
          logger?.info(
            { permissionSets: exempt },
            'Permission sets named in the prefix reserved for system keys before it was reserved keep working as they are; no system key takes their names',
          );
      } catch (error) {
        logger?.error(
          { error: error instanceof Error ? error.message : String(error) },
          'Could not read the permission sets left out of the prefix reserved for system keys; every set in it is protected as a system key’s',
        );
      }
      systemKeys.protectAll(exempt);
      this.releases.push(() => systemKeys.release());
      // The permission inspector checks a key as a request made with it: `{ type: 'apiKey', id: <key id> }`.
      this.releases.push(
        container
          .resolve(authorizationToken)
          .inspector.identities.add('apiKey', (id) => keys.inspectKey(id)),
      );
    }
    if (container.has(schedulerServiceToken)) {
      const scheduler = container.resolve(schedulerServiceToken);
      const idle = container.resolve(idleApiKeysToken);
      scheduler.registerTarget({
        type: IDLE_TARGET,
        title: 'Disable idle API keys and remind about expiring ones',
        validate: () => ({ valid: true }),
        start: async () => ({
          state: 'completed',
          outcome: 'succeeded',
          result: { ...(await idle.sweep()) },
        }),
      });
      scheduler.defineSchedule({
        key: IDLE_TARGET,
        title: 'Disable idle API keys',
        description:
          'Reminds about and disables API keys nobody uses, by the idle rule each key took when issued or rotated; tells system key owners about keys expiring within a week; delivers notices to managers of managed keys that failed before.',
        schedule: { cron: '0 3 * * *' },
        target: { type: IDLE_TARGET, config: {} },
      });
    }
    if (container.has(authorizationToken))
      container.resolve(authorizationToken).use(async (request, next) => {
        // Every plugin has booted by the first request, so every deprecated scope group is registered: keys still in
        // format 1 convert then, in the background, as they are enforced today.
        this.upgrade ??= this.upgradeLegacyScopes(keys);
        const session: unknown = request.http.get('auth' as never);
        if (session && typeof session === 'object' && 'session' in session) {
          // Any key, with permissions or not, so that no key takes an action a person's only.
          const scope = await keys.credentialScope(
            session as Parameters<typeof keys.resolve>[0],
            request.http.req.raw,
          );
          if (scope) request.keyScope = scope;
        }
        await next();
      });
  }

  /**
   * Converts the keys still in format 1, logging a summary when any is left behind: counts and key ids only, never
   * permissions or secrets. A key left in format 1 still works as before; the next start tries again.
   */
  private async upgradeLegacyScopes(keys: ScopedApiKeys): Promise<void> {
    const { container } = this.app;
    const logger = container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('api-keys')
      : undefined;
    try {
      const summary = await keys.upgradeLegacyScopes();
      if (summary.failed > 0 || summary.kept > 0)
        logger?.warn(
          { ...summary },
          'Some API keys stay in the deprecated permission format; they keep working and are tried again on the next start',
        );
      else if (summary.converted > 0)
        logger?.info(
          { converted: summary.converted },
          'Converted API keys to the current permission format',
        );
    } catch (error) {
      logger?.warn(
        { error: error instanceof Error ? error.name : 'unknown' },
        'Converting API keys to the current permission format failed; they keep working and are tried again on the next start',
      );
    }
  }

  public override async shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    await this.upgrade;
  }
}

export const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ApiKeysProvider,
];

export default serviceProviders;
