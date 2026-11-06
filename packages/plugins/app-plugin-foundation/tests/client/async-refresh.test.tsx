import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { expect, it } from 'vitest';

import plugin from '../../client/plugin.js';
import { FOUNDATION_OVERVIEW_QUERY_KEY } from '../../client/api.js';
import { FoundationPage } from '../../client/components/foundation-page.js';
import type {
  FoundationOverview,
  FoundationSnapshot,
} from '../../shared/foundation.js';

const overview: FoundationOverview = {
  capabilities: [
    {
      key: 'dataModeling',
      status: 'active',
      facts: [],
      metrics: [
        { key: 'businessCollections', value: 0, complete: true, unit: 'count' },
        { key: 'fields', value: 4, complete: false, unit: 'count' },
        { key: 'views', value: null, complete: false, unit: 'count' },
        { key: 'relations', value: 2, complete: true, unit: 'count' },
        { key: 'physicalForeignKeys', value: 0, complete: true, unit: 'count' },
      ],
      parts: [],
      packages: [],
      completeness: 'partial',
      issues: [],
    },
  ],
  checkedAt: '2026-10-20T08:00:00.000Z',
  durationMs: 12,
  connection: 'default',
};

async function render(
  answer: (call: ApiCall) => unknown,
  cache = new QueryClient(),
) {
  return renderWithApp(
    <QueryClientProvider client={cache}>
      <FoundationPage />
    </QueryClientProvider>,
    {
      plugins: [plugin()],
      locale: 'en-US',
      fetch: answerApi(answer),
    },
  );
}

it('keeps content during background work, automatically reads its completion and stops polling at idle', async () => {
  const calls: ApiCall[] = [];
  let state: FoundationSnapshot = {
    overview,
    kernelVersion: 'fixture-2',
    snapshotKernelVersion: 'fixture-1',
    generation: 'initial',
    status: 'succeeded',
    needsScan: false,
  };
  let finish!: (value: unknown) => void;
  let round = 0;
  let held = new Promise((resolve) => {
    finish = resolve;
  });
  await render((call) => {
    calls.push(call);
    if (call.path === 'foundation/refresh') {
      state = { ...state, generation: `refresh-${++round}`, status: 'queued' };
      return { data: state };
    }
    if (call.path === 'foundation/scanStatus') return held;
    return { data: state };
  });
  await screen.findByRole('button', { name: 'Refresh' });
  expect(
    screen.getByText(
      'Showing history from kernel fixture-1; running kernel fixture-2.',
    ),
  ).toBeVisible();
  const cards = screen.getByRole('region', { name: 'Key numbers' });
  expect(
    within(cards).getByRole('button', { name: /Data tables.*0/ }),
  ).toBeVisible();
  expect(
    within(cards).getByRole('button', {
      name: /Views.*Information pending update/,
    }),
  ).toBeVisible();
  expect(
    within(cards).getByText(
      'At least this many: part of it could not be read.',
    ),
  ).toBeVisible();
  const date = screen.getByText(/^Last check /).textContent;
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(
    await screen.findByText('Updating… Showing the previous result.'),
  ).toBeVisible();
  expect(screen.getByText(/^Last check /)).toHaveTextContent(date!);
  expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  await waitFor(() =>
    expect(
      calls.filter((call) => call.path === 'foundation/scanStatus'),
    ).toHaveLength(1),
  );
  state = {
    ...state,
    overview: { ...overview, checkedAt: '2026-10-21T08:00:00.000Z' },
    snapshotKernelVersion: 'fixture-2',
    status: 'succeeded',
  };
  await act(async () => {
    finish({ data: state });
  });
  await waitFor(() =>
    expect(screen.getByText(/^Last check /).textContent).not.toBe(date),
  );
  expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
  expect(
    screen.queryByText(/Showing history from kernel/),
  ).not.toBeInTheDocument();
  expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
    'GET foundation/overview',
    'POST foundation/refresh',
    'GET foundation/scanStatus',
    'GET foundation/overview',
  ]);
  held = new Promise((resolve) => {
    finish = resolve;
  });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() =>
    expect(
      calls.filter((call) => call.path === 'foundation/scanStatus'),
    ).toHaveLength(2),
  );
  expect(
    calls.filter((call) => call.path === 'foundation/overview'),
  ).toHaveLength(2);
  state = { ...state, status: 'succeeded' };
  await act(async () => {
    finish({ data: state });
  });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled(),
  );
  expect(
    calls.filter((call) => call.path === 'foundation/overview'),
  ).toHaveLength(3);
});

