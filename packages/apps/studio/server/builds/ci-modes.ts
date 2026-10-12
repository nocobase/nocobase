/**
 * The "Configure CI" runs Studio carries out (`shared/ci-modes.ts`), the parts that need no database:
 *
 * - `standardCiWorkflow`: the workflow file of the run's application and target. It is the one place that asks
 *   `ci-workflow.ts` for it, so the generator's shape can change behind it;
 * - `parseCiRun`: a run as a request carries it, checked (a way Studio carries out; one application with a relative
 *   directory and an App ID; a target: pull requests, a branch or a tag pattern, and an environment ID; the edited
 *   file within `CI_WORKFLOW_MAX` that parses as YAML);
 * - `ciTaskBrief`: the description of the "Set up deployment" issue an agent is given (`agent`), which never holds a
 *   key.
 */
import { parseDocument } from 'yaml';

import {
  CI_APP_ID,
  CI_DEFAULT_TAG_PATTERN,
  CI_ENVIRONMENT_ID,
  CI_PREVIEW_ENVIRONMENT,
  CI_TRIGGERS,
  CI_WORKFLOW_MAX,
  STUDIO_CI_METHODS,
  defaultCiAppId,
  isBranchName,
  isRelativeDirectory,
  isTagPattern,
  normalizeDirectory,
  type CiApp,
  type CiTarget,
  type CiTrigger,
  type CiWorkflowFile,
  type CiWorkflowOccupant,
  type StudioCiMethod,
} from '../../shared/ci-modes.js';
import { ciAgentPrompt } from '../../shared/ci-prompt.js';
import { invalid } from '../access/errors.js';
import { ciWorkflowFile } from './ci-workflow.js';

/** The title of the issue an agent connects the CI in, when the installation's language has none. */
export const CI_TASK_TITLE = 'Set up deployment';

/** The issue's title for a repository, in English. */
export function ciTaskTitle(repo: string): string {
  return `${CI_TASK_TITLE}: ${repo}`;
}

const WORKFLOW_PATH = /^\.github\/workflows\/[A-Za-z0-9._-]{1,100}\.ya?ml$/u;

/** The application a repository holds when a run names none: at its root, named after it. */
export function defaultCiApp(repoName: string): CiApp {
  return { directory: '.', appId: defaultCiAppId(repoName, '.') };
}

/** The target a run deploys to when it names none: pull requests, in the Preview environment. */
export const DEFAULT_CI_TARGET: CiTarget = {
  trigger: 'pullRequest',
  ref: null,
  environmentId: CI_PREVIEW_ENVIRONMENT,
};

/**
 * The workflow of the run's application and target. The one place that asks `ci-workflow.ts` for it, so its shape can
 * change behind it. `managed`: Studio keeps the key (its header says so), otherwise the header says how to add it by
 * hand.
 */
