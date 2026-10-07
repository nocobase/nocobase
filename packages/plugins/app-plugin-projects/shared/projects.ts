import type { Priority, UserRef } from './common.js';

export const PROJECT_VISIBILITIES = ['everyone', 'members'] as const;
/** `everyone`: every member sees it; `members`: only its members and whoever may see every project. */
export type ProjectVisibility = (typeof PROJECT_VISIBILITIES)[number];

export const PROJECT_STATUSES = [
  'planned',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  readonly id: string;
  readonly name: string;
  /** Markdown. */
  readonly description: string | null;
  readonly visibility: ProjectVisibility;
  readonly status: ProjectStatus;
  readonly priority: Priority;
  /** The one project lead, always also a member. */
  readonly leadUserId: string | null;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  /** The workflow of its issues; null for the default workflow. */
  readonly workflowId: string | null;
  /**
   * The issue that sets the project up (created with `projectSetup`): until it is finished, every issue created in the
   * project is created waiting for it (`blockedBy`). Null when there is none.
   */
  readonly setupIssueId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IssueCounts {
  readonly total: number;
  /** Issues in a status of the `done` category. */
  readonly done: number;
  readonly byStatus: Readonly<Record<string, number>>;
}

export interface ProjectListItem extends Project {
  readonly lead: UserRef | null;
  readonly memberCount: number;
  readonly issueCounts: IssueCounts;
}

/**
 * What a project's working directory is: a git repository, checked out for each piece of work, or a directory that
 * already exists on one machine that runs agents, used in place.
 */
export const PROJECT_RESOURCE_TYPES = ['gitRepo', 'directory'] as const;

export type ProjectResourceType = (typeof PROJECT_RESOURCE_TYPES)[number];

/**
 * Where a git repository is hosted, as the application that linked it records it: the host (`github`), the connection
 * it reaches the repository through, the host's id of the repository and its `owner/name`. This plugin stores it and
 * never interprets it.
 */
export interface ProjectResourceBinding {
  readonly provider: string;
  readonly connectionId: string;
  readonly repoId: string;
  readonly fullName: string;
}

/**
 * A working directory of the project. The project's directories are ordered (`position`); the first is the primary
 * one, where work starts.
 */
export interface ProjectResource {
  readonly id: string;
  readonly projectId: string;
  readonly type: ProjectResourceType;
  /** `gitRepo`: the remote. */
  readonly url: string | null;
  /** `gitRepo`: the base branch, tag or commit; null for the remote's default branch. */
  readonly defaultRef: string | null;
  /** `gitRepo`: the repository on its host, when it was linked through one; null for a remote given by URL alone. */
  readonly binding: ProjectResourceBinding | null;
  /**
   * `directory`: the machine that holds it, as the plugin that runs agents names its machines (its runner id); this
   * plugin stores it and never interprets it.
   */
  readonly runnerId: string | null;
  /** `directory`: its absolute path on that machine. */
  readonly path: string | null;
  readonly label: string | null;
  /**
   * What to do in the directory before working in it for the first time (`run pnpm install, then copy .env.example to
   * .env`): plain text given to whoever works there when the directory was just prepared for them; never run as a
   * script.
   */
  readonly initPrompt: string | null;
  readonly position: number;
}

export interface ProjectDetail extends ProjectListItem {
  readonly members: readonly UserRef[];
  readonly resources: readonly ProjectResource[];
}

export interface CreateProjectRequest {
  readonly name: string;
  readonly description?: string | null;
  readonly visibility?: ProjectVisibility;
  readonly status?: ProjectStatus;
  readonly priority?: Priority;
  /** Defaults to the creator. */
  readonly leadUserId?: string | null;
  readonly startDate?: string | null;
  readonly dueDate?: string | null;
  /** Null: the default workflow. Switching is refused while an issue is in a status the new workflow lacks. */
  readonly workflowId?: string | null;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;

export interface AddProjectMemberRequest {
  readonly userId: string;
}

export interface CreateProjectResourceRequest {
  readonly type: ProjectResourceType;
  /** Required for `gitRepo`. */
  readonly url?: string | null;
  readonly defaultRef?: string | null;
  /** `gitRepo` only. */
  readonly binding?: ProjectResourceBinding | null;
  /** Required for `directory`. */
  readonly runnerId?: string | null;
  /** Required for `directory`: absolute. */
  readonly path?: string | null;
  readonly label?: string | null;
  readonly initPrompt?: string | null;
}

/** The type does not change; fields of the other type are refused. */
export interface UpdateProjectResourceRequest {
  readonly url?: string;
  readonly defaultRef?: string | null;
  /** `gitRepo` only; null unlinks it from its host. */
  readonly binding?: ProjectResourceBinding | null;
  readonly runnerId?: string;
  readonly path?: string;
  readonly label?: string | null;
  readonly initPrompt?: string | null;
  readonly position?: number;
}

/** An absolute path: POSIX (`/srv/app`) or Windows (`C:\\work\\app`). */
export function isAbsoluteDirectory(value: string): boolean {
  const path = value.trim();
  return (
    (path.startsWith('/') || /^[A-Za-z]:[\\/]/u.test(path)) &&
    !path.split(/[\\/]/u).some((part) => part === '..') &&
    path.length <= 1024
  );
}

export const RESOURCE_INIT_PROMPT_MAX = 10_000;

export const PROJECT_NAME_MAX = 255;
