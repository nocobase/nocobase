/**
 * A repository's CI as Studio configures it (`shared/builds.ts`, `CiSetupView`; `shared/ci-modes.ts`):
 *
 * - **"Configure CI"** (`configure`) is a run, repeated whenever someone likes, connecting one application to one
 *   target (pull requests, a branch or a tag, deploying in any environment) in one of the ways Studio carries out: the
 *   standard workflow (`direct`), the file as edited (`template`), or an issue handing the work to an agent (`agent`),
 *   whose brief carries the file and commands but never the key. The ways a person does by hand are never sent here.
 *   Before anything is recorded the target is checked (`checkTarget`): the environment exists; a branch or tag's App
 *   either runs in that environment and is one the person may configure, or is missing and the person may set Apps
 *   up. An App that exists and is not the repository's yet is recorded for it, so the key reaches it at once. Nothing
 *   records which way ran nor the application it named; of a run only what shows its outcome is kept
 *   (`ci-run-store.ts`): the pull request it opened (the row's own columns), the agent's issue until it is finished,
 *   or the files waiting for a new repository's initialization.
 * - **The key**: an organization API key with the `ci-deploy` preset, limited to the Apps CI has recorded for the
 *   repository (none at first: Studio knows the key as the repository's, admits its builds by it and makes the Apps
 *   they name for the person who set the CI up, `../builds/service.ts`), named `<owner>/<repo> CI`, made as the person
 *   who ran the configuration (who gives only what they hold, `OrgApiKeyService`), and written as the repository's CI
 *   secret `NB_STUDIO_API_KEY` (`setCiSecret`: sealed to the repository's key, never stored by Studio). Every run gives it a
 *   fresh secret, as Studio cannot know whether the last one reached the repository. A key Studio manages shows its
 *   repository in Settings › API keys; disabling or deleting it there hands the CI back to the manual setup
 *   (`keyRevoked`) and tells the project's lead; the next run makes another.
 * - **The workflows** (`ci-workflow.ts`, headed "Managed by NocoBase Studio" with Studio's address): in a repository Studio created,
 *   committed to the default branch once its initialization finished and before the branch is protected
 *   (`commitInitial`, called by `../projects-init`), the key made then too; until then the setup is `pending`. In any
 *   other repository proposed in a pull request "Add Studio CI workflows" (or "Update …") from the branch
 *   `studio/ci-setup`, `pr-open` until it is merged or closed; a later run while it is open adds its file to it.
 * - **Keeping in step**: saving the repository's Apps, or CI's builds recording one, narrows or widens the key to them
 *   (`hook`, `appsChanged`); the workflows are left as the repository has them.
 * - **Rotation**: `rotateExpiring` (daily, `ci-key-rotation.job.ts`) gives every key expiring within 14 days a new
 *   secret and writes it to the repository; a failure is recorded and the project's lead and the administrators are
 *   told. `rotate` does the same at once, for someone who manages the project.
 * - **Revealed**: for a CI Studio cannot write to (another host, or a CI that runs elsewhere), `setup` and `rotate` with
 *   `reveal` make the same key, or give it a fresh secret, and answer the secret once instead of writing it; the person
 *   stores it as `NB_STUDIO_API_KEY`. Studio never keeps it. The setup is `manual` from then on, so the daily rotation
 *   leaves it alone: rotating it is the person's, revealed again.
 * - **Where it stands** (`connection`) is what CI reported, App by App, in the environment each App runs in
 *   (`ci-reports.ts`): connected only by an App's own builds. Before any report, the last run's outcome says what is
 *   awaited. `removeApp` takes an App off the list: its link to the repository goes (the key narrows), and the builds
 *   reported until then stop counting for it (`studioRepoCiHiddenApps`), so CI's next report brings it back.
 * - **Any failure** leaves the state `manual` with what failed: `lastError` in words, `lastFailure` a reason with what
 *   it names (`ciFailureOf`), which the browser words in the reader's language. Running the configuration again tries
 *   afresh.
 *
 * Nothing here calls the host inside a transaction, and the hook never throws.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type { DatabaseManager, Row } from '@nocobase/db';
import { randomUUID } from 'node:crypto';

import type { CiSetupView } from '../../shared/builds.js';
import {
  ciWorkflowPathOf,
  ciWorkflowTargetOf,
  type CiConnectionState,
  type CiConnectionView,
  type CiEnvironment,
  type CiFailure,
  type CiFailureReason,
  type CiReportedApp,
  type CiWorkflowOccupant,
} from '../../shared/ci-modes.js';
import { RELEASE_LABELS } from '../../shared/previews.js';
import {
  roleOfEnvironment,
  type CiWorkflow,
  type CiWorkflowFile,
} from '../../shared/releases.js';
import { AccessError, conflict, forbidden, invalid } from '../access/errors.js';
import type { GitConnections } from '../git/connections.js';
import { GitApiError } from '../git/platform.js';
import type { StudioInboxPort } from '../inbox/port.js';
import { INITS } from '../projects-init/store.js';
import {
  repoCiOfKey,
  repoCiRow,
  repoCisWithKeys,
  updateRepoCi,
  type CiSetupHook,
  type RepoCiChanges,
  type RepoCiRow,
} from '../releases/ci.js';
import {
  recordRepositoryApp,
  repositoryApps,
  repositoryNameOf,
} from '../releases/links.js';
import {
  DEFAULT_CI_TARGET,
  ciTaskBrief,
  ciTaskTitle,
  defaultCiApp,
  parseCiRun,
  standardCiWorkflow,
  type CheckedCiRun,
} from './ci-modes.js';
import { reportedApps, type HiddenCiApp } from './ci-reports.js';
import { ciRunOf, writeCiRun } from './ci-run-store.js';
import { repositoryBuildReports } from './store.js';

/** The branch the workflow is proposed from. */
export const CI_SETUP_BRANCH = 'studio/ci-setup';
/** A key expiring within this many days is rotated. */
export const ROTATE_WITHIN_DAYS = 14;
/** The inbox source of CI notices, and their types. */
export const CI_SOURCE = 'ci';
export const CI_KEY_ROTATION_FAILED = 'ci_key_rotation_failed';
export const CI_KEY_REVOKED = 'ci_key_revoked';

const DAY_MS = 24 * 60 * 60 * 1000;
const ERROR_MAX = 2000;

/** A key as the setup sees it. */
export interface CiKey {
  readonly id: string;
  readonly name: string;
  readonly expiresAt: string | null;
  readonly lastUsedAt: string | null;
  readonly status: 'active' | 'disabled' | 'expired';
  /** The Apps it is limited to; `all` when it is not limited. */
  readonly appIds: readonly string[] | 'all';
}

