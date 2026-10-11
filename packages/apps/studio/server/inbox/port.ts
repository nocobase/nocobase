/**
 * Studio's inbox port: how any package Studio assembles puts an item in people's inboxes, and settles the decision an
 * item asks for. Studio binds it (`studioInboxPortToken`, `StudioInboxProvider`); a package reaches it through the glue
 * Studio writes for it, which listens to the package's events and calls the port (`projects.ts` for the projects
 * plugin's notices; `../releases/inbox.ts` for release management's deployment requests and failed deployments).
 *
 * - `send` delivers one notice through the in-app channel and records, per recipient, who sent it (`source`), what it
 *   is about (`subject`, optional), the contributor's values (`data`) and, for a decision, the contributor's own key
 *   of it (`decisionKey`).
 * - `resolve` settles every recipient's item of a decision at once, with the contributor's own outcome; `withdraw`
 *   settles it as `withdrawn`. Both are found by `(source, decisionKey)`; settling again changes nothing.
 * - `settle` settles every item of a source about one subject that still stands, decisions and information alike
 *   (of some types, or for some recipients only): what the contributor no longer needs anyone to act on or know, such
 *   as a runner's upgrade notice once it upgraded, or a failed run's card once its issue finished.
 *
 * The browser words and renders items by `source` and `type` (`studio/client/inbox/contributions/`, rendered by the
 * inbox block in `studio/client/extensions/nocobase-inbox/`), so `title` and `body` are only the text the in-app item
 * keeps for a reader without that renderer, in the default language.
 */
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import {
  INBOX_DATA_MAX,
  INBOX_DECISION_KEY_MAX,
  INBOX_NAME_MAX,
  type InboxData,
  type InboxKind,
  type InboxOutcome,
  type InboxSubject,
} from '../../shared/inbox.js';

export interface InboxSend {
  /** Idempotency key: sending the same notice twice delivers it once. */
  readonly key: string;
  /** The contributor's id, such as `projects` or `releases`. */
  readonly source: string;
  readonly kind: InboxKind;
  /** What happened, such as `approval_requested`. */
  readonly type: string;
  readonly userIds: readonly string[];
  /** The in-app item's text, worded in the default language; an empty body repeats the title. */
  readonly title: string;
  readonly body: string;
  /** An app route opening what the item is about, such as `/issues/PM-12`. */
  readonly path?: string | null;
  /** What the item is about; leave it out for a notice about nothing in particular. */
  readonly subject?: InboxSubject | null;
  /** The contributor's own key of the decision a `decision` asks for; required for a decision. */
  readonly decisionKey?: string | null;
  /** Information of the same group and recipient merges into one inbox item, counted; scoped to the source. */
  readonly group?: string | null;
  /** Who did what the notice tells. */
  readonly actor?: {
    readonly type: string;
    readonly id: string | null;
    readonly name: string | null;
  } | null;
  /** The values the contributor's renderer words and shows the item from: a JSON object. */
  readonly data?: InboxData | null;
}

export interface InboxDecisionRef {
  readonly source: string;
  readonly decisionKey: string;
}

/** Which items `settle` settles: a source's items about one subject, optionally of some types or recipients. */
export interface InboxSettleRef {
  readonly source: string;
  readonly subject: { readonly type: string; readonly id: string };
  /** Only items of these types; every type when left out. */
  readonly types?: readonly string[];
  /** Only these recipients' items; everyone's when left out. */
  readonly userIds?: readonly string[];
  readonly outcome: InboxOutcome;
}

export interface StudioInboxPort {
  send(notice: InboxSend): Promise<void>;
  /** The decision no longer waits: `outcome` is how it ended, in the contributor's words. */
  resolve(
    ref: InboxDecisionRef & { readonly outcome: InboxOutcome },
  ): Promise<void>;
  /** The contributor took the question back: settled as `withdrawn`. */
  withdraw(ref: InboxDecisionRef): Promise<void>;
  /** Settles a source's items about a subject that still stand (`InboxSettleRef`), with `outcome`. */
  settle(ref: InboxSettleRef): Promise<void>;
}

/** Studio's inbox port, bound by `StudioInboxProvider`. */
export const studioInboxPortToken: ServiceToken<StudioInboxPort> =
  createServiceToken<StudioInboxPort>('studio/inbox/port');

/** A notice the port refuses: what is wrong with it, for the contributor's developer. */
export class InboxNoticeError extends Error {
  public override readonly name = 'InboxNoticeError';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

function name(label: string, value: unknown, max = INBOX_NAME_MAX): string {
  if (typeof value !== 'string' || value.trim() === '' || value.length > max)
    throw new InboxNoticeError(
      `${label} must be a non-empty string of at most ${max} characters.`,
    );
  return value;
}

/**
 * The notice as the port stores it, or an `InboxNoticeError` saying what is wrong: names within their lengths, a
 * decision with its key, a subject with a type and an id, and data a JSON object of at most `INBOX_DATA_MAX`
 * characters.
 */
export function checkInboxSend(notice: InboxSend): InboxSend {
  name('source', notice.source);
  name('type', notice.type);
  if (typeof notice.title !== 'string' || notice.title.trim() === '')
    throw new InboxNoticeError('title must be a non-empty string.');
  if (notice.kind !== 'decision' && notice.kind !== 'info')
    throw new InboxNoticeError('kind must be "decision" or "info".');
  if (notice.kind === 'decision')
    name('decisionKey', notice.decisionKey, INBOX_DECISION_KEY_MAX);
  else if (notice.decisionKey != null)
    throw new InboxNoticeError('Only a decision has a decisionKey.');
  if (notice.subject) {
    name('subject.type', notice.subject.type, 32);
    name('subject.id', notice.subject.id);
    if (notice.subject.label != null)
      name('subject.label', notice.subject.label, 191);
  }
  if (notice.data != null) {
    if (!isPlainObject(notice.data))
      throw new InboxNoticeError('data must be a JSON object.');
    let json: string;
    try {
      json = JSON.stringify(notice.data);
    } catch {
      throw new InboxNoticeError('data must be serializable as JSON.');
    }
    if (json.length > INBOX_DATA_MAX)
      throw new InboxNoticeError(
        `data must be at most ${INBOX_DATA_MAX} characters as JSON.`,
      );
  }
  return notice;
}

export function checkSettleRef(ref: InboxSettleRef): void {
  name('source', ref.source);
  name('subject.type', ref.subject.type, 32);
  name('subject.id', ref.subject.id);
  name('outcome', ref.outcome);
  for (const type of ref.types ?? []) name('type', type);
}

export function checkDecisionRef(ref: InboxDecisionRef): void {
  name('source', ref.source);
  name('decisionKey', ref.decisionKey, INBOX_DECISION_KEY_MAX);
}
