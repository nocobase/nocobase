/**
 * Mention markup in Markdown text (descriptions and comments): `[@Name](mention://<kind>/<id>)` names a principal of
 * a kind (`kernel/kinds.ts`), such as `mention://user/<userId>` for a member. The name is display text only; the id
 * decides who is meant.
 */
import type { MentionRef } from '../../shared/comments.js';

const MENTION =
  /\[@([^\]\n]*)\]\(mention:\/\/([a-z][a-z0-9_]{1,31})\/([A-Za-z0-9_.@-]+)\)/gu;
const NOTE = /^\s*\/note(?:\s|$)/u;

/** Every principal mentioned, of any kind, deduplicated in order of first appearance. */
export function mentions(text: string): MentionRef[] {
  const seen = new Set<string>();
  const refs: MentionRef[] = [];
  for (const [, , kind, id] of text.matchAll(MENTION)) {
    if (!kind || !id) continue;
    const key = `${kind}/${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ kind, id });
  }
  return refs;
}

/** The ids mentioned of one kind, deduplicated in order of first appearance. */
export function mentioned(text: string, kind: string): string[] {
  return mentions(text)
    .filter((ref) => ref.kind === kind)
    .map((ref) => ref.id);
}

/** Principals mentioned in `after` but not in `before`. */
export function newMentions(before: string, after: string): MentionRef[] {
  const old = new Set(mentions(before).map((ref) => `${ref.kind}/${ref.id}`));
  return mentions(after).filter((ref) => !old.has(`${ref.kind}/${ref.id}`));
}

/** A note starts with `/note`: it is read like a comment but starts no work. */
export function isNote(text: string): boolean {
  return NOTE.test(text);
}

/** Plain text for a notice: mentions as `@Name`, without the `/note` prefix, whitespace collapsed, cut at `max`. */
export function excerpt(text: string, max: number): string {
  const plain = text
    .replace(MENTION, (_, name: string) => `@${name}`)
    .replace(NOTE, '')
    .replace(/\s+/gu, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}
