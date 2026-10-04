import type {
  ApiClient,
  RealtimeClient,
  RealtimeEvent,
} from '@nocobase/app-client';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  type RenderResult,
} from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import {
  SCHEDULE_CHANGES_TOPIC,
  type ScheduleRule,
} from '../../client/lib/api.js';
import locales from '../../client/locales/index.js';

const state = vi.hoisted(() => ({
  api: undefined as ApiClient | undefined,
  realtime: undefined as RealtimeClient | undefined,
}));

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
  useService: () => state.realtime,
}));

import SchedulesPage from '../../client/pages/schedules.js';

function rule(overrides: Partial<ScheduleRule>): ScheduleRule {
  return {
    name: 'interval',
    builtIn: false,
    options: { every: 5_000 },
    state: 'stopped',
    firings: 0,
    runs: [],
    ...overrides,
  };
}

let rules: ScheduleRule[] = [];
let listener: ((event: RealtimeEvent<unknown>) => void) | undefined;
const unsubscribe = vi.fn();
const request = vi.fn();

beforeEach(() => {
  rules = [
    rule({
      name: 'heartbeat',
      builtIn: true,
      options: { every: 60_000 },
      state: 'active',
      nextRunAt: new Date(Date.now() + 30_000).toISOString(),
    }),
    rule({}),
  ];
  listener = undefined;
  unsubscribe.mockReset();
  request.mockReset();
  request.mockImplementation(
    async ({ method = 'GET', path }: { method?: string; path: string }) => {
      if (method === 'GET') return { data: rules };
      if (path.endsWith('/start'))
        rules = rules.map((each) =>
          each.name === 'interval'
            ? {
                ...each,
                state: 'active',
                nextRunAt: new Date(Date.now() + 5_000).toISOString(),
              }
            : each,
        );
      return undefined;
    },
  );
  state.api = { request } as unknown as ApiClient;
  state.realtime = {
    connected: true,
    subscribe: vi.fn((_topic: string, next: typeof listener) => {
      listener = next;
      return unsubscribe;
    }),
    onOpen: vi.fn(() => () => undefined),
  } as unknown as RealtimeClient;
});

async function show(): Promise<RenderResult> {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US'],
    applicationNamespace: 'test-app',
  });
  runtime.registerNamespace('@nocobase/app-plugin-jobs-example', locales);
  await runtime.init('en-US');
  return render(
    <I18nProvider runtime={runtime}>
      <SchedulesPage />
    </I18nProvider>,
  );
}

it('lists the rules, starts one and reloads on every pushed change', async () => {
  const view = await show();
  expect(state.realtime!.subscribe).toHaveBeenCalledExactlyOnceWith(
    SCHEDULE_CHANGES_TOPIC,
    expect.any(Function),
  );
  expect(await screen.findByText('Heartbeat')).toBeTruthy();
  expect(screen.getByText('Built in')).toBeTruthy();
  expect(screen.getByText('Stopped')).toBeTruthy();
  // The built-in rule offers no action; the other one offers Start.
  expect(screen.getAllByRole('button', { name: 'Start' })).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: 'Start' }));
  expect(await screen.findByRole('button', { name: 'Stop' })).toBeTruthy();
  expect(request).toHaveBeenCalledWith({
    method: 'POST',
    path: 'jobsExample/rules/interval/start',
  });

  fireEvent.click(screen.getByRole('button', { name: 'Every 10s' }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith({
      method: 'POST',
      path: 'jobsExample/rules/interval/start',
      json: { every: 10_000 },
    }),
  );

  // A push carries only the rule's name; the page reads the rules again.
  rules = rules.map((each) =>
    each.name === 'heartbeat'
      ? {
          ...each,
          firings: 1,
          runs: [
            {
              jobId: 'heartbeat:1',
              scheduledAt: '2030-01-01T00:00:00.000Z',
              runAt: '2030-01-01T00:00:00.120Z',
              outcome: 'succeeded',
            },
          ],
        }
      : each,
  );
  act(() => {
    listener!({
      type: 'event',
      topic: SCHEDULE_CHANGES_TOPIC,
      payload: { name: 'heartbeat' },
    } as never);
  });
  expect(await screen.findByText('started 120 ms late')).toBeTruthy();

  view.unmount();
  expect(unsubscribe).toHaveBeenCalledOnce();
});
