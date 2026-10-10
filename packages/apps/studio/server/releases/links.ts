/**
 * The Apps a project's repository builds (`studioRepoApps`, `shared/releases.ts`), and how release management's Apps
 * relate to users in Studio:
 *
 * - an App relates to a user for `view` and `read-logs` when it is linked to a repository of a project they can see
 *   (one visible to everyone, or one they lead or belong to), and for every other action when it is linked to a
 *   repository of a project they lead; the Apps they created are related by the plugin itself;
 * - further sources can relate Apps (`RelatedAppSource`): a pull request's preview Apps follow the permissions of the
 *   issues it is linked to.
 *
 * An App relates to a set of users when it relates to any of them.
 *
 * CI is the source of truth: a staging or production build CI uploads to an App, its commit verified in the
 * repository, records that App as the repository's in that role (`recordRepositoryApp`, `../builds/service.ts`), so a
 * repository's Apps need no linking by hand. A pull request's preview App is never one of them (`../previews`).
 *
 * Changing the links by hand (the repository settings, until they show only what CI recorded) is managing the project
 * (`pm.projects/manage`: every project, or the ones the user leads), and linking an App asks for configuring it
 * (`rel.apps/configure`) without the link being made, so a link never widens what its maker may do. The "Deploy &
 * previews" choices (`plan`, `DeploySettings`) are applied on top of the links given: a staging or production
 * environment chosen without an App in that role creates one there, one left out unlinks the App in that role; the
 * preview choice no longer does anything, as CI deploys previews (no App is created for them). Studio creates the Apps
 * for the person (`createdBy` is them), who must be allowed to set Apps up (`maySetUpApps`); an App created is theirs,
 * so linking it asks nothing more. The CI choice is recorded (`ci.ts`); while it is on, every save, and every App CI's
 * builds add, hands the repository to the CI setup (`../builds/ci-setup.ts`), which sets it up the first time and keeps
 * its key and workflow in step afterwards.
 */
import {
  reaches,
  type AppAction,
} from '@nocobase/app-plugin-releases/shared/access';
import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';

import { PREVIEW_LABEL, RELEASE_LABELS } from '../../shared/previews.js';
import {
  APP_ROLES,
  appIdsFor,
  maySetUpApps,
  type AppRole,
  type DeploySettings,
  type RepositoryAppLink,
  type AppRepository,
  type RepositoryDeployment,
  type RepositoryLinkedApp,
} from '../../shared/releases.js';
import type { Permissions } from '../../shared/access.js';
import { forbidden, invalid, notFound } from '../access/errors.js';
import { ciOf, recordCiChoice, type CiSetupHook } from './ci.js';

const TABLE = 'studioRepoApps';

/** At most this many Apps per repository. */
export const MAX_REPOSITORY_APPS = 20;

/** Actions whose "related" reaches the projects a user can see rather than the ones they lead. */
const SEEING: readonly AppAction[] = ['view', 'read-logs'];

/** Another way an App relates to a user (pull request previews: their issues' permissions). */
export interface RelatedAppSource {
  appIds(userId: string, action: AppAction): Promise<readonly string[]>;
  isRelated(appId: string, userId: string, action: AppAction): Promise<boolean>;
}

/** What linking needs to know of release management, without depending on its services' shapes. */
export interface LinkReleases {
  /** The App, or null when there is no such App. */
  app(appId: string): Promise<{
    readonly name: string;
    readonly environmentId: string;
    readonly labels: Readonly<Record<string, string>>;
  } | null>;
  /** Whether there is such an environment. */
  environmentExists(id: string): Promise<boolean>;
  /** The environment, with whether it runs uploaded release archives; null when there is none. */
  environment(id: string): Promise<{
    readonly name: string;
    readonly protected: boolean;
    readonly archives: boolean;
  } | null>;
  /** Whether the user may configure the App as things stand (before the link). */
  mayConfigure(userId: string, appId: string): Promise<boolean>;
  /** The user's scopes on Apps, for whether Studio may set Apps up for them. */
  appScopes(userId: string): Promise<Parameters<typeof maySetUpApps>[0]>;
  /** Creates an App on the user's behalf: Studio creates it, and it is theirs (`createdBy`). */
  createApp(
    userId: string,
    input: {
      readonly id: string;
      readonly name: string;
      readonly environmentId: string;
      readonly labels?: Readonly<Record<string, string>>;
    },
  ): Promise<void>;
}

