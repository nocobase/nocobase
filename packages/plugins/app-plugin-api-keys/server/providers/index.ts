import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
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
import { scopedApiKeysToken } from '../tokens.js';

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
    if (container.has(authorizationToken))
      registerApiKeySettings(container.resolve(authorizationToken));
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
