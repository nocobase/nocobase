/**
 * The knowledge a conversation run reads. A conversation belongs to no project, so its spaces are the system's and
 * those of the projects its person put in front of the agent: the projects, and the projects of the issues, named in
 * the page contexts of the conversation's recent messages, newest first, as the person sees them now. `nb-studio kb
 * --project` reads another project the person sees.
 */
import type {
  Agents,
  ConversationRef,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import type { PermissionSource } from '../agents/commands/permissions.js';

/** Messages whose page context is read, newest first. */
const MESSAGES_READ = 50;
/** Projects a conversation reads at most. */
export const CONVERSATION_PROJECTS_MAX = 5;

export interface ConversationKnowledge {
  readonly conversation: ConversationRef;
  /** Nearest first: the projects of the newest page contexts first. */
  readonly projects: readonly { readonly id: string; readonly name: string }[];
}

export type ConversationKnowledgeOf = (
  run: Pick<Run, 'subject' | 'actorUserId'>,
) => Promise<ConversationKnowledge | null>;

/** The conversation a run works on and its projects; null for a run on anything else. */
export function conversationKnowledge(deps: {
  readonly agents: () => Pick<Agents, 'conversations' | 'tx'>;
  readonly projects: () => Pick<Projects, 'projects' | 'issueQueries'>;
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
}): ConversationKnowledgeOf {
  return async (run) => {
    const agents = deps.agents();
    const conversation = await agents.conversations.ofRun(
      agents.tx.read(),
      run,
    );
    if (!conversation) return null;
    const userId = conversation.userId;
    const viewer = await deps.permissions.viewerOf({
      kind: 'user',
      userId,
      displayName: userId,
    });
    const page = await agents.conversations
      .messages(userId, conversation.id, { limit: MESSAGES_READ })
      .catch(() => null);
    const refs: { kind: string; id: string }[] = [];
    for (const message of [...(page?.items ?? [])].reverse()) {
      const context = message.workContext;
      if (!context) continue;
      refs.push(...context.items);
      if (context.selection?.source) refs.push(context.selection.source);
    }
    const found = new Map<string, string>();
    const services = deps.projects();
    for (const ref of refs) {
      if (found.size >= CONVERSATION_PROJECTS_MAX) break;
      let projectId: string | null = null;
      if (ref.kind === 'project') projectId = ref.id;
      else if (ref.kind === 'issue')
        projectId =
          (await services.issueQueries.detail(viewer, ref.id).catch(() => null))
            ?.projectId ?? null;
      if (!projectId || found.has(projectId)) continue;
      const project = await services.projects
        .get(viewer, projectId)
        .catch(() => null);
      if (project) found.set(project.id, project.name);
    }
    return {
      conversation,
      projects: [...found].map(([id, name]) => ({ id, name })),
    };
  };
}
