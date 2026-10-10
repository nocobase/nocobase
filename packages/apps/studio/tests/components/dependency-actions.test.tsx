import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';

const { api, error } = vi.hoisted(() => ({
  api: { issue: vi.fn(), addDependency: vi.fn(), removeDependency: vi.fn() },
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

it('reports a refused conversion, leaves the original link and refreshes stale details', async () => {
  const { result, client, keys } = setup();
  api.issue.mockResolvedValue({
    blockedBy: [],
    relatedTo: [{ dependencyId: 'link', issueId: 'b', type: 'relatedTo' }],
  });
  const refused = new Error('Cyclic dependency');
  api.addDependency.mockRejectedValue(refused);
  await act(async () => {
    await expect(
      result.current.change(
        {
          id: 'link',
          issueId: 'b',
          identifier: 'PM-2',
          title: 'Second',
          href: '/issues/b',
          status: { name: 'Todo', color: 'gray' },
        },
        'blockedBy',
      ),
    ).rejects.toBe(refused);
  });
  expect(error).toHaveBeenCalledExactlyOnceWith(refused);
  expect(api.removeDependency).not.toHaveBeenCalled();
  for (const key of keys)
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
});