export function standardCiWorkflow(input: {
  readonly studioUrl: string;
  readonly defaultBranch: string;
  readonly app: CiApp;
  readonly target: CiTarget;
  /** The target environment's name, which names the file (`ciWorkflowPathOf`). */
  readonly environmentName?: string | null;
  /** The Studio file already at the file's path (`ciWorkflowPathOf`). */
  readonly occupant?: CiWorkflowOccupant | null;
  readonly managed?: boolean;
  readonly cli?: string;
}): CiWorkflowFile {
  return ciWorkflowFile({
    studioUrl: input.studioUrl,
    defaultBranch: input.defaultBranch,
    app: input.app,
    target: input.target,
    environmentName: input.environmentName ?? null,
    occupant: input.occupant ?? null,
    managed: input.managed ?? false,
    ...(input.cli ? { cli: input.cli } : {}),
  });
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A run's application, checked; one at the root, named after the repository, when it names none. */
export function parseCiApp(value: unknown, repoName: string): CiApp {
  if (value === undefined || value === null) return defaultCiApp(repoName);
  const app = isRecord(value) ? value : {};
  const directory = typeof app.directory === 'string' ? app.directory : '';
  if (!isRelativeDirectory(directory))
    throw invalid(
      'INVALID_CI_APP',
      'The directory must be relative to the repository, such as . or apps/shop.',
    );
  const appId = typeof app.appId === 'string' ? app.appId.trim() : '';
  if (!CI_APP_ID.test(appId))
    throw invalid(
      'INVALID_CI_APP',
      'The App ID uses lowercase letters, digits, - and _.',
    );
  return { directory: normalizeDirectory(directory), appId };
}

const isTrigger = (value: unknown): value is CiTrigger =>
  typeof value === 'string' &&
  (CI_TRIGGERS as readonly string[]).includes(value);

/** A run's target, checked; pull requests in the Preview environment when it names none. */
export function parseCiTarget(value: unknown, defaultBranch: string): CiTarget {
  if (value === undefined || value === null) return DEFAULT_CI_TARGET;
  const target = isRecord(value) ? value : {};
  if (!isTrigger(target.trigger))
    throw invalid(
      'INVALID_CI_TARGET',
      `The trigger is one of ${CI_TRIGGERS.join(', ')}.`,
    );
  const environmentId =
    typeof target.environmentId === 'string' ? target.environmentId.trim() : '';
  if (!CI_ENVIRONMENT_ID.test(environmentId))
    throw invalid('INVALID_CI_TARGET', 'Choose the environment to deploy to.');
  const given =
    typeof target.ref === 'string' && target.ref.trim()
      ? target.ref.trim()
      : null;
  if (target.trigger === 'pullRequest')
    return { trigger: 'pullRequest', ref: null, environmentId };
  if (target.trigger === 'branch') {
    const ref = given ?? defaultBranch;
    if (!isBranchName(ref))
      throw invalid('INVALID_CI_TARGET', `${ref} is not a branch name.`);
    return { trigger: 'branch', ref, environmentId };
  }
  const ref = given ?? CI_DEFAULT_TAG_PATTERN;
  if (!isTagPattern(ref))
    throw invalid(
      'INVALID_CI_TARGET',
      `${ref} is not a tag pattern, such as v* or release-*.`,
    );
  return { trigger: 'tag', ref, environmentId };
}

function fileOf(value: unknown): CiWorkflowFile {
  if (!Array.isArray(value) || value.length !== 1)
    throw invalid(
      'INVALID_CI_WORKFLOW',
      'The edited workflow is a list of one { path, content }.',
    );
  const file = isRecord(value[0]) ? value[0] : {};
  const path = typeof file.path === 'string' ? file.path.trim() : '';
  const content = typeof file.content === 'string' ? file.content : '';
  if (!WORKFLOW_PATH.test(path))
    throw invalid(
      'INVALID_CI_WORKFLOW',
      'A workflow file lives in .github/workflows/ and ends in .yml.',
    );
  if (!content.trim())
    throw invalid('INVALID_CI_WORKFLOW', `${path} is empty.`);
  if (content.length > CI_WORKFLOW_MAX)
    throw invalid(
      'INVALID_CI_WORKFLOW',
      `${path} is longer than ${CI_WORKFLOW_MAX} characters.`,
    );
  const document = parseDocument(content);
  if (document.errors.length > 0 || !isRecord(document.toJS()))
    throw invalid(
      'INVALID_CI_WORKFLOW',
      `${path} is not valid YAML: ${document.errors[0]?.message ?? 'it is not a mapping'}`.slice(
        0,
        500,
      ),
    );
  return { path, content };
}

/** A checked run: the application and target it connects, and what its way needs besides. */
export type CheckedCiRun = {
  readonly app: CiApp;
  readonly target: CiTarget;
} & (
  | { readonly method: 'direct' }
  | { readonly method: 'template'; readonly workflowFile: CiWorkflowFile }
  | { readonly method: 'agent'; readonly agentId: string }
);

const isStudioMethod = (value: unknown): value is StudioCiMethod =>
  typeof value === 'string' &&
  (STUDIO_CI_METHODS as readonly string[]).includes(value);

/** Checks a run; `repoName` names the application when it names none, `defaultBranch` the branch a target leaves out. */
export function parseCiRun(
  raw: unknown,
  repoName: string,
  defaultBranch = 'main',
): CheckedCiRun {
  const input = isRecord(raw) ? raw : {};
  if (!isStudioMethod(input.method))
    throw invalid(
      'INVALID_CI_METHOD',
      `Studio carries out ${STUDIO_CI_METHODS.join(', ')}; the other ways are done by hand and sent nowhere.`,
    );
  const app = parseCiApp(input.app, repoName);
  const target = parseCiTarget(input.target, defaultBranch);
  if (input.method === 'template')
    return {
      method: 'template',
      app,
      target,
      workflowFile: fileOf(input.workflowFiles),
    };
  if (input.method === 'direct') return { method: 'direct', app, target };
  const agentId =
    typeof input.agentId === 'string' && input.agentId.trim()
      ? input.agentId.trim()
      : null;
  if (!agentId)
    throw invalid('AGENT_REQUIRED', 'Choose the agent that sets the CI up.');
  return { method: 'agent', app, target, agentId };
}

/** The brief of the "Set up deployment" issue: the standard file, the commands and the secret Studio already wrote. */
export function ciTaskBrief(input: {
  readonly studioUrl: string;
  readonly repo: string;
  readonly defaultBranch: string;
  readonly app: CiApp;
  readonly target: CiTarget;
  readonly files: readonly CiWorkflowFile[];
  readonly secretName: string;
  readonly cli?: string;
}): string {
  return ciAgentPrompt({ ...input, audience: 'task' });
}
