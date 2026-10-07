export interface TocHeading {
  readonly level: 1 | 2 | 3;
  readonly text: string;
  readonly id: string;
}

const FENCE = /^\s*(```|~~~)/u;
const ATX_HEADING = /^(#{1,3})\s+(.+?)\s*#*$/u;

function slugifyHeading(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/gu, '') || 'section'
  );
}

/** A fresh `id` for each occurrence of the same heading text, so repeated titles ("Overview") stay unique. */
function dedupeId(seen: Map<string, number>, text: string): string {
  const base = slugifyHeading(text);
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

/**
 * The document's `h1`–`h3` headings in order, skipping fenced code blocks, for the table of contents. ATX
 * headings (`#`, `##`, `###`) only — a Setext heading (underlined with `===`/`---`) is rare in these documents and
 * would shift the ids `PmMarkdown headings` assigns out of step with this list, since both are matched positionally.
 */
export function extractMarkdownHeadings(content: string): TocHeading[] {
  const seen = new Map<string, number>();
  const headings: TocHeading[] = [];
  let inFence = false;
  for (const line of content.split(/\r\n?|\n/u)) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = ATX_HEADING.exec(line);
    if (!match) continue;
    const text = (match[2] ?? '').trim();
    if (!text) continue;
    headings.push({
      level: match[1].length as 1 | 2 | 3,
      text,
      id: dedupeId(seen, text),
    });
  }
  return headings;
}
