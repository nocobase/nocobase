import { describe, expect, it } from 'vitest';

import {
  draftEntries,
  entriesError,
  entryDrafts,
  invalidPattern,
  isDirtyDraft,
  moveEntry,
  newAgentDraft,
  newAgentInput,
  newEntryDraft,
  sameEntries,
  wholeNumber,
} from '../../client/pages/agents/agent-model.js';
import { onlineFor } from '../../client/lib/agents.js';
import { diffLines } from '../../client/lib/diff.js';
import { durationText, parseList } from '../../client/lib/format.js';
import { toolSummary } from '../../client/lib/tool-summary.js';
import { mergeRunEvents } from '../../client/runs/use-run-events.js';
import { skillFilePathProblem } from '../../shared/skills.js';
import { variableNameProblem } from '../../shared/variables.js';
import { previewSubjects } from '../../client/hooks/use-vocabulary.js';
import { runner } from './fixtures.js';

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

describe('agent forms', () => {
  it('turns the new agent dialog into the agent input', () => {
    const blank = newAgentDraft(['crm.deals/view', 'crm.deals/comment']);
    const draft = {
      ...blank,
      name: ' Coder ',
      runnerEntries: [
        { ...blank.runnerEntries[0]!, model: ' ', effort: 'high' },
        newEntryDraft({ tool: 'codex', model: 'gpt-5' }),
      ],
      instructions: '  ',
    };
    expect(newAgentDraft().actions).toEqual([]);
    expect(draft.actions).toEqual(['crm.deals/view', 'crm.deals/comment']);
    expect(newAgentInput(draft)).toEqual({
      input: {
        name: 'Coder',
        description: null,
        type: 'runner',
        modelEntries: [
          { tool: 'claude', model: null, effort: 'high' },
          { tool: 'codex', model: 'gpt-5', effort: null },
        ],
        instructions: null,
        actions: ['crm.deals/view', 'crm.deals/comment'],
      },
    });
    expect(newAgentInput({ ...draft, name: '' })).toEqual({
      nameError: 'agentForm.nameRequired',
    });
    // An online agent sends its model services and models, and no tool.
    const chat = { ...draft, type: 'online' as const };
    expect(newAgentInput(chat)).toEqual({
      modelError: 'modelEntries.required',
    });
    expect(
      newAgentInput(chat, [newEntryDraft({ modelService: 'openai' })]),
    ).toEqual({ modelError: 'agentForm.modelRequired' });
    expect(
      newAgentInput(chat, [
        newEntryDraft({
          modelService: 'openai',
          model: 'gpt-x',
          effort: 'low',
        }),
        newEntryDraft({ modelService: 'openai', model: 'gpt-y' }),
      ]),
    ).toEqual({
      input: {
        name: 'Coder',
        description: null,
        type: 'online',
        modelEntries: [
          { modelService: 'openai', model: 'gpt-x', effort: 'low' },
          { modelService: 'openai', model: 'gpt-y', effort: null },
        ],
        instructions: null,
        actions: ['crm.deals/view', 'crm.deals/comment'],
      },
    });
    expect(isDirtyDraft(newAgentDraft())).toBe(false);
    expect(isDirtyDraft(draft)).toBe(true);
  });

  it('turns the tools-and-models rows into entries, in order', () => {
    const rows = entryDrafts([
      { tool: 'codex', model: 'gpt-5', effort: 'xhigh' },
      { tool: 'claude', model: null },
    ]);
    expect(rows.map((row) => [row.tool, row.model, row.effort])).toEqual([
      ['codex', 'gpt-5', 'xhigh'],
      ['claude', '', ''],
    ]);
    expect(entriesError('runner', rows)).toBeNull();
    const moved = moveEntry(rows, 1, 0);
    expect(draftEntries('runner', moved)).toEqual([
      { tool: 'claude', model: null, effort: null },
      { tool: 'codex', model: 'gpt-5', effort: 'xhigh' },
    ]);
    expect(
      sameEntries('runner', moved, [
        { tool: 'codex', model: 'gpt-5', effort: 'xhigh' },
        { tool: 'claude', model: null },
      ]),
    ).toBe(false);
    // A changed effort is a change.
    expect(
      sameEntries('runner', rows, [
        { tool: 'codex', model: 'gpt-5', effort: 'high' },
        { tool: 'claude', model: null },
      ]),
    ).toBe(false);
    expect(
      sameEntries('runner', rows, [
        { tool: 'codex', model: 'gpt-5', effort: 'xhigh' },
        { tool: 'claude', model: null, effort: null },
      ]),
    ).toBe(true);
    expect(entriesError('runner', [])).toBe('modelEntries.required');
    // A saved online agent may be left with no model, waiting for one.
    expect(entriesError('online', [])).toBeNull();
    expect(
      entriesError('runner', [
        ...rows,
        newEntryDraft({ tool: 'codex', model: 'gpt-5' }),
      ]),
    ).toBe('modelEntries.duplicate');
    expect(
      entriesError('online', [newEntryDraft({ modelService: 'openai' })]),
    ).toBe('agentForm.modelRequired');
  });

  it('reads whole numbers and regular expressions', () => {
    expect(wholeNumber(' 4 ', 1, 100)).toBe(4);
    expect(wholeNumber('0', 1, 100)).toBeNull();
    expect(wholeNumber('2.5', 1, 100)).toBeNull();
    expect(invalidPattern(['^git\\b', '('])).toBe('(');
    expect(invalidPattern(['^ls'])).toBeNull();
  });

  it('counts the runners that can take a tool now', () => {
    const runners = [
      runner('r1'),
      runner('r2', { status: 'offline' }),
      runner('r3', { tools: [{ kind: 'claude', authenticated: false }] }),
      runner('r4', { tools: [{ kind: 'codex', authenticated: true }] }),
    ];
    expect(onlineFor(runners, 'claude')).toBe(1);
    expect(onlineFor(runners, 'codex')).toBe(1);
    expect(onlineFor(runners, 'claude', ['r4'])).toBe(0);
  });

  it('counts only runners with the tool enabled', () => {
    const both = [
      { kind: 'claude' as const, authenticated: true },
      { kind: 'codex' as const, authenticated: true },
    ];
    const runners = [
      runner('r1', { tools: both, enabledTools: ['codex'] }),
      runner('r2', { tools: both, enabledTools: [] }),
      runner('r3', { tools: both }),
    ];
    expect(onlineFor(runners, 'claude')).toBe(1);
    expect(onlineFor(runners, 'codex')).toBe(2);
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
