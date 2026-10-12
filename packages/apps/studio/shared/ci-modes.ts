/**
 * Configuring a repository's CI for Studio ("Deployment", `server/builds/ci-modes.ts`), as the server and the browser
 * exchange it. "Configure CI" is a run, repeated whenever someone likes, that connects **one application** to **one
 * target**, in one of five ways (`CiMethod`), the same in the New project wizard and in the project's settings:
 *
 * - carried out by Studio, which needs the repository reached through a Git connection; Studio makes an organization API
 *   key limited to the repository's Apps and writes it as the CI secret, never showing it to anyone:
 *   - `direct`: the standard workflow of the application and target;
 *   - `template`: that workflow as the person edited it;
 *   - `agent`: an issue in the project asks an agent to adapt the repository's CI and open a pull request;
 * - done by the person, nothing sent to Studio:
 *   - `manual`: the workflow and the nb-studio commands to copy, and the repository's CI key, the same key Studio makes,
 *     shown once for the person to store as the secret (`POST …/ci/setup` with `reveal`), for a CI Studio cannot write
 *     to;
 *   - `ownAgent`: a prompt for their own coding agent.
 *
 * A target (`CiTarget`) is what starts the CI and where it deploys: a pull request (each gets its own App
 * `<appId>-pr-<n>`, deleted once the pull request goes), a push to a branch, or a tag matching a pattern; and any
 * environment of release management. The application is a directory and an App ID: the base of the pull requests'
 * Apps, or the App a branch or tag deploys to (`<appId>-<environment>` by default, `defaultCiTargetAppId`). Each
 * (application, target) has a workflow file of its own, named for what it is for (`ciWorkflowPathOf`).
 *
 * Nothing records which way was chosen, nor the application or target a run named: CI's reports are the truth. Where
 * the CI stands is what CI reported for each App (`CiReportedApp`), in the environment that App runs in; of a run only
 * what shows its outcome is kept: the open pull request, the agent's issue, or the files waiting for a new
 * repository's initialization.
 */
import type { BuildState, CiSetupView } from './builds.js';
import type { CiWorkflowFile } from './releases.js';

export type { CiWorkflowFile };

/** What starts a run's CI: a pull request, a push to a branch, a tag. */
export const CI_TRIGGERS = ['pullRequest', 'branch', 'tag'] as const;
export type CiTrigger = (typeof CI_TRIGGERS)[number];

/** The environment pull requests deploy to unless another is chosen: the Preview environment Studio creates. */
export const CI_PREVIEW_ENVIRONMENT = 'preview';
/** The tags a tag target builds unless another pattern is given. */
export const CI_DEFAULT_TAG_PATTERN = 'v*';

/** What starts the CI and where it deploys. */
export interface CiTarget {
  readonly trigger: CiTrigger;
  /** The branch of `branch` (the default branch when left out), the tag pattern of `tag` (`v*`); none for pull requests. */
  readonly ref?: string | null;
  /** The release management environment the App runs in. */
  readonly environmentId: string;
}

/** An environment of release management, as a run's choice and the status list name it. */
export interface CiEnvironment {
  readonly id: string;
  readonly name: string;
  /** Every deployment there, CI's included, becomes a deployment request that waits for an approver. */
  readonly protected: boolean;
}

/** The ways "Configure CI" runs. */
export const CI_METHODS = [
  'direct',
  'template',
  'agent',
  'manual',
  'ownAgent',
] as const;
export type CiMethod = (typeof CI_METHODS)[number];

/** The ways Studio carries out itself: they need a Git connection, and they are what `POST …/ci/configure` takes. */
export const STUDIO_CI_METHODS = ['direct', 'template', 'agent'] as const;
export type StudioCiMethod = (typeof STUDIO_CI_METHODS)[number];

export function isStudioCiMethod(method: CiMethod): method is StudioCiMethod {
  return (STUDIO_CI_METHODS as readonly string[]).includes(method);
}

/** The NocoBase application in the repository a run connects. */
export interface CiApp {
  /** Relative to the repository's root, `.` for the root itself. */
  readonly directory: string;
  /** The App a branch or tag deploys to; for pull requests, the base of their Apps' IDs (`<appId>-pr-<n>`). */
  readonly appId: string;
}

/** A run Studio carries out (`POST …/ci/configure`, and `ci` of a new repository's request). */
export interface CiRunRequest {
  readonly method: StudioCiMethod;
  /** The application; one at the root, named after the repository, when left out. */
  readonly app?: CiApp;
  /** What starts the CI and where it deploys; pull requests to the Preview environment when left out. */
  readonly target?: CiTarget;
  /** The edited file `template` writes. */
  readonly workflowFiles?: readonly CiWorkflowFile[];
  /** The agent the issue of `agent` is given to. */
  readonly agentId?: string | null;
}