/** What the setup asks of the organization's API keys (`OrgApiKeyService`, adapted by the provider). */
export interface CiKeys {
  /** A `ci-deploy` key limited to `appIds`, made as `userId`: refused when they do not hold what it gives. */
  create(
    userId: string,
    input: {
      readonly name: string;
      readonly description: string;
      readonly appIds: readonly string[];
    },
  ): Promise<{ readonly id: string; readonly secret: string }>;
  /** Limits the key to `appIds`, as `userId`. */
  setApps(userId: string, id: string, appIds: readonly string[]): Promise<void>;
  /** A new secret, by `actorId` or by Studio itself (null). */
  rotate(
    id: string,
    actorId: string | null,
  ): Promise<{ readonly secret: string }>;
  find(id: string): Promise<CiKey | null>;
}

/** The issues an agent connects a repository's CI in (`agent`), as the projects plugin makes them. */
export interface CiTasks {
  /** An issue of the project given to the agent, created as `userId`. */
  create(
    userId: string,
    input: {
      readonly projectId: string;
      readonly title: string;
      readonly description: string;
      readonly agentId: string;
    },
  ): Promise<{ readonly id: string; readonly identifier: string | null }>;
  /** Whether the issue is finished (done or closed) or gone. */
  finished(issueId: string): Promise<boolean>;
}

/** What the setup asks of release management (`releasesToken`, adapted by the provider). */
export interface CiReleases {
  /** Every environment, in release management's order. */
  environments(): Promise<readonly CiEnvironment[]>;
  /** The App, or null when there is no such App. */
  app(appId: string): Promise<{
    readonly environmentId: string;
    readonly labels: Readonly<Record<string, string>>;
  } | null>;
  /** Whether the person may configure the App as things stand. */
  mayConfigure(userId: string, appId: string): Promise<boolean>;
  /** Whether Studio may set Apps up for the person (`maySetUpApps`). */
  maySetUpApps(userId: string): Promise<boolean>;
}

/** The Apps taken off repositories' lists (`removeApp`). */
const HIDDEN = 'studioRepoCiHiddenApps';

export interface CiSetupDeps {
  readonly database: Pick<DatabaseManager, 'connection'>;
  /** Release management: environments and Apps; without it a run's target is not checked and Apps' environments come from their links. */
  readonly releases?: () => CiReleases | undefined;
  readonly newId?: () => string;
  readonly connections: () => GitConnections | undefined;
  readonly keys: () => CiKeys | undefined;
  readonly inbox: () => StudioInboxPort | undefined;
  /** The workspace's administrators, told when a rotation fails. */
  readonly administrators: () => Promise<readonly string[]>;
  /** Studio's public address, which the CI signs in to; null when unknown (`app.publicOrigin` unset). */
  readonly studioUrl: () => string | null;
  /** The application's CLI as Studio serves it (`agents.cli.name`); `nb-studio` when left out. */
  readonly cli?: () => string;
  /** The title of the `agent` issue for a repository, in the installation's language; English when left out. */
  readonly taskTitle?: (repo: string) => Promise<string>;
  /** The issues of `agent`; none without the projects plugin. */
  readonly tasks?: () => CiTasks | undefined;
  readonly now?: () => Date;
  readonly onError?: (message: string, error: unknown) => void;
}

/** Where a key's fresh secret goes: the repository's CI secret, or (`reveal`) back to the person, once. */
export interface CiKeyDelivery {
  readonly reveal?: boolean;
}

export interface CiSetup {
  /** Bound to the repository links: keeps the key in step with the Apps after a save. Never throws. */
  readonly hook: CiSetupHook;
  /** Where the setup stands; `canManage` is whether the viewer manages the project. */
  view(resourceId: string, canManage: boolean): Promise<CiSetupView>;
  /**
   * Makes the repository's key again, or gives it a fresh secret, and writes it to the repository, for someone who
   * manages the project (`POST …/ci/setup`); the workflows are left alone. The outcome is in the view.
   *
   * With `reveal`, the secret is answered instead of written, for a CI Studio cannot write to: the person stores it
   * themselves, and the setup is `manual` from then on (Studio no longer rotates it by itself). A failure is then thrown,
   * not recorded. Answers the secret when revealed, null otherwise.
   */
  setup(
    userId: string,
    resourceId: string,
    options?: CiKeyDelivery,
  ): Promise<string | null>;
  /** A new secret for the key, written to the repository at once (`POST …/ci/rotate`), or answered with `reveal`. */
  rotate(
    userId: string,
    resourceId: string,
    options?: CiKeyDelivery,
  ): Promise<string | null>;
  /**
   * A repository Studio created finished its initialization: commits the files of the run that waited for it to its
   * default branch while it is still unprotected. Never throws.
   */
  commitInitial(resourceId: string): Promise<void>;
  /** Rotates every key expiring within `ROTATE_WITHIN_DAYS`, telling people about a failure. Never throws. */
  rotateExpiring(): Promise<void>;
  /** CI's builds recorded an App of the repository: its key reaches it at once; the workflow is left alone. Never throws. */
  appsChanged(resourceId: string): Promise<void>;
  /**
   * Runs "Configure CI" as `userId` (`CiRunRequest`, checked: throws what `parseCiRun` throws, `CI_NEEDS_CONNECTION`
   * without a Git connection, or what `checkTarget` refuses). What fails after the check is recorded on the repository
   * (`lastError`), never thrown; with `recordRefusals`, so is what `checkTarget` refuses (a run nobody waits on).
   */
  configure(
    userId: string,
    resourceId: string,
    run: unknown,
    options?: { readonly recordRefusals?: boolean },
  ): Promise<void>;
  /** Checks a run for a repository not added yet, named `repoName`; its target is checked when it runs. */
  check(
    run: unknown,
    repoName: string,
    connected: boolean,
    defaultBranch?: string,
  ): void;
  /** The setup with what CI reported for each App and where the last run stands. */
  connection(resourceId: string, canManage: boolean): Promise<CiConnectionView>;
  /**
   * Takes an App (or an application's pull request Apps) off the repository's list, as `userId`: its link goes, the
   * key narrows, and the builds reported until now stop counting for it. Answers whether it was listed.
   */
  removeApp(
    userId: string,
    resourceId: string,
    row: {
      readonly environmentId: string;
      readonly appId: string;
      readonly pullRequests: boolean;
    },
  ): Promise<boolean>;
  /** Someone disabled or deleted a key Studio manages: the CI is set up by hand from now on. Never throws. */
  keyRevoked(
    identityId: string,
    actorId: string,
    how: 'disabled' | 'deleted',
  ): Promise<void>;
}

/** A failure the person can act on: worded for `lastError`, and its reason for `lastFailure`. */
class SetupFailure extends Error {
  public constructor(
    message: string,
    public readonly reason: CiFailureReason,
    public readonly params: Readonly<Record<string, string>> = {},
  ) {
    super(message);
  }
}

/** What `checkTarget` answers. */
interface CheckedTarget {
  /** The App to record for the repository, so the key reaches it; null when there is none. */
  readonly record: {
    readonly appId: string;
    readonly environment: CiEnvironment;
  } | null;
  /** The target environment's name, which names the workflow file; null without release management. */
  readonly environmentName: string | null;
}

