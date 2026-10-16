/**
 * A remark plugin that ends a GFM autolink literal (a bare `https://…` or `www.…`) at the first CJK character or
 * full-width punctuation mark, and turns the rest back into text. `remark-gfm` follows GFM, which only stops a bare
 * URL at whitespace or `<`, so `PR：https://example.com/pull/8（分支 x）` would otherwise link `…/pull/8（分支`. Use it
 * after `remark-gfm`. Links written as `<https://…>` or `[text](https://…)` are left as they are, so a URL that really
 * contains CJK characters can still be written that way.
 */

interface MdNode {
  type: string;
  value?: string;
  url?: string;
  children?: MdNode[];
  position?: {
    readonly start: { readonly offset?: number };
    readonly end: { readonly offset?: number };
  };
}

/**
 * Han, kana and Hangul; CJK symbols and punctuation (`、。「」【】`…); full-width and half-width forms (`，：；（）！？`…);
 * CJK compatibility forms; and the curly quotes, dashes and ellipsis Chinese text sets around a URL.
 */
const CJK_BOUNDARY =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u{3000}-\u{303f}\u{ff00}-\u{ffef}\u{fe30}-\u{fe4f}\u{2014}\u{2015}\u{2018}-\u{201f}\u{2026}]/u;

/** What GFM drops from the end of an autolink literal: trailing punctuation, and `)` it cannot pair. */
function trimTrailing(text: string): string {
  let end = text.length;
  for (;;) {
    const last = text[end - 1];
    if (last !== undefined && '?!.,:*_~'.includes(last)) {
      end -= 1;
      continue;
    }
    if (last === ')') {
      const head = text.slice(0, end);
      const open = head.split('(').length - 1;
      const close = head.split(')').length - 1;
      if (close > open) {
        end -= 1;
        continue;
      }
    }
    return text.slice(0, end);
  }
}

/** Whether `text` still reads as a link: a domain with at least one dot after the scheme or `www.`. */
function isLinkable(text: string): boolean {
  const host = /^(?:https?:\/\/)?([^/?#]*)/iu.exec(text)?.[1] ?? '';
  return /^[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)+$/u.test(host);
}

/** The text of a link GFM recognised from a bare URL, or `undefined` for any other link. */
function literalText(link: MdNode): string | undefined {
  const child = link.children?.length === 1 ? link.children[0] : undefined;
  const text = child?.type === 'text' ? child.value : undefined;
  const start = link.position?.start.offset;
  const end = link.position?.end.offset;
  // A literal spans exactly its text; `<url>` and `[text](url)` span their delimiters too.
  if (!text || start === undefined || end === undefined) return undefined;
  if (end - start !== text.length || !link.url?.endsWith(text))
    return undefined;
  return text;
}

/**
 * A bare URL in text cut from a literal, which GFM would have linked had the literal not swallowed it: `https://` not
 * after an ASCII letter or digit, `www.` at the start or after whitespace, `(`, `*`, `_` or `~`.
 */
const BARE_URL = /(?<![A-Za-z0-9])https?:\/\/|(?<=^|[\s(*_~])www\./giu;

function linkNode(url: string, text: string): MdNode {
  return { type: 'link', url, children: [{ type: 'text', value: text }] };
}

/** `text` as text and links, each bare URL in it ended at the first CJK boundary. */
function linkify(text: string): MdNode[] {
  const nodes: MdNode[] = [];
  let plain = 0;
  BARE_URL.lastIndex = 0;
  for (let match = BARE_URL.exec(text); match; match = BARE_URL.exec(text)) {
    const rest = text.slice(match.index);
    const end = rest.search(/[\s<]/u);
    const candidate = end === -1 ? rest : rest.slice(0, end);
    const boundary = CJK_BOUNDARY.exec(candidate)?.index ?? candidate.length;
    const kept = trimTrailing(candidate.slice(0, boundary));
    if (!isLinkable(kept)) continue;
    if (match.index > plain)
      nodes.push({ type: 'text', value: text.slice(plain, match.index) });
    nodes.push(linkNode(/^www\./iu.test(kept) ? `http://${kept}` : kept, kept));
    plain = match.index + kept.length;
    BARE_URL.lastIndex = plain;
  }
  if (plain < text.length)
    nodes.push({ type: 'text', value: text.slice(plain) });
  return nodes;
}

/** The nodes that replace `link`: itself, shortened, and the text after it; `undefined` to keep it as it is. */
function split(link: MdNode): MdNode[] | undefined {
  const text = literalText(link);
  if (text === undefined) return undefined;
  const boundary = CJK_BOUNDARY.exec(text)?.index;
  if (boundary === undefined) return undefined;
  const kept = trimTrailing(text.slice(0, boundary));
  if (!isLinkable(kept)) return linkify(text);
  const prefix = (link.url ?? '').slice(0, -text.length);
  return [linkNode(prefix + kept, kept), ...linkify(text.slice(kept.length))];
}

function visit(node: MdNode): void {
  const children = node.children;
  if (!children) return;
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!child) continue;
    const replacement = child.type === 'link' ? split(child) : undefined;
    if (replacement) {
      children.splice(index, 1, ...replacement);
      index += replacement.length - 1;
    } else {
      visit(child);
    }
  }
}

export function remarkCjkAutolink(): (tree: MdNode) => void {
  return visit;
}
