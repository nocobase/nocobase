/**
 * Studio's views of the knowledge base for the person or the run asking (`routes.ts`, the `nb-studio kb` commands). A run on
 * an issue reads its project's knowledge and the system's; a run on a conversation reads the system's and that of the
 * projects its page contexts name (`conversation.ts`); a person names a project with `projectId`, or reads the
 * system's. `projectId` reads another project the caller sees in a run too.
 *
 * Documents are named by slug or id, found in the nearest space that has them. Every document answered carries `url`,
 * the page that shows it, so an online agent can link what it used. A run proposes at most three times (the plugin
 * counts), and an update it proposes is based on the version mounted for it.
 */
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import {
  KnowledgeError,
  readDocumentFile,
  type Knowledge,
  type KnowledgeReader,
  type ProposalInput,
  type TicketInput,
} from '@nocobase/app-plugin-knowledge/server';
import {
  KNOWLEDGE_SLUG_PATTERN,
  type KnowledgeDoc,
  type KnowledgeDocSummary,
  type KnowledgeEntryKind,
  type KnowledgeProposal,
  type KnowledgeScope,
  type KnowledgeSearchHit,
  type KnowledgeSource,
  type KnowledgeTree,
  type SpaceRef,
} from '@nocobase/app-plugin-knowledge/shared/knowledge';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import {
  knowledgeDocPath,
  PROJECT_SCOPE,
  projectSpace,
  SYSTEM_SCOPE,
  SYSTEM_SPACE,
} from '../../shared/knowledge.js';
import type { PermissionSource } from '../agents/commands/permissions.js';
import { AGENT_KIND } from '../agents/tx.js';
import type { ConversationKnowledgeOf } from './conversation.js';
import { KNOWLEDGE_TARGET } from './mount.js';

/** The page that shows a document (at a version and heading), for an answer to link to. */
function docUrl(
  scope: KnowledgeScope,
  scopeId: string,
  docId: string,
  version?: number,
  anchor?: string | null,
): string {
  return knowledgeDocPath({ scope, scopeId }, docId, {
    ...(version === undefined ? {} : { version }),
    ...(anchor ? { anchor } : {}),
  });
}

const invalid = (message: string) =>
  new KnowledgeError(400, 'INVALID_ARGUMENT', message);

