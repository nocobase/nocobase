/**
 * The server's rules for who may change what (`server/domains/*\/*.access.ts`), as the browser applies them: to hide
 * or disable a control the server would refuse. They read the viewer's scope of each business action from
 * `GET /api/projects/me`: `all` passes on every record, a set of users only where the record relates to one of them, `none`
 * never. The server enforces every rule itself.
 */
import {
  businessKey,
  reaches,
  settingsKey,
  type Business,
  type BusinessAction,
  type Scope,
  type SettingsAction,
  type SettingsItem,
} from '../../shared/access.js';
import { PLAIN_COMMENT, type IssueComment } from '../../shared/comments.js';
import type { IssueListItem } from '../../shared/issues.js';
import { USER_KIND } from '../../shared/kinds.js';
import type { Me } from '../../shared/members.js';
import type { ProjectListItem } from '../../shared/projects.js';

export type Viewer = Me;

export function scopeOf<B extends Business>(
  viewer: Viewer | undefined,
  business: B,
  action: BusinessAction<B>,
): Scope {
  return viewer?.permissions.scopes[businessKey(business, action)] ?? 'none';
}

export function canUseSetting<S extends SettingsItem>(
  viewer: Viewer | undefined,
  item: S,
  action: SettingsAction<S>,
): boolean {
  return viewer?.permissions.settings[settingsKey(item, action)] ?? false;
}

/** Creating an issue: short of `all`, issues without a project or in a project the viewer sees. */
export function canCreateIssues(viewer: Viewer | undefined): boolean {
  return scopeOf(viewer, 'pm.issues', 'create') !== 'none';
}

/** Every change to an issue needs `edit`; seeing the issue is its relation. */
export function canEditIssues(viewer: Viewer | undefined): boolean {
  return scopeOf(viewer, 'pm.issues', 'edit') !== 'none';
}

type IssueRelation = Pick<IssueListItem, 'ownerUserId' | 'project'>;

/** `all`, or a user of the viewer's set owns the issue or leads its project. */
function manages(scope: Scope, issue: IssueRelation): boolean {
  return reaches(scope, issue.ownerUserId, issue.project?.leadUserId);
}

/** Moving an issue into a `done` or `closed` status. */
export function canCloseIssue(
  viewer: Viewer | undefined,
  issue: IssueRelation,
): boolean {
  return manages(scopeOf(viewer, 'pm.issues', 'close'), issue);
}

export function canChangeIssueOwner(
  viewer: Viewer | undefined,
  issue: IssueRelation,
): boolean {
  return manages(scopeOf(viewer, 'pm.issues', 'change-owner'), issue);
}

/** Uploading files: onto an issue (with `edit`) or with a comment (with `comment`). */
export function canUploadAttachments(viewer: Viewer | undefined): boolean {
  return scopeOf(viewer, 'pm.attachments', 'upload') !== 'none';
}

/** Writing comments and replies, and resolving threads, on the issues the viewer sees. */
export function canComment(viewer: Viewer | undefined): boolean {
  return scopeOf(viewer, 'pm.issues', 'comment') !== 'none';
}

type CommentAuthor = Pick<IssueComment, 'authorType' | 'authorId' | 'kind'>;

/** One's own plain comment, written as a person: only its author edits it. */
export function canEditComment(
  viewer: Viewer | undefined,
  comment: CommentAuthor & Pick<IssueComment, 'deleted'>,
): boolean {
  return (
    !comment.deleted &&
    canComment(viewer) &&
    comment.authorType === USER_KIND &&
    comment.kind === PLAIN_COMMENT &&
    !!viewer &&
    comment.authorId === viewer.userId
  );
}

/** Its author, or whoever moderates the issue's comments. */
export function canDeleteComment(
  viewer: Viewer | undefined,
  comment: CommentAuthor & Pick<IssueComment, 'deleted'>,
  issue: IssueRelation,
): boolean {
  if (comment.deleted) return false;
  return (
    canEditComment(viewer, comment) ||
    manages(scopeOf(viewer, 'pm.issues', 'moderate-comments'), issue)
  );
}

/** Deleting and restoring issues: administrators only. */
export function canDeleteIssues(viewer: Viewer | undefined): boolean {
  return scopeOf(viewer, 'pm.issues', 'delete') === 'all';
}

export function canCreateProjects(viewer: Viewer | undefined): boolean {
  return scopeOf(viewer, 'pm.projects', 'create') !== 'none';
}

/** Editing a project, its members and resources: `all`, or a user of the viewer's set leads it. */
export function canManageProject(
  viewer: Viewer | undefined,
  project: Pick<ProjectListItem, 'leadUserId'>,
): boolean {
  return reaches(scopeOf(viewer, 'pm.projects', 'manage'), project.leadUserId);
}

export function canDeleteProjects(viewer: Viewer | undefined): boolean {
  return scopeOf(viewer, 'pm.projects', 'delete') === 'all';
}
