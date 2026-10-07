/**
 * The knowledge base, as the server and the browser exchange it (`/api/knowledge`, `server/`).
 *
 * A space holds a tree of entries: folders (a name and a place), articles (Markdown) and files (the original bytes, with
 * the text extracted from them as Markdown). Entries are kept in spaces. A space is named by what it belongs to: a kind (`scope`) and a key
 * (`scopeId`), both chosen by the application, such as an application's system space (`system`, key empty) and one space per
 * project (`project`, its id). A space may inherit others, which the application decides too: a space's view adds the
 * documents of the spaces it inherits and never hides one of the same slug. Every save is a whole new version; an
 * actor that is not a person (an agent) never edits, it proposes, and someone who may edit the space decides.
 */

/** A space's kind, as the application names it (`system`, `project`…): lower-case letters, digits and hyphens. */
export type KnowledgeScope = string;

/** 1–32 lower-case letters, digits and hyphens, starting with a letter. */
export const KNOWLEDGE_SCOPE_PATTERN: RegExp = /^[a-z][a-z0-9-]{0,31}$/u;

/** A space by what it belongs to: a kind (`scope`) and a key in it (`scopeId`, possibly empty). */
export interface SpaceRef {
  readonly scope: KnowledgeScope;
  readonly scopeId: string;
}

export const KNOWLEDGE_TITLE_MAX = 200;
export const KNOWLEDGE_SUMMARY_MAX = 300;
export const KNOWLEDGE_REASON_MAX = 500;
export const KNOWLEDGE_NOTE_MAX = 500;
export const KNOWLEDGE_COMMENT_MAX = 1000;
export const KNOWLEDGE_CONTENT_MAX = 200_000;
/** 1–64 lower-case letters, digits and hyphens, not starting with a hyphen; unique in a space. */
export const KNOWLEDGE_SLUG_PATTERN: RegExp = /^[a-z0-9][a-z0-9-]{0,63}$/u;
/** How deep the tree goes: a root document is depth 1. */
export const KNOWLEDGE_MAX_DEPTH = 4;
/** How many proposals one run of an actor may make. */
export const KNOWLEDGE_PROPOSALS_PER_RUN = 3;
/** The largest file stored when the application configures no other (`knowledge.maxFileSize`): 100 MiB. */
export const KNOWLEDGE_FILE_SIZE_MAX: number = 100 * 1024 * 1024;
/** At most this many characters of a file's extracted text are kept. */
export const KNOWLEDGE_EXTRACT_MAX = 1_000_000;

/** What an entry of a space's tree is. */
export type KnowledgeEntryKind = 'folder' | 'article' | 'file';

export const KNOWLEDGE_ENTRY_KINDS: readonly KnowledgeEntryKind[] = [
  'folder',
  'article',
  'file',
];

/** Where the text of a file's version stands. */
export type KnowledgeParseStatus =
  'parsing' | 'ready' | 'failed' | 'unsupported';

/** The extensions whose text is extracted; anything else (images included) is stored only, `unsupported`. */
export const KNOWLEDGE_PARSED_EXTENSIONS: readonly string[] = [
  'pdf',
  'docx',
  'doc',
  'xlsx',
  'xls',
  'xlsm',
  'pptx',
  'txt',
  'md',
  'json',
  'csv',
];

/** A stored file as the API shows it: read its bytes at `contentUrl`, or `downloadUrl` to save them. */
export interface KnowledgeFileInfo {
  readonly id: string;
  readonly filename: string;
  /** Lower-case, without the dot; empty without one. */
  readonly ext: string;
  readonly mimeType: string;
  readonly size: number;
  /** Null for a file being proposed: its text is extracted once it is accepted. */
  readonly parseStatus: KnowledgeParseStatus | null;
  readonly parseError: string | null;
  readonly contentUrl: string;
  readonly downloadUrl: string;
}

/** What the reader may do in a space, or on a folder or an article; each implies the ones before it. */
export interface KnowledgeAccess {
  readonly read: boolean;
  readonly propose: boolean;
  /** Edit, create, move, archive and mark verified; decide proposals. */
  readonly edit: boolean;
  /** Edit, and change who may do what on folders and articles (`docs/permissions.md`). */
  readonly manage: boolean;
}