/** The refusals of other services a failure is known by, and the reason the browser words it with. */
const FAILURE_CODES: Readonly<Record<string, CiFailureReason>> = {
  GIT_CONNECTION_DEMO: 'demoConnection',
  GIT_PERMISSION_MISSING: 'connectionPermission',
  GIT_CONNECTION_NOT_FOUND: 'connectionMissing',
  GIT_CONNECTION_INCOMPLETE: 'connectionMissing',
  CI_SECRETS_UNSUPPORTED: 'secretsUnsupported',
  GITHUB_FORBIDDEN: 'hostForbidden',
  GITHUB_RATE_LIMITED: 'hostRateLimited',
  GITHUB_NOT_FOUND: 'repositoryNotFound',
  CI_NEEDS_CONNECTION: 'noConnection',
  KEY_SCOPE_EXCEEDS_YOURS: 'keyScope',
  UNKNOWN_ENVIRONMENT: 'unknownEnvironment',
  APP_IN_OTHER_ENVIRONMENT: 'appInOtherEnvironment',
  APPS_NOT_CREATABLE: 'appsNotCreatable',
  APP_NOT_CONFIGURABLE: 'appNotConfigurable',
  FORBIDDEN: 'forbidden',
};

const text = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

/** Why something failed, as `lastFailure` keeps it: a reason the browser words, with what it names. */
export function ciFailureOf(
  error: unknown,
  run?: { readonly appId?: string; readonly environmentId?: string },
): CiFailure {
  if (error instanceof SetupFailure)
    return { reason: error.reason, params: error.params };
  const params: Record<string, string> = {};
  if (run?.appId) params.appId = run.appId;
  if (run?.environmentId) params.environmentId = run.environmentId;
  if (error instanceof AccessError || error instanceof ProtocolError) {
    const code = text(error.details?.code) ?? error.code;
    const reason = FAILURE_CODES[code];
    const actual = text(error.details?.environmentId);
    if (actual) params.actualEnvironmentId = actual;
    const retryAt = text(error.details?.retryAt);
    if (retryAt) params.retryAt = retryAt;
    if (reason) return { reason, params };
    if (error.status === 403) return { reason: 'forbidden', params };
  }
  if (error instanceof GitApiError) {
    if (error.retryAt)
      return {
        reason: 'hostRateLimited',
        params: { ...params, retryAt: error.retryAt },
      };
    if (error.status === 401 || error.status === 403)
      return { reason: 'hostForbidden', params };
    if (error.status === 404) return { reason: 'repositoryNotFound', params };
  }
  return { reason: 'unknown', params };
}

/** The working directory as the setup needs it. */
interface RepositoryOf {
  readonly resourceId: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly leadUserId: string | null;
  readonly connectionId: string | null;
  readonly repo: string | null;
  /** The clone URL. */
  readonly url: string | null;
  readonly defaultBranch: string;
}

/** A repository reached through its Git connection. */
type Reached = RepositoryOf & {
  readonly connectionId: string;
  readonly repo: string;
};

const textOf = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

function messageOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, ERROR_MAX);
}

const sameApps = (
  current: readonly string[] | 'all',
  wanted: readonly string[],
): boolean =>
  current !== 'all' &&
  current.length === wanted.length &&
  wanted.every((id) => current.includes(id));

/** The files Studio wrote for the repository: earlier runs' and these. */
const pathsWith = (row: RepoCiRow, workflow: CiWorkflow): string[] => [
  ...new Set([
    // Named as Studio names its files, not the single `nb-studio.yml` a row defaults to.
    ...row.workflowPaths.filter((path) =>
      /\/nb-studio-[^/]+\.ya?ml$/u.test(path),
    ),
    ...workflow.files.map((file) => file.path),
  ]),
];

/** The environments the listed Apps run in, in release management's order; one it no longer has, by its ID. */
function environmentsOf(
  apps: readonly CiReportedApp[],
  known: readonly CiEnvironment[],
): CiEnvironment[] {
  const used = new Set(apps.map((app) => app.environmentId));
  const listed = known.filter((environment) => used.has(environment.id));
  for (const id of used)
    if (!listed.some((environment) => environment.id === id))
      listed.push({ id, name: id, protected: false });
  return listed;
}

