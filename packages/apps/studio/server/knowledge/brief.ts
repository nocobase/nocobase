/**
 * What an agent's brief says of the knowledge base (a brief section of the agents plugin, `briefs.sections`), and the
 * knowledge files a run is given (a mount, `mount.ts`): both for the person who woke the agent, one hop.
 *
 * - **Knowledge**: the top-level documents of the run's project and of the system (title, slug, summary, how many
 *   below), and where the full text is: the mounted `.nocobase-runner/knowledge/` for a runner that places mounts,
 *   otherwise `nb-studio kb read`. Only when the running identity may read knowledge.
 * - **User manual**: while the issue is being worked on (a status of the `started` category), when the agent
 *   may propose and the system space has the manual (`manual` and its pages), the agent checks the pages its change
 *   affects, proposes updates or confirms them (`--verify`), and ends its delivery comment with the manual line. The
 *   line is product text, in the installation's language (`knowledge.manual.*` in the server locales).
 * - **A conversation** (`conversation.ts`) reads the system's documents and those of the projects its page contexts
 *   name: the top-level documents, and how to search and read them with `nb-studio kb` (a conversation gets no mount).
 *   It proposes only when the person asks to keep something.
 *
 * The section reads through the claim's connection only (`agents.briefs.sections`); the person's knowledge levels,
 * the issue's project as they see it, the spaces the agent reads for them (the knowledge plugin's `readable`) and the
 * translated lines are read before the claim's transaction (`prepare`).
 */
