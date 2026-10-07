/**
 * The intake's rule parser: text into issue drafts, by the rules in `shared/intake.ts`. Pure — no database, no clock —
 * and ported from NocoProject's heuristic parser, so pasted notes split the way they did there.
 */
import type { Priority } from '../../../../shared/common.js';

/** One issue the text describes; `parentPosition` points at an earlier draft. */
export interface IntakeDraft {
  /** 1-based. */
  readonly position: number;
  readonly parentPosition: number | null;
  readonly title: string;
  readonly description?: string;
  readonly priority?: Priority;
  /** Label names, as written after `#`. */
  readonly labels: readonly string[];
  readonly stage?: number;
}

/** Drafts beyond this are not produced at all; a plan takes fewer still. */
export const INTAKE_DRAFTS_MAX = 500;
export const INTAKE_TITLE_MAX = 200;

const HEADING = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/u;
const LIST_ITEM = /^([ \t]*)(?:[-*+•]|\d+[.)、])\s+(.*)$/u;
const CHECKBOX = /^\[[ xX]\]\s+/u;

/**
 * CSV header names, lower-cased, and the column each means. The Chinese names match spreadsheets written in
 * Chinese.
 */
const CSV_COLUMNS: Readonly<Record<string, CsvColumn>> = {
  title: 'title',
  name: 'title',
  标题: 'title',
  任务: 'title',
  description: 'description',
  描述: 'description',
  说明: 'description',
  priority: 'priority',
  优先级: 'priority',
  labels: 'labels',
  label: 'labels',
  标签: 'labels',
  stage: 'stage',
  阶段: 'stage',
  parent: 'parent',
  父任务: 'parent',
  上级任务: 'parent',
};
type CsvColumn =
  'title' | 'description' | 'priority' | 'labels' | 'stage' | 'parent';

/** Priority words a CSV cell may hold, lower-cased, including the Chinese ones. */
const PRIORITY_WORDS: Readonly<Record<string, Priority>> = {
  urgent: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low',
  none: 'none',
  紧急: 'urgent',
  高: 'high',
  中: 'medium',
  低: 'low',
  无: 'none',
};

export interface ExtractedTitle {
  readonly title: string;
  readonly priority?: Priority;
  readonly labels: string[];
  readonly stage?: number;
  /** The whole text when the title had to be cut. */
  readonly overflow?: string;
}

/** Pulls priority, label and stage markers out of a title line. */
export function extractMarkers(raw: string): ExtractedTitle {
  let text = raw.replace(CHECKBOX, '');
  let priority: Priority | undefined;
  text = text.replace(
    /\[(urgent|high|medium|low)\]/giu,
    (_match, word: string) => {
      priority ??= word.toLowerCase() as Priority;
      return ' ';
    },
  );
  text = text.replace(
    /(^|\s)(!{1,2}|！{1,2})(?=\s|$)/gu,
    (_match, lead: string, bangs: string) => {
      priority ??= bangs.length === 2 ? 'urgent' : 'high';
      return lead;
    },
  );
  let stage: number | undefined;
  text = text.replace(
    /@stage\s*(\d+)|\(stage\s*(\d+)\)/giu,
    (_match, a?: string, b?: string) => {
      stage ??= Number(a ?? b);
      return ' ';
    },
  );
  const labels: string[] = [];
  text = text.replace(
    /(^|\s)#([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu,
    (_match, lead: string, tag: string) => {
      if (!labels.includes(tag)) labels.push(tag);
      return lead;
    },
  );
  const title = text.replace(/\s+/gu, ' ').trim();
  if (title.length <= INTAKE_TITLE_MAX)
    return { title, priority, labels, stage };
  return {
    title: title.slice(0, INTAKE_TITLE_MAX).trim(),
    priority,
    labels,
    stage,
    overflow: title,
  };
}

interface Row {
  readonly position: number;
  readonly parentPosition: number | null;
  readonly titleLine: string;
  readonly description: string[];
}

function toDraft(row: Row): IntakeDraft | null {
  const extracted = extractMarkers(row.titleLine);
  if (!extracted.title) return null;
  const description = [
    ...(extracted.overflow ? [extracted.overflow, ''] : []),
    ...row.description,
  ]
    .join('\n')
    .trim();
  return {
    position: row.position,
    parentPosition: row.parentPosition,
    title: extracted.title,
    labels: extracted.labels,
    ...(description ? { description } : {}),
    ...(extracted.priority ? { priority: extracted.priority } : {}),
    // A stage orders the sub-issues of one parent; on a top-level issue it means nothing.
    ...(extracted.stage !== undefined && row.parentPosition !== null
      ? { stage: extracted.stage }
      : {}),
  };
}

