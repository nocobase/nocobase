/**
 * A new project and its initialization (`server/projects-init`), as the server and the browser exchange them.
 *
 * The New project form creates a project with its workflow and its working directory: a new repository on a code host,
 * an existing one, a directory on one runner, or none yet. Who works on the project's issues is left to its workflow's
 * status rules. A working directory may be initialized, shown as one "Initialize project" issue, the project's setup
 * issue, which every later issue of the project waits for (`blockedBy`):
 *
 * - `template` (a new repository only): Studio generates the repository from a template repository the connection
 *   reaches. When the person chose one of its workflows (`.github/workflows/nb-studio-init.yml` is preselected when the
 *   template has it), the initialization is that workflow's successful run on the new repository; it runs itself on the
 *   initial commit. A failed run can be run again (`POST …/init/retry`). With no workflow, the project is ready at once.
 * - `nocobase` (a new repository only) is recorded as `prompt` with its `appTemplate`: Studio creates the repository
 *   empty and the init issue's agent is given fixed steps instead of a person's prompt (`nocobaseAppBrief`): scaffold
 *   the application with `create-app` from that template on its runner, copy it into the repository and push the first
 *   commit. Studio connects the repository's preview CI with it (the standard workflow, pull requests to Preview), whose
 *   files are committed once the repository is initialized, before its default branch is protected.
 * - `prompt`: the init issue's agent is given the person's prompt. A new repository with a prompt is created empty:
 *   the agent makes the first commit on the default branch and pushes it, the one run allowed to push the default
 *   branch, and the initialization is done once that run succeeded and the push reached the host, in either order
 *   (`firstCommit`). A new repository whose prompt is left empty gets the host's initial commit and no
 *   initialization. For an existing repository or a directory on a runner the prompt is optional too, and the
 *   initialization is done once the agent's run succeeded.
 *
 * Once done, the issue moves to Done, and a new repository's default branch is protected (`branchProtected` says
 * whether the host allowed it).
 *
 * A working directory added to a project later (`POST /api/projects/:projectId/codeLocations`) is chosen the same way,
 * without "none", and may be initialized the same way by its own "Initialize" issue, which other issues do not wait
 * for. A repository, in either, may come with its "Deploy & previews" choices (`deploy`, `shared/releases.ts`): the
 * Apps they need are created and linked once the working directory exists. Nothing is made until everything is
 * checked, and a new repository is created only then, so a refused request leaves nothing behind.
 */

import type { CiRunRequest } from './ci-modes.js';
import type {
  DeploySettings,
  RepositoryCi,
  RepositoryLinkedApp,
} from './releases.js';

export const INIT_METHODS = ['template', 'prompt'] as const;
export type InitMethod = (typeof INIT_METHODS)[number];

/**
 * - `pending`: an agent's initialization not yet done (its run or its first push outstanding);
 * - `running`: the initialization workflow is running, or about to;
 * - `failed`: its latest run did not succeed (`error`, `run.url`), until it is run again;
 * - `done`: the project is ready.
 */
export const INIT_STATES = ['pending', 'running', 'failed', 'done'] as const;
export type InitState = (typeof INIT_STATES)[number];

/**
 * The templates of `create-app` a new repository may start from (`--template`); only the default one is offered for
 * now. A NocoBase application is not generated from a template repository: an agent scaffolds it on its runner.
 */
export const NOCOBASE_APP_TEMPLATES = ['default'] as const;
export type NocobaseAppTemplate = (typeof NOCOBASE_APP_TEMPLATES)[number];

/**
 * The public npm registry `create-app` and the NocoBase packages are published to. The init brief sets no registry of
 * its own, so pnpm uses the runner's configured one; only a runner that sets `NOCOBASE_REGISTRY` overrides it.
 */
export const NPM_REGISTRY = 'https://registry.npmjs.org';

/** A repository's workflow chosen to initialize the project. */
export interface InitWorkflow {
  readonly id: string;
  /** `.github/workflows/<file>`. */
  readonly path: string;
  readonly name: string;
}

/** Where a project's working directory is, as the form offers it. */
export const CODE_LOCATIONS = [
  'newRepo',
  'existingRepo',
  'runnerDirectory',
  'none',
] as const;
export type CodeLocation = (typeof CODE_LOCATIONS)[number];

