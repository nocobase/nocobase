import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import enUS from '../client/locales/en-US.js';
const { request, client } = vi.hoisted(() => {
  const request = vi.fn();
  return { request, client: { request } };
});
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => client,
}));

const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-hub': enUS },
});

function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace='@nocobase/app-plugin-hub'>
      {children}
    </TestI18nProvider>
  );
}
import { LogViewer } from '../client/pages/hub/log-viewer.js';
beforeEach(() => request.mockReset());

/** A log read as the server answers it: the entries in `data`, the token and the journal's state in `meta`. */
function logResponse({
  entries,
  cursor,
  ...meta
}: {
  readonly entries: readonly object[];
  readonly cursor: string;
  readonly [key: string]: unknown;
}): object {
  return { data: entries, meta: { ...meta, nextPageToken: cursor } };
}
afterEach(() => vi.restoreAllMocks());
it('shows a persisted deployment error and sends filters to the deployment endpoint', async () => {
  request.mockResolvedValue(
    logResponse({
      entries: [
        {
          time: '2026-09-17',
          level: 'error',
          msg: 'Initialization failed',
          err: { stack: 'Error: invalid secret\n at initialize' },
        },
      ],
      cursor: 'cursor',
      available: true,
      hasMore: false,
      enabled: true,
      status: 'failed',
    }),
  );
  render(<LogViewer appId='app2' deploymentId='deployment-1' />, {
    wrapper: I18n,
  });
  await screen.findByText(/Initialization failed/, { selector: 'summary' });
  expect(request.mock.calls[0]?.[0].path).toBe(
    'hub/apps/app2/deployments/deployment-1/logs',
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Level' }));
  const errorOption = await screen.findByRole('option', {
    name: 'error',
    exact: true,
  });
  fireEvent.pointerDown(errorOption, { pointerType: 'mouse' });
  fireEvent.click(errorOption);
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ level: 'error' }),
      }),
    ),
  );
  fireEvent.click(screen.getByRole('combobox', { name: 'Level' }));
  const allOption = await screen.findByRole('option', {
    name: 'All levels',
    exact: true,
  });
  fireEvent.pointerDown(allOption, { pointerType: 'mouse' });
  fireEvent.click(allOption);
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.not.objectContaining({ level: expect.anything() }),
      }),
    ),
  );
});
it('distinguishes unavailable collection from an empty filtered result', async () => {
  request.mockResolvedValue(
    logResponse({
      entries: [],
      cursor: '',
      available: false,
      hasMore: false,
      enabled: true,
      status: 'succeeded',
    }),
  );
  render(<LogViewer appId='app2' deploymentId='old-deployment' />, {
    wrapper: I18n,
  });
  await screen.findByText(enUS.logs.unavailable);
});

function logPage(
  entries: Array<{ time: string; msg: string; logId: string }>,
  extra = {},
): object {
  return logResponse({
    entries: entries.map((entry) => ({ ...entry, level: 'info' })),
    cursor: 'next',
    available: true,
    hasMore: false,
    enabled: true,
    reset: false,
    status: 'succeeded',
    ...extra,
  });
}

it('keeps paged history ordered and deduplicated and replaces entries after a reset', async () => {
  const first = { time: '2026-09-17T12:00:00Z', msg: 'First', logId: 'first' };
  const earlier = {
    time: '2026-09-16T12:00:00Z',
    msg: 'Earlier',
    logId: 'earlier',
  };
  request
    .mockResolvedValueOnce(logPage([]))
    .mockResolvedValueOnce(logPage([first], { hasMore: true }))
    .mockResolvedValueOnce(logPage([earlier, first], { hasMore: true }))
    .mockResolvedValueOnce(
      logPage([{ ...first, msg: 'Restarted scan', logId: 'new' }], {
        reset: true,
      }),
    );
  const { container } = render(
    <LogViewer appId='app2' deploymentId='deployment-1' />,
    { wrapper: I18n },
  );
  await screen.findByText('No matching log entries.');
  fireEvent.click(screen.getByText('Load retained history'));
  await screen.findByText(/First/, { selector: 'summary' });
  fireEvent.click(screen.getByText('Load next entries'));
  await screen.findByText(/Earlier/, { selector: 'summary' });
  expect(
    [...container.querySelectorAll('summary')].map(
      (element) => element.textContent,
    ),
  ).toEqual([
    expect.stringContaining('Earlier'),
    expect.stringContaining('First'),
  ]);
  fireEvent.click(screen.getByText('Load next entries'));
  await screen.findByText(/Restarted scan/, { selector: 'summary' });
  expect(container.querySelectorAll('summary')).toHaveLength(1);
  expect(screen.getByText(enUS.logs.rotated)).toBeInTheDocument();
});