it('ensures a first snapshot, shows first failure without zeroes and retries explicitly', async () => {
  const calls: ApiCall[] = [];
  let state: FoundationSnapshot = {
    kernelVersion: 'fixture-1',
    status: 'idle',
    needsScan: true,
  };
  let finish!: (value: unknown) => void;
  const held = new Promise((resolve) => {
    finish = resolve;
  });
  await render((call) => {
    calls.push(call);
    if (call.path === 'foundation/ensureScan') {
      state = {
        ...state,
        generation: 'first',
        status: 'queued',
        needsScan: false,
      };
      return { data: state };
    }
    if (call.path === 'foundation/scanStatus') return held;
    if (call.path === 'foundation/refresh') {
      state = {
        overview,
        kernelVersion: 'fixture-1',
        status: 'succeeded',
        needsScan: false,
      };
      return { data: state };
    }
    return { data: state };
  });
  await waitFor(() =>
    expect(calls.some((call) => call.path === 'foundation/scanStatus')).toBe(
      true,
    ),
  );
  expect(screen.queryByText('0')).not.toBeInTheDocument();
  state = { ...state, status: 'failed' };
  await act(async () => {
    finish({ data: state });
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Information pending update',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('button', { name: 'Refresh' });
  expect(
    calls.filter((call) => call.path === 'foundation/ensureScan'),
  ).toHaveLength(1);
  expect(
    calls.filter((call) => call.path === 'foundation/refresh'),
  ).toHaveLength(1);
});

it.each(['succeeded', 'failed'] as const)(
  'follows the server current scan when a second page starts a new generation (%s)',
  async (terminalStatus) => {
    const requests: ApiCall[] = [];
    const pendingStatuses: Array<{
      resolve: (value: unknown) => void;
    }> = [];
    let generation = 0;
    let state: FoundationSnapshot = {
      overview,
      kernelVersion: 'fixture-1',
      snapshotKernelVersion: 'fixture-1',
      generation: 'initial',
      status: 'succeeded',
      needsScan: false,
    };
    const answer = (call: ApiCall): unknown => {
      requests.push(call);
      if (call.path === 'foundation/refresh') {
        state = {
          ...state,
          generation: `g${++generation}`,
          status: 'queued',
        };
        return { data: state };
      }
      if (call.path === 'foundation/scanStatus')
        return new Promise((resolve) => pendingStatuses.push({ resolve }));
      return { data: state };
    };

    const pageA = await render(answer, new QueryClient());
    fireEvent.click(await pageA.findByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(pendingStatuses).toHaveLength(1));

    state = {
      ...state,
      status: 'succeeded',
      overview: { ...overview, checkedAt: '2026-10-21T08:00:00.000Z' },
    };
    const pageB = await render(answer, new QueryClient());
    fireEvent.click(await pageB.findByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(pendingStatuses).toHaveLength(2));

    state = {
      ...state,
      generation: 'g2',
      status: terminalStatus,
      ...(terminalStatus === 'succeeded'
        ? {
            overview: {
              ...overview,
              checkedAt: '2026-10-22T08:00:00.000Z',
            },
          }
        : {}),
    };
    await act(async () => {
      for (const pending of pendingStatuses) pending.resolve({ data: state });
    });

    await waitFor(() => {
      expect(
        within(pageA.container).getByRole('button', { name: 'Refresh' }),
      ).toBeEnabled();
      if (terminalStatus === 'succeeded') {
        expect(
          within(pageA.container).getByText(/^Last check /),
        ).toHaveTextContent('Oct 22');
      } else {
        expect(within(pageA.container).getByRole('alert')).toHaveTextContent(
          'The latest refresh failed. Showing the last successfully collected result.',
        );
      }
    });
    expect(
      requests.filter((call) => call.path === 'foundation/overview').length,
    ).toBeGreaterThanOrEqual(3);
  },
);

it('hides historical internals on a refused submission even when an earlier read already failed', async () => {
  const cache = new QueryClient();
  let failRead = false;
  await render((call) => {
    const code = call.method === 'POST' ? 403 : failRead ? 500 : undefined;
    if (code)
      return Response.json(
        {
          error: {
            code,
            status: code === 403 ? 'PERMISSION_DENIED' : 'INTERNAL',
            reason: 'FIXTURE_FAILURE',
            domain: 'foundation',
            message: 'Unavailable.',
          },
        },
        { status: code },
      );
    return {
      data: {
        overview,
        kernelVersion: 'fixture-1',
        status: 'succeeded',
        needsScan: false,
      },
    };
  }, cache);
  await screen.findByRole('button', { name: 'Refresh' });
  failRead = true;
  await act(async () => {
    await cache.refetchQueries({ queryKey: FOUNDATION_OVERVIEW_QUERY_KEY });
  });
  expect(screen.getByRole('region', { name: 'Key numbers' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Only an administrator with unrestricted access',
    ),
  );
  expect(
    screen.queryByRole('region', { name: 'Key numbers' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', { name: 'NocoBase Core' }),
  ).not.toBeInTheDocument();
});
