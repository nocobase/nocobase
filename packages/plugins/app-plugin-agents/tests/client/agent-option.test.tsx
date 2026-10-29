// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  api,
  callsTo,
  clientMocks,
  realtime,
  resetApi,
} from './fake-client.js';
import { agent } from './fixtures.js';
import { createElement, type PropsWithChildren } from 'react';
import { RUNNERS_TOPIC } from '../../shared/realtime.js';
vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
const { useAgentOption } = await import('../../client/kit.js');
const { agentsQueryClient } = await import('../../client/query.js');
afterEach(() => {
  cleanup();
  agentsQueryClient().clear();
});
it('reads a system candidate without listing discovered agents, and refreshes its quota after clearing', async () => {
  let current = agent('system-manager', {
    source: 'system',
    unusable: 'noRunner',
    quota: [{ runnerId: 'runtime', runnerName: 'dev-2', resetsAt: null }],
  });
  resetApi({
    'agents/system-manager': () => current,
    'agents/vocabulary': () => ({}),
  });
  const hook = renderHook(() => [
    useAgentOption('system-manager'),
    useAgentOption('system-manager'),
  ]);
  await waitFor(() => expect(hook.result.current[0]?.quota).toHaveLength(1));
  expect(hook.result.current[0]?.availability.online).toBe(false);
  expect(callsTo('GET', 'agents')).toHaveLength(0);
  expect(hook.result.current[1]?.quota).toHaveLength(1);
  current = { ...current, unusable: null, quota: [] };
  await act(async () =>
    realtime.publish(RUNNERS_TOPIC, { runnerId: 'runtime' }),
  );
  await waitFor(() =>
    expect(hook.result.current[0]?.availability.online).toBe(true),
  );
  expect(
    api.calls.filter((call) => call.path === 'agents/system-manager'),
  ).toHaveLength(2);
});

it('reads fresh viewer-scoped agent options when the same page switches identity', async () => {
  const { ChatClientProvider } =
    await import('../../client/chat/controller.js');
  let viewer = 'admin';
  let prepared = true;
  resetApi({
    'agents/system-manager': () =>
      agent('system-manager', {
        canEdit: viewer === 'admin',
        quota:
          viewer === 'admin'
            ? [
                {
                  runnerId: 'private',
                  runnerName: 'Admin computer',
                  resetsAt: null,
                },
              ]
            : [],
      }),
    'agents/vocabulary': () => ({}),
  });
  function Boundary({ children }: PropsWithChildren) {
    return prepared
      ? createElement(ChatClientProvider, { key: viewer }, children)
      : null;
  }
  const hook = renderHook(() => useAgentOption('system-manager'), {
    wrapper: Boundary,
  });
  await waitFor(() => expect(hook.result.current?.quota).toHaveLength(1));
  // Authorization hides the old tree before mounting the prepared identity.
  prepared = false;
  hook.rerender();
  viewer = 'operator';
  prepared = true;
  hook.rerender();
  expect(hook.result.current).toBeNull();
  await waitFor(() => expect(hook.result.current?.quota).toHaveLength(0));
  expect(
    agentsQueryClient().getQueryData(['agents', 'agent', 'system-manager']),
  ).toMatchObject({ canEdit: false });
  expect(callsTo('GET', 'agents/system-manager')).toHaveLength(2);
});