/**
 * Where the repository's CI stands, as the project's checklist says it: `connected` once CI reported any build; before
 * that, the outcome of the last run: `pending` (its files wait for the repository's initialization), `pr-open` (its
 * pull request waits), `task` (its agent's issue is under way); `none` otherwise.
 */
export const CI_CONNECTION_STATES = [
  'none',
  'pending',
  'pr-open',
  'task',
  'connected',
] as const;
export type CiConnectionState = (typeof CI_CONNECTION_STATES)[number];

/** An App CI reported for the repository, in the environment it runs in, with what its own reports say. */
export interface CiReportedApp {
  /** The environment the App runs in. */
  readonly environmentId: string;
  /** The App's ID; for pull requests the application's, their Apps being `<appId>-pr-<n>`. */
  readonly appId: string;
  /** Whether the row stands for the application's pull request Apps. */
  readonly pullRequests: boolean;
  /** When CI last reported a build of it, and how that build stands; null when it never did. */
  readonly lastBuildAt: string | null;
  readonly lastBuildState: BuildState | null;
  /** When CI last uploaded a build of it to deploy; null when it never did. */
  readonly lastDeployAt: string | null;
  /** Whether CI reported a build of this App itself: connected by its own reports, never by another App's. */
  readonly connected: boolean;
}

/**
 * Why configuring CI, or rotating its key, last failed, as the browser words it (`ciSetup.failures.<reason>`):
 *
 * - the Git connection: `demoConnection` (a demo connection never writes to its host), `noConnection` (the repository
 *   is not reached through one), `connectionMissing`, `connectionPermission` (the app may not write secrets yet),
 *   `secretsUnsupported`;
 * - the host: `hostForbidden` (it refused), `hostRateLimited` (its rate limit, `retryAt`), `repositoryNotFound`,
 *   `defaultBranchMissing` (`branch`);
 * - the target: `unknownEnvironment` (`environmentId`), `appInOtherEnvironment` (`appId`, `environmentId`,
 *   `actualEnvironmentId`), `appsNotCreatable`, `appNotConfigurable` (`appId`), `forbidden`;
 * - the key: `keyScope` (it would give more than its maker holds), `keyMissing`, `keyRevoked` (`how`), `rotationFailed`
 *   (`cause`, another reason);
 * - Studio itself: `noPublicOrigin`, `apiKeysUnavailable`, `issuesUnavailable`, `workingDirectoryMissing`,
 *   `noSetUpUser`;
 * - `unknown`: anything else, whose words are only in `lastError`.
 */
export const CI_FAILURE_REASONS = [
  'demoConnection',
  'noConnection',
  'connectionMissing',
  'connectionPermission',
  'secretsUnsupported',
  'hostForbidden',
  'hostRateLimited',
  'repositoryNotFound',
  'defaultBranchMissing',
  'unknownEnvironment',
  'appInOtherEnvironment',
  'appsNotCreatable',
  'appNotConfigurable',
  'forbidden',
  'keyScope',
  'keyMissing',
  'keyRevoked',
  'rotationFailed',
  'noPublicOrigin',
  'apiKeysUnavailable',
  'issuesUnavailable',
  'workingDirectoryMissing',
  'noSetUpUser',
  'unknown',
] as const;
export type CiFailureReason = (typeof CI_FAILURE_REASONS)[number];

/** A failure by its reason and what it names. */
export interface CiFailure {
  readonly reason: CiFailureReason;
  readonly params: Readonly<Record<string, string>>;
}

/** A stored failure, read back: null when it is not one; an unknown reason is `unknown`. */
export function parseCiFailure(value: unknown): CiFailure | null {
  let parsed: unknown = value;
  if (typeof value === 'string')
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  if (typeof parsed !== 'object' || parsed === null) return null;
  const { reason, params } = parsed as Record<string, unknown>;
  if (typeof reason !== 'string') return null;
  const known = (CI_FAILURE_REASONS as readonly string[]).includes(reason)
    ? (reason as CiFailureReason)
    : 'unknown';
  const strings: Record<string, string> = {};
  if (typeof params === 'object' && params !== null)
    for (const [key, item] of Object.entries(params))
      if (typeof item === 'string') strings[key] = item;
  return { reason: known, params: strings };
}