export interface LinkViewer {
  readonly userId: string;
  readonly permissions: Pick<Permissions, 'scopes'>;
}

/** A link as Studio's other parts read it. */
export interface RepositoryAppRow extends RepositoryAppLink {
  readonly resourceId: string;
  readonly environmentId: string;
}

export interface RepositoryLinks {
  /**
   * The working directory a person names on the command line: `owner/repo`, the one of the projects the viewer may
   * see that work in it (`REPOSITORY_AMBIGUOUS` when several do); anything else is taken as its id, which only Studio's
   * own pages send.
   */
  resolve(viewer: LinkViewer, ref: string): Promise<string>;
  read(viewer: LinkViewer, resourceId: string): Promise<RepositoryDeployment>;
  save(
    viewer: LinkViewer,
    resourceId: string,
    input: unknown,
  ): Promise<RepositoryDeployment>;
  /**
   * Checks "Deploy & previews" choices for a repository not added yet, whose Apps would all be created: the
   * environments, and that the viewer may have Apps set up. Throws what `save` would.
   */
  checkPlan(viewer: LinkViewer, plan: unknown): Promise<DeploySettings>;
  /**
   * The repositories that build an App, in the projects the viewer may see; for a preview App, first the repository
   * whose pull request it previews.
   */
  appRepositories(viewer: LinkViewer, appId: string): Promise<AppRepository[]>;
  /** Apps linked to repositories of the projects the users lead, or (for `view`, `read-logs`) can see. */
  relatedAppIds(
    userIds: readonly string[],
    action: AppAction,
  ): Promise<string[]>;
  isRelated(
    appId: string,
    userIds: readonly string[],
    action: AppAction,
  ): Promise<boolean>;
  /** The leads of the projects whose repositories deploy to the App. */
  leadsOf(appId: string): Promise<string[]>;
  /** Adds a source of related Apps; returns what removes it. */
  addSource(source: RelatedAppSource): () => void;
}

export interface RepositoryLinksOptions {
  readonly database: Pick<DatabaseManager, 'connection' | 'transaction'>;
  readonly releases: () => LinkReleases;
  readonly newId: () => string;
  /** Sets a repository's CI up when `configureCi` is chosen; none records the choice only. */
  readonly ciSetup?: () => CiSetupHook | undefined;
  readonly onError?: (message: string, error: unknown) => void;
}

interface ProjectRow {
  readonly id: string;
  readonly leadUserId: string | null;
  readonly visibility: string;
}

/** A column's text, or null. */
function textOf(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint')
    return String(value);
  return null;
}

function isRole(value: unknown): value is AppRole {
  return (APP_ROLES as readonly unknown[]).includes(value);
}

export function decodeRepositoryApp(row: Row): RepositoryAppRow {
  return {
    resourceId: String(row.resourceId),
    appId: String(row.appId),
    environmentId: String(row.environmentId),
    role: isRole(row.role) ? row.role : null,
    previewEnvironmentId: textOf(row.previewEnvironmentId) || null,
  };
}

/** The links of a working directory, in their order. */
export async function repositoryApps(
  conn: DatabaseConnection,
  resourceId: string,
): Promise<RepositoryAppRow[]> {
  const rows = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('resourceId', '=', resourceId)
    .orderBy('position')
    .orderBy('createdAt')
    .execute<Row>();
  return rows.map(decodeRepositoryApp);
}

/**
 * The working directories whose repository on its git host is `fullName` (`owner/repo`, or a GitLab group path),
 * matched case-insensitively: one per project that works in it.
 */
