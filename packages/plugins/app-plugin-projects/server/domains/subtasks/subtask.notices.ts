/**
 * The notices sub-issues and dependencies send, as rules from an event to a notice: who is told and in which words
 * (already in the application's default language, with `params` for an inbox that words them per reader). The
 * provider (`providers/notifications.ts`) runs them after the change commits. Nobody is told about their own action.
 *
 * | Type                  | Event                       | Who                                                         |
 * | --------------------- | --------------------------- | ----------------------------------------------------------- |
 * | `dependency_released` | `issue.dependencyReleased`  | the executor when a person works on it; else, with nobody   |
 * |                       |                             | working on it, the owner; other kinds of executor: nobody   |
 * | `batch_done`          | `issue.batchDone`           | the parent's owner                                          |
 */
import { USER_KIND } from '../../../shared/kinds.js';
import type { DomainEvent } from '../../kernel/events.js';
import type { ProjectNotice } from '../../tokens.js';
import './subtask.events.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

const issuePath = (identifier: string) =>
  `/issues/${encodeURIComponent(identifier)}`;

/** `userIds` without whoever acted, when a person acted. */
function others(
  userIds: readonly string[],
  actor: { readonly type: string; readonly id: string | null },
): string[] {
  return userIds.filter((id) => !(actor.type === USER_KIND && actor.id === id));
}

export function dependencyReleasedNotice(
  event: DomainEvent<'issue.dependencyReleased'>,
  t: Translate,
): ProjectNotice | null {
  const recipients =
    event.executor === null
      ? [event.ownerUserId]
      : event.executor.type === USER_KIND
        ? [event.executor.id]
        : [];
  const userIds = others(recipients, event.actor);
  if (userIds.length === 0) return null;
  return {
    key: `pm:dependency-released:${event.issueId}:${event.releasedBy.issueId}:${event.releasedBy.revision}`,
    kind: 'info',
    type: 'dependency_released',
    userIds,
    title: t('notifications.dependencyReleased', {
      identifier: event.identifier,
      releasedBy: event.releasedBy.identifier,
    }),
    body: event.title,
    path: issuePath(event.identifier),
    issue: { id: event.issueId, identifier: event.identifier },
    params: {
      identifier: event.identifier,
      releasedByIdentifier: event.releasedBy.identifier,
    },
  };
}

export function batchDoneNotice(
  event: DomainEvent<'issue.batchDone'>,
  t: Translate,
): ProjectNotice | null {
  const userIds = others([event.ownerUserId], event.actor);
  if (userIds.length === 0) return null;
  return {
    key: `pm:batch-done:${event.parentIssueId}:${event.stage ?? 'all'}:${event.finishedBy.issueId}:${event.finishedBy.revision}`,
    kind: 'info',
    type: 'batch_done',
    userIds,
    title:
      event.stage === null
        ? t('notifications.batchDone', { identifier: event.identifier })
        : t('notifications.batchDoneStage', {
            identifier: event.identifier,
            stage: event.stage,
          }),
    body: event.title,
    path: issuePath(event.identifier),
    issue: { id: event.parentIssueId, identifier: event.identifier },
    params: {
      identifier: event.identifier,
      ...(event.stage === null ? {} : { stage: String(event.stage) }),
    },
  };
}
