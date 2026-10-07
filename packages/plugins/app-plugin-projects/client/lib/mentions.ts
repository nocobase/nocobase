/**
 * Mentions in Markdown text: `[@Name](mention://<kind>/<id>)` names a principal of a kind (`lib/kinds.ts`), such as
 * `mention://user/<id>` for a member, the same markup the server reads (`server/kernel/mentions.ts`).
 */

/** A kind's key. */
export type MentionKind = string;

/** The `<kind>` part of a mention URL. */
export const MENTION_KIND_PATTERN = '[a-z][a-z0-9_]{1,31}';

export interface MentionQuery {
  /** Index of the `@` that opened the query. */
  readonly start: number;
  /** Text typed after the `@`, up to the caret. */
  readonly query: string;
}

/**
 * The `@query` the caret is completing, or null. An `@` opens a query only at the start of the text or after
 * whitespace or an opening bracket, so an email address does not open the picker; whitespace ends it.
 */
export function findMentionQuery(
  text: string,
  caret: number,
): MentionQuery | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at < 0) return null;
  const preceding = at === 0 ? '' : before[at - 1];
  if (preceding !== '' && !/[\s([]/u.test(preceding ?? '')) return null;
  const query = before.slice(at + 1);
  if (/\s/u.test(query) || query.length > 40) return null;
  return { start: at, query };
}

/** Parses `mention://<kind>/<id>`, or null for any other URL. */
export function parseMentionHref(
  href: string | undefined,
): { readonly kind: MentionKind; readonly id: string } | null {
  if (!href) return null;
  const match = new RegExp(
    `^mention://(${MENTION_KIND_PATTERN})/([^/?#\\s]+)$`,
    'u',
  ).exec(href);
  return match?.[1] && match[2]
    ? { kind: match[1], id: decodeURIComponent(match[2]) }
    : null;
}
