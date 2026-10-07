export { default } from './plugin.js';
export * from './tokens.js';
export { KnowledgeError, type KnowledgeErrorStatus } from './errors.js';
export {
  NO_ACCESS,
  chainOf,
  createAccessCheck,
  type AccessCheck,
  type AccessContext,
  type SpaceAcl,
} from './services/access.js';
export {
  accessGate,
  evaluateNodes,
  gatesOf,
  passes,
  type AclEntry,
  type AclNode,
  type AclSource,
  type NodeAccess,
} from './services/permissions.js';
export { KNOWLEDGE_ENTRIES_MAX } from './services/doc-permissions.js';
export { createKnowledge } from './services/knowledge.js';
export {
  RERANK_CANDIDATES,
  RRF_K,
  compareMatches,
  createContainsSearch,
  fuseRankings,
  type MatchOrder,
} from './services/search.js';
export {
  DEFAULT_LAYOUT,
  DEFAULT_LIMITS,
  INDEX_FILE,
  MANIFEST_FILE,
  readDocumentFile,
} from './services/snapshots.js';
export { chunkMarkdown, type Chunk } from './services/chunks.js';
export {
  createFileStore,
  FILES_ACCESS_PATH,
  type FileDisks,
  type FileStoreDeps,
  type FileUploader,
  type KnowledgeFileStore,
  type StoredObject,
  type Uploader,
} from './services/storage.js';
export {
  isParsed,
  workerExtractor,
  type ExtractRequest,
  type ExtractResponse,
  type TextExtractor,
} from './parsing/index.js';
export {
  contentDisposition,
  contentHeaders,
  createKnowledgeRoutes,
  createKnowledgeTicketRoutes,
} from './routes/api.js';
export {
  KNOWLEDGE_ERROR_DOMAIN,
  knowledgeApiError,
  knowledgeErrorHandler,
} from './routes/errors.js';
export {
  KnowledgeDocSchema,
  KnowledgeHitSchema,
  KnowledgeProposalSchema,
  KnowledgeSpaceDocsSchema,
} from './routes/schemas.js';
/** What the plugin registers with the authorization plugin at boot, for an application or a test assembling it by hand. */
export { registerBusinesses } from './providers/authorization.js';
