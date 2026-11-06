import { renderHook } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import { ApplicationCacheContext } from '../../client/query-cache.js';
import { useAgentSessionDraft } from '../../client/panel.js';
import { sessionMemoryKey } from '../../client/use-session-memory.js';

it('transfers text and context through the application cache without touching images or unresolved submissions', () => {
  const cache = new QueryClient();
  const { result } = renderHook(() => useAgentSessionDraft(), {
    wrapper: ({ children }) => (
      <ApplicationCacheContext.Provider value={cache}>
        {children}
      </ApplicationCacheContext.Provider>
    ),
  });
  const draft = {
    text: 'Create a task',
    mentions: [],
    attachments: [{ id: 'intent', label: 'Create task', text: 'Use the CLI' }],
  };
  cache.setQueryData(sessionMemoryKey('images:new-session'), ['image']);
  expect(result.current.write({ kind: 'new' }, draft)).toBe(true);
  expect(result.current.read({ kind: 'new' })).toEqual(draft);
  expect(cache.getQueryData(sessionMemoryKey('images:new-session'))).toEqual([
    'image',
  ]);
  expect(result.current.read({ kind: 'session', sessionId: 'other' })).toEqual({
    text: '',
    attachments: [],
    mentions: [],
  });
  cache.setQueryData(sessionMemoryKey('submission:new-session'), {
    id: 'pending',
  });
  expect(
    result.current.write({ kind: 'new' }, { text: '', attachments: [] }),
  ).toBe(false);
  expect(result.current.read({ kind: 'new' })).toEqual(draft);
  expect(result.current.read({ kind: 'list' })).toBeNull();
});

it('keeps only selected references still present in the portable text, and replaces stale mentions on write', () => {
  const cache = new QueryClient();
  const { result } = renderHook(() => useAgentSessionDraft(), {
    wrapper: ({ children }) => (
      <ApplicationCacheContext.Provider value={cache}>
        {children}
      </ApplicationCacheContext.Provider>
    ),
  });
  const selected = {
    kind: 'issue',
    refId: 'task-1',
    key: 'ST-1',
    title: 'Manual task',
    group: null,
    status: null,
  };
  const removed = { ...selected, refId: 'task-2', key: 'ST-2' };
  cache.setQueryData(sessionMemoryKey('mentions:new-session'), [
    selected,
    removed,
  ]);
  cache.setQueryData(
    sessionMemoryKey('text:new-session'),
    'Please check #ST-1',
  );
  const draft = result.current.read({ kind: 'new' })!;
  expect(draft.mentions).toEqual([selected]);
  result.current.write({ kind: 'session', sessionId: 'reply' }, draft);
  expect(result.current.read({ kind: 'session', sessionId: 'reply' })).toEqual(
    draft,
  );
  result.current.write(
    { kind: 'session', sessionId: 'reply' },
    { text: 'Different request', attachments: [] },
  );
  expect(
    result.current.read({ kind: 'session', sessionId: 'reply' })?.mentions,
  ).toEqual([]);
});
