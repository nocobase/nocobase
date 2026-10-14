/**
 * Pull request previews and deployment marks, as the server and the browser exchange them (`server/previews`,
 * `server/deploys`).
 *
 * A preview is an App whose source is a pull request, like a review app. Deployments do not know what they are for:
 * CI names the App (`<app>-pr-<number>` by convention), makes sure of it with `nb-studio app ensure --environment preview`
 * and deploys the pull request's head to it with `nb-studio deploy`. When the commit deployed is the head of an open pull
 * request of the repository and the App was made by `app ensure` and never deployed before, Studio records the pull
 * request as the App's source (`shared/builds.ts`): the App becomes the pull request's preview, started on demand, and
 * is deleted with its data when the pull request is merged or closed. An App that existed before is never one, nor
 * ever deleted. A preview runs while people visit it: after the environment's idle minutes without a visit it stops,
 * after its dormancy hours its unpacked files are removed too (record, configuration and data stay), and the next
 * visit starts or prepares it again. An issue shows the previews of the pull requests linked to it, so a pull request
 * linked to several issues shows the same preview on each. Its address is shown only in Studio; nothing is posted to
 * the pull request. A deployment follows a version: when a release reaches any other App of a repository, the issues
 * whose pushed commits it contains get a mark named after the App's environment ("Staging ✓ a1b2c3d", "Production ✓
 * 1.4.0"), and a rollback withdraws the marks of what it took back.
 *
 * - `GET /api/previews/status?issueId=` answers `IssuePreviews`; `POST /api/previews/down` `{ issueId, appId? }` destroys
 *   them (or one), `POST /api/previews/retry` `{ issueId, appId }` deploys a head's build again, `POST
 *   /api/previews/variables` (`PreviewVariablesInput`) saves what a blocked preview misses and deploys it, `GET
 *   /api/previews/logs?issueId=&appId=` reads a preview App's log. `appId` names the preview's own App, or the App it
 *   previews when that is unambiguous.
 * - `GET /api/previews?projectId=` answers `PreviewListItem[]` (`meta.total`), the previews the caller may see, of one project
 *   when `projectId` is given.
 * - `GET /api/deploys/marks?issueIds=a,b` answers `Record<issueId, DeployMark[]>`.
 * - `GET /api/deploys/projects/:projectId/unreleasedIssues` answers `UnreleasedIssues`, with whether the project's
 *   repositories deploy to production and preview at all.
 * - `GET /api/deploys/projects/:projectId/environments` answers `ProjectEnvironments`: what runs on each staging
 *   and production App of the project's repositories, at which commit, and who approved it.
 */
import type { BuildView } from './builds.js';

/**
 * Where a preview stands: `waiting` for its first build, `deploying` one, `ready` (a newer head may be on its way:
 * `sha` differs from `deployedSha`), `blocked` (its build needs variables nothing sets: `missingVariables`; it
 * deploys once they are saved), `failed`, or `destroyed` (the row stays so the issue page can say what happened).
 */
export const PREVIEW_STATUSES = [
  'waiting',
  'deploying',
  'ready',
  'blocked',
  'failed',
  'destroyed',
] as const;

export type PreviewStatus = (typeof PREVIEW_STATUSES)[number];

/** Statuses in which something is still on its way. */
export const PREVIEW_BUSY: readonly PreviewStatus[] = ['waiting', 'deploying'];

/** A variable a blocked preview's build requires and nothing sets. */
export interface PreviewMissingVariable {
  readonly name: string;
  readonly description: string | null;
  /** Entered masked, and never shown again. */
  readonly secret: boolean;
}

/** Where a value typed on the issue page goes: this preview's App only, or the Preview environment (every preview). */
export const PREVIEW_VARIABLE_SCOPES = ['preview', 'environment'] as const;

export type PreviewVariableScope = (typeof PREVIEW_VARIABLE_SCOPES)[number];

/** `POST /api/previews/variables`: values for a blocked preview, which then deploys. */
export interface PreviewVariablesInput {
  readonly issueId: string;
  /** The preview's own App. */
  readonly appId: string;
  readonly scope: PreviewVariableScope;
  readonly values: Readonly<Record<string, string>>;
}

