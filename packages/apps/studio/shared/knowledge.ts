/**
 * Studio's spaces in the knowledge plugin (`@nocobase/app-plugin-knowledge`), as the server and the browser name them:
 * the system's (`system`, key empty), read by every member, and one per project (`project`, its id), read by whoever
 * sees the project and inheriting the system's. `server/knowledge/access.ts` decides who does what in each.
 */
import {
  DEFAULT_CHUNKING,
  type KnowledgeChunking,
  type SpaceRef,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';

/** The kinds of Studio's spaces: the system's, and a project's. */
export const SYSTEM_SCOPE = 'system';
export const PROJECT_SCOPE = 'project';

export const SYSTEM_SPACE: SpaceRef = { scope: SYSTEM_SCOPE, scopeId: '' };

/** A project's space. */
export function projectSpace(projectId: string): SpaceRef {
  return { scope: PROJECT_SCOPE, scopeId: projectId };
}

/** The inbox source and types of the knowledge base's items. */
export const KNOWLEDGE_INBOX_SOURCE = 'knowledge';
export const KNOWLEDGE_PROPOSAL = 'knowledge_proposal';
export const KNOWLEDGE_DECIDED = 'knowledge_decided';

/** The app route of a document: in its project's Knowledge tab, or on the system knowledge page. */
export function knowledgeDocPath(
  space: SpaceRef,
  docId: string,
  options: { readonly version?: number; readonly anchor?: string | null } = {},
): string {
  const query = new URLSearchParams();
  if (space.scope === PROJECT_SCOPE) query.set('tab', 'knowledge');
  query.set('doc', docId);
  if (options.version !== undefined)
    query.set('version', String(options.version));
  const base =
    space.scope === PROJECT_SCOPE
      ? `/projects/${encodeURIComponent(space.scopeId)}`
      : '/knowledge';
  return `${base}?${query.toString()}${options.anchor ? `#${options.anchor}` : ''}`;
}

/** A model of one of the agents plugin's model services. */
export interface KnowledgeModelRef {
  readonly modelService: string;
  readonly model: string;
}

/** The key of a space in the settings: `system:` or `project:<id>`. */
export function spaceSettingKey(space: SpaceRef): string {
  return `${space.scope}:${space.scopeId}`;
}

/** The token threshold under which an online agent gets its readable knowledge whole, by default. */
export const DEFAULT_WHOLE_TOKENS = 150_000;
export const WHOLE_TOKENS_MAX = 1_000_000;

/**
 * How the knowledge base is searched (Settings › Knowledge search, `studio.knowledgeSearch`):
 *
 * - `embedding`: the embedding model of the vector index; null searches by words only. Changing it builds a new index in
 *   the background, the old one answering until the new one is ready.
 * - `rerank`: a rerank model that reorders the fused hits; null keeps their fused order.
 * - `contextModel` and `contextual`: contextual retrieval. For the spaces named in `contextual` (`spaceSettingKey`),
 *   `contextModel` (a cheap chat model) writes one sentence situating each section in its document before it is
 *   embedded; off without a context model or a space.
 * - `wholeTokens`: an online agent whose readable knowledge is estimated below this many tokens gets it whole in its
 *   system prompt instead of searching; 0 turns it off.
 * - `chunking`: how every space without its own is cut into sections (`KnowledgeChunking`); changing it cuts those
 *   spaces again in the background.
 * - `recall`: how search ranks and cuts its hits (`KnowledgeRecallSettings`).
 */
export interface KnowledgeSearchSettings {
  readonly embedding: KnowledgeModelRef | null;
  readonly rerank: KnowledgeModelRef | null;
  readonly contextModel: KnowledgeModelRef | null;
  readonly contextual: readonly string[];
  readonly wholeTokens: number;
  readonly chunking: KnowledgeChunking;
  readonly recall: KnowledgeRecallSettings;
}

/**
 * How search ranks and cuts its hits: how many it answers by default (`limit`, 1–100), the least normalized relevance a
 * hit keeps (`minScore`, 0–1: a hit ranked first by keywords and by meaning scores 1), how much keywords weigh against
 * meaning in the fusion (`keywordWeight`, 0–1: 0.5 weighs them equally, 1 keywords only), and how many fused hits the
 * rerank model reads (`rerankCandidates`, 1–50).
 */
export interface KnowledgeRecallSettings {
  readonly limit: number;
  readonly minScore: number;
  readonly keywordWeight: number;
  readonly rerankCandidates: number;
}

export const DEFAULT_RECALL_SETTINGS: KnowledgeRecallSettings = {
  limit: 20,
  minScore: 0,
  keywordWeight: 0.5,
  rerankCandidates: 50,
};

export const DEFAULT_KNOWLEDGE_SEARCH: KnowledgeSearchSettings = {
  embedding: null,
  rerank: null,
  contextModel: null,
  contextual: [],
  wholeTokens: DEFAULT_WHOLE_TOKENS,
  chunking: DEFAULT_CHUNKING,
  recall: DEFAULT_RECALL_SETTINGS,
};

/**
 * Why semantic search is unavailable: the agents plugin's codes for its vector store (`VectorUnavailableCode`), and
 * `INDEX_NOT_SET_UP` while Studio has not set the index up (no agents or knowledge plugin, or before boot finished).
 */
export type KnowledgeIndexReason =
  | 'VECTORS_OFF'
  | 'VECTOR_STORE_UNKNOWN'
  | 'SQLITE_VEC_UNSUPPORTED'
  | 'SQLITE_VEC_OPEN_FAILED'
  | 'PGVECTOR_NOT_CONFIGURED'
  | 'PGVECTOR_CONNECTION_FAILED'
  | 'PGVECTOR_EXTENSION_MISSING'
  | 'VECTOR_STORE_FAILED'
  | 'INDEX_NOT_SET_UP';

/** An index of the vector store: its model, and how many sections are embedded into it of all it holds. */
export interface KnowledgeIndexModel {
  readonly model: string;
  readonly modelService: string;
  readonly dimension: number;
  readonly indexed: number;
  readonly total: number;
}

/** The vector index as `GET /api/knowledgeSearch` reports it. */
export interface KnowledgeIndexStatus {
  /** Whether the vector store can be used (configured in `agents.vectors` of `config.yml`). */
  readonly available: boolean;
  /** The store configured: its type and where it points, with no secret; null when vectors are turned off. */
  readonly store: {
    readonly type: string;
    readonly target: string | null;
  } | null;
  /** Why it cannot be used, when it cannot. */
  readonly reason: KnowledgeIndexReason | null;
  /** The ready index searches read. */
  readonly active: KnowledgeIndexModel | null;
  /** The index being built (a new model, or a store pointed elsewhere) while `active` serves. */
  readonly building: KnowledgeIndexModel | null;
  /** Sections waiting to be embedded, and those that failed for now. */
  readonly pending: number;
  readonly failed: number;
}

/** A space the settings can turn contextual retrieval on for. */
export interface KnowledgeSearchSpaceOption {
  readonly key: string;
  readonly scope: SpaceRef['scope'];
  readonly scopeId: string;
  readonly title: string;
}

/**
 * `GET /api/knowledgeSearch` (`studio.knowledgeSearch` read) answers this; `PUT` (`manage`) takes a
 * `KnowledgeSearchSettings` and answers it again.
 */
export interface KnowledgeSearchConfig {
  readonly settings: KnowledgeSearchSettings;
  readonly index: KnowledgeIndexStatus;
  readonly spaces: readonly KnowledgeSearchSpaceOption[];
  /** The models the model services offer for each choice: embedding, rerank, and chat for the context model. */
  readonly models: {
    readonly embedding: readonly KnowledgeModelOption[];
    readonly rerank: readonly KnowledgeModelOption[];
    readonly chat: readonly KnowledgeModelOption[];
  };
  readonly canManage: boolean;
}

/** A model to choose, with its service's title. */
export interface KnowledgeModelOption extends KnowledgeModelRef {
  readonly label: string;
  readonly serviceTitle: string;
}
