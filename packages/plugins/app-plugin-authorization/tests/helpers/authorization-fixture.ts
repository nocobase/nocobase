import {
  createAuthorization as createCoreAuthorization,
  type AuthorizationContext,
  type AuthorizationDecision,
  type AuthorizationIdentity,
  type AuthorizationRequest,
} from '@nocobase/authorization/core';
import { databasePlugin } from '../../server/database/plugin.js';
import { settingsPlugin } from '../../server/settings.js';
import { uiPlugin } from '../../server/ui.js';

/**
 * Core Authorization with the `settings` and `ui` plugins installed
 * first and the authorization settings items registered.
 */
export const createAuthorization: typeof createCoreAuthorization = (
  options,
) => {
  const settings = settingsPlugin();
  const authz = createCoreAuthorization({
    ...options,
    plugins: [settings, uiPlugin(), ...options.plugins],
  });
  const api = settings.authorizationApi!.settings;
  api.add({
    id: 'authorization.permission-sets',
    title: 'Permission Sets',
    actions: ['read', 'create', 'update', 'delete', 'assign'].map((name) => ({
      name,
    })),
  });
  return authz;
};

/** The database plugin with the named collections registered. */
export function databaseTestPlugin(
  ...collections: readonly string[]
): ReturnType<typeof databasePlugin> {
  const plugin = databasePlugin();
  const setup = plugin.setup?.bind(plugin);
  return {
    ...plugin,
    setup(authz) {
      setup?.(authz);
      for (const name of collections)
        plugin.authorizationApi?.database.collections.add({
          name,
          title: name,
        });
    },
  };
}

type Checkable = { for(identity: AuthorizationIdentity): AuthorizationContext };
type Request = Omit<AuthorizationRequest<unknown>, 'params'> & {
  params?: unknown;
};

function contextOf(authz: Checkable, request: Request): AuthorizationContext {
  return authz.for({
    principal: request.principal,
    ...(request.subjects === undefined ? {} : { subjects: request.subjects }),
  });
}

/** `authz.for(identity).authorize(...)` for a request that names its identity. */
export function authorizeAs(
  authz: Checkable,
  request: Request,
): Promise<AuthorizationDecision> {
  return contextOf(authz, request).authorize<unknown>({
    resource: request.resource,
    action: request.action,
    params: request.params,
  });
}

/** `authz.for(identity).can(...)` for a request that names its identity. */
export function canAs(authz: Checkable, request: Request): Promise<boolean> {
  return contextOf(authz, request).can<unknown>({
    resource: request.resource,
    action: request.action,
    params: request.params,
  });
}

/** An in-memory rule store for any of the three rule plugins. */
export class MemoryRuleStore<TRule extends { key: string }> {
  constructor(private rules: readonly TRule[] = []) {}
  create(rule: TRule): Promise<TRule> {
    this.rules = [...this.rules, rule];
    return Promise.resolve(rule);
  }
  update(key: string, rule: TRule): Promise<TRule> {
    this.rules = this.rules.map((entry) => (entry.key === key ? rule : entry));
    return Promise.resolve(rule);
  }
  delete(key: string): Promise<void> {
    this.rules = this.rules.filter((entry) => entry.key !== key);
    return Promise.resolve();
  }
  get(key: string): Promise<TRule | undefined> {
    return Promise.resolve(this.rules.find((rule) => rule.key === key));
  }
  list(): Promise<readonly TRule[]> {
    return Promise.resolve(this.rules);
  }
  withTransaction(): this {
    return this;
  }
}
