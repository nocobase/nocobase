/**
 * Builds as CI reports, uploads and deploys them (`shared/builds.ts`), with the CI's scoped API key. A deployment does
 * not know what it is for: CI names the App and the commit, and the environment the App runs in says the rest.
 *
 * | command (route, `routes.ts`)                                    | does                                          |
 * | --------------------------------------------------------------- | --------------------------------------------- |
 * | `nb-studio build status --app --sha --state [--logs --message]`     | records where the build stands (`report`)     |
 * | (`POST /api/builds/report`)                                     |                                               |
 * | `nb-studio app ensure <app> --environment <env>`                    | makes the App there when it is missing        |
 * | (`POST /api/builds/apps/:appId/ensure`)                         | (`ensure`), a no-op when it is there          |
 * | `nb-studio deploy --app --sha --file <archive>`                     | uploads the archive to a one-time ticket and  |
 * | (`POST /api/builds/deploy`, then the ticket)                    | deploys the release it becomes (`deploy`,     |
 * |                                                                 | `receive`)                                    |
 * | `nb-studio deploy --app --release <id>`                             | deploys a release that exists: a rollback, or |
 * | (`POST /api/builds/deploy`)                                     | another App's promoted                        |
 * | `nb-studio release upload --app --sha --file <archive>`             | uploads only (`ticket`, `receive`)            |
 * | (`POST /api/builds/uploadTickets`, then the ticket)             |                                               |
 *
 * Every command naming a commit goes through `admit`. The repository is the one named (`--repository owner/repo`,
 * which the CLI reads from `GITHUB_REPOSITORY` or `CI_PROJECT_PATH` in CI, as it reads `--sha` from the commit CI
 * builds), else the one the App was recorded or made for, else the one whose CI key the credential is; a CI key naming
 * another repository is refused (`REPOSITORY_MISMATCH`). The credential must hold the action on the App, or be the API
 * key Studio keeps for the repository's CI when the App is the repository's (recorded for it, or made for it by `app
 * ensure`); Studio then acts as a rule for whoever set that CI up. The commit must belong to the repository, asked of the git platform (`StudioGit.verifyCommit`): an open pull
 * request's head, on the default branch, tagged, or another branch's head. Nothing is recorded otherwise. The build of
 * an App at a commit is one row (the dedup key): verified once, and uploading it again answers the release it became
 * without storing anything. A build of an open pull request's head counts only while it is the newest: verifying a
 * head supersedes the App's builds of that pull request at other commits, and a superseded build is never deployed.
 *
 * Where a deployment goes, and what it records:
 *
 * - an App made by `app ensure` for the repository that has never been deployed, deployed an open pull request's head,
 *   becomes that pull request's preview (`PreviewPort.claim`): started on demand, deployed by the previews, shown on
 *   the issues the pull request is linked to, and deleted once it is merged or closed. A build reported for a missing
 *   App at such a head makes the App a preview as soon as `app ensure` makes it;
 * - any other App is recorded as the repository's (`recordRepositoryApp`), in the role its environment gives it
 *   (`roleOfEnvironment`), which deployment marks follow. An unprotected environment deploys at once; a protected one
 *   gets a deployment request for exactly that release, whoever deploys (a person, an agent or CI's key), which an
 *   approver decides in their inbox; the answer names the request and its page. A release whose required
 *   variables are not all set is refused (`VARIABLES_MISSING`, with where to set them); it stays in Studio and deploys
 *   by its ID once they are.
 *
 * An archive whose commit the repository already uploaded to another App is promoted from there when its bytes are
 * the same (`promoteFrom`): production then runs exactly what staging ran, stored once. A preview build's variables
 * manifest is compared with the release the App runs: the variables it adds and removes are kept on the build
 * (`newVariables`) and, on a pull request an agent opened, written to a section of its body (`<!-- studio:variables
 * -->`).
 */
import {
  ReleasesError,
  type Caller,
  type Releases,
} from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import type { ReleaseView } from '@nocobase/app-plugin-releases/shared/releases';
import type { DatabaseManager, Row } from '@nocobase/db';
import { createHmac, timingSafeEqual } from 'node:crypto';

import {
  BUILD_STATES,
  FULL_SHA,
  type BuildState,
  type BuildVariablesDiff,
  type BuildView,
} from '../../shared/builds.js';
import { RELEASE_LABELS, type PreviewStatus } from '../../shared/previews.js';
import { maySetUpApps, roleOfEnvironment } from '../../shared/releases.js';
import {
  conflict,
  forbidden,
  invalid,
  notFound,
  unauthorized,
} from '../access/errors.js';
import type { CommitVerification, StudioGit } from '../git/service.js';
import { findPullRequestById, linksOfPullRequest } from '../git/store.js';
import { previewWhere, type PreviewRecord } from '../previews/store.js';
import {
  recordRepositoryApp,
  repositoriesOfApp,
  workingDirectoriesOf,
} from '../releases/links.js';
import {
  withVariablesPages,
  type VariablesPages,
} from '../releases/variables-pages.js';
import {
  buildById,
  buildByRelease,
  buildView,
  failStaleBuilds,
  findBuild,
  insertBuild,
  reportBuild,
  repositoryBuilds,
  supersedeOthers,
  updateBuild,
  uploadedElsewhere,
  type BuildRecord,
} from './store.js';

/** The prefix of an upload ticket Studio mints for one build. */
export const BUILD_TICKET_PREFIX = 'fgb_';
/** How long an upload ticket lasts. */
const TICKET_SECONDS = 3600;

/**
 * Where the CLI streams a build's archive (`x-cli` `ticketUpload`): a path on Studio, with the one-time ticket as its
 * credential, so the CLI sends nothing of its session there.
 */
