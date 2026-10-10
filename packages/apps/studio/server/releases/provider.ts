/**
 * Release management in Studio (`@nocobase/app-plugin-releases`, whose Host driver runs environments in process or in
 * Docker through `@nocobase/app-host-docker`):
 *
 * - binds `releasesAccessToken` to Studio's roles (`access.ts`), with "related" Apps from the repository links
 *   (`links.ts`, `studioRepositoryLinksToken`);
 * - puts deployment requests and failed deployments into Studio's inbox (`inbox.ts`);
 * - cleans up after an App a repository builds once it is deleted, and offers to create it again (`app-removal.ts`);
 * - on a fresh installation, creates the "Preview" environment on the local App Host once the application starts
 *   (`previewEnvironment` in `studioSettings`, recorded pending by the seed `202610010050_studio_preview_environment`),
 *   unprotected, for previews and quick trials. A production environment is never created by default: see
 *   `docs/releases.md`.
 *
 * The CLI's release commands are registered with the agents plugin's command registry by `StudioAgentsProvider`
 * (`../agents/provider.ts`), and the Host's traffic is forwarded by `server/standalone.ts`.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import {
  SYSTEM_CALLER,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import {
  releasesAccessToken,
  releasesEventsToken,
  releasesToken,
} from '@nocobase/app-plugin-releases/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  databaseManagerToken,
  type DatabaseManager,
  type Row,
} from '@nocobase/db';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';

import { studioAccessToken } from '../access/token.js';
import { studioCiSetupToken } from '../builds/token.js';
import { studioInboxPortToken } from '../inbox/port.js';
import { PREVIEW_LABEL, RELEASE_LABELS } from '../../shared/previews.js';
import { createStudioReleasesAccess } from './access.js';
import {
  createAppRemoval,
  studioAppRemovalToken,
  type RemovalReleases,
} from './app-removal.js';
import { bindReleasesInbox, releaseFacts } from './inbox.js';
import {
  createRepositoryLinks,
  type LinkReleases,
  type RepositoryLinks,
} from './links.js';

/** Where Studio's repositories deploy, and the related Apps they give. */
export const studioRepositoryLinksToken: ServiceToken<RepositoryLinks> =
  createServiceToken<RepositoryLinks>('studio/releases/links');

const SETTINGS_TABLE = 'studioSettings';
const PREVIEW_SETTING = 'previewEnvironment';
export const PREVIEW_ENVIRONMENT_ID = 'preview';
/** What the Preview environment starts with. */
export const PREVIEW_ENVIRONMENT_DEFAULTS = {
  maxApps: 20,
  idleStopMinutes: 10,
  dormantAfterHours: 24,
} as const;

/** `studio.releases` in the configuration. */
export interface StudioReleasesConfig {
  /** `false` creates no Preview environment at installation. */
  readonly previewEnvironment?: boolean;
  /** Public URL pattern of preview Apps, with `{appId}` (a separate origin in production). */
  readonly previewPublicUrl?: string;
}

/** Release management's side of a repository link, from its services. */
export function linkReleases(releases: () => Releases): LinkReleases {
  return {
    async app(appId) {
      const app = await releases().releases.findApp(appId);
      return app
        ? {
            name: app.name,
            environmentId: app.environmentId,
            labels: app.labels,
          }
        : null;
    },
    environmentExists: async (id) =>
      (await releases().environments.find(id)) !== null,
    async environment(id) {
      const found = await releases().environments.find(id);
      return found
        ? {
            name: found.name,
            protected: found.protected,
            archives: found.capabilities.archives,
          }
        : null;
    },
    async appScopes(userId) {
      return (await releases().callerForUser(userId, 'human')).permissions
        .scopes;
    },
    async createApp(userId, input) {
      // Studio creates it on the person's behalf, as a rule does; `createdBy` makes it theirs.
      await releases().releases.createApp(
        { userId, kind: 'rule', permissions: allPermissions() },
        input,
      );
    },
    async mayConfigure(userId: string, appId: string) {
      const services = releases();
      const app = await services.releases.findApp(appId);
      if (!app) return false;
      return services.guard.canApp(
        await services.callerForUser(userId, 'human'),
        'configure',
        app,
      );
    },
  };
}

