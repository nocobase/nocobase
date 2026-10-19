import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { Route, Routes, useLocation } from 'react-router';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import {
  realtimeClientToken,
  type RealtimeWatchOptions,
} from '@nocobase/app-client';
import {
  AuthenticationProvider,
  authenticationClientToken,
  type AuthClient,
} from '@nocobase/app-plugin-authentication/client';
import type { TaskBody } from '@nocobase/app-plugin-notification-example/realtime';
import plugin from '../../client/index.js';
import Business from '../../client/pages/business/index.js';
import Tasks from '../../client/pages/business/tasks.js';
import TaskCreate from '../../client/pages/business/task-create.js';
import TaskDetail from '../../client/pages/business/task-detail.js';
import Exports from '../../client/pages/business/exports.js';

function Location() {
  const location = useLocation();
  return (
    <output aria-label='location'>
      {location.pathname}
      {location.search}
    </output>
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
async function setup(
  route = '/realtime-example?example=1',
  initialTask?: TaskBody,
) {
  let task: TaskBody | undefined = initialTask;
  let rejectList = false;
  let rejectWrite = 0;
  let rejectCreate = false;
  let denyDetail = false;
  const writes: unknown[] = [];
  const watches = new Set<RealtimeWatchOptions<unknown>>();
  const view = await renderWithApp(
    <AuthenticationProvider>
      <Routes>
        <Route path='/realtime-example' element={<Business />}>
          <Route path='exports' element={<Exports />} />
          <Route path='tasks' element={<Tasks />}>
            <Route path='new' element={<TaskCreate />} />
            <Route path=':taskId' element={<TaskDetail />} />
          </Route>
        </Route>
      </Routes>
      <Location />
    </AuthenticationProvider>,
    {
      plugins: [plugin()],
      namespace: '@nocobase/app-plugin-realtime-example',
      route,
      services(app) {
        app.container.instance(authenticationClientToken, {
          getSession: async () => ({
            data: { user: { id: 'alice' }, session: { id: 'fixture' } },
          }),
        } as unknown as AuthClient);
        const realtime = app.container.resolve(realtimeClientToken);
        vi.spyOn(realtime, 'watch').mockImplementation(
          (_topic, options = {}) => {
            watches.add(options);
            return {
              state: 'ready',
              retry() {},
              close() {
                watches.delete(options);
              },
            };
          },
        );
      },
      fetch: answerApi(({ path, method, json }) => {
        if (path === 'realtimeExample/exports') {
          if (method === 'POST')
            return Response.json(
              {
                data: {
                  id: 'export-one',
                  status: 'queued',
                  processed: 0,
                  total: 0,
                  createdAt: '2026-10-18T12:00:00Z',
                  finishedAt: null,
                  reason: null,
                },
              },
              { status: 202 },
            );
          if (rejectList)
            return Response.json(
              { error: { reason: 'UNAVAILABLE' } },
              { status: 500 },
            );
          return { data: [] };
        }
        if (path === 'notificationExample/assignees')
          return { data: [{ id: 'alice', name: 'Alice' }] };
        if (path === 'notificationExample/tasks' && method === 'GET') {
          if (rejectList)
            return Response.json(
              { error: { reason: 'UNAVAILABLE' } },
              { status: 500 },
            );
          return {
            data: task ? [task] : [],
            meta: { page: 1, pageSize: 30, total: task ? 1 : 0 },
          };
        }
        if (path === 'notificationExample/tasks' && method === 'POST') {
          if (rejectCreate)
            return Response.json(
              { error: { reason: 'UNAVAILABLE' } },
              { status: 500 },
            );
          writes.push(json);
          const input = json as {
            title: string;
            description: string;
            assigneeId: string;
          };
          task = {
            id: 'task-one',
            ...input,
            status: 'open',
            creatorId: 'alice',
            creator: { id: 'alice', name: 'Alice' },
            assignee: { id: 'alice', name: 'Alice' },
            createdAt: '2026-10-18T12:00:00Z',
            updatedAt: '2026-10-18T12:00:00Z',
          };
          return Response.json({ data: task }, { status: 201 });
        }
        if (path === 'notificationExample/tasks/task-one') {
          if (denyDetail)
            return Response.json(
              { error: { reason: 'TASK_ACCESS_DENIED' } },
              { status: 403 },
            );
          if (method === 'PATCH') {
            if (rejectWrite)
              return Response.json(
                { error: { reason: 'DENIED' } },
                { status: rejectWrite },
              );
            writes.push(json);
            task = { ...task!, ...(json as object) };
          }
          return { data: task };
        }
        throw new Error(`Unexpected API request: ${method} ${path}`);
      }),
    },
  );
  return {
    view,
    writes,
    failList(value: boolean) {
      rejectList = value;
    },
    denyWrite(status: number) {
      rejectWrite = status;
    },
    failCreate(value: boolean) {
      rejectCreate = value;
    },
    revoke() {
      denyDetail = true;
      task = undefined;
      for (const watch of watches) watch.onReady?.();
    },
  };
}
it('validates the routed form, preserves failed input, then updates the board and submits only the status', async () => {
  const test = await setup();
  const user = userEvent.setup();
  await screen.findByText('No tasks yet');
  expect(screen.getByLabelText('location')).toHaveTextContent(
    '/realtime-example/tasks?example=1',
  );
  await user.click(screen.getByRole('link', { name: 'New task' }));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() =>
    expect(
      within(dialog).getByRole('button', { name: 'Create', exact: true }),
    ).toBeEnabled(),
  );
  await user.click(
    within(dialog).getByRole('button', { name: 'Create', exact: true }),
  );
  expect(within(dialog).getByLabelText('Title *')).toHaveFocus();
  await user.type(within(dialog).getByLabelText('Title *'), 'Review launch');
  await user.type(
    within(dialog).getByLabelText('Description *'),
    'Verify release notes',
  );
  test.failCreate(true);
  await user.click(
    within(dialog).getByRole('button', { name: 'Create', exact: true }),
  );
  await within(dialog).findByText('The request failed. Please try again.');
  expect(within(dialog).getByLabelText('Title *')).toHaveValue('Review launch');
  test.failCreate(false);
  test.failList(true);
  await user.click(
    within(dialog).getByRole('button', { name: 'Create', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await screen.findByRole('link', { name: 'Review launch' });
  expect(test.writes).toEqual([
    {
      title: 'Review launch',
      description: 'Verify release notes',
      assigneeId: 'alice',
    },
  ]);
  await user.click(screen.getByRole('button', { name: 'Start', exact: true }));
  await screen.findByRole('button', { name: 'Complete', exact: true });
  expect(
    within(screen.getByRole('region', { name: 'In progress' })).getByRole(
      'link',
      { name: 'Review launch' },
    ),
  ).toBeInTheDocument();
  test.failList(false);
  expect(test.writes[1]).toEqual({ status: 'in-progress' });
  await user.click(screen.getByRole('link', { name: 'Review launch' }));
  const detail = await screen.findByRole('dialog');
  await within(detail).findByText('Verify release notes');
  await act(async () => {
    test.revoke();
  });
  await within(detail).findByText(
    'You no longer have access to this task. Close it and check with its creator.',
  );
  expect(
    within(detail).queryByText('Verify release notes'),
  ).not.toBeInTheDocument();
  expect(
    within(detail).queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
  await screen.findByText('No tasks yet');
});

const initialTask: TaskBody = {
  id: 'task-one',
  title: 'Confidential renewal',
  description: 'Private customer terms',
  status: 'open',
  creatorId: 'alice',
  assigneeId: 'alice',
  creator: { id: 'alice', name: 'Alice' },
  assignee: { id: 'alice', name: 'Alice' },
  createdAt: '2026-10-18T12:00:00Z',
  updatedAt: '2026-10-18T12:00:00Z',
};
it.each([401, 403, 404])(
  'clears a task after authoritative write denial %s even when refresh fails',
  async (status) => {
    const test = await setup('/realtime-example/tasks/task-one', initialTask);
    await screen.findByText('Private customer terms');
    const dialog = screen.getByRole('dialog');
    test.denyWrite(status);
    test.failList(true);
    await userEvent
      .setup()
      .click(
        within(dialog).getByRole('button', { name: 'Start', exact: true }),
      );
    await waitFor(() =>
      expect(
        within(dialog).queryByText('Private customer terms'),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(dialog).queryByRole('button', { name: 'Start', exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Confidential renewal' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/demonstration has expired/i),
    ).not.toBeInTheDocument();
  },
);
it('keeps the accepted export visible when the following history refresh fails', async () => {
  const test = await setup('/realtime-example/exports');
  await screen.findByText('No exports yet');
  test.failList(true);
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Export tasks', exact: true }));
  await screen.findByText('Queued');
  await screen.findByText('The request failed. Please try again.');
  expect(screen.queryByText('No exports yet')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Export tasks', exact: true }),
  ).toBeDisabled();
});