/** Search hits of several spaces' views as one list: each section once, at its best fused score. */
export function mergedHits(
  lists: readonly (readonly KnowledgeSearchHit[])[],
  limit: number,
): KnowledgeSearchHit[] {
  const best = new Map<string, KnowledgeSearchHit>();
  for (const hit of lists.flat()) {
    const key = `${hit.docId}#${hit.lines[0]}`;
    const known = best.get(key);
    if (!known || hit.score > known.score) best.set(key, hit);
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/** How a listing names an entry's kind beside its version. */
function kindNote(doc: {
  readonly kind: KnowledgeEntryKind;
  readonly version: number;
  readonly file: { readonly filename: string } | null;
}): string {
  if (doc.kind === 'folder') return 'folder';
  if (doc.kind === 'file')
    return `file ${doc.file?.filename ?? ''}, v${doc.version}`.trim();
  return `v${doc.version}`;
}

/** Who is asking: the person, or for a run the agent acting for whoever woke it. */
export function knowledgeViewerOf(identity: CallerIdentity): KnowledgeReader {
  if (identity.kind === 'run' && identity.agent)
    return {
      userId: identity.userId,
      actor: {
        kind: AGENT_KIND,
        id: identity.agent.id,
        ...(identity.run ? { runId: identity.run.run.id } : {}),
      },
    };
  return { userId: identity.userId };
}

/** One document of a listing. */
export interface KbListItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly kind: KnowledgeEntryKind;
  readonly filename?: string;
  readonly space: KnowledgeScope;
  readonly version: number;
  readonly summary: string;
  readonly parentId?: string | null;
  readonly children?: number;
  readonly url: string;
}

export type KbDoc = KnowledgeDoc & { readonly url: string };

/** A search hit with its section and lines as text, and its page at the heading. */
export type KbHit = Omit<KnowledgeSearchHit, 'lines'> & {
  readonly section: string;
  readonly lines: string;
  readonly url: string;
};

/** What became of one changed file. */
export interface KbChangedResult {
  readonly path: string;
  readonly kind?: string;
  readonly proposalId?: string;
  readonly error?: string;
}

/** A proposal's fields as `nb-studio kb propose` sends them. */
export interface KbProposeInput {
  readonly doc?: string | undefined;
  readonly title?: string | undefined;
  readonly slug?: string | undefined;
  readonly parent?: string | undefined;
  readonly space?: 'project' | 'system' | undefined;
  readonly content?: string | undefined;
  readonly summary?: string | undefined;
  readonly reason: string;
  readonly verify?: boolean | undefined;
  readonly projectId?: string | undefined;
}

/** A file proposal's fields as `nb-studio kb upload` sends them. */
export type KbUploadInput = Omit<KbProposeInput, 'content' | 'verify' | 'slug'>;

export interface KnowledgeViewsDeps {
  readonly knowledge: () => Knowledge;
  readonly projects: () => Pick<Projects, 'issueQueries'>;
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
  /** A conversation run's projects; without it a conversation reads the system's only. */
  readonly conversationOf?: ConversationKnowledgeOf;
}

export interface KnowledgeViews {
  list(
    identity: CallerIdentity,
    query: { q?: string; parent?: string; projectId?: string },
  ): Promise<KbListItem[]>;
  tree(
    identity: CallerIdentity,
    query: { projectId?: string },
  ): Promise<{ data: KnowledgeTree; message: string }>;
  read(
    identity: CallerIdentity,
    ref: string,
    query: { version?: number; projectId?: string },
  ): Promise<{ data: KbDoc; message: string }>;
  search(
    identity: CallerIdentity,
    q: string,
    query: { limit: number; projectId?: string },
  ): Promise<KbHit[]>;
  /** A file's original, by slug or id. */
  download(
    identity: CallerIdentity,
    ref: string,
    query: { version?: number; projectId?: string },
  ): ReturnType<Knowledge['files']['content']>;
  propose(
    identity: CallerIdentity,
    input: KbProposeInput,
  ): Promise<{ data: KnowledgeProposal; message: string }>;
  /** One proposal per changed or new file of the run's mounted knowledge, by its path there. */
  proposeChanged(
    identity: CallerIdentity,
    input: Pick<KbProposeInput, 'reason' | 'projectId'>,
    files: readonly File[],
  ): Promise<{ data: KbChangedResult[]; message: string }>;
  /** A one-time ticket the file of a file proposal is sent to. */
  ticket(
    identity: CallerIdentity,
    input: KbUploadInput,
  ): ReturnType<Knowledge['proposals']['ticket']>;
}

const trimmed = (value: string | undefined): string | undefined =>
  value?.trim() ? value.trim() : undefined;

export function createKnowledgeViews(deps: KnowledgeViewsDeps): KnowledgeViews {
  const kb = () => deps.knowledge();

  /**
   * The spaces a call reads, nearest first (each with the system's behind it): `projectId`, the run's issue's project,
   * a conversation's projects, or the system's. `space` is the first, where a new document goes.
   */
  async function where(
    identity: CallerIdentity,
    named: string | undefined,
  ): Promise<{
    space: SpaceRef;
    spaces: readonly SpaceRef[];
    source: KnowledgeSource | null;
  }> {
    const run = identity.run?.run;
    let source: KnowledgeSource | null = null;
    let projectId: string | null = trimmed(named) ?? null;
    if (run && run.subjectKind !== 'issue' && deps.conversationOf) {
      const conversation = await deps
        .conversationOf({
          subject: { kind: run.subjectKind, id: run.subjectId },
          actorUserId: run.actorUserId,
        })
        .catch(() => null);
      if (conversation) {
        source = {
          kind: run.subjectKind,
          id: run.subjectId,
          title: conversation.conversation.title,
        };
        const spaces: SpaceRef[] = projectId
          ? [projectSpace(projectId)]
          : conversation.projects.length > 0
            ? conversation.projects.map((project) => projectSpace(project.id))
            : [SYSTEM_SPACE];
        return { space: spaces[0], spaces, source };
      }
    }
    if (run?.subjectKind === 'issue') {
      const viewer = await deps.permissions.viewerOf({
        kind: 'user',
        userId: identity.userId,
        displayName: identity.displayName,
      });
      const issue = await deps
        .projects()
        .issueQueries.detail(viewer, run.subjectId)
        .catch(() => null);
      if (issue) {
        projectId ??= issue.projectId;
        source = {
          kind: 'issue',
          id: issue.id,
          title: `${issue.identifier} ${issue.title}`,
          url: `/issues/${encodeURIComponent(issue.identifier)}`,
        };
      }
    } else if (run)
      source = { kind: run.subjectKind, id: run.subjectId, title: null };
    const space: SpaceRef = projectId ? projectSpace(projectId) : SYSTEM_SPACE;
    return { space, spaces: [space], source };
  }

  /** A document by slug or id in the nearest of the spaces that has it. */
  async function resolveIn(
    viewer: KnowledgeReader,
    spaces: readonly SpaceRef[],
    ref: string,
  ): Promise<KnowledgeDoc> {
    let missing: unknown = null;
    for (const space of spaces)
      try {
        return await kb().docs.resolve(viewer, space, ref);
      } catch (error) {
        missing = error;
      }
    throw missing;
  }

  async function mountedDocs(identity: CallerIdentity) {
    const runId = identity.run?.run.id;
    if (!runId) return [];
    const knowledge = kb();
    return knowledge.snapshots.docs(knowledge.connection(), runId);
  }

  async function mountedVersion(identity: CallerIdentity, docId: string) {
    return (
      (await mountedDocs(identity)).find((doc) => doc.docId === docId) ?? null
    );
  }

  return {
    async list(identity, query) {
      const viewer = knowledgeViewerOf(identity);
      const { spaces } = await where(identity, query.projectId);
      const q = query.q?.trim() ?? '';
      if (q) {
        const hits = mergedHits(
          await Promise.all(
            spaces.map((space) =>
              kb().docs.search(viewer, space, q, { limit: 50 }),
            ),
          ),
          50,
        );
        const seen = new Set<string>();
        return hits
          .filter((hit) => !seen.has(hit.docId) && seen.add(hit.docId))
          .map((hit) => ({
            id: hit.docId,
            slug: hit.slug,
            title: hit.title,
            kind: hit.kind,
            space: hit.scope,
            version: hit.version,
            summary: hit.excerpt,
            url: docUrl(hit.scope, hit.scopeId, hit.docId),
          }));
      }
      const seen = new Set<string>();
      let docs: KnowledgeDocSummary[] = [];
      for (const space of spaces)
        for (const entry of (await kb().docs.tree(viewer, space)).spaces)
          for (const doc of entry.docs)
            if (!seen.has(doc.id)) {
              seen.add(doc.id);
              docs.push(doc);
            }
      const parentRef = trimmed(query.parent);
      if (parentRef) {
        const parent = await resolveIn(viewer, spaces, parentRef);
        docs = docs.filter((doc) => doc.parentId === parent.id);
      }
      return docs.map((doc) => ({
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        kind: doc.kind,
        ...(doc.file ? { filename: doc.file.filename } : {}),
        space: doc.scope,
        version: doc.version,
        summary: doc.summary,
        parentId: doc.parentId,
        children: doc.childCount,
        url: docUrl(doc.scope, doc.scopeId, doc.id),
      }));
    },

    async tree(identity, query) {
      const viewer = knowledgeViewerOf(identity);
      const { spaces } = await where(identity, query.projectId);
      const listed = new Set<string>();
      const tree: KnowledgeTree = {
        spaces: (
          await Promise.all(
            spaces.map((space) => kb().docs.tree(viewer, space)),
          )
        )
          .flatMap((view) => view.spaces)
          .filter((entry) => {
            const key = `${entry.space.scope}:${entry.space.scopeId}`;
            if (listed.has(key)) return false;
            listed.add(key);
            return true;
          })
          // The system's last, as each view has it.
          .sort(
            (a, b) =>
              Number(a.space.scope === SYSTEM_SCOPE) -
              Number(b.space.scope === SYSTEM_SCOPE),
          ),
      };
      const lines: string[] = [];
      for (const entry of tree.spaces) {
        lines.push(
          entry.space.scope === PROJECT_SCOPE
            ? `# Project ${entry.space.title ?? entry.space.scopeId}`
            : '# System (inherited)',
        );
        const children = new Map<string | null, KnowledgeDocSummary[]>();
        for (const doc of entry.docs)
          children.set(doc.parentId, [
            ...(children.get(doc.parentId) ?? []),
            doc,
          ]);
        const walk = (parentId: string | null, depth: number) => {
          for (const doc of children.get(parentId) ?? []) {
            const summary = doc.summary.replace(/\s+/gu, ' ').trim();
            lines.push(
              `${'  '.repeat(depth)}- ${doc.slug}${doc.kind === 'folder' ? '/' : ''}  ${doc.title} (${kindNote(doc)})${summary ? `: ${summary}` : ''}`,
            );
            walk(doc.id, depth + 1);
          }
        };
        walk(null, 0);
        if (entry.docs.length === 0) lines.push('(no documents)');
        lines.push('');
      }
      return { data: tree, message: lines.join('\n').trimEnd() };
    },

    async read(identity, ref, query) {
      const viewer = knowledgeViewerOf(identity);
      const { spaces } = await where(identity, query.projectId);
      const doc = await resolveIn(viewer, spaces, ref);
      const wanted = query.version ?? null;
      const content =
        wanted && wanted !== doc.version
          ? ((await kb().docs.version(viewer, doc.id, wanted)).content ?? '')
          : doc.content;
      const mounted = await mountedVersion(identity, doc.id);
      const note =
        mounted && mounted.version !== doc.version && !wanted
          ? `<!-- Your copy in ${KNOWLEDGE_TARGET}/${mounted.path} is v${mounted.version}; this is the current v${doc.version}. -->\n\n`
          : '';
      return {
        data: {
          ...doc,
          ...(wanted ? { content, version: wanted } : {}),
          url: docUrl(doc.scope, doc.scopeId, doc.id, wanted ?? undefined),
        },
        message: `${note}${content}`,
      };
    },

    async search(identity, q, query) {
      const viewer = knowledgeViewerOf(identity);
      const { spaces } = await where(identity, query.projectId);
      const hits = mergedHits(
        await Promise.all(
          spaces.map((space) =>
            kb().docs.search(viewer, space, q, { limit: query.limit }),
          ),
        ),
        query.limit,
      );
      return hits.map((hit) => ({
        ...hit,
        section: hit.headingPath.join(' > '),
        lines: `${hit.lines[0]}-${hit.lines[1]}`,
        url: docUrl(hit.scope, hit.scopeId, hit.docId, undefined, hit.anchor),
      }));
    },

    async download(identity, ref, query) {
      const viewer = knowledgeViewerOf(identity);
      const { spaces } = await where(identity, query.projectId);
      const doc = await resolveIn(viewer, spaces, ref);
      if (doc.kind !== 'file')
        throw invalid(
          `${doc.slug} is not a file; read it with \`kb read ${doc.slug}\`.`,
        );
      return kb().files.content(viewer, doc.id, {
        ...(query.version === undefined ? {} : { version: query.version }),
      });
    },

    async propose(identity, body) {
      const viewer = knowledgeViewerOf(identity);
      const {
        space: primary,
        spaces,
        source,
      } = await where(identity, body.projectId);
      const docRef = trimmed(body.doc);
      const title = trimmed(body.title);
      if ([docRef, title].filter(Boolean).length !== 1)
        throw invalid('Give exactly one of --doc, --title or --changed.');
      const base = { reason: body.reason, source, primary };
      let input: ProposalInput;
      if (docRef) {
        const doc = await resolveIn(viewer, spaces, docRef);
        if (body.verify === true)
          input = { ...base, kind: 'verify', docId: doc.id };
        else {
          const mounted = await mountedVersion(identity, doc.id);
          input = {
            ...base,
            kind: 'update',
            docId: doc.id,
            content: body.content ?? '',
            ...(mounted ? { baseVersion: mounted.version } : {}),
            ...(title ? { title } : {}),
            ...(body.summary !== undefined ? { summary: body.summary } : {}),
          };
        }
      } else {
        const parentRef = trimmed(body.parent);
        const parent = parentRef
          ? await resolveIn(viewer, spaces, parentRef)
          : null;
        const slug = trimmed(body.slug);
        input = {
          ...base,
          kind: 'create',
          title: title!,
          content: body.content ?? '',
          ...(slug ? { slug } : {}),
          ...(parent ? { parentId: parent.id } : {}),
          ...(body.space === 'system' ? { space: SYSTEM_SPACE } : {}),
          ...(body.summary !== undefined ? { summary: body.summary } : {}),
        };
      }
      const proposal = await kb().proposals.propose(viewer, input);
      return {
        data: proposal,
        message: `Proposed ${proposal.kind === 'create' ? `a new document "${proposal.title ?? ''}"` : `${proposal.kind === 'verify' ? 'that' : 'a change to'} ${proposal.docSlug ?? proposal.docTitle}${proposal.kind === 'verify' ? ' still holds' : ''}`} (${proposal.id}); someone who may edit decides.`,
      };
    },

    async proposeChanged(identity, body, files) {
      if (files.length === 0)
        throw invalid(`Nothing changed in ${KNOWLEDGE_TARGET}.`);
      const viewer = knowledgeViewerOf(identity);
      const { space: primary, source } = await where(identity, body.projectId);
      const base = { reason: body.reason, source, primary };
      const knowledge = kb();
      const mounted = await mountedDocs(identity);
      const byPath = new Map(mounted.map((doc) => [doc.path, doc]));
      const results: KbChangedResult[] = [];
      for (const file of files) {
        const path = file.name;
        try {
          const parsed = readDocumentFile(await file.text());
          const known = byPath.get(path);
          let input: ProposalInput;
          if (known?.kind === 'file')
            throw invalid(
              `${path} is the text extracted from a file; propose a new version of the file with \`kb upload --doc ${known.slug} --file <path>\`.`,
            );
          if (known)
            input = {
              ...base,
              kind: 'update',
              docId: known.docId,
              baseVersion: known.version,
              content: parsed.content,
            };
          else {
            const parts = path.split('/');
            const scope = parts[0];
            if (scope !== 'project' && scope !== 'system')
              throw invalid('A new document goes under project/ or system/.');
            const dir = parts.slice(0, -1).join('/');
            const name = parts.at(-1)!.replace(/\.md$/u, '');
            const parentSlug = parts.at(-2);
            const parent =
              parts.length > 2
                ? (byPath.get(`${dir}.md`) ??
                  byPath.get(`${dir}/README.md`) ??
                  // A folder is a directory only: found by its slug.
                  mounted.find(
                    (doc) =>
                      doc.kind === 'folder' &&
                      doc.slug === parentSlug &&
                      doc.scope === scope,
                  ))
                : undefined;
            const ownDir = name === 'README' ? dir : null;
            const slug = ownDir ? (ownDir.split('/').at(-1) ?? '') : name;
            const heading = /^#\s+(.+)$/mu.exec(parsed.content)?.[1]?.trim();
            input = {
              ...base,
              kind: 'create',
              title: parsed.title ?? heading ?? slug,
              content: parsed.content,
              ...(KNOWLEDGE_SLUG_PATTERN.test(slug) ? { slug } : {}),
              ...(parent && !ownDir ? { parentId: parent.docId } : {}),
              ...(scope === 'system' ? { space: SYSTEM_SPACE } : {}),
            };
          }
          const proposal = await knowledge.proposals.propose(viewer, input);
          results.push({ path, kind: proposal.kind, proposalId: proposal.id });
        } catch (error) {
          results.push({
            path,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      return {
        data: results,
        message: results
          .map((result) =>
            result.proposalId
              ? `${result.path}: proposed (${result.kind}, ${result.proposalId})`
              : `${result.path}: ${result.error}`,
          )
          .join('\n'),
      };
    },

    async ticket(identity, body) {
      const viewer = knowledgeViewerOf(identity);
      const {
        space: primary,
        spaces,
        source,
      } = await where(identity, body.projectId);
      const base = { reason: body.reason, source, primary };
      const title = trimmed(body.title);
      const summary =
        body.summary !== undefined
          ? { summary: trimmed(body.summary) ?? '' }
          : {};
      let input: TicketInput;
      const docRef = trimmed(body.doc);
      if (docRef) {
        const doc = await resolveIn(viewer, spaces, docRef);
        const mounted = await mountedVersion(identity, doc.id);
        input = {
          ...base,
          kind: 'update',
          docId: doc.id,
          ...(mounted ? { baseVersion: mounted.version } : {}),
          ...(title ? { title } : {}),
          ...summary,
        };
      } else {
        const parentRef = trimmed(body.parent);
        const parent = parentRef
          ? await resolveIn(viewer, spaces, parentRef)
          : null;
        input = {
          ...base,
          kind: 'create',
          ...(title ? { title } : {}),
          ...(parent ? { parentId: parent.id } : {}),
          ...(body.space === 'system' ? { space: SYSTEM_SPACE } : {}),
          ...summary,
        };
      }
      return kb().proposals.ticket(viewer, input);
    },
  };
}
