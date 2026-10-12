/**
 * "My follow-ups" (`/follow-ups`, `server/follow-ups/`): the issues a person owns that are still open, and up to
 * `FOLLOW_UPS_MAX` issues they follow, each with what it waits for now and, for a followed one, how much happened on it
 * since they last looked.
 *
 * | Method | Route                                      | Body                    | `data`            |
 * | ------ | ------------------------------------------ | ----------------------- | ----------------- |
 * | GET    | `followUps`                                |                         | `FollowUpsView`   |
 * | PUT    | `followUps/following`                      | `{ issueIds }`          | `FollowingView`   |
 * | POST   | `followUps/issues/:issueId/markSeen`       |                         | (204)             |
 *
 * What a person follows and when they last looked at each issue are their own preferences (the users plugin's
 * `/api/users/me/preferences`, keys `FOLLOWING_PREFERENCE` and `SEEN_PREFERENCE`); the routes above are what writes
 * them, so the limits hold.
 */
import type { IssueProgress } from './project-manager.js';

/** The most issues a person follows. */
export const FOLLOW_UPS_MAX = 5;

/** The statuses of the issues a person owns that the page lists, in the order it shows them. */
export const FOLLOW_UP_STATUSES = [
  'in_review',
  'blocked',
  'in_progress',
  'backlog',
] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

/** The most owned issues read per status. */
export const OWNED_PER_STATUS_MAX = 100;

/** The followed issues, in order: an array of issue ids. */
export const FOLLOWING_PREFERENCE = 'studio.follow-ups.following';

/** When the person last looked at an issue: issue id to an RFC 3339 time. */
export const SEEN_PREFERENCE = 'studio.follow-ups.seen';

/** The most issues a last-seen time is kept for; the oldest go first, followed ones never. */
export const SEEN_MAX = 50;

/** The highest unread count reported; more reads as this many. */
export const UNREAD_MAX = 99;

export interface FollowUpIssue {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly statusKey: string;
  readonly projectId: string | null;
  readonly executorName: string | null;
  readonly lastActivityAt: string;
  /** The viewer owns it. */
  readonly owned: boolean;
  /** The viewer follows it (or would by default, while they never chose). */
  readonly followed: boolean;
  /** What it waits for now; null for an owned issue in backlog, which waits for nothing. */
  readonly progress: IssueProgress | null;
  /** Comments and changes by others since `seenAt`, at most `UNREAD_MAX`; 0 when never seen or not followed. */
  readonly unread: number;
  readonly seenAt: string | null;
}

export interface FollowUpsView {
  /** The followed issues' ids in order, those the viewer can no longer see left out. */
  readonly following: readonly string[];
  /** Whether the person chose them; otherwise they are the default: their blocked and in-review issues, newest first. */
  readonly followingStored: boolean;
  /** The issues the viewer owns in `FOLLOW_UP_STATUSES`, then the followed ones they do not own. */
  readonly issues: readonly FollowUpIssue[];
  /** How many issues the viewer owns in each status, counting at most `OWNED_PER_STATUS_MAX`. */
  readonly counts: Readonly<Record<FollowUpStatus, number>>;
  /** Some status has more owned issues than were read. */
  readonly truncated: boolean;
}

export interface FollowingView {
  readonly issueIds: readonly string[];
}

/** The followed ids a stored value holds: unique strings, at most `FOLLOW_UPS_MAX`; null when it holds none. */
export function parseFollowing(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      ),
    ),
  ];
  return ids.slice(0, FOLLOW_UPS_MAX);
}

/** The last-seen times a stored value holds, by issue id. */
export function parseSeen(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return {};
  const seen: Record<string, string> = {};
  for (const [id, at] of Object.entries(value as Record<string, unknown>))
    if (typeof at === 'string' && !Number.isNaN(Date.parse(at))) seen[id] = at;
  return seen;
}

/** `seen` with at most `SEEN_MAX` entries: the followed ones, then the most recently seen. */
export function pruneSeen(
  seen: Readonly<Record<string, string>>,
  keep: readonly string[],
): Record<string, string> {
  const kept = new Set(keep);
  const entries = Object.entries(seen).sort(
    ([idA, a], [idB, b]) =>
      Number(kept.has(idB)) - Number(kept.has(idA)) ||
      Date.parse(b) - Date.parse(a),
  );
  return Object.fromEntries(entries.slice(0, SEEN_MAX));
}
