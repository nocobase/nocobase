// @vitest-environment node
/**
 * The failing part of a CI log (`server/git/ci-logs.ts`): each error with the lines around it under its step's name,
 * the end of the log, timestamps and colors taken off, and never more than the excerpt's size.
 */
import { describe, expect, it } from 'vitest';

import {
  cleanLogLine,
  excerptOfLog,
  linesOf,
  type LogExcerptLimits,
} from '../../server/git/ci-logs.js';

const limits: LogExcerptLimits = {
  context: 2,
  tail: 3,
  maxBytes: 4096,
  lineLength: 60,
};

const numbered = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => `line ${from + index}`);

async function* chunks(...parts: string[]) {
  for (const part of parts) yield part;
}

describe('a CI log’s excerpt', () => {
  it('reads lines as they arrive, without timestamps or colors, cutting very long ones', async () => {
    const lines: string[] = [];
    for await (const line of linesOf(chunks('a\r\nb', 'c\n', 'd')))
      lines.push(line);
    expect(lines).toEqual(['a', 'bc', 'd']);
    // A line too long to hold is cut, and what follows it read as usual.
    const long: string[] = [];
    for await (const line of linesOf(
      chunks('x'.repeat(70_000), 'y'.repeat(70_000), '\nnext\n'),
    ))
      long.push(line);
    expect(long.map((line) => line.length)).toEqual([65_536, 4]);
    expect(
      cleanLogLine(
        '﻿2026-10-09T01:02:03.4567890Z \u001B[31mFAIL\u001B[0m tests/a.test.ts  ',
      ),
    ).toBe('FAIL tests/a.test.ts');
    expect(cleanLogLine('x'.repeat(60), 40)).toBe(`${'x'.repeat(40)}…`);
  });

  it('keeps each error in context under its step, then the end of the log', async () => {
    const log = [
      '##[group]Run pnpm install',
      ...numbered(1, 5),
      '##[endgroup]',
      '##[group]Run pnpm test',
      ...numbered(6, 10),
      '##[error]Expected 1 to be 2',
      ...numbered(11, 20),
      '##[error]Process completed with exit code 1.',
      'Cleaning up orphan processes',
    ];
    expect(await excerptOfLog(log, limits)).toBe(
      [
        '── Run pnpm test ──',
        'line 9',
        'line 10',
        '##[error]Expected 1 to be 2',
        'line 11',
        'line 12',
        '…',
        '── Run pnpm test ──',
        'line 19',
        'line 20',
        '##[error]Process completed with exit code 1.',
        'Cleaning up orphan processes',
      ].join('\n'),
    );
  });

  it('joins errors close to each other into one passage', async () => {
    const log = [
      ...numbered(1, 3),
      '##[error]first',
      'line 4',
      '##[error]second',
      ...numbered(5, 12),
    ];
    expect(await excerptOfLog(log, limits)).toBe(
      [
        '── log ──',
        'line 2',
        'line 3',
        '##[error]first',
        'line 4',
        '##[error]second',
        'line 5',
        'line 6',
        '…',
        '── end of log ──',
        'line 10',
        'line 11',
        'line 12',
      ].join('\n'),
    );
  });

  it('keeps the end of a log without errors, and nothing of an empty one', async () => {
    expect(await excerptOfLog(numbered(1, 2), limits)).toBe('line 1\nline 2');
    expect(await excerptOfLog(numbered(1, 10), limits)).toBe(
      ['…', '── end of log ──', 'line 8', 'line 9', 'line 10'].join('\n'),
    );
    expect(await excerptOfLog([], limits)).toBe('');
  });

  it('never exceeds its size: the first errors first, saying how many more there were', async () => {
    const log = Array.from({ length: 200 }, (_, index) =>
      index % 10 === 5 ? `##[error]failure ${index}` : `output ${index}`,
    );
    const small = { ...limits, maxBytes: 300 };
    const excerpt = await excerptOfLog(log, small);
    expect(Buffer.byteLength(excerpt)).toBeLessThanOrEqual(300);
    expect(excerpt).toContain('##[error]failure 5');
    expect(excerpt).toMatch(/… \d+ more errors not shown/u);
    expect(excerpt).toContain('output 199');
  });

  it('cuts a run of errors too long to show, rather than leaving it out', async () => {
    const log = [
      '##[group]Run pnpm lint',
      ...Array.from({ length: 5000 }, (_, index) => `##[error]rule ${index}`),
      'done',
    ];
    const small = { ...limits, maxBytes: 300 };
    const excerpt = await excerptOfLog(log, small);
    expect(Buffer.byteLength(excerpt)).toBeLessThanOrEqual(300);
    expect(
      excerpt.startsWith(
        '── Run pnpm lint ──\n##[group]Run pnpm lint\n##[error]rule 0',
      ),
    ).toBe(true);
    const shown = excerpt.match(/##\[error\]rule/gu)?.length ?? 0;
    expect(excerpt).toContain(`… ${5000 - shown} more errors not shown`);
    expect(excerpt).toContain('done');
  });
});