import type {
  BriefSectionProvider,
  ClaimContext,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type {
  Knowledge,
  ReadableSpaces,
  SpaceOutline,
} from '@nocobase/app-plugin-knowledge/server/tokens';
import type { SpaceRef } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import {
  projectSpace,
  SYSTEM_SCOPE,
  SYSTEM_SPACE,
} from '../../shared/knowledge.js';
import type { PermissionSource } from '../agents/commands/permissions.js';
import { AGENT_KIND } from '../agents/tx.js';
import type { KnowledgeLevels } from './access.js';
import type { ConversationKnowledgeOf } from './conversation.js';
import { KNOWLEDGE_TARGET } from './mount.js';

/** The slug of the user manual's root in the system space; its pages are below it. */
export const MANUAL_ROOT = 'manual';

/** What the brief and the mount need from outside the claim's connection. */
export interface PreparedKnowledge {
  readonly levels: KnowledgeLevels;
  /** The issue's project, when the person who woke the agent sees it. */
  readonly project: { readonly id: string; readonly name: string } | null;
  /** For a run on a conversation: the projects its page contexts name, nearest first; null for any other run. */
  readonly conversation: {
    readonly projects: readonly {
      readonly id: string;
      readonly name: string;
    }[];
  } | null;
  /** The delivery comment's manual lines, in the installation's language. */
  readonly manualLines: { readonly updated: string; readonly none: string };
  /** Of the run's spaces (`spacesOfRun`), those the agent reads for the person who woke it. */
  readonly readable: ReadableSpaces;
}

export interface KnowledgeBriefDeps {
  readonly knowledge: () => Knowledge;
  readonly levelsOf: (userId: string) => Promise<KnowledgeLevels>;
  readonly projects: () => Pick<Projects, 'issueQueries'>;
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
  /** The manual lines in the installation's language. */
  readonly manualLines: () => Promise<PreparedKnowledge['manualLines']>;
  /** A conversation run's projects (`conversation.ts`); without it a conversation reads the system's only. */
  readonly conversationOf?: ConversationKnowledgeOf;
}

/** Reads what a run's knowledge needs, before its claim's transaction. */
export function prepareKnowledge(
  deps: KnowledgeBriefDeps,
): (run: Run) => Promise<PreparedKnowledge> {
  return async (run) => {
    const levels = await deps.levelsOf(run.actorUserId);
    let project: PreparedKnowledge['project'] = null;
    let conversation: PreparedKnowledge['conversation'] = null;
    if (run.subject.kind !== 'issue') {
      const found = deps.conversationOf
        ? await deps.conversationOf(run).catch(() => null)
        : null;
      if (found) conversation = { projects: found.projects };
    } else {
      const viewer = await deps.permissions.viewerOf({
        kind: 'user',
        userId: run.actorUserId,
        displayName: run.actorUserId,
      });
      const issue = await deps
        .projects()
        .issueQueries.detail(viewer, run.subject.id)
        .catch(() => null);
      if (issue?.project)
        project = { id: issue.project.id, name: issue.project.name };
    }
    const spaces = spacesOfRun({ project, conversation });
    return {
      levels,
      project,
      conversation,
      manualLines: await deps.manualLines(),
      readable: await deps.knowledge().readable(
        {
          userId: run.actorUserId,
          actor: { kind: AGENT_KIND, id: run.agentId, runId: run.id },
        },
        spaces,
      ),
    };
  };
}

/** Whether the run's agent may read, and propose, knowledge for the person who woke it. */
export function rightsOf(
  claim: Pick<ClaimContext, 'agent'> & Partial<Pick<ClaimContext, 'run'>>,
  prepared: PreparedKnowledge | undefined,
): { read: boolean; propose: boolean } {
  const read = Boolean(prepared) && prepared!.levels.read !== 'none';
  return {
    read,
    propose:
      read &&
      !claim.run?.parentRunId &&
      claim.run?.subject.kind !== 'intake' &&
      prepared!.levels.propose !== 'none',
  };
}

/**
 * The spaces of a run, nearest first: its issue's project (when seen) and the system's; for a conversation, the
 * projects its page contexts name and the system's.
 */
export function spacesOfRun(
  prepared: Pick<PreparedKnowledge, 'project' | 'conversation'>,
): SpaceRef[] {
  const projects = prepared.conversation
    ? prepared.conversation.projects
    : prepared.project
      ? [prepared.project]
      : [];
  return [...projects.map((project) => projectSpace(project.id)), SYSTEM_SPACE];
}

interface RootDoc {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly children: number;
  readonly scope: SpaceRef['scope'];
  readonly scopeId: string;
}

/** The top-level documents of the outline's spaces, nearest first, with how many are below each. */
function rootsOf(outline: readonly SpaceOutline[]): RootDoc[] {
  const roots: RootDoc[] = [];
  for (const { space, docs } of outline) {
    const children = new Map<string, number>();
    for (const doc of docs)
      if (doc.parentId)
        children.set(doc.parentId, (children.get(doc.parentId) ?? 0) + 1);
    for (const doc of docs)
      if (!doc.parentId)
        roots.push({
          slug: doc.slug,
          title: doc.title,
          summary: doc.summary.replace(/\s+/gu, ' ').trim(),
          children: children.get(doc.id) ?? 0,
          scope: space.scope,
          scopeId: space.scopeId,
        });
  }
  return roots;
}

function knowledgeSection(
  roots: readonly RootDoc[],
  mounted: boolean,
  hasProject: boolean,
): string[] {
  const lines = [
    '## Knowledge',
    '',
    `Your team keeps conventions, pitfalls and decisions in its knowledge base${hasProject ? ', for this project and system-wide' : ''}. People maintain it: trust it over guesses, and read a document before you work in the area it covers.`,
    '',
  ];
  if (roots.length === 0) {
    lines.push(
      'There are no documents yet. `nb-studio kb list` shows documents added after this run started.',
    );
    return lines;
  }
  lines.push(
    mounted
      ? `The documents as of the start of this run are in \`${KNOWLEDGE_TARGET}/\` in your work directory: start with its \`INDEX.md\`, then read or grep the files (\`project/\` and \`system/\`). Each file names its version; \`nb-studio kb read <slug>\` prints the current one. A file someone uploaded (a PDF, a spreadsheet) is there as its extracted text; \`nb-studio kb download <slug>\` saves the original.`
      : 'Read a document with `nb-studio kb read <slug>`; `nb-studio kb tree` lists them all and `nb-studio kb search "<words>"` searches them.',
    '',
    'Top-level documents:',
  );
  for (const root of roots) {
    const below =
      root.children > 0
        ? ` (${root.children} below it: \`nb-studio kb list --parent ${root.slug}\`)`
        : '';
    lines.push(
      `- **${root.title}** (\`${root.slug}\`, ${root.scope === SYSTEM_SCOPE ? 'system-wide' : 'this project'}): ${root.summary || '(no summary)'}${below}`,
    );
  }
  return lines;
}

/** What a conversation run is told: the documents of its spaces, read through `nb-studio kb`, never mounted. */
function conversationSection(
  roots: readonly RootDoc[],
  projects: readonly { readonly id: string; readonly name: string }[],
  propose: boolean,
): string[] {
  const named = new Map(projects.map((project) => [project.id, project.name]));
  const lines = [
    '## Knowledge',
    '',
    `Your team keeps conventions, decisions and the user manual in its knowledge base. Answer from it when a question touches what it covers, and say which document you used. ${
      projects.length > 0
        ? `Without \`--project\`, \`nb-studio kb\` reads the system's documents and those of the projects this conversation is about: ${projects.map((project) => `${project.name} (\`${project.id}\`)`).join(', ')}.`
        : "Without `--project`, `nb-studio kb` reads the system's documents."
    } Add \`--project <id>\` to read another project the person sees.`,
    '',
    '- Search: `nb-studio kb search "<words>"`; each hit names its document, section and lines.',
    '- Read one: `nb-studio kb read <slug>`; list them: `nb-studio kb tree`. A file reads as its extracted text; `nb-studio kb download <slug>` saves the original.',
    ...(propose
      ? [
          '- Only when the person asks you to record something: `nb-studio kb propose --title "..." --content-file ./kb.md --reason "..."` (or `--doc <slug>` to update one; prefer updating the document that covers it). Someone who may edit decides; you never edit knowledge.',
        ]
      : []),
  ];
  if (roots.length === 0) {
    lines.push('', 'There are no documents yet.');
    return lines;
  }
  lines.push('', 'Top-level documents:');
  for (const root of roots)
    lines.push(
      `- **${root.title}** (\`${root.slug}\`, ${root.scope === SYSTEM_SCOPE ? 'system-wide' : `project ${named.get(root.scopeId) ?? root.scopeId}`}): ${root.summary || '(no summary)'}${root.children > 0 ? ` (${root.children} below it)` : ''}`,
    );
  return lines;
}

