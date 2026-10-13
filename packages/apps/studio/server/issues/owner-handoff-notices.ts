import type {
  NoticeRule,
  ProjectsTx,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import type { StudioInboxPort } from '../inbox/port.js';
import {
  ownerHandoffRejectionRecipients,
  type OwnerHandoff,
} from './owner-handoff.js';

export const OWNER_HANDOFF_NOTICE = 'studio.ownerHandoff';
export interface HandoffAnnouncement {
  readonly issue: Pick<Issue, 'id' | 'identifier' | 'title'>;
  readonly handoff: OwnerHandoff;
  readonly previousNotificationKey?: string;
  readonly decision?: 'accept' | 'reject';
}
export const ownerHandoffNoticeKey = (key: string) => `owner-handoff:${key}`;
export function announceOwnerHandoff(
  tx: ProjectsTx,
  issue: HandoffAnnouncement['issue'],
  handoff: OwnerHandoff,
  previousNotificationKey?: string,
  decision?: HandoffAnnouncement['decision'],
): void {
  tx.emit({
    type: 'work.announced',
    kind: OWNER_HANDOFF_NOTICE,
    payload: {
      issue: { id: issue.id, identifier: issue.identifier, title: issue.title },
      handoff,
      previousNotificationKey,
      decision,
    } satisfies HandoffAnnouncement,
  });
}
export function ownerHandoffNoticeRule(): NoticeRule {
  return async ({ events }) =>
    events.flatMap((event) => {
      if (
        event.type !== 'work.announced' ||
        event.kind !== OWNER_HANDOFF_NOTICE
      )
        return [];
      const { issue, handoff, decision } = event.payload as HandoffAnnouncement;
      if (decision === 'accept' || (!decision && !handoff.waiting)) return [];
      const rejected = decision === 'reject';
      const title = rejected
        ? `Owner handoff rejected: ${issue.identifier}`
        : `Take over ${issue.identifier}`;
      const body = rejected
        ? 'The owner declined the handoff. The issue remains paused.'
        : 'Accept or reject the handoff on the issue. Agent work is paused until you accept.';
      return [
        {
          key: `${ownerHandoffNoticeKey(handoff.notificationKey)}${rejected ? ':rejected' : ''}`,
          kind: rejected ? ('info' as const) : ('decision' as const),
          type: rejected ? 'owner_handoff_rejected' : 'owner_handoff',
          issue,
          userIds: rejected
            ? ownerHandoffRejectionRecipients(handoff)
            : [handoff.ownerUserId],
          actor: { type: 'system' as const, id: null, name: 'Studio' },
          slot: 'change' as const,
          params: {
            title,
            body,
            identifier: issue.identifier,
            notificationKey: handoff.notificationKey,
          },
        },
      ];
    });
}
export async function settleOwnerHandoffNotice(
  port: StudioInboxPort,
  notice: HandoffAnnouncement,
): Promise<void> {
  if (notice.previousNotificationKey)
    await port.withdraw({
      source: 'projects',
      decisionKey: ownerHandoffNoticeKey(notice.previousNotificationKey),
    });
  if (notice.decision)
    await port.resolve({
      source: 'projects',
      decisionKey: ownerHandoffNoticeKey(notice.handoff.notificationKey),
      outcome: notice.decision === 'accept' ? 'accepted' : 'rejected',
    });
}
