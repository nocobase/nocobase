import { answerApi } from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { renderSettingsClient } from '../helpers/settings-client.js';
import SkillProjectsPage from '../../client/pages/skill-projects/index.js';
import SkillProjectEditPage from '../../client/pages/skill-projects/edit.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = 'skill-projects-test';
const original = { id: 'abc', name: 'Alpha' };
const list = (name = 'Alpha') => ({
  data: [{ ...original, name }],
  meta: { total: 1 },
});
const namespaces = {
  [namespace]: {
    'en-US': async () => ({ default: enUS }),
    'zh-CN': async () => ({ default: zhCN }),
  },
};
const mount = (
  fetch: typeof globalThis.fetch,
  route = '/skill-projects',
  locale = 'en-US',
) =>
  renderSettingsClient(
    <Routes>
      <Route path='/skill-projects' element={<SkillProjectsPage />}>
        <Route path='new' element={<SkillProjectEditPage />} />
        <Route path=':projectId/edit' element={<SkillProjectEditPage />} />
      </Route>
    </Routes>,
    { route, namespace, namespaces, locale, fetch },
  );
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it.each(['fast', 'slow'])(
  'retains rows while covered and on %s cancel refresh, cancelling delayed feedback',
  async (speed) => {
    let reads = 0;
    let finish!: (response: ReturnType<typeof list>) => void;
    const refresh = new Promise<ReturnType<typeof list>>((resolve) => {
      finish = resolve;
    });
    const view = await mount(
      answerApi(({ path }) => {
        if (path === 'skillProjects/abc') return { data: original };
        if (path === 'skillProjects') return ++reads === 1 ? list() : refresh;
        throw new Error(`Unexpected request: ${path}`);
      }),
    );
    await screen.findByText('Alpha');
    const slot = screen.getByTestId('refresh-slot');
    await userEvent.click(
      screen.getByRole('button', { name: 'Edit', exact: true }),
    );
    await screen.findByRole('textbox', { name: 'Name' });
    vi.useFakeTimers();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(reads).toBe(1);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Refreshing…')).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(reads).toBe(2);
    expect(screen.queryByText('Refreshing…')).not.toBeInTheDocument();
    if (speed === 'slow') {
      await act(() => vi.advanceTimersByTimeAsync(299));
      expect(screen.queryByText('Refreshing…')).not.toBeInTheDocument();
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(screen.getByText('Refreshing…')).toBeVisible();
    }
    await act(async () => {
      finish(list('Fresh Alpha'));
    });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('Fresh Alpha')).toBeVisible();
    expect(screen.queryByText('Refreshing…')).not.toBeInTheDocument();
    expect(screen.getByTestId('refresh-slot')).toBe(slot);
    view.unmount();
  },
);

it('revalidates a corrected name, keeps a rejected draft, and refreshes the list after saving', async () => {
  const user = userEvent.setup();
  let current = original;
  let attempts = 0;
  const writes: unknown[] = [];
  await mount(
    answerApi(({ path, method, json }) => {
      if (path === 'skillProjects') return list(current.name);
      if (path === 'skillProjects/abc' && method === 'PATCH') {
        writes.push(json);
        if (++attempts === 1)
          return Response.json(
            {
              error: {
                status: 'INVALID_ARGUMENT',
                reason: 'REJECTED',
                message: 'Rejected',
              },
            },
            { status: 400 },
          );
        current = { ...original, name: (json as { name: string }).name };
        return { data: current };
      }
      return { data: current };
    }),
  );
  await user.click(
    await screen.findByRole('button', { name: 'Edit', exact: true }),
  );
  const name = await screen.findByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(await screen.findAllByText('Enter a project name.')).toHaveLength(1);
  expect(writes).toHaveLength(0);
  await user.type(name, 'New Alpha');
  await waitFor(() =>
    expect(screen.queryAllByText('Enter a project name.')).toHaveLength(0),
  );
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(name).toHaveValue('New Alpha');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save', exact: true }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(await screen.findByText('New Alpha')).toBeVisible();
  expect(writes).toEqual([{ name: 'New Alpha' }, { name: 'New Alpha' }]);
});

