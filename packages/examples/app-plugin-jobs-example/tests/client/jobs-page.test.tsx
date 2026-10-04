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
  type RenderResult,
} from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { JOB_TASKS_TOPIC, type JobTask } from '../../client/lib/api.js';
import locales from '../../client/locales/index.js';

// The page reads both clients through hooks, so the mocks hand back the same
// objects on every render.
const state = vi.hoisted(() => ({
  api: undefined as ApiClient | undefined,
  realtime: undefined as RealtimeClient | undefined,
}));

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
  useService: () => state.realtime,
}));

import JobsPage from '../../client/pages/jobs.js';

const created: JobTask = {
  jobId: 'abcdef1234',
  status: 'queued',
  progress: 0,
  attempt: 0,
  createdAt: '2030-01-01T00:00:00.000Z',
  updatedAt: '2030-01-01T00:00:00.000Z',
};

let listener: ((event: RealtimeEvent<JobTask>) => void) | undefined;
const unsubscribe = vi.fn();
const request = vi.fn();

beforeEach(() => {
  listener = undefined;
  unsubscribe.mockReset();
  request.mockReset();
  request.mockImplementation(async ({ method = 'GET' }) =>
    method === 'POST' ? { data: created } : { data: [] },
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
      <JobsPage />
    </I18nProvider>,
  );
}

function push(task: JobTask): void {
  act(() => {
    listener!({
      type: 'event',
      topic: JOB_TASKS_TOPIC,
      payload: task,
    } as never);
  });
}

it('subscribes while open, adds a block per created job and follows its progress', async () => {
  const view = await show();
  expect(state.realtime!.subscribe).toHaveBeenCalledExactlyOnceWith(
    JOB_TASKS_TOPIC,
    expect.any(Function),
  );
  expect(await screen.findByText(/No jobs yet/u)).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Create job' }));
  expect(await screen.findByText('Job abcdef12')).toBeTruthy();
  expect(request).toHaveBeenCalledWith({
    method: 'POST',
    path: 'jobsExample/tasks',
  });
  expect(screen.getByText('Queued')).toBeTruthy();

  push({
    ...created,
    status: 'running',
    progress: 40,
    attempt: 1,
    updatedAt: '2030-01-01T00:00:04.000Z',
  });
  expect(screen.getByText('Running')).toBeTruthy();
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(
    '40',
  );

  push({
    ...created,
    status: 'completed',
    progress: 100,
    attempt: 1,
    updatedAt: '2030-01-01T00:00:10.000Z',
  });
  expect(screen.getByText('Completed')).toBeTruthy();

  view.unmount();
  expect(unsubscribe).toHaveBeenCalledOnce();
});
