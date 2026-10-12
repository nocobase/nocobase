/**
 * The part of a CI job's log that says why it failed, read line by line from GitHub Actions' plain-text log without
 * keeping the whole of it: every `##[error]` line with the lines around it, under the name of the step it is in (the
 * `##[group]` that opened the step), and the end of the log. Timestamps and terminal colors are taken off each line;
 * a very long line is cut. The excerpt never exceeds its byte limit: the end of the log takes at most a third of it,
 * and the errors the rest, the first ones first.
 *
 * GitHub masks the repository's secrets in a log (`***`) before Studio reads it.
 */

export interface LogExcerptLimits {
  /** Lines kept before and after each error line. */
  readonly context: number;
  /** Lines kept from the end of the log. */
  readonly tail: number;
  /** The excerpt's size at most, in bytes (UTF-8). */
  readonly maxBytes: number;
  /** A line is cut after this many characters. */
  readonly lineLength: number;
}

export const LOG_EXCERPT: LogExcerptLimits = {
  context: 20,
  tail: 50,
  maxBytes: 8 * 1024,
  lineLength: 500,
};

/** `2026-10-09T01:02:03.4567890Z ` at the start of an Actions log line. */
const TIMESTAMP = /^\uFEFF?\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z ?/u;
// eslint-disable-next-line no-control-regex
const ANSI = /\u001B\[[0-9;?]*[A-Za-z]/gu;
const ERROR = '##[error]';
const GROUP = '##[group]';

interface Line {
  readonly n: number;
  readonly text: string;
}

interface Window {
  readonly step: string | null;
  readonly lines: Line[];
}

const bytes = (text: string) => Buffer.byteLength(text, 'utf8');

/** The heading of the end of the log, with the gap before it and the line breaks. */
const END_HEADING = '…\n── end of log ──\n\n';
const omittedNotice = (count: number) =>
  `… ${count} more error${count === 1 ? '' : 's'} not shown\n`;

/** One log line as it is kept: no timestamp, no colors, cut when very long. */
export function cleanLogLine(line: string, length = LOG_EXCERPT.lineLength) {
  const text = line.replace(TIMESTAMP, '').replace(ANSI, '').trimEnd();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

/** A line is read this far at most; the rest of it, up to its end, is skipped. */
const LINE_READ_MAX = 64 * 1024;

/** The lines of a stream of text, as they arrive; a line too long to hold is cut. */
export async function* linesOf(
  chunks: AsyncIterable<string>,
): AsyncGenerator<string> {
  let rest = '';
  /** Within the rest of a line already cut. */
  let skipping = false;
  for await (const chunk of chunks) {
    const parts = (rest + chunk).split(/\r?\n/u);
    rest = parts.pop() ?? '';
    for (const part of parts) {
      if (skipping) skipping = false;
      else yield part;
    }
    if (rest.length > LINE_READ_MAX) {
      if (!skipping) yield rest.slice(0, LINE_READ_MAX);
      skipping = true;
      rest = '';
    }
  }
  if (rest && !skipping) yield rest;
}

/** The excerpt of a log: its errors in context, by step, and its end; empty for an empty log. */
export async function excerptOfLog(
  lines: AsyncIterable<string> | Iterable<string>,
  limits: LogExcerptLimits = LOG_EXCERPT,
): Promise<string> {
  const windows: Window[] = [];
  const before: Line[] = [];
  const tail: Line[] = [];
  let step: string | null = null;
  let open: Window | null = null;
  /** Lines still to keep after the last error of the open window. */
  let after = 0;
  let n = 0;
  /** What the windows hold: once it exceeds the excerpt, later errors are only counted. */
  let stored = 0;
  let unseen = 0;
  const keep = (window: Window, line: Line) => {
    window.lines.push(line);
    stored += bytes(line.text) + 1;
  };

  for await (const raw of lines) {
    n += 1;
    const text = cleanLogLine(raw, limits.lineLength);
    const line = { n, text };
    if (text.startsWith(GROUP)) step = text.slice(GROUP.length).trim() || null;
    const error = text.includes(ERROR);
    if (stored > limits.maxBytes) {
      open = null;
      if (error) unseen += 1;
    } else if (open && after > 0) {
      keep(open, line);
      after = error ? limits.context : after - 1;
      if (after === 0) open = null;
    } else if (error) {
      // An error right after a window joins it; otherwise it opens one with the lines before it.
      const last = windows.at(-1);
      const kept = before.filter(
        (item) => !last || item.n > last.lines.at(-1)!.n,
      );
      if (last && kept.length === 0 && last.lines.at(-1)!.n === n - 1)
        open = last;
      else {
        open = { step, lines: [] };
        windows.push(open);
        for (const item of kept) keep(open, item);
      }
      keep(open, line);
      after = limits.context;
    }
    before.push(line);
    if (before.length > limits.context) before.shift();
    tail.push(line);
    if (tail.length > limits.tail) tail.shift();
  }
  if (n === 0) return '';

  const lastWindowLine = windows.at(-1)?.lines.at(-1)?.n ?? 0;
  const end = tail.filter((line) => line.n > lastWindowLine);
  // The end of the log, within a third of the limit (its heading included), cut from the top.
  const endBudget = Math.floor(limits.maxBytes / 3) - bytes(END_HEADING);
  const endLines: Line[] = [];
  let endBytes = 0;
  for (const line of [...end].reverse()) {
    const size = bytes(line.text) + 1;
    if (endBytes + size > endBudget) break;
    endLines.unshift(line);
    endBytes += size;
  }

  // The errors, the first ones first, in what is left; the window that does not fit is cut, and room is kept for the
  // heading of the end and for saying how many errors are not shown.
  const parts: string[] = [];
  let room =
    limits.maxBytes - endBytes - bytes(END_HEADING) - bytes(omittedNotice(n));
  let hidden = unseen;
  let previous = 0;
  for (const window of windows) {
    const shown: string[] = [];
    if (room > 0) {
      if (previous && window.lines[0].n > previous + 1) shown.push('…');
      shown.push(`── ${window.step ?? 'log'} ──`);
    }
    let size = shown.reduce((sum, text) => sum + bytes(text) + 1, 0);
    let last = 0;
    for (const line of window.lines) {
      const next = bytes(line.text) + 1;
      if (room <= 0 || size + next > room) {
        if (line.text.includes(ERROR)) hidden += 1;
        continue;
      }
      shown.push(line.text);
      size += next;
      last = line.n;
    }
    if (!last) {
      room = 0;
      continue;
    }
    parts.push(shown.join('\n'));
    room -= size;
    previous = last;
    // A window cut short ends what is shown of the errors.
    if (last !== window.lines.at(-1)!.n) room = 0;
  }
  // The errors the end of the log shows were counted among those not stored.
  hidden -= endLines.filter((line) => line.text.includes(ERROR)).length;
  if (hidden > 0) parts.push(omittedNotice(hidden).trimEnd());
  if (endLines.length) {
    const gap = endLines[0].n > previous + 1;
    const heading = windows.length
      ? [...(gap ? ['…'] : []), '── end of log ──']
      : gap
        ? ['…', '── end of log ──']
        : [];
    parts.push([...heading, ...endLines.map((line) => line.text)].join('\n'));
  }
  return parts.join('\n');
}