it.each([
  ['en-US', enUS.skillProjects],
  ['zh-CN', zhCN.skillProjects],
] as const)(
  'renders an empty list and creates a project in %s',
  async (locale, copy) => {
    let created = false;
    const view = await mount(
      answerApi(({ method, json }) => {
        if (method === 'POST') {
          created = true;
          return { data: { id: 'abc', ...(json as { name: string }) } };
        }
        return {
          data: created ? [original] : [],
          meta: { total: created ? 1 : 0 },
        };
      }),
      '/skill-projects',
      locale,
    );
    expect(await screen.findByText(copy.empty)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: copy.create }));
    await screen.findByRole('textbox', { name: copy.name });
    expect(
      screen.getByRole('button', { name: copy.createAction, exact: true }),
    ).toBeEnabled();
    await userEvent.type(
      screen.getByRole('textbox', { name: copy.name }),
      'Alpha{Enter}',
    );
    expect(await screen.findByText('Alpha')).toBeVisible();
    expect(created).toBe(true);
    expect(view.toasts()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: copy.created.replace('{{name}}', 'Alpha'),
        }),
      ]),
    );
  },
);

it.each([401, 403, 404])(
  'handles an unavailable edit record (%i) without an editable form',
  async (status) => {
    await mount(
      answerApi(() =>
        Response.json(
          {
            error: {
              status: 'NOT_FOUND',
              reason: 'UNAVAILABLE',
              message: 'Unavailable',
            },
          },
          { status },
        ),
      ),
      '/skill-projects/abc/edit',
    );
    await screen.findAllByRole('alert');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Save', exact: true }),
    ).not.toBeInTheDocument();
  },
);

it('keeps the original payload/key after an unknown result, blocks close and applies the saved row before revalidation', async () => {
  const keys: (string | null)[] = [];
  let reads = 0;
  let writes = 0;
  let complete!: () => void;
  let finishRead!: (response: ReturnType<typeof list>) => void;
  const saving = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const refreshed = new Promise<ReturnType<typeof list>>((resolve) => {
    finishRead = resolve;
  });
  const transport = answerApi(async ({ path, method, json }) => {
    if (path === 'skillProjects') return ++reads === 1 ? list() : refreshed;
    if (method !== 'PATCH') return { data: original };
    expect(json).toEqual({ name: 'Confirmed Alpha' });
    if (++writes === 1)
      return Response.json(
        {
          error: {
            status: 'INTERNAL',
            reason: 'LOST_RESPONSE',
            message: 'Unavailable',
          },
        },
        { status: 500 },
      );
    await saving;
    return { data: { ...original, name: 'Confirmed Alpha' } };
  });
  const view = await mount(((request: Request) => {
    if (request.method === 'PATCH')
      keys.push(request.headers.get('Idempotency-Key'));
    return transport(request);
  }) as typeof fetch);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Edit', exact: true }),
  );
  const name = await screen.findByRole('textbox', { name: 'Name' });
  await userEvent.clear(name);
  await userEvent.type(name, 'Confirmed Alpha');
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await screen.findByText(enUS.skillProjects.uncertain);
  expect(name).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  const form = name.closest('form')!;
  await act(async () => {
    fireEvent.submit(form);
    fireEvent.submit(form);
  });
  await waitFor(() => expect(writes).toBe(2));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  await act(async () => {
    complete();
  });
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(screen.getByText('Confirmed Alpha')).toBeVisible();
  expect(view.toasts()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'success',
        title: 'Saved “Confirmed Alpha”.',
      }),
    ]),
  );
  await act(async () => {
    finishRead(list('Confirmed Alpha'));
  });
});

