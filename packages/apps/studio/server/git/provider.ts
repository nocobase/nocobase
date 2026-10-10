/**
 * Studio's pull requests (`bind.ts`): binds them at boot and polls the code host once the application is ready; its
 * webhooks reach them through `gitWebhookRoutes` (`routes.ts`). The code hosts are the providers registered here
 * (`providers.ts`): GitHub (`github.ts`), which covers GitHub Enterprise Server by its address.
 *
 * Boots before `StudioAgentsProvider` (`server/providers/index.ts`), so the workflow event `studio.merged` is registered
 * before the "Software development" template that names it is installed.
 *
 * Configuration (`studio.git`, all optional):
 *
 * - `pollIntervalSeconds`: how often a watched repository is polled (60).
 * - `webhookPollSeconds`: how often one whose webhook works is polled, as a fallback for a lost delivery (600).
 * - `apiBaseUrls`: the REST API of a host, by host (`{ "github.example.com": "https://github.example.com/api/v3" }`);
 *   github.com and the GitHub Enterprise convention `<origin>/api/v3` need none.
 * - `poll`: false stops polling (tests, a second instance).
 *
 * Once ready it also schedules the hourly purge of expired webhook delivery ids (`delivery-purge.job.ts`).
 */
import {
  projectsAccessToken,
  projectsNoticeRulesToken,
  projectsStatusRulesToken,
  projectsToken,
  projectsWorkflowEventsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { databaseManagerToken } from '@nocobase/db';
import {
  realtimeServiceToken,
  type DefinedRealtimeTopic,
} from '@nocobase/app-server/realtime';
import { ServiceProvider } from '@nocobase/service-provider';

import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { userPreferencesServiceToken } from '@nocobase/app-plugin-users/server/tokens';

import { STUDIO_GIT_TOPIC, type StudioGitEvent } from '../../shared/git.js';

import { createPermissionSource } from '../agents/commands/permissions.js';
import {
  createAskerLookup,
  type AskerLookup,
} from '../agents/conversation/acting.js';
import { studioAccessToken } from '../access/token.js';
import { studioInboxPortToken } from '../inbox/port.js';
import { bindStudioGit } from './bind.js';
import { GIT_JOBS_SCOPE, scheduleDeliveryPurge } from './delivery-purge.job.js';
import type { GitConnections } from './connections.js';
import { createGitHubPlatform } from './github.js';
import { createGitProviders } from './providers.js';
import {
  createGitPoller,
  DEFAULT_POLL_SECONDS,
  DEFAULT_WEBHOOK_POLL_SECONDS,
  type GitPoller,
} from './poller.js';
import { createGitSecrets, createGitSecretsStores } from './sealing.js';
import type { StudioGit } from './service.js';
import type { PullRequestEvents, RepoEvents } from './events.js';
import { studioGitToken } from './token.js';

interface GitConfig {
  readonly pollIntervalSeconds?: number;
  readonly webhookPollSeconds?: number;
  readonly apiBaseUrls?: Readonly<Record<string, string>>;
  readonly poll?: boolean;
}

export default class StudioGitProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/git';
  private git: StudioGit | undefined;
  private connections: GitConnections | undefined;
  private events: PullRequestEvents | undefined;
  private repoEvents: RepoEvents | undefined;
  private release: (() => void) | undefined;
  private poller: GitPoller | undefined;
  private topic: DefinedRealtimeTopic<StudioGitEvent, 'public'> | undefined;
  private announcing: ReturnType<typeof setTimeout> | undefined;
  private stopPurge: (() => Promise<void>) | undefined;

  private config(): GitConfig {
    return this.app.config.get<{ git?: GitConfig }>('studio')?.git ?? {};
  }

  public override register(): void {
    const { container } = this.app;
    if (container.has(secretsServiceToken))
      for (const store of createGitSecretsStores(() =>
        container.resolve(databaseManagerToken).connection(),
      ))
        container.resolve(secretsServiceToken).registerStore(store);
    container.singleton(studioGitToken, (resolver) => {
      const access = () =>
        resolver.has(projectsAccessToken)
          ? resolver.resolve(projectsAccessToken)
          : undefined;
      const permissions = createPermissionSource(access);
      // A conversation run acts for the person who asked, via the agent.
      let askerOf: AskerLookup | undefined;
      const callers = createPermissionSource(access, (identity) => {
        if (!resolver.has(agentsToken)) return Promise.resolve(null);
        askerOf ??= createAskerLookup(resolver.resolve(agentsToken));
        return askerOf(identity);
      });
      const poller = createGitPoller({
        git: () => this.requireGit(),
        conn: () => resolver.resolve(projectsToken).tx.read(),
        ...this.pollSeconds(),
        onError: (message, error) => console.error(message, error),
      });
      this.poller = poller;
      return {
        git: () => this.requireGit(),
        connections: () => {
          this.requireGit();
          return this.connections!;
        },
        viewerOf: (userId) =>
          permissions.viewerOf({ kind: 'user', userId, displayName: userId }),
        callerViewerOf: (identity) => callers.viewerOf(identity),
        gitSettings: async (userId) => {
          if (!resolver.has(studioAccessToken))
            return { read: false, manage: false };
          const { settings } = await resolver
            .resolve(studioAccessToken)
            .grantsOfUser(userId);
          return {
            read: settings['studio.git/read'] === true,
            manage: settings['studio.git/manage'] === true,
          };
        },
        callbackUrl: () => this.absolute('/oauth/git/callback'),
        absoluteUrl: (path) => this.absolute(path),
        publicOrigin: () => {
          const configured = this.app.config.get<string>('app.publicOrigin');
          return URL.canParse(configured ?? '')
            ? new URL(configured!).origin
            : null;
        },
        appPath: (path) =>
          `${this.app.publicBasePath.replace(/\/+$/u, '')}${path}`,
        poller,
        events: () => {
          this.requireGit();
          return this.events!;
        },
        repoEvents: () => {
          this.requireGit();
          return this.repoEvents!;
        },
      };
    });
  }

  private pollSeconds(): { intervalSeconds: number; fallbackSeconds: number } {
    const config = this.config();
    const intervalSeconds = Math.max(
      5,
      config.pollIntervalSeconds ?? DEFAULT_POLL_SECONDS,
    );
    return {
      intervalSeconds,
      fallbackSeconds: Math.max(
        intervalSeconds,
        config.webhookPollSeconds ?? DEFAULT_WEBHOOK_POLL_SECONDS,
      ),
    };
  }

  /** `<app.publicOrigin><base path><path>`; without a public origin, the path alone. */
  private absolute(path: string): string {
    const configured = this.app.config.get<string>('app.publicOrigin');
    const origin = URL.canParse(configured ?? '')
      ? new URL(configured!).origin
      : '';
    const base = this.app.publicBasePath.replace(/\/+$/u, '');
    return `${origin}${base}${path}`;
  }

  /** Tells open pages once for the stores of a moment (a poll stores several pull requests in a row). */
  private announce(): void {
    if (this.announcing || !this.topic) return;
    this.announcing = setTimeout(() => {
      this.announcing = undefined;
      void this.topic?.publish({ kind: 'studio.git.changed' });
    }, 250);
    this.announcing.unref?.();
  }

  private requireGit(): StudioGit {
    if (!this.git)
      throw new Error('Studio pull requests need the projects plugin.');
    return this.git;
  }

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (this.release || !container.has(projectsToken)) return Promise.resolve();
    const config = this.config();
    if (container.has(realtimeServiceToken))
      this.topic = container
        .resolve(realtimeServiceToken)
        .defineTopic<StudioGitEvent, 'public'>(STUDIO_GIT_TOPIC, {
          audience: 'public',
        });
    const agents = container.has(agentsToken)
      ? container.resolve(agentsToken)
      : undefined;
    const bound = bindStudioGit({
      projects: () => container.resolve(projectsToken),
      ...(container.has(projectsWorkflowEventsToken)
        ? { events: container.resolve(projectsWorkflowEventsToken) }
        : {}),
      ...(container.has(projectsStatusRulesToken)
        ? { statusRules: container.resolve(projectsStatusRulesToken) }
        : {}),
      ...(container.has(projectsNoticeRulesToken)
        ? { noticeRules: container.resolve(projectsNoticeRulesToken) }
        : {}),
      ...(agents ? { agents } : {}),
      inbox: () =>
        container.has(studioInboxPortToken)
          ? container.resolve(studioInboxPortToken)
          : undefined,
      providers: createGitProviders([createGitHubPlatform()]),
      secrets: createGitSecrets(
        container.has(secretsServiceToken)
          ? container.resolve(secretsServiceToken)
          : undefined,
      ),
      ...(config.apiBaseUrls ? { apiBaseUrls: config.apiBaseUrls } : {}),
      webhookUrl: (repoId) =>
        this.absolute(
          `/api/webhooks/github/repositories/${encodeURIComponent(repoId)}`,
        ),
      connectionWebhookUrl: (connectionId) =>
        this.absolute(
          `/api/webhooks/github/connections/${encodeURIComponent(connectionId)}`,
        ),
      callbackUrl: () => this.absolute('/oauth/git/callback'),
      preferenceOf: (userId, key) =>
        container.has(userPreferencesServiceToken)
          ? container.resolve(userPreferencesServiceToken).get(userId, key)
          : Promise.resolve(undefined),
      onChanged: () => this.announce(),
      pollSeconds: {
        normal: this.pollSeconds().intervalSeconds,
        fallback: this.pollSeconds().fallbackSeconds,
      },
    });
    this.git = bound.git;
    this.connections = bound.connections;
    this.events = bound.events;
    this.repoEvents = bound.repoEvents;
    this.release = bound.release;
    return Promise.resolve();
  }

  public override async ready(): Promise<void> {
    const { container } = this.app;
    if (!this.git) return;
    if (this.config().poll !== false)
      container.resolve(studioGitToken).poller.start();
    this.stopPurge ??= await scheduleDeliveryPurge(
      () => container.resolve(projectsToken).tx.read(),
      container.has(jobExecutorServiceToken)
        ? container
            .resolve(jobExecutorServiceToken)
            .getScheduleExecutor(GIT_JOBS_SCOPE)
        : null,
      (error) => console.error('Purging webhook deliveries failed.', error),
    );
  }

  public override async shutdown(): Promise<void> {
    const stopPurge = this.stopPurge;
    this.stopPurge = undefined;
    await stopPurge?.();
    this.poller?.stop();
    if (this.announcing) clearTimeout(this.announcing);
    this.announcing = undefined;
    this.topic?.close();
    this.topic = undefined;
    this.release?.();
    this.release = undefined;
    this.git = undefined;
    this.connections = undefined;
    this.events = undefined;
    this.repoEvents = undefined;
  }
}
