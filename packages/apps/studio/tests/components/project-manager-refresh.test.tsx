import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PROJECT_MANAGER_IDENTITY_TOPIC } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  cache: null as QueryClient | null,
}));
vi.mock('@nocobase/app-plugin-agents/client/runs', () => ({
  useRealtimeTopic: mocks.subscribe,
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  agentsQueryClient: () => mocks.cache,
}));

const { ProjectManagerIdentityRefresh } =
  await import('../../client/agents/project-manager/identity-refresh.js');
const { refreshManagerIdentity } =
  await import('../../client/agents/project-manager/identity-cache.js');
afterEach(() => {
  mocks.cache?.clear();
  mocks.subscribe.mockReset();
});

describe('renamed manager cache refresh', () => {
  it('invalidates completed runs, names, old notices and issue views in their separate caches', async () => {
    const client = new QueryClient();
    mocks.cache = new QueryClient();
    const agentKeys = [
      ['agents', 'agent-names'],
      ['agents', 'run', 'completed'],
      ['agents', 'conversation', 'old-messages'],
    ];
    const viewKeys = [
      ['pm', 'issue', 'old'],
      ['studio', 'projectManager'],
      [...inboxKeys.all, 'notices'],
    ];
    for (const key of agentKeys)
      mocks.cache.setQueryData(key, { name: 'Project manager' });
    for (const key of viewKeys)
      client.setQueryData(key, { name: 'Project manager' });
    await refreshManagerIdentity(client);
    for (const key of agentKeys)
      expect(mocks.cache.getQueryState(key)?.isInvalidated).toBe(true);
    // Inbox keys are declared by the notification plugin; its entire prefix is invalidated, rather than one page.
    expect(client.getQueryState(viewKeys[0])?.isInvalidated).toBe(true);
    expect(client.getQueryState(viewKeys[1])?.isInvalidated).toBe(true);
    expect(client.getQueryState(viewKeys[2])?.isInvalidated).toBe(true);
    client.clear();
  });

  it('subscribes to the settings signal using the surrounding projects cache', async () => {
    const client = new QueryClient();
    mocks.cache = new QueryClient();
    client.setQueryData(['pm', 'issue', 'old'], 'old identity');
    render(
      <QueryClientProvider client={client}>
        <ProjectManagerIdentityRefresh>
          <span>Page</span>
        </ProjectManagerIdentityRefresh>
      </QueryClientProvider>,
    );
    expect(mocks.subscribe).toHaveBeenCalledWith(
      PROJECT_MANAGER_IDENTITY_TOPIC,
      expect.any(Function),
    );
    const callback = mocks.subscribe.mock.calls[0]![1] as (
      value: unknown,
    ) => void;
    callback({});
    expect(client.getQueryState(['pm', 'issue', 'old'])?.isInvalidated).toBe(
      true,
    );
    client.clear();
  });
});
