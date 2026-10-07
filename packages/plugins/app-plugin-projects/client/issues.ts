/**
 * The headless parts of the issues pages, for an application that composes `/issues`, `/my-issues` and an issue's page
 * itself (for example, from the UI Library's `issue-table`, `kanban`, `issue-detail`, `comment-thread` and
 * `attachment-list`): the issue list and board queries, moving an issue on the board, the filters and view kept in the
 * query string, the executor options, one issue with every change its page makes and its activity line, and the
 * permission and wording helpers. The plugin keeps these stable; the pages built on them are the application's.
 *
 * The New issue dialog and a plan's page stay the plugin's: the application routes them as its `/issues` page's
 * children (`client/pages.ts`, `issueChildRoutes`), and "New sub-issue" under its issue page (`issueDetailChildRoutes`).
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import type { StatusDefinition } from '../shared/issues.js';
import { statusName } from './lib/status.js';

export { findStatus, statusTone } from './lib/status.js';
export type { PmTone } from './components/pm-tones.js';

export {
  ISSUE_FILTER_PARAMS,
  hasIssueFilters,
  readIssueFilters,
  readStoredIssueView,
  resolveIssueView,
  storeIssueView,
  withDeleted,
  withIssueFilter,
  withIssueSort,
  withIssueView,
  withoutIssueFilters,
  type IssueFilterKey,
  type IssueFilters,
  type IssueView,
} from './pages/issues/filters.js';
export { useUrlSearch, type UrlSearch } from './pages/issues/use-url-search.js';
export {
  flattenIssuePages,
  useBoardPages,
  useIssuePages,
  type BoardGroup,
  type BoardPages,
  type ColumnMore,
} from './pages/issues/use-issue-pages.js';
export {
  useBoardMove,
  type BoardMove,
} from './pages/issues/board/use-board-move.js';
export {
  buildBoardColumns,
  type BoardColumn,
} from './pages/issues/board/board-model.js';
export {
  useExecutorOptions,
  useHasOtherExecutors,
} from './pages/issues/use-executor-options.js';
export {
  myIssueFilters,
  type MyIssuesRole,
} from './pages/my-issues/my-issues-model.js';
export type { StartRequest } from './pages/issues/detail/start-dialog.js';
export type { ExecutorOption } from './components/pm-executor-select.js';
export {
  canCreateIssues,
  canDeleteIssues,
  canEditIssues,
} from './lib/permissions.js';
export { useNotify, type Notify } from './hooks/use-notify.js';

/**
 * A status's name in the interface language: a built-in status keeping its default name is translated in this
 * plugin's namespace; one the workflow added or renamed shows the name it was given.
 */
export function useStatusName(): (
  statuses: readonly StatusDefinition[] | undefined,
  key: string,
) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useCallback((statuses, key) => statusName(t, statuses, key), [t]);
}

// An issue's page (`/issues/:issueId`), composed by the application from the UI Library's items.
export {
  ISSUE_REACTION_EMOJIS,
  useIssueCommentActions,
  useIssueTimeline,
  useMentionSearch,
  type IssueCommentActions,
  type IssueTimeline,
  type MentionCandidate,
  type NewComment,
} from './pages/issues/detail/use-issue-activity.js';
export type {
  TimelineEntry,
  TimelineRun,
} from './pages/issues/detail/timeline.js';
export { useAuthorLabel } from './pages/issues/detail/use-author-label.js';
export { isBuiltInKind, useKindLabel } from './lib/kinds.js';
export { useHasMentionableKinds } from './pages/issues/use-mention-candidates.js';
export {
  ATTACHMENT_SIZE_MB,
  useAttachmentUploads,
  type AttachmentUploads,
  type PendingUpload,
} from './hooks/use-attachment-uploads.js';
export { useEventTitle } from './lib/workflow-events.js';
export {
  canComment,
  canDeleteComment,
  canEditComment,
  canUploadAttachments,
} from './lib/permissions.js';
export type { CommentThread, IssueComment } from '../shared/comments.js';
export {
  useIssueDetail,
  useIssuePageActions,
  type IssuePageActions,
} from './pages/issues/detail/use-issue-page.js';
export {
  useIssueUpdate,
  type IssueChanges,
  type IssueUpdate,
} from './pages/issues/detail/use-issue-update.js';
export {
  useConfirmedUpdate,
  type ConfirmedUpdate,
} from './pages/issues/detail/use-confirmed-update.js';
export {
  groupSubtasksByStage,
  type StageGroup,
} from './pages/issues/detail/subtask-model.js';
export {
  useIntakeBreakdown,
  type IntakeBreakdown,
} from './pages/intake/use-intake-breakdown.js';
export { canChangeIssueOwner, canCloseIssue } from './lib/permissions.js';
export { isClosing } from './lib/status.js';
export { STAGE_MAX } from '../shared/subtasks.js';