/** A level of access, lowest first: each includes the ones before it. */
export type KnowledgeLevel = 'none' | 'read' | 'propose' | 'edit' | 'manage';

export const KNOWLEDGE_LEVELS: readonly KnowledgeLevel[] = [
  'none',
  'read',
  'propose',
  'edit',
  'manage',
];

/** A level an entry grants. */
export type KnowledgeGrantLevel = Exclude<KnowledgeLevel, 'none'>;

export const KNOWLEDGE_GRANT_LEVELS: readonly KnowledgeGrantLevel[] = [
  'read',
  'propose',
  'edit',
  'manage',
];

/** The order of a level: `none` is 0. */
export function levelRank(level: KnowledgeLevel): number {
  return KNOWLEDGE_LEVELS.indexOf(level);
}

/** The level `access` amounts to: none without `read`, else the highest it holds. */
export function levelOf(access: KnowledgeAccess): KnowledgeLevel {
  if (!access.read) return 'none';
  if (access.manage) return 'manage';
  if (access.edit) return 'edit';
  if (access.propose) return 'propose';
  return 'read';
}

/** What a level allows. */
export function accessOf(level: KnowledgeLevel): KnowledgeAccess {
  const rank = levelRank(level);
  return {
    read: rank >= 1,
    propose: rank >= 2,
    edit: rank >= 3,
    manage: rank >= 4,
  };
}

/** How a folder or an article takes its access: its parent's plus its own entries, or its own entries alone. */
export type KnowledgeAccessMode = 'inherit' | 'custom';

/** Text as the application words it: plain, or a key in an i18n namespace the browser translates. */
export type KnowledgeText =
  string | { readonly key: string; readonly ns: string };

/** A subject an entry grants to, of a type the application declares (`KnowledgeSubjectProvider`). */
export interface KnowledgeSubjectRef {
  readonly type: string;
  readonly id: string;
}

/** 1–32 lower-case letters, digits and hyphens, starting with a letter. */
export const KNOWLEDGE_SUBJECT_TYPE_PATTERN: RegExp = /^[a-z][a-z0-9-]{0,31}$/u;

/** The icons a subject type may show; the view maps each to one of its own. */
export type KnowledgeSubjectIcon =
  'user' | 'group' | 'role' | 'agent' | 'organization';

/** A subject with what the picker and a node's entries show of it. */
export interface KnowledgeSubject extends KnowledgeSubjectRef {
  readonly label: KnowledgeText;
  /** A second line, such as an email address. */
  readonly hint?: KnowledgeText | null;
  /** False for a stored subject the application no longer knows (a deleted user). */
  readonly known?: boolean;
}

/** A subject type, as the picker groups it. */
export interface KnowledgeSubjectType {
  readonly type: string;
  readonly title: KnowledgeText;
  readonly icon: KnowledgeSubjectIcon;
}

export interface KnowledgePermissionEntry {
  readonly subject: KnowledgeSubject;
  readonly level: KnowledgeGrantLevel;
}

/** What a node inherits from one place: an ancestor's entries, or the space's default access. */
export interface KnowledgeInheritedGrant {
  readonly from:
    | { readonly kind: 'space' }
    | {
        readonly kind: 'doc';
        readonly id: string;
        readonly title: string;
        readonly mode: KnowledgeAccessMode;
      };
  readonly entries: readonly KnowledgePermissionEntry[];
}

/** `GET /api/knowledge/docs/:docId/permissions`: a node's mode, entries and what it inherits. */
export interface KnowledgePermissions {
  readonly docId: string;
  readonly mode: KnowledgeAccessMode;
  readonly entries: readonly KnowledgePermissionEntry[];
  /**
   * Nearest first: each ancestor with entries up to the first `custom` one, then the space's default when no `custom`
   * ancestor stops the inheritance. Empty for a `custom` node, which inherits nothing.
   */
  readonly inherited: readonly KnowledgeInheritedGrant[];
  readonly types: readonly KnowledgeSubjectType[];
}

