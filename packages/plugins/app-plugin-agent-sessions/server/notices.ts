/** Replies settle when read; permission requests settle only when processed, invalidated or archived. */
import type { SessionEvent } from '@nocobase/acp-bridge/protocol';

export type SessionNoticeType =
  'permissionRequested' | 'turnEnded' | 'turnFailed';

export interface SessionNotice {
  /** The same notice twice has the same key: the session, the event's place and the type. */
  readonly key: string;
  readonly type: SessionNoticeType;
  readonly userId: string;
  readonly sessionId: string;
  /** The session's title as its page shows it. */
  readonly title: string;
  /** The agent's name. */
  readonly agent: string;
  /** What the agent asks to do, or why the turn failed; null for an answer. */
  readonly detail: string | null;
  readonly at: string;
}

export interface SessionNoticeSettle {
  readonly userId: string;
  readonly sessionId: string;
  /** Only notices of these types; all when left out. */
  readonly types?: readonly SessionNoticeType[];
  /** Why they no longer hold: the owner `seen` the session, `answered` the request, or `archived` the session. */
  readonly outcome: 'seen' | 'answered' | 'archived';
}

export interface SessionNotices {
  send(notice: SessionNotice): Promise<void>;
  settle(ref: SessionNoticeSettle): Promise<void>;
}

/** How long an event waits for its owner to see it before they are told. */
export const NOTICE_DELAY_MS = 20_000;

const MAX_DETAIL = 500;

/** What `event` tells its owner of, if anything. */
export function noticeOf(
  event: SessionEvent,
):
  | { readonly type: SessionNoticeType; readonly detail: string | null }
  | undefined {
  if (event.kind === 'permissionRequested') {
    const title = event.toolCall.title;
    return {
      type: 'permissionRequested',
      detail:
        typeof title === 'string' && title ? title.slice(0, MAX_DETAIL) : null,
    };
  }
  if (event.kind !== 'turnEnded') return undefined;
  if (event.error)
    return { type: 'turnFailed', detail: event.error.slice(0, MAX_DETAIL) };
  return event.stopReason === 'cancelled'
    ? undefined
    : { type: 'turnEnded', detail: null };
}
