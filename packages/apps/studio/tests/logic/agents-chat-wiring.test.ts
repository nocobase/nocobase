// @vitest-environment node
/**
 * The pure parts of Studio's joining of the chat panel and the projects plugin: which page entries become chips, how a
 * list's filter chip reads, and what "Let an agent organize" sends.
 */
import { describe, expect, it } from 'vitest';

import {
  chatItemOf,
  filterLabel,
  type FilterNames,
} from '../../client/agents/chat-items.js';
import { fitIntake, intakeTitleText } from '../../client/agents/intake-text.js';

const t = (key: string, options?: Record<string, unknown>): string =>
  options ? `${key}(${JSON.stringify(options)})` : key;

describe('page entries as chat chips', () => {
  it('maps the kinds the server resolves and drops the others', () => {
    expect(chatItemOf({ kind: 'issue', id: 'i1', label: 'PM-1 Fix' })).toEqual({
      kind: 'issue',
      id: 'i1',
      label: 'PM-1 Fix',
    });
    expect(chatItemOf({ kind: 'inbox', id: 'n1' })).toEqual({
      kind: 'inboxItem',
      id: 'n1',
      label: 'n1',
    });
    expect(chatItemOf({ kind: 'plan', id: 'p1' })).toBeNull();
    expect(chatItemOf({ kind: 'issues', filters: { q: 'x' } })).toBeNull();
    expect(chatItemOf(undefined)).toBeNull();
  });

  it('words a filter by the names its values stand for', () => {
    const names: FilterNames = {
      project: (id) => (id === 'p1' ? 'Website' : null),
      label: (id) => (id === 'l1' ? 'bug' : null),
      person: () => null,
      status: (key) => `status:${key}`,
    };
    expect(
      filterLabel(
        {
          projectId: 'p1',
          labelId: 'l1',
          statusKey: 'todo',
          q: 'login',
          ownerUserId: 'u9',
          other: 'x',
        },
        names,
        t,
      ),
    ).toBe(
      [
        'Website',
        '#bug',
        'status:todo',
        'pmChat.filters.search({"value":"login"})',
        'pmChat.filters.owner({"name":"pmChat.filters.someone"})',
        'other=x',
      ].join(' · '),
    );
  });
});

describe('what "Let an agent organize" sends', () => {
  it('keeps the text first and cuts the files to the budget', () => {
    const fitted = fitIntake(
      'abc',
      [
        { name: 'a.md', text: 'x'.repeat(100) },
        { name: 'b.md', text: 'y'.repeat(100) },
      ],
      3 + 100 + 4 + 20 + 30,
    );
    expect(fitted.text).toBe('abc');
    expect(fitted.files).toEqual([
      { name: 'a.md', text: 'x'.repeat(100) },
      { name: 'b.md', text: 'y'.repeat(6) },
    ]);
    expect(fitIntake('z'.repeat(50), [{ name: 'a', text: 'x' }], 40)).toEqual({
      text: 'z'.repeat(40),
      files: [],
    });
  });

  it('titles the conversation by the first line, without Markdown markers', () => {
    expect(intakeTitleText('\n# 官网改版\n- 首页', 30)).toBe('官网改版');
    expect(intakeTitleText('- [x] Done item', 30)).toBe('Done item');
    expect(intakeTitleText('1. 第一项', 30)).toBe('第一项');
    expect(intakeTitleText('a'.repeat(40), 10)).toBe(`${'a'.repeat(9)}…`);
    expect(intakeTitleText('   ', 10)).toBe('');
  });
});

describe('news in a conversation', () => {
  it('words a decided plan in the reader’s language, and leaves other news to its title', async () => {
    const { studioNewsText } = await import('../../client/agents/news.js');
    expect(
      studioNewsText(
        {
          code: 'news',
          type: 'planDecided',
          title: 'The plan "Split" was executed.',
          params: { planId: 'p1', outcome: 'executed', title: 'Split' },
        },
        t,
      ),
    ).toBe(
      'studioAgents.news.planDecided.executed({"ns":"@nocobase/i18n/application","title":"Split","defaultValue":"The plan \\"Split\\" was executed."})',
    );
    expect(
      studioNewsText({ code: 'news', type: 'other', title: 'Other.' }, t),
    ).toBeNull();
  });
});
