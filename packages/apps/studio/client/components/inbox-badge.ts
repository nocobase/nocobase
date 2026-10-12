import { useEffect } from 'react';

/**
 * What the inbox button shows: the count of what waits on the viewer (`decisions`), or, with none waiting, the count
 * of unread items; nothing otherwise.
 *
 * What waits wins outright rather than adding up with the unread items. The two overlap: a waiting decision is also an
 * unread item until opened, so a sum would count it twice. And a sum would blur what the badge means: amber says
 * "needs you", which an unread notification does not.
 */
export type InboxBadge = {
  readonly kind: 'decisions' | 'unread';
  readonly count: number;
  readonly text: string;
} | null;

/** The badge's text for `count`: "99+" above 99 so the badge keeps its size, none at zero. */
export function inboxBadgeText(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}

export function inboxBadge(decisions: number, unread: number): InboxBadge {
  const pending = inboxBadgeText(decisions);
  if (pending) return { kind: 'decisions', count: decisions, text: pending };
  const text = inboxBadgeText(unread);
  return text ? { kind: 'unread', count: unread, text } : null;
}

const TITLE_COUNT = /^\(\d+\+?\) /;

/**
 * The browser tab title with the badge text in front (`(3) Inbox`), or without it when `text` is null. Any earlier
 * count prefix is replaced, so applying it again never stacks prefixes.
 */
export function inboxTitle(title: string, text: string | null): string {
  const base = title.replace(TITLE_COUNT, '');
  return text ? `(${text}) ${base}` : base;
}

/** Puts the badge text in front of the browser tab title while mounted, and takes it off again. */
export function useDocumentTitleBadge(text: string | null): void {
  useEffect(() => {
    document.title = inboxTitle(document.title, text);
    return () => {
      document.title = inboxTitle(document.title, null);
    };
  }, [text]);
}
