import type { ApiClient } from '@nocobase/app-client';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  type RenderResult,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';
import locales from '../client/locales/index.js';
import { TASK_STATUSES, type Task, type User } from '../client/lib/api.js';

// The pages read the client through a hook, so the mock has to keep handing back the same object: a new one per
// render would change the load callback's identity and re-run the effect that fetches the page data.
const state = vi.hoisted(() => ({
  api: undefined as ApiClient | undefined,
  request: vi.fn(),
}));

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => state.api,
}));

import TaskDetailPage from '../client/pages/task-detail.js';
import TasksPage from '../client/pages/tasks.js';

type Locale = 'en-US' | 'zh-CN';

const copy: Record<Locale, typeof enUS> = { 'en-US': enUS, 'zh-CN': zhCN };

const users: readonly User[] = [
  { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.test' },
  { id: 'user-2', name: 'Grace Hopper', email: 'grace@example.test' },
];

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Review the release notes',
    description: 'Check every entry against the changelog.',
    status: 'open',
    creatorId: users[0].id,
    assigneeId: users[0].id,
    createdAt: '2026-09-23T02:00:00.000Z',
    updatedAt: '2026-09-23T02:00:00.000Z',
    creator: users[0],
    assignee: users[0],
    ...overrides,
  };
}

interface RequestOptions {
  readonly json?: Record<string, unknown>;
  readonly method?: string;
  readonly path: string;
  readonly query?: Record<string, number | string | undefined>;
}

function userById(id: string): User {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) throw new Error(`Unknown user ${id}`);
  return user;
}

beforeEach(() => {
  let stored = createTask();
  state.request.mockReset();
  state.request.mockImplementation(
    async ({ json, method = 'GET', path, query }: RequestOptions) => {
      if (path === 'notificationExample/assignees') return { data: users };
      if (path === 'notificationExample/tasks' && method === 'GET') {
        return {
          data: [stored],
          meta: {
            page: Number(query?.page ?? 1),
            pageSize: Number(query?.pageSize ?? 10),
            total: 11,
          },
        };
      }
      if (path === 'notificationExample/tasks' && method === 'POST') {
        const assigneeId = String(json?.assigneeId ?? '');
        stored = createTask({
          ...json,
          id: 'task-2',
          assigneeId,
          assignee: userById(assigneeId),
        });
        return { data: stored };
      }
      if (path.startsWith('notificationExample/tasks/') && method === 'PATCH') {
        const assigneeId = String(json?.assigneeId ?? stored.assigneeId);
        stored = {
          ...stored,
          ...json,
          assigneeId,
          assignee: userById(assigneeId),
        };
        return { data: stored };
      }
      if (path.startsWith('notificationExample/tasks/')) {
        return { data: stored };
      }
      throw new Error(`Unexpected request ${method} ${path}`);
    },
  );
  state.api = { request: state.request } as unknown as ApiClient;
});

