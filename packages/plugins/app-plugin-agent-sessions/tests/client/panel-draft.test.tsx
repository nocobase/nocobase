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
