/**
 * New projects and their initialization (`shared/project-init.ts`).
 *
 * - **A new project** (`newProject`), everything checked before anything is made: the project's name and workflow; for
 *   a new repository its connection, its template repository and chosen workflow (which must be one of the
 *   template's), or its optional prompt; for an existing repository or a directory on a runner, its optional prompt;
 *   and the init agent whenever a prompt initializes or a NocoBase application is scaffolded. Then, in this order: the
 *   repository on the host (generated from the template, created empty for a prompt or a NocoBase application, or with
 *   an initial commit when the prompt is left empty), the project (its workflow; who works on its issues is left to the workflow's status
 *   rules), its working directory (a repository is watched through the connection, so its webhooks reach Studio), the
 *   initialization record, and the "Initialize project" issue as the project's setup issue (`projectSetup`): every
 *   later issue of the project waits for it. An existing repository without a prompt, a directory without initialization, or nothing: no
 *   initialization, the project is ready.
 * - **A NocoBase application** (`nocobase-app.ts`) is an agent's initialization of an empty repository whose init issue
 *   gives fixed steps instead of a prompt: `create-app` with the chosen template on the agent's runner, the generated
 *   tree copied into the checkout, the first commit pushed. Its preview CI is connected with it (`direct`, pull
 *   requests to Preview, unless the request chose otherwise), so the workflow is committed when it finishes, before the
 *   branch is protected. While no runner can run the agent, its view says it waits for one (`waitingForRunner`).
 *   A local directory can use the same NocoBase 3 template in app/, without Git or CI; its template is retained for
 *   subsequent issue context just like a repository’s.
 * - **Following it**: Studio's git tells every push and workflow run a webhook delivers (`RepoEvents`), and the agents
 *   plugin every run that changed. A run of the chosen workflow on the repository moves the record: completed with
 *   success finishes it, any other conclusion fails it (with the run's page, also commented on the issue), a new
 *   attempt starts it again. For an agent's initialization, the init issue's run completing is needed and, in a new
 *   empty repository (`firstCommit`), a push creating the default branch too, in either order. Every change is conditional on the state read, so a delivery
 *   twice, or a delivery and a reconciliation, move it once. Should a delivery be lost, `reconcileRunning` (on the
 *   provider's timer) asks the host for the workflow's newest run, at most every `CHECK_SECONDS`.
 * - **Finishing**: the record is `done`, a new repository's CI workflow is committed to its default branch when Studio
 *   was asked to set its CI up (`../builds/ci-setup.ts`), the branch is then protected (whether the host allowed it is
 *   kept), and the
 *   init issue moves to its workflow's done status as the person who created the project (a move their workflow
 *   refuses is recorded as the error; the project is ready all the same).
 * - **A working directory added later** (`createCodeLocation`), by whoever manages the project: checked the same way
 *   (without "none"), then made the same way, its initialization an issue of its own that other issues do not wait for,
 *   given its agent once recorded.
 * - **Deploy & previews**: a repository's choices are checked with everything else (`RepositoryLinks.checkPlan`) and
 *   applied once the working directory exists (`RepositoryLinks.save`), which creates the Apps they need and records
 *   the CI choice.
 * - **Retry**: a failed workflow run is run again through the host (`retry`), by whoever manages the project.
 *
 * Nothing here calls the host inside a transaction.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import { ISSUE_TITLE_MAX } from '@nocobase/app-plugin-projects/shared/issues';
import { isAbsoluteDirectory } from '@nocobase/app-plugin-projects/shared/projects';
import type { DatabaseManager, Row } from '@nocobase/db';

import {
  CODE_LOCATIONS,
  INIT_ISSUE_TITLE,
  NOCOBASE_APP_TEMPLATES,
  type CodeLocation,
  type CodeLocationRequest,
  type CodeLocationResult,
  type InitWorkflow,
  type NewProjectResult,
  type NocobaseAppTemplate,
  type ProjectInitView,
} from '../../shared/project-init.js';
import type { DeploySettings } from '../../shared/releases.js';
import { conflict, forbidden, invalid, notFound } from '../access/errors.js';
import { ISSUE_SUBJECT } from '../agents/catalog/triggers.js';
import { AGENT_KIND } from '../agents/tx.js';
import type { GitConnections } from '../git/connections.js';
import type { RepoEvent } from '../git/events.js';
import type { WorkflowRun } from '../git/platform.js';
import type { StudioGit } from '../git/service.js';
import { categoriesOf, systemViewer } from '../previews/sources.js';
import type { CiSetup } from '../builds/ci-setup.js';
import type { RepositoryLinks } from '../releases/links.js';
import {
  nocobaseAppBrief,
  nocobaseAppName,
  nocobaseDirectoryBrief,
} from './nocobase-app.js';
import {
  decodeInit,
  initOfIssue,
  initOfProject,
  initsOfProject,
  initView,
  INITS,
  moveInit,
  openInitsOfRepo,
  runningInits,
  type InitRecord,
} from './store.js';

/** How often a running initialization asks the host for its workflow's newest run. */
export const CHECK_SECONDS = 30;

const NAME_MAX = 100;
const LABEL_MAX = 200;
const PROMPT_MAX = 100_000;
const REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/u;
const REPO_FULL_NAME = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/u;
const NO_COMMIT = /^0+$/u;

