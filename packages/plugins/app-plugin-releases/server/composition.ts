/**
 * The plugin's services wired together, without a container: the provider builds them from the application, and tests
 * and harnesses build them directly.
 */
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import type { DatabaseManager } from '@nocobase/db';
import type { Logger } from '@nocobase/logging';

import { noPermissions } from '../shared/access.js';
import type { ActorKind } from '../shared/releases.js';
import {
  AccessGuard,
  SYSTEM_CALLER,
  narrowedByScope,
  type Caller,
} from './access/caller.js';
import type { ReleasesPluginConfig } from './config.js';
import type { DriverRegistry } from './drivers/types.js';
import { UploadTicketService } from './services/credentials.js';
import { EnvironmentService } from './services/environments.js';
import { ReleasesEventBus } from './services/events.js';
import { RegistryService } from './services/registries.js';
import { ReleasesService } from './services/releases.js';
import { DeploymentRequestService } from './services/requests.js';
import { VariableStore } from './services/variables.js';
import type { ReleasesSecrets } from './services/secrets.js';
import type { ReleasesAccess } from './tokens.js';

export interface ReleasesCompositionOptions {
  readonly database: DatabaseManager;
  readonly config: Pick<
    ReleasesPluginConfig,
    | 'artifact'
    | 'dataDir'
    | 'maxArtifactSizeMB'
    | 'logging'
    | 'uploadTicketTtlSeconds'
  >;
  readonly drivers: DriverRegistry;
  /** The application's roles; resolved on each use, so it may be bound after the plugin. */
  readonly access: () => ReleasesAccess | undefined;
  /** The application's secrets service: seals environment and registry credentials. */
  readonly secrets?: ReleasesSecrets;
  /** The application's own public base path, which no App may take. */
  readonly reservedBasePath?: string;
  /** The application's own origin (`app.publicOrigin`), which Apps served under a path of it take as theirs. */
  readonly publicOrigin?: string | null;
  readonly logger?: Logger;
}

export interface Releases {
  readonly releases: ReleasesService;
  readonly environments: EnvironmentService;
  /** Image registries: settings and their write-only pull credentials. */
  readonly registries: RegistryService;
  readonly requests: DeploymentRequestService;
  readonly tickets: UploadTicketService;
  readonly events: ReleasesEventBus;
  readonly drivers: DriverRegistry;
  readonly guard: AccessGuard;
  /** The caller for a signed-in identity: the application's permissions and actor kind. */
  callerOf(identity: AuthorizationIdentity): Promise<Caller>;
  /** The caller for a user ID, as a person, an agent or an application rule acting for them. */
  callerForUser(userId: string, kind?: ActorKind): Promise<Caller>;
  /** The plugin acting on its own (cleanup, recovery). */
  readonly system: Caller;
}

export function createReleases(options: ReleasesCompositionOptions): Releases {
  const guard = new AccessGuard(options.access);
  const events = new ReleasesEventBus(options.logger);
  const variables = new VariableStore({
    database: options.database,
    secrets: options.secrets,
  });
  // The environment service reaches the releases service through these callbacks, created right after it.
  // eslint-disable-next-line prefer-const
  let releases: ReleasesService | undefined;
  const environments = new EnvironmentService({
    database: options.database,
    drivers: options.drivers,
    guard,
    secrets: options.secrets,
    onChanged: (id) => releases!.environmentChanged(id),
    countApps: (id) => releases!.countApps(id),
    check: (id) => releases!.checkEnvironment(id),
    variables,
  });
  const registries = new RegistryService({
    database: options.database,
    guard,
    secrets: options.secrets,
  });
  releases = new ReleasesService({
    database: options.database,
    environments,
    registries,
    guard,
    events,
    artifact: options.config.artifact,
    dataDir: options.config.dataDir,
    maxArtifactBytes:
      options.config.maxArtifactSizeMB === undefined
        ? undefined
        : options.config.maxArtifactSizeMB * 1024 * 1024,
    logging: options.config.logging,
    reservedBasePath: options.reservedBasePath,
    publicOrigin: options.publicOrigin ?? null,
    variables,
    secrets: options.secrets,
    logger: options.logger,
  });
  const requests = new DeploymentRequestService({
    database: options.database,
    releases,
    environments,
    guard,
    events,
    access: options.access,
  });
  const tickets = new UploadTicketService({
    database: options.database,
    releases,
    environments,
    guard,
    defaultTtlSeconds: options.config.uploadTicketTtlSeconds,
  });
  return {
    releases,
    environments,
    registries,
    requests,
    tickets,
    events,
    drivers: options.drivers,
    guard,
    system: SYSTEM_CALLER,
    async callerOf(identity) {
      const access = options.access();
      if (identity.principal.type !== 'user')
        return { userId: null, kind: 'human', permissions: noPermissions() };
      const permissions = access
        ? await access.permissionsOf(identity)
        : noPermissions();
      const { keyScope } = identity;
      // A scoped credential (an API key with a scope, a service account's key) is a key, never a person: it may not
      // take a person-only action or deploy to a protected environment. One the
      // application names an agent's (an agent's run, bounded by its scope) acts as the agent, under the same limits.
      if (keyScope)
        return {
          userId: identity.principal.id,
          kind: access?.actorKindOf?.(identity) === 'agent' ? 'agent' : 'key',
          permissions: narrowedByScope(permissions, keyScope),
          keyScope,
        };
      return {
        userId: identity.principal.id,
        kind: access?.actorKindOf?.(identity) ?? 'human',
        permissions,
      };
    },
    callerForUser: (userId, kind) => guard.callerForUser(userId, kind),
  };
}
