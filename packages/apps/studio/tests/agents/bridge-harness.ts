/**
 * Studio's join of the agents and projects plugins over one real database (SQLite in memory): the authentication,
 * authorization, projects, agents and Studio migrations, the projects plugin's services and the agents plugin's,
 * connected by `bindStudioAgents` the way `StudioAgentsProvider` connects them. People's permissions come from a role per
 * user (`member` by default). With `releases`, release management joins too: its services on an in-memory driver, its
 * API at `/releases`, and its CLI commands; a member holds a contributor's release permissions. With `previews` (and
 * `releases`), issue previews and deployment marks join as `StudioPreviewsProvider` joins them, their notices kept in
 * `notices`.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { HEADERS, PROTOCOL_VERSION, routePath } from '@nocobase/agent-protocol';
import type { RegisterRequest } from '@nocobase/agent-protocol';
import {
  createProjects,
  type Projects,
  type ProjectsDeps,
} from '@nocobase/app-plugin-projects/server/composition';
import type {
  IntakeOrganizer,
  PlanHooks,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  BUSINESS_KEYS,
  SETTINGS_KEYS,
  type BusinessKey,
  type Permissions,
  type Scope,
  type SettingsKey,
} from '@nocobase/app-plugin-projects/shared/access';
import { createTestDatabase } from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import { createApiKeyScopes } from '@nocobase/app-plugin-api-keys/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import projectsPlugin from '@nocobase/app-plugin-projects/server';
import {
  projectsAccessToken,
  projectsDelegatedWritesToken,
  projectsPlanSourceToken,
  projectsRequestActorToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import releasesPlugin from '@nocobase/app-plugin-releases/server';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import { createAppPaths } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiDocsService,
  CliService,
  createCliRouter,
  type CliManifest,
} from '@nocobase/app-server/router';
import type {
  AuthorizationMiddleware,
  AuthorizationMiddlewareRequest,
  KeyScope,
} from '@nocobase/authorization/core';
import { ServiceContainer } from '@nocobase/service-provider';
import type { MiddlewareHandler } from 'hono';
import { every } from 'hono/combine';
import { Hono } from 'hono';

import {
  agentsToken,
  type Agents,
  type CallerIdentity,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { AgentInput } from '@nocobase/app-plugin-agents/shared/agents';
import {
  AGENTS_MIGRATIONS,
  AGENTS_PACKAGE,
  bindCliSurface,
  createAgents,
  createRosterRoutes,
  createRunnerRoutes,
  createRunRoutes,
  runCredentialResolver,
  type CommandSurface,
} from '@nocobase/app-plugin-agents/testing';

import {
  createDriverRegistry,
  createReleases,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import {
  allPermissions,
  noPermissions,
  type ReleasesPermissions,
} from '@nocobase/app-plugin-releases/shared/access';

import { narrowedProjectPermissions } from '../../server/access/key-scope.js';
import { reportsRoutes } from '../../server/reports/routes.js';
import { studioAgentsRoutes } from '../../server/agents/routes.js';
import { inboxRoutes } from '../../server/inbox/routes.js';
import { studioInboxSourceToken } from '../../server/inbox/token.js';
import { gitRoutes } from '../../server/git/routes.js';
import { studioGitToken } from '../../server/git/token.js';
import { studioDeploysToken } from '../../server/deploys/token.js';
import { previewsRoutes } from '../../server/previews/routes.js';
import { studioPreviewApiToken } from '../../server/previews/token.js';
import { createAskerLookup } from '../../server/agents/conversation/acting.js';
import { studioReportsToken } from '../../server/reports/token.js';
import { bindStudioAgents } from '../../server/agents/bind.js';
import { studioDelegationsToken } from '../../server/agents/conversation/delegation-token.js';
import {
  createDelegations,
  gitPullRequests,
  type Delegations,
} from '../../server/agents/conversation/delegation.js';
import { issueRunsRoutes } from '../../server/agents/run-views.js';
import { stageRunRoutes } from '../../server/agents/stage-run-routes.js';
import {
  isRunScope,
  runScopeStep,
  type RunPrincipal,
} from '../../server/agents/run-principal.js';
import { createPermissionSource } from '../../server/agents/commands/permissions.js';
import {
  createDeployMarks,
  type DeployMarksService,
} from '../../server/deploys/service.js';
import type { InboxSend } from '../../server/inbox/port.js';
import {
  createIssueAccess,
  previewAppSource,
} from '../../server/previews/access.js';
import {
  createPreviewApi,
  type PreviewApi,
} from '../../server/previews/api.js';
import { ciBuildMethod } from '../../server/builds/method.js';
import { buildsRoutes } from '../../server/builds/routes.js';
import { studioBuildsToken } from '../../server/builds/token.js';
import { registerStudioKeyScopes } from '../../server/access/key-scopes.js';
import { testCatalog } from '../access/registry.js';
import { createBuilds, type Builds } from '../../server/builds/service.js';
import { findPullRequestById } from '../../server/git/store.js';
import { variablesPages } from '../../server/releases/variables-pages.js';
import { repoCiOfKey } from '../../server/releases/ci.js';
import { createSecretsService } from '@nocobase/app-server/secrets';
import {
  createPreviewService,
  type PreviewService,
} from '../../server/previews/service.js';
import {
  createRepositoryLinks,
  type RepositoryLinks,
} from '../../server/releases/links.js';
import { linkReleases } from '../../server/releases/provider.js';
import {
  createFakeDriver,
  type FakeDriverState,
} from '../releases/fixtures.js';
import { createPermissionSource } from '../../server/agents/commands/permissions.js';
import { bindStudioGit } from '../../server/git/bind.js';
import { createGitProviders } from '../../server/git/providers.js';
import { createGitSecrets } from '../../server/git/sealing.js';
import type { GitConnections } from '../../server/git/connections.js';
import type { RepoEvents } from '../../server/git/events.js';
import type { StudioGit } from '../../server/git/service.js';
import type {
  StudioInboxPort,
  InboxSend,
  InboxSettleRef,
} from '../../server/inbox/port.js';
import { createFakeGitHub, type FakeGitHub } from '../git/fake-github.js';
import type {
  InboxEntry,
  InboxSource,
} from '../../server/agents/conversation/inbox.js';
import {
  studioKnowledgeAccess,
  type KnowledgeLevels,
} from '../../server/knowledge/access.js';
import { knowledgeBriefSection } from '../../server/knowledge/brief.js';
import { knowledgeActionsOf } from '../../server/knowledge/actions.js';
import { createStudioDirectory } from '../../server/knowledge/directory.js';
import { bindKnowledgeInbox } from '../../server/knowledge/inbox.js';
import { knowledgeMount } from '../../server/knowledge/mount.js';
import { createKnowledgeViewRoutes } from '../../server/knowledge/routes.js';
import {
  createKnowledgeViews,
  type KnowledgeViews,
} from '../../server/knowledge/views.js';
import { retrospectiveRule } from '../../server/knowledge/retrospective.js';
import {
  createKnowledge,
  createKnowledgeTicketRoutes,
  type Knowledge,
  type KnowledgeFileStore,
} from '@nocobase/app-plugin-knowledge/server';
import { conversationKnowledge } from '../../server/knowledge/conversation.js';
import { createStudioReports } from '../../server/reports/service.js';

/** The secrets service variables, credentials, git secrets and preview passwords are sealed with in tests. */
export const TEST_SECRETS = createSecretsService({
  keys: [{ version: 1, key: 'e'.repeat(64) }],
});

