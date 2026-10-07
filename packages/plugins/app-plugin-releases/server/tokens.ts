/**
 * The plugin's service tokens and the ports the assembling application binds. The plugin knows nothing about who the
 * people are or what roles they hold: the application decides each caller's `ReleasesPermissions`
 * (`releasesAccessToken`), may widen what "related" means, resolves approvers and marks agents, registers deployment
 * drivers (`releasesDriversToken`) and hears what happens (`releasesEventsToken`).
 */
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { AppAction, ReleasesPermissions } from '../shared/access.js';
import type {
  ActorKind,
  AppView,
  DeploymentRequestView,
  DeploymentView,
  EnvironmentRecord,
  ReleaseView,
} from '../shared/releases.js';
import type { DriverRegistry } from './drivers/types.js';
import type { Releases } from './composition.js';

/**
 * Roles as the plugin needs them. The application keeps the roles and binds this token; unbound, every caller holds
 * nothing.
 */
export interface ReleasesAccess {
  /** What a signed-in caller may do, decided once per request. */
  permissionsOf(identity: AuthorizationIdentity): Promise<ReleasesPermissions>;
  /**
   * What a user may do when they are not the caller: the issuer of an upload ticket when it is used, and an approver
   * deciding a request.
   */
  permissionsOfUser(userId: string): Promise<ReleasesPermissions>;
  /**
   * Whether the caller is a person or an agent acting for one. Agents are refused `deploy-protected`, `configure`
   * and `delete` whatever they hold, and never decide a deployment request. Defaults to `human`. Asked for a
   * scoped identity too: `agent` makes it an agent's (such as an agent's run bounded by its scope) rather than a key's.
   */
  actorKindOf?(identity: AuthorizationIdentity): 'human' | 'agent';
  /** Apps beyond the ones the users created that count as related to any of them for an action (for listing). */
  relatedAppIds?(
    userIds: readonly string[],
    action: AppAction,
  ): Promise<readonly string[]>;
  /** Whether one App counts as related to any of the users for an action, beyond the ones they created. */
  isRelated?(
    appId: string,
    userIds: readonly string[],
    action: AppAction,
  ): Promise<boolean>;
  /**
   * The user IDs who may decide a deployment request. Defaults to the environment's `approvers` taken as user IDs;
   * with none, anyone holding `deploy-protected` on the App (`deploy` on an unprotected environment), other than the
   * requester, may decide.
   */
  approversOf?(
    environment: EnvironmentRecord,
    request: DeploymentRequestView,
  ): Promise<readonly string[]>;
}

export const releasesAccessToken: ServiceToken<ReleasesAccess> =
  createServiceToken<ReleasesAccess>('@nocobase/app-plugin-releases/access');

/** The deployment drivers environments may name; the plugin registers `host` when its Host runtime is enabled. */
export const releasesDriversToken: ServiceToken<DriverRegistry> =
  createServiceToken<DriverRegistry>('@nocobase/app-plugin-releases/drivers');

/**
 * The local App Host runtime, for an application listener that forwards Host traffic (requests outside its own
 * mount). `proxyTarget` is null while the Host is disabled or not ready.
 */
export interface ReleasesHostRuntime {
  proxyTarget(): URL | null;
}

export const releasesHostToken: ServiceToken<ReleasesHostRuntime> =
  createServiceToken<ReleasesHostRuntime>('@nocobase/app-plugin-releases/host');

/** Who performed an operation, as events report it. */
export interface ActorRef {
  readonly userId: string | null;
  readonly kind: ActorKind;
}

/**
 * What happened, after it was committed. Deployments report once they finish; `deployment.rolledBack` replaces
 * `deployment.succeeded` for a successful rollback. A request event carries the approvers so the application can
 * notify them; the plugin sends no notifications itself.
 */
export type ReleasesEvent =
  | {
      readonly type: 'app.created';
      readonly app: AppView;
      readonly actor: ActorRef;
    }
  | {
      readonly type: 'app.removed';
      readonly app: AppView;
      readonly actor: ActorRef;
    }
  | {
      readonly type: 'release.created';
      readonly app: AppView;
      readonly release: ReleaseView;
      readonly actor: ActorRef;
    }
  | {
      readonly type: 'deployment.succeeded' | 'deployment.rolledBack';
      readonly app: AppView;
      readonly deployment: DeploymentView;
      readonly release: ReleaseView;
      readonly actor: ActorRef;
    }
  | {
      readonly type: 'deployment.failed';
      readonly app: AppView;
      readonly deployment: DeploymentView;
      readonly release: ReleaseView;
      readonly error: string;
      readonly actor: ActorRef;
    }
  | {
      readonly type: 'request.created';
      readonly app: AppView;
      readonly request: DeploymentRequestView;
      readonly approvers: readonly string[];
      readonly actor: ActorRef;
    }
  | {
      readonly type: 'request.decided';
      readonly app: AppView;
      readonly request: DeploymentRequestView;
      readonly decision: 'approved' | 'rejected' | 'cancelled';
      readonly actor: ActorRef;
    };

export type ReleasesEventListener = (
  event: ReleasesEvent,
) => void | Promise<void>;

/** Where the application listens; a listener's failure is logged and never undoes the operation. */
export interface ReleasesEvents {
  subscribe(listener: ReleasesEventListener): () => void;
}

export const releasesEventsToken: ServiceToken<ReleasesEvents> =
  createServiceToken<ReleasesEvents>('@nocobase/app-plugin-releases/events');

/** The plugin's services, for an application that calls them in process (a preview service, a CLI command). */
export const releasesToken: ServiceToken<Releases> =
  createServiceToken<Releases>('@nocobase/app-plugin-releases/releases');