/** Where a working directory is and what comes with it: a new project's, or one added to a project. */
export interface CodeLocationRequest {
  /** The agent of the "Initialize project" issue; required whenever a prompt initializes the working directory. */
  readonly initAgentId?: string | null;
  readonly codeLocation: CodeLocation;
  readonly newRepo?: {
    readonly connectionId: string;
    /** The connection's account by default. */
    readonly owner?: string;
    readonly name: string;
    readonly private: boolean;
    readonly init:
      | {
          readonly method: 'template';
          /** `owner/name` of a template repository the connection reaches. */
          readonly templateRepo: string;
          /** Null: no workflow initializes it, the project is ready at once. */
          readonly workflow: InitWorkflow | null;
        }
      | {
          readonly method: 'prompt';
          /**
           * What the agent is asked to make: the init issue's description. Empty: the repository gets the host's
           * initial commit, with no initialization.
           */
          readonly prompt: string;
        }
      | {
          /** A NocoBase application scaffolded by the init issue's agent with `create-app` (`initAgentId` required). */
          readonly method: 'nocobase';
          readonly template: NocobaseAppTemplate;
        };
  };
  /** Picked through a connection (its connection, ID and name), or given by its clone URL alone. */
  readonly existingRepo?: {
    readonly connectionId?: string | null;
    readonly repoId?: string | null;
    readonly fullName?: string | null;
    readonly cloneUrl: string;
    readonly defaultBranch: string;
    /** Optional: what the agent does first in it (read the code and add an AGENTS.md, say). */
    readonly initPrompt?: string | null;
  };
  readonly runnerDirectory?: {
    readonly runnerId: string;
    /** Absolute, on that runner. */
    readonly path: string;
    /** Optional: what the agent does first in it. */
    readonly initPrompt?: string | null;
  };
  /** The working directory's label. */
  readonly label?: string | null;
  /** A repository's "Deploy & previews" choices. */
  readonly deploy?: DeploySettings | null;
  /**
   * A "Configure CI" run carried out once the repository is added (`shared/ci-modes.ts`): a new repository's workflows
   * are committed once it is initialized, an existing one's proposed in a pull request; `agent` gets its issue.
   */
  readonly ci?: CiRunRequest | null;
}

/** `POST /api/projectSetups`. */
export interface NewProjectRequest extends CodeLocationRequest {
  readonly name: string;
  readonly description?: string | null;
  /** A workflow of the projects plugin (`GET /api/projects/workflows`); its default when absent. */
  readonly workflowId?: string | null;
}

/** `POST /api/projects/:projectId/codeLocations`: a working directory added to a project. */
export interface AddCodeLocationRequest extends CodeLocationRequest {
  readonly codeLocation: Exclude<CodeLocation, 'none'>;
}

/** A workflow's latest run, as the issue's checks show it. */
export interface InitRun {
  readonly id: string;
  readonly name: string | null;
  readonly status: string | null;
  /** `success`, `failure`, `cancelled`… once completed. */
  readonly conclusion: string | null;
  readonly url: string | null;
  readonly attempt: number;
}

/** `GET /api/projectSetups/:projectId`; the init issue's page knows it by `issueId`. */
export interface ProjectInitView {
  readonly projectId: string;
  readonly method: InitMethod;
  readonly state: InitState;
  /** The repository initialized; null for a directory on a runner. */
  readonly repo: {
    /** `owner/name`. */
    readonly fullName: string;
    readonly url: string;
    readonly defaultBranch: string;
  } | null;
  /** `prompt` in a new, empty repository: done once the first commit also reached the default branch. */
  readonly firstCommit: boolean;
  readonly templateRepo: string | null;
  /** The `create-app` template the agent scaffolds the application from; null unless a NocoBase application. */
  readonly appTemplate: NocobaseAppTemplate | null;
  readonly workflow: InitWorkflow | null;
  /** The workflow's latest run (`template` with a workflow), once Studio heard of one. */
  readonly run: InitRun | null;
  /** The agent that initializes (`prompt`). */
  readonly agentId: string | null;
  /** Its run has not succeeded yet and no runner can run the agent now: the initialization waits for one. */
  readonly waitingForRunner: boolean;
  readonly issueId: string | null;
  /** `prompt`: the agent's run succeeded / its first commit reached the default branch (`firstCommit`). */
  readonly runSucceeded: boolean;
  readonly pushed: boolean;
  readonly error: string | null;
  /** Null until done. */
  readonly branchProtected: boolean | null;
  readonly completedAt: string | null;
  /** The workflow's failed run may be run again, by someone who manages the project. */
  readonly canRetry: boolean;
}

/** What a working directory came with: `POST /api/projects/:projectId/codeLocations` answers it (201). */
export interface CodeLocationResult {
  /** The working directory, when the code lives somewhere. */
  readonly resourceId: string | null;
  readonly repo: { readonly fullName: string; readonly url: string } | null;
  /** The "Initialize project" issue, when the working directory is initialized. */
  readonly initIssueId: string | null;
  readonly initIssueIdentifier: string | null;
  readonly init: ProjectInitView | null;
  /** The Apps the repository builds, after its "Deploy & previews" choices. */
  readonly apps: readonly RepositoryLinkedApp[];
  /** The CI choice, when one was made. */
  readonly ci: RepositoryCi | null;
  /** Why the "Deploy & previews" choices could not be applied once the rest was made; null otherwise. */
  readonly deployError: string | null;
}

/** `POST /api/projectSetups` answers it (201). */
export interface NewProjectResult extends CodeLocationResult {
  readonly projectId: string;
}

/** The title of the init issue. */
export const INIT_ISSUE_TITLE = 'Initialize project';