/** `PUT /api/knowledge/docs/:docId/permissions`: the node's mode and every entry it keeps. */
export interface ReplaceKnowledgePermissionsRequest {
  readonly mode: KnowledgeAccessMode;
  readonly entries: readonly {
    readonly subject: KnowledgeSubjectRef;
    readonly level: KnowledgeGrantLevel;
  }[];
}

/** Where a reader's access to a node comes from. */
export type KnowledgeAccessSource =
  | { readonly kind: 'none' }
  /** The space's default access, inherited down to the node. */
  | { readonly kind: 'space' }
  /** The reader manages the space, so manages every node in it. */
  | { readonly kind: 'manager' }
  /** An entry on the node or on an ancestor it inherits from. */
  | {
      readonly kind: 'entry';
      readonly docId: string;
      readonly docTitle: string;
      readonly subject: KnowledgeSubject;
    };

/** `GET /api/knowledge/docs/:docId/access`: the viewer's access to a node and where it comes from. */
export interface KnowledgeEffectiveAccess {
  readonly docId: string;
  readonly level: KnowledgeLevel;
  readonly access: KnowledgeAccess;
  readonly source: KnowledgeAccessSource;
  readonly mode: KnowledgeAccessMode;
  /** The node's own entries. */
  readonly entryCount: number;
  /** The nearest ancestor-or-self in `custom` mode, which the node's access starts from; null when none. */
  readonly restrictedBy: { readonly id: string; readonly title: string } | null;
}

/** Who wrote a version or made a proposal: a person (`user`), an actor of an application-defined kind, or the system. */
export interface KnowledgeAuthor {
  readonly kind: string;
  readonly id: string | null;
  readonly name: string | null;
}

/** What a version or a proposal came from, as the application names it: an issue, a conversation… */
export interface KnowledgeSource {
  readonly kind: string;
  readonly id: string;
  readonly title?: string | null;
  readonly url?: string | null;
}

export interface KnowledgeSpace extends SpaceRef {
  /** Null until its first document. */
  readonly id: string | null;
  /** The space's title as the application names it (a project's name), or null. */
  readonly title: string | null;
  /** Shown in another space's view because that space inherits it. */
  readonly inherited: boolean;
  readonly access: KnowledgeAccess;
}

export interface KnowledgeDocSummary {
  readonly id: string;
  readonly kind: KnowledgeEntryKind;
  readonly spaceId: string;
  readonly scope: KnowledgeScope;
  readonly scopeId: string;
  readonly parentId: string | null;
  readonly sortOrder: number;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  /** 0 for a folder. */
  readonly version: number;
  /** A file's current version's file; null for a folder or an article. */
  readonly file: KnowledgeFileInfo | null;
  readonly verifiedAt: string | null;
  readonly archivedAt: string | null;
  readonly updatedAt: string;
  readonly updatedBy: KnowledgeAuthor;
  /** Live (not archived) children. */
  readonly childCount: number;
  readonly pendingProposals: number;
  /** What the viewer may do with this entry. */
  readonly access: KnowledgeAccess;
  readonly accessMode: KnowledgeAccessMode;
  /** The entry's own permission entries. */
  readonly accessEntries: number;
}

/** `GET /api/knowledge/docs/:docId`: an entry at its current version. */
export interface KnowledgeDoc extends KnowledgeDocSummary {
  /** An article's Markdown; a file's extracted text (empty until parsed); empty for a folder. */
  readonly content: string;
  readonly contentHash: string;
  readonly verifiedBy: KnowledgeAuthor | null;
  /** Root first, the document's parent last. */
  readonly breadcrumbs: readonly {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
  }[];
}

/** One version, from `GET …/docs/:docId/versions` (without content) or `…/versions/:version` (with it). */
export interface KnowledgeVersion {
  readonly docId: string;
  readonly version: number;
  readonly title: string;
  readonly summary: string;
  readonly content?: string;
  readonly contentHash: string;
  /** A file's version: the file it holds. */
  readonly file: KnowledgeFileInfo | null;
  readonly author: KnowledgeAuthor;
  readonly source: KnowledgeSource | null;
  readonly runId: string | null;
  readonly proposalId: string | null;
  readonly approvedBy: KnowledgeAuthor | null;
  readonly note: string | null;
  readonly createdAt: string;
}