/** `GET /api/repositoryDeployments/{resourceId}/ci/connection`. */
export interface CiConnectionView extends CiSetupView {
  readonly connection: CiConnectionState;
  /** The agent's issue of the last run, until it is finished. */
  readonly task: {
    readonly issueId: string;
    readonly identifier: string | null;
  } | null;
  /** Whether CI reported any build. */
  readonly reported: boolean;
  /** Whether the repository is reached through a Git connection, which Studio's ways need. */
  readonly connected: boolean;
  /** The Apps CI reported, in every environment, the most recently built first. */
  readonly apps: readonly CiReportedApp[];
  /** The environments `apps` run in, in release management's order; one no longer there is named by its ID. */
  readonly environments: readonly CiEnvironment[];
}

/** Largest edited workflow file, in characters. */
export const CI_WORKFLOW_MAX = 100_000;

/** A relative directory inside the repository: `.`, or segments without `..`, a leading `/` or a backslash. */
export function isRelativeDirectory(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '.' || trimmed === './') return true;
  if (!trimmed || trimmed.length > 255) return false;
  if (trimmed.startsWith('/') || trimmed.includes('\\')) return false;
  if (/^[A-Za-z]:/u.test(trimmed)) return false;
  const segments = trimmed
    .replace(/^\.\//u, '')
    .replace(/\/+$/u, '')
    .split('/');
  return segments.every(
    (segment) =>
      segment !== '' &&
      segment !== '..' &&
      segment !== '.' &&
      /^[A-Za-z0-9._@-]+$/u.test(segment),
  );
}

