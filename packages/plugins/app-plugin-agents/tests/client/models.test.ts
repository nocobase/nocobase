import { describe, expect, it } from 'vitest';

import { diffLines } from '../../client/lib/diff.js';
import { durationText, parseList } from '../../client/lib/format.js';
import { toolSummary } from '../../client/lib/tool-summary.js';
import { mergeRunEvents } from '../../client/runs/use-run-events.js';
import { skillFilePathProblem } from '../../shared/skills.js';
import { variableNameProblem } from '../../shared/variables.js';
import { previewSubjects } from '../../client/hooks/use-vocabulary.js';

describe('formatting', () => {
  it('splits lists on commas and spaces, once each', () => {
    expect(parseList(' macos, repo:acme  macos,,gpu ')).toEqual([
      'macos',
      'repo:acme',
      'gpu',
    ]);
  });

  it('says how long a run took', () => {
    expect(durationText('2026-10-01T00:00:00Z', '2026-10-01T00:01:05Z')).toBe(
      '1m 05s',
    );
    expect(durationText('2026-10-01T00:00:00Z', null)).toBeNull();
  });

  it('summarizes tool calls in one line', () => {
    expect(toolSummary({ command: 'pnpm test\nmore' })).toBe('$ pnpm test');
    expect(toolSummary({ command: ['bash', '-lc', 'ls -la'] })).toBe(
      '$ ls -la',
    );
    expect(toolSummary({ file_path: '/src/a.ts' })).toBe('/src/a.ts');
    expect(toolSummary({ other: 1 })).toBeNull();
  });

  it('merges transcript pages by seq, ignoring repeats', () => {
    const at = '2026-10-01T00:00:00Z';
    const merged = mergeRunEvents(
      [
        { seq: 1, at, type: 'text', content: 'a' },
        { seq: 3, at, type: 'text', content: 'c' },
      ],
      [
        { seq: 2, at, type: 'text', content: 'b' },
        { seq: 3, at, type: 'text', content: 'c' },
      ],
    );
    expect(merged.map((event) => event.seq)).toEqual([1, 2, 3]);
  });
});

describe('variables and skills', () => {
  it('checks variable names as NocoProject did, upper case only', () => {
    expect(variableNameProblem('')).toBe('required');
    expect(variableNameProblem('github_token')).toBe('pattern');
    expect(variableNameProblem('9X')).toBe('pattern');
    expect(variableNameProblem('PATH')).toBe('reserved');
    expect(variableNameProblem('ACME_TOKEN', [], 'acme')).toBe('reserved');
    expect(variableNameProblem('NPM_TOKEN', ['NPM_TOKEN'])).toBe('duplicate');
    expect(variableNameProblem('NPM_TOKEN')).toBeNull();
  });

  it('checks skill file paths', () => {
    expect(skillFilePathProblem('scripts/check.sh')).toBeNull();
    expect(skillFilePathProblem('../x')).toBe('invalid');
    expect(skillFilePathProblem('SKILL.md')).toBe('invalid');
    expect(skillFilePathProblem('a.md', ['a.md'])).toBe('duplicate');
  });

  it('diffs versions line by line', () => {
    expect(diffLines('a\nb\nc', 'a\nB\nc\nd')).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'added', text: 'B' },
      { kind: 'same', text: 'c' },
      { kind: 'added', text: 'd' },
    ]);
    expect(diffLines('', 'x')).toEqual([{ kind: 'added', text: 'x' }]);
  });
});

describe('brief previews', () => {
  it('offers the application’s subjects first and a conversation last', () => {
    const subject = (kind: string, preview: boolean) => ({
      kind,
      title: null,
      triggers: {},
      preview,
    });
    expect(
      previewSubjects([
        subject('conversation', true),
        subject('issue', true),
        subject('ticket', false),
      ]).map((item) => item.kind),
    ).toEqual(['issue', 'conversation']);
  });
});