export interface ProjectInitsDeps {
  readonly database: Pick<DatabaseManager, 'connection'>;
  readonly projects: () => Pick<
    Projects,
    'projects' | 'issues' | 'issueQueries' | 'comments'
  >;
  /** The agents, and whether one could start work now (`availability`: an online runner may run it). */
  readonly agents: () =>
    | (Pick<Agents, 'agents'> & Partial<Pick<Agents, 'availability'>>)
    | undefined;
  /** The workspace's connections to code hosts; none without Studio's git. */
  readonly connections: () => GitConnections | undefined;
  readonly git: () => Pick<StudioGit, 'repoOfResource'> | undefined;
  /** The Apps repositories build ("Deploy & previews"); none without release management. */
  readonly links?: () =>
    Pick<RepositoryLinks, 'checkPlan' | 'save'> | undefined;
  /**
   * The CI setup, which commits the workflow of a repository Studio created before its branch is protected, and
   * connects a new repository's preview CI as chosen.
   */
  readonly ci?: () =>
    | (Pick<CiSetup, 'commitInitial'> &
        Partial<Pick<CiSetup, 'check' | 'configure'>>)
    | undefined;
  /** A person as the projects plugin sees them (who created the project, when the init finishes later). */
  readonly viewerOf: (userId: string) => Promise<Viewer>;
  readonly newId: () => string;
  readonly now?: () => Date;
  readonly onError?: (message: string, error: unknown) => void;
}

export interface ProjectInits {
  newProject(viewer: Viewer, request: unknown): Promise<NewProjectResult>;
  /** A working directory added to a project (`AddCodeLocationRequest`), by whoever manages it. */
  createCodeLocation(
    viewer: Viewer,
    projectId: string,
    request: unknown,
  ): Promise<CodeLocationResult>;
  /** The project's initialization, for whoever sees the project; null when it has none. */
  view(viewer: Viewer, projectId: string): Promise<ProjectInitView | null>;
  /** Runs the failed workflow run again; for whoever manages the project. */
  retry(viewer: Viewer, projectId: string): Promise<ProjectInitView>;
  /** A push or a workflow run a webhook delivered. */
  repoEvent(event: RepoEvent): Promise<void>;
  /** A run of the agents plugin changed. */
  runChanged(runId: string, status: string): Promise<void>;
  /**
   * Asks the host for the newest workflow run of every running initialization not asked within `CHECK_SECONDS`, in
   * case a delivery was lost. The provider runs it on a timer, so reading an initialization changes nothing.
   */
  reconcileRunning(): Promise<void>;
  /** Waits for the work events started (tests, shutdown). */
  settled(): Promise<void>;
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw invalid('INVALID_REQUEST', 'The request is an object.');
  return value as Record<string, unknown>;
}

function textOf(value: unknown, what: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw invalid(
      'INVALID_REQUEST',
      `${what} is required, at most ${max} characters.`,
    );
  return value.trim();
}

/** The chosen workflow as the host names it in the generated repository: its file name. */
const workflowFile = (found: InitRecord): string =>
  (found.workflowPath ?? '').split('/').pop() || (found.workflowId ?? '');

const optionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

/** An optional initialization prompt: null when empty. */
function optionalPrompt(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || value.length > PROMPT_MAX)
    throw invalid(
      'INVALID_REQUEST',
      `The prompt is at most ${PROMPT_MAX} characters.`,
    );
  return optionalText(value);
}

/** A new repository, as checked: where it is created and how it gets its first code. */
interface RepoPlan {
  readonly connectionId: string;
  readonly owner: string | null;
  readonly repoName: string;
  readonly private: boolean;
  readonly init:
    | {
        readonly method: 'template';
        readonly templateRepo: string;
        readonly workflow: InitWorkflow | null;
      }
    | { readonly method: 'prompt' }
    /** A NocoBase application the init agent scaffolds with `create-app` (`nocobase-app.ts`). */
    | {
        readonly method: 'nocobase';
        readonly template: NocobaseAppTemplate;
        readonly appName: string;
      }
    /** No prompt: the host's initial commit, and nothing to initialize. */
    | { readonly method: 'initialCommit' };
}

/** An existing repository, picked through a connection (`binding`) or given by its clone URL. */
interface ExistingRepo {
  readonly binding: {
    readonly connectionId: string;
    readonly repoId: string;
    readonly fullName: string;
  } | null;
  readonly cloneUrl: string;
  readonly defaultBranch: string;
}

/** A repository the host created. */
interface CreatedRepo {
  readonly id: string;
  readonly fullName: string;
  readonly cloneUrl: string;
  readonly webUrl: string;
  readonly defaultBranch: string;
}

/** A working directory as checked, before anything is made. */
interface CheckedLocation {
  readonly location: CodeLocation;
  readonly plan: RepoPlan | null;
  /** What the init issue's agent is asked to do; null when no prompt initializes. */
  readonly prompt: string | null;
  readonly initAgentId: string | null;
  readonly existing: ExistingRepo | null;
  readonly directory: {
    readonly runnerId: string;
    readonly path: string;
    readonly appTemplate: NocobaseAppTemplate | null;
  } | null;
  readonly label: string | null;
  readonly deploy: DeploySettings | null;
  /** The preview CI choice, checked; null when none was made. */
  readonly ci: unknown;
}

/** What the init issue initializes, for its description. */
type InitTarget =
  | {
      readonly kind: 'template';
      readonly repo: string;
      readonly templateRepo: string;
      readonly workflow: InitWorkflow | null;
    }
  | {
      readonly kind: 'firstCommit';
      readonly repo: string;
      readonly branch: string;
    }
  | {
      readonly kind: 'nocobase';
      readonly repo: string;
      readonly branch: string;
      readonly template: NocobaseAppTemplate;
      readonly appName: string;
    }
  | {
      readonly kind: 'nocobaseDirectory';
      readonly path: string;
      readonly template: NocobaseAppTemplate;
    }
  | { readonly kind: 'repo'; readonly repo: string }
  | { readonly kind: 'directory'; readonly path: string };

