export {
  createIssueService,
  type IssueDeps,
  type IssueService,
  type EventCause,
  type EventMove,
  type EventTarget,
  type IssueUpdateOutcome,
} from './issue.service.js';
export {
  childCounts,
  findIssue,
  findIssueRow,
  findIssues,
  issuesOfProject,
  liveChildren,
  touchIssueActivity,
  updateIssue,
} from './issue.store.js';
export {
  canSee,
  issueVisibleTo,
  managesIssue,
  requireEditor,
  requireVisible,
  requireVisible as requireVisibleIssue,
} from './issue.access.js';
export type { EventActor } from './issue.events.js';
export {
  createIssueQueries,
  MATCHING_LIMIT,
  type IssueMatches,
  type IssueMatchScope,
  type IssueQueries,
} from './issue.queries.js';
export {
  CONTEXT_COMMENT_LIMIT,
  createIssueContextProvider,
  type IssueContext,
  type IssueContextDirectory,
  type IssueContextFile,
  type IssueContextProvider,
} from './issue.context.js';
export { createIssueRoutes } from './issue.routes.js';
export { createProjectIssues } from './issue.projects.js';
export {
  isTerminal,
  noApprovals,
  noRelations,
  noTriggers,
  type CommentChange,
  type IssueApprovals,
  type IssueChange,
  type IssueExtras,
  type IssueRelations,
  type IssueRules,
  type IssueTriggers,
  type StatusCatalog,
  type StatusCatalogs,
} from './ports.js';
