import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { GitConnections } from './connections.js';
import type { PullRequestEvents, RepoEvents } from './events.js';
import type { GitPoller } from './poller.js';
import type { StudioGit } from './service.js';

/** Studio's pull requests as its routes reach them, bound by `StudioGitProvider`. */
export interface StudioGitBinding {
  /** The service, once the projects plugin is there (resolved at boot). */
  readonly git: () => StudioGit;
  /** The workspace's connections and people's own authorizations. */
  readonly connections: () => GitConnections;
  /** A signed-in person as the projects plugin sees them. */
  readonly viewerOf: (userId: string) => Promise<Viewer>;
  /** A request's caller (`callerOfRequest`): a person narrowed by their key's scope, or a run by its agent's actions. */
  readonly callerViewerOf: (identity: CallerIdentity) => Promise<Viewer>;
  /** What a person may do with the connections (`studio.git` `read` and `manage`). */
  readonly gitSettings: (
    userId: string,
  ) => Promise<{ readonly read: boolean; readonly manage: boolean }>;
  /** Where the host sends a person back after they authorize an app (absolute with `app.publicOrigin`). */
  readonly callbackUrl: () => string;
  /** A path on Studio as the host must see it: absolute with `app.publicOrigin`, else the path alone. */
  readonly absoluteUrl: (path: string) => string;
  /** `app.publicOrigin`, when configured. */
  readonly publicOrigin: () => string | null;
  /** An application path with the deployment's base path, for redirects. */
  readonly appPath: (path: string) => string;
  readonly poller: GitPoller;
  /** Pull requests stored and linked (resolved at boot). */
  readonly events: () => PullRequestEvents;
  /** Pushes and workflow runs webhooks delivered (resolved at boot). */
  readonly repoEvents: () => RepoEvents;
}

export const studioGitToken: ServiceToken<StudioGitBinding> =
  createServiceToken<StudioGitBinding>('studio/git');
