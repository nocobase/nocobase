/**
 * What an executor of another kind needs to know about an issue to work on it: the issue, its workflow and where the
 * kind may move it, its owner, project and repositories, parent and sub-issues, the current checklist, a status change
 * waiting for approval, and the newest comments. Plain data, read on the caller's connection (a claim's transaction,
 * say), with no permission of a person applied: the plugin that asks decides who may see it.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { Attachment } from '../../../shared/attachments.js';
import type { IssueComment } from '../../../shared/comments.js';
import type { StatusCategory } from '../../../shared/issues.js';
import type { ProjectResourceBinding } from '../../../shared/projects.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import { findProject, projectResources } from '../projects/index.js';
import { findIssue, findIssueRow, liveChildren } from './issue.store.js';
import type { IssueExtras, StatusCatalogs } from './ports.js';

/** The newest comments an issue context carries. */
export const CONTEXT_COMMENT_LIMIT = 20;

export interface IssueContextStatus {
  readonly key: string;
  readonly name: string;
  readonly category: StatusCategory;
}

export interface IssueContextIssueRef {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly status: string;
}

/** A working directory of the issue's project (a `ProjectResource`). */
export interface IssueContextDirectory {
  /** The project resource id. */
  readonly id: string;
  readonly type: 'gitRepo' | 'directory';
  /** `gitRepo`. */
  readonly url: string | null;
  readonly defaultRef: string | null;
  /** `gitRepo`: the repository on its host, when it was linked through one. */
  readonly binding: ProjectResourceBinding | null;
  /** `directory`: the runner that holds it and its absolute path there. */
  readonly runnerId: string | null;
  readonly path: string | null;
  readonly label: string | null;
  readonly initPrompt: string | null;
}

/** A file on the issue or one of its comments, as an executor reads about it (it downloads the bytes on its own). */
export interface IssueContextFile {
  readonly id: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly size: number;
}

export interface IssueContext {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  /** Markdown. */
  readonly description: string;
  readonly status: IssueContextStatus;
  /** The statuses of the issue's workflow, in order. */
  readonly statuses: readonly IssueContextStatus[];
  /** The statuses the kind asked for may move the issue to from where it is. */
  readonly allowedTransitions: readonly string[];
  readonly priority: string;
  readonly labels: readonly string[];
  readonly owner: { readonly id: string; readonly name: string };
  readonly executor: {
    readonly type: string;
    readonly id: string;
    readonly name: string | null;
  } | null;
  readonly project: {
    readonly id: string;
    readonly name: string;
    readonly description: string | null;
    /** The project's working directories, in order: the first is the primary one. */
    readonly repos: readonly IssueContextDirectory[];
  } | null;
  readonly parent: IssueContextIssueRef | null;
  readonly children: readonly IssueContextIssueRef[];
  readonly checklist: {
    readonly statusKey: string;
    readonly complete: boolean;
    readonly items: readonly {
      readonly key: string;
      readonly label: string;
      readonly required: boolean;
      readonly checked: boolean;
    }[];
  } | null;
  readonly pendingApproval: {
    readonly id: string;
    readonly toStatus: string;
    readonly requestedBy: string | null;
  } | null;
  /** The issue's own files, oldest first. */
  readonly attachments: readonly IssueContextFile[];
  /** The newest comments, oldest first; deleted ones left out. */
  readonly comments: readonly {
    readonly id: string;
    readonly parentId: string | null;
    readonly author: {
      readonly type: string;
      readonly id: string | null;
      readonly name: string | null;
    };
    readonly content: string;
    readonly createdAt: string;
    /** The files sent with it. */
    readonly attachments: readonly IssueContextFile[];
  }[];
  readonly dueDate: string | null;
  readonly url: string;
}

export interface IssueContextProvider {
  /**
   * The issue's context on `conn`, with the transitions `kind` may make; undefined when the issue does not exist or was
   * deleted.
   */
  contextFor(
    conn: DatabaseConnection,
    idOrKey: string,
    options?: { readonly kind?: string },
  ): Promise<IssueContext | undefined>;
  /** The identifier and the app route of an issue, for naming branches and linking back. */
  describe(
    conn: DatabaseConnection,
    idOrKey: string,
  ): Promise<{ readonly key: string; readonly url: string } | undefined>;
}