export interface UploadTicket {
  readonly url: string;
  readonly method: 'POST' | 'PUT';
  readonly headers: Readonly<Record<string, string>>;
  /** One line for a person, printed when the upload answers none. */
  readonly message?: string;
}

/** What previews do with the Apps whose source is a pull request (`../previews/service.ts`). */
export interface PreviewPort {
  /**
   * Records the pull request as the source of the App: its preview, following the pull request's head; a destroyed
   * one comes back. Null when the pull request is not open.
   */
  claim(input: {
    readonly resourceId: string;
    readonly pullRequestId: string;
    readonly appId: string;
    readonly environmentId: string;
    readonly createdBy: string | null;
  }): Promise<PreviewRecord | null>;
  /** A preview's build is uploaded to its App: the preview deploys it, and answers how it stands. */
  built(build: BuildRecord): Promise<PreviewRecord | null>;
}

export interface BuildsDeps {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly releases: () => Releases;
  /** Whether a commit belongs to the working directory's repository (`StudioGit.verifyCommit`). */
  readonly verify: (
    resourceId: string,
    sha: string,
  ) => Promise<CommitVerification>;
  readonly previews: () => PreviewPort | undefined;
  /**
   * The repository whose CI uses this identity as the API key Studio keeps for it, and who set that CI up; null for
   * any other credential.
   */
  readonly ciRepositoryOf?: (userId: string) => Promise<{
    readonly resourceId: string;
    readonly setUpBy: string | null;
  } | null>;
  /** A verified build recorded a new App of the repository: the CI setup keeps its key reaching it. */
  readonly appsRecorded?: (resourceId: string) => Promise<void>;
  /** Writes Studio's section of a pull request's body; absent without Studio's git. */
  readonly git?: () => Pick<StudioGit, 'updatePullRequestSection'> | undefined;
  /** The App's and the environment's Variables pages in Studio, where a refused deployment's variables are set. */
  readonly variablesPages?: VariablesPages;
  /** A deployment request's page in Studio, absolute, where its approvers decide it. */
  readonly requestPage?: (appId: string, requestId: string) => string | null;
  /** Signs upload tickets (`uploadTicketKey`). */
  readonly secret: string;
  readonly newId: () => string;
  readonly now?: () => Date;
  readonly onError?: (message: string, error: unknown) => void;
}

export interface BuildKey {
  /** The App the build is of. */
  readonly appId: unknown;
  readonly sha: unknown;
  /** The repository (`owner/repo`) the commit is verified in; else the App's, else the CI key's. */
  readonly repository?: unknown;
}

export interface BuildReport extends BuildKey {
  readonly state: unknown;
  readonly logsUrl?: unknown;
  readonly message?: unknown;
}

/** What `ensure` asks for. */
export interface EnsureInput {
  readonly environmentId: unknown;
  /** The repository (`owner/repo`) the App is made for; else the CI key's. */
  readonly repository?: unknown;
}

/** What `ensure` did. */
export interface EnsuredApp {
  readonly appId: string;
  readonly environmentId: string;
  /** It was made now; false when it was there. */
  readonly created: boolean;
}

/** What `deploy` asks for: an archive of a commit (`sha` and `file`), or a release that exists (`releaseId`). */
export interface DeployInput {
  readonly appId: unknown;
  readonly sha?: unknown;
  /** The archive's name, which the CLI sends when it streams one to the ticket. */
  readonly file?: unknown;
  readonly releaseId?: unknown;
  /** The repository (`owner/repo`); for a release, only checked against the CI key's. */
  readonly repository?: unknown;
}

/**
 * What a deployment did: started, a request waiting for approval (a protected environment takes every deployment that
 * way), or a preview's own.
 */
export interface DeployOutcome {
  readonly appId: string;
  readonly environmentId: string;
  /** The release deployed: the one named or uploaded, or its copy promoted into the App. */
  readonly releaseId: string;
  readonly deployment: { readonly id: string; readonly status: string } | null;
  readonly request: {
    readonly id: string;
    readonly status: string;
    /** The request's page, where its approvers decide it; null without Studio's public address. */
    readonly url: string | null;
  } | null;
  /** For a pull request's preview: how it stands (`blocked` waits for variables set on the issue page). */
  readonly preview: {
    readonly status: PreviewStatus;
    readonly error: string | null;
  } | null;
}

/** What receiving an upload did. */
export interface ReceivedUpload {
  readonly build: BuildView;
  /** The release it became; null when it was dropped (superseded). */
  readonly release: ReleaseView | null;
  /** It had been uploaded before: the same release answers. */
  readonly reused: boolean;
  /** A newer head of its pull request replaced it: it was dropped. */
  readonly superseded: boolean;
  /** With `nb-studio deploy --file`: what deploying it did; null for an upload alone. */
  readonly deployed: DeployOutcome | null;
}

/** An App ID `app ensure` makes. */
const APP_ID = /^[A-Za-z0-9_-]{1,128}$/u;
/** A repository as its git host names it: `owner/repo`, or a GitLab group path such as `group/sub/repo`. */
const REPOSITORY_NAME = /^(?=.{3,255}$)[^/\s]+(?:\/[^/\s]+)+$/u;

const textOf = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/** The line the CLI prints for an upload: the release, and what deploying it did. */
export function uploadMessage(received: ReceivedUpload): string {
  const { build, release } = received;
  const what = `the build of ${build.appId} at ${build.sha.slice(0, 12)}`;
  if (!release)
    return `Dropped ${what}: a newer head of its pull request replaced it.`;
  const uploaded = received.reused
    ? `Release ${release.id}: ${what} was uploaded before.`
    : `Release ${release.id}: uploaded ${what}.`;
  return received.deployed
    ? `${uploaded} ${deployMessage(received.deployed)}`
    : uploaded;
}

