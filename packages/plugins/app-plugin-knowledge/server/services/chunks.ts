/**
 * Cutting a document into the chunks keyword search reads and citations point at (`kbChunks`): one section per
 * heading down to `headingDepth` (1–3; the text before the first heading is a section too), and a section longer than
 * `max` cut again between paragraphs, aiming at `target` (`KnowledgeChunking`, 3, 1200 and 2000 by default). A code
 * block or a table is never cut; one longer than the limit stays a chunk of its own. No overlap: each chunk carries the
 * headings above it instead, which a citation names, and its lines, which a reader opens.
 *
 * Pure: the same content and options always give the same chunks, so they are rewritten with each version in its
 * transaction.
 */
import { createHash } from 'node:crypto';

import {
  DEFAULT_CHUNKING,
  markdownHeadings,
  type KnowledgeChunking,
} from '../../shared/knowledge.js';

export interface Chunk {
  readonly ordinal: number;
  /** The headings above the chunk, outermost first; the document's title is not among them. */
  readonly headingPath: readonly string[];
  /** The anchor of the section's heading; null before the first heading. */
  readonly anchor: string | null;
  /** 1-based, inclusive. */
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly text: string;
  readonly hash: string;
}

interface Block {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})/u;
const TABLE = /^\s*\|/u;

/** The paragraphs of a section's lines: runs between blank lines, a code block or a table kept whole. */
function blocksOf(lines: readonly string[], firstLine: number): Block[] {
  const blocks: Block[] = [];
  let start = -1;
  let fence: string | null = null;
  const close = (end: number) => {
    if (start === -1) return;
    blocks.push({
      start: firstLine + start,
      end: firstLine + end,
      text: lines.slice(start, end + 1).join('\n'),
    });
    start = -1;
  };
  lines.forEach((line, index) => {
    const opening = FENCE.exec(line);
    if (fence !== null) {
      if (
        opening &&
        opening[1][0] === fence[0] &&
        opening[1].length >= fence.length
      ) {
        fence = null;
        close(index);
      }
      return;
    }
    if (opening) {
      close(index - 1);
      start = index;
      fence = opening[1]!;
      return;
    }
    if (line.trim() === '') {
      close(index - 1);
      return;
    }
    // A table starts its own block, so it is kept together and apart from the paragraph above.
    if (TABLE.test(line) && start !== -1 && !TABLE.test(lines[index - 1] ?? ''))
      close(index - 1);
    if (start === -1) start = index;
  });
  close(lines.length - 1);
  return blocks;
}

/** Groups a section's blocks into chunks of about `target`, never past `max` unless one block is. */
function pack(
  blocks: readonly Block[],
  { target, max }: KnowledgeChunking,
): Block[] {
  const packed: Block[] = [];
  let current: Block | null = null;
  for (const block of blocks) {
    if (current === null) {
      current = block;
      continue;
    }
    const joined = current.text.length + 2 + block.text.length;
    if (current.text.length >= target || joined > max) {
      packed.push(current);
      current = block;
    } else
      current = {
        start: current.start,
        end: block.end,
        text: `${current.text}\n\n${block.text}`,
      };
  }
  if (current) packed.push(current);
  return packed;
}

export function chunkMarkdown(
  content: string,
  options: KnowledgeChunking = DEFAULT_CHUNKING,
): Chunk[] {
  const lines = content.split('\n').map((line) => line.replace(/\r$/u, ''));
  const headings = markdownHeadings(content).filter(
    (heading) => heading.level <= options.headingDepth,
  );
  const sections: {
    start: number;
    end: number;
    path: string[];
    anchor: string | null;
  }[] = [];
  const stack: { level: number; text: string }[] = [];
  if (headings.length === 0 || headings[0].line > 1)
    sections.push({
      start: 1,
      end: (headings[0]?.line ?? lines.length + 1) - 1,
      path: [],
      anchor: null,
    });
  headings.forEach((heading, index) => {
    while (stack.length > 0 && stack.at(-1)!.level >= heading.level)
      stack.pop();
    stack.push({ level: heading.level, text: heading.text });
    const end = (headings[index + 1]?.line ?? lines.length + 1) - 1;
    sections.push({
      start: heading.line,
      end,
      path: stack.map((entry) => entry.text),
      anchor: heading.anchor,
    });
  });

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const own = lines.slice(section.start - 1, section.end);
    if (own.join('').trim() === '') continue;
    const whole = own.join('\n').trim();
    const pieces =
      whole.length <= options.max
        ? [{ start: section.start, end: section.end, text: whole }]
        : pack(blocksOf(own, section.start), options);
    for (const piece of pieces) {
      const text = piece.text.trim();
      if (!text) continue;
      chunks.push({
        ordinal: chunks.length,
        headingPath: section.path,
        anchor: section.anchor,
        lineStart: piece.start,
        lineEnd: trimmedEnd(lines, piece.start, piece.end),
        text,
        hash: createHash('sha256').update(text).digest('hex'),
      });
    }
  }
  return chunks;
}

/** The last non-blank line of `start..end`. */
function trimmedEnd(lines: readonly string[], start: number, end: number) {
  let last = end;
  while (last > start && (lines[last - 1] ?? '').trim() === '') last -= 1;
  return last;
}