export async function workingDirectoriesOf(
  conn: DatabaseConnection,
  fullName: string,
): Promise<string[]> {
  const wanted = fullName.trim().toLowerCase();
  const rows = await conn.query
    .selectFrom('pmProjectResources')
    .select(['id', 'bindingFullName'])
    .where('type', '=', 'gitRepo')
    .where('bindingFullName', 'is not', null)
    .execute<Row>();
  return rows
    .filter((row) => String(row.bindingFullName).toLowerCase() === wanted)
    .map((row) => String(row.id));
}

/** The repositories (working directories) an App is recorded for, the first recorded first. */
export async function repositoriesOfApp(
  conn: DatabaseConnection,
  appId: string,
): Promise<RepositoryAppRow[]> {
  const rows = await conn.query
    .selectFrom(TABLE)
    .selectAll()
    .where('appId', '=', appId)
    .orderBy('createdAt')
    .execute<Row>();
  return rows.map(decodeRepositoryApp);
}

/**
 * Records that the repository builds the App for a role, as a verified CI build says: a row for an App not recorded
 * yet, the role given to a row without one. Answers whether anything changed.
 */
export async function recordRepositoryApp(
  conn: DatabaseConnection,
  input: {
    readonly resourceId: string;
    readonly appId: string;
    readonly role: AppRole;
    readonly environmentId: string;
    readonly by: string | null;
    readonly newId: () => string;
  },
): Promise<boolean> {
  const existing = (await repositoryApps(conn, input.resourceId)).find(
    (link) => link.appId === input.appId,
  );
  const now = new Date();
  if (existing) {
    if (existing.role) return false;
    await conn.query
      .updateTable(TABLE)
      .set({ role: input.role, updatedAt: now })
      .where('resourceId', '=', input.resourceId)
      .where('appId', '=', input.appId)
      .execute();
    return true;
  }
  const position = (await repositoryApps(conn, input.resourceId)).length;
  await conn.query
    .insertInto(TABLE)
    .values({
      id: input.newId(),
      resourceId: input.resourceId,
      appId: input.appId,
      environmentId: input.environmentId,
      role: input.role,
      previewEnvironmentId: null,
      position,
      createdBy: input.by,
      createdAt: now,
      updatedAt: now,
    })
    .execute();
  return true;
}

function linksOf(input: unknown): RepositoryAppLink[] {
  const apps = (input as { apps?: unknown } | null)?.apps;
  if (!Array.isArray(apps))
    throw invalid('INVALID_LINKS', 'The body must be { apps: [...] }.');
  if (apps.length > MAX_REPOSITORY_APPS)
    throw invalid(
      'INVALID_LINKS',
      `A repository builds at most ${MAX_REPOSITORY_APPS} Apps.`,
    );
  const seen = new Set<string>();
  return apps.map((entry: unknown) => {
    const link = entry as Record<string, unknown> | null;
    if (!link || typeof link !== 'object')
      throw invalid('INVALID_LINKS', 'Each link names an App.');
    const appId = typeof link.appId === 'string' ? link.appId.trim() : '';
    if (!appId) throw invalid('INVALID_LINKS', 'Each link names an App.');
    if (seen.has(appId))
      throw invalid('INVALID_LINKS', `${appId} is linked twice.`);
    seen.add(appId);
    if (link.role !== undefined && link.role !== null && !isRole(link.role))
      throw invalid(
        'INVALID_LINKS',
        `A role is ${APP_ROLES.join(' or ')}, or none.`,
      );
    const previewEnvironmentId =
      typeof link.previewEnvironmentId === 'string' &&
      link.previewEnvironmentId.trim()
        ? link.previewEnvironmentId.trim()
        : null;
    return {
      appId,
      role: isRole(link.role) ? link.role : null,
      previewEnvironmentId,
    };
  });
}

const ENVIRONMENT_KEYS = [
  'previewEnvironmentId',
  'stagingEnvironmentId',
  'productionEnvironmentId',
] as const;

