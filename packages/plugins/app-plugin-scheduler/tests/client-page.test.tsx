// @vitest-environment jsdom

import type { I18nRuntime } from '@nocobase/i18n';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

const mocks = vi.hoisted(() => {
  const request = vi.fn();
  return { request, api: { request } };
});

const NS = '@nocobase/app-plugin-scheduler';
let runtime: I18nRuntime;

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  apiClientToken: Symbol('api-client'),
  useService: () => mocks.api,
}));
import SchedulesPage from '../client/pages/schedules-page.js';
import ScheduleDetailPage from '../client/pages/schedule-detail-page.js';
import { formatCronDescription } from '../client/pages/cron-description.js';
import { formatClientRelativeTime } from '../client/pages/date-time.js';
import locales from '../client/locales/index.js';

function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace={NS}>
      {children}
    </TestI18nProvider>
  );
}

const schedules = [
  {
    id: 'schedule-1',
    title: 'Daily customer sync',
    description: 'Synchronize active customers',
    cron: '0 0 2 * * *',
    timezone: 'UTC',
    enabled: true,
    lifecycleState: 'active',
    scheduleStatus: 'active',
    runCount: 4,
    completedCount: 3,
    lastRunAt: '2026-09-01T02:00:00.000Z',
    nextRunAt: '2026-09-02T02:00:00.000Z',
    targetType: 'workflow',
    targetState: 'ready',
    targetSummary: {
      targetLabel: 'Customer sync',
      description: 'Published workflow',
      state: 'ready',
    },
  },
  {
    id: 'schedule-2',
    title: 'Archive cleanup',
    cron: '0 0 3 * * 0',
    timezone: 'Asia/Singapore',
    enabled: false,
    lifecycleState: 'active',
    scheduleStatus: 'paused',
    runCount: 2,
    completedCount: 0,
    targetType: 'cleanup',
    targetState: 'ready',
    targetSummary: { targetLabel: 'Cleanup job', state: 'ready' },
  },
] as const;

const localDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const timeZoneLabelledFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

function renderList(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <SchedulesPage />
    </MemoryRouter>,
    { wrapper: I18n },
  );
}

function renderDetail(
  scheduleId: string = 'schedule-1',
): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[`/settings/schedules/${scheduleId}`]}>
      <Routes>
        <Route
          element={<ScheduleDetailPage />}
          path='/settings/schedules/:scheduleId'
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: I18n },
  );
}

