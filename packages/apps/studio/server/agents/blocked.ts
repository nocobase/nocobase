/**
 * An agent that cannot go on, with its `agent_blocked` decision card: the agent comments what it needs
 * and moves its issue to Blocked; the issue's owner gets a card (`agent_blocked`, through the projects plugin's notices
 * as a notice rule, so source `projects` and only for an owner who may see the issue) with the agent's question, and
 * answers it, unblocks the issue or gives it to someone else, all through the projects plugin's own API.
 *
 * The card settles (`StudioInboxPort.settle`, by the issue and the type) when what it asks is done, by whoever:
 *
 * - a person's comment on the issue that is not a `/note` answers it, for that person (`answered`);
 * - the issue leaves Blocked (`unblocked`);
 * - another executor takes the issue from the agent (`reassigned`).
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type {
  NoticeRule,
  PlannedNotice,
  Projects,
} from '@nocobase/app-plugin-projects/server/tokens';

import type { StudioInboxPort } from '../inbox/port.js';
import { ISSUE_SUBJECT, PROJECTS_SOURCE } from '../inbox/projects.js';
import { agentNameParams } from './agent-name.js';
import { AGENT_KIND } from './tx.js';

/** The notice type of the card. */
export const AGENT_BLOCKED = 'agent_blocked';

/** The built-in status an agent reports itself blocked in. */
export const BLOCKED_STATUS = 'blocked';

/** How much of the agent's question the card carries. */
const QUESTION_LENGTH = 500;

type BlockedProjects = Pick<Projects, 'issueContext' | 'commentQueries'>;

/** The owner's card when an agent moves its issue to Blocked; `agents` words a built-in agent's name. */
export function agentBlockedRule(
  projects: () => BlockedProjects,
  agents?: Pick<Agents, 'agents'>,
): NoticeRule {
  return async (context) => {
    const { tx, events } = context;
    const notices: PlannedNotice[] = [];
    for (const event of events) {
      if (event.type !== 'issue.updated') continue;
      const status = event.changes.status;
      if (
        !status ||
        status.to !== BLOCKED_STATUS ||
        status.from === BLOCKED_STATUS ||
        event.actor.type !== AGENT_KIND ||
        !event.actor.id
      )
        continue;
      const issue = await projects().issueContext.contextFor(
        tx.conn,
        event.issueId,
      );
      if (!issue) continue;
      const agentId = event.actor.id;
      const agentName =
        (await context.nameOf(AGENT_KIND, agentId)) ?? 'An agent';
      const agent = await agents?.agents.find(tx.conn, agentId);
      // What the agent asked: its newest comment on the issue.
      const question = [
        ...(await projects().commentQueries.list(tx.conn, issue.id)),
      ]
        .reverse()
        .find(
          (comment) =>
            !comment.deleted &&
            comment.authorType === AGENT_KIND &&
            comment.authorId === agentId,
        );
      notices.push({
        key: `agents:blocked:${issue.id}:${event.revision}`,
        kind: 'decision',
        type: AGENT_BLOCKED,
        issue: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
        },
        userIds: [issue.owner.id],
        actor: { type: AGENT_KIND, id: agentId, name: agentName },
        slot: 'change',
        params: {
          title: `${agentName} is blocked on ${issue.identifier}`,
          body: `${agentName} is blocked and needs your input. Answer it, unblock the issue, or give it to someone else.`,
          identifier: issue.identifier,
          actorName: agentName,
          ...agentNameParams(agent?.nameText),
          agentId,
          from: status.from,
          ...(question
            ? {
                commentId: question.id,
                question: question.content.slice(0, QUESTION_LENGTH),
              }
            : {}),
        },
      });
    }
    return notices;
  };
}

/** Settles the issue's blocked cards once they are answered, unblocked or reassigned; returns what stops it. */
export function settleBlockedCards(
  projects: Pick<Projects, 'events'>,
  port: () => StudioInboxPort | undefined,
  onError: (error: unknown) => void,
): () => void {
  const settle = (
    issueId: string,
    outcome: string,
    userIds?: readonly string[],
  ) => {
    const inbox = port();
    if (!inbox) return;
    inbox
      .settle({
        source: PROJECTS_SOURCE,
        subject: { type: ISSUE_SUBJECT, id: issueId },
        types: [AGENT_BLOCKED],
        ...(userIds ? { userIds } : {}),
        outcome,
      })
      .catch(onError);
  };
  const stops = [
    projects.events.on('issue.updated', (event) => {
      const { status, executor } = event.changes;
      if (status?.from === BLOCKED_STATUS && status.to !== BLOCKED_STATUS)
        settle(event.issueId, 'unblocked');
      // Only an agent was ever blocked here: taking the issue from one settles its card.
      else if (executor?.from?.type === AGENT_KIND)
        settle(event.issueId, 'reassigned');
    }),
    projects.events.on('comment.created', (event) => {
      if (event.actor.type !== 'user' || !event.actor.id || event.note) return;
      settle(event.issueId, 'answered', [event.actor.id]);
    }),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