/** `GET /api/knowledge/spaces?scope=&scopeId=` answers `spaces` as its list: a space with the spaces it inherits, each with its documents. */
export interface KnowledgeTree {
  readonly spaces: readonly {
    readonly space: KnowledgeSpace;
    readonly docs: readonly KnowledgeDocSummary[];
  }[];
}

/** `POST /api/knowledge/docs`: an article, or a folder (a title only). Files are uploaded (`POST …/docs/upload`). */
export interface CreateKnowledgeDocRequest extends SpaceRef {
  readonly kind?: 'article' | 'folder';
  readonly parentId?: string | null;
  readonly title: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly content?: string;
}

/**
 * `PATCH /api/knowledge/docs/:docId`: a new version, against the version read. A file's new version keeps its file (a
 * new title or summary; `POST …/docs/:docId/replaceFile` replaces the file); a folder is renamed, with no version.
 */
export interface UpdateKnowledgeDocRequest {
  readonly expectedVersion: number;
  readonly title?: string;
  readonly summary?: string;
  readonly content?: string;
  readonly note?: string;
}

/** `POST /api/knowledge/docs/:docId/move`: not a new version. */
export interface MoveKnowledgeDocRequest {
  readonly parentId: string | null;
  readonly sortOrder?: number;
}

export type KnowledgeProposalKind = 'update' | 'create' | 'verify';

export type KnowledgeProposalStatus =
  'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface KnowledgeProposal {
  readonly id: string;
  readonly kind: KnowledgeProposalKind;
  readonly status: KnowledgeProposalStatus;
  readonly scope: KnowledgeScope;
  readonly scopeId: string;
  /** The space's title as the application names it, or null. */
  readonly spaceTitle: string | null;
  readonly docId: string | null;
  /** The document's title now (an update), or the proposed title (a new document). */
  readonly docTitle: string;
  readonly docSlug: string | null;
  readonly parentId: string | null;
  readonly title: string | null;
  readonly slug: string | null;
  readonly summary: string | null;
  readonly content: string | null;
  /** A new file, or a file's replacement: the file proposed. */
  readonly file: KnowledgeFileInfo | null;
  /** The version it was written against. */
  readonly baseVersion: number | null;
  /** The document's version now; null for a new document. */
  readonly currentVersion: number | null;
  /** The document moved past `baseVersion` since: accepting overwrites what changed since. */
  readonly stale: boolean;
  /** The content at `baseVersion` and now, for the two diffs a stale proposal shows; absent unless asked for. */
  readonly baseContent?: string | null;
  readonly currentContent?: string | null;
  readonly reason: string;
  /** A person, or an actor acting for `authorizedBy`. */
  readonly proposer: KnowledgeAuthor;
  readonly authorizedBy: KnowledgeAuthor;
  readonly source: KnowledgeSource | null;
  readonly runId: string | null;
  readonly decidedBy: KnowledgeAuthor | null;
  readonly decidedAt: string | null;
  readonly comment: string | null;
  readonly appliedVersion: number | null;
  readonly createdAt: string;
  /** Whether the viewer may accept or reject it now. */
  readonly canDecide: boolean;
}

/**
 * `POST /api/knowledge/proposals`: a proposal from the caller, for someone who may edit to decide. `update` and
 * `verify` name the document (`update` written against `baseVersion`); `create` names its space or its parent. Files
 * are proposed with `POST …/proposals/upload`.
 */
export interface ProposeKnowledgeRequest {
  readonly kind: KnowledgeProposalKind;
  readonly reason: string;
  readonly docId?: string;
  readonly scope?: KnowledgeScope;
  readonly scopeId?: string;
  readonly parentId?: string | null;
  readonly title?: string;
  readonly slug?: string;
  readonly summary?: string;
  readonly content?: string;
  readonly baseVersion?: number;
}

/** `POST /api/knowledge/proposals/:proposalId/accept`. */
export interface AcceptKnowledgeProposalRequest {
  readonly comment?: string;
  /** Accept a stale proposal anyway: its content becomes the next version whole. */
  readonly confirmStale?: boolean;
}