describe('SchedulesPage', () => {
  beforeEach(async () => {
    mocks.request.mockReset();
    // Target types are registered by other plugins, so the page labels one it has no key for by its type name
    // (`defaultValue: type`); the fixtures' `cleanup` and `app.scheduled-log` are such types.
    runtime = await createTestI18nRuntime({
      namespaces: { [NS]: locales },
      strict: false,
    });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('describes interval schedules in the active language', () => {
    expect(formatCronDescription('0 0 */2 * * *', 'en-US')).toBe(
      'On the hour, every 2 hours',
    );
    expect(formatCronDescription('0 0 0 */3 * *', 'zh-CN')).toBe(
      '在上午 12:00, 每隔 3 天',
    );
  });

  it('renders a page title and empty state without developer-facing copy', async () => {
    let resolveRequest: ((value: { data: never[] }) => void) | undefined;
    mocks.request.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderList();
    expect(screen.getByText('Loading scheduled tasks…')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Scheduled tasks' }),
    ).toBeTruthy();
    expect(screen.queryByText('Create')).toBeNull();
    expect(screen.queryByText('Read only')).toBeNull();
    expect(screen.queryByText('Read-only code-defined schedules.')).toBeNull();

    resolveRequest?.({ data: [] });
    expect(
      await screen.findByText('No scheduled tasks are defined.'),
    ).toBeTruthy();
  });

  it('renders the plugin-owned Chinese locale through its namespace', async () => {
    await act(() => runtime.changeLanguage('zh-CN'));
    mocks.request.mockResolvedValueOnce({ data: schedules });

    renderList();
    expect(await screen.findByText('在上午 02:00')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '定时任务' })).toBeTruthy();
    expect(screen.queryByText('只读')).toBeNull();
    expect(screen.queryByText('0 0 2 * * *')).toBeNull();
  });

  it('filters schedules by text, status, and target', async () => {
    mocks.request.mockResolvedValueOnce({ data: schedules });
    renderList();

    await screen.findByText('Daily customer sync');
    // The next trigger shows a local absolute time and no timezone label.
    expect(
      screen.getByText(
        localDateTimeFormatter.format(new Date('2026-09-02T02:00:00.000Z')),
      ),
    ).toBeTruthy();
    expect(
      screen.queryByText(
        timeZoneLabelledFormatter.format(new Date('2026-09-02T02:00:00.000Z')),
      ),
    ).toBeNull();
    // The last trigger is relative only, so its exact instant is not rendered.
    expect(
      screen.queryByText(
        localDateTimeFormatter.format(new Date('2026-09-01T02:00:00.000Z')),
      ),
    ).toBeNull();
    expect(screen.queryByText('2026-09-01T02:00:00.000Z')).toBeNull();
    expect(screen.queryByText('2026-09-02T02:00:00.000Z')).toBeNull();
    // The list intentionally has no aggregate statistics panel.
    expect(screen.queryByText('Triggers')).toBeNull();
    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.getByText('At 02:00 AM')).toBeTruthy();
    expect(screen.queryByText('0 0 2 * * *')).toBeNull();

    // A row names its execution target by kind, and carries no description.
    const syncRow = screen.getByText('Daily customer sync').closest('tr');
    expect(syncRow).not.toBeNull();
    expect(within(syncRow!).getByText('Workflow')).toBeTruthy();
    expect(within(syncRow!).queryByText('Customer sync')).toBeNull();
    const cleanupRow = screen.getByText('Archive cleanup').closest('tr');
    expect(cleanupRow).not.toBeNull();
    expect(within(cleanupRow!).getByText('cleanup')).toBeTruthy();
    expect(within(cleanupRow!).queryByText('Cleanup job')).toBeNull();
    expect(screen.queryByText('Synchronize active customers')).toBeNull();

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search schedules' }),
      {
        target: { value: 'cleanup' },
      },
    );
    expect(screen.queryByText('Daily customer sync')).toBeNull();
    expect(screen.getByText('Archive cleanup')).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    await chooseOption(
      await screen.findByRole('option', { name: 'Active', exact: true }),
    );
    expect(screen.getByText('Daily customer sync')).toBeTruthy();
    expect(screen.queryByText('Archive cleanup')).toBeNull();

    fireEvent.click(screen.getByRole('combobox', { name: 'Filter by status' }));
    await chooseOption(
      await screen.findByRole('option', { name: 'All statuses', exact: true }),
    );
    fireEvent.click(
      screen.getByRole('combobox', { name: 'Filter by target type' }),
    );
    await chooseOption(
      await screen.findByRole('option', { name: 'cleanup', exact: true }),
    );
    expect(screen.getByText('Archive cleanup')).toBeTruthy();
    expect(screen.queryByText('Daily customer sync')).toBeNull();
  });

  it('keeps long target type tags on one line in the list', async () => {
    const longTargetSchedule = {
      ...schedules[0],
      id: 'schedule-long-target',
      title: 'Server log report',
      targetType: 'app.scheduled-log',
    };
    mocks.request.mockResolvedValueOnce({ data: [longTargetSchedule] });
    const { container } = renderList();

    const row = (await screen.findByText('Server log report')).closest('tr');
    expect(row).not.toBeNull();
    const tag = within(row!).getByText('app.scheduled-log');
    expect(tag.className).toContain('whitespace-nowrap');
    expect(tag.className).toContain('truncate');
    expect(
      container.querySelector('colgroup col:nth-child(2)')?.className,
    ).toBe('w-[16%]');
  });

  it('links the task title to its dedicated detail page', async () => {
    mocks.request.mockResolvedValueOnce({ data: schedules });
    renderList();

    const link = await screen.findByRole('link', {
      name: 'Daily customer sync',
    });
    expect(link.getAttribute('href')).toBe('/settings/schedules/schedule-1');
    expect(screen.queryByRole('link', { name: 'View details' })).toBeNull();
    expect(screen.queryByText('Schedule details')).toBeNull();
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });

  it('paginates the list once it outgrows one page', async () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      ...schedules[0],
      id: `schedule-${index + 1}`,
      title: `Task ${index + 1}`,
    }));
    mocks.request.mockResolvedValueOnce({ data: many });
    renderList();

    await screen.findByText('Task 1');
    expect(screen.getByText('Page 1 of 2')).toBeTruthy();
    expect(screen.getByText('Task 10')).toBeTruthy();
    expect(screen.queryByText('Task 11')).toBeNull();
    expect(
      (screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Task 11')).toBeTruthy();
    expect(screen.getByText('Task 12')).toBeTruthy();
    expect(screen.queryByText('Task 1')).toBeNull();
    expect(
      (screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    // Narrowing the list starts again from the first page, and the pager
    // disappears once everything fits on one.
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Task 1' },
    });
    expect(screen.getByText('Task 1')).toBeTruthy();
    expect(screen.getByText('Task 11')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('hides the pager while the list fits on one page', async () => {
    mocks.request.mockResolvedValueOnce({ data: schedules });
    renderList();

    await screen.findByText('Daily customer sync');
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(screen.queryByText('Page 1 of 1')).toBeNull();
  });

  it('merges trigger count and last trigger into one relative column', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));
    mocks.request.mockResolvedValueOnce({ data: schedules });
    renderList();

    await screen.findByText('Daily customer sync');
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent),
    ).toEqual([
      'Name',
      'Target',
      'Status',
      'Schedule / timezone',
      'Triggered',
      'Next trigger',
    ]);

    const row = screen.getByText('Daily customer sync').closest('tr');
    expect(row).not.toBeNull();
    const triggered = within(row!).getAllByRole('cell')[4];
    expect(triggered?.textContent).toContain('4');
    expect(triggered?.textContent).toContain(
      formatClientRelativeTime(
        '2026-09-01T02:00:00.000Z',
        new Date('2026-09-02T12:00:00.000Z'),
      )!,
    );
    // A schedule that has never triggered still occupies the same cell shape.
    const never = screen.getByText('Archive cleanup').closest('tr');
    expect(within(never!).getAllByRole('cell')[4]?.textContent).toContain('—');
  });

  it('carries the enabled state as a switch of its own, named by the action it performs', async () => {
    mocks.request.mockResolvedValueOnce({ data: schedules });
    renderList();

    await screen.findByText('Daily customer sync');
    const syncRow = screen.getByText('Daily customer sync').closest('tr');
    expect(syncRow).not.toBeNull();
    const [name, , status] = within(syncRow!).getAllByRole('cell');
    // The title cell carries the link alone; `enabled` is database-owned state
    // an administrator toggles, so it reads as a control rather than a label.
    expect(
      within(name!).getByRole('link', { name: 'Daily customer sync' }),
    ).toBeTruthy();
    expect(within(name!).queryByRole('switch')).toBeNull();
    const enabledSwitch = within(status!).getByRole('switch');
    // The switch is named for what it would do, not for the state it is in.
    expect(enabledSwitch.getAttribute('aria-label')).toBe('Disable');
    expect(enabledSwitch.getAttribute('aria-checked')).toBe('true');

    // A paused schedule reports that state through the same control.
    const cleanupRow = screen.getByText('Archive cleanup').closest('tr');
    const cleanupSwitch = within(cleanupRow!).getByRole('switch');
    expect(cleanupSwitch.getAttribute('aria-label')).toBe('Enable');
    expect(cleanupSwitch.getAttribute('aria-checked')).toBe('false');
  });

  it('navigates to the detail page from the title rather than from the whole row', async () => {
    mocks.request.mockImplementation(({ path }: { path: string }) =>
      Promise.resolve({ data: path === 'schedules' ? schedules : [] }),
    );
    render(
      <MemoryRouter initialEntries={['/settings/schedules']}>
        <Routes>
          <Route element={<SchedulesPage />} path='/settings/schedules' />
          <Route
            element={<ScheduleDetailPage />}
            path='/settings/schedules/:scheduleId'
          />
        </Routes>
      </MemoryRouter>,
      { wrapper: I18n },
    );

    const title = await screen.findByText('Daily customer sync');
    const row = title.closest('tr');
    expect(row).not.toBeNull();
    // The row carries a switch, so a row-wide click target would swallow the
    // toggle. Only the title navigates.
    expect(row?.className).not.toContain('cursor-pointer');
    fireEvent.click(within(row!).getAllByRole('cell')[1]!);
    expect(
      screen.queryByRole('link', { name: 'Back to scheduled tasks' }),
    ).toBeNull();

    fireEvent.click(title);
    expect(
      await screen.findByRole('link', { name: 'Back to scheduled tasks' }),
    ).toBeTruthy();
  });

  it('renders the read-only overview on the dedicated detail route', async () => {
    mocks.request.mockImplementation(({ path }: { path: string }) =>
      Promise.resolve({ data: path === 'schedules' ? schedules : [] }),
    );
    renderDetail();

    const heading = await screen.findByRole('heading', {
      name: 'Daily customer sync',
    });
    expect(screen.getByText('Synchronize active customers')).toBeTruthy();
    expect(screen.queryByText('Schedule details')).toBeNull();
    const header = heading.closest('header');
    expect(header).not.toBeNull();
    expect(within(header!).queryByText('0 0 2 * * *')).toBeNull();
    expect(within(header!).queryByText('UTC')).toBeNull();
    expect(screen.getByText('At 02:00 AM')).toBeTruthy();
    expect(screen.queryByText('0 0 2 * * *')).toBeNull();
    expect(screen.getByText('UTC')).toBeTruthy();
    expect(screen.getByText('Trigger count')).toBeTruthy();
    expect(screen.getByText('Published workflow')).toBeTruthy();
    expect(screen.queryByText('Target state')).toBeNull();
    expect(screen.queryByText('ready')).toBeNull();
    expect(
      screen
        .getByRole('link', { name: 'Back to scheduled tasks' })
        .getAttribute('href'),
    ).toBe('/settings/schedules');

    expect(await screen.findByText('No triggers have started.')).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Execution records' }),
    ).toBeTruthy();

    for (const action of [
      'Create',
      'Edit',
      'Enable',
      'Disable',
      'Run now',
      'Delete',
      'Duplicate',
    ])
      expect(screen.queryByRole('button', { name: action })).toBeNull();
  });

  it('renders trigger timing, status, and reason without internal metadata', async () => {
    mocks.request.mockImplementation(({ path }: { path: string }) =>
      Promise.resolve({
        data:
          path === 'schedules'
            ? [schedules[0]]
            : [
                {
                  id: 'occurrence-1',
                  status: 'triggered',
                  reason: 'accepted',
                  executionCount: 1,
                  startedAt: '2026-09-01T02:00:01.000Z',
                  finishedAt: '2026-09-01T02:00:02.000Z',
                  targetReceipt: { eventKey: 'private-value' },
                },
              ],
      }),
    );
    renderDetail();

    await screen.findByRole('heading', { name: 'Daily customer sync' });
    const status = await screen.findByText('Triggered (result unknown)');
    const trigger = within(status.closest('tr')!);
    expect(trigger.getByText('accepted')).toBeTruthy();
    expect(
      trigger.getByText(
        localDateTimeFormatter.format(new Date('2026-09-01T02:00:01.000Z')),
      ),
    ).toBeTruthy();
    expect(trigger.queryByText('2026-09-01T02:00:01.000Z')).toBeNull();
    expect(screen.queryByText('Run 4')).toBeNull();
    expect(screen.queryByText('Executions')).toBeNull();
    expect(screen.queryByText('Receipt')).toBeNull();
    expect(screen.queryByText('Recorded')).toBeNull();
    expect(screen.queryByText('private-value')).toBeNull();
  });
});

async function chooseOption(option: HTMLElement): Promise<void> {
  fireEvent.pointerDown(option, { pointerType: 'mouse' });
  fireEvent.click(option);
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
}
