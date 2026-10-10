/**
 * Setting repositories' CI up (`ci-setup.ts`), joining Studio's git connections, the organization's API keys, release
 * management's Apps and the inbox:
 *
 * - register: the service, with the organization's keys adapted to it (`ci-deploy` keys made as the person, with only
 *   what they hold), release management's environments and Apps (`releasesForCi`), and Studio's public address
 *   (`app.publicOrigin` and the base path), which the CI signs in to;
 * - boot: the daily key rotation (`ci-key-rotation.job.ts`) on the application's jobs service.
 *
 * The repository links (`../releases/provider.ts`), new projects (`../projects-init/provider.ts`) and the API keys
 * (`../access/provider.ts`) reach the service through `studioCiSetupToken` when they need it.
 */
import { scopedApiKeysToken } from '@nocobase/app-plugin-api-keys/server';
import { projectsToken } from '@nocobase/app-plugin-projects/server/tokens';
import type { AgentsConfig } from '@nocobase/app-plugin-agents/server/tokens';
import {
  SYSTEM_CALLER,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import { KEY_SCOPE_PRESETS } from '@nocobase/app-plugin-releases/shared/access';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import type { KeyScopeInput } from '@nocobase/app-plugin-api-keys/shared/scopes';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';

import { maySetUpApps } from '../../shared/releases.js';
import { studioAccessToken, studioApiKeysToken } from '../access/token.js';
import { AGENT_KIND } from '../agents/tx.js';
import { studioGitToken } from '../git/token.js';
import { systemViewer } from '../previews/sources.js';
import { studioInboxPortToken } from '../inbox/port.js';
import {
  createCiSetup,
  type CiKey,
  type CiKeys,
  type CiReleases,
  type CiTasks,
} from './ci-setup.js';
import { CI_JOBS_SCOPE, scheduleCiKeyRotation } from './ci-key-rotation.job.js';
import { localizedCiTaskTitle } from './ci-task-title.js';
import { studioCiSetupToken } from './token.js';

const CI_PRESET = 'ci-deploy';
const APPS_GROUP = 'releases.apps';

/** The `ci-deploy` preset's scope, its record-limited groups limited to `appIds`. */
export function ciDeployScope(appIds: readonly string[]): {
  readonly scope: KeyScopeInput;
  readonly expiresInDays: number | null;
} {
  const preset = KEY_SCOPE_PRESETS.find((item) => item.id === CI_PRESET);
  if (!preset) throw new Error(`The ${CI_PRESET} key preset is not declared.`);
  return {
    scope: {
      groups: Object.fromEntries(
        Object.entries(preset.groups).map(([group, grant]) => [
          group,
          {
            level: grant.level,
            ...(grant.objects === 'pick' ? { objects: [...appIds] } : {}),
          },
        ]),
      ),
    },
    expiresInDays: preset.expiresInDays ?? null,
  };
}

/** The organization's API keys as the CI setup uses them: as the person, without `studio.apiKeys` `manage`. */
export function orgCiKeys(resolver: ServiceResolver): CiKeys {
  const service = () => resolver.resolve(studioApiKeysToken);
  async function asUser(userId: string) {
    const access = resolver.resolve(studioAccessToken);
    return {
      viewer: { userId, permissions: await access.permissionsOfUser(userId) },
      identity: await resolver.resolve(scopedApiKeysToken).identityOf(userId),
    };
  }
  return {
    async create(userId, input) {
      const { viewer, identity } = await asUser(userId);
      const { scope, expiresInDays } = ciDeployScope(input.appIds);
      const created = await service().createManaged(viewer, identity, {
        name: input.name,
        description: input.description,
        expiresInDays,
        scope,
      });
      return { id: created.key.id, secret: created.secret };
    },
    async setApps(userId, id, appIds) {
      const { viewer, identity } = await asUser(userId);
      await service().setScopeManaged(
        viewer,
        identity,
        id,
        ciDeployScope(appIds).scope,
      );
    },
    async rotate(id, actorId) {
      return { secret: (await service().rotateManaged(id, actorId)).secret };
    },
    async find(id): Promise<CiKey | null> {
      const key = await service().find(id);
      if (!key) return null;
      const objects = key.scope?.groups[APPS_GROUP]?.objects;
      return {
        id: key.id,
        name: key.name,
        expiresAt: key.expiresAt,
        status: key.status,
        appIds: Array.isArray(objects) ? [...(objects as string[])] : 'all',
      };
    },
  };
}

/** Release management as the CI setup asks it: its environments, an App, and what a person may do with Apps. */
export function releasesForCi(releases: () => Releases): CiReleases {
  return {
    async environments() {
      return (await releases().environments.list(SYSTEM_CALLER)).map(
        (environment) => ({
          id: environment.id,
          name: environment.name,
          protected: environment.protected,
        }),
      );
    },
    async app(appId) {
      const app = await releases().releases.findApp(appId);
      return app
        ? { environmentId: app.environmentId, labels: app.labels }
        : null;
    },
    async mayConfigure(userId, appId) {
      const services = releases();
      const app = await services.releases.findApp(appId);
      if (!app) return false;
      return services.guard.canApp(
        await services.callerForUser(userId, 'human'),
        'configure',
        app,
      );
    },
    async maySetUpApps(userId) {
      return maySetUpApps(
        (await releases().callerForUser(userId, 'human')).permissions.scopes,
      );
    },
  };
}

/** The issue an agent connects a repository's CI in, created as the person through the projects plugin. */
export function projectCiTasks(resolver: ServiceResolver): CiTasks {
  return {
    async create(userId, input) {
      const viewer = resolver.has(studioGitToken)
        ? await resolver.resolve(studioGitToken).viewerOf(userId)
        : systemViewer();
      const issue = await resolver
        .resolve(projectsToken)
        .issues.create(viewer, {
          title: input.title,
          description: input.description,
          projectId: input.projectId,
          executor: { type: AGENT_KIND, id: input.agentId },
        });
      return { id: issue.id, identifier: issue.identifier };
    },
    async finished(issueId) {
      try {
        const issue = await resolver
          .resolve(projectsToken)
          .issueQueries.detail(systemViewer(), issueId);
        if (issue.deletedAt) return true;
        const category = issue.statuses.find(
          (status) => status.key === issue.statusKey,
        )?.category;
        return category === 'done' || category === 'closed';
      } catch (error) {
        // Gone: nothing to wait for. Any other failure keeps waiting.
        if ((error as { kind?: unknown } | null)?.kind === 'notFound')
          return true;
        throw error;
      }
    },
  };
}

export default class StudioCiProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/ci';
  private stop: (() => Promise<void>) | undefined;

  private readonly onError = (message: string, error: unknown): void => {
    if (this.app.container.has(loggingToken))
      this.app.container
        .resolve(loggingToken)
        .getLogger('ci')
        .error({ err: error }, message);
    else console.error(message, error);
  };

  /** Studio's public address, with its base path; null without `app.publicOrigin`. */
  private studioUrl(): string | null {
    const configured = this.app.config.get<string>('app.publicOrigin');
    if (!configured || !URL.canParse(configured)) return null;
    return `${new URL(configured).origin}${this.app.publicBasePath.replace(/\/+$/u, '')}`;
  }

  public override register(): void {
    const { container } = this.app;
    if (!container.has(releasesToken)) return;
    container.singleton(studioCiSetupToken, (resolver) =>
      createCiSetup({
        database: resolver.resolve(databaseManagerToken),
        releases: () => releasesForCi(() => resolver.resolve(releasesToken)),
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        connections: () =>
          resolver.has(studioGitToken)
            ? resolver.resolve(studioGitToken).connections()
            : undefined,
        keys: () =>
          resolver.has(studioApiKeysToken) && resolver.has(scopedApiKeysToken)
            ? orgCiKeys(resolver)
            : undefined,
        inbox: () =>
          resolver.has(studioInboxPortToken)
            ? resolver.resolve(studioInboxPortToken)
            : undefined,
        administrators: async () => [
          ...(await resolver
            .resolve(studioAccessToken)
            .projects.administrators(
              resolver.resolve(databaseManagerToken).connection(),
            )),
        ],
        studioUrl: () => this.studioUrl(),
        cli: () =>
          this.app.config.get<AgentsConfig>('agents')?.cli?.name ?? 'nb-studio',
        taskTitle: (repo) =>
          localizedCiTaskTitle(
            resolver.has(i18nToken) ? resolver.resolve(i18nToken) : undefined,
            this.app.config.get<string>('i18n.defaultLocale'),
            repo,
          ),
        tasks: () =>
          resolver.has(projectsToken) ? projectCiTasks(resolver) : undefined,
        onError: this.onError,
      }),
    );
  }

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (this.stop || !container.has(studioCiSetupToken)) return;
    this.stop = await scheduleCiKeyRotation(
      () => container.resolve(studioCiSetupToken),
      container.has(jobExecutorServiceToken)
        ? container
            .resolve(jobExecutorServiceToken)
            .getScheduleExecutor(CI_JOBS_SCOPE)
        : null,
    );
  }

  public override async shutdown(): Promise<void> {
    const stop = this.stop;
    this.stop = undefined;
    await stop?.();
  }
}
