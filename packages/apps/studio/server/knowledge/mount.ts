/**
 * The knowledge base as a mount of the agents plugin (`agents.mounts`, name `knowledge`): at claim, a snapshot (the
 * knowledge plugin's `snapshots`) of the run's project space and the system space, as the person who woke the agent
 * reads them, for an agent configured to read knowledge; the runner places it in `.nocobase-runner/knowledge/` and caches
 * it by hash. A runner without the `mounts` feature gets nothing, and the brief points at `nb-studio kb read` instead.
 *
 * ```text
 * INDEX.md            what is here, space by space, with each document's title, summary, version and path
 * .manifest.json      [{ path, hash, docId, version, slug }]: what `nb-studio kb propose --changed` compares against
 * project/…           the run's project space: articles as Markdown, folders as directories, files as their
 *                     extracted text (`report.pdf.md`; the original through `nb-studio kb download`)
 * system/…            the system space, inherited
 * ```
 *
 * The snapshot's hash stays out of the session fingerprint: a resumed session is told in its turn which documents
 * changed since its previous snapshot.
 */
import type { RunMountProvider } from '@nocobase/app-plugin-agents/server/tokens';
import {
  type Knowledge,
  type SnapshotChange,
  type SnapshotLayout,
} from '@nocobase/app-plugin-knowledge/server';

import { knowledgeDocPath, PROJECT_SCOPE } from '../../shared/knowledge.js';
import {
  prepareKnowledge,
  rightsOf,
  type KnowledgeBriefDeps,
  type PreparedKnowledge,
} from './brief.js';

export const KNOWLEDGE_MOUNT = 'knowledge';
/** Where the runner places the files, inside the subject's work directory. */
export const KNOWLEDGE_TARGET = '.nocobase-runner/knowledge';

/** How a run's knowledge files are laid out and worded. */
export const RUN_LAYOUT: SnapshotLayout = {
  dir: (space) => space.scope,
  heading: (space, dir) =>
    space.ref.scope === PROJECT_SCOPE
      ? `Project${space.title ? `: ${space.title}` : ''} (\`${dir}/\`)`
      : `System (\`${dir}/\`${space.inherited ? ', inherited' : ''})`,
  preamble: [
    'The knowledge base as it was when this run started: conventions, pitfalls and decisions people keep for this project and system-wide. Each file starts with front matter naming its document and version.',
    [
      '- Read the current version of a document with `nb-studio kb read <slug>`; it may be newer than the file here.',
      '- Do not treat these files as yours to change. To suggest a change, edit the file here as a draft and propose it with `nb-studio kb propose --changed --reason "..."` (or `nb-studio kb propose --doc <slug> --content-file <file> --reason "..."`); a new file becomes a new document under the directory it is in. Someone who may edit decides.',
    ].join('\n'),
  ],
  unwritten: (slug) => `not written here: \`nb-studio kb read ${slug}\``,
  url: (space, docId) => knowledgeDocPath(space, docId),
  original: (slug) => `the original: \`nb-studio kb download ${slug}\``,
};

/** The line a resumed session gets: documents new or changed since its previous snapshot. */
export function changedNote(changed: readonly SnapshotChange[]): string {
  const shown = changed
    .slice(0, 10)
    .map(
      (doc) =>
        `${doc.title} (\`${doc.slug}\`, ${doc.from ? `v${doc.from} → v${doc.to}` : `new, v${doc.to}`})`,
    );
  return `Knowledge documents updated since your last turn: ${shown.join('; ')}${changed.length > 10 ? `; and ${changed.length - 10} more` : ''}. The files in ${KNOWLEDGE_TARGET}/ are current again; read what concerns your task.`;
}

export function knowledgeMount(
  knowledge: () => Knowledge,
  deps: KnowledgeBriefDeps,
): RunMountProvider {
  return {
    name: KNOWLEDGE_MOUNT,
    prepare: prepareKnowledge(deps),
    async forRun(conn, context, prepared) {
      const ready = prepared as PreparedKnowledge | undefined;
      // A conversation reads through `nb-studio kb` (`brief.ts`): its working directory is the conversation's own.
      if (!ready || ready.conversation || !rightsOf(context.claim, ready).read)
        return null;
      const snapshot = await knowledge().snapshots.take(conn, ready.readable, {
        key: context.claim.run.id,
        seriesKey: context.sessionKey,
        layout: RUN_LAYOUT,
      });
      if (!snapshot) return null;
      return {
        hash: snapshot.hash,
        target: KNOWLEDGE_TARGET,
        note: `The team's knowledge base as of this run's start, one Markdown file per document; start with its INDEX.md.${snapshot.omitted > 0 ? ` ${snapshot.omitted} documents are only listed there; read them with \`nb-studio kb read <slug>\`.` : ''}`,
        ...(snapshot.changed
          ? { resumeNote: changedNote(snapshot.changed) }
          : {}),
      };
    },
    async bundle(conn, { runId }) {
      const files = await knowledge().snapshots.files(conn, runId, RUN_LAYOUT);
      return files
        ? { name: KNOWLEDGE_MOUNT, hash: files.hash, files: files.files }
        : null;
    },
  };
}