function indentOf(whitespace: string): number {
  return whitespace.replace(/\t/gu, '    ').length;
}

/** Numbers the drafts 1…n, leaving out rows without a title, and points the parents at the new numbers. */
function finish(rows: readonly Row[]): IntakeDraft[] {
  const drafts: IntakeDraft[] = [];
  const renumbered = new Map<number, number>();
  for (const row of rows) {
    const draft = toDraft(row);
    if (!draft || drafts.length >= INTAKE_DRAFTS_MAX) continue;
    const position = drafts.length + 1;
    renumbered.set(row.position, position);
    drafts.push({
      ...draft,
      position,
      parentPosition:
        draft.parentPosition === null
          ? null
          : (renumbered.get(draft.parentPosition) ?? null),
    });
  }
  return drafts;
}

function parseLines(text: string): IntakeDraft[] {
  const rows: Row[] = [];
  let heading: Row | null = null;
  let topItem: Row | null = null;
  let last: Row | null = null;
  let paragraph: string[] = [];
  const add = (titleLine: string, parentPosition: number | null): Row => {
    const row: Row = {
      position: rows.length + 1,
      parentPosition,
      titleLine,
      description: [],
    };
    rows.push(row);
    return row;
  };
  const flush = () => {
    if (paragraph.length === 0) return;
    const row = add(paragraph[0] ?? '', heading?.position ?? null);
    row.description.push(...paragraph.slice(1));
    paragraph = [];
  };
  for (const line of text.split('\n')) {
    if (line.trim() === '') {
      flush();
      last = null;
      continue;
    }
    const headingMatch = HEADING.exec(line);
    const listMatch = headingMatch ? null : LIST_ITEM.exec(line);
    if (headingMatch) {
      flush();
      heading = add(headingMatch[1] ?? '', null);
      topItem = null;
      last = heading;
    } else if (listMatch) {
      flush();
      const nested = indentOf(listMatch[1] ?? '') >= 2;
      const parent = nested ? (topItem ?? heading) : heading;
      last = add(listMatch[2] ?? '', parent?.position ?? null);
      if (!nested) topItem = last;
    } else if (paragraph.length === 0 && last) {
      last.description.push(line.trim());
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();
  return finish(rows);
}

/** Splits one CSV line (RFC 4180 quoting; no embedded newlines). */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      cells.push(cell);
      cell = '';
    } else cell += char;
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

/** The column each header cell means, when the first non-empty line is a CSV header with a title column. */
function csvHeader(text: string): (CsvColumn | null)[] | null {
  const first = text.split('\n').find((line) => line.trim() !== '');
  if (!first?.includes(',')) return null;
  const header = splitCsvLine(first).map(
    (cell) => CSV_COLUMNS[cell.toLowerCase()] ?? null,
  );
  return header.includes('title') ? header : null;
}

function parseCsv(
  text: string,
  header: readonly (CsvColumn | null)[],
): IntakeDraft[] {
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const column = (cells: readonly string[], name: CsvColumn) => {
    const index = header.indexOf(name);
    return index >= 0 ? (cells[index] ?? '').trim() : '';
  };
  const drafts: IntakeDraft[] = [];
  const byTitle = new Map<string, number>();
  for (const line of lines.slice(1)) {
    if (drafts.length >= INTAKE_DRAFTS_MAX) break;
    const cells = splitCsvLine(line);
    const title = column(cells, 'title').slice(0, INTAKE_TITLE_MAX);
    if (!title) continue;
    const priority = PRIORITY_WORDS[column(cells, 'priority').toLowerCase()];
    const labels = column(cells, 'labels')
      .split(/[;|；]/u)
      .map((label) => label.trim().replace(/^#/u, ''))
      .filter(Boolean);
    const parentPosition =
      byTitle.get(column(cells, 'parent').toLowerCase()) ?? null;
    const stageText = column(cells, 'stage');
    const stage = /^\d{1,4}$/u.test(stageText) ? Number(stageText) : undefined;
    const description = column(cells, 'description');
    const position = drafts.length + 1;
    drafts.push({
      position,
      parentPosition,
      title,
      labels: [...new Set(labels)],
      ...(description ? { description } : {}),
      ...(priority ? { priority } : {}),
      ...(stage !== undefined && parentPosition !== null ? { stage } : {}),
    });
    if (!byTitle.has(title.toLowerCase()))
      byTitle.set(title.toLowerCase(), position);
  }
  return drafts;
}

/** Drafts from text, by the rules in `shared/intake.ts`. */
export function parseIntake(rawContent: string): IntakeDraft[] {
  const text = rawContent.replace(/\r\n?/gu, '\n');
  const header = csvHeader(text);
  return header ? parseCsv(text, header) : parseLines(text);
}
