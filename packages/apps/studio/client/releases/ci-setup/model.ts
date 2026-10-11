/**
 * What "Configure CI" and the status list are made from, without React (`shared/ci-modes.ts`): which ways are offered
 * and which is chosen first, the environment a trigger starts with, the App ID a target starts from, what is wrong with
 * a run, the files and prompt a person copies, and the reported Apps grouped by environment.
 */
import {
  CI_APP_ID,
  CI_PREVIEW_ENVIRONMENT,
  defaultCiAppId,
  defaultCiTargetAppId,
  isBranchName,
  isRelativeDirectory,
  isTagPattern,
  type CiApp,
  type CiConnectionView,
  type CiEnvironment,
  type CiMethod,
  type CiReportedApp,
  type CiTarget,
  type CiTrigger,
  type CiWorkflowFile,
} from '../../../shared/ci-modes.js';
import {
  ciAgentPrompt,
  type CiPromptWords,
} from '../../../shared/ci-prompt.js';

/** The ways in the two groups the choice shows them in. */
export const STUDIO_METHODS: readonly CiMethod[] = [
  'direct',
  'template',
  'agent',
];
export const SELF_METHODS: readonly CiMethod[] = ['manual', 'ownAgent'];

/** The way chosen first: Studio writes it when it can reach the repository, otherwise the person copies it. */
export function initialMethod(connected: boolean): CiMethod {
  return connected ? 'direct' : 'manual';
}

/** A way still possible, else the first one that is. */
export function availableMethod(
  method: CiMethod,
  connected: boolean,
): CiMethod {
  return STUDIO_METHODS.includes(method) && !connected
    ? initialMethod(connected)
    : method;
}

/** Whether the way shows or edits the workflow file, which is generated for it. */
export function methodNeedsFiles(method: CiMethod): boolean {
  return method === 'template' || method === 'manual' || method === 'ownAgent';
}

const named = (environment: CiEnvironment, word: string) =>
  environment.id.toLowerCase().includes(word) ||
  environment.name.toLowerCase().includes(word);

/**
 * The environment a trigger starts with: pull requests the Preview environment; a branch one named staging, else the
 * first unprotected one other than Preview; a tag one protected or named production, else the first other than
 * Preview. Null while there is none.
 */
export function defaultEnvironment(
  trigger: CiTrigger,
  environments: readonly CiEnvironment[],
): string | null {
  const others = environments.filter(
    (environment) => environment.id !== CI_PREVIEW_ENVIRONMENT,
  );
  const pick =
    trigger === 'pullRequest'
      ? (environments.find(
          (environment) => environment.id === CI_PREVIEW_ENVIRONMENT,
        ) ?? environments[0])
      : trigger === 'branch'
        ? (others.find((environment) => named(environment, 'staging')) ??
          others.find((environment) => !environment.protected) ??
          others[0] ??
          environments[0])
        : (others.find((environment) => environment.protected) ??
          others.find((environment) => named(environment, 'production')) ??
          others[0] ??
          environments[0]);
  return pick?.id ?? null;
}

/**
 * The App ID a target starts from, until someone edits it: the application's base (its directory's last segment, or
 * the repository's name at the root), as is for pull requests (`<base>-pr-<n>`), else `<base>-<environment>`.
 */
export function initialAppId(
  repoName: string | null,
  directory: string,
  target: Pick<CiTarget, 'trigger' | 'environmentId'>,
): string {
  const base = defaultCiAppId(
    repoName ?? 'app',
    isRelativeDirectory(directory) ? directory : '.',
  );
  return target.environmentId ? defaultCiTargetAppId(base, target) : base;
}

export type CiRunProblem = 'directory' | 'appId' | 'ref' | 'environment';

/** What is wrong with a run's application and target; empty when it may be sent. */
export function ciRunProblems(input: {
  readonly app: CiApp;
  readonly target: CiTarget;
}): CiRunProblem[] {
  const problems: CiRunProblem[] = [];
  if (!isRelativeDirectory(input.app.directory)) problems.push('directory');
  if (!CI_APP_ID.test(input.app.appId.trim())) problems.push('appId');
  const ref = input.target.ref?.trim() ?? '';
  if (
    (input.target.trigger === 'branch' && !isBranchName(ref)) ||
    (input.target.trigger === 'tag' && !isTagPattern(ref))
  )
    problems.push('ref');
  if (!input.target.environmentId) problems.push('environment');
  return problems;
}

/** An environment's Apps, as the status list shows them. */
export interface CiEnvironmentSection {
  readonly environment: CiEnvironment;
  readonly apps: readonly CiReportedApp[];
}

/** The reported Apps by the environment they run in, in release management's order; an environment with none is left out. */
export function environmentSections(
  view: Pick<CiConnectionView, 'apps' | 'environments'>,
): CiEnvironmentSection[] {
  const known = [...view.environments];
  for (const app of view.apps)
    if (!known.some((environment) => environment.id === app.environmentId))
      known.push({
        id: app.environmentId,
        name: app.environmentId,
        protected: false,
      });
  return known
    .map((environment) => ({
      environment,
      apps: view.apps.filter((app) => app.environmentId === environment.id),
    }))
    .filter((section) => section.apps.length > 0);
}

/** Where a row's variables are set: the App's, or for pull requests' Apps their environment's. */
export function variablesPath(app: CiReportedApp): string {
  return app.pullRequests
    ? `/environments/${encodeURIComponent(app.environmentId)}?tab=variables`
    : `/releases/${encodeURIComponent(app.appId)}?tab=variables`;
}

/** How a row is named: `<appId>-pr-*` for an application's pull request Apps, else the App's ID. */
export function ciRowName(app: CiReportedApp): string {
  return app.pullRequests ? `${app.appId}-pr-*` : app.appId;
}

/** A build is of a row named by `ciRowName`: any `<appId>-pr-<n>` for pull requests, else the App itself. */
export function buildOfRow(
  build: { readonly appId: string },
  row: string,
): boolean {
  return row.endsWith('-pr-*')
    ? build.appId.startsWith(row.slice(0, -1))
    : build.appId === row;
}

/** The prompt a person copies for their own coding agent (`ownAgent`). */
export function ownAgentPrompt(
  input: {
    readonly studioUrl: string;
    readonly repo: string;
    readonly defaultBranch: string;
    readonly app: CiApp;
    readonly target: CiTarget;
    readonly files: readonly CiWorkflowFile[];
    readonly secretName: string;
  },
  words: CiPromptWords,
): string {
  return ciAgentPrompt({ ...input, audience: 'own' }, words);
}
