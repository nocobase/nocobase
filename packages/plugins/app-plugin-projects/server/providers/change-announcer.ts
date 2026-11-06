/**
 * Turns domain events into the realtime announcements open pages refresh from (`PM_REALTIME_TOPIC`): the events of a
 * moment are gathered into one announcement per kind of data, so a write that emits several events, or an agent
 * writing in bursts, makes each page refetch once. An issue announcement names the issues that changed when every event
 * named one, including list membership changes; a page refreshes its lists and only the named issue details.
 */
import type { PmChangeDomain, PmChangeEvent } from '../../shared/realtime.js';

/** How long events are gathered before they are announced. */
export const ANNOUNCE_DELAY_MS = 250;

/** Maximum issue IDs per announcement; larger batches are split. */
export const ANNOUNCED_ISSUES_MAX = 100;

/** The kind of data an event changed, as the browser refreshes it. */
export function domainOf(type: string): PmChangeDomain {
  if (type.startsWith('label.')) return 'labels';
  if (type.startsWith('plan.') || type.startsWith('intake.')) return 'plans';
  return 'issues';
}

/** Membership changes still refresh lists while preserving the scope of task details. */
function movesLists(event: AnnouncedEvent): boolean {
  return (
    ['issue.created', 'issue.deleted', 'issue.restored'].includes(event.type) ||
    (event.type === 'issue.changed' && event.moved === true) ||
    (event.type === 'issue.updated' &&
      typeof event.changes === 'object' &&
      event.changes !== null &&
      ('owner' in event.changes || 'status' in event.changes))
  );
}

/** What the announcer reads of a domain event. */
export interface AnnouncedEvent {
  readonly type: string;
  readonly issueId?: unknown;
  readonly parentIssueId?: unknown;
  readonly childIssueIds?: unknown;
  readonly changes?: unknown;
  readonly moved?: unknown;
  readonly discussionOnly?: unknown;
  readonly mentions?: unknown;
  readonly notice?: {
    readonly kind?: unknown;
    readonly type?: unknown;
    readonly actor?: { readonly type?: unknown };
  };
}

export interface ChangeAnnouncer {
  add(event: AnnouncedEvent): void;
  /** Announces what is gathered now. */
  flush(): void;
  close(): void;
}

export function createChangeAnnouncer(
  publish: (event: PmChangeEvent) => void,
  delayMs: number = ANNOUNCE_DELAY_MS,
): ChangeAnnouncer {
  // Per domain: the issues named so far, or null once an event names none.
  let pending = new Map<PmChangeDomain, Set<string> | null>();
  let discussionOnly = true;
  let listsChanged = false;
  let comment = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const gathered = pending;
    const discussions = discussionOnly && comment;
    const moved = listsChanged;
    pending = new Map();
    discussionOnly = true;
    listsChanged = false;
    comment = false;
    for (const [domain, issueIds] of gathered) {
      if (domain !== 'issues' || !issueIds?.size) {
        publish({ kind: 'pm.changed', domain });
        continue;
      }
      const ids = [...issueIds];
      for (let at = 0; at < ids.length; at += ANNOUNCED_ISSUES_MAX)
        publish({
          kind: 'pm.changed',
          domain,
          issueIds: ids.slice(at, at + ANNOUNCED_ISSUES_MAX),
          ...(discussions ? { discussionOnly: true } : {}),
          ...(moved ? { listsChanged: true } : {}),
        });
    }
  };

  return {
    add(event) {
      // Notices and opaque executor announcements are delivery events. The issue
      // events own their scope; waiting or work still prevents a discussion-only read.
      if (event.type.startsWith('notice.') || event.type === 'work.announced') {
        if (!(
          event.type === 'notice.planned' &&
          event.notice?.kind === 'info' &&
          event.notice.type === 'commented' &&
          typeof event.notice.actor?.type === 'string' &&
          event.notice.actor.type !== 'user'
        ))
          discussionOnly = false;
        if (!timer) {
          timer = setTimeout(flush, delayMs);
          timer.unref?.();
        }
        return;
      }
      listsChanged ||= movesLists(event);
      const safeComment =
        event.type === 'comment.created' &&
        event.discussionOnly === true &&
        Array.isArray(event.mentions) &&
        event.mentions.length === 0;
      comment ||= safeComment;
      discussionOnly &&=
        safeComment ||
        (event.type === 'issue.changed' &&
          event.discussionOnly === true &&
          event.moved !== true);
      const domain = domainOf(event.type);
      const ids =
        event.type === 'issue.batchDone' &&
        typeof event.parentIssueId === 'string' &&
        Array.isArray(event.childIssueIds) &&
        event.childIssueIds.every(
          (id) => typeof id === 'string' && id.length > 0,
        )
          ? [event.parentIssueId, ...(event.childIssueIds as string[])]
          : typeof event.issueId === 'string' && event.issueId.length > 0
            ? [event.issueId]
            : null;
      const current = pending.get(domain);
      if (domain !== 'issues' || ids === null) pending.set(domain, null);
      else if (current === undefined) pending.set(domain, new Set(ids));
      else for (const id of ids) current?.add(id);
      if (!timer) {
        timer = setTimeout(flush, delayMs);
        timer.unref?.();
      }
    },
    flush,
    close() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      pending = new Map();
      discussionOnly = true;
      listsChanged = false;
      comment = false;
    },
  };
}