it('shows a named skeleton without a create action until the initial read finishes', async () => {
  let finish!: (response: ReturnType<typeof list>) => void;
  const response = new Promise<ReturnType<typeof list>>((resolve) => {
    finish = resolve;
  });
  await mount(answerApi(() => response));
  expect(
    screen.getByRole('status', { name: 'Loading projects…' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Create project' }),
  ).not.toBeInTheDocument();
  await act(async () => {
    finish(list());
  });
  expect(screen.getByText('Alpha')).toBeVisible();
  expect(
    screen.getAllByRole('button', { name: 'Create project' }),
  ).toHaveLength(1);
});

it.each(['cancel', 'save', 'removed', 'lastPageRemoved'])(
  'preserves page 2 and restores focus after %s and the completed return read',
  async (action) => {
    let rows = Array.from({ length: 12 }, (_, index) => ({
      id: `project-${String(index).padStart(2, '0')}`,
      name: `Project ${index + 1}`,
    }));
    let reads = 0;
    let finish!: () => void;
    const refreshed = new Promise<void>((resolve) => {
      finish = resolve;
    });
    await mount(
      answerApi(async ({ path, method, json }) => {
        if (path === 'skillProjects') {
          if (++reads > 1) await refreshed;
          return { data: [...rows], meta: { total: rows.length } };
        }
        const id = path.split('/')[1];
        if (method === 'PATCH') {
          rows = rows.map((row) =>
            row.id === id
              ? { ...row, name: (json as { name: string }).name }
              : row,
          );
        }
        return { data: rows.find((row) => row.id === id) };
      }),
    );
    await screen.findByText('Project 1');
    await userEvent.click(
      screen.getByRole('button', { name: 'Go to next page' }),
    );
    expect(screen.getByText('Page 2 of 2')).toBeVisible();
    const opener = screen.getAllByRole('button', {
      name: 'Edit',
      exact: true,
    })[0];
    await userEvent.click(opener);
    const name = await screen.findByRole('textbox', { name: 'Name' });
    if (action === 'save') {
      await userEvent.clear(name);
      await userEvent.type(name, 'Renamed project');
      await userEvent.click(
        screen.getByRole('button', { name: 'Save', exact: true }),
      );
    } else {
      if (action === 'lastPageRemoved') rows = rows.slice(0, 10);
      if (action === 'removed')
        rows = rows.filter((row) => row.id !== 'project-10');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    }
    await waitFor(() => expect(reads).toBe(2));
    await act(async () => {
      finish();
    });
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText(
        action === 'lastPageRemoved' ? 'Page 1 of 1' : 'Page 2 of 2',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        action === 'lastPageRemoved' ? 'Project 1' : 'Project 12',
      ),
    ).toBeVisible();
    if (action === 'save')
      expect(screen.getByText('Renamed project')).toBeVisible();
    await waitFor(() =>
      expect(
        action === 'removed' || action === 'lastPageRemoved'
          ? screen.getByRole('region', { name: 'Projects' })
          : opener,
      ).toHaveFocus(),
    );
  },
);

it('returns a direct edit link to a stable page focus target', async () => {
  let reads = 0;
  await mount(
    answerApi(({ path }) => {
      if (path === 'skillProjects') {
        reads += 1;
        return list();
      }
      return { data: original };
    }),
    '/skill-projects/abc/edit',
  );
  await screen.findByRole('textbox', { name: 'Name' });
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await screen.findByText('Alpha');
  expect(reads).toBe(1);
  await waitFor(() =>
    expect(screen.getByRole('region', { name: 'Projects' })).toHaveFocus(),
  );
});

it.each([
  ['en-US', enUS.skillProjects],
  ['zh-CN', zhCN.skillProjects],
] as const)(
  'confirms dirty cancellation and Escape in %s without losing the draft on rejection',
  async (locale, copy) => {
    const nativeConfirm = vi.spyOn(window, 'confirm');
    await mount(
      answerApi(({ path }) =>
        path === 'skillProjects' ? list() : { data: original },
      ),
      '/skill-projects/abc/edit',
      locale,
    );
    const name = await screen.findByRole('textbox', { name: copy.name });
    await userEvent.type(name, ' draft');
    await userEvent.click(screen.getByRole('button', { name: copy.cancel }));
    expect(
      await screen.findByRole('alertdialog', { name: copy.discard }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: copy.keepEditing }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(name).toHaveValue('Alpha draft');
    await userEvent.keyboard('{Escape}');
    await screen.findByRole('alertdialog', { name: copy.discard });
    await userEvent.click(
      screen.getByRole('button', { name: copy.discardAction }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('Alpha')).toBeVisible();
    expect(nativeConfirm).not.toHaveBeenCalled();
  },
);

it('keeps a consistent frame across held loading, retryable error and recovery', async () => {
  let finish!: () => void;
  let reads = 0;
  const held = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await mount(
    answerApi(async ({ path }) => {
      if (path === 'skillProjects') return list();
      if (++reads === 1) {
        await held;
        return Response.json(
          {
            error: {
              status: 'INTERNAL',
              reason: 'UNAVAILABLE',
              message: 'Unavailable',
            },
          },
          { status: 500 },
        );
      }
      return { data: original };
    }),
    '/skill-projects/abc/edit',
  );
  expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-md');
  expect(
    screen.getByRole('status', { name: 'Loading projects…' }),
  ).toBeInTheDocument();
  await act(async () => {
    finish();
  });
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveAttribute('data-slot', 'alert');
  expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-md');
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByRole('textbox', { name: 'Name' });
  expect(screen.getByRole('dialog')).toHaveClass('sm:max-w-md');
});

it.each([
  ['en-US', enUS.skillProjects],
  ['zh-CN', zhCN.skillProjects],
] as const)(
  'shows localized list error recovery for 401/403/500 in %s',
  async (locale, copy) => {
    for (const status of [401, 403, 500]) {
      let failed = true;
      const view = await mount(
        answerApi(() =>
          failed
            ? Response.json(
                {
                  error: {
                    status: 'INTERNAL',
                    reason: 'UNAVAILABLE',
                    message: 'Unavailable',
                  },
                },
                { status },
              )
            : list(),
        ),
        '/skill-projects',
        locale,
      );
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveAttribute('data-slot', 'alert');
      expect(alert).toHaveTextContent(
        status === 401
          ? copy.expired
          : status === 403
            ? copy.denied
            : copy.failed,
      );
      expect(
        screen.queryByRole('button', { name: copy.create }),
      ).not.toBeInTheDocument();
      if (status === 500) {
        failed = false;
        await userEvent.click(screen.getByRole('button', { name: copy.retry }));
        expect(await screen.findByText('Alpha')).toBeVisible();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      } else {
        expect(
          screen.queryByRole('button', { name: copy.retry }),
        ).not.toBeInTheDocument();
        if (status === 401)
          expect(
            screen.getByRole('link', { name: copy.signIn }),
          ).toHaveAttribute('href', '/login');
      }
      view.unmount();
    }
  },
);

it.each(['create', 'edit'])(
  'restores an uncertain %s after remount by matching the original input and key',
  async (operation) => {
    const create = operation === 'create';
    const route = create ? '/skill-projects/new' : '/skill-projects/abc/edit';
    const method = create ? 'POST' : 'PATCH';
    const action = create ? 'Create' : 'Save';
    const keys: (string | null)[] = [];
    let writes = 0;
    const transport = answerApi(({ path, method: verb, json }) => {
      if (verb === method) {
        expect(json).toEqual({ name: 'Pending project' });
        if (++writes === 1)
          return Response.json(
            {
              error: {
                status: 'INTERNAL',
                reason: 'LOST_RESPONSE',
                message: 'Unavailable',
              },
            },
            { status: 500 },
          );
        return { data: { ...original, name: 'Pending project' } };
      }
      return path === 'skillProjects' ? list() : { data: original };
    });
    const fetch = ((request: Request) => {
      if (request.method === method)
        keys.push(request.headers.get('Idempotency-Key'));
      return transport(request);
    }) as typeof globalThis.fetch;
    const first = await mount(fetch, route);
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await userEvent.clear(name);
    await userEvent.type(name, ' Pending project ');
    await userEvent.click(
      screen.getByRole('button', { name: action, exact: true }),
    );
    await screen.findByText(enUS.skillProjects.uncertain);
    expect(name).toBeDisabled();
    first.unmount();
    await mount(fetch, route);
    const restored = await screen.findByRole('textbox', { name: 'Name' });
    await screen.findByText(enUS.skillProjects.restoreInput);
    expect(restored).toBeEnabled();
    // Neither the controller nor this feature stores form values in the session.
    expect(JSON.stringify(window.sessionStorage)).not.toContain(
      'Pending project',
    );
    await userEvent.clear(restored);
    await userEvent.type(restored, 'Different project');
    await userEvent.click(
      screen.getByRole('button', { name: action, exact: true }),
    );
    await screen.findByText(enUS.skillProjects.restoreInput);
    expect(writes).toBe(1);
    expect(restored).toBeEnabled();
    await userEvent.clear(restored);
    await userEvent.type(restored, ' Pending project ');
    await userEvent.click(
      screen.getByRole('button', { name: action, exact: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(writes).toBe(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
  },
);

it.each([
  ['PROJECT_UPDATE_NOT_APPLIED', enUS.skillProjects.notAppliedGone],
  ['PROJECT_UPDATE_COMMITTED_RECORD_MISSING', enUS.skillProjects.committedGone],
])(
  'releases a pending edit only after the server confirms %s',
  async (reason, message) => {
    let writes = 0;
    await mount(
      answerApi(({ path, method }) => {
        if (method === 'PATCH') {
          const status = ++writes === 1 ? 500 : 404;
          return Response.json(
            {
              error: {
                status: status === 500 ? 'INTERNAL' : 'NOT_FOUND',
                reason: status === 500 ? 'LOST_RESPONSE' : reason,
                message: 'Unavailable',
              },
            },
            { status },
          );
        }
        return path === 'skillProjects'
          ? { data: [], meta: { total: 0 } }
          : { data: original };
      }),
      '/skill-projects/abc/edit',
    );
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await userEvent.type(name, ' changed');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save', exact: true }),
    );
    await screen.findByText(enUS.skillProjects.uncertain);
    await userEvent.click(
      screen.getByRole('button', { name: 'Save', exact: true }),
    );
    await screen.findByText(message);
    expect(
      screen.getByRole('button', { name: 'Save', exact: true }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(
      Object.keys(window.sessionStorage).filter((key) =>
        key.startsWith('nocobase:submission:'),
      ),
    ).toEqual([]);
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(await screen.findByText(enUS.skillProjects.empty)).toBeVisible();
    expect(writes).toBe(2);
  },
);

it('keeps a retryable pending operation after an ordinary recovery 404 without claiming an outcome', async () => {
  let writes = 0;
  await mount(
    answerApi(({ path, method }) => {
      if (method === 'PATCH') {
        if (++writes === 3) return { data: original };
        const status = writes === 1 ? 500 : 404;
        return Response.json(
          {
            error: {
              status: status === 500 ? 'INTERNAL' : 'NOT_FOUND',
              reason: status === 500 ? 'LOST_RESPONSE' : 'PROJECT_NOT_FOUND',
              message: 'Unavailable',
            },
          },
          { status },
        );
      }
      return path === 'skillProjects' ? list() : { data: original };
    }),
    '/skill-projects/abc/edit',
  );
  await screen.findByRole('textbox', { name: 'Name' });
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await screen.findByText(enUS.skillProjects.uncertain);
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await waitFor(() => expect(writes).toBe(2));
  expect(screen.queryByText(enUS.skillProjects.gone)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save', exact: true }),
    ).toBeEnabled(),
  );
  expect(
    Object.keys(window.sessionStorage).some((key) =>
      key.startsWith('nocobase:submission:'),
    ),
  ).toBe(true);
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(writes).toBe(3);
});