const require = createRequire(import.meta.url);
const packageRoot = (name: string) =>
  path.dirname(require.resolve(`${name}/package.json`));

export type Role = 'admin' | 'member' | 'none';

/** The levels Studio's `contributor` role gives (as the projects plugin's own tests use them). */
const MEMBER_SCOPES: Readonly<Record<BusinessKey, 'all' | 'related' | 'none'>> =
  {
    'pm.projects/view': 'related',
    'pm.projects/create': 'all',
    'pm.projects/manage': 'related',
    'pm.projects/delete': 'none',
    'pm.issues/view': 'related',
    'pm.issues/create': 'related',
    'pm.issues/edit': 'related',
    'pm.issues/comment': 'related',
    'pm.issues/moderate-comments': 'related',
    'pm.issues/close': 'related',
    'pm.issues/change-owner': 'related',
    'pm.issues/delete': 'none',
    'pm.attachments/upload': 'related',
  };

/** `related` reaches `userId` alone. */
function scopeFor(level: 'all' | 'related' | 'none', userId: string): Scope {
  return level === 'related' ? { users: [userId] } : level;
}

export function permissionsOf(role: Role, userId: string): Permissions {
  return {
    scopes: Object.fromEntries(
      BUSINESS_KEYS.map(({ key }) => [
        key,
        role === 'admin'
          ? 'all'
          : role === 'member'
            ? scopeFor(MEMBER_SCOPES[key], userId)
            : 'none',
      ]),
    ) as Record<BusinessKey, Scope>,
    settings: Object.fromEntries(
      SETTINGS_KEYS.map(({ action, key }) => [
        key,
        role === 'admin' || (role === 'member' && action === 'read'),
      ]),
    ) as Record<SettingsKey, boolean>,
  };
}

/** Release management as Studio's roles give it: a contributor works on the Apps related to them. */
export function releasePermissionsOf(
  role: Role,
  userId: string,
): ReleasesPermissions {
  if (role === 'admin') return allPermissions();
  const none = noPermissions();
  if (role === 'none') return none;
  const related = { users: [userId] };
  return {
    scopes: {
      ...none.scopes,
      'rel.apps/view': related,
      'rel.apps/read-logs': related,
      'rel.apps/configure': related,
      'rel.apps/upload': related,
      'rel.apps/deploy': related,
      'rel.apps/operate': related,
    },
    settings: {
      ...none.settings,
      'rel.environments/read': true,
      'rel.keys/read': true,
    },
    pages: { 'rel-apps': true, 'rel-keys': true },
  };
}

/** The knowledge levels Studio's roles give: an administrator all, a member what is related to them. */
export function knowledgeLevelsOf(role: Role, userId: string): KnowledgeLevels {
  if (role === 'admin') return { read: 'all', propose: 'all', edit: 'all' };
  const related = { users: [userId] };
  if (role === 'member')
    return { read: related, propose: related, edit: related };
  return { read: 'none', propose: 'none', edit: 'none' };
}