/** A search hit: one section of an article or a file's text that answers the query, with an excerpt around the match. */
export interface KnowledgeSearchHit {
  readonly docId: string;
  readonly kind: KnowledgeEntryKind;
  readonly slug: string;
  readonly title: string;
  readonly version: number;
  readonly scope: KnowledgeScope;
  readonly scopeId: string;
  readonly inherited: boolean;
  readonly headingPath: readonly string[];
  readonly anchor: string | null;
  readonly lines: readonly [number, number];
  readonly excerpt: string;
  /** Whether the document's title holds every word of the query; such hits come first. */
  readonly titleMatch: boolean;
  /** When the document was last updated (ISO). */
  readonly updatedAt: string;
  /** The fused score (Reciprocal Rank Fusion over the search providers). */
  readonly score: number;
  /** Each search provider that ranked the section: its own rank (1 first) and score. */
  readonly providers: readonly KnowledgeSearchProviderRank[];
  /** The reranker's score when one reordered the hits, which then come in its order; null otherwise. */
  readonly reranked: number | null;
  /** How it was ranked, only when asked for and allowed (`explain=true`). */
  readonly explain?: KnowledgeHitExplain;
}

/** One search provider's own rank and score of a hit. */
export interface KnowledgeSearchProviderRank {
  readonly name: string;
  readonly rank: number;
  readonly score: number;
}

/** The realtime topic announcing that knowledge changed, with ids only; open pages refetch. */
export const KNOWLEDGE_TOPIC = 'knowledge';

export interface KnowledgeChanged {
  readonly kind: 'knowledge.changed';
  readonly docId?: string;
  readonly proposalId?: string;
}