function manualSection(
  lines: PreparedKnowledge['manualLines'],
  mounted: boolean,
): string[] {
  return [
    '## User manual',
    '',
    `The knowledge base holds the user manual (\`${MANUAL_ROOT}\` and the pages below it, system-wide). It is part of delivery: if your change alters what users see or do (screens, flows, permissions, CLI commands), before you deliver:`,
    '',
    mounted
      ? `1. Find the pages it affects under \`${KNOWLEDGE_TARGET}/system/${MANUAL_ROOT}/\` (or \`nb-studio kb tree\`) and read each.`
      : `1. Find the pages it affects with \`nb-studio kb tree\` and read each with \`nb-studio kb read <slug>\`.`,
    '2. Propose each updated page whole (`nb-studio kb propose --doc <slug> --content-file ./page.md --reason "..."`). A page you checked that needs no change: `nb-studio kb propose --doc <slug> --verify --reason "..."`.',
    `3. End your delivery comment with one line: \`${lines.updated}\` naming the pages, or \`${lines.none}\` when nothing users see changed.`,
  ];
}

export function knowledgeBriefSection(
  deps: KnowledgeBriefDeps,
): BriefSectionProvider {
  return {
    key: 'studio-knowledge',
    order: 10,
    prepare: prepareKnowledge(deps),
    async section(conn, claim, assembly, prepared) {
      const ready = prepared as PreparedKnowledge | undefined;
      const rights = rightsOf(claim, ready);
      if (!ready || !rights.read) return null;
      const outline = await deps.knowledge().outline(conn, ready.readable);
      const roots = rootsOf(outline);
      if (ready.conversation)
        return conversationSection(
          roots,
          ready.conversation.projects,
          rights.propose,
        ).join('\n');
      const mounted =
        roots.length > 0 && Boolean(claim.runner?.features.includes('mounts'));
      const parts = [knowledgeSection(roots, mounted, Boolean(ready.project))];
      if (rights.propose) {
        const manual = outline
          .find(({ space }) => space.scope === SYSTEM_SCOPE)
          ?.docs.some((doc) => doc.slug === MANUAL_ROOT);
        const issue = (
          assembly.data as { issue?: { status?: { category?: string } } }
        ).issue;
        if (manual && issue?.status?.category === 'started')
          parts.push(manualSection(ready.manualLines, mounted));
      }
      return parts.map((part) => part.join('\n')).join('\n\n');
    },
  };
}