export interface BridgeHarness {
  readonly database: DatabaseManager;
  /** Studio's knowledge base, when asked for: its commands, brief sections, mount, inbox cards and rule. */
  readonly knowledge?: Knowledge;
  /** Release management, when asked for. */
  readonly releases?: Releases;
  readonly driver?: FakeDriverState;
  /** Previews, deployment marks and repository links, when asked for. */
  readonly previews?: PreviewService;
  readonly previewApi?: PreviewApi;
  /** The preview variables of repositories previewed by themselves. */
  /** CI builds (`server/builds`), with previews. */
  readonly builds?: Builds;
  readonly deploys?: DeployMarksService;
  /**
   * The deployment checks asked of the code host (through `git`), in order; a test holds one back by setting `gate`,
   * which each check awaits before asking.
   */
  readonly deployChecks: {
    readonly asked: {
      readonly resourceId: string;
      readonly head: string;
      readonly shas: readonly string[];
    }[];
    gate: ((head: string) => Promise<void>) | null;
  };
  readonly links?: RepositoryLinks;
  /** What previews and deployment marks sent to the inbox. */
  readonly notices: InboxSend[];
  readonly agents: Agents;
  readonly projects: Projects;
  /** The work conversations delegated (`conversation/delegation.ts`). */
  readonly delegations: Delegations;
  /** Each user's role; `member` when absent. */
  readonly roles: Map<string, Role>;
  /** Stored files' bytes, by key. */
  readonly stored: Map<string, Uint8Array>;
  /** The inbox agents read, per user. */
  readonly inbox: Map<string, InboxEntry[]>;
  /** Studio's pull requests, against a GitHub stand-in. */
  readonly git: StudioGit;
  /** The workspace's connections to the stand-in, and people's own authorizations. */
  readonly gitConnections: GitConnections;
  /** Pushes and workflow runs webhooks delivered. */
  readonly gitRepoEvents: RepoEvents;
  readonly github: FakeGitHub;
  /** People's preferences, by `<userId>:<key>`. */
  readonly preferences: Map<string, unknown>;
  /** What Studio's inbox port was given: every notice sent, and every decision settled. */
  readonly port: {
    readonly sent: InboxSend[];
    readonly settled: { decisionKey: string; outcome: string }[];
    /** Items settled by subject (`settle`). */
    readonly cleared: InboxSettleRef[];
  };
  /**
   * `/agents/runners`, `/agents/runs/current`, `/agents/cli`, the projects plugin's `/projects`, release
   * management's `/releases`, Studio's `/reports`, and the command manifest at `/cli/manifest`: a person named by `x-test-user`, a run by
   * its token.
   */
  readonly app: Hono;
  addUser(id: string): Promise<string>;
  viewer(userId: string): Viewer;
  createAgent(input?: Partial<AgentInput>): Promise<string>;
  /** Registers a runner (once, with `features` or the usual ones) and claims one run; the claim's payload. */
  claimOne(features?: readonly string[]): Promise<any>;
  /** The key of the runner `claimOne` registered. */
  runnerKey(): string | undefined;
  /** A runner request for a run (`RUNNER_ROUTES` path with `:runId`), with the registered runner's key; `body` is `data` on success. */
  runner(
    route: string,
    runId: string,
    body: unknown,
  ): Promise<{ status: number; body: any }>;
  /** The command manifest of a run (by its token) or a person, from `GET /cli/manifest`. */
  manifest(who: {
    readonly runToken?: string;
    readonly user?: string;
  }): Promise<CliManifest>;
  /** An online run's commands: its manifest's, sent to the harness's API with its token. */
  commandsOf(identity: CallerIdentity, token: string): Promise<CommandSurface>;
  /** The command manifest of a command identity, as the CLI surface builds a caller from it. */
  manifestFor(identity: CallerIdentity): Promise<CliManifest>;
  request(
    method: string,
    url: string,
    options?: {
      body?: unknown;
      raw?: BodyInit;
      runToken?: string;
      user?: string;
      headers?: Record<string, string>;
    },
  ): Promise<{ status: number; body: any; headers: Headers }>;
  close(): Promise<void>;
}

/** The file plugin and Drive as the projects plugin uses them: the metadata row, and the bytes in memory by key. */
function memoryStorage(
  database: DatabaseManager,
  stored: Map<string, Uint8Array>,
): NonNullable<ProjectsDeps['storage']> {
  return {
    async store(file, uploader) {
      const id = crypto.randomUUID();
      const dot = file.name.lastIndexOf('.');
      const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '';
      const key = `objects/${id}${ext ? `.${ext}` : ''}`;
      const now = new Date();
      stored.set(key, new Uint8Array(await file.arrayBuffer()));
      await database
        .connection()
        .repository('pmAttachments')
        .createOne({
          values: {
            id,
            disk: 'local',
            key,
            filename: file.name,
            ext,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            uploaderType: uploader.type,
            uploaderId: uploader.id,
            createdAt: now,
            updatedAt: now,
          },
        });
      return id;
    },
    bytes: (object) =>
      Promise.resolve(stored.get(object.key) ?? new Uint8Array()),
    stream: (object) =>
      Promise.resolve(
        new Response(stored.get(object.key) ?? new Uint8Array())
          .body as ReadableStream<Uint8Array>,
      ),
    remove: (object) => {
      stored.delete(object.key);
      return Promise.resolve();
    },
  };
}