export interface IssueContextDeps {
  readonly kinds: KindRegistry;
  readonly statuses: StatusCatalogs;
  readonly extras: () => Pick<
    IssueExtras,
    'checklist' | 'pendingApproval' | 'attachments'
  >;
  readonly comments: (
    conn: DatabaseConnection,
    issueId: string,
  ) => Promise<IssueComment[]>;
}

const fileOf = (file: Attachment): IssueContextFile => ({
  id: file.id,
  filename: file.filename,
  mimeType: file.mimeType,
  size: file.size,
});

export function issuePath(identifier: string): string {
  return `/issues/${encodeURIComponent(identifier)}`;
}

export function createIssueContextProvider(
  deps: IssueContextDeps,
): IssueContextProvider {
  return {
    async contextFor(conn, idOrKey, options = {}) {
      const issue = await findIssue(conn, idOrKey);
      if (!issue || issue.deletedAt) return undefined;
      const row = await findIssueRow(conn, issue.id);
      const catalog = await deps.statuses.forProject(conn, issue.projectId);
      const statusOf = (key: string): IssueContextStatus => {
        const found = catalog.statuses.find((status) => status.key === key);
        return {
          key,
          name: found?.name ?? key,
          category: found?.category ?? 'unstarted',
        };
      };
      const project = issue.projectId
        ? await findProject(conn, issue.projectId)
        : undefined;
      const parent = issue.parentIssueId
        ? await findIssue(conn, issue.parentIssueId)
        : undefined;
      const children = await liveChildren(conn, [issue.id]);
      const executorName = issue.executor
        ? ((
            await deps.kinds.names(conn, issue.executor.type, [
              issue.executor.id,
            ])
          ).get(issue.executor.id) ?? null)
        : null;
      const checklist = await deps.extras().checklist(conn, issue);
      const pending = await deps.extras().pendingApproval(conn, issue);
      const comments = (await deps.comments(conn, issue.id))
        .filter((comment) => !comment.deleted)
        .slice(-CONTEXT_COMMENT_LIMIT);
      const ref = (other: {
        readonly id: string;
        readonly identifier: string;
        readonly title: string;
        readonly statusKey: string;
      }): IssueContextIssueRef => ({
        id: other.id,
        identifier: other.identifier,
        title: other.title,
        status: other.statusKey,
      });
      return {
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        description: issue.description,
        status: statusOf(issue.statusKey),
        statuses: catalog.statuses.map((status) => statusOf(status.key)),
        allowedTransitions: options.kind
          ? [...catalog.machine.allowedMoves(issue.statusKey, options.kind)]
          : [],
        priority: issue.priority,
        labels: (row?.labels ?? []).map((label) => label.name),
        owner: { id: issue.ownerUserId, name: row?.ownerName ?? '' },
        executor: issue.executor
          ? { ...issue.executor, name: executorName }
          : null,
        project: project
          ? {
              id: project.id,
              name: project.name,
              description: project.description,
              repos: (await projectResources(conn, project.id)).map(
                (resource) => ({
                  id: resource.id,
                  type: resource.type,
                  url: resource.url,
                  defaultRef: resource.defaultRef,
                  binding: resource.binding,
                  runnerId: resource.runnerId,
                  path: resource.path,
                  label: resource.label,
                  initPrompt: resource.initPrompt,
                }),
              ),
            }
          : null,
        parent: parent && !parent.deletedAt ? ref(parent) : null,
        children: children.map(ref),
        checklist: checklist
          ? {
              statusKey: checklist.statusKey,
              complete: checklist.complete,
              items: checklist.items.map((item) => ({
                key: item.itemKey,
                label: item.label,
                required: item.required,
                checked: item.checked,
              })),
            }
          : null,
        pendingApproval: pending
          ? {
              id: pending.id,
              toStatus: pending.toStatus,
              requestedBy: pending.requestedByName,
            }
          : null,
        attachments: (await deps.extras().attachments(conn, null, issue)).map(
          fileOf,
        ),
        comments: comments.map((comment) => ({
          id: comment.id,
          parentId: comment.parentId,
          author: {
            type: comment.authorType,
            id: comment.authorId,
            name: comment.authorName,
          },
          content: comment.content,
          createdAt: comment.createdAt,
          attachments: comment.attachments.map(fileOf),
        })),
        dueDate: issue.dueDate,
        url: issuePath(issue.identifier),
      };
    },

    async describe(conn, idOrKey) {
      const issue = await findIssue(conn, idOrKey);
      if (!issue || issue.deletedAt) return undefined;
      return { key: issue.identifier, url: issuePath(issue.identifier) };
    },
  };
}