/** Release management's side of removing an App: its issue previews, deleted as Studio for whoever created them. */
export function removalReleases(releases: () => Releases): RemovalReleases {
  const ruleCaller = (userId: string | null) => ({
    userId,
    kind: 'rule' as const,
    permissions: allPermissions(),
  });
  return {
    async previewApps(appId) {
      const found: { id: string; createdBy: string | null }[] = [];
      for (let page = 1; ; page += 1) {
        const result = await releases().releases.listApps(ruleCaller(null), {
          labels: { [RELEASE_LABELS.kind]: PREVIEW_LABEL },
          page,
          pageSize: 100,
        });
        for (const item of result.items)
          if (item.app.previewOf === appId)
            found.push({ id: item.app.id, createdBy: item.app.createdBy });
        if (page * result.pageSize >= result.total) break;
      }
      return found;
    },
    async deleteApp(appId, createdBy) {
      await releases().releases.deleteApp(ruleCaller(createdBy), appId);
    },
  };
}

/** The Preview environment's name in each language Studio ships; English for any other. */
const PREVIEW_NAMES: Readonly<Record<string, string>> = {
  'zh-CN': '预览',
  'en-US': 'Preview',
};

/** The Preview environment's name in the installation's language (`i18n.defaultLocale`). */
export function previewEnvironmentName(locale: string | undefined): string {
  return locale?.toLowerCase().startsWith('zh')
    ? PREVIEW_NAMES['zh-CN']
    : PREVIEW_NAMES['en-US'];
}

/**
 * Creates the Preview environment once, when the seed asked for it and the Host driver is there, named in the
 * installation's language. Release management stores an environment's name as plain text, so a later change of
 * language renames it at start, while it still has a name Studio gave it (one an administrator chose stays). Returns
 * whether it was created.
 */
export async function createPreviewEnvironment(options: {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly releases: Releases;
  readonly locale: string | undefined;
  readonly publicUrl?: string | null;
}): Promise<boolean> {
  const query = () => options.database.connection().query;
  const name = previewEnvironmentName(options.locale);
  const existing = await options.releases.environments.find(
    PREVIEW_ENVIRONMENT_ID,
  );
  if (
    existing &&
    existing.name !== name &&
    Object.values(PREVIEW_NAMES).includes(existing.name) &&
    options.releases.drivers.get(existing.driver)
  )
    await options.releases.environments.update(
      SYSTEM_CALLER,
      PREVIEW_ENVIRONMENT_ID,
      { name },
    );
  const row = await query()
    .selectFrom(SETTINGS_TABLE)
    .select('value')
    .where('key', '=', PREVIEW_SETTING)
    .executeTakeFirst();
  if (!row) return false;
  const value: unknown =
    typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
  if ((value as { state?: unknown } | null)?.state !== 'pending') return false;
  if (!options.releases.drivers.get('host')) return false;
  if (!existing)
    await options.releases.environments.create(SYSTEM_CALLER, {
      id: PREVIEW_ENVIRONMENT_ID,
      name,
      driver: 'host',
      config: { backend: 'in-process' },
      // Studio's listener forwards what lies outside its mount to the Host, so by default a preview answers on Studio's
      // own origin; in production `studio.releases.previewPublicUrl` gives previews an origin of their own.
      publicUrl: options.publicUrl ?? '/{appId}/',
      protected: false,
      // Previews run while people visit them: at most 20 at once, stopped after 10 minutes unvisited and dormant
      // after 24 hours; an administrator changes these on the environment.
      maxApps: PREVIEW_ENVIRONMENT_DEFAULTS.maxApps,
      defaultIdleStopMinutes: PREVIEW_ENVIRONMENT_DEFAULTS.idleStopMinutes,
      defaultDormantAfterHours: PREVIEW_ENVIRONMENT_DEFAULTS.dormantAfterHours,
      // A preview starts with its App's sample data, to have something to look at.
      sampleDataOnFirstDeploy: true,
    });
  if (!existing)
    // A preview of Studio itself runs no App Host of its own (`server/config/releases.ts`); other Apps ignore it.
    await options.releases.environments
      .setVariable(
        SYSTEM_CALLER,
        PREVIEW_ENVIRONMENT_ID,
        'RELEASES_HOST_ENABLED',
        {
          value: 'false',
          description: 'A preview of Studio runs no App Host of its own.',
        },
      )
      .catch(() => undefined);
  await query()
    .updateTable(SETTINGS_TABLE)
    .set({
      value: JSON.stringify({ state: 'done' }),
      updatedAt: new Date(),
    })
    .where('key', '=', PREVIEW_SETTING)
    .execute();
  return true;
}

