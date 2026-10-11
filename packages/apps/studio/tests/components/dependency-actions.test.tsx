import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';

const { api, error } = vi.hoisted(() => ({
  api: {
    issue: vi.fn(),
    addDependency: vi.fn(),
    removeDependency: vi.fn(),
    updateDependency: vi.fn(),
  },
  error: vi.fn(),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  usePmApi: () => api,
  pmKeys: { issues: ['pm', 'issues'] },
}));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  useNotify: () => ({ error }),
}));

const { useDependencyActions } =
  await import('../../client/issues/detail/dependency-actions.js');
beforeEach(() => vi.resetAllMocks());

const dependency = {
  id: 'link',
  issueId: 'b',
  identifier: 'PM-2',
  title: 'Second',
  href: '/issues/b',
  status: { name: 'Todo', color: 'gray' },
} as const;

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const keys = [
    ['pm', 'issue', 'a'],
    ['pm', 'issue', 'b'],
    ['pm', 'issue', 'PM-1'],
    ['pm', 'issues', { q: '' }],
  ];
  for (const key of keys) client.setQueryData(key, {});
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...renderHook(() => useDependencyActions('a'), { wrapper }),
    client,
    keys,
  };
}

it('passes the selected type and invalidates both details, identifier aliases and lists', async () => {
  const { result, client, keys } = setup();
  await act(() => result.current.add('b', 'relatedTo'));
  expect(api.addDependency).toHaveBeenCalledExactlyOnceWith('a', {
    dependsOnIssueId: 'b',
    type: 'relatedTo',
  });
  for (const key of keys)
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(error).not.toHaveBeenCalled();
});

it.each(['blockedBy', 'relatedTo'] as const)(
  'converts to %s in one conditional server update and refreshes both ends',
  async (type) => {
    const { result, client, keys } = setup();
    await act(() => result.current.change(dependency, type));
    expect(api.updateDependency).toHaveBeenCalledExactlyOnceWith('a', 'link', {
      type,
      expectedType: type === 'blockedBy' ? 'relatedTo' : 'blockedBy',
    });
    expect(api.issue).not.toHaveBeenCalled();
    expect(api.addDependency).not.toHaveBeenCalled();
    expect(api.removeDependency).not.toHaveBeenCalled();
    for (const key of keys)
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(error).not.toHaveBeenCalled();
  },
);

it('reports a refused conversion and refreshes stale details without retrying destructive writes', async () => {
  const { result, client, keys } = setup();
  const refused = new Error('DEPENDENCY_CHANGED');
  api.updateDependency.mockRejectedValue(refused);
  await act(async () => {
    await expect(result.current.change(dependency, 'blockedBy')).rejects.toBe(
      refused,
    );
  });
  expect(error).toHaveBeenCalledExactlyOnceWith(refused);
  expect(api.updateDependency).toHaveBeenCalledTimes(1);
  expect(api.issue).not.toHaveBeenCalled();
  expect(api.addDependency).not.toHaveBeenCalled();
  expect(api.removeDependency).not.toHaveBeenCalled();
  for (const key of keys)
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
});