/** The anchor of a heading: what a link to it ends with (`#setting-up`), as the viewer and the chunker make it. */
export function headingAnchor(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[`*_~[\]()<>]/gu, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/gu, '-')
      .replace(/-+/gu, '-')
      .replace(/^-|-$/gu, '') || 'section'
  );
}

/** A heading of a Markdown document, outside code blocks. */
export interface MarkdownHeading {
  readonly level: number;
  readonly text: string;
  /** Unique in the document: a repeated heading's anchor gets `-2`, `-3`… */
  readonly anchor: string;
  /** 1-based. */
  readonly line: number;
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})/u;
const ATX = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/u;

/** The headings of `content` in order, with the anchors the viewer gives them. */
export function markdownHeadings(content: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = [];
  const used = new Map<string, number>();
  let fence: string | null = null;
  content.split('\n').forEach((raw, index) => {
    const line = raw.replace(/\r$/u, '');
    const opening = FENCE.exec(line);
    if (opening) {
      const marker = opening[1];
      if (fence === null) fence = marker[0].repeat(marker.length);
      else if (marker[0] === fence[0] && marker.length >= fence.length)
        fence = null;
      return;
    }
    if (fence !== null) return;
    const match = ATX.exec(line);
    if (!match) return;
    const text = match[2].trim();
    if (!text) return;
    const base = headingAnchor(text);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    headings.push({
      level: match[1].length,
      text,
      anchor: seen === 0 ? base : `${base}-${seen + 1}`,
      line: index + 1,
    });
  });
  return headings;
}

/** The space the plugin's page shows when the application names none. */
export const DEFAULT_SPACE: SpaceRef = { scope: 'default', scopeId: '' };

/**
 * How documents are cut into the sections search reads (`server/services/chunks.ts`): a section starts at each heading
 * down to `headingDepth` (1–3), and one longer than `max` characters is cut between paragraphs into pieces of about
 * `target`. The application sets the default; a space may override it.
 */
export interface KnowledgeChunking {
  readonly headingDepth: number;
  readonly target: number;
  readonly max: number;
}

export const DEFAULT_CHUNKING: KnowledgeChunking = {
  headingDepth: 3,
  target: 1200,
  max: 2000,
};
export const CHUNK_SIZE_MIN = 200;
export const CHUNK_SIZE_MAX = 8000;

/** `value` as chunking settings, or null when it is not valid: depth 1–3, sizes in range, `target` at most `max`. */
export function chunkingOf(value: unknown): KnowledgeChunking | null {
  if (!value || typeof value !== 'object') return null;
  const { headingDepth, target, max } = value as Record<string, unknown>;
  const size = (n: unknown): n is number =>
    Number.isInteger(n) &&
    (n as number) >= CHUNK_SIZE_MIN &&
    (n as number) <= CHUNK_SIZE_MAX;
  if (
    !Number.isInteger(headingDepth) ||
    (headingDepth as number) < 1 ||
    (headingDepth as number) > 3 ||
    !size(target) ||
    !size(max) ||
    target > max
  )
    return null;
  return { headingDepth: headingDepth as number, target, max };
}

/**
 * How search ranks and cuts its hits, set by the application: how many it answers by default (`limit`), the least
 * normalized fused score a hit keeps (`minScore`, 0–1: a hit ranked first by every provider that answered scores 1),
 * each provider's weight in the fusion by name (1 for one not named), and how many fused hits a reranker reads
 * (`rerankCandidates`, at most 50).
 */
export interface KnowledgeRecall {
  readonly limit: number;
  readonly minScore: number;
  readonly weights: Readonly<Record<string, number>>;
  readonly rerankCandidates: number;
}

export const DEFAULT_RECALL: KnowledgeRecall = {
  limit: 20,
  minScore: 0,
  weights: {},
  rerankCandidates: 50,
};

/** `GET /api/knowledge/chunking`: the application's default, the space's override, and whether it is re-cut now. */
export interface KnowledgeChunkingConfig {
  readonly defaults: KnowledgeChunking;
  readonly override: KnowledgeChunking | null;
  readonly effective: KnowledgeChunking;
  /** Whether the space's documents are being cut again in the background. */
  readonly rechunking: boolean;
  /** Whether the caller may change the override (`manage` on the space). */
  readonly canManage: boolean;
}

/** `PUT /api/knowledge/chunking`: the space's override; null follows the application's default. */
export interface UpdateKnowledgeChunkingRequest extends SpaceRef {
  readonly override: KnowledgeChunking | null;
}

/** Where a section stands in the semantic index: embedded, waiting, or failed after every attempt. */
export type KnowledgeIndexState = 'pending' | 'done' | 'failed';

/** One section of a document, as `GET /api/knowledge/docs/:docId/chunks` lists it. */
export interface KnowledgeChunkInfo {
  readonly ordinal: number;
  readonly headingPath: readonly string[];
  readonly anchor: string | null;
  /** The first and last line, 1-based. */
  readonly lines: readonly [number, number];
  readonly chars: number;
  /** Null without semantic search. */
  readonly state: KnowledgeIndexState | null;
  /** Why it failed, when it did. */
  readonly error: string | null;
}

/** A document's sections and where they stand in the semantic index. */
export interface KnowledgeDocIndex {
  readonly docId: string;
  readonly version: number;
  /** Whether semantic search indexes the sections; without it every state is null. */
  readonly enabled: boolean;
  readonly total: number;
  readonly indexed: number;
  readonly pending: number;
  readonly failed: number;
  /** `failed` when a section failed, `pending` while one waits, else `done`; null without semantic search or sections. */
  readonly state: KnowledgeIndexState | null;
  readonly chunks: readonly KnowledgeChunkInfo[];
}

/** A document of a space with sections not yet indexed, as `GET /api/knowledge/indexing` lists it. */
export interface KnowledgeUnindexedDoc {
  readonly docId: string;
  readonly title: string;
  readonly kind: KnowledgeEntryKind;
  readonly pending: number;
  readonly failed: number;
  /** The first failure's reason. */
  readonly error: string | null;
}

/** Why a hit ranks where it does (`explain=true`, for whoever manages the space or the search settings). */
export interface KnowledgeHitExplain {
  /** The fused score over what the providers that answered could give at most: 0–1. */
  readonly normalized: number;
  /** Each provider that ranked it: its rank, own score and weight in the fusion. */
  readonly providers: readonly (KnowledgeSearchProviderRank & {
    readonly weight: number;
  })[];
  /** The reranker's score, when one reordered the hits. */
  readonly reranked: number | null;
}