/** `.` for the root, else the segments without a leading `./` or trailing `/`. */
export function normalizeDirectory(value: string): string {
  const trimmed = value.trim().replace(/^\.\//u, '').replace(/\/+$/u, '');
  return trimmed === '' || trimmed === '.' ? '.' : trimmed;
}

/** An App ID: lowercase letters, digits, `-` and `_`, starting with a letter or digit. */
export const CI_APP_ID = /^[a-z0-9][a-z0-9_-]{0,62}$/u;

/** An environment's ID, as release management takes it. */
export const CI_ENVIRONMENT_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/u;

/** A branch name: no spaces, `..`, `~^:?*[\` or leading `-`/`/`; at most 255 characters. */
export function isBranchName(value: string): boolean {
  const ref = value.trim();
  return (
    ref.length > 0 &&
    ref.length <= 255 &&
    /^[A-Za-z0-9._/-]+$/u.test(ref) &&
    !ref.startsWith('-') &&
    !ref.startsWith('/') &&
    !ref.endsWith('/') &&
    !ref.endsWith('.') &&
    !ref.includes('..') &&
    !ref.includes('//')
  );
}

/** A tag pattern as GitHub's `on.push.tags` takes it: a glob without spaces or quotes; at most 255 characters. */
export function isTagPattern(value: string): boolean {
  const pattern = value.trim();
  return (
    pattern.length > 0 &&
    pattern.length <= 255 &&
    /^[A-Za-z0-9._/*?+!\-[\]]+$/u.test(pattern) &&
    !pattern.startsWith('-')
  );
}

/** The base an application's App IDs start from: its directory's last segment, or the repository's name at the root. */
export function defaultCiAppId(repoName: string, directory: string): string {
  const base =
    normalizeDirectory(directory) === '.'
      ? repoName
      : (normalizeDirectory(directory).split('/').pop() ?? repoName);
  return (
    base
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/gu, '-')
      .replace(/^[-_]+|[-_]+$/gu, '')
      .slice(0, 63) || 'app'
  );
}

/**
 * The App ID a target starts from: the base itself for pull requests (their Apps are `<base>-pr-<n>`), else
 * `<base>-<environment>`, which the person may replace with any App's ID.
 */
export function defaultCiTargetAppId(
  base: string,
  target: Pick<CiTarget, 'trigger' | 'environmentId'>,
): string {
  if (target.trigger === 'pullRequest') return base;
  const suffix = `-${target.environmentId}`;
  return base.endsWith(suffix) ? base : `${base}${suffix}`.slice(0, 63);
}

/** What a workflow file is named after: the application, the trigger and the environment it deploys to. */
export interface CiWorkflowTarget {
  readonly appId: string;
  readonly trigger: CiTrigger;
  readonly environmentId: string;
  /** The environment's name, which names the file when it holds letters or digits; its ID otherwise. */
  readonly environmentName?: string | null;
}

/** The target a Studio workflow file deploys (`ciWorkflowTargetOf`), as `ciWorkflowPathOf` compares it. */
export interface CiWorkflowOccupant {
  readonly appId: string;
  readonly trigger: CiTrigger;
  readonly environmentId: string;
}

/** Lowercase letters and digits joined by `-`. */
const slugOf = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

/** The application's base: the App ID without the environment a branch or tag target's default ID ends with. */
export function ciWorkflowBaseOf(
  target: Pick<CiWorkflowTarget, 'appId' | 'trigger' | 'environmentId'>,
): string {
  const appId = target.appId.trim();
  const suffix = `-${target.environmentId}`;
  const base =
    target.trigger !== 'pullRequest' &&
    appId.endsWith(suffix) &&
    appId.length > suffix.length
      ? appId.slice(0, -suffix.length)
      : appId;
  return slugOf(base) || 'app';
}

/** What the file is for: `preview` for pull requests, else the environment's name, else its ID. */
export function ciWorkflowPurposeOf(
  target: Pick<
    CiWorkflowTarget,
    'trigger' | 'environmentId' | 'environmentName'
  >,
): string {
  if (target.trigger === 'pullRequest') return 'preview';
  return (
    slugOf(target.environmentName ?? '') ||
    slugOf(target.environmentId) ||
    'deploy'
  );
}

/** What a name ends with when another target holds it: the trigger. */
export const CI_TRIGGER_SLUGS: Readonly<Record<CiTrigger, string>> = {
  pullRequest: 'pr',
  branch: 'branch',
  tag: 'tag',
};

const sameTarget = (
  occupant: CiWorkflowOccupant,
  target: CiWorkflowTarget,
): boolean =>
  occupant.trigger === target.trigger &&
  occupant.environmentId === target.environmentId &&
  occupant.appId === target.appId.trim();

/**
 * Where the workflow of an application and a target goes: `.github/workflows/nb-studio-<base>-<purpose>.yml`, the base
 * being the App ID without its environment suffix (`ciWorkflowBaseOf`) and the purpose `preview` for pull requests,
 * else the environment's name (`ciWorkflowPurposeOf`), a segment repeated where they meet written once:
 * `nb-studio-crm-preview.yml`, `nb-studio-crm-staging.yml`, `nb-studio-crm-admin-preview.yml`. `occupant` is the target of the
 * Studio file already at that path: when it is another target, the name ends with this one's trigger
 * (`nb-studio-crm-production-tag.yml`), or with its environment's ID when the trigger is the same.
 */
export function ciWorkflowPathOf(
  target: CiWorkflowTarget,
  occupant?: CiWorkflowOccupant | null,
): string {
  const segments = [
    ...ciWorkflowBaseOf(target).split('-'),
    ...ciWorkflowPurposeOf(target).split('-'),
  ];
  const name = segments
    .filter((segment, index) => segment && segment !== segments[index - 1])
    .join('-')
    .slice(0, 60)
    .replace(/-+$/u, '');
  // Appended as it is, never merged into the name, so it always tells the two apart.
  const suffix =
    !occupant || sameTarget(occupant, target)
      ? null
      : occupant.trigger !== target.trigger
        ? CI_TRIGGER_SLUGS[target.trigger]
        : occupant.environmentId !== target.environmentId
          ? slugOf(target.environmentId) || 'deploy'
          : slugOf(target.appId) || 'app';
  return `.github/workflows/nb-studio-${suffix ? `${name}-${suffix.slice(0, 30)}` : name}.yml`;
}

/** The target of a workflow file Studio generated, read from its `on:` and its job's env; null for any other file. */
export function ciWorkflowTargetOf(content: string): CiWorkflowOccupant | null {
  const appId = /^\s+APP_ID: '([^'$]+?)(?:-pr-\$\{\{[^']*)?'$/mu.exec(
    content,
  )?.[1];
  const environmentId = /^\s+ENVIRONMENT: '([^']+)'$/mu.exec(content)?.[1];
  const on = /^on:\n((?: {2}.*\n)+)/mu.exec(content)?.[1] ?? '';
  const trigger: CiTrigger | null = /^ {2}pull_request:/mu.test(on)
    ? 'pullRequest'
    : /^ {4}tags:/mu.test(on)
      ? 'tag'
      : /^ {4}branches:/mu.test(on)
        ? 'branch'
        : null;
  return appId && environmentId && trigger
    ? { appId, trigger, environmentId }
    : null;
}

/** The repository secret the workflows read the API key from. */
export const CI_SECRET_NAME = 'NB_STUDIO_API_KEY';

/** What looks wrong in an edited workflow file without refusing it: it reads no secret, or runs no nb-studio command. */
export interface CiWorkflowProblem {
  readonly path: string;
  readonly problem: 'secret' | 'studio';
}

export function ciWorkflowProblems(
  files: readonly CiWorkflowFile[],
  secretName: string = CI_SECRET_NAME,
): CiWorkflowProblem[] {
  return files.flatMap((file) => [
    ...(file.content.includes(secretName)
      ? []
      : [{ path: file.path, problem: 'secret' as const }]),
    ...(/\bnb-studio\b/u.test(file.content)
      ? []
      : [{ path: file.path, problem: 'studio' as const }]),
  ]);
}