it('continues an empty history scan and pauses after finding records', async () => {
  request
    .mockResolvedValueOnce(logPage([]))
    .mockResolvedValueOnce(logPage([], { hasMore: true }))
    .mockResolvedValueOnce(
      logPage(
        [{ time: '2026-09-17', msg: 'Matching record', logId: 'match' }],
        { hasMore: true },
      ),
    );
  render(<LogViewer appId='app2' deploymentId='deployment-1' />, {
    wrapper: I18n,
  });
  await screen.findByText('No matching log entries.');
  fireEvent.click(screen.getByText('Load retained history'));
  await screen.findByText(/Matching record/, { selector: 'summary' });
  expect(request).toHaveBeenCalledTimes(3);
  expect(screen.getByText('Load next entries')).toBeInTheDocument();
});

it('downloads every page with a stable time boundary and rejects a reset during export', async () => {
  const record = {
    time: '2026-09-17',
    msg: 'First export record',
    logId: 'first',
  };
  request
    .mockResolvedValueOnce(logPage([]))
    .mockResolvedValueOnce(
      logPage([record], { hasMore: true, cursor: 'download-next' }),
    )
    .mockResolvedValueOnce(
      logPage([{ ...record, msg: 'Second export record', logId: 'second' }]),
    )
    .mockResolvedValueOnce(logPage([record], { reset: true }));
  let downloaded: Blob | undefined;
  const create = vi.fn((blob: Blob) => {
    downloaded = blob;
    return 'blob:test';
  });
  vi.stubGlobal(
    'URL',
    class extends URL {
      static override createObjectURL = create;
      static override revokeObjectURL = vi.fn();
    },
  );
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  try {
    render(<LogViewer appId='app2' deploymentId='deployment-1' />, {
      wrapper: I18n,
    });
    await screen.findByText('No matching log entries.');
    fireEvent.click(screen.getByText('Download logs'));
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(downloaded?.size).toBeGreaterThan(100);
    expect(request.mock.calls[2]?.[0].query).toMatchObject({
      pageToken: 'download-next',
      fromStart: true,
      until: request.mock.calls[1]?.[0].query.until,
    });
    fireEvent.click(screen.getByText('Download logs'));
    await screen.findByText(enUS.logs.downloadChanged);
    expect(click).toHaveBeenCalledTimes(1);
  } finally {
    vi.unstubAllGlobals();
  }
});

it('submits local date-time filters as ISO timestamps and clears them independently', async () => {
  request.mockResolvedValue(logPage([]));
  render(<LogViewer appId='app2' />, { wrapper: I18n });
  await screen.findByText('No matching log entries.');
  const today = new Date();
  const dayName = new RegExp(
    `${today.toLocaleDateString('en-US', { month: 'long' })} ${today.getDate()}(?:st|nd|rd|th)?, ${today.getFullYear()}`,
  );
  fireEvent.click(screen.getByRole('button', { name: 'From time' }));
  fireEvent.click(await screen.findByRole('button', { name: dayName }));
  fireEvent.change(screen.getByLabelText('Time'), {
    target: { value: '13:45' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  const since = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    13,
    45,
  ).toISOString();
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ since }) }),
    ),
  );

  fireEvent.click(screen.getByRole('button', { name: 'Until time' }));
  fireEvent.click(await screen.findByRole('button', { name: dayName }));
  fireEvent.change(screen.getByLabelText('Time'), {
    target: { value: '23:59' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  const until = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
  ).toISOString();
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ since, until }),
      }),
    ),
  );

  fireEvent.click(screen.getByRole('button', { name: 'From time' }));
  expect(screen.getByLabelText('Time')).toHaveValue('13:45');
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  await waitFor(() => {
    const query = request.mock.lastCall?.[0].query;
    expect(query).not.toHaveProperty('since');
    expect(query).toHaveProperty('until', until);
  });
});

it('labels numeric and textual log levels while retaining raw entry details', async () => {
  const levels = [10, 20, 30, 40, 50, 60, 'info', 'WARN', '50', 35, 'custom'];
  const labels = [
    'TRACE',
    'DEBUG',
    'INFO',
    'WARN',
    'ERROR',
    'FATAL',
    'INFO',
    'WARN',
    'ERROR',
    '35',
    'CUSTOM',
  ];
  request.mockResolvedValue(
    logResponse({
      entries: levels.map((level, index) => ({
        time: '2026-09-19',
        level,
        msg: `entry-${index}`,
        logId: String(index),
      })),
      cursor: '',
      available: true,
      hasMore: false,
      enabled: true,
      status: 'succeeded',
    }),
  );
  const { container } = render(<LogViewer appId='app2' />, { wrapper: I18n });
  await screen.findByText(/entry-10/, { selector: 'summary' });
  const summaries = [...container.querySelectorAll('summary')];
  levels.forEach((level, index) => {
    const summary = summaries.find((element) =>
      element.textContent?.endsWith(`entry-${index}`),
    )!;
    expect(summary).toHaveTextContent(`[${labels[index]}]`);
    expect(summary.classList.contains('text-destructive')).toBe(
      ['ERROR', 'FATAL'].includes(labels[index]!),
    );
    expect(
      JSON.parse(summary.parentElement!.querySelector('pre')!.textContent!)
        .level,
    ).toBe(level);
  });
});