export default class StudioReleasesProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/releases';
  private release: (() => void) | undefined;
  private releaseRemoval: (() => void) | undefined;

  public override register(): void {
    const { container } = this.app;
    // An application may be assembled without release management (as its own tests do).
    if (!container.has(releasesToken)) return;
    container.singleton(studioRepositoryLinksToken, (resolver) => {
      const releases = linkReleases(() => resolver.resolve(releasesToken));
      return createRepositoryLinks({
        database: resolver.resolve(databaseManagerToken),
        releases: () => releases,
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        // The CI setup, when Studio assembles it (`../builds/ci-provider.ts`).
        ciSetup: () =>
          resolver.has(studioCiSetupToken)
            ? resolver.resolve(studioCiSetupToken).hook
            : undefined,
      });
    });
    container.singleton(studioAppRemovalToken, (resolver) =>
      createAppRemoval({
        database: resolver.resolve(databaseManagerToken),
        links: () => resolver.resolve(studioRepositoryLinksToken),
        releases: () => removalReleases(() => resolver.resolve(releasesToken)),
        ciSetup: () =>
          resolver.has(studioCiSetupToken)
            ? resolver.resolve(studioCiSetupToken)
            : undefined,
        inbox: () =>
          resolver.has(studioInboxPortToken)
            ? resolver.resolve(studioInboxPortToken)
            : undefined,
        onError: (message, error) => {
          if (resolver.has(loggingToken))
            resolver
              .resolve(loggingToken)
              .getLogger('releases')
              .error({ err: error }, message);
          else console.error(message, error);
        },
      }),
    );
    container.singleton(releasesAccessToken, (resolver) =>
      createStudioReleasesAccess({
        access: () => resolver.resolve(studioAccessToken),
        links: () => resolver.resolve(studioRepositoryLinksToken),
        database: resolver.resolve(databaseManagerToken),
      }),
    );
  }

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (this.releaseRemoval || !container.has(releasesToken))
      return Promise.resolve();
    // An App a repository builds, deleted: its links, CI key and previews follow (`app-removal.ts`).
    const removal = container.resolve(studioAppRemovalToken);
    this.releaseRemoval = container
      .resolve(releasesEventsToken)
      .subscribe((event) => removal.releasesEvent(event));
    // Without authentication there are no people, and no inbox to tell.
    if (
      container.has(authenticationToken) &&
      container.has(studioInboxPortToken)
    ) {
      const services = () => container.resolve(releasesToken);
      this.release = bindReleasesInbox({
        events: container.resolve(releasesEventsToken),
        port: () => container.resolve(studioInboxPortToken),
        lookup: {
          async userName(id) {
            const row = await container
              .resolve(databaseManagerToken)
              .connection()
              .query.selectFrom('user')
              .select(['name', 'username', 'email'])
              .where('id', '=', id)
              .executeTakeFirst<Row>();
            if (!row) return null;
            const name = [row.name, row.username, row.email].find(
              (value): value is string => typeof value === 'string' && !!value,
            );
            return name ?? id;
          },
          environmentName: async (id) =>
            (await services().environments.find(id))?.name ?? null,
          release: async (appId, releaseId) => {
            const release = await services()
              .releases.getRelease(SYSTEM_CALLER, appId, releaseId)
              .catch(() => null);
            return release
              ? releaseFacts(
                  release,
                  container.resolve(databaseManagerToken).connection(),
                )
              : null;
          },
          requester: async (requestId) =>
            (
              await services()
                .requests.get(SYSTEM_CALLER, requestId)
                .catch(() => null)
            )?.requestedBy ?? null,
        },
      });
    }
    return Promise.resolve();
  }

  public override async start(): Promise<void> {
    const { container, config } = this.app;
    if (!container.has(releasesToken)) return;
    try {
      await createPreviewEnvironment({
        database: container.resolve(databaseManagerToken),
        releases: container.resolve(releasesToken),
        locale: config.get<string>('i18n.defaultLocale'),
        publicUrl:
          config.get<StudioReleasesConfig>('studio.releases')
            ?.previewPublicUrl ?? null,
      });
    } catch (error) {
      // Not worth refusing to start over: an administrator can add the environment by hand.
      if (container.has(loggingToken))
        container
          .resolve(loggingToken)
          .getLogger('releases')
          .error({ err: error }, 'Could not create the Preview environment.');
    }
  }

  public override shutdown(): Promise<void> {
    this.release?.();
    this.release = undefined;
    this.releaseRemoval?.();
    this.releaseRemoval = undefined;
    return Promise.resolve();
  }
}
