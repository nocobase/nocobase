export {
  createCommentService,
  type CommentDeps,
  type CommentService,
} from './comment.service.js';
export {
  createCommentQueries,
  threadPage,
  type CommentQueries,
} from './comment.queries.js';
export {
  createCommentRoutes,
  createIssueCommentRoutes,
  createMentionRoutes,
} from './comment.routes.js';
export type {
  CommentReader,
  CommentWriteOptions,
  CommentWriter,
} from './ports.js';
export { findComment, type CommentRecord } from './comment.store.js';
