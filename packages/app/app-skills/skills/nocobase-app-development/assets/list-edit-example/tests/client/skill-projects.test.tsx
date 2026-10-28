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
    await userEvent.click(screen.getByRole('button', { name: 'Edit project' }));
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
  await user.click(await screen.findByRole('button', { name: 'Edit project' }));
  const name = await screen.findByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(
    (await screen.findAllByText('Enter a project name.')).length,
  ).toBeGreaterThan(0);
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
    await mount(
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
    await userEvent.type(
      await screen.findByRole('textbox', { name: copy.name }),
      'Alpha{Enter}',
    );
    expect(await screen.findByText('Alpha')).toBeVisible();
    expect(created).toBe(true);
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
    await screen.findByRole('button', { name: 'Edit project' }),
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
        title: 'Saved Confirmed Alpha.',
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