/** The "Deploy & previews" choices as given, or null when there are none. */
export function planOf(input: unknown): DeploySettings | null {
  if (input === undefined || input === null) return null;
  if (typeof input !== 'object' || Array.isArray(input))
    throw invalid('INVALID_PLAN', 'The plan is an object.');
  const plan = input as Record<string, unknown>;
  const ids = ENVIRONMENT_KEYS.map((key) => {
    const value = plan[key];
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || value.length > 64)
      throw invalid('INVALID_PLAN', `${key} is an environment's ID, or null.`);
    return value.trim() || null;
  });
  return {
    previewEnvironmentId: ids[0] ?? null,
    stagingEnvironmentId: ids[1] ?? null,
    productionEnvironmentId: ids[2] ?? null,
    configureCi: plan.configureCi === true,
  };
}

/** What a repository's name is, for the Apps named after it: `owner/name`'s name, else the URL's last segment. */
export function repositoryNameOf(resource: {
  readonly repo: string | null;
  readonly url: string | null;
}): string {
  const fromRepo = resource.repo?.split('/').pop();
  if (fromRepo) return fromRepo;
  const fromUrl = resource.url
    ?.replace(/\/+$/u, '')
    .split(/[/:]/u)
    .pop()
    ?.replace(/\.git$/u, '');
  return fromUrl || 'app';
}

/** An App the plan needs, to create before linking it. */
interface PlannedApp {
  readonly id: string;
  readonly name: string;
  readonly environmentId: string;
  readonly labels?: Readonly<Record<string, string>>;
}

