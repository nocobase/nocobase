/**
 * Studio's side of the knowledge plugin (`@nocobase/app-plugin-knowledge`): it binds the plugin's access resolver with
 * Studio's spaces and roles (`knowledgeAccessToken`, `access.ts`), and joins the plugin's knowledge base at boot to what
 * Studio assembles:
 *
 * - the subjects a folder's or an article's permissions name: people, roles, a project's members and lead, agents
 *   (`subjects.ts`);
 * - the agents plugin: the `nb-studio kb` routes (`/api/kb`, `routes.ts` over `views.ts`), the brief's knowledge sections
 *   (`brief.ts`) and the `knowledge` mount (`mount.ts`), with what a conversation run reads (`conversation.ts`); the
 *   action gate's knowledge actions (`actions.ts`) are added where Studio joins the agents (`../agents/provider.ts`);
 * - the projects plugin's workflows: the `retrospective` status rule (`retrospective.ts`);
 * - Studio's inbox: proposal cards and decisions (`inbox.ts`);
 * - the agents plugin's model services and vector index: vector search, reranking, contextual retrieval and each
 *   section's index state (`vectors.ts`), configured in Settings › Knowledge search (`search-settings.ts`,
 *   `search-routes.ts`) with the default chunking and recall the plugin reads (`tuning.ts`), and the whole knowledge in
 *   an online agent's prompt when it is small (`brief.ts`).
 *
 * The plugin announces each change on its own realtime topic (`knowledge`).
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  knowledgeAccessToken,
  knowledgeToken,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import {
  projectsAccessToken,
  projectsKindsToken,
  projectsStatusRulesToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import type { KnowledgeIndexStatus } from '../../shared/knowledge.js';
import { studioAccessToken } from '../access/token.js';
import { createPermissionSource } from '../agents/commands/permissions.js';
import { studioInboxPortToken } from '../inbox/port.js';
import {
  studioKnowledgeAccess,
  NO_LEVELS,
  type KnowledgeLevels,
} from './access.js';
import { knowledgeBriefSection, type KnowledgeBriefDeps } from './brief.js';
import { conversationKnowledge } from './conversation.js';
import { createStudioDirectory, levelsFrom } from './directory.js';
import { bindKnowledgeInbox } from './inbox.js';
import { knowledgeMount } from './mount.js';
import { retrospectiveRule } from './retrospective.js';
import { studioKnowledgeViewsToken } from './routes.js';
import { studioSubjects } from './subjects.js';
import { studioKnowledgeSearchToken } from './search-routes.js';
import {
  createKnowledgeSearchSettings,
  type KnowledgeSearchSettingsStore,
} from './search-settings.js';
import { bindKnowledgeTuning } from './tuning.js';
import { createKnowledgeVectors, type KnowledgeVectors } from './vectors.js';
import { createKnowledgeViews } from './views.js';

const NO_INDEX: KnowledgeIndexStatus = {
  available: false,
  store: null,
  reason: 'INDEX_NOT_SET_UP',
  active: null,
  building: null,
  pending: 0,
  failed: 0,
};

export default class StudioKnowledgeProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/knowledge';
  private readonly releases: (() => void)[] = [];
  private vectors: KnowledgeVectors | null = null;
  private searchSettings: KnowledgeSearchSettingsStore | null = null;

  private settingsStore(): KnowledgeSearchSettingsStore {
    this.searchSettings ??= createKnowledgeSearchSettings({
      database: this.app.container.resolve(databaseManagerToken),
    });
    return this.searchSettings;
  }

  private onError = (message: string, error: unknown): void => {
    const { container } = this.app;
    if (container.has(loggingToken))
      container
        .resolve(loggingToken)
        .getLogger('knowledge')
        .error({ err: error }, message);
    else console.error(message, error);
  };

  /** A person's knowledge levels from Studio's roles; none without them. */
  private levelsOf = async (userId: string): Promise<KnowledgeLevels> => {
    const { container } = this.app;
    if (!container.has(studioAccessToken)) return NO_LEVELS;
    return levelsFrom(
      await container.resolve(studioAccessToken).permissionsOfUser(userId),
    );
  };

  private permissions() {
    const { container } = this.app;
    return createPermissionSource(() =>
      container.has(projectsAccessToken)
        ? container.resolve(projectsAccessToken)
        : undefined,
    );
  }

  private directory() {
    const { container } = this.app;
    return createStudioDirectory({
      database: container.resolve(databaseManagerToken),
      projects: () => container.resolve(projectsToken),
      kinds: () =>
        container.has(projectsKindsToken)
          ? container.resolve(projectsKindsToken)
          : undefined,
      access: () =>
        container.has(projectsAccessToken)
          ? container.resolve(projectsAccessToken)
          : undefined,
      permissionsOfUser: (userId) =>
        container.has(studioAccessToken)
          ? container.resolve(studioAccessToken).permissionsOfUser(userId)
          : Promise.resolve({ scopes: {} as never }),
      permissions: this.permissions(),
    });
  }

  public override register(): void {
    const { container } = this.app;
    if (!container.has(projectsToken)) return;
    container.singleton(knowledgeAccessToken, () =>
      studioKnowledgeAccess(this.directory()),
    );
    container.singleton(studioKnowledgeSearchToken, () => ({
      settings: this.settingsStore(),
      index: () => this.vectors?.status() ?? Promise.resolve(NO_INDEX),
    }));
    container.singleton(studioKnowledgeViewsToken, () => ({
      views: createKnowledgeViews({
        knowledge: () => container.resolve(knowledgeToken),
        projects: () => container.resolve(projectsToken),
        permissions: this.permissions(),
        conversationOf: (input) =>
          container.has(agentsToken)
            ? conversationKnowledge({
                agents: () => container.resolve(agentsToken),
                projects: () => container.resolve(projectsToken),
                permissions: this.permissions(),
              })(input)
            : Promise.resolve(null),
      }),
      allowed: (identity) =>
        container.has(agentsToken)
          ? container.resolve(agentsToken).gate.allowed(identity)
          : Promise.resolve(new Set<string>()),
      basePath: () => this.app.publicBasePath,
    }));
  }

  /** The delivery comment's manual lines, in the installation's language. */
  private manualLines = async () => {
    const { container, config } = this.app;
    const fallback = {
      updated: 'Manual: updated <slug>, <slug>',
      none: 'Manual: no impact',
    };
    if (!container.has(i18nToken)) return fallback;
    const i18n = container.resolve(i18nToken);
    const locale =
      config.get<string>('i18n.defaultLocale') ?? i18n.getDefaultLocale();
    try {
      await i18n.ensureLocaleLoaded(locale);
      const t = i18n.getFixedT(STUDIO_NAMESPACE, locale);
      return {
        updated: t('knowledge.manual.updated', {
          defaultValue: fallback.updated,
        }),
        none: t('knowledge.manual.none', { defaultValue: fallback.none }),
      };
    } catch {
      return fallback;
    }
  };

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (
      this.releases.length > 0 ||
      !container.has(knowledgeToken) ||
      !container.has(projectsToken)
    )
      return Promise.resolve();
    const knowledge = container.resolve(knowledgeToken);
    const directory = this.directory();
    const keep = (release: () => void) => this.releases.push(release);

    keep(
      bindKnowledgeTuning({
        knowledge,
        settings: this.settingsStore(),
        managesSearch: async (reader) =>
          container.has(studioAccessToken) &&
          (
            await container
              .resolve(studioAccessToken)
              .grantsOfUser(reader.userId)
          ).settings['studio.knowledgeSearch/manage'] === true,
        onError: this.onError,
      }),
    );

    for (const provider of studioSubjects({
      database: container.resolve(databaseManagerToken),
      kinds: () =>
        container.has(projectsKindsToken)
          ? container.resolve(projectsKindsToken)
          : undefined,
      access: () =>
        container.has(studioAccessToken)
          ? container.resolve(studioAccessToken)
          : undefined,
      directory,
      agents: () =>
        container.has(agentsToken) ? container.resolve(agentsToken) : undefined,
    }))
      keep(knowledge.registerSubjectProvider(provider));

    keep(
      bindKnowledgeInbox({
        knowledge,
        directory,
        port: () =>
          container.has(studioInboxPortToken)
            ? container.resolve(studioInboxPortToken)
            : undefined,
        onError: this.onError,
      }),
    );

    if (container.has(projectsStatusRulesToken) && container.has(agentsToken))
      keep(
        container
          .resolve(projectsStatusRulesToken)
          .add(
            retrospectiveRule({ agents: () => container.resolve(agentsToken) }),
          ),
      );

    if (container.has(agentsToken)) {
      const agents = container.resolve(agentsToken);
      const permissions = this.permissions();
      const conversationOf = conversationKnowledge({
        agents: () => agents,
        projects: () => container.resolve(projectsToken),
        permissions,
      });
      const briefDeps: KnowledgeBriefDeps = {
        knowledge: () => knowledge,
        levelsOf: this.levelsOf,
        projects: () => container.resolve(projectsToken),
        permissions,
        manualLines: this.manualLines,
        conversationOf,
        searchSettings: () => this.settingsStore().get(),
      };
      keep(agents.briefs.sections.register(knowledgeBriefSection(briefDeps)));
      keep(agents.mounts.register(knowledgeMount(() => knowledge, briefDeps)));
      const vectors = createKnowledgeVectors({
        knowledge: () => knowledge,
        vectors: () => agents.vectors,
        gateway: () => agents.online.gateway,
        settings: this.settingsStore(),
        database: container.resolve(databaseManagerToken),
        onError: this.onError,
      });
      this.vectors = vectors;
      keep(() => {
        vectors.close();
        this.vectors = null;
      });
    }
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    for (const release of this.releases.splice(0).reverse()) release();
    return Promise.resolve();
  }
}
