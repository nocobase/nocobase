/**
 * Types shared by the server, the web client and the CLI: the API's common shapes. Each domain has its own file
 * beside this one.
 */

/** A code and a message, as a plan row's failure records it (`PlanRowCheck.error`). */
export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/**
 * One page of a list as the services answer it, and the cursor of the next page (null on the last). The API answers
 * `{ data, meta: { nextPageToken? } }` instead, the token being this cursor.
 */
export interface Page<T> {
  readonly data: readonly T[];
  readonly nextCursor: string | null;
}

export const PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const COLORS = [
  'gray',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
] as const;
export type Color = (typeof COLORS)[number];

/** Someone named in a response: an id and a display name. */
export interface UserRef {
  readonly id: string;
  readonly name: string;
}