/** The line the CLI prints for `build status`. */
export function buildMessage(build: BuildView): string {
  return `${build.appId} at ${build.sha.slice(0, 12)}: ${build.state}${build.superseded ? ', superseded' : ''}.`;
}

/** The line the CLI prints for `app ensure`. */
export function ensureMessage(ensured: EnsuredApp): string {
  return ensured.created
    ? `Created ${ensured.appId} in ${ensured.environmentId}.`
    : `${ensured.appId} is in ${ensured.environmentId} already.`;
}

/** The line the CLI prints for a deployment. */
export function deployMessage(outcome: DeployOutcome): string {
  if (outcome.preview?.status === 'blocked')
    return `The preview ${outcome.appId} waits for variables nothing sets: set them on the issue page, and it deploys.`;
  if (outcome.request)
    return `${outcome.appId} is protected: deployment request ${outcome.request.id} waits for approval${outcome.request.url ? ` at ${outcome.request.url}` : ''}.`;
  if (outcome.deployment)
    return `Deployment ${outcome.deployment.id} of ${outcome.appId}: ${outcome.deployment.status}.`;
  return `The preview ${outcome.appId} is ${outcome.preview?.status ?? 'waiting'}${outcome.preview?.error ? `: ${outcome.preview.error}` : ''}.`;
}

/** What `deploy` answers: a ticket to stream the archive to, or what deploying a release did. */
export type DeployAnswer =
  { readonly ticket: UploadTicket } | { readonly outcome: DeployOutcome };

export interface Builds {
  /** Marks builds with no CI update before `cutoff` failed. */
  expireStale(cutoff: Date): Promise<number>;
  report(caller: Caller, input: BuildReport): Promise<BuildView>;
  /** Makes the App in the environment when it is missing; a no-op when it is there. */
  ensure(
    caller: Caller,
    appId: string,
    input: EnsureInput,
  ): Promise<EnsuredApp>;
  /** An upload ticket for the build's archive, streamed to `receive` (`basePath`: Studio's public base path). */
  ticket(
    caller: Caller,
    input: BuildKey,
    basePath: string,
  ): Promise<{ readonly ticket: UploadTicket; readonly build: BuildView }>;
  /** With `sha` and `file`, a ticket whose upload is deployed; with `releaseId`, that release deployed. */
  deploy(
    caller: Caller,
    input: DeployInput,
    basePath: string,
  ): Promise<DeployAnswer>;
  receive(
    buildId: string,
    token: string | null,
    stream: AsyncIterable<Uint8Array>,
  ): Promise<ReceivedUpload>;
  /** A pull request has a new head: the App builds of its other commits are superseded. */
  headMoved(pullRequestId: string, headSha: string): Promise<void>;
  /** The build of an App at a commit, as people see it. */
  find(appId: string, sha: string): Promise<BuildView | null>;
  /** A page of the builds CI reported for a repository's Apps, the most recently updated first, and how many. */
  recent(
    resourceId: string,
    page: { readonly page: number; readonly pageSize: number },
  ): Promise<{ readonly items: BuildView[]; readonly total: number }>;
}

type AppRecord = NonNullable<
  Awaited<ReturnType<Releases['releases']['findApp']>>
>;

/** The repository's CI, when the credential is the API key Studio keeps for it. */
interface CiOfCaller {
  readonly resourceId: string;
  readonly setUpBy: string | null;
}

/** As whom a ticket's upload, and its deployment with `nb-studio deploy --file`, run: carried in the signed ticket. */
interface TicketActor {
  readonly userId: string | null;
  readonly kind: Caller['kind'];
}

interface TicketGrant {
  readonly upload: TicketActor;
  readonly deploy: TicketActor | null;
}

const ruleCaller = (userId: string | null): Caller => ({
  userId,
  kind: 'rule',
  permissions: allPermissions(),
});

async function drain(stream: AsyncIterable<Uint8Array>): Promise<void> {
  for await (const chunk of stream) void chunk;
}

function urlOf(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (
    typeof value !== 'string' ||
    value.length > 2000 ||
    !URL.canParse(value) ||
    !/^https?:$/u.test(new URL(value).protocol)
  )
    throw invalid('INVALID_LOGS_URL', 'The log address is an http(s) URL.');
  return value;
}

/** The pull request section listing what a preview build's variables change; null when nothing does. */
export function variablesSection(diff: BuildVariablesDiff): string | null {
  if (diff.added.length === 0 && diff.removed.length === 0) return null;
  const lines = ['**Variables** (Studio)', ''];
  for (const variable of diff.added) {
    const tags = [
      ...(variable.required ? ['required'] : []),
      ...(variable.secret ? ['secret'] : []),
    ];
    lines.push(
      `- New: \`${variable.name}\`${tags.length ? ` (${tags.join(', ')})` : ''}${variable.description ? ` — ${variable.description}` : ''}`,
    );
  }
  for (const name of diff.removed) lines.push(`- Removed: \`${name}\``);
  if (diff.added.some((variable) => variable.required))
    lines.push(
      '',
      'Set the required ones on the App’s Variables page (or its environment’s) before this is deployed.',
    );
  return lines.join('\n');
}