export function createRepositoryLinks(
  options: RepositoryLinksOptions,
): RepositoryLinks {
  const sources: RelatedAppSource[] = [];
  const query = () => options.database.connection().query;

  async function projectOf(resourceId: string): Promise<
    ProjectRow & {
      readonly repo: string | null;
      readonly defaultRef: string | null;
      readonly url: string | null;
    }
  > {
    const row = await query()
      .selectFrom('pmProjectResources as resource')
      .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
      .select([
        'project.id as id',
        'project.leadUserId as leadUserId',
        'project.visibility as visibility',
        'resource.bindingFullName as repo',
        'resource.defaultRef as defaultRef',
        'resource.url as url',
      ])
      .where('resource.id', '=', resourceId)
      .executeTakeFirst<Row>();
    if (!row) throw notFound('Repository');
    return {
      id: String(row.id),
      leadUserId: textOf(row.leadUserId),
      visibility: String(row.visibility),
      repo: textOf(row.repo) || null,
      defaultRef: textOf(row.defaultRef) || null,
      url: textOf(row.url) || null,
    };
  }

  async function hasMember(projectId: string, userIds: readonly string[]) {
    if (userIds.length === 0) return false;
    return Boolean(
      await query()
        .selectFrom('pmProjectMembers')
        .select('id')
        .where('projectId', '=', projectId)
        .where('userId', 'in', [...userIds])
        .executeTakeFirst(),
    );
  }

  function mayManage(viewer: LinkViewer, project: ProjectRow): boolean {
    return reaches(
      viewer.permissions.scopes['pm.projects/manage'],
      project.leadUserId,
    );
  }

  async function maySee(
    viewer: LinkViewer,
    project: ProjectRow,
  ): Promise<boolean> {
    const scope = viewer.permissions.scopes['pm.projects/view'];
    if (scope === 'all' || mayManage(viewer, project)) return true;
    if (scope === 'none') return false;
    return (
      project.visibility === 'everyone' ||
      reaches(scope, project.leadUserId) ||
      (await hasMember(project.id, scope.users))
    );
  }

  async function currentApps(
    resourceId: string,
  ): Promise<RepositoryLinkedApp[]> {
    const rows = await repositoryApps(
      options.database.connection(),
      resourceId,
    );
    const releases = options.releases();
    const apps: RepositoryLinkedApp[] = [];
    for (const row of rows) {
      const app = await releases.app(row.appId);
      apps.push({
        appId: row.appId,
        role: row.role,
        previewEnvironmentId: row.previewEnvironmentId,
        name: app?.name ?? row.appId,
        environmentId: app?.environmentId ?? row.environmentId,
      });
    }
    return apps;
  }

  async function answer(
    resourceId: string,
    project: Awaited<ReturnType<typeof projectOf>>,
    canEdit: boolean,
  ): Promise<RepositoryDeployment> {
    const apps = await currentApps(resourceId);
    return {
      resourceId,
      projectId: project.id,
      apps,
      ci: await ciOf(options.database.connection(), resourceId),
      repo: project.repo,
      defaultBranch: project.defaultRef ?? 'main',
      canEdit,
    };
  }

  /** Apps linked to repositories of the projects the users lead, or for seeing actions can see. */
  async function linkedAppIds(
    userIds: readonly string[],
    action: AppAction,
    appId?: string,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];
    const users = [...userIds];
    let builder = query()
      .selectFrom(`${TABLE} as link`)
      .innerJoin(
        'pmProjectResources as resource',
        'resource.id',
        'link.resourceId',
      )
      .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
      .select('link.appId as appId')
      .distinct();
    if (appId) builder = builder.where('link.appId', '=', appId);
    builder = SEEING.includes(action)
      ? builder.where((eb) =>
          eb.or([
            eb('project.leadUserId', 'in', users),
            eb('project.visibility', '=', 'everyone'),
            eb(
              'project.id',
              'in',
              eb
                .selectFrom('pmProjectMembers')
                .select('projectId')
                .where('userId', 'in', users),
            ),
          ]),
        )
      : builder.where('project.leadUserId', 'in', users);
    const rows = await builder.execute<Row>();
    return rows.map((row) => String(row.appId));
  }

  /** The environments a plan names exist, and its preview environment runs archives and is not protected. */
  async function checkEnvironments(plan: DeploySettings): Promise<void> {
    const releases = options.releases();
    for (const key of ENVIRONMENT_KEYS) {
      const id = plan[key];
      if (!id) continue;
      const environment = await releases.environment(id);
      if (!environment)
        throw invalid('UNKNOWN_ENVIRONMENT', `There is no environment ${id}.`);
      if (key === 'previewEnvironmentId') await checkPreviewEnvironment(id);
    }
  }

  /** Previews run release archives built from pull requests, without anyone confirming each deployment. */
  async function checkPreviewEnvironment(id: string): Promise<void> {
    const environment = await options.releases().environment(id);
    if (!environment)
      throw invalid('UNKNOWN_ENVIRONMENT', `There is no environment ${id}.`);
    if (!environment.archives || environment.protected)
      throw invalid(
        'PREVIEW_ENVIRONMENT_UNSUITABLE',
        `${environment.name} cannot run previews: previews need an environment that runs uploaded archives and is not protected.`,
      );
  }

  async function requireSetUp(viewer: LinkViewer): Promise<void> {
    if (!maySetUpApps(await options.releases().appScopes(viewer.userId)))
      throw forbidden(
        'Only someone who may create Apps, or deploy to every App, has Studio set them up; link Apps that exist instead.',
        'APPS_NOT_CREATABLE',
      );
  }

  /** `base`, or `base-2`, `base-3`…: the first App ID nobody has, nor another App planned. */
  async function freeAppId(
    base: string,
    planned: readonly PlannedApp[],
  ): Promise<string> {
    const releases = options.releases();
    for (let attempt = 1; attempt < 100; attempt += 1) {
      const id = attempt === 1 ? base : `${base}-${attempt}`;
      if (planned.some((app) => app.id === id)) continue;
      if (!(await releases.app(id))) return id;
    }
    throw invalid('APP_ID_UNAVAILABLE', `No App ID like ${base} is free.`);
  }

  /** The links once the plan is applied to `links`, and the Apps to create for it. */
  async function applyPlan(
    links: readonly RepositoryAppLink[],
    plan: DeploySettings,
    repoName: string,
  ): Promise<{
    readonly links: RepositoryAppLink[];
    readonly create: PlannedApp[];
  }> {
    const ids = appIdsFor(repoName);
    const create: PlannedApp[] = [];
    let next = [...links];
    const roles = [
      ['production', plan.productionEnvironmentId, ids.production, repoName],
      [
        'staging',
        plan.stagingEnvironmentId,
        ids.staging,
        `${repoName} staging`,
      ],
    ] as const;
    for (const [role, environmentId, base, name] of roles) {
      const linked = next.some((link) => link.role === role);
      if (!environmentId) {
        next = next.filter((link) => link.role !== role);
        continue;
      }
      if (linked) continue;
      const id = await freeAppId(base, create);
      create.push({ id, name, environmentId });
      next.push({ appId: id, role, previewEnvironmentId: null });
    }
    // Previews are CI's: the preview choice creates nothing and previews nothing.
    return { links: next, create };
  }

  return {
    async resolve(viewer, ref) {
      if (!ref.includes('/')) return ref;
      const visible: string[] = [];
      for (const id of await workingDirectoriesOf(
        options.database.connection(),
        ref,
      ))
        if (await maySee(viewer, await projectOf(id))) visible.push(id);
      if (visible.length === 0) throw notFound('Repository');
      if (visible.length > 1)
        throw invalid(
          'REPOSITORY_AMBIGUOUS',
          `${ref} is the repository of ${visible.length} projects you can see; open the one you mean from its project’s settings.`,
        );
      return visible[0];
    },

    async read(viewer, resourceId) {
      const project = await projectOf(resourceId);
      if (!(await maySee(viewer, project))) throw notFound('Repository');
      return answer(resourceId, project, mayManage(viewer, project));
    },

    async checkPlan(viewer, input) {
      const plan = planOf(input);
      if (!plan)
        return {
          previewEnvironmentId: null,
          stagingEnvironmentId: null,
          productionEnvironmentId: null,
          configureCi: false,
        };
      await checkEnvironments(plan);
      if (ENVIRONMENT_KEYS.some((key) => plan[key])) await requireSetUp(viewer);
      return plan;
    },

    async save(viewer, resourceId, input) {
      const project = await projectOf(resourceId);
      if (!mayManage(viewer, project))
        throw forbidden(
          'Only someone who manages the project may change the Apps it builds.',
        );
      const before = await repositoryApps(
        options.database.connection(),
        resourceId,
      );
      const given = linksOf(input);
      const plan = planOf((input as { plan?: unknown } | null)?.plan);
      let links = given;
      let create: PlannedApp[] = [];
      if (plan) {
        await checkEnvironments(plan);
        ({ links, create } = await applyPlan(
          given,
          plan,
          repositoryNameOf(project),
        ));
        if (create.length > 0) await requireSetUp(viewer);
        if (links.length > MAX_REPOSITORY_APPS)
          throw invalid(
            'INVALID_LINKS',
            `A repository builds at most ${MAX_REPOSITORY_APPS} Apps.`,
          );
      }
      const releases = options.releases();
      const environments = new Map<string, string>(
        create.map((app) => [app.id, app.environmentId]),
      );
      for (const link of links) {
        if (environments.has(link.appId)) continue;
        const app = await releases.app(link.appId);
        if (!app)
          throw invalid('UNKNOWN_APP', `There is no App ${link.appId}.`);
        if (app.labels[RELEASE_LABELS.kind] === PREVIEW_LABEL)
          throw invalid(
            'PREVIEW_APP',
            `${link.appId} is a pull request's preview; link the App it previews instead.`,
          );
        environments.set(link.appId, app.environmentId);
        const old = before.find((item) => item.appId === link.appId);
        // A preview environment is checked when it is chosen.
        if (
          link.previewEnvironmentId &&
          link.previewEnvironmentId !== old?.previewEnvironmentId
        )
          await checkPreviewEnvironment(link.previewEnvironmentId);
        // Linking an App relates it to the project's lead: only someone who may already configure it links it.
        if (!old && !(await releases.mayConfigure(viewer.userId, link.appId)))
          throw forbidden(
            `Only someone who may configure ${link.appId} may link it.`,
            'APP_NOT_CONFIGURABLE',
          );
      }
      // Release management's own writes: an App created stays should the links fail after it.
      for (const app of create) await releases.createApp(viewer.userId, app);
      await options.database.transaction(async (conn) => {
        await conn.query
          .deleteFrom(TABLE)
          .where('resourceId', '=', resourceId)
          .execute();
        const now = new Date();
        for (const [position, link] of links.entries())
          await conn.query
            .insertInto(TABLE)
            .values({
              id: options.newId(),
              resourceId,
              appId: link.appId,
              environmentId: environments.get(link.appId)!,
              role: link.role,
              previewEnvironmentId: link.previewEnvironmentId,
              position,
              createdBy: viewer.userId,
              createdAt: now,
              updatedAt: now,
            })
            .execute();
        if (plan)
          await recordCiChoice(conn, {
            resourceId,
            auto: plan.configureCi,
            userId: viewer.userId,
            now,
          });
      });
      // Asked for now, or asked for before: the CI follows the Apps saved (a new key scope, a workflow to propose).
      const ci = await ciOf(options.database.connection(), resourceId);
      const ciSetup =
        ci?.auto && ci.state !== 'disabled' ? options.ciSetup?.() : undefined;
      if (ciSetup)
        await ciSetup({ resourceId, userId: viewer.userId }).catch(
          (error: unknown) =>
            (options.onError ?? console.error)(
              'Could not set up a repository’s CI.',
              error,
            ),
        );
      return answer(resourceId, project, true);
    },

    async appRepositories(viewer, appId) {
      const rows = await query()
        .selectFrom(`${TABLE} as link`)
        .innerJoin(
          'pmProjectResources as resource',
          'resource.id',
          'link.resourceId',
        )
        .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
        .select([
          'resource.id as resourceId',
          'project.id as projectId',
          'project.name as projectName',
          'project.leadUserId as leadUserId',
          'project.visibility as visibility',
          'resource.bindingFullName as repo',
          'resource.url as url',
        ])
        .where('link.appId', '=', appId)
        .orderBy('project.name')
        .orderBy('resource.position')
        .execute<Row>();
      // A preview App is built by the repository whose pull request it previews.
      const previews = await query()
        .selectFrom('studioPreviews as preview')
        .innerJoin(
          'pmProjectResources as resource',
          'resource.id',
          'preview.resourceId',
        )
        .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
        .select([
          'resource.id as resourceId',
          'project.id as projectId',
          'project.name as projectName',
          'project.leadUserId as leadUserId',
          'project.visibility as visibility',
          'resource.bindingFullName as repo',
          'resource.url as url',
          'preview.number as pullRequest',
        ])
        .where('preview.appId', '=', appId)
        .execute<Row>();
      const items: AppRepository[] = [];
      for (const row of [...previews, ...rows]) {
        const project = {
          id: String(row.projectId),
          leadUserId: textOf(row.leadUserId),
          visibility: String(row.visibility),
        };
        if (!(await maySee(viewer, project))) continue;
        items.push({
          resourceId: String(row.resourceId),
          projectId: project.id,
          projectName: String(row.projectName),
          repo: textOf(row.repo) || null,
          url: textOf(row.url) ?? '',
          pullRequest:
            row.pullRequest === undefined || row.pullRequest === null
              ? null
              : Number(row.pullRequest),
        });
      }
      return items;
    },

    async relatedAppIds(userIds, action) {
      const ids = new Set(await linkedAppIds(userIds, action));
      for (const source of sources)
        for (const userId of userIds)
          for (const id of await source.appIds(userId, action)) ids.add(id);
      return [...ids];
    },

    async isRelated(appId, userIds, action) {
      if ((await linkedAppIds(userIds, action, appId)).length > 0) return true;
      for (const source of sources)
        for (const userId of userIds)
          if (await source.isRelated(appId, userId, action)) return true;
      return false;
    },

    async leadsOf(appId) {
      const rows = await query()
        .selectFrom(`${TABLE} as link`)
        .innerJoin(
          'pmProjectResources as resource',
          'resource.id',
          'link.resourceId',
        )
        .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
        .select('project.leadUserId as leadUserId')
        .distinct()
        .where('link.appId', '=', appId)
        .where('project.leadUserId', 'is not', null)
        .execute<Row>();
      return rows.map((row) => String(row.leadUserId));
    },

    addSource(source) {
      sources.push(source);
      return () => {
        const index = sources.indexOf(source);
        if (index !== -1) sources.splice(index, 1);
      };
    },
  };
}
