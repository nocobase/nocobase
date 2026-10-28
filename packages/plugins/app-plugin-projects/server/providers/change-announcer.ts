/**
 * Turns domain events into the realtime announcements open pages refresh from (`PM_REALTIME_TOPIC`): the events of a
 * moment are gathered into one announcement per kind of data, so a write that emits several events, or an agent
 * writing in bursts, makes each page refetch once. An issue announcement names the issues that changed when every event
 * named one and none changed which lists an issue belongs in; a page then refreshes only what it shows of those issues.
 */
import type { PmChangeDomain, PmChangeEvent } from '../../shared/realtime.js';

/** How long events are gathered before they are announced. */
export const ANNOUNCE_DELAY_MS = 250;

/** More issues than this in one announcement are announced as "issues changed", without naming them. */
export const ANNOUNCED_ISSUES_MAX = 100;

/** The kind of data an event changed, as the browser refreshes it. */
export function domainOf(type: string): PmChangeDomain {
  if (type.startsWith('label.')) return 'labels';
  if (type.startsWith('plan.') || type.startsWith('intake.')) return 'plans';
  return 'issues';
}

/**
 * Events that may move an issue into or out of a list a page shows: created, deleted, restored, given to someone else,
 * moved to another status, or moved to another project, parent or executor.
 */
function movesLists(event: AnnouncedEvent): boolean {
  if (
    event.type === 'issue.created' ||
    event.type === 'issue.deleted' ||
    event.type === 'issue.restored' ||
    (event.type === 'issue.changed' && event.moved === true)
  )
    return true;
  return (
    event.type === 'issue.updated' &&
    typeof event.changes === 'object' &&
    event.changes !== null &&
    ('owner' in event.changes || 'status' in event.changes)
  );
}

/** What the announcer reads of a domain event. */
export interface AnnouncedEvent {
  readonly type: string;
  readonly issueId?: unknown;
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
  let comment = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const gathered = pending;
    const discussions = discussionOnly && comment;
    pending = new Map();
    discussionOnly = true;
    comment = false;
    for (const [domain, issueIds] of gathered)
      publish(
        domain === 'issues' &&
          issueIds &&
          issueIds.size > 0 &&
          issueIds.size <= ANNOUNCED_ISSUES_MAX
          ? {
              kind: 'pm.changed',
              domain,
              issueIds: [...issueIds],
              ...(discussions ? { discussionOnly: true } : {}),
            }
          : { kind: 'pm.changed', domain },
      );
  };

  return {
    add(event) {
      // Notices remain delivery events, not an additional refresh source. A waiting,
      // mention or unknown notice nevertheless prevents narrowing this batch.
      if (event.type.startsWith('notice.')) {
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
      const named =
        domain === 'issues' &&
        typeof event.issueId === 'string' &&
        !movesLists(event)
          ? event.issueId
          : null;
      const current = pending.get(domain);
      if (named === null) pending.set(domain, null);
      else if (current === undefined) pending.set(domain, new Set([named]));
      else current?.add(named);
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
      comment = false;
    },
  };
}
