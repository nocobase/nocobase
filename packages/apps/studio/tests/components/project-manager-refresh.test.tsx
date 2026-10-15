import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import projects from '@nocobase/app-plugin-projects/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PROJECT_MANAGER_IDENTITY_TOPIC } from '../../shared/project-manager.js';

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  cache: null as QueryClient | null,
  realtime: {
    onOpen: vi.fn(() => () => undefined),
    subscribe: vi.fn(() => () => undefined),
  },
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useService: () => mocks.realtime,
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
  mocks.realtime.onOpen.mockClear();
  mocks.realtime.subscribe.mockClear();
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

  it('uses the active Studio cache inside the projects provider composition', async () => {
    const studioClient = new QueryClient();
    mocks.cache = new QueryClient();
    const ProjectsProvider = projects({ routes: false }).reactProviders[0]!
      .component;
    studioClient.setQueryData(['pm', 'issue', 'old'], 'old identity');
    render(
      <ProjectsProvider>
        <QueryClientProvider client={studioClient}>
          <ProjectManagerIdentityRefresh>
            <span>Page</span>
          </ProjectManagerIdentityRefresh>
        </QueryClientProvider>
      </ProjectsProvider>,
    );
    expect(mocks.subscribe).toHaveBeenCalledWith(
      PROJECT_MANAGER_IDENTITY_TOPIC,
      expect.any(Function),
    );
    const callback = mocks.subscribe.mock.calls[0]![1] as (
      value: unknown,
    ) => void;
    callback({});
    expect(
      studioClient.getQueryState(['pm', 'issue', 'old'])?.isInvalidated,
    ).toBe(true);
    studioClient.clear();
  });
});
