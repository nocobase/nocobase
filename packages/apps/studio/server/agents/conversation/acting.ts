/**
 * Who a command of a run acts as. A run on a conversation acts for the conversation's owner, the person who asked: its
 * changes are theirs, marked "via ‹Agent›" (`Actor.via: 'agent'` with the run and the conversation in its trace), and it
 * may do what they may do and the agent is configured for; so does an agent consulted from it (`ask_agent`), which only
 * reads and proposes plans there. Any other run (an agent working on an issue) acts as the
 * agent itself, as before.
 */
import type { Actor } from '@nocobase/app-plugin-projects/server/tokens';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';
import type { ConversationRef } from '@nocobase/app-plugin-agents/server/tokens';
import type { ConfirmChanges } from '@nocobase/app-plugin-agents/shared/agents';

/** A conversation run, and the person it acts for. */
export interface Asker {
  readonly conversation: ConversationRef;
  /** The person: the conversation's owner, who woke the run. */
  readonly userId: string;
  readonly runId: string;
  readonly agentId: string;
  readonly agentName: string;
  /** The agent's "confirm before changing data" (`Agent.confirmChanges`): `always` refuses every direct write. */
  readonly confirmChanges: ConfirmChanges;
}

export type AskerLookup = (identity: CallerIdentity) => Promise<Asker | null>;

/** Looks the conversation of a run up once per request (the identity is made per request). */
export function createAskerLookup(
  agents: Pick<Agents, 'conversations' | 'tx'>,
): AskerLookup {
  const known = new WeakMap<CallerIdentity, Promise<Asker | null>>();
  return (identity) => {
    const record = identity.run?.run;
    if (identity.kind !== 'run' || !record || !identity.agent)
      return Promise.resolve(null);
    const agent = identity.agent;
    let found = known.get(identity);
    if (!found) {
      // A consulted agent's run (`parentRunId`) acts for the person of the conversation that asked it.
      found = agents.conversations
        .homeOf(agents.tx.read(), {
          subject: { kind: record.subjectKind, id: record.subjectId },
          actorUserId: record.actorUserId,
          parentRunId: record.parentRunId ?? null,
        })
        .then((conversation) =>
          conversation
            ? {
                conversation,
                userId: conversation.userId,
                runId: record.id,
                agentId: agent.id,
                agentName: agent.name,
                confirmChanges: agent.confirmChanges,
              }
            : null,
        );
      known.set(identity, found);
    }
    return found;
  };
}

/** The person as the actor of a conversation run's changes: theirs, via the agent. */
export function askerActor(asker: Asker): Actor {
  return {
    type: 'user',
    id: asker.userId,
    via: 'agent',
    trace: {
      agentId: asker.agentId,
      runId: asker.runId,
      conversationId: asker.conversation.id,
    },
  };
}