export function createCiSetup(deps: CiSetupDeps): CiSetup {
  const now = deps.now ?? (() => new Date());
  const conn = () => deps.database.connection();
  const cli = () => deps.cli?.() ?? 'nb-studio';
  const newId = deps.newId ?? (() => randomUUID());
  const onError =
    deps.onError ??
    ((message: string, error: unknown) => console.error(message, error));

  async function repositoryOf(resourceId: string): Promise<RepositoryOf> {
    const row = await conn()
      .query.selectFrom('pmProjectResources as resource')
      .innerJoin('pmProjects as project', 'project.id', 'resource.projectId')
      .select([
        'project.id as projectId',
        'project.name as projectName',
        'project.leadUserId as leadUserId',
        'resource.bindingConnectionId as connectionId',
        'resource.bindingFullName as repo',
        'resource.url as url',
        'resource.defaultRef as defaultRef',
      ])
      .where('resource.id', '=', resourceId)
      .executeTakeFirst<Row>();
    if (!row)
      throw new SetupFailure(
        'The working directory no longer exists.',
        'workingDirectoryMissing',
      );
    return {
      resourceId,
      projectId: String(row.projectId),
      projectName: String(row.projectName),
      leadUserId: textOf(row.leadUserId),
      connectionId: textOf(row.connectionId),
      repo: textOf(row.repo),
      url: textOf(row.url),
      defaultBranch: textOf(row.defaultRef) ?? 'main',
    };
  }

  /** A repository Studio created whose initialization has not finished: its workflow waits for it. */
  async function initializing(resourceId: string): Promise<boolean> {
    const rows = await conn()
      .query.selectFrom(INITS)
      .select(['state', 'method', 'firstCommit'])
      .where('resourceId', '=', resourceId)
      .execute<Row>();
    return rows.some(
      (row) =>
        row.state !== 'done' &&
        (row.method === 'template' ||
          row.firstCommit === true ||
          row.firstCommit === 1),
    );
  }

  async function update(resourceId: string, values: RepoCiChanges) {
    await updateRepoCi(conn(), resourceId, values, now());
  }

  async function fail(
    resourceId: string,
    error: unknown,
    run?: CheckedCiRun,
  ): Promise<void> {
    const lastFailure = ciFailureOf(
      error,
      run && { appId: run.app.appId, environmentId: run.target.environmentId },
    );
    if (lastFailure.reason === 'unknown')
      onError('Could not set up a repository’s CI.', error);
    await update(resourceId, {
      state: 'manual',
      lastError: messageOf(error),
      lastFailure,
    }).catch((failure: unknown) =>
      onError('Could not record a CI setup’s failure.', failure),
    );
  }

  function requireConnections(): GitConnections {
    const connections = deps.connections();
    if (!connections)
      throw new SetupFailure(
        'No code host is connected to this workspace.',
        'noConnection',
      );
    return connections;
  }

  function requireKeys(): CiKeys {
    const keys = deps.keys();
    if (!keys)
      throw new SetupFailure(
        'API keys are not available.',
        'apiKeysUnavailable',
      );
    return keys;
  }

  function requireStudioUrl(): string {
    const studioUrl = deps.studioUrl();
    if (!studioUrl)
      throw new SetupFailure(
        'Studio does not know its public address (app.publicOrigin), which the CI signs in to.',
        'noPublicOrigin',
      );
    return studioUrl;
  }

  /** The repository's name, its single application is named after. */
  const repoNameOf = (repository: RepositoryOf): string =>
    repositoryNameOf({ repo: repository.repo, url: repository.url });

  /** `owner/name` as the key is named: the host's, else the clone URL's last two segments, else the project's name. */
  const keyRepoOf = (repository: RepositoryOf): string => {
    if (repository.repo) return repository.repo;
    const segments = (repository.url ?? '')
      .replace(/\.git\/*$/u, '')
      .replace(/\/+$/u, '')
      .split(/[/:]/u)
      .filter(Boolean);
    return segments.length >= 2
      ? segments.slice(-2).join('/')
      : repository.projectName;
  };

  function reach(repository: RepositoryOf): Reached {
    const { connectionId, repo } = repository;
    if (!connectionId || !repo)
      throw new SetupFailure(
        'The repository is not reached through a Git connection: set its CI up by hand.',
        'noConnection',
      );
    return { ...repository, connectionId, repo };
  }

  /** The Apps CI recorded for the repository, which its key is limited to. */
  async function recordedAppIds(resourceId: string): Promise<string[]> {
    return [
      ...new Set(
        (await repositoryApps(conn(), resourceId)).map((app) => app.appId),
      ),
    ];
  }

  /** The row, made or turned on for a run by `userId`. */
  async function enable(userId: string, resourceId: string): Promise<void> {
    const row = await repoCiRow(conn(), resourceId);
    if (!row)
      await conn()
        .query.insertInto('studioRepoCi')
        .values({
          resourceId,
          auto: true,
          state: 'manual',
          createdBy: userId,
          createdAt: now(),
          updatedAt: now(),
        })
        .execute();
    else if (!row.auto || row.state === 'disabled')
      await update(resourceId, { auto: true, state: 'manual' });
  }

  async function writeSecret(
    repository: { readonly connectionId: string; readonly repo: string },
    row: RepoCiRow,
    secret: string,
  ): Promise<void> {
    await requireConnections().setCiSecret(
      repository.connectionId,
      repository.repo,
      { name: row.secretName, value: secret },
    );
  }

  /** The key the CI uploads with, made, or kept and given a fresh secret, limited to the recorded Apps. */
  async function freshKey(
    row: RepoCiRow,
    userId: string,
    repository: Reached,
  ): Promise<void> {
    await issueKey(row, userId, repository, (secret) =>
      writeSecret(repository, row, secret),
    );
  }

  /**
   * `freshKey` with the secret handed to `deliver` instead of the host: written there, or answered once to the person
   * (`reveal`), who stores it themselves. The key is the same either way.
   */
  async function issueKey(
    row: RepoCiRow,
    userId: string,
    repository: RepositoryOf,
    deliver: (secret: string) => Promise<void>,
  ): Promise<void> {
    const keys = requireKeys();
    const appIds = await recordedAppIds(row.resourceId);
    const current = row.keyIdentityId
      ? await keys.find(row.keyIdentityId)
      : null;
    if (current && current.status !== 'disabled') {
      if (!sameApps(current.appIds, appIds))
        await keys.setApps(userId, current.id, appIds);
      const rotated = await keys.rotate(current.id, userId);
      await deliver(rotated.secret);
      await update(row.resourceId, { lastRotatedAt: now() });
      return;
    }
    const name = keyRepoOf(repository);
    const created = await keys.create(userId, {
      name: `${name} CI`.slice(0, 100),
      description:
        `Managed by repository ${name} (project ${repository.projectName}): Studio rotates it and keeps it limited to the Apps the repository builds.`.slice(
          0,
          500,
        ),
      appIds,
    });
    // Recorded before the secret is delivered, so a failure leaves no key Studio forgets.
    await update(row.resourceId, { keyIdentityId: created.id });
    await deliver(created.secret);
  }

  /** The key limited to the recorded Apps, as `userId`; a key someone disabled stays so. */
  async function keyInStep(
    resourceId: string,
    userId: string | null,
  ): Promise<void> {
    const row = await repoCiRow(conn(), resourceId);
    if (!row?.auto || row.state === 'disabled' || !row.keyIdentityId) return;
    const keys = requireKeys();
    const current = await keys.find(row.keyIdentityId);
    const actor = userId ?? row.createdBy;
    if (!current || current.status === 'disabled' || !actor) return;
    const appIds = await recordedAppIds(resourceId);
    if (!sameApps(current.appIds, appIds))
      await keys.setApps(actor, current.id, appIds);
  }

  /** The workflow files the default branch does not hold as generated, with what it holds of each. */
  async function differing(
    repository: Reached,
    workflow: CiWorkflow,
    branch: string,
  ): Promise<
    {
      readonly file: CiWorkflowFile;
      readonly current: { readonly sha: string } | null;
    }[]
  > {
    const connections = requireConnections();
    const found = [];
    for (const file of workflow.files) {
      const current = await connections.readFile(
        repository.connectionId,
        repository.repo,
        file.path,
        branch,
      );
      if (current?.content !== file.content) found.push({ file, current });
    }
    return found;
  }

  /** Proposes the workflows in a pull request from `CI_SETUP_BRANCH`, unless the default branch already holds them. */
  async function propose(
    row: RepoCiRow,
    repository: Reached,
    workflow: CiWorkflow,
  ): Promise<void> {
    const connections = requireConnections();
    const { connectionId, repo, defaultBranch } = repository;
    const paths = pathsWith(row, workflow);
    const changed = await differing(repository, workflow, defaultBranch);
    if (changed.length === 0) {
      await update(row.resourceId, {
        state: 'configured',
        workflowPaths: paths,
        lastError: null,
      });
      return;
    }
    const base = await connections.branchSha(connectionId, repo, defaultBranch);
    if (!base)
      throw new SetupFailure(
        `The default branch ${defaultBranch} does not exist yet: push it, then configure the CI again.`,
        'defaultBranchMissing',
        { branch: defaultBranch },
      );
    const open = row.pullRequestNumber
      ? await connections
          .getPullRequest(connectionId, repo, row.pullRequestNumber)
          .catch(() => null)
      : null;
    const adding = open?.state === 'open' && open.headRef === CI_SETUP_BRANCH;
    // A pull request still open keeps what earlier runs proposed: this run's file joins it.
    if (!adding)
      await connections.createBranch(connectionId, repo, {
        name: CI_SETUP_BRANCH,
        fromSha: base,
      });
    const updating = changed.some(({ current }) => current !== null);
    const title = updating
      ? 'Update Studio CI workflows'
      : 'Add Studio CI workflows';
    let commitSha: string | null = null;
    for (const { file } of changed) {
      const onBranch = await connections.readFile(
        connectionId,
        repo,
        file.path,
        CI_SETUP_BRANCH,
      );
      const written = await connections.putFile(connectionId, repo, {
        path: file.path,
        content: file.content,
        message: title,
        branch: CI_SETUP_BRANCH,
        sha: onBranch?.sha ?? null,
      });
      commitSha = written.commitSha || commitSha;
    }
    const pull = adding
      ? open
      : await connections.openPullRequest(connectionId, repo, {
          title,
          body: [
            `Studio ${updating ? 'updates' : 'adds'} ${changed.map(({ file }) => `\`${file.path}\``).join(', ')}: each builds an application of this repository when its trigger fires (a pull request, a push to a branch or a tag), reports the build and uploads it to Studio, which deploys it to the App the workflow names.`,
            '',
            `The repository secret \`${row.secretName}\` already holds an organization API key for this repository's CI; Studio rotates it before it expires. Merge this pull request to start deploying.`,
          ].join('\n'),
          head: CI_SETUP_BRANCH,
          base: defaultBranch,
          draft: false,
        });
    await update(row.resourceId, {
      state: 'pr-open',
      pullRequestNumber: pull.number,
      pullRequestUrl: pull.url,
      workflowPaths: paths,
      workflowSha: commitSha,
      lastError: null,
    });
  }

  /** Commits the workflows straight to the default branch: a repository Studio created, not yet protected. */
  async function commit(
    row: RepoCiRow,
    repository: Reached,
    workflow: CiWorkflow,
  ): Promise<void> {
    const connections = requireConnections();
    const { connectionId, repo, defaultBranch } = repository;
    let commitSha: string | null = row.workflowSha;
    for (const { file, current } of await differing(
      repository,
      workflow,
      defaultBranch,
    )) {
      const written = await connections.putFile(connectionId, repo, {
        path: file.path,
        content: file.content,
        message: 'Add Studio CI workflow',
        branch: defaultBranch,
        sha: current?.sha ?? null,
      });
      commitSha = written.commitSha || commitSha;
    }
    await update(row.resourceId, {
      state: 'configured',
      workflowPaths: pathsWith(row, workflow),
      workflowSha: commitSha,
      lastError: null,
    });
  }

  /** The "Set up deployment" issue of an `agent` run, given to its agent, with the files and commands but no key. */
  async function assignTask(
    row: RepoCiRow,
    actor: string,
    repository: Reached,
    run: Extract<CheckedCiRun, { method: 'agent' }>,
    environmentName: string | null,
  ): Promise<void> {
    const tasks = deps.tasks?.();
    if (!tasks)
      throw new SetupFailure(
        'Issues cannot be created here.',
        'issuesUnavailable',
      );
    const studioUrl = deps.studioUrl() ?? '';
    const issue = await tasks.create(actor, {
      projectId: repository.projectId,
      title: (
        (await deps.taskTitle?.(repository.repo)) ??
        ciTaskTitle(repository.repo)
      ).slice(0, 200),
      description: ciTaskBrief({
        studioUrl,
        repo: repository.repo,
        defaultBranch: repository.defaultBranch,
        app: run.app,
        target: run.target,
        files: [
          standardCiWorkflow({
            studioUrl,
            defaultBranch: repository.defaultBranch,
            app: run.app,
            target: run.target,
            environmentName,
            managed: true,
            cli: cli(),
          }),
        ],
        secretName: row.secretName,
        cli: cli(),
      }),
      agentId: run.agentId,
    });
    await writeCiRun(
      conn(),
      row.resourceId,
      {
        taskIssueId: issue.id,
        taskIdentifier: issue.identifier,
        pendingFiles: null,
      },
      now(),
    );
    // The run's outcome is the issue now, not an earlier pull request.
    await update(row.resourceId, { state: 'configured', lastError: null });
  }

  /**
   * The target of the Studio file another run left at `path`: waiting for the initialization, on the default branch, or
   * in the pull request still open; null when there is none, or it is not one Studio generated.
   */
  async function occupantAt(
    row: RepoCiRow,
    repository: Reached,
    path: string,
  ): Promise<CiWorkflowOccupant | null> {
    const waiting = (await ciRunOf(conn(), repository.resourceId)).pendingFiles;
    const found = waiting?.find((file) => file.path === path);
    if (found) return ciWorkflowTargetOf(found.content);
    const connections = requireConnections();
    const branches = [
      repository.defaultBranch,
      ...(row.state === 'pr-open' ? [CI_SETUP_BRANCH] : []),
    ];
    for (const branch of branches) {
      const file = await connections
        .readFile(repository.connectionId, repository.repo, path, branch)
        .catch(() => null);
      const occupant = file ? ciWorkflowTargetOf(file.content) : null;
      if (occupant) return occupant;
    }
    return null;
  }

  /**
   * The files a `direct` or `template` run writes, each named for its target (`ciWorkflowPathOf`); one whose name
   * another target's file holds takes a suffix instead of replacing it.
   */
  async function filesOf(
    row: RepoCiRow,
    run: Exclude<CheckedCiRun, { method: 'agent' }>,
    repository: Reached,
    studioUrl: string,
    environmentName: string | null,
  ): Promise<CiWorkflowFile[]> {
    const named = { ...run.target, appId: run.app.appId, environmentName };
    if (run.method === 'template') {
      const file = run.workflowFile;
      const occupant = await occupantAt(row, repository, file.path);
      const moved = ciWorkflowPathOf(named, occupant);
      // Moved only when another target holds the name.
      return [
        moved !== ciWorkflowPathOf(named) ? { ...file, path: moved } : file,
      ];
    }
    const standard = (occupant: CiWorkflowOccupant | null) =>
      standardCiWorkflow({
        studioUrl,
        defaultBranch: repository.defaultBranch,
        app: run.app,
        target: run.target,
        environmentName,
        occupant,
        managed: true,
        cli: cli(),
      });
    const first = standard(null);
    const occupant = await occupantAt(row, repository, first.path);
    return [occupant ? standard(occupant) : first];
  }

  /**
   * Refuses a target the run cannot deploy to, before anything is recorded: an environment that does not exist; a
   * branch or tag's App that runs in another environment, or that the person may not configure; an App to make when
   * the person may not set Apps up. Answers the App to record for the repository, so the key reaches it (one that
   * exists and is not the repository's yet), and the environment's name, which names the workflow file.
   */
  async function checkTarget(
    userId: string,
    resourceId: string,
    run: CheckedCiRun,
  ): Promise<CheckedTarget> {
    const releases = deps.releases?.();
    if (!releases) return { record: null, environmentName: null };
    const { environmentId } = run.target;
    const environment = (await releases.environments()).find(
      (item) => item.id === environmentId,
    );
    if (!environment)
      throw invalid(
        'UNKNOWN_ENVIRONMENT',
        `There is no environment ${environmentId}.`,
      );
    const appId = run.app.appId;
    const existing =
      run.target.trigger === 'pullRequest' ? null : await releases.app(appId);
    if (!existing) {
      // Pull requests' Apps, or the branch's or tag's App, are made by `app ensure` for whoever set the CI up.
      if (!(await releases.maySetUpApps(userId)))
        throw forbidden(
          run.target.trigger === 'pullRequest'
            ? 'Each pull request gets an App of its own, and you may not have Apps set up.'
            : `There is no App ${appId}, and you may not have Apps set up.`,
          'APPS_NOT_CREATABLE',
        );
      return { record: null, environmentName: environment.name };
    }
    if (existing.environmentId !== environmentId)
      throw conflict(
        'APP_IN_OTHER_ENVIRONMENT',
        `${appId} runs in ${existing.environmentId}, not ${environmentId}.`,
        { environmentId: existing.environmentId },
      );
    const ours =
      existing.labels[RELEASE_LABELS.ensured] === resourceId ||
      (await repositoryApps(conn(), resourceId)).some(
        (link) => link.appId === appId,
      );
    if (ours) return { record: null, environmentName: environment.name };
    if (!(await releases.mayConfigure(userId, appId)))
      throw forbidden(
        `You may not configure ${appId}, so its CI cannot deploy to it.`,
        'APP_NOT_CONFIGURABLE',
      );
    return {
      record: { appId, environment },
      environmentName: environment.name,
    };
  }

  /** The Apps taken off the repository's list. */
  async function hiddenOf(resourceId: string): Promise<HiddenCiApp[]> {
    const rows = await conn()
      .query.selectFrom(HIDDEN)
      .selectAll()
      .where('resourceId', '=', resourceId)
      .execute<Row>();
    return rows.map((row) => ({
      environmentId: String(row.environmentId),
      appId: String(row.appId),
      pullRequests: row.pullRequests === true || row.pullRequests === 1,
      hiddenAt:
        row.hiddenAt instanceof Date
          ? row.hiddenAt
          : new Date(row.hiddenAt as string),
    }));
  }

  /** The environment each App runs in: the App's, else its pull request preview's, else its link's. */
  async function environmentsOfApps(
    resourceId: string,
    appIds: readonly string[],
    links: readonly {
      readonly appId: string;
      readonly environmentId: string;
    }[],
  ): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    const releases = deps.releases?.();
    if (releases)
      for (const appId of appIds) {
        const app = await releases.app(appId).catch(() => null);
        if (app) found.set(appId, app.environmentId);
      }
    const missing = appIds.filter((appId) => !found.has(appId));
    if (missing.length > 0) {
      const previews = await conn()
        .query.selectFrom('studioPreviews')
        .select(['appId', 'environmentId'])
        .where('resourceId', '=', resourceId)
        .where('appId', 'in', missing)
        .execute<Row>();
      for (const row of previews)
        found.set(String(row.appId), String(row.environmentId));
    }
    for (const link of links)
      if (!found.has(link.appId)) found.set(link.appId, link.environmentId);
    return found;
  }

  async function notify(
    row: RepoCiRow,
    type: string,
    userIds: readonly string[],
    data: Record<string, string | number | null>,
    title: string,
    key: string,
  ): Promise<void> {
    const inbox = deps.inbox();
    if (!inbox || userIds.length === 0) return;
    const repository = await repositoryOf(row.resourceId);
    await inbox.send({
      key,
      source: CI_SOURCE,
      kind: 'info',
      type,
      userIds: [...new Set(userIds)],
      title,
      body: row.lastError ?? '',
      path: `/projects/${encodeURIComponent(repository.projectId)}`,
      subject: {
        type: 'repository',
        id: row.resourceId,
        label: repository.repo ?? repository.projectName,
      },
      data: {
        resourceId: row.resourceId,
        projectId: repository.projectId,
        projectName: repository.projectName,
        repo: repository.repo,
        ...data,
      },
    });
  }

  /** Throws what a run is refused for, before anything is recorded. */
  function check(
    raw: unknown,
    repoName: string,
    connected: boolean,
    defaultBranch?: string,
  ): CheckedCiRun {
    const run = parseCiRun(raw, repoName, defaultBranch);
    if (!connected)
      throw invalid(
        'CI_NEEDS_CONNECTION',
        'Studio configures CI only in a repository reached through a Git connection: set it up by hand.',
      );
    return run;
  }

  /** Where the CI stands: reported, or what the last run awaits. */
  function connectionState(
    view: CiSetupView,
    reported: boolean,
    task: boolean,
  ): CiConnectionState {
    if (reported) return 'connected';
    if (view.state === 'pending') return 'pending';
    if (view.state === 'pr-open') return 'pr-open';
    if (task) return 'task';
    return 'none';
  }

  /**
   * A secret answered to the person rather than written: nothing waits on the repository, so a failure is the answer
   * itself, thrown as a refusal the caller reads (`KEY_MISSING`, `API_KEYS_UNAVAILABLE`, or the keys' own).
   */
  async function revealing(
    issue: () => Promise<string | null>,
  ): Promise<string> {
    try {
      const secret = await issue();
      if (!secret) throw new Error('No secret was issued.');
      return secret;
    } catch (error) {
      if (error instanceof SetupFailure)
        throw conflict(
          error.reason
            .replace(/[A-Z]/gu, (letter) => `_${letter}`)
            .toUpperCase(),
          error.message,
        );
      throw error;
    }
  }

  const service: CiSetup = {
    hook: async ({ resourceId, userId }) => {
      try {
        await keyInStep(resourceId, userId);
      } catch (error) {
        onError('Could not keep a repository’s CI key in step.', error);
      }
    },

    async appsChanged(resourceId) {
      try {
        await keyInStep(resourceId, null);
      } catch (error) {
        onError('Could not keep a repository’s CI key in step.', error);
      }
    },

    async view(resourceId, canManage) {
      const repository = await repositoryOf(resourceId);
      let row = await repoCiRow(conn(), resourceId);
      const connections = deps.connections();
      // A pull request merged or closed since: its run's outcome is settled.
      if (
        row?.state === 'pr-open' &&
        row.pullRequestNumber &&
        repository.connectionId &&
        repository.repo &&
        connections
      ) {
        const pull = await connections
          .getPullRequest(
            repository.connectionId,
            repository.repo,
            row.pullRequestNumber,
          )
          .catch(() => null);
        if (pull?.state === 'merged' || pull?.state === 'closed') {
          await update(resourceId, { state: 'configured', lastError: null });
          row = await repoCiRow(conn(), resourceId);
        }
      }
      const key = row?.keyIdentityId
        ? await deps
            .keys()
            ?.find(row.keyIdentityId)
            .catch(() => null)
        : null;
      const descriptor = repository.connectionId
        ? await connections
            ?.find(repository.connectionId)
            .then((found) => found?.provider ?? null)
            .catch(() => null)
        : null;
      return {
        resourceId,
        repo: repository.repo,
        auto: row?.auto ?? false,
        state: row?.state ?? 'disabled',
        key: row?.keyIdentityId
          ? key
            ? {
                id: key.id,
                name: key.name,
                expiresAt: key.expiresAt,
                lastUsedAt: key.lastUsedAt,
                status: key.status,
              }
            : {
                id: row.keyIdentityId,
                name: '',
                expiresAt: null,
                lastUsedAt: null,
                status: 'missing',
              }
          : null,
        secretName: row?.secretName ?? 'NB_STUDIO_API_KEY',
        secretKind: descriptor === 'github' ? 'GitHub Actions secret' : null,
        workflowPaths: row?.workflowPaths ?? [],
        pullRequest:
          row?.pullRequestNumber && row.pullRequestUrl
            ? { number: row.pullRequestNumber, url: row.pullRequestUrl }
            : null,
        workflowSha: row?.workflowSha ?? null,
        lastRotatedAt: row?.lastRotatedAt ?? null,
        lastError: row?.lastError ?? null,
        // A failure recorded before reasons were kept has only its words.
        lastFailure: row?.lastError ? (row.lastFailure ?? null) : null,
        canManage,
      };
    },

    async setup(userId, resourceId, options) {
      if (options?.reveal) {
        await enable(userId, resourceId);
        const row = (await repoCiRow(conn(), resourceId))!;
        return revealing(async () => {
          let secret: string | null = null;
          await issueKey(
            row,
            userId,
            await repositoryOf(resourceId),
            (value) => {
              secret = value;
              return Promise.resolve();
            },
          );
          await update(resourceId, { state: 'manual', lastError: null });
          return secret;
        });
      }
      await enable(userId, resourceId);
      const row = (await repoCiRow(conn(), resourceId))!;
      try {
        const repository = reach(await repositoryOf(resourceId));
        await freshKey(row, userId, repository);
        await update(resourceId, {
          state: row.state === 'manual' ? 'configured' : row.state,
          lastError: null,
        });
      } catch (error) {
        await fail(resourceId, error);
      }
      return null;
    },

    async rotate(userId, resourceId, options) {
      const row = await repoCiRow(conn(), resourceId);
      const keyOf = async () => {
        if (!row?.keyIdentityId)
          throw new SetupFailure(
            'Studio holds no key for this repository.',
            'keyMissing',
          );
        const keys = requireKeys();
        const key = await keys.find(row.keyIdentityId);
        if (!key || key.status === 'disabled')
          throw new SetupFailure(
            'The repository’s API key was disabled or deleted: configure the CI again.',
            'keyMissing',
          );
        return { keys, key };
      };
      if (options?.reveal)
        return revealing(async () => {
          const { keys, key } = await keyOf();
          const rotated = await keys.rotate(key.id, userId);
          await update(resourceId, {
            state: 'manual',
            lastRotatedAt: now(),
            lastError: null,
          });
          return rotated.secret;
        });
      try {
        const { keys, key } = await keyOf();
        const repository = await repositoryOf(resourceId);
        if (!repository.connectionId || !repository.repo)
          throw new SetupFailure(
            'The repository is not reached through a Git connection.',
            'noConnection',
          );
        const rotated = await keys.rotate(key.id, userId);
        await writeSecret(
          { connectionId: repository.connectionId, repo: repository.repo },
          row!,
          rotated.secret,
        );
        await update(resourceId, { lastRotatedAt: now(), lastError: null });
      } catch (error) {
        if (row) await fail(resourceId, error);
        else throw error;
      }
      return null;
    },

    async commitInitial(resourceId) {
      const row = await repoCiRow(conn(), resourceId).catch(() => null);
      if (row?.state !== 'pending' || !row.auto) return;
      try {
        const repository = reach(await repositoryOf(resourceId));
        if (!row.createdBy)
          throw new SetupFailure(
            'Nobody is recorded to set the CI up as.',
            'noSetUpUser',
          );
        await freshKey(row, row.createdBy, repository);
        const stored = await ciRunOf(conn(), resourceId);
        // A run stored before its files were kept waits with the repository's application at its root, for pull requests.
        const files = stored.pendingFiles ?? [
          standardCiWorkflow({
            studioUrl: requireStudioUrl(),
            defaultBranch: repository.defaultBranch,
            app: defaultCiApp(repoNameOf(repository)),
            target: DEFAULT_CI_TARGET,
            managed: true,
            cli: cli(),
          }),
        ];
        await commit(row, repository, { files, secret: row.secretName });
        await writeCiRun(conn(), resourceId, { pendingFiles: null }, now());
      } catch (error) {
        await fail(resourceId, error);
      }
    },

    async rotateExpiring() {
      const keys = deps.keys();
      if (!keys) return;
      const rows = await repoCisWithKeys(conn()).catch((error: unknown) => {
        onError('Could not list the CI keys to rotate.', error);
        return [];
      });
      const soon = now().getTime() + ROTATE_WITHIN_DAYS * DAY_MS;
      for (const row of rows) {
        if (!row.auto || row.state === 'disabled' || row.state === 'manual')
          continue;
        try {
          const key = await keys.find(row.keyIdentityId!);
          if (!key || key.status === 'disabled') continue;
          if (
            key.expiresAt === null ||
            new Date(key.expiresAt).getTime() > soon
          )
            continue;
          const repository = await repositoryOf(row.resourceId);
          try {
            if (!repository.connectionId || !repository.repo)
              throw new SetupFailure(
                'The repository is not reached through a Git connection.',
                'noConnection',
              );
            const rotated = await keys.rotate(key.id, null);
            await writeSecret(
              { connectionId: repository.connectionId, repo: repository.repo },
              row,
              rotated.secret,
            );
            await update(row.resourceId, {
              lastRotatedAt: now(),
              lastError: null,
            });
          } catch (error) {
            const lastError = `The CI key could not be rotated: ${messageOf(error)}`;
            await update(row.resourceId, {
              lastError,
              lastFailure: {
                reason: 'rotationFailed',
                params: { cause: ciFailureOf(error).reason },
              },
            });
            const days = Math.max(
              0,
              Math.ceil(
                (new Date(key.expiresAt).getTime() - now().getTime()) / DAY_MS,
              ),
            );
            await notify(
              { ...row, lastError },
              CI_KEY_ROTATION_FAILED,
              [
                ...(repository.leadUserId ? [repository.leadUserId] : []),
                ...(await deps.administrators()),
              ],
              { keyName: key.name, days, error: messageOf(error) },
              `CI key for ${repository.repo ?? repository.projectName} expires in ${days} days; rotate it manually`,
              `ci:rotation:${row.resourceId}:${now().toISOString().slice(0, 10)}`,
            );
          }
        } catch (error) {
          onError('Could not rotate a CI key.', error);
        }
      }
    },

    check(run, repoName, connected, defaultBranch) {
      check(run, repoName, connected, defaultBranch);
    },

    async configure(userId, resourceId, raw, options) {
      const found = await repositoryOf(resourceId);
      const run = check(
        raw,
        repoNameOf(found),
        Boolean(found.connectionId && found.repo),
        found.defaultBranch,
      );
      let checked: CheckedTarget;
      try {
        checked = await checkTarget(userId, resourceId, run);
      } catch (error) {
        if (!options?.recordRefusals) throw error;
        // A run nobody waits on (a new project's) says why on the repository instead.
        await enable(userId, resourceId);
        await fail(resourceId, error, run);
        return;
      }
      const { record, environmentName } = checked;
      await enable(userId, resourceId);
      try {
        const repository = reach(found);
        const studioUrl = requireStudioUrl();
        // An App that exists becomes the repository's, so the key made or kept below reaches it.
        if (
          record &&
          (await recordRepositoryApp(conn(), {
            resourceId,
            appId: record.appId,
            role: roleOfEnvironment(record.environment),
            environmentId: record.environment.id,
            by: userId,
            newId,
          }))
        )
          await keyInStep(resourceId, userId);
        const row = (await repoCiRow(conn(), resourceId))!;
        if (run.method === 'agent') {
          await freshKey(row, userId, repository);
          await assignTask(
            (await repoCiRow(conn(), resourceId)) ?? row,
            userId,
            repository,
            run,
            environmentName,
          );
          return;
        }
        // The run's outcome is its files now, not an earlier agent's issue.
        const files = await filesOf(
          row,
          run,
          repository,
          studioUrl,
          environmentName,
        );
        if (await initializing(resourceId)) {
          // Its default branch may not exist yet: the key and the files wait for the initialization (`commitInitial`),
          // with those of earlier runs waiting too.
          const waiting =
            (await ciRunOf(conn(), resourceId)).pendingFiles ?? [];
          await writeCiRun(
            conn(),
            resourceId,
            {
              taskIssueId: null,
              taskIdentifier: null,
              pendingFiles: [
                ...waiting.filter(
                  (file) => !files.some((next) => next.path === file.path),
                ),
                ...files,
              ],
            },
            now(),
          );
          await update(resourceId, { state: 'pending', lastError: null });
          return;
        }
        await writeCiRun(
          conn(),
          resourceId,
          { taskIssueId: null, taskIdentifier: null, pendingFiles: null },
          now(),
        );
        await freshKey(row, userId, repository);
        const current = (await repoCiRow(conn(), resourceId)) ?? row;
        await propose(current, repository, {
          files,
          secret: current.secretName,
        });
      } catch (error) {
        await fail(resourceId, error, run);
      }
    },

    async connection(resourceId, canManage) {
      const view = await service.view(resourceId, canManage);
      const repository = await repositoryOf(resourceId);
      const builds = await repositoryBuildReports(conn(), resourceId);
      const links = await repositoryApps(conn(), resourceId);
      const environments = await environmentsOfApps(
        resourceId,
        [
          ...new Set([
            ...builds.map((build) => build.appId),
            ...links.map((link) => link.appId),
          ]),
        ],
        links,
      );
      const apps = reportedApps({
        builds,
        recorded: links,
        environmentOf: (appId) => environments.get(appId) ?? null,
        hidden: await hiddenOf(resourceId),
      });
      const known =
        (await deps
          .releases?.()
          ?.environments()
          .catch(() => [])) ?? [];
      const stored = await ciRunOf(conn(), resourceId);
      let task = stored.taskIssueId
        ? { issueId: stored.taskIssueId, identifier: stored.taskIdentifier }
        : null;
      const tasks = deps.tasks?.();
      if (
        task &&
        tasks &&
        (await tasks.finished(task.issueId).catch(() => false))
      ) {
        await writeCiRun(
          conn(),
          resourceId,
          { taskIssueId: null, taskIdentifier: null },
          now(),
        );
        task = null;
      }
      const reported = builds.length > 0;
      return {
        ...view,
        connection: connectionState(view, reported, task !== null),
        task,
        reported,
        connected: Boolean(repository.connectionId && repository.repo),
        apps,
        environments: environmentsOf(apps, known),
      };
    },

    async removeApp(userId, resourceId, row) {
      const listed = (await service.connection(resourceId, true)).apps.some(
        (app) =>
          app.environmentId === row.environmentId &&
          app.appId === row.appId &&
          app.pullRequests === row.pullRequests,
      );
      if (!listed) return false;
      const at = now();
      if (!row.pullRequests)
        await conn()
          .query.deleteFrom('studioRepoApps')
          .where('resourceId', '=', resourceId)
          .where('appId', '=', row.appId)
          .execute();
      await conn()
        .query.deleteFrom(HIDDEN)
        .where('resourceId', '=', resourceId)
        .where('environmentId', '=', row.environmentId)
        .where('appId', '=', row.appId)
        .where('pullRequests', '=', row.pullRequests)
        .execute();
      await conn()
        .query.insertInto(HIDDEN)
        .values({
          id: newId(),
          resourceId,
          environmentId: row.environmentId,
          appId: row.appId,
          pullRequests: row.pullRequests,
          hiddenBy: userId,
          hiddenAt: at,
        })
        .execute();
      // The key reaches only the Apps left.
      try {
        await keyInStep(resourceId, userId);
      } catch (error) {
        onError('Could not keep a repository’s CI key in step.', error);
      }
      return true;
    },

    async keyRevoked(identityId, actorId, how) {
      try {
        const row = await repoCiOfKey(conn(), identityId);
        if (!row) return;
        const lastError = `The repository’s API key was ${how} in Settings › API keys: the CI is set up by hand until it is configured again.`;
        // The key stays recorded, so a later save does not quietly make another: only configuring again does.
        await update(row.resourceId, {
          state: 'manual',
          lastError,
          lastFailure: { reason: 'keyRevoked', params: { how } },
        });
        const repository = await repositoryOf(row.resourceId);
        await notify(
          { ...row, lastError },
          CI_KEY_REVOKED,
          [
            ...(repository.leadUserId ? [repository.leadUserId] : []),
            ...(row.createdBy ? [row.createdBy] : []),
          ].filter((id) => id !== actorId),
          { how, actorId },
          `The CI key of ${repository.repo ?? repository.projectName} was ${how}`,
          `ci:revoked:${row.resourceId}:${identityId}:${how}`,
        );
      } catch (error) {
        onError('Could not hand a repository’s CI back.', error);
      }
    },
  };
  return service;
}