export function createBuilds(deps: BuildsDeps): Builds {
  const now = deps.now ?? (() => new Date());
  const onError =
    deps.onError ?? ((message, error) => console.error(message, error));
  const conn = () => deps.database.connection();
  const locks = new Map<string, Promise<unknown>>();

  /** One upload per build at a time. */
  function locked<T>(key: string, run: () => Promise<T>): Promise<T> {
    const previous = locks.get(key) ?? Promise.resolve();
    const next = previous.then(run, run);
    const settled = next.catch(() => undefined);
    locks.set(key, settled);
    void settled.then(() => {
      if (locks.get(key) === settled) locks.delete(key);
    });
    return next;
  }

  function sign(payload: string): string {
    return createHmac('sha256', deps.secret)
      .update(`studio-build:${payload}`)
      .digest('base64url');
  }

  /** A one-time ticket for the build, carrying as whom its upload (and deployment) run. */
  function ticketToken(buildId: string, grant: TicketGrant): string {
    const expires = Math.floor(now().getTime() / 1000) + TICKET_SECONDS;
    const payload = Buffer.from(
      JSON.stringify({ b: buildId, e: expires, g: grant }),
    ).toString('base64url');
    return `${BUILD_TICKET_PREFIX}${payload}.${sign(payload)}`;
  }

  /** What the ticket grants, or null when it is not a valid ticket for the build. */
  function readToken(
    buildId: string,
    token: string | null,
  ): TicketGrant | null {
    if (!token?.startsWith(BUILD_TICKET_PREFIX)) return null;
    const [payload, signature] = token
      .slice(BUILD_TICKET_PREFIX.length)
      .split('.');
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given))
      return null;
    try {
      const parsed = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { b?: unknown; e?: unknown; g?: TicketGrant };
      if (parsed.b !== buildId || typeof parsed.e !== 'number' || !parsed.g)
        return null;
      if (parsed.e * 1000 < now().getTime()) return null;
      return parsed.g;
    } catch {
      return null;
    }
  }

  /** The caller a ticket's actor is again. */
  async function callerOfActor(actor: TicketActor): Promise<Caller> {
    return actor.kind === 'rule' || actor.kind === 'system' || !actor.userId
      ? ruleCaller(actor.userId)
      : deps.releases().callerForUser(actor.userId, actor.kind);
  }

  const actorOf = (caller: Caller): TicketActor => ({
    userId: caller.userId,
    kind: caller.kind,
  });

  const verificationRefused = (
    reason: Extract<CommitVerification, { ok: false }>['reason'],
    sha: string,
    what: string,
  ) =>
    conflict(
      'COMMIT_NOT_VERIFIED',
      {
        noRepository: `The repository building ${what} is not linked to a git host.`,
        notInRepository: `${sha} is not a commit of the repository building ${what}.`,
      }[reason],
      { reason },
    );

  async function ciOfCaller(caller: Caller): Promise<CiOfCaller | null> {
    if (!caller.userId || !deps.ciRepositoryOf) return null;
    return deps.ciRepositoryOf(caller.userId);
  }

  /** The working directory `app ensure` made the App for, if it did. */
  const ensuredFor = (app: AppRecord): string | null =>
    app.labels[RELEASE_LABELS.ensured] || null;

  /** Whether the App is the repository's: recorded for it, or made for it by `app ensure`. */
  async function isRepositoryApp(
    app: AppRecord,
    resourceId: string,
  ): Promise<boolean> {
    if (ensuredFor(app) === resourceId) return true;
    return (await repositoriesOfApp(conn(), app.id)).some(
      (link) => link.resourceId === resourceId,
    );
  }

  /**
   * As whom an action on the App runs for the credential: itself when it may; Studio as a rule for whoever set the
   * repository's CI up when the credential is that CI's key and the App is the repository's. Null when neither.
   */
  async function actorFor(
    caller: Caller,
    app: AppRecord,
    action: 'upload' | 'deploy',
    ci: CiOfCaller | null,
  ): Promise<Caller | null> {
    if (await deps.releases().guard.canApp(caller, action, app)) return caller;
    if (ci && (await isRepositoryApp(app, ci.resourceId)))
      return ruleCaller(ci.setUpBy ?? app.createdBy);
    return null;
  }

  /** 404 for an App the credential may not see, 403 for one it sees but may not act on. */
  async function refuse(caller: Caller, app: AppRecord, what: string) {
    if (!(await deps.releases().guard.canApp(caller, 'view', app)))
      return notFound('App');
    return forbidden(`This credential may not ${what} ${app.id}.`);
  }

  /** Every working directory the App is of: the one `app ensure` made it for, those it is recorded for, its preview's. */
  async function appRepositories(app: AppRecord): Promise<string[]> {
    const ensured = ensuredFor(app);
    const recorded = await repositoriesOfApp(conn(), app.id);
    const preview = await previewWhere(conn(), 'appId', app.id);
    return [
      ...(ensured ? [ensured] : []),
      ...recorded.map((link) => link.resourceId),
      ...(preview ? [preview.resourceId] : []),
    ];
  }

  /**
   * The working directory a build is of. Named (`--repository owner/repo`, which the CLI reads from
   * `GITHUB_REPOSITORY` or `CI_PROJECT_PATH` in CI): the working directory of that repository. A repository's CI key
   * may name only its own; when several projects work in the repository, the key's or the App's tells them apart.
   * Not named: the one the App is recorded or made for, else the one whose CI key the credential is.
   */
  async function repositoryOf(
    named: unknown,
    app: AppRecord | null,
    ci: CiOfCaller | null,
  ): Promise<string> {
    const name = textOf(named);
    if (name) {
      if (!REPOSITORY_NAME.test(name))
        throw invalid(
          'INVALID_REPOSITORY',
          'Name the repository as owner/repo, such as acme/shop.',
        );
      const matches = await workingDirectoriesOf(conn(), name);
      if (matches.length === 0) throw notFound('Repository');
      if (ci) {
        if (matches.includes(ci.resourceId)) return ci.resourceId;
        throw forbidden(
          `This credential is the CI key of another repository, not ${name}.`,
          'REPOSITORY_MISMATCH',
        );
      }
      if (matches.length === 1) return matches[0];
      const own = app ? await appRepositories(app) : [];
      const picked = matches.filter((id) => own.includes(id));
      if (picked.length === 1) return picked[0];
      throw invalid(
        'REPOSITORY_AMBIGUOUS',
        `${name} is the repository of ${matches.length} projects in Studio: use the CI key Studio keeps for the project this build is of.`,
      );
    }
    if (app) {
      const ensured = ensuredFor(app);
      if (ensured) return ensured;
      const recorded = await repositoriesOfApp(conn(), app.id);
      if (recorded.length === 1) return recorded[0].resourceId;
      const preview = await previewWhere(conn(), 'appId', app.id);
      if (preview) return preview.resourceId;
    }
    if (ci) return ci.resourceId;
    throw invalid(
      'REPOSITORY_REQUIRED',
      'Name the repository with --repository owner/repo.',
    );
  }

  /**
   * Who creates a missing App: a credential that may create Apps, as itself; the repository's CI key, as the person
   * who set the CI up, when they may set Apps up. Null when neither may.
   */
  async function creatorOf(
    caller: Caller,
    ci: CiOfCaller | null,
    resourceId: string,
  ): Promise<Caller | null> {
    const services = deps.releases();
    try {
      services.guard.requireCreate(caller);
      return caller;
    } catch {
      // Not this credential: perhaps the repository's CI, for whoever set it up.
    }
    if (!ci || ci.resourceId !== resourceId || !ci.setUpBy) return null;
    const person = await services.callerForUser(ci.setUpBy, 'human');
    return maySetUpApps(person.permissions.scopes)
      ? ruleCaller(ci.setUpBy)
      : null;
  }

  function shaOf(value: unknown): string {
    const sha = textOf(value);
    if (!FULL_SHA.test(sha))
      throw invalid(
        'INVALID_SHA',
        'Pin the full commit hash (40 hexadecimal characters) with --sha.',
      );
    return sha;
  }

  /**
   * The verified build of the App at the commit, recorded once. The App may be missing for a build CI reports before
   * `app ensure`; anything else needs it. `action` is what the credential must be allowed on it.
   */
  async function admit(
    caller: Caller,
    input: BuildKey,
    action: 'upload' | 'deploy',
    options: { readonly appRequired: boolean },
  ): Promise<{ readonly build: BuildRecord; readonly app: AppRecord | null }> {
    const sha = shaOf(input.sha);
    const appId = textOf(input.appId);
    if (!appId) throw invalid('INVALID_APP', 'Name the App with --app.');
    const services = deps.releases();
    const ci = await ciOfCaller(caller);
    const app = await services.releases.findApp(appId);
    if (app) {
      if (!(await actorFor(caller, app, action, ci)))
        throw await refuse(
          caller,
          app,
          action === 'upload' ? 'upload to' : 'deploy',
        );
    } else if (options.appRequired) throw notFound('App');
    else if (!APP_ID.test(appId))
      throw invalid(
        'INVALID_APP',
        '--app is an App ID: letters, digits, `_` and `-`, at most 128.',
      );
    const resourceId = await repositoryOf(input.repository, app, ci);
    // A build of an App not made yet: its repository's CI key, or a credential that may create Apps.
    if (
      !app &&
      ci?.resourceId !== resourceId &&
      !(await creatorOf(caller, ci, resourceId))
    )
      throw forbidden(
        `There is no App ${appId}, and this credential may not create Apps.`,
        'APPS_NOT_CREATABLE',
      );
    const existing = await findBuild(conn(), { appId, sha });
    // Verified once.
    if (existing) return { build: existing, app };
    const verified = await deps.verify(resourceId, sha);
    if (!verified.ok) throw verificationRefused(verified.reason, sha, appId);
    const pullRequestId = verified.pullRequestIds[0] ?? null;
    const at = now();
    try {
      await insertBuild(conn(), {
        id: deps.newId(),
        appId,
        resourceId,
        sha,
        ref: verified.ref,
        pullRequestId,
        state: 'queued',
        superseded: false,
        reportedBy: caller.userId,
        verifiedAt: at,
        createdAt: at,
        updatedAt: at,
      });
    } catch (error) {
      // Another report of the same build won the race.
      const winner = await findBuild(conn(), { appId, sha });
      if (winner) return { build: winner, app };
      throw error;
    }
    // The newest verified head of a pull request is the one that counts.
    if (pullRequestId) await supersedeOthers(conn(), pullRequestId, appId, sha);
    return { build: (await findBuild(conn(), { appId, sha }))!, app };
  }

  /**
   * The App's preview, when it is one: claimed already, or made by `app ensure` for the build's repository, never
   * deployed, and given an open pull request's head (the pull request is then recorded as its source).
   */
  async function previewOfApp(
    app: AppRecord,
    build: BuildRecord | null,
  ): Promise<PreviewRecord | null> {
    const existing = await previewWhere(conn(), 'appId', app.id);
    const port = deps.previews();
    if (existing) {
      // Destroyed with its App, and made again by `app ensure`: it comes back.
      if (existing.status === 'destroyed' && port)
        return (
          (await port.claim({
            resourceId: existing.resourceId,
            pullRequestId: build?.pullRequestId ?? existing.pullRequestId,
            appId: app.id,
            environmentId: app.environmentId,
            createdBy: app.createdBy,
          })) ?? existing
        );
      return existing;
    }
    if (
      !port ||
      !build?.pullRequestId ||
      app.currentDeploymentId ||
      ensuredFor(app) !== build.resourceId
    )
      return null;
    return port.claim({
      resourceId: build.resourceId,
      pullRequestId: build.pullRequestId,
      appId: app.id,
      environmentId: app.environmentId,
      createdBy: app.createdBy,
    });
  }

  /** A deployed App that is no preview is the repository's, in the role its environment gives it. */
  async function record(app: AppRecord, build: BuildRecord, by: string | null) {
    const environment = await deps
      .releases()
      .environments.find(app.environmentId);
    if (!environment) return;
    if (
      await recordRepositoryApp(conn(), {
        resourceId: build.resourceId,
        appId: app.id,
        role: roleOfEnvironment(environment),
        environmentId: app.environmentId,
        by,
        newId: deps.newId,
      })
    )
      await deps
        .appsRecorded?.(build.resourceId)
        .catch((error: unknown) =>
          onError('Could not keep the repository’s CI key in step.', error),
        );
  }

  /**
   * What the preview build's manifest adds and removes against the release the App runs; null when either declares
   * no variables.
   */
  async function variablesDiff(
    appId: string,
    releaseId: string,
  ): Promise<BuildVariablesDiff | null> {
    const services = deps.releases();
    const manifest = await services.releases
      .readReleaseVariables(ruleCaller(null), appId, releaseId)
      .catch(() => null);
    if (!manifest) return null;
    // Against the release the App runs, not its newest build, which this one now is.
    const app = await services.releases.findApp(appId);
    const running = app?.currentDeploymentId
      ? await services.releases
          .getDeployment(ruleCaller(null), appId, app.currentDeploymentId)
          .catch(() => null)
      : null;
    const current = await services.releases
      .listAppVariables(
        ruleCaller(null),
        appId,
        running ? { releaseId: running.releaseId } : {},
      )
      .catch(() => null);
    if (!current?.meta.declared) return null;
    const before = new Set(
      current.items.filter((item) => item.declared).map((item) => item.name),
    );
    const declared = manifest.variables.filter((variable) => !variable.runtime);
    const after = new Set(declared.map((variable) => variable.name));
    return {
      added: declared
        .filter((variable) => !before.has(variable.name))
        .map((variable) => ({
          name: variable.name,
          description: variable.description ?? null,
          required: variable.required,
          secret: variable.secret,
        })),
      removed: [...before].filter((name) => !after.has(name)).sort(),
    };
  }

  /** Records what a preview build's variables change, and tells the pull request an agent opened. */
  async function noteVariables(
    build: BuildRecord,
    releaseId: string,
  ): Promise<void> {
    const diff = await variablesDiff(build.appId, releaseId);
    await updateBuild(conn(), build.id, {
      newVariables: diff ? JSON.stringify(diff) : null,
    });
    const git = deps.git?.();
    if (!diff || !git || !build.pullRequestId) return;
    const links = await linksOfPullRequest(conn(), build.pullRequestId);
    if (!links.some((link) => link.linkedByType === 'agent')) return;
    await git.updatePullRequestSection(
      build.pullRequestId,
      'variables',
      variablesSection(diff),
    );
  }

  /** Deploys a release of the App as `actor`, or asks for it on a protected environment, where nobody deploys directly. */
  async function deployRelease(
    actor: Caller,
    app: AppRecord,
    releaseId: string,
    note: string | null,
  ): Promise<DeployOutcome> {
    const services = deps.releases();
    const environment = await services.environments.find(app.environmentId);
    if (!environment) throw notFound('Environment');
    const base = {
      appId: app.id,
      environmentId: app.environmentId,
      releaseId,
      preview: null,
    };
    if (environment.protected) {
      const request = await services.requests
        .create(actor, app.id, { releaseId, ...(note ? { note } : {}) })
        .catch((error: unknown) => {
          throw withVariablesPages(error, app, deps.variablesPages);
        });
      return {
        ...base,
        deployment: null,
        request: {
          id: request.id,
          status: request.status,
          url: deps.requestPage?.(app.id, request.id) ?? null,
        },
      };
    }
    const deployment = await services.releases
      .deploy(actor, app.id, { releaseId })
      .catch((error: unknown) => {
        throw withVariablesPages(error, app, deps.variablesPages);
      });
    return {
      ...base,
      deployment: { id: deployment.id, status: deployment.status },
      request: null,
    };
  }

  /** What a preview's deployment did, as the preview says. */
  async function previewOutcome(
    preview: PreviewRecord,
  ): Promise<DeployOutcome> {
    const deployment = preview.deploymentId
      ? await deps
          .releases()
          .releases.getDeployment(
            ruleCaller(null),
            preview.appId,
            preview.deploymentId,
          )
          .catch(() => null)
      : null;
    return {
      appId: preview.appId,
      environmentId: preview.environmentId,
      releaseId: preview.releaseId ?? '',
      deployment: deployment
        ? { id: deployment.id, status: deployment.status }
        : null,
      request: null,
      preview: { status: preview.status, error: preview.error },
    };
  }

  /** Deploys an uploaded build to its App: through its preview, or as `actor`. */
  async function deployBuild(
    build: BuildRecord,
    actor: Caller,
  ): Promise<DeployOutcome> {
    const services = deps.releases();
    const app = await services.releases.findApp(build.appId);
    if (!app || !build.releaseId) throw notFound('App');
    const preview = await previewOfApp(app, build);
    if (preview) {
      const port = deps.previews();
      const after = port ? await port.built(build) : null;
      return previewOutcome(after ?? preview);
    }
    const outcome = await deployRelease(
      actor,
      app,
      build.releaseId,
      `${build.sha.slice(0, 12)}${build.ref ? ` (${build.ref})` : ''}`,
    );
    await record(app, build, build.reportedBy);
    return outcome;
  }

  function mintTicket(
    build: BuildRecord,
    basePath: string,
    grant: TicketGrant,
  ): UploadTicket {
    return {
      url: `${basePath}/api/builds/${encodeURIComponent(build.id)}/uploadArtifact`,
      method: 'POST',
      headers: { authorization: `Bearer ${ticketToken(build.id, grant)}` },
      message: build.releaseId
        ? `${build.appId} at ${build.sha.slice(0, 12)} was uploaded before; its release stands.`
        : `Uploaded the build of ${build.appId} at ${build.sha.slice(0, 12)}.`,
    };
  }

  const service: Builds = {
    async expireStale(cutoff) {
      return failStaleBuilds(conn(), cutoff);
    },
    async report(caller, input) {
      if (!BUILD_STATES.includes(input.state as BuildState))
        throw invalid(
          'INVALID_STATE',
          `--state is ${BUILD_STATES.join(', ')}.`,
        );
      const logsUrl = urlOf(input.logsUrl);
      const message =
        typeof input.message === 'string' && input.message.trim()
          ? input.message.trim().slice(0, 1000)
          : null;
      const { build } = await admit(caller, input, 'upload', {
        appRequired: false,
      });
      await reportBuild(conn(), build.id, {
        // An uploaded build stays succeeded: its archive is what counts.
        state: build.releaseId ? 'succeeded' : input.state,
        ...(logsUrl !== null ? { logsUrl } : {}),
        message,
      });
      return buildView((await buildById(conn(), build.id))!);
    },

    async ensure(caller, appId, input) {
      const id = textOf(appId);
      if (!APP_ID.test(id))
        throw invalid(
          'INVALID_APP',
          'The App ID is letters, digits, `_` and `-`, at most 128.',
        );
      const environmentId = textOf(input.environmentId);
      if (!environmentId)
        throw invalid(
          'ENVIRONMENT_REQUIRED',
          'Name the environment with --environment.',
        );
      const services = deps.releases();
      const ci = await ciOfCaller(caller);
      const existing = async (app: AppRecord): Promise<EnsuredApp> => {
        if (!(await actorFor(caller, app, 'upload', ci)))
          throw await refuse(caller, app, 'deploy to');
        if (app.environmentId !== environmentId)
          throw conflict(
            'APP_IN_OTHER_ENVIRONMENT',
            `${app.id} runs in ${app.environmentId}, not ${environmentId}.`,
            { environmentId: app.environmentId },
          );
        return { appId: app.id, environmentId, created: false };
      };
      const found = await services.releases.findApp(id);
      if (found) return existing(found);
      const resourceId = await repositoryOf(input.repository, null, ci);
      const environment = await services.environments.find(environmentId);
      if (!environment) throw notFound('Environment');
      const creator = await creatorOf(caller, ci, resourceId);
      if (!creator)
        throw forbidden(
          `There is no App ${id}, and this credential may not create Apps.`,
          'APPS_NOT_CREATABLE',
        );
      try {
        await services.releases.createApp(creator, {
          id,
          name: id,
          environmentId,
          labels: { [RELEASE_LABELS.ensured]: resourceId },
        });
      } catch (error) {
        // Another run made it meanwhile.
        const raced = await services.releases.findApp(id);
        if (
          error instanceof ReleasesError &&
          error.reason === 'APP_EXISTS' &&
          raced
        )
          return existing(raced);
        throw error;
      }
      // A build CI reported before the App was made, of an open pull request's head: the App is that pull request's.
      const pending = await conn()
        .query.selectFrom('studioBuilds')
        .selectAll()
        .where('appId', '=', id)
        .where('resourceId', '=', resourceId)
        .where('pullRequestId', 'is not', null)
        .where('superseded', '=', false)
        .orderBy('verifiedAt', 'desc')
        .executeTakeFirst<Row>();
      const port = deps.previews();
      if (pending && port) {
        const pullRequestId = String(pending.pullRequestId);
        const pr = await findPullRequestById(conn(), pullRequestId);
        if (pr?.state === 'open' && pr.headSha === String(pending.sha))
          await port
            .claim({
              resourceId,
              pullRequestId,
              appId: id,
              environmentId,
              createdBy: creator.userId,
            })
            .catch((error: unknown) =>
              onError('Could not record a preview’s pull request.', error),
            );
      }
      return { appId: id, environmentId, created: true };
    },

    async ticket(caller, input, basePath) {
      const { build, app } = await admit(caller, input, 'upload', {
        appRequired: true,
      });
      const uploader = (await actorFor(
        caller,
        app!,
        'upload',
        await ciOfCaller(caller),
      ))!;
      return {
        ticket: mintTicket(build, basePath, {
          upload: actorOf(uploader),
          deploy: null,
        }),
        build: buildView(build),
      };
    },

    async deploy(caller, input, basePath) {
      const services = deps.releases();
      const releaseId = textOf(input.releaseId);
      const sha = textOf(input.sha);
      const file = textOf(input.file);
      // A commit without an archive is CI's environment speaking (`--sha` defaults to it): a release ignores it.
      if (releaseId && file)
        throw invalid(
          'INVALID_DEPLOY',
          'Deploy a release (--release) or an archive of a commit (--sha with --file), not both.',
        );
      if (!releaseId) {
        if (!sha || !file)
          throw invalid(
            'INVALID_DEPLOY',
            'Deploy an archive of a commit (--sha with --file), or a release (--release).',
          );
        const { build, app } = await admit(
          caller,
          { appId: input.appId, sha, repository: input.repository },
          'deploy',
          { appRequired: true },
        );
        const ci = await ciOfCaller(caller);
        const deployer = (await actorFor(caller, app!, 'deploy', ci))!;
        const uploader = await actorFor(caller, app!, 'upload', ci);
        if (!uploader) throw await refuse(caller, app!, 'upload to');
        return {
          ticket: mintTicket(build, basePath, {
            upload: actorOf(uploader),
            deploy: actorOf(deployer),
          }),
        };
      }
      const appId = textOf(input.appId);
      if (!appId) throw invalid('INVALID_APP', 'Name the App with --app.');
      const app = await services.releases.findApp(appId);
      if (!app) throw notFound('App');
      const ci = await ciOfCaller(caller);
      if (ci && textOf(input.repository))
        await repositoryOf(input.repository, app, ci);
      const actor = await actorFor(caller, app, 'deploy', ci);
      if (!actor) throw await refuse(caller, app, 'deploy');
      let deployed = await services.releases
        .getRelease(ruleCaller(null), app.id, releaseId)
        .then((release) => release.id)
        .catch(() => null);
      const build = await buildByRelease(conn(), releaseId);
      if (!deployed) {
        // Another App's release: one the same repository uploaded, promoted into this App.
        const source = build?.releaseAppId
          ? await services.releases.findApp(build.releaseAppId)
          : null;
        if (
          !build ||
          !source ||
          !(await services.guard.canApp(caller, 'view', source)) ||
          !(await isRepositoryApp(app, build.resourceId))
        )
          throw notFound('Release');
        const uploader = await actorFor(caller, app, 'upload', ci);
        if (!uploader) throw await refuse(caller, app, 'upload to');
        deployed = (
          await services.releases.promoteRelease(
            uploader,
            source.id,
            releaseId,
            app.id,
          )
        ).id;
      }
      return {
        outcome: await deployRelease(
          actor,
          app,
          deployed,
          build
            ? `${build.sha.slice(0, 12)}${build.ref ? ` (${build.ref})` : ''}`
            : null,
        ),
      };
    },

    async receive(buildId, token, stream) {
      const grant = readToken(buildId, token);
      if (!grant) {
        await drain(stream);
        throw unauthorized(
          'The upload ticket is invalid or expired.',
          'UPLOAD_TICKET_INVALID',
        );
      }
      return locked(buildId, async () => {
        const build = await buildById(conn(), buildId);
        if (!build) {
          await drain(stream);
          throw notFound('Build');
        }
        const services = deps.releases();
        const deployIt = async (stored: BuildRecord) =>
          grant.deploy && !stored.superseded
            ? deployBuild(stored, await callerOfActor(grant.deploy))
            : null;
        if (build.superseded) {
          await drain(stream);
          return {
            build: buildView(build),
            release: null,
            reused: false,
            superseded: true,
            deployed: null,
          };
        }
        if (build.releaseId && build.releaseAppId) {
          await drain(stream);
          const release = await services.releases
            .getRelease(ruleCaller(null), build.releaseAppId, build.releaseId)
            .catch(() => null);
          return {
            build: buildView(build),
            release,
            reused: true,
            superseded: false,
            deployed: await deployIt(build),
          };
        }
        // The same commit's archive the repository already uploaded to another App: promoted when the bytes match.
        const elsewhere = await uploadedElsewhere(
          conn(),
          build.resourceId,
          build.sha,
          build.appId,
        );
        const release = await services.releases.uploadRelease(
          await callerOfActor(grant.upload),
          build.appId,
          {
            stream,
            labels: {
              [RELEASE_LABELS.sha]: build.sha,
              [RELEASE_LABELS.build]: build.id,
              ...(build.ref ? { [RELEASE_LABELS.ref]: build.ref } : {}),
              ...(elsewhere
                ? { [RELEASE_LABELS.promotedBuild]: elsewhere.id }
                : {}),
            },
            sourceCommit: build.sha,
            ...(build.logsUrl ? { build: build.logsUrl } : {}),
            ...(elsewhere?.releaseId && elsewhere.releaseAppId
              ? {
                  promoteFrom: {
                    appId: elsewhere.releaseAppId,
                    releaseId: elsewhere.releaseId,
                  },
                }
              : {}),
          },
        );
        await updateBuild(conn(), build.id, {
          releaseId: release.id,
          releaseAppId: build.appId,
          uploadedAt: now(),
          state: 'succeeded',
        });
        const stored = (await buildById(conn(), build.id))!;
        if (stored.pullRequestId && !release.reused)
          await noteVariables(stored, release.id).catch((error: unknown) =>
            onError('Could not compare a build’s variables.', error),
          );
        // A newer head may have arrived while it uploaded: it stays stored and is never deployed.
        const deployed = await deployIt(stored);
        return {
          build: buildView((await buildById(conn(), build.id))!),
          release,
          reused: release.reused === true,
          superseded: stored.superseded,
          deployed,
        };
      });
    },

    async headMoved(pullRequestId, headSha) {
      const apps = await conn()
        .query.selectFrom('studioBuilds')
        .select('appId')
        .distinct()
        .where('pullRequestId', '=', pullRequestId)
        .execute<Row>();
      for (const row of apps)
        await supersedeOthers(
          conn(),
          pullRequestId,
          String(row.appId),
          headSha,
        );
    },

    async find(appId, sha) {
      const build = await findBuild(conn(), { appId, sha });
      return build ? buildView(build) : null;
    },
    async recent(resourceId, page) {
      const found = await repositoryBuilds(conn(), resourceId, page);
      return { items: found.items.map(buildView), total: found.total };
    },
  };
  return service;
}