/** The first administrator of a preview App: shown only to those who may edit the issue. */
export interface PreviewAdmin {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

/**
 * Where a ready preview's App stands: `running`, `starting` (a visit is starting it), `stopped` (the next visit starts
 * it), `dormant` (the next visit prepares it again, which takes longer); `failed` or `unknown` when the runtime says so.
 */
export type PreviewRuntimeState =
  | 'running'
  | 'starting'
  | 'stopped'
  | 'dormant'
  | 'pending'
  | 'failed'
  | 'unknown';

export interface PreviewRuntime {
  readonly state: PreviewRuntimeState;
  /** The last visit (or start) the runtime saw. */
  readonly lastAccessedAt: string | null;
}

export interface PreviewView {
  readonly id: string;
  /** The working directory whose pull request it previews. */
  readonly resourceId: string;
  /** The linked App previewed, and its name; null when the repository previews no App and is previewed itself. */
  readonly targetAppId: string | null;
  readonly targetAppName: string | null;
  /** The preview's own App and environment. */
  readonly appId: string;
  readonly environmentId: string;
  readonly status: PreviewStatus;
  /** Absolute, or a path on Studio's own origin (`/shop-pr-12/`); null until something is deployed. */
  readonly url: string | null;
  /** The pull request it belongs to; null only when Studio no longer knows it. */
  readonly pullRequest: {
    readonly repo: string;
    readonly number: number;
    readonly url: string;
    readonly title: string;
    readonly state: string;
  } | null;
  /** The head it should run, and the commit it runs. */
  readonly sha: string | null;
  readonly deployedSha: string | null;
  /** What CI reported for the head (`sha`), before and after its archive arrives. */
  readonly build: BuildView | null;
  readonly releaseId: string | null;
  readonly deploymentId: string | null;
  readonly error: string | null;
  /** For a `blocked` preview: the variables its build requires that nothing sets; empty otherwise. */
  readonly missingVariables: readonly PreviewMissingVariable[];
  /** The App's runtime, once deployed; null before or when release management cannot say. */
  readonly runtime: PreviewRuntime | null;
  /** Only for those who may edit the issue it is read through. */
  readonly admin: PreviewAdmin | null;
  readonly updatedAt: string;
  readonly createdAt: string;
}

/** Why an issue has no preview: its project has no repository on a git host, whose CI would deploy one. */
export type PreviewBlocker = 'noRepository';

export interface PreviewLabelStatus {
  readonly pullRequestId: string;
  readonly managed: boolean;
  readonly present: boolean | null;
  readonly failed: boolean;
}

export interface IssuePreviews {
  /** Older servers omit preferences during a rolling client/server upgrade. */
  readonly notRequired?: boolean;
  readonly labels?: readonly PreviewLabelStatus[];
  readonly issueId: string;
  readonly identifier: string;
  /** The previews of the pull requests linked to the issue. */
  readonly previews: readonly PreviewView[];
  /** Why there is none at all; null when previews can exist (CI deploys one for a linked pull request). */
  readonly blocker: PreviewBlocker | null;
  /** The viewer may destroy and retry them, and sees their administrators. */
  readonly canEdit: boolean;
  /** The viewer may also save a missing variable to the Preview environment, for every preview there. */
  readonly canSetEnvironmentVariables: boolean;
}

/** A live preview, with the first issue linked to its pull request that the caller sees. */
export interface PreviewListItem extends PreviewView {
  readonly issueId: string;
  readonly identifier: string;
  readonly title: string;
}

// ---------------------------------------------------------------------------------------------------------------
// Deployment marks
// ---------------------------------------------------------------------------------------------------------------

/**
 * What a deployment mark's environment is to releases: `production` for a release target (a protected environment,
 * or one named `production`), whose marks the "done, not released" reminder waits for; `staging` for any other.
 */
export type DeployMarkRole = 'staging' | 'production';

/** `checking`: the commit check is still running; `withdrawn`: a rollback took it back. */
export type DeployMarkStatus = 'checking' | 'deployed' | 'withdrawn';

export interface DeployMark {
  readonly role: DeployMarkRole;
  readonly status: DeployMarkStatus;
  readonly appId: string;
  readonly environmentId: string;
  /** What the mark is labelled with: the environment's name (its id when it is gone). */
  readonly environmentName: string;
  /** The issue's commit found in the deployment. */
  readonly sha: string;
  /** The deployed release's version. */
  readonly version: string | null;
  readonly deploymentId: string;
  /** The rollback that withdrew it, and the version it went back to. */
  readonly withdrawnByDeploymentId: string | null;
  readonly withdrawnVersion: string | null;
  readonly deployedAt: string;
}

export type DeployMarks = Readonly<Record<string, readonly DeployMark[]>>;

export interface UnreleasedIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly statusKey: string;
  readonly updatedAt: string;
  /** Staging marks it has, if any. */
  readonly staging: boolean;
}

export interface UnreleasedIssues {
  readonly projectId: string;
  /** Whether a repository of the project deploys to production at all; without one nothing is ever "unreleased". */
  readonly hasProduction: boolean;
  /** Whether a repository of the project previews its issues' pull requests. */
  readonly hasPreview: boolean;
  readonly items: readonly UnreleasedIssue[];
}

/** What runs on one of a project's long-lived Apps (its repositories' staging and production Apps). */
export interface EnvironmentRelease {
  readonly appId: string;
  readonly appName: string;
  readonly role: DeployMarkRole;
  readonly environmentId: string;
  readonly environmentName: string;
  /** What runs there now: the App's current deployment; null before its first. */
  readonly current: {
    readonly deploymentId: string;
    readonly releaseId: string;
    readonly version: string | null;
    /** The commit the release was built from (its `sha` label). */
    readonly sha: string | null;
    readonly deployedAt: string | null;
    /** Who started the deployment: a person, or the name of the API key or agent that did. */
    readonly deployedBy: string | null;
    /** Who approved the deployment request it came from; null when nobody had to. */
    readonly approvedBy: string | null;
    /** It is the staging release promoted, not an upload of its own. */
    readonly promoted: boolean;
  } | null;
  /** A deployment request waiting for its approvers, with the version it asks for. */
  readonly pending: {
    readonly requestId: string;
    readonly version: string | null;
  } | null;
}

/** `GET /api/deploys/projects/:projectId/environments`. */
export interface ProjectEnvironments {
  readonly projectId: string;
  readonly items: readonly EnvironmentRelease[];
}

/**
 * The release labels Studio reads and writes: the commit a release was built from, the branch or tag it was verified
 * on, the build it came from and the one it was promoted from; and on an App, the repository `app ensure` made it for,
 * and the working directory, pull request and linked App of a preview App.
 */
export const RELEASE_LABELS = {
  sha: 'sha',
  ref: 'ref',
  build: 'studioBuild',
  /** On a release promoted from another App's upload of the same archive: the build it was. */
  promotedBuild: 'promotedBuild',
  /** On an App `nb-studio app ensure` made: the working directory it was made for. */
  ensured: 'studioEnsured',
  repository: 'repository',
  pullRequest: 'pullRequest',
  pullRequestNumber: 'pr',
  app: 'previewOf',
  kind: 'studio',
} as const;

/** The `nb-studio` label of a preview App and of its releases. */
export const PREVIEW_LABEL = 'preview';
