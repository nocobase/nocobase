/** An inbox item as `GET /api/inbox/items` answers it (`inbox list`), and its page tokens. */
import type { InboxEntry } from '../agents/conversation/inbox.js';

export interface InboxItemView {
  readonly id: string;
  readonly kind: InboxEntry['kind'];
  readonly type: string;
  readonly pending: boolean;
  readonly read: boolean;
  /** The issue it is about (`PM-12`). */
  readonly issue: string | null;
  readonly title: string;
  readonly body: string;
  readonly url: string | null;
  readonly createdAt: string;
}

export function itemView(entry: InboxEntry): InboxItemView {
  return {
    id: entry.id,
    kind: entry.kind,
    type: entry.type,
    pending: entry.pending,
    read: entry.read,
    issue: entry.issueIdentifier,
    title: entry.title,
    body: entry.body,
    url: entry.url,
    createdAt: entry.createdAt,
  };
}

export interface ItemCursor {
  readonly createdAt: string;
  readonly id: string;
}

export function encodeItemToken(entry: ItemCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: entry.createdAt, id: entry.id }),
  ).toString('base64url');
}

/** The cursor a token names; undefined for a token this list did not issue. */
export function decodeItemToken(token: string): ItemCursor | undefined {
  try {
    const parsed = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8'),
    ) as { createdAt?: unknown; id?: unknown } | null;
    return parsed &&
      typeof parsed.createdAt === 'string' &&
      !Number.isNaN(Date.parse(parsed.createdAt)) &&
      typeof parsed.id === 'string' &&
      parsed.id
      ? { createdAt: parsed.createdAt, id: parsed.id }
      : undefined;
  } catch {
    return undefined;
  }
}