/** What the init issue says: the prompt, if any, then what the issue initializes and when it is done. */
function initDescription(prompt: string | null, target: InitTarget): string {
  if (target.kind === 'template')
    return target.workflow
      ? [
          `${target.repo} was generated from the template repository ${target.templateRepo}. Its workflow ${target.workflow.name} (\`${target.workflow.path}\`) initializes it on GitHub Actions; this issue is done once that workflow’s run succeeds.`,
          '',
          'If the run fails, its log is linked here, and someone who manages the project can run it again.',
        ].join('\n')
      : `${target.repo} was generated from the template repository ${target.templateRepo}, with no workflow to initialize it: the project is ready.`;
  if (target.kind === 'nocobaseDirectory')
    return nocobaseDirectoryBrief(target);
  if (target.kind === 'nocobase')
    return [
      nocobaseAppBrief({
        repo: target.repo,
        appName: target.appName,
        template: target.template,
        branch: target.branch,
      }),
      '',
      '---',
      '',
      `This issue initializes the empty repository ${target.repo}: this one issue may push the default branch \`${target.branch}\`, and needs no pull request. The project’s other issues wait for it; it is done once the push reaches ${target.repo} and the run ends successfully.`,
    ].join('\n');
  const about =
    target.kind === 'firstCommit'
      ? `This issue initializes the empty repository ${target.repo}. Make its first commit on the default branch \`${target.branch}\` and push it there: this one issue may push the default branch, and needs no pull request. The project’s other issues wait for it; it is done once the push reaches ${target.repo} and the run ends successfully.`
      : `This issue initializes the project’s working directory, ${target.kind === 'repo' ? `the repository ${target.repo}` : `\`${target.path}\` on its runner`}. The project’s other issues wait for it; it is done once the run ends successfully.`;
  return [prompt ?? '', '', '---', '', about].join('\n');
}

export function createProjectInits(deps: ProjectInitsDeps): ProjectInits {
  const now = deps.now ?? (() => new Date());
  const conn = () => deps.database.connection();
  const onError =
    deps.onError ??
    ((message: string, error: unknown) => console.error(message, error));
  const pending = new Set<Promise<unknown>>();

  /** Runs `work` after the caller, reporting its failure; `settled` waits for it. */
  function track(work: Promise<unknown>, message: string): void {
    const tracked = work.catch((error: unknown) => onError(message, error));
    pending.add(tracked);
    void tracked.finally(() => pending.delete(tracked));
  }

  function requireConnections(): GitConnections {
    const connections = deps.connections();
    if (!connections)
      throw invalid(
        'GIT_UNAVAILABLE',
        'No code host is connected to this workspace.',
      );
    return connections;
  }

  async function reread(id: string): Promise<InitRecord | null> {
    const row = await conn()
      .query.selectFrom(INITS)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst<Row>();
    return row ? decodeInit(row) : null;
  }

  async function comment(found: InitRecord, content: string): Promise<void> {
    if (!found.issueId) return;
    await deps
      .projects()
      .comments.create(systemViewer(), found.issueId, { content })
      .catch((error: unknown) =>
        onError('Could not comment on the init issue.', error),
      );
  }

  /** Moves the init issue to its workflow's done status, as the person who created the project. */
  async function closeIssue(found: InitRecord): Promise<string | null> {
    if (!found.issueId) return null;
    const projects = deps.projects();
    const viewer = found.createdBy
      ? await deps.viewerOf(found.createdBy).catch(() => systemViewer())
      : systemViewer();
    try {
      const issue = await projects.issueQueries.detail(viewer, found.issueId);
      const categories = await categoriesOf(projects, issue.projectId);
      if (categories.get(issue.statusKey) === 'done') return null;
      const done = categories.has('done')
        ? 'done'
        : [...categories].find(([, category]) => category === 'done')?.[0];
      if (!done) return 'The project’s workflow has no done status.';
      await projects.issues.update(viewer, issue.id, {
        revision: issue.revision,
        statusKey: done,
      });
      return null;
    } catch (error) {
      return `Initialized, but the init issue could not be moved to done: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /** Finishes the initialization once: done, the default branch protected, the init issue done. */
  async function finish(found: InitRecord): Promise<void> {
    const at = now();
    if (
      !(await moveInit(
        conn(),
        found.id,
        ['pending', 'running', 'failed'],
        { state: 'done', completedAt: at, error: null },
        at,
      ))
    )
      return;
    // Only a repository Studio created has its default branch protected.
    let branchProtected: boolean | null = null;
    if (
      (found.method === 'template' || found.firstCommit) &&
      found.connectionId &&
      found.repo &&
      found.defaultBranch
    ) {
      // Its CI workflow first, straight to the default branch, while nothing yet asks for a pull request.
      if (found.resourceId) await deps.ci?.()?.commitInitial(found.resourceId);
      try {
        branchProtected =
          (await deps
            .connections()
            ?.protectBranch(
              found.connectionId,
              found.repo,
              found.defaultBranch,
            )) ?? false;
      } catch (error) {
        branchProtected = false;
        onError('Could not protect an initialized repository’s branch.', error);
      }
    }
    const error = await closeIssue(found);
    await conn()
      .query.updateTable(INITS)
      .set({ branchProtected, error, updatedAt: now() })
      .where('id', '=', found.id)
      .execute();
  }

  /**
   * A run of the chosen workflow. It was chosen among the template repository's, and a generated repository's
   * workflows get ids of their own: its path is what stays.
   */
  function workflowMatches(found: InitRecord, run: WorkflowRun): boolean {
    if (found.method !== 'template' || !found.workflowPath) return false;
    return (
      run.path === found.workflowPath || run.workflowId === found.workflowId
    );
  }

  /** What a run of the init workflow says, applied once. */
  async function applyRun(
    found: InitRecord,
    run: WorkflowRun,
    completed: boolean,
  ): Promise<void> {
    if (found.state === 'done') return;
    // An older delivery of the same run arriving late changes nothing.
    if (found.runId === run.id && (found.runAttempt ?? 0) > run.runAttempt)
      return;
    const fields = {
      runId: run.id,
      runName: run.name,
      runStatus: run.status,
      runConclusion: completed ? run.conclusion : null,
      runUrl: run.htmlUrl || null,
      runAttempt: run.runAttempt,
    };
    const at = now();
    if (completed && run.conclusion === 'success') {
      await moveInit(conn(), found.id, [found.state], fields, at);
      const current = await reread(found.id);
      if (current) await finish(current);
      return;
    }
    if (completed) {
      const error = `The workflow ${run.name ?? found.workflowName ?? ''} ended ${run.conclusion ?? 'without a conclusion'}.`;
      if (
        await moveInit(
          conn(),
          found.id,
          ['running', 'pending'],
          { ...fields, state: 'failed', error },
          at,
        )
      )
        await comment(
          found,
          `${error} See its log: ${run.htmlUrl}. Someone who manages the project can run it again from the project.`,
        );
      return;
    }
    await moveInit(
      conn(),
      found.id,
      ['running', 'failed'],
      { ...fields, state: 'running', error: null },
      at,
    );
  }

  /** Asks the host for the workflow's newest run, in case a delivery was lost. */
  async function reconcile(found: InitRecord): Promise<InitRecord> {
    if (
      found.state !== 'running' ||
      found.method !== 'template' ||
      !found.workflowId ||
      !found.connectionId ||
      !found.repo
    )
      return found;
    const at = now();
    if (
      found.checkedAt &&
      at.getTime() - new Date(found.checkedAt).getTime() < CHECK_SECONDS * 1000
    )
      return found;
    await conn()
      .query.updateTable(INITS)
      .set({ checkedAt: at })
      .where('id', '=', found.id)
      .execute();
    try {
      const run = await deps
        .connections()
        ?.latestWorkflowRun(
          found.connectionId,
          found.repo,
          workflowFile(found),
        );
      if (run)
        await applyRun(
          (await reread(found.id)) ?? found,
          run,
          run.status === 'completed',
        );
    } catch (error) {
      onError('Could not read an initialization workflow’s run.', error);
    }
    return (await reread(found.id)) ?? found;
  }

  /** An agent's initialization: done once its run succeeded and, for a first commit, the default branch was pushed. */
  async function settlePrompt(id: string): Promise<void> {
    const current = await reread(id);
    if (
      current?.state === 'pending' &&
      current.runSucceeded &&
      (current.pushed || !current.firstCommit)
    )
      await finish(current);
  }

  async function canManage(viewer: Viewer, projectId: string) {
    const access = await deps
      .projects()
      .projects.accessTo(viewer, { projectId });
    return access?.manage === true;
  }

  /**
   * Whether no runner can run the init agent now, while its run has not succeeded: the initialization waits for one.
   * Unknown (no agents plugin, the agent gone) counts as available, so nothing is claimed that is not known.
   */
  async function agentUnavailable(found: InitRecord): Promise<boolean> {
    if (
      found.method !== 'prompt' ||
      found.state !== 'pending' ||
      found.runSucceeded ||
      !found.agentId
    )
      return false;
    const agents = deps.agents();
    if (!agents?.availability) return false;
    try {
      const agent = await agents.agents.get(found.agentId);
      const availability = await agents.availability(conn(), [agent]);
      return availability.get(agent.id)?.online === false;
    } catch {
      return false;
    }
  }

  async function viewFor(
    viewer: Viewer,
    found: InitRecord,
  ): Promise<ProjectInitView> {
    return initView(found, {
      canRetry: await canManage(viewer, found.projectId),
      agentUnavailable: await agentUnavailable(found),
    });
  }

  /** The workflow chosen for a template, checked to be one of the template repository's. */
  async function checkedWorkflow(
    connections: GitConnections,
    connectionId: string,
    templateRepo: string,
    given: unknown,
  ): Promise<InitWorkflow | null> {
    if (given === null || given === undefined) return null;
    const wanted = record(given);
    const workflows = await connections.workflows(connectionId, templateRepo);
    const found = workflows.find(
      (item) =>
        (typeof wanted.id === 'string' && item.id === wanted.id) ||
        (typeof wanted.path === 'string' && item.path === wanted.path),
    );
    if (!found)
      throw invalid(
        'UNKNOWN_WORKFLOW',
        `${templateRepo} has no workflow ${String(wanted.path ?? wanted.id)}.`,
      );
    return { id: found.id, path: found.path, name: found.name };
  }

  /**
   * Everything about a working directory, checked before anything is made: where it is, how it is initialized, by
   * which agent, its label and its "Deploy & previews" choices.
   */
  async function checkLocation(
    viewer: Viewer,
    input: Record<string, unknown>,
    options: { readonly allowNone: boolean },
  ): Promise<CheckedLocation> {
    const request = input as unknown as CodeLocationRequest;
    const location = request.codeLocation;
    if (
      !(CODE_LOCATIONS as readonly string[]).includes(location) ||
      (location === 'none' && !options.allowNone)
    )
      throw invalid(
        'INVALID_REQUEST',
        `codeLocation is one of ${CODE_LOCATIONS.filter((item) => options.allowNone || item !== 'none').join(', ')}.`,
      );
    let plan: RepoPlan | null = null;
    // What the init issue's agent is asked to do; null when no prompt initializes the working directory.
    let prompt: string | null = null;
    // A NocoBase application's agent follows fixed steps rather than a prompt, and is required all the same.
    let scaffolds = false;
    if (location === 'newRepo') {
      const repo = request.newRepo ? record(request.newRepo) : null;
      if (
        !repo ||
        typeof repo.connectionId !== 'string' ||
        typeof repo.name !== 'string' ||
        !REPO_NAME.test(repo.name) ||
        typeof repo.private !== 'boolean'
      )
        throw invalid(
          'INVALID_REQUEST',
          'A new repository needs its connection, a name (letters, digits, dots, dashes or underscores) and its visibility.',
        );
      const connections = requireConnections();
      await connections.get(repo.connectionId);
      const init = repo.init ? record(repo.init) : null;
      const base = {
        connectionId: repo.connectionId,
        owner: optionalText(repo.owner),
        repoName: repo.name,
        private: repo.private,
      };
      if (init?.method === 'template') {
        const templateRepo =
          typeof init.templateRepo === 'string' ? init.templateRepo : '';
        await connections.templateRepo(repo.connectionId, templateRepo);
        plan = {
          ...base,
          init: {
            method: 'template',
            templateRepo,
            workflow: await checkedWorkflow(
              connections,
              repo.connectionId,
              templateRepo,
              init.workflow,
            ),
          },
        };
      } else if (init?.method === 'nocobase') {
        const template = init.template;
        if (
          typeof template !== 'string' ||
          !(NOCOBASE_APP_TEMPLATES as readonly string[]).includes(template)
        )
          throw invalid(
            'UNKNOWN_APP_TEMPLATE',
            `A NocoBase application starts from one of the templates ${NOCOBASE_APP_TEMPLATES.join(', ')}.`,
          );
        const appName = nocobaseAppName(repo.name);
        if (!appName)
          throw invalid(
            'INVALID_APP_NAME',
            'A NocoBase application is named after its repository, which must start with a letter or digit.',
          );
        scaffolds = true;
        plan = {
          ...base,
          init: {
            method: 'nocobase',
            template: template as NocobaseAppTemplate,
            appName,
          },
        };
      } else if (init?.method === 'prompt') {
        // Without a prompt, the repository only gets the host's initial commit.
        prompt = optionalPrompt(init.prompt);
        plan = {
          ...base,
          init: { method: prompt === null ? 'initialCommit' : 'prompt' },
        };
      } else
        throw invalid(
          'INVALID_REQUEST',
          'A new repository is initialized from a template repository, as a NocoBase application, or by an agent with an optional prompt.',
        );
    }
    let existing: ExistingRepo | null = null;
    if (location === 'existingRepo') {
      const given = request.existingRepo ? record(request.existingRepo) : null;
      const bound =
        given !== null &&
        [given.connectionId, given.repoId, given.fullName].some(
          (value) => value !== undefined && value !== null && value !== '',
        );
      if (
        !given ||
        [given.cloneUrl, given.defaultBranch].some(
          (value) => typeof value !== 'string' || !value.trim(),
        ) ||
        (bound &&
          ([given.connectionId, given.repoId, given.fullName].some(
            (value) => typeof value !== 'string' || !value,
          ) ||
            !REPO_FULL_NAME.test(String(given.fullName))))
      )
        throw invalid(
          'INVALID_REQUEST',
          'An existing repository needs its clone URL and default branch, and, when picked through a connection, the connection, its ID and name.',
        );
      if (bound) await requireConnections().get(String(given.connectionId));
      existing = {
        binding: bound
          ? {
              connectionId: String(given.connectionId),
              repoId: String(given.repoId),
              fullName: String(given.fullName),
            }
          : null,
        cloneUrl: String(given.cloneUrl).trim(),
        defaultBranch: String(given.defaultBranch).trim(),
      };
      prompt = optionalPrompt(given.initPrompt);
    }
    let directory: CheckedLocation['directory'] = null;
    if (location === 'runnerDirectory') {
      const given = request.runnerDirectory
        ? record(request.runnerDirectory)
        : null;
      if (
        !given ||
        typeof given.runnerId !== 'string' ||
        !given.runnerId ||
        typeof given.path !== 'string' ||
        !isAbsoluteDirectory(given.path)
      )
        throw invalid(
          'INVALID_REQUEST',
          'A directory on a runner needs its runner and an absolute path.',
        );
      prompt = optionalPrompt(given.initPrompt);
      let appTemplate: NocobaseAppTemplate | null = null;
      if (given.init !== undefined) {
        const init = record(given.init);
        if (
          init.method !== 'nocobase' ||
          typeof init.template !== 'string' ||
          !(NOCOBASE_APP_TEMPLATES as readonly string[]).includes(init.template)
        )
          throw invalid(
            'UNKNOWN_APP_TEMPLATE',
            'Choose a supported NocoBase 3 application template.',
          );
        if (prompt !== null)
          throw invalid(
            'INVALID_REQUEST',
            'Choose either a NocoBase 3 application template or an initialization prompt.',
          );
        appTemplate = init.template as NocobaseAppTemplate;
        scaffolds = true;
      }
      directory = { runnerId: given.runnerId, path: given.path, appTemplate };
    }
    const initAgentId =
      prompt === null && !scaffolds ? null : optionalText(input.initAgentId);
    if (prompt !== null || scaffolds) {
      if (!initAgentId)
        throw invalid(
          'AGENT_REQUIRED',
          'Choose the agent that initializes the project.',
        );
      const agents = deps.agents();
      const agent = agents
        ? await agents.agents.get(initAgentId).catch(() => null)
        : null;
      if (!agent || agent.archivedAt)
        throw invalid(
          'UNKNOWN_AGENT',
          'The agent does not exist or is archived.',
        );
    }
    const label = optionalText(input.label);
    if (label !== null && label.length > LABEL_MAX)
      throw invalid(
        'INVALID_REQUEST',
        `The label is at most ${LABEL_MAX} characters.`,
      );
    let deploy: DeploySettings | null = null;
    if (input.deploy !== undefined && input.deploy !== null) {
      if (location !== 'newRepo' && location !== 'existingRepo')
        throw invalid(
          'DEPLOY_NEEDS_REPOSITORY',
          'Only a repository is deployed and previewed.',
        );
      const links = deps.links?.();
      if (!links)
        throw invalid(
          'RELEASES_UNAVAILABLE',
          'Release management is not available.',
        );
      deploy = await links.checkPlan(viewer, input.deploy);
    }
    let ci: unknown = null;
    // A NocoBase application's preview CI is connected with it: the standard workflow of the application at the root,
    // named after the repository, deploying each pull request to Preview (`parseCiRun`'s defaults).
    const ciChoice: unknown =
      location === 'newRepo' &&
      scaffolds &&
      (input.ci === undefined || input.ci === null) &&
      deps.ci?.()?.check
        ? { method: 'direct' }
        : input.ci;
    if (ciChoice !== undefined && ciChoice !== null) {
      if (location !== 'newRepo' && location !== 'existingRepo')
        throw invalid(
          'CI_NEEDS_REPOSITORY',
          'Only a repository has CI to connect.',
        );
      const setup = deps.ci?.();
      if (!setup?.check)
        throw invalid('CI_SETUP_UNAVAILABLE', 'Studio cannot set CI up here.');
      const repoName =
        location === 'newRepo'
          ? (plan?.repoName ?? '')
          : (existing?.binding?.fullName.split('/').pop() ??
            existing?.cloneUrl
              .replace(/\/+$/u, '')
              .split(/[/:]/u)
              .pop()
              ?.replace(/\.git$/u, '') ??
            '');
      setup.check(
        ciChoice,
        repoName,
        location === 'newRepo' || Boolean(existing?.binding),
        location === 'existingRepo' ? existing?.defaultBranch : undefined,
      );
      ci = ciChoice;
    }
    return {
      ci,
      location,
      plan,
      prompt,
      initAgentId,
      existing,
      directory,
      label,
      deploy,
    };
  }

  /** The new repository on the host, the first thing made: a host that refuses leaves nothing behind. */
  async function makeRepo(
    checked: CheckedLocation,
    description: string,
  ): Promise<CreatedRepo | null> {
    const plan = checked.plan;
    if (!plan) return null;
    const connections = requireConnections();
    const base = {
      name: plan.repoName,
      private: plan.private,
      description,
      ...(plan.owner ? { owner: plan.owner } : {}),
    };
    const answer =
      plan.init.method === 'template'
        ? await connections.generateRepo(plan.connectionId, {
            ...base,
            template: plan.init.templateRepo,
          })
        : await connections.createRepo(plan.connectionId, {
            ...base,
            // An agent makes the first commit from the prompt or the NocoBase steps; without one, the host makes it.
            ...(plan.init.method === 'prompt' || plan.init.method === 'nocobase'
              ? { empty: true }
              : {}),
          });
    return answer.repo;
  }

  /**
   * The working directory in the project, its initialization and its "Deploy & previews" choices. The project's own
   * setup (`setup`) holds every later issue of the project; a working directory added later is initialized by an issue
   * of its own, given its agent once recorded.
   */
  async function attach(
    viewer: Viewer,
    projectId: string,
    checked: CheckedLocation,
    created: CreatedRepo | null,
    options: { readonly setup: boolean },
  ): Promise<CodeLocationResult> {
    const projects = deps.projects();
    const prompt = checked.prompt;
    const initAgentId = checked.initAgentId;
    const label = checked.label ? { label: checked.label } : {};
    let resourceId: string | null = null;
    let repo: CodeLocationResult['repo'] = null;
    const link = async (binding: {
      readonly connectionId: string | null;
      readonly repoId: string | null;
      readonly fullName: string | null;
      readonly cloneUrl: string;
      readonly defaultBranch: string;
    }) => {
      const resource = await projects.projects.addResource(viewer, projectId, {
        type: 'gitRepo',
        url: binding.cloneUrl,
        defaultRef: binding.defaultBranch,
        ...label,
        ...(binding.connectionId && binding.repoId && binding.fullName
          ? {
              binding: {
                provider: 'github',
                connectionId: binding.connectionId,
                repoId: binding.repoId,
                fullName: binding.fullName,
              },
            }
          : {}),
      });
      // Watched through the connection from now on: its webhooks name this repository.
      if (binding.connectionId)
        await deps.git()?.repoOfResource(conn(), resource);
      return resource.id;
    };
    // The repository the initialization follows, and what the init issue initializes.
    let target: InitTarget | null = null;
    let repoFields: {
      readonly connectionId: string | null;
      readonly repo: string | null;
      readonly repoUrl: string | null;
      readonly defaultBranch: string;
    } | null = null;
    const plan = checked.plan;
    const existing = checked.existing;
    const directory = checked.directory;
    if (plan && created) {
      resourceId = await link({
        connectionId: plan.connectionId,
        repoId: created.id,
        fullName: created.fullName,
        cloneUrl: created.cloneUrl,
        defaultBranch: created.defaultBranch,
      });
      repo = { fullName: created.fullName, url: created.webUrl };
      repoFields = {
        connectionId: plan.connectionId,
        repo: created.fullName,
        repoUrl: created.webUrl,
        defaultBranch: created.defaultBranch,
      };
      target =
        plan.init.method === 'template'
          ? {
              kind: 'template',
              repo: created.fullName,
              templateRepo: plan.init.templateRepo,
              workflow: plan.init.workflow,
            }
          : plan.init.method === 'nocobase'
            ? {
                kind: 'nocobase',
                repo: created.fullName,
                branch: created.defaultBranch,
                template: plan.init.template,
                appName: plan.init.appName,
              }
            : plan.init.method === 'prompt'
              ? {
                  kind: 'firstCommit',
                  repo: created.fullName,
                  branch: created.defaultBranch,
                }
              : null;
    } else if (existing) {
      const fullName = existing.binding?.fullName ?? null;
      resourceId = await link({
        connectionId: existing.binding?.connectionId ?? null,
        repoId: existing.binding?.repoId ?? null,
        fullName,
        cloneUrl: existing.cloneUrl,
        defaultBranch: existing.defaultBranch,
      });
      repo = fullName
        ? { fullName, url: `https://github.com/${fullName}` }
        : null;
      repoFields = {
        connectionId: existing.binding?.connectionId ?? null,
        repo: fullName,
        repoUrl: repo?.url ?? null,
        defaultBranch: existing.defaultBranch,
      };
      if (prompt !== null)
        target = { kind: 'repo', repo: fullName ?? existing.cloneUrl };
    } else if (directory) {
      resourceId = (
        await projects.projects.addResource(viewer, projectId, {
          type: 'directory',
          runnerId: directory.runnerId,
          path: directory.path,
          ...label,
        })
      ).id;
      if (directory.appTemplate)
        target = {
          kind: 'nocobaseDirectory',
          path: directory.path,
          template: directory.appTemplate,
        };
      else if (prompt !== null)
        target = { kind: 'directory', path: directory.path };
    }

    if (!target || !resourceId) {
      const deployed = await applyDeploy(viewer, resourceId, checked.deploy);
      await applyCi(viewer, resourceId, checked.ci);
      return {
        resourceId,
        repo,
        initIssueId: null,
        initIssueIdentifier: null,
        init: null,
        ...deployed,
      };
    }

    // The record before the issue, whose run may be claimed the moment it exists (`initialDir`).
    const id = deps.newId();
    const at = now();
    const workflow = target.kind === 'template' ? target.workflow : null;
    await conn()
      .query.insertInto(INITS)
      .values({
        id,
        projectId,
        resourceId,
        method: target.kind === 'template' ? 'template' : 'prompt',
        connectionId: repoFields?.connectionId ?? null,
        repo: repoFields?.repo ?? null,
        repoUrl: repoFields?.repoUrl ?? null,
        defaultBranch: repoFields?.defaultBranch ?? null,
        firstCommit:
          target.kind === 'firstCommit' || target.kind === 'nocobase',
        templateRepo: target.kind === 'template' ? target.templateRepo : null,
        appTemplate:
          target.kind === 'nocobase' || target.kind === 'nocobaseDirectory'
            ? target.template
            : null,
        workflowId: workflow?.id ?? null,
        workflowPath: workflow?.path ?? null,
        workflowName: workflow?.name ?? null,
        agentId: initAgentId,
        issueId: null,
        state: target.kind === 'template' ? 'running' : 'pending',
        runSucceeded: false,
        pushed: false,
        branchProtected: null,
        createdBy: viewer.userId,
        createdAt: at,
        updatedAt: at,
      })
      .execute();
    // Once the initialization is recorded: the CI of a repository Studio created waits for it (`commitInitial`).
    const deployed = await applyDeploy(viewer, resourceId, checked.deploy);
    const executor = initAgentId
      ? { executor: { type: AGENT_KIND, id: initAgentId } }
      : {};
    const issue = await projects.issues.create(viewer, {
      title: options.setup
        ? INIT_ISSUE_TITLE
        : `${INIT_ISSUE_TITLE}: ${repoFields?.repo ?? checked.label ?? directory?.path ?? existing?.cloneUrl ?? ''}`.slice(
            0,
            ISSUE_TITLE_MAX,
          ),
      description: initDescription(prompt, target),
      projectId,
      // The project's setup is claimable at once (`initialDirOf` knows it by the project's setup issue); a later
      // one gets its agent once recorded below.
      ...(options.setup ? { ...executor, projectSetup: true } : {}),
    });
    await conn()
      .query.updateTable(INITS)
      .set({ issueId: issue.id, updatedAt: now() })
      .where('id', '=', id)
      .execute();
    if (!options.setup && initAgentId)
      await projects.issues.update(viewer, issue.id, {
        revision: issue.revision,
        executor: { type: AGENT_KIND, id: initAgentId },
      });
    // After the init issue, which the agent's own issue (`agent`) then waits for in a new project, and before a
    // template without a workflow finishes, which commits the workflows Studio writes (`commitInitial`).
    await applyCi(viewer, resourceId, checked.ci);
    // A template without a workflow is ready as generated.
    if (target.kind === 'template' && !workflow) {
      const found = await reread(id);
      if (found) await finish(found);
    }
    const found = await reread(id);
    return {
      resourceId,
      repo,
      initIssueId: issue.id,
      initIssueIdentifier: issue.identifier,
      init: found
        ? initView(found, {
            canRetry: true,
            agentUnavailable: await agentUnavailable(found),
          })
        : null,
      ...deployed,
    };
  }

  /**
   * The "Deploy & previews" choices of the repository just added, checked beforehand (`checkLocation`). Should they
   * fail now, the working directory stays and the failure is answered: it is made, and the choices can be made again
   * in its settings.
   */
  async function applyDeploy(
    viewer: Viewer,
    resourceId: string | null,
    deploy: DeploySettings | null,
  ): Promise<Pick<CodeLocationResult, 'apps' | 'ci' | 'deployError'>> {
    const links = deps.links?.();
    if (!deploy || !resourceId || !links)
      return { apps: [], ci: null, deployError: null };
    try {
      const saved = await links.save(viewer, resourceId, {
        apps: [],
        plan: deploy,
      });
      return { apps: saved.apps, ci: saved.ci, deployError: null };
    } catch (error) {
      onError('Could not apply a repository’s deploy choices.', error);
      return {
        apps: [],
        ci: null,
        deployError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** The preview CI chosen with the repository, checked beforehand; a failure is recorded on the repository. */
  async function applyCi(
    viewer: Viewer,
    resourceId: string | null,
    choice: unknown,
  ): Promise<void> {
    const setup = deps.ci?.();
    if (choice === null || !resourceId || !setup?.configure) return;
    try {
      await setup.configure(viewer.userId, resourceId, choice, {
        recordRefusals: true,
      });
    } catch (error) {
      onError('Could not connect a repository’s CI.', error);
    }
  }

  return {
    async newProject(viewer, raw) {
      const input = record(raw);
      const name = textOf(input.name, 'The project’s name', NAME_MAX);
      const description = optionalText(input.description);
      if (viewer.permissions.scopes['pm.projects/create'] === 'none')
        throw forbidden('You may not create projects.');
      const checked = await checkLocation(viewer, input, { allowNone: true });

      // Everything is checked: the repository first, so a host that refuses leaves nothing behind.
      const created = await makeRepo(checked, `${name} (Studio)`);
      const project = await deps.projects().projects.create(viewer, {
        name,
        description,
        ...(typeof input.workflowId === 'string' && input.workflowId
          ? { workflowId: input.workflowId }
          : {}),
      });
      return {
        projectId: project.id,
        ...(await attach(viewer, project.id, checked, created, {
          setup: true,
        })),
      };
    },

    async createCodeLocation(viewer, projectId, raw) {
      const input = record(raw);
      // Throws 404 for a project the viewer may not see.
      const project = await deps.projects().projects.get(viewer, projectId);
      if (!(await canManage(viewer, projectId)))
        throw forbidden(
          'Only someone who manages the project adds a working directory to it.',
        );
      const checked = await checkLocation(viewer, input, { allowNone: false });
      const created = await makeRepo(checked, `${project.name} (Studio)`);
      return attach(viewer, projectId, checked, created, { setup: false });
    },

    async view(viewer, projectId) {
      // Throws 404 for a project the viewer may not see.
      await deps.projects().projects.get(viewer, projectId);
      const found = await initOfProject(conn(), projectId);
      return found ? viewFor(viewer, found) : null;
    },

    async retry(viewer, projectId) {
      await deps.projects().projects.get(viewer, projectId);
      if (!(await canManage(viewer, projectId)))
        throw forbidden(
          'Only someone who manages the project runs its initialization again.',
        );
      // The project's own, or a working directory's added later whose workflow failed.
      const all = await initsOfProject(conn(), projectId);
      const found =
        (all[0]?.state === 'failed' ? all[0] : undefined) ??
        all.find(
          (item) => item.state === 'failed' && item.method === 'template',
        ) ??
        all[0];
      if (!found)
        throw notFound(
          'The project’s initialization',
          'PROJECT_INIT_NOT_FOUND',
        );
      if (
        found.state !== 'failed' ||
        found.method !== 'template' ||
        !found.workflowId ||
        !found.connectionId ||
        !found.repo
      )
        throw conflict(
          'INIT_NOT_FAILED',
          'Only a failed initialization workflow runs again.',
        );
      const connections = requireConnections();
      const runId =
        found.runId ??
        (
          await connections.latestWorkflowRun(
            found.connectionId,
            found.repo,
            workflowFile(found),
          )
        )?.id;
      if (!runId)
        throw conflict(
          'INIT_NO_RUN',
          'The initialization workflow has not run yet.',
        );
      await connections.rerunWorkflowRun(found.connectionId, found.repo, runId);
      const at = now();
      await moveInit(
        conn(),
        found.id,
        ['failed'],
        {
          state: 'running',
          error: null,
          runId,
          runStatus: 'queued',
          runConclusion: null,
          checkedAt: at,
        },
        at,
      );
      return initView((await reread(found.id)) ?? found, { canRetry: true });
    },

    async repoEvent(event) {
      const open = await openInitsOfRepo(conn(), event.repo);
      for (const found of open) {
        if (event.type === 'workflowRun') {
          if (workflowMatches(found, event.run))
            await applyRun(found, event.run, event.action === 'completed');
          continue;
        }
        // The first commit of the default branch: a push that created it, from nothing.
        if (
          found.method === 'prompt' &&
          found.firstCommit &&
          event.branch === found.defaultBranch &&
          (event.created ||
            (event.before !== null && NO_COMMIT.test(event.before)))
        ) {
          await moveInit(
            conn(),
            found.id,
            ['pending'],
            { pushed: true },
            now(),
          );
          await settlePrompt(found.id);
        }
      }
    },

    runChanged(runId, status) {
      if (status !== 'completed' && status !== 'failed')
        return Promise.resolve();
      const work = (async () => {
        const run = await conn()
          .query.selectFrom('agRuns')
          .select(['subjectKind', 'subjectId', 'failureReason'])
          .where('id', '=', runId)
          .executeTakeFirst<Row>();
        if (run?.subjectKind !== ISSUE_SUBJECT) return;
        const found = await initOfIssue(conn(), String(run.subjectId));
        if (found?.method !== 'prompt' || found.state !== 'pending') return;
        if (status === 'completed') {
          await moveInit(
            conn(),
            found.id,
            ['pending'],
            { runSucceeded: true, error: null },
            now(),
          );
          await settlePrompt(found.id);
          return;
        }
        await moveInit(
          conn(),
          found.id,
          ['pending'],
          {
            error: `The agent’s run failed${typeof run.failureReason === 'string' ? ` (${run.failureReason})` : ''}.`,
          },
          now(),
        );
      })();
      track(work, 'Could not follow the run of a project’s initialization.');
      return work.catch(() => undefined);
    },

    async reconcileRunning() {
      for (const found of await runningInits(conn())) await reconcile(found);
    },

    async settled() {
      while (pending.size > 0) await Promise.all([...pending]);
    },
  };
}