export async function createBridgeHarness(
  options: {
    readonly releases?: boolean;
    readonly previews?: boolean;
    readonly knowledge?: boolean;
  } = {},
): Promise<BridgeHarness> {
  const projectsRoot = packageRoot('@nocobase/app-plugin-projects');
  // Every harness gets databases of its own on the dialect the environment selects, dropped again by `close()`.
  const testDatabase = await createTestDatabase({
    migrations: (
      [
        [
          path.join(
            packageRoot('@nocobase/app-plugin-authentication'),
            'database/migrations',
          ),
          '@nocobase/app-plugin-authentication',
        ],
        [
          path.join(
            packageRoot('@nocobase/app-plugin-authorization'),
            'database/migrations',
          ),
          '@nocobase/app-plugin-authorization',
        ],
        [
          path.join(projectsRoot, 'database/migrations'),
          '@nocobase/app-plugin-projects',
        ],
        [AGENTS_MIGRATIONS, AGENTS_PACKAGE],
        [
          path.join(
            packageRoot('@nocobase/app-plugin-releases'),
            'database/migrations',
          ),
          '@nocobase/app-plugin-releases',
        ],
        [
          path.join(
            packageRoot('@nocobase/app-plugin-knowledge'),
            'database/migrations',
          ),
          '@nocobase/app-plugin-knowledge',
        ],
        [
          path.resolve(import.meta.dirname, '../../database/main/migrations'),
          'studio',
        ],
      ] as const
    ).map(([directory, packageName]) => ({ directory, packageName })),
    seeds: [
      {
        directory: path.join(projectsRoot, 'database/seeds'),
        packageName: '@nocobase/app-plugin-projects',
      },
    ],
  });
  const database = testDatabase.database;

  const roles = new Map<string, Role>();
  const roleOf = (userId: string): Role => roles.get(userId) ?? 'member';
  const access: ProjectsDeps['access'] = {
    // A request's identity: the person's role, kept to the scope of the key or run they called with.
    permissionsOf: (identity) => {
      const base = permissionsOf(
        roleOf(identity.principal.id),
        identity.principal.id,
      );
      return Promise.resolve(
        identity.keyScope
          ? narrowedProjectPermissions(base, identity.keyScope)
          : base,
      );
    },
    permissionsOfUser: (userId) =>
      Promise.resolve(permissionsOf(roleOf(userId), userId)),
    admit: () => Promise.resolve(),
    changed: () => Promise.resolve(),
    administrators: () => Promise.resolve([]),
  };
  let nextProjectId = 0;
  let planHooks: PlanHooks | undefined;
  let principal: RunPrincipal | undefined;
  let intakeOrganizer: IntakeOrganizer | undefined;
  const stored = new Map<string, Uint8Array>();
  const projects = createProjects({
    database,
    idGenerator: { generateString: () => `p-${(nextProjectId += 1)}` },
    access,
    invitations: {} as ProjectsDeps['invitations'],
    planHooks: () => planHooks,
    intakeOrganizer: () => intakeOrganizer,
    storage: memoryStorage(database, stored),
  });
  const inbox = new Map<string, InboxEntry[]>();
  const inboxSource: InboxSource = {
    list: (userId, options) =>
      Promise.resolve(
        (inbox.get(userId) ?? [])
          .filter((item) => !options.unreadOnly || !item.read)
          .slice(0, options.limit),
      ),
    find: (userId, ids) =>
      Promise.resolve(
        new Map(
          (inbox.get(userId) ?? [])
            .filter((item) => ids.includes(item.id))
            .map((item) => [item.id, item]),
        ),
      ),
  };
  let nextAgentId = 0;
  const agentIds = {
    generateString: () => `a-${String((nextAgentId += 1)).padStart(6, '0')}`,
  };
  // An online run's commands are its manifest's, sent to the harness's API (set once the API is mounted).
  const online: {
    commandsOf?: (
      identity: CallerIdentity,
      token: string,
    ) => Promise<CommandSurface>;
  } = {};
  const agents = createAgents({
    database,
    // Studio's names, as `server/config/agents.ts` gives them.
    app: { id: 'nb-studio', name: 'NocoBase Studio' },
    cli: { name: 'nb-studio', credentialFile: '.nb-studio/run.json' },
    commandsOf: (identity, token) => online.commandsOf?.(identity, token),
    idGenerator: agentIds,
    secrets: TEST_SECRETS,
    onError: () => undefined,
  });
  let releases: Releases | undefined;
  let driver: FakeDriverState | undefined;
  let releasesDir: string | undefined;
  if (options.releases) {
    releasesDir = mkdtempSync(path.join(os.tmpdir(), 'studio-releases-'));
    const drivers = createDriverRegistry();
    const fake = createFakeDriver();
    drivers.register(fake.driver);
    driver = fake.state;
    releases = createReleases({
      database,
      config: {
        artifact: {
          driver: 'fs',
          location: path.join(releasesDir, 'artifacts'),
          visibility: 'private',
        },
        dataDir: path.join(releasesDir, 'data'),
      },
      drivers,
      access: () => ({
        permissionsOf: (identity) =>
          Promise.resolve(
            releasePermissionsOf(
              roleOf(identity.principal.id),
              identity.principal.id,
            ),
          ),
        permissionsOfUser: (userId) =>
          Promise.resolve(releasePermissionsOf(roleOf(userId), userId)),
        actorKindOf: (identity) =>
          isRunScope(identity.keyScope) ? 'agent' : 'human',
      }),
      secrets: TEST_SECRETS,
    });
  }
  const releaseServices = releases;
  // Before the agents: the template they add names the workflow event this registers.
  const github = createFakeGitHub();
  const port = {
    sent: [] as InboxSend[],
    settled: [] as { decisionKey: string; outcome: string }[],
    cleared: [] as InboxSettleRef[],
  };
  const inboxPort: StudioInboxPort = {
    send: (notice) => {
      port.sent.push(notice);
      return Promise.resolve();
    },
    resolve: (ref) => {
      port.settled.push({ decisionKey: ref.decisionKey, outcome: ref.outcome });
      return Promise.resolve();
    },
    withdraw: (ref) => {
      port.settled.push({ decisionKey: ref.decisionKey, outcome: 'withdrawn' });
      return Promise.resolve();
    },
    settle: (ref) => {
      port.cleared.push(ref);
      return Promise.resolve();
    },
  };
  const preferences = new Map<string, unknown>();
  const {
    git,
    connections: gitConnections,
    events: gitEvents,
    repoEvents: gitRepoEvents,
  } = bindStudioGit({
    preferenceOf: (userId, key) =>
      Promise.resolve(preferences.get(`${userId}:${key}`)),
    projects: () => projects,
    events: projects.workflowEvents.types,
    statusRules: projects.statusRules,
    agents,
    noticeRules: projects.noticeRules,
    inbox: () => inboxPort,
    providers: createGitProviders([github.platform]),
    secrets: createGitSecrets(TEST_SECRETS),
    // Listeners may still run after a test closed the database; a test that cares reads `port`.
    onError: () => undefined,
  });
  let previewService: PreviewService | undefined;
  // As `StudioKnowledgeProvider`: a member's levels from their role, projects from the projects plugin.
  let nextKnowledgeId = 0;
  const knowledgeLevels = (userId: string) =>
    Promise.resolve(knowledgeLevelsOf(roleOf(userId), userId));
  const knowledgeDirectory = options.knowledge
    ? createStudioDirectory({
        database,
        projects: () => projects,
        kinds: () => projects.kinds,
        access: () => access,
        permissionsOfUser: async (userId) => {
          const levels = await knowledgeLevels(userId);
          return {
            scopes: {
              'kb.knowledge/read': levels.read,
              'kb.knowledge/propose': levels.propose,
              'kb.knowledge/edit': levels.edit,
            } as never,
          };
        },
        permissions: createPermissionSource(() => access),
      })
    : undefined;
  // The file plugin's upload, as far as the knowledge base uses it: the `kbFiles` row, and the bytes in memory.
  const knowledgeBytes = new Map<string, Uint8Array>();
  const knowledgeFiles: KnowledgeFileStore = {
    async store(file, uploader) {
      const id = crypto.randomUUID();
      const dot = file.name.lastIndexOf('.');
      const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : '';
      const key = `objects/${id}${ext ? `.${ext}` : ''}`;
      const now = new Date().toISOString();
      knowledgeBytes.set(key, new Uint8Array(await file.arrayBuffer()));
      await database
        .connection()
        .repository('kbFiles')
        .createOne({
          values: {
            id,
            disk: 'local',
            key,
            filename: file.name,
            ext,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            uploaderKind: uploader.kind,
            uploaderId: uploader.id,
            createdAt: now,
            updatedAt: now,
          },
        });
      return id;
    },
    bytes: (object) =>
      Promise.resolve(knowledgeBytes.get(object.key) ?? new Uint8Array()),
    stream: (object) =>
      Promise.resolve(
        new Blob([knowledgeBytes.get(object.key) ?? new Uint8Array()]).stream(),
      ),
    remove: (object) => {
      knowledgeBytes.delete(object.key);
      return Promise.resolve();
    },
  };
  const knowledge = knowledgeDirectory
    ? createKnowledge({
        database,
        access: studioKnowledgeAccess(knowledgeDirectory),
        newId: () => `kn-${String((nextKnowledgeId += 1)).padStart(5, '0')}`,
        files: { store: () => knowledgeFiles },
        onError: () => undefined,
      })
    : undefined;
  // As `StudioAgentsProvider`: the Reports page's figures, and who may read them and every run, from the roles.
  const harnessPermissions = createPermissionSource(() => access);
  const reports = createStudioReports({
    agents,
    projects: () => projects,
    viewerOf: (userId) =>
      harnessPermissions.viewerOf({
        kind: 'user',
        userId,
        displayName: userId,
      }),
    connection: () => database.connection(),
  });
  const delegations = createDelegations({
    agents,
    projects: () => projects,
    pullRequests: () => gitPullRequests(() => gitEvents),
    onError: () => undefined,
  });
  bindStudioAgents({
    agents,
    delegations,
    kinds: projects.kinds,
    catalog: testCatalog,
    grantsOf: (identity) =>
      Promise.resolve({
        reports: roleOf(identity.userId) !== 'none',
        allRuns: roleOf(identity.userId) === 'admin',
      }),
    rolesOf: (userId) =>
      Promise.resolve({
        roles:
          roleOf(userId) === 'admin'
            ? ['Administrator']
            : roleOf(userId) === 'member'
              ? ['Contributor']
              : [],
        superuser: false,
      }),
    pendingOf: () => (userId) =>
      Promise.resolve(
        (inbox.get(userId) ?? []).filter((item) => item.pending).length,
      ),
    ...(knowledge
      ? { actionSources: [knowledgeActionsOf(knowledgeLevels)] }
      : {}),
    projects: () => projects,
    noticeRules: projects.noticeRules,
    statusRules: projects.statusRules,
    templates: projects.templates,
    access: () => access,
    bindPlanHooks: (hooks) => {
      planHooks = hooks;
      return () => {
        planHooks = undefined;
      };
    },
    bindIntakeOrganizer: (organizer) => {
      intakeOrganizer = organizer;
      return () => {
        intakeOrganizer = undefined;
      };
    },
    bindRunPrincipal: (bound) => {
      principal = bound;
      return () => {
        principal = undefined;
      };
    },
    inbox: () => inboxSource,
    inboxPort: () => inboxPort,
    onError: () => undefined,
    ...(releaseServices
      ? {
          releases: {
            permissionsOfUser: (userId: string) =>
              Promise.resolve(releasePermissionsOf(roleOf(userId), userId)),
          },
        }
      : {}),
  });

  let knowledgeViews: KnowledgeViews | undefined;
  if (knowledge && knowledgeDirectory) {
    const briefDeps = {
      knowledge: () => knowledge,
      levelsOf: knowledgeLevels,
      projects: () => projects,
      permissions: createPermissionSource(() => access),
      conversationOf: conversationKnowledge({
        agents: () => agents,
        projects: () => projects,
        permissions: createPermissionSource(() => access),
      }),
      manualLines: () =>
        Promise.resolve({
          updated: '手册：已更新 <slug>, <slug>',
          none: '手册：无影响',
        }),
    };
    knowledgeViews = createKnowledgeViews({
      knowledge: () => knowledge,
      projects: () => projects,
      permissions: briefDeps.permissions,
      conversationOf: briefDeps.conversationOf,
    });
    agents.briefs.sections.register(knowledgeBriefSection(briefDeps));
    agents.mounts.register(knowledgeMount(() => knowledge, briefDeps));
    bindKnowledgeInbox({
      knowledge,
      directory: knowledgeDirectory,
      port: () => inboxPort,
      onError: () => undefined,
    });
    projects.statusRules.add(retrospectiveRule({ agents: () => agents }));
  }

  const notices: InboxSend[] = [];
  let previewApi: PreviewApi | undefined;
  let buildsService: Builds | undefined;
  let deploys: DeployMarksService | undefined;
  const deployChecks: BridgeHarness['deployChecks'] = { asked: [], gate: null };
  let links: RepositoryLinks | undefined;
  if (options.previews && releaseServices) {
    let nextPreviewId = 0;
    // Decisions settled, by key: a card waits until its key is here.
    const settledKeys = new Set<string>();
    const port = {
      send: (notice: InboxSend) => {
        if (notice.decisionKey) settledKeys.delete(notice.decisionKey);
        notices.push(notice);
        return Promise.resolve();
      },
      resolve: (ref: { readonly decisionKey: string }) => {
        settledKeys.add(ref.decisionKey);
        return Promise.resolve();
      },
      withdraw: (ref: { readonly decisionKey: string }) => {
        settledKeys.add(ref.decisionKey);
        return Promise.resolve();
      },
      settle: () => Promise.resolve(),
    };
    const repositoryLinks = createRepositoryLinks({
      database,
      releases: () => linkReleases(() => releaseServices),
      newId: () => `l-${(nextPreviewId += 1)}`,
    });
    links = repositoryLinks;
    const service = createPreviewService({
      database,
      releases: () => releaseServices,
      inbox: () => port,
      buildMethod: () => ciBuildMethod,
      newId: () => `pv-${(nextPreviewId += 1)}`,
      studioOrigin: 'https://studio.test',
      variablesPages: variablesPages('https://studio.test', ''),
      onError: () => undefined,
    });
    previewService = service;
    const issues = createIssueAccess({
      projects: () => projects,
      access: () => access,
    });
    const api = createPreviewApi({
      projects: () => projects,
      releases: () => releaseServices,
      database,
      previews: () => service,
      issues,
      appName: async (appId) =>
        (await releaseServices.releases.findApp(appId))?.name ?? null,
      canManageEnvironments: async (userId) =>
        releaseServices.guard.hasSetting(
          await releaseServices.callerForUser(userId, 'human'),
          'rel.environments',
          'manage',
        ),
    });
    previewApi = api;
    const builds = createBuilds({
      database,
      releases: () => releaseServices,
      verify: (resourceId, sha) => git.verifyCommit(resourceId, sha),
      previews: () => service,
      ciRepositoryOf: async (userId) => {
        const row = await repoCiOfKey(database.connection(), userId);
        return row
          ? { resourceId: row.resourceId, setUpBy: row.createdBy }
          : null;
      },
      git: () => git,
      variablesPages: variablesPages('https://studio.test', ''),
      requestPage: (appId, requestId) =>
        `https://studio.test/releases/${appId}/requests/${requestId}`,
      secret: 'test-only-auth-secret',
      newId: () => `b-${(nextPreviewId += 1)}`,
      onError: () => undefined,
    });
    buildsService = builds;
    // As `StudioPreviewsProvider`: previews follow pull requests by identity; an unlink clears its deployment marks.
    gitEvents.on(async (event) => {
      if (event.type === 'unlinked') {
        await deploys?.pullRequestUnlinked(event.issueId, event.pullRequestId);
        return;
      }
      const pr = await findPullRequestById(
        database.connection(),
        event.pullRequestId,
      );
      if (!pr) return;
      if (pr.state === 'open' && pr.headSha)
        await builds.headMoved(pr.id, pr.headSha);
      await service.pullRequestChanged(pr.id);
    });
    const marks = createDeployMarks({
      hasProjectPreviews: (viewer, projectId, allowUnlinked) =>
        api.hasProjectPreviews(viewer, projectId, allowUnlinked),
      database,
      projects: () => projects,
      contains: async (resourceId, head, shas) => {
        await deployChecks.gate?.(head);
        deployChecks.asked.push({ resourceId, head, shas });
        return git.commitsContained(resourceId, head, shas);
      },
      releases: () => releaseServices,
      inbox: () => port,
      // The newest card of the decision sent to the person, while it waits.
      decisionOf: (userId, ref) => {
        const sent = notices.findLast(
          (notice) =>
            notice.source === ref.source &&
            notice.decisionKey === ref.decisionKey &&
            notice.userIds.includes(userId),
        );
        return Promise.resolve(
          sent && !settledKeys.has(ref.decisionKey)
            ? {
                notificationId: sent.key,
                source: sent.source,
                kind: sent.kind,
                type: sent.type,
                subject: sent.subject ?? null,
                decisionKey: ref.decisionKey,
                data: sent.data ?? null,
                count: 1,
                resolvedAt: null,
                outcome: null,
              }
            : null,
        );
      },
      newId: () => `dm-${(nextPreviewId += 1)}`,
      onError: () => undefined,
    });
    deploys = marks;
    repositoryLinks.addSource(previewAppSource({ database, issues }));
    projects.events.on('issue.updated', (event) => {
      if (event.changes.status)
        void marks.issueMoved(event.issueId, event.changes.status.to);
    });
    releaseServices.events.subscribe(async (event) => {
      await service.releasesEvent(event);
      await marks.releasesEvent(event);
    });
  }

  const app = new Hono();
  app.route(
    '/agents/runners',
    createRunnerRoutes(agents, { pollTimeoutMs: 200 }),
  );
  app.route('/agents', createRunRoutes(agents));
  if (knowledge)
    app.route('/knowledge/tickets', createKnowledgeTicketRoutes(knowledge));

  // The application's authentication and authorization as the API routes meet them: a person is named by
  // `x-test-user`; a run by its token, through the agents plugin's credential; Studio bounds a run by its scope.
  const auth = new Auth({
    connection: database.connection(),
    secret: 'bridge-harness-secret-at-least-32-characters',
    baseURL: 'http://localhost/api/auth',
  });
  const sessionOf = auth.getSession.bind(auth);
  auth.getSession = (headers, sessionOptions) => {
    const user = headers.get('x-test-user');
    if (!user) return sessionOf(headers, sessionOptions);
    const now = new Date();
    return Promise.resolve({
      user: {
        id: user,
        name: user,
        email: `${user}@example.com`,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      session: {
        id: `session-${user}`,
        token: `session-${user}`,
        userId: user,
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: now,
        updatedAt: now,
      },
    });
  };
  auth.addCredentialResolver(runCredentialResolver(agents));
  // `x-test-key-scope` stands for a scoped API key: refused where a route does not opt in.
  auth.addScopedCredentialCheck((_session, request) =>
    request.headers.has('x-test-key-scope'),
  );
  const steps: AuthorizationMiddleware[] = [
    runScopeStep(agents, (identity) =>
      Promise.resolve({
        reports: roleOf(identity.userId) !== 'none',
        allRuns: roleOf(identity.userId) === 'admin',
      }),
    ),
  ];
  const authorization = {
    middleware: (): MiddlewareHandler => async (context, next) => {
      const session = context.get('auth' as never) as {
        user: { id: string };
      } | null;
      if (!session) return next();
      const authzRequest: AuthorizationMiddlewareRequest = {
        http: context,
        principal: { type: 'user', id: session.user.id },
        subjects: { add: () => undefined, values: () => [] },
      };
      for (const step of steps)
        await step(authzRequest, () => Promise.resolve());
      // A scoped API key, as `x-test-key-scope` names its groups (JSON).
      const keyScope: KeyScope | undefined =
        authzRequest.keyScope ??
        testKeyScope(context.req.header('x-test-key-scope'));
      const role = roleOf(session.user.id);
      const held = (resource: { type: string; id: string }, action: string) =>
        resource.type === 'page'
          ? role !== 'none'
          : resource.type === 'settings' &&
              resource.id === 'agents.agents' &&
              action === 'read'
            ? role === 'admin'
            : role !== 'none';
      context.set(
        'authz' as never,
        {
          identity: {
            principal: authzRequest.principal,
            subjects: [],
            ...(keyScope ? { keyScope } : {}),
          },
          can: ({
            resource,
            action,
          }: {
            resource: { type: string; id: string };
            action: string;
          }) =>
            Promise.resolve(
              held(resource, action) &&
                (keyScope?.allows(resource, action) ?? true),
            ),
        } as never,
      );
      await next();
    },
  };
  const keyScopes = createApiKeyScopes();
  registerStudioKeyScopes(keyScopes, {}, testCatalog);
  function testKeyScope(groups: string | undefined): KeyScope | undefined {
    if (!groups) return undefined;
    return keyScopes.compile(
      'test-key',
      keyScopes.validate({ groups: JSON.parse(groups) as never }),
    );
  }
  const container = new ServiceContainer();
  container.instance(authenticationToken, auth);
  container.instance(authorizationToken, authorization as never);
  container.instance(projectsToken, projects);
  container.instance(projectsAccessToken, access);
  container.instance(projectsRequestActorToken, (context) =>
    principal ? principal.actor(context) : Promise.resolve(undefined),
  );
  container.instance(projectsPlanSourceToken, (context) =>
    principal ? principal.planSource(context) : Promise.resolve(undefined),
  );
  container.instance(projectsDelegatedWritesToken, {
    covers: (viewer) => principal?.writes.covers(viewer) ?? false,
    write: (viewer, writeRequest) =>
      principal
        ? principal.writes.write(viewer, writeRequest)
        : Promise.reject(new Error('Studio is not connected.')),
  });
  if (releaseServices) container.instance(releasesToken, releaseServices);
  if (buildsService) container.instance(studioBuildsToken, buildsService);
  container.instance(studioReportsToken, reports);
  // Studio's inbox as `inbox list` reads it.
  container.instance(studioInboxSourceToken, inboxSource);
  container.instance(agentsToken, agents);
  container.instance(studioDelegationsToken, delegations);
  // Studio's pull request and preview routes (`pr`, `preview`), as the provider binds them.
  const gitCallers = createPermissionSource(
    () => access,
    createAskerLookup(agents),
  );
  container.instance(studioGitToken, {
    git: () => git,
    connections: () => gitConnections,
    viewerOf: (userId) =>
      gitCallers.viewerOf({ kind: 'user', userId, displayName: userId }),
    callerViewerOf: (identity) => gitCallers.viewerOf(identity),
    gitSettings: (userId) =>
      Promise.resolve({
        read: roleOf(userId) === 'admin',
        manage: roleOf(userId) === 'admin',
      }),
    callbackUrl: () => '/oauth/git/callback',
    absoluteUrl: (path) => path,
    publicOrigin: () => null,
    appPath: (path) => path,
    poller: {
      start: () => undefined,
      stop: () => undefined,
      tick: () => Promise.resolve(),
      pollNow: () => Promise.resolve(),
    },
    events: () => gitEvents,
    repoEvents: () => gitRepoEvents,
  });
  if (previewApi) container.instance(studioPreviewApiToken, previewApi);
  if (deploys) container.instance(studioDeploysToken, deploys);
  const appLike: AppPluginApplication = {
    appName: 'main',
    publicBasePath: '',
    config: { app: { name: 'main', publicBasePath: '' } } as never,
    paths: createAppPaths({ rootDir: os.tmpdir() }),
    router: app,
    container,
  };
  // The API routes the CLI's commands are: the projects plugin's, and release management's when assembled.
  const api = new Hono();
  for (const contribution of [
    ...(projectsPlugin.routes ?? []),
    ...(releaseServices ? (releasesPlugin.routes ?? []) : []),
    // CI's builds (`release upload`, `build status`, `deploy`).
    ...(buildsService ? [buildsRoutes] : []),
  ])
    api.route('/', await contribution.createRouter(appLike));
  api.route('/', await reportsRoutes.createRouter(appLike as unknown as never));
  api.route(
    '/',
    await studioAgentsRoutes.createRouter(appLike as unknown as never),
  );
  api.route('/', await inboxRoutes.createRouter(appLike as unknown as never));
  api.route(
    '/',
    await stageRunRoutes.createRouter(appLike as unknown as never),
  );
  // `issue runs`, `run get`, `run events`, and the agents plugin's `agent list`.
  api.route(
    '/',
    await issueRunsRoutes.createRouter(appLike as unknown as never),
  );
  api.route(
    '/agents',
    createRosterRoutes(
      agents,
      every(
        auth.required({ scopedKeys: true }),
        authorization.middleware(),
        async (context, next) => {
          const session = context.get('auth' as never) as {
            user: { id: string };
          };
          context.set('caller' as never, { userId: session.user.id } as never);
          await next();
        },
      ) as never,
    ),
  );
  api.route('/', await gitRoutes.createRouter(appLike as unknown as never));
  api.route(
    '/',
    await previewsRoutes.createRouter(appLike as unknown as never),
  );
  if (knowledge && knowledgeViews)
    api.route(
      '/kb',
      createKnowledgeViewRoutes({
        views: knowledgeViews,
        allowed: (identity) => agents.gate.allowed(identity),
        basePath: () => '',
        knowledge: () => knowledge,
        authenticate: auth.required({ scopedKeys: true }) as never,
        authorize: authorization.middleware(),
      }),
    );
  app.route('/', api);
  // The command manifest, derived from those routes' document and the agents plugin's custom commands.
  const docs = new ApiDocsService();
  docs.attach({
    api: (() => {
      const documented = new Hono();
      documented.route('/', api);
      documented.route('/agents', createRunRoutes(agents));
      return documented;
    })(),
    describe: () => ({ info: { title: 'Studio', version: '0.0.0' } }),
  });
  const cli = new CliService();
  const surface = bindCliSurface({
    cli,
    auth: () => auth,
    authenticatePerson: every(
      auth.required({ scopedKeys: true }),
      authorization.middleware(),
    ),
    gate: agents.gate,
  });
  app.route('/', createCliRouter(cli, docs));
  const manifestForIdentity: BridgeHarness['manifestFor'] = async (identity) =>
    cli.manifestFor(await docs.getDocument(), await surface.callerOf(identity));
  online.commandsOf = async (identity, token) => ({
    bin: 'nb-studio',
    commands: (await manifestForIdentity(identity)).commands,
    // The manifest names the routes under `/api`; the harness serves them at its root.
    send: (request) =>
      Promise.resolve(
        app.fetch(
          new Request(
            `http://application${request.path.replace(/^\/api\//u, '/')}`,
            {
              method: request.method,
              headers: {
                [HEADERS.runToken]: token,
                accept: 'application/json',
                ...(request.body === undefined
                  ? {}
                  : { 'content-type': 'application/json' }),
              },
              ...(request.body === undefined ? {} : { body: request.body }),
            },
          ),
        ),
      ),
  });
  const manifestOf: BridgeHarness['manifest'] = async (who) => {
    const headers: Record<string, string> = {};
    if (who.runToken) headers[HEADERS.runToken] = who.runToken;
    if (who.user) headers['x-test-user'] = who.user;
    const response = await app.request('/cli/manifest', { headers });
    if (response.status !== 200)
      throw new Error(`Manifest failed: ${await response.text()}`);
    return ((await response.json()) as { data: CliManifest }).data;
  };

  const request: BridgeHarness['request'] = async (
    method,
    url,
    options = {},
  ) => {
    const headers: Record<string, string> = {
      [HEADERS.protocol]: String(PROTOCOL_VERSION),
      ...(options.raw === undefined
        ? { 'content-type': 'application/json' }
        : {}),
      ...(options.headers ?? {}),
    };
    if (options.runToken) headers[HEADERS.runToken] = options.runToken;
    if (options.user) headers['x-test-user'] = options.user;
    const response = await app.request(url, {
      method,
      headers,
      ...(options.raw !== undefined
        ? { body: options.raw }
        : options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
    });
    const text = await response.text();
    let body: unknown = null;
    if (text)
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        // A download answers the file itself.
        body = text;
      }
    return { status: response.status, body, headers: response.headers };
  };

  let runnerKey: string | undefined;

  return {
    database,
    ...(knowledge ? { knowledge } : {}),
    stored,
    ...(releases ? { releases } : {}),
    ...(driver ? { driver } : {}),
    ...(previewService ? { previews: previewService } : {}),
    ...(buildsService ? { builds: buildsService } : {}),
    ...(previewApi ? { previewApi } : {}),
    ...(deploys ? { deploys } : {}),
    deployChecks,
    ...(links ? { links } : {}),
    notices,
    agents,
    projects,
    delegations,
    roles,
    inbox,
    git,
    gitConnections,
    gitRepoEvents,
    github,
    preferences,
    port,
    app,
    request,
    manifest: manifestOf,
    manifestFor: manifestForIdentity,
    commandsOf: (identity, token) => online.commandsOf!(identity, token),
    async addUser(id) {
      const now = new Date();
      await database
        .connection()
        .repository('user')
        .createOne({
          values: {
            id,
            name: id,
            username: id,
            email: `${id}@example.com`,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
        });
      return id;
    },
    viewer: (userId) => ({
      userId,
      actor: { type: 'user', id: userId },
      permissions: permissionsOf(roleOf(userId), userId),
    }),
    async createAgent(input = {}) {
      const agent = await agents.agents.create('alice', {
        name: 'Coder',
        modelEntries: [{ tool: 'claude', model: null }],
        access: 'everyone',
        actions: ['pm.issues/view', 'pm.issues/comment', 'pm.issues/edit'],
        instructions: 'Prefer small commits.',
        ...input,
      });
      return agent.id;
    },
    async claimOne(features) {
      if (!runnerKey) {
        const token = await agents.runners.createRegistrationToken('alice', {
          trust: 'team',
        });
        const registration: RegisterRequest = {
          registrationToken: token.token,
          name: 'runner',
          hostname: 'host',
          os: 'darwin',
          arch: 'arm64',
          version: '0.0.1',
          protocolVersion: PROTOCOL_VERSION,
          features: (features ?? [
            'input',
            'checkout',
            'directories',
            'skills',
            'secrets',
          ]) as RegisterRequest['features'],
          tools: [{ kind: 'claude', authenticated: true }],
          slots: 2,
        };
        const registered = await request('POST', '/agents/runners/register', {
          body: registration,
        });
        if (registered.status !== 200)
          throw new Error(
            `Registration failed: ${JSON.stringify(registered.body)}`,
          );
        runnerKey = registered.body.data.runnerKey as string;
      }
      const claimed = await request('POST', '/agents/runners/claim', {
        headers: { [HEADERS.runnerKey]: runnerKey },
        body: { free: 1 },
      });
      if (claimed.status !== 200)
        throw new Error(`Claim failed: ${JSON.stringify(claimed.body)}`);
      return claimed.body.data.runs[0];
    },
    runnerKey: () => runnerKey,
    async runner(route, runId, body) {
      const answer = await request(
        'POST',
        routePath(route, { runId }).replace(/^\/api/u, ''),
        { headers: { [HEADERS.runnerKey]: runnerKey ?? '' }, body },
      );
      return answer.status < 400
        ? { ...answer, body: answer.body?.data }
        : answer;
    },
    async close() {
      await delegations.settled();
      await releases?.releases.shutdown();
      await testDatabase.destroy();
      if (releasesDir) rmSync(releasesDir, { recursive: true, force: true });
    },
  };
}