async function show(
  locale: Locale,
  entries: readonly string[],
): Promise<RenderResult> {
  const runtime = new I18nRuntime({
    defaultLocale: locale,
    locales: [locale],
    applicationNamespace: 'test-app',
  });
  runtime.registerNamespace(
    '@nocobase/app-plugin-notification-example',
    locales,
  );
  await runtime.init(locale);
  return render(
    <I18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[...entries]}>
        <Routes>
          <Route path='/notification-example' element={<TasksPage />} />
          <Route
            path='/notification-example/tasks/:taskId'
            element={<TaskDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}

function requestFor(method: string): RequestOptions | undefined {
  const call = state.request.mock.calls.find(
    (candidate) =>
      (candidate[0] as RequestOptions | undefined)?.method === method,
  );
  return call?.[0] as RequestOptions | undefined;
}

function taskListRequests(): RequestOptions[] {
  return state.request.mock.calls
    .map((candidate) => candidate[0] as RequestOptions)
    .filter(
      (request) =>
        request.path === 'notificationExample/tasks' && !request.method,
    );
}

// Base UI's Select opens on the trigger and commits on the item, so the option needs the pointer sequence a browser
// would send rather than a bare click.
function chooseOption(trigger: HTMLElement, name: string): Promise<void> {
  fireEvent.click(trigger);
  return screen.findByRole('option', { name }).then((option) => {
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.mouseUp(option);
    fireEvent.click(option);
  });
}

it.each(['en-US', 'zh-CN'] as const)(
  'picks the assignee for a new task from a Select (%s)',
  async (locale) => {
    await show(locale, ['/notification-example']);
    const messages = copy[locale];

    fireEvent.click(
      await screen.findByRole('button', { name: messages.tasks.add }),
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: messages.fields.title }),
      { target: { value: 'Ship the example plugin' } },
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: messages.fields.description }),
      { target: { value: 'Walk through the task drawer on both languages.' } },
    );

    const assignee = screen.getByRole('combobox', {
      name: messages.fields.assignee,
    });
    expect(assignee).toHaveTextContent(users[0].name);

    await chooseOption(assignee, users[1].name);
    expect(
      screen.getByRole('combobox', { name: messages.fields.assignee }),
    ).toHaveTextContent(users[1].name);
    // The drawer picked a user through the plugin's Select; a raw <select> anywhere on the page would be the
    // primitive this component replaced.
    expect(document.querySelector('select')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: messages.tasks.create }),
    );
    await waitFor(() => expect(requestFor('POST')).toBeDefined());
    expect(requestFor('POST')?.path).toBe('notificationExample/tasks');
    expect(requestFor('POST')?.json).toMatchObject({
      assigneeId: users[1].id,
      title: 'Ship the example plugin',
    });
  },
);

it('paginates the task list', async () => {
  await show('en-US', ['/notification-example']);

  await screen.findByText('Review the release notes');
  expect(taskListRequests()[0]?.query).toMatchObject({ page: 1, pageSize: 10 });

  fireEvent.click(
    screen.getByRole('button', { name: copy['en-US'].tasks.next }),
  );
  await waitFor(() => expect(taskListRequests()).toHaveLength(2));

  expect(taskListRequests()[1]?.query).toMatchObject({ page: 2, pageSize: 10 });
  expect(screen.getByText('Page 2')).toBeVisible();
});

it('edits the status and the assignee through Selects on the task detail page', async () => {
  await show('en-US', ['/notification-example/tasks/task-1']);
  const messages = copy['en-US'];

  expect(await screen.findByText('Review the release notes')).toBeVisible();
  fireEvent.click(
    screen.getByRole('button', { name: messages.taskDetail.edit }),
  );

  // The trigger prints the label the Select was given, not the stored value: `items` is what makes "Open" appear
  // instead of "open".
  const status = await screen.findByRole('combobox', {
    name: messages.fields.status,
  });
  expect(status).toHaveTextContent(messages.status.open);
  await chooseOption(status, messages.status[TASK_STATUSES[1]]);
  expect(
    screen.getByRole('combobox', { name: messages.fields.status }),
  ).toHaveTextContent(messages.status[TASK_STATUSES[1]]);

  const assignee = screen.getByRole('combobox', {
    name: messages.fields.assignee,
  });
  expect(assignee).toHaveTextContent(users[0].name);
  await chooseOption(assignee, users[1].name);
  expect(document.querySelector('select')).toBeNull();

  fireEvent.click(
    screen.getByRole('button', { name: messages.taskDetail.save }),
  );
  await waitFor(() => expect(requestFor('PATCH')).toBeDefined());
  expect(requestFor('PATCH')?.path).toBe('notificationExample/tasks/task-1');
  expect(requestFor('PATCH')?.json).toMatchObject({
    assigneeId: users[1].id,
    status: TASK_STATUSES[1],
  });
});
