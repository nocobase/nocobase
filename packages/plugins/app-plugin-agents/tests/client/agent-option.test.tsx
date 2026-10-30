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
