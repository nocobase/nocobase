import {
  markdownHeadings,
  type MarkdownHeading,
} from '../../shared/knowledge.js';

/** The h1–h3 headings a table of contents lists, only when there are at least three. */
export function tocOf(
  content: string,
  hiddenLine: number | null = null,
): MarkdownHeading[] {
  const headings = markdownHeadings(content).filter(
    (item) => item.level <= 3 && item.line !== hiddenLine,
  );
  return headings.length >= 3 ? headings : [];
}

/**
 * The line of a leading `# Title` that repeats the document's title, which the page already shows: the first heading,
 * an h1, with nothing but blank lines before it. Null when there is none.
 */
export function leadingTitleLine(
  content: string,
  title: string,
): number | null {
  const first = markdownHeadings(content)[0];
  if (!first || first.level !== 1) return null;
  if (first.text.trim().toLowerCase() !== title.trim().toLowerCase())
    return null;
  const before = content.split('\n').slice(0, first.line - 1);
  return before.every((line) => line.trim() === '') ? first.line : null;
}
