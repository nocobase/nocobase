/**
 * Studio's inbox, as the server and the browser exchange it. An inbox item's text, read state and deletion belong to
 * the in-app notification plugin (`/api/notificationInApp/messages`); Studio keeps what the plugin does not: who sent the item
 * (`source`), what kind of item it is, what it is about, the sender's own values, and whether a decision it asks for is
 * still waiting (`/api/inbox`).
 *
 * Any package Studio assembles contributes items through Studio's inbox port (`studio/server/inbox/port.ts`) and words
 * and renders them in the browser through the inbox registry (`studio/client/inbox/contributions/`, rendered by the
 * inbox block in `studio/client/extensions/nocobase-inbox/`), both keyed by `source`.
 */

/** A decision someone must take, or information. */
export type InboxKind = 'decision' | 'info';

export const INBOX_KINDS: readonly InboxKind[] = ['decision', 'info'];

/**
 * How a decision ended, in its contributor's words (`approved`, `rejected`, `executed`…). `withdrawn` is what
 * `withdraw` records: the contributor took the question back.
 */
export type InboxOutcome = string;

export const INBOX_WITHDRAWN: InboxOutcome = 'withdrawn';

/** The longest `source`, `type` and `outcome`. */
export const INBOX_NAME_MAX = 64;
/** The longest `decisionKey`. */
export const INBOX_DECISION_KEY_MAX = 191;
/** The largest `data`, as JSON. */
export const INBOX_DATA_MAX = 16_384;

/** What an item is about, when it is about one thing: an issue (`{ type: 'issue', id, label: 'PM-12' }`), an app… */
export interface InboxSubject {
  readonly type: string;
  readonly id: string;
  /** How to name it in a list, such as an issue's identifier. */
  readonly label: string | null;
}

/** A JSON value. */
export type InboxJson =
  | string
  | number
  | boolean
  | null
  | readonly InboxJson[]
  | { readonly [key: string]: InboxJson };

/** The sender's own values, as JSON: what its renderer words and shows the item from. */
export interface InboxData {
  readonly [key: string]: InboxJson;
}

/** What Studio knows about one inbox item, found by the item's `notificationId`. */
export interface InboxNotice {
  readonly notificationId: string;
  /** Who sent it: the contributor's id, such as `projects`. */
  readonly source: string;
  readonly kind: InboxKind;
  /** What happened, such as `approval_requested`; the contributor's renderer words it. */
  readonly type: string;
  readonly subject: InboxSubject | null;
  /** The contributor's own key of the decision it asks for (an approval request's id); null for information. */
  readonly decisionKey: string | null;
  readonly data: InboxData | null;
  /** How many notices of the same group this item stands for (`×N` when more than one). */
  readonly count: number;
  /**
   * Set once a decision no longer waits, or once information no longer holds (a runner upgraded, a failed run's issue
   * finished); its contributor settled it.
   */
  readonly resolvedAt: string | null;
  readonly outcome: InboxOutcome | null;
}

/**
 * An in-app item as `/api/notificationInApp/messages` lists it, which `GET /api/inbox/waiting` returns with what Studio
 * knows about it.
 */
export interface InboxItemRecord {
  readonly id: string;
  readonly deliveryId: string;
  readonly notificationId: string;
  readonly title: string;
  readonly body: string;
  readonly target?:
    | { readonly type: 'route'; readonly path: string }
    | { readonly type: 'url'; readonly url: string };
  readonly readAt?: string;
  readonly createdAt: string;
}

/** A decision still waiting on the caller, with its in-app item (`GET /api/inbox/waiting`). */
export interface InboxWaiting {
  readonly item: InboxItemRecord;
  readonly notice: InboxNotice;
}

/** At most this many waiting decisions are listed: far more than anyone keeps waiting. */
export const INBOX_WAITING_MAX = 200;

/** The inbox showing the decisions that wait: where a decision is taken. */
export const INBOX_DECISIONS_PATH = '/inbox?view=todo';

/** `GET /api/inbox/pending`: waiting decisions and unread notifications for the caller's tabs. */
export interface InboxPending {
  readonly decision: number;
  /** Unread informational items, including notifications Studio did not send. */
  readonly info: number;
}

/** The realtime topic, per user, announcing that the caller's notices changed (a decision resolved). */
export const STUDIO_INBOX_TOPIC = 'studio:inbox';

export interface StudioInboxEvent {
  readonly kind: 'studio.inbox.changed';
}
