import { describe, expect, it } from 'vitest';
import type { ChatContextInput } from '@nocobase/app-plugin-agents/client/chat';
import { studioContext } from '../../client/agents/chat-context.js';

const base: ChatContextInput = {
  route: '/issues',
  pinned: [],
  sources: [],
  filter: null,
  selection: null,
  removed: new Set(),
};
describe('bounded Studio location', () => {
  it.each([
    '/issues/12/runs/r1',
    '/projects/1/issues/12/runs/r1',
    '/my-issues/owned/12/runs/r1',
  ])('prioritizes the deepest run in %s', (route) => {
    const result = studioContext(
      {
        ...base,
        route,
        sources: [{ kind: 'issue', id: '12', label: 'Parent issue' }],
      },
      'Run',
    );
    expect(result.context.items).toEqual([{ kind: 'run', id: 'r1' }]);
  });
  it('details replace list objects and filters, resolving issue aliases', () => {
    const result = studioContext(
      {
        ...base,
        route:
          '/projects/1/issues/PM-42?status=open&chat=other&account=security',
        sources: [
          { kind: 'project', id: '1', label: 'P' },
          { kind: 'issue', id: '123', label: 'PM-42 Header' },
        ],
        filter: { page: 'Issues', params: { status: 'open' } },
      },
      'Issue',
    );
    expect(result.context.items).toEqual([
      { kind: 'issue', id: '123' },
      { kind: 'project', id: '1' },
    ]);
    expect(result.context.route).toBe('/projects/1/issues/PM-42');
    expect(result.context.filter?.params).toEqual({ page: 'Issue' });
  });
  it.each(['/plans/1', '/knowledge', '/releases/apps/1', '/config/general'])(
    'uses position metadata for %s',
    (route) => {
      const result = studioContext({ ...base, route }, 'Page');
      expect(result.context.filter?.page).toBe('Page');
      expect(result.context.route).toBe(route);
    },
  );
  it('whitelists filter metadata and bounds escaped JSON as well as plain text', () => {
    const result = studioContext(
      {
        ...base,
        route: '/issues?status=open&secret=bad&chat=new&q=' + 'x'.repeat(200),
        selection: { text: '"'.repeat(1800) },
        pinned: [{ kind: 'issue', id: '1', label: 'Pinned' }],
      },
      'Page',
    );
    expect(result.context.filter?.params.secret).toBeUndefined();
    expect(result.context.filter?.params.chat).toBeUndefined();
    expect(result.context.filter?.params.q?.length).toBeLessThanOrEqual(120);
    expect(result.context.selection?.text.length).toBeLessThanOrEqual(800);
    expect(JSON.stringify(result.context).length).toBeLessThanOrEqual(2400);
    expect(result.truncated).toBe(true);
  });
  it('deduplicates, respects removals and caps automatic/pinned references', () => {
    const result = studioContext(
      {
        ...base,
        sources: Array.from({ length: 8 }, (_, i) => ({
          kind: 'issue',
          id: String(i),
          label: 'I',
        })),
        pinned: [{ kind: 'issue', id: '7', label: 'Pinned' }],
        removed: new Set(['issue:6', 'filter', 'selection']),
        selection: { text: 'not sent' },
      },
      'Page',
    );
    expect(result.context.items).toEqual([{ kind: 'issue', id: '7' }]);
    expect(result.context.filter).toBeUndefined();
    expect(result.context.selection).toBeUndefined();
    expect(result.context.route).toBe('');
  });
});
