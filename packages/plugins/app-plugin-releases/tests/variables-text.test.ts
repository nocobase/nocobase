/**
 * Variables as `.env` text: reading pasted lines and saying what is wrong with a line, writing the plain values back
 * so they read the same, and what saving a text changes, with Secrets kept unless a line sets them.
 */
import { describe, expect, it, vi } from 'vitest';

import {
  applyVariableChanges,
  diffVariables,
  parseVariablesText,
  variablesText,
  type CurrentVariable,
} from '../client/lib/variables-text.js';

describe('parseVariablesText', () => {
  it('reads KEY=value lines, skipping blanks and comments', () => {
    const parsed = parseVariablesText(
      [
        '# SMTP',
        '',
        'SMTP_HOST=smtp.example.com',
        'export SMTP_PORT = 587 ',
        'GREETING="Hello, \\"world\\"\\nBye"',
        "RAW='a # b'",
        'REGION=eu-west # where it runs',
        'EMPTY=',
        'URL=https://x.example.com/#anchor',
      ].join('\r\n'),
    );
    expect(parsed.problems).toEqual([]);
    expect(
      Object.fromEntries(
        parsed.entries.map((entry) => [entry.name, entry.value]),
      ),
    ).toEqual({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      GREETING: 'Hello, "world"\nBye',
      RAW: 'a # b',
      REGION: 'eu-west',
      EMPTY: '',
      URL: 'https://x.example.com/#anchor',
    });
    expect(parsed.entries[0]).toMatchObject({ line: 3 });
  });

  it('says which line is wrong and why', () => {
    const parsed = parseVariablesText(
      [
        'not a variable',
        'smtp_host=x',
        'NODE_ENV=production',
        'A=1',
        'A=2',
        'B="open',
        '=nameless',
      ].join('\n'),
    );
    expect(parsed.problems).toEqual([
      { line: 1, issue: 'syntax' },
      { line: 2, issue: 'name', name: 'smtp_host' },
      { line: 3, issue: 'reserved', name: 'NODE_ENV' },
      { line: 5, issue: 'duplicate', name: 'A' },
      { line: 6, issue: 'unterminated', name: 'B' },
      { line: 7, issue: 'syntax' },
    ]);
    expect(parsed.entries.map((entry) => entry.name)).toEqual(['A']);
  });
});

describe('variablesText', () => {
  it('writes the plain values by name, leaving Secrets out, and reads back the same', () => {
    const current: CurrentVariable[] = [
      { name: 'REGION', secret: false, value: 'eu-west' },
      { name: 'SMTP_PASSWORD', secret: true, value: null },
      { name: 'GREETING', secret: false, value: 'Hi "there"\n# not a comment' },
      { name: 'EMPTY', secret: false, value: '' },
    ];
    const text = variablesText(current);
    expect(text.split('\n')[0]).toBe('EMPTY=');
    expect(text).not.toContain('SMTP_PASSWORD');
    const parsed = parseVariablesText(text);
    expect(parsed.problems).toEqual([]);
    expect(diffVariables(current, parsed.entries)).toEqual({
      changes: [],
      unchanged: 3,
    });
  });
});

describe('diffVariables', () => {
  const current: CurrentVariable[] = [
    { name: 'REGION', secret: false, value: 'eu-west' },
    { name: 'TIER', secret: false, value: 'small' },
    { name: 'SMTP_PASSWORD', secret: true, value: null },
    { name: 'AUTH_SECRET', secret: true, value: null },
  ];

  it('adds, changes and removes plain values; replaces a Secret only when a line sets it', () => {
    const { entries } = parseVariablesText(
      [
        'REGION=eu-west',
        'TIER=large',
        'SMTP_PASSWORD=new',
        'API_TOKEN=abc',
        'DB_HOST=db.internal',
      ].join('\n'),
    );
    const diff = diffVariables(current, entries, new Map([['DB_HOST', false]]));
    expect(diff.unchanged).toBe(1);
    expect(diff.changes).toEqual([
      {
        kind: 'change',
        name: 'TIER',
        value: 'large',
        secret: false,
        known: true,
      },
      {
        kind: 'change',
        name: 'SMTP_PASSWORD',
        value: 'new',
        secret: true,
        known: true,
      },
      // A new name ending in TOKEN is guessed a Secret, and may be changed.
      {
        kind: 'add',
        name: 'API_TOKEN',
        value: 'abc',
        secret: true,
        known: false,
      },
      // A name the release or the environment already knows keeps its own secrecy.
      {
        kind: 'add',
        name: 'DB_HOST',
        value: 'db.internal',
        secret: false,
        known: true,
      },
    ]);
  });

  it('removes a plain value without a line, never a Secret', () => {
    const diff = diffVariables(
      current,
      parseVariablesText('REGION=eu-west').entries,
    );
    expect(diff.changes).toEqual([
      { kind: 'remove', name: 'TIER', secret: false, known: true },
    ]);
  });
});

describe('applyVariableChanges', () => {
  it('sends each change and answers the ones that failed', async () => {
    const put = vi.fn((change: { name: string }) =>
      change.name === 'BAD'
        ? Promise.reject(new Error('refused'))
        : Promise.resolve(),
    );
    const remove = vi.fn(() => Promise.resolve());
    const failed = await applyVariableChanges(
      [
        { kind: 'add', name: 'GOOD', value: '1', secret: false, known: false },
        { kind: 'add', name: 'BAD', value: '2', secret: false, known: false },
        { kind: 'remove', name: 'OLD', secret: false, known: true },
      ],
      { put, remove },
    );
    expect(put).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(failed.map((item) => item.change.name)).toEqual(['BAD']);
  });
});
