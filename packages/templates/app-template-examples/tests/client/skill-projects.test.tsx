import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { answerApi } from '@nocobase/app-testing/client';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { renderSettingsClient } from '../helpers/settings-client.js';
import SkillProjectsPage from '../../client/pages/skill-projects/index.js';
import SkillProjectDetailPage from '../../client/pages/skill-projects/detail.js';
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
/** The session's permission snapshot: the page grant the server requires, or nothing. */
const snapshot = (granted: boolean) => ({
  data: {
    unrestricted: false,
    permissions: granted
      ? [
          {
            resource: { type: 'page', id: 'skill-projects' },
            actions: ['access'],
          },
        ]
      : [],
  },
});
/** Answers the authorization snapshot `useCan` reads; every other request goes to the test's API double. */
const authorized =
  (fetch: typeof globalThis.fetch, granted = true): typeof globalThis.fetch =>
  (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    return new URL(request.url).pathname.endsWith('/authorization/permissions')
      ? Promise.resolve(Response.json(snapshot(granted)))
      : fetch(request);
  };
// The routes of the Examples `client/routes.ts` entry: create beside the drawer, edit stacked on it.
const projectRoutes = (
  <Route path='/skill-projects' element={<SkillProjectsPage />}>
    <Route path='new' element={<SkillProjectEditPage />} />
    <Route path=':projectId' element={<SkillProjectDetailPage />}>
      <Route path='edit' element={<SkillProjectEditPage />} />
    </Route>
  </Route>
);
const render = (
  ui: ReactElement,
  fetch: typeof globalThis.fetch,
  route = '/skill-projects',
  locale = 'en-US',
  granted = true,
) =>
  renderSettingsClient(ui, {
    route,
    namespace,
    namespaces,
    locale,
    fetch: authorized(fetch, granted),
    services: (app) =>
      app.container.instance(
        authorizationClientToken,
        new AuthorizationClient(app.container.resolve(apiClientToken)),
      ),
  });

const SkillProjectsPermissionProbe = () => {
  const { can, error, isPending } = useCan({
    resource: { type: 'page', id: 'skill-projects' },
    action: 'access',
  });
  const state = isPending
    ? 'pending'
    : error
      ? 'error'
      : can
        ? 'allowed'
        : 'denied';
  return <output data-testid='skill-projects-access-state'>{state}</output>;
};

const mount = (
  fetch: typeof globalThis.fetch,
  route = '/skill-projects',
  locale = 'en-US',
) => render(<Routes>{projectRoutes}</Routes>, fetch, route, locale);
// A row's Edit sits in its "⋮" actions menu (T1.5).
async function openRowEdit(
  user: Pick<typeof userEvent, 'click'>,
  index = 0,
): Promise<void> {
  // A trigger is ready once it reports its menu closed (.agents/rules/testing.md).
  const triggers = await screen.findAllByRole('button', {
    name: /^Actions for /,
    expanded: false,
  });
  await user.click(triggers[index]!);
  await user.click(await screen.findByRole('menuitem', { name: 'Edit' }));
}
/** The create or edit dialog; the detail drawer it stacks on is named after the project. */
const formDialog = (name = /^(Create|Edit) project$/) =>
  screen.queryByRole('dialog', { name });
/** Closes the detail drawer left open after its edit dialog closed, back to the list. */
async function closeDrawer(): Promise<void> {
  await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
}
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
        if (path === 'skillProjects/summary') return { data: { total: 1 } };
        if (path === 'skillProjects') return ++reads === 1 ? list() : refresh;
        throw new Error(`Unexpected request: ${path}`);
      }),
    );
    await screen.findByText('Alpha');
    const table = screen.getByRole('table');
    const refreshing = () =>
      screen.queryByRole('status', { name: enUS['status.refreshing'] });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Create project' }),
    );
    await screen.findByRole('textbox', { name: 'Name' });
    vi.useFakeTimers();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(reads).toBe(1);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(refreshing()).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(reads).toBe(2);
    expect(refreshing()).not.toBeInTheDocument();
    if (speed === 'slow') {
      await act(() => vi.advanceTimersByTimeAsync(299));
      expect(refreshing()).not.toBeInTheDocument();
      await act(() => vi.advanceTimersByTimeAsync(1));
      expect(refreshing()).toBeInTheDocument();
      // The rows stay while they refresh.
      expect(screen.getByText('Alpha')).toBeVisible();
    }
    await act(async () => {
      finish(list('Fresh Alpha'));
    });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('Fresh Alpha')).toBeVisible();
    expect(refreshing()).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBe(table);
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
  await openRowEdit(user);
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
  await waitFor(() => expect(formDialog()).not.toBeInTheDocument());
  // The edit returns to the drawer it opened from, which shows the saved name.
  expect(
    await screen.findByRole('dialog', { name: 'New Alpha' }),
  ).toBeVisible();
  await closeDrawer();
  expect(await screen.findByRole('link', { name: 'New Alpha' })).toBeVisible();
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

it('keeps the original payload/key after an unknown result, asks before closing and applies the saved row before revalidation', async () => {
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
  await openRowEdit(userEvent);
  const name = await screen.findByRole('textbox', { name: 'Name' });
  await userEvent.clear(name);
  await userEvent.type(name, 'Confirmed Alpha');
  await userEvent.click(
    screen.getByRole('button', { name: 'Save', exact: true }),
  );
  await screen.findByText(enUS.skillProjects.uncertain);
  expect(name).toBeDisabled();
  // An unknown outcome never locks the dialog: Cancel asks, and "Keep editing" keeps the input for the retry.
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await screen.findByRole('alertdialog', { name: 'Discard changes?' });
  await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  );
  expect(name).toHaveValue('Confirmed Alpha');
  const form = name.closest('form')!;
  await act(async () => {
    fireEvent.submit(form);
    fireEvent.submit(form);
  });
  await waitFor(() => expect(writes).toBe(2));
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await userEvent.keyboard('{Escape}');
  expect(formDialog()).toBeInTheDocument();
  expect(keys[0]).toBeTruthy();
  expect(keys[1]).toBe(keys[0]);
  await act(async () => {
    complete();
  });
  await waitFor(() => expect(formDialog()).not.toBeInTheDocument());
  // The drawer and the covered list both show the saved row before any verification read of the list.
  expect(
    await screen.findByRole('dialog', { name: 'Confirmed Alpha' }),
  ).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Confirmed Alpha', hidden: true }),
  ).toBeInTheDocument();
  expect(reads).toBe(1);
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
  // The list's built-in loading state names itself after the shared display delay.
  expect(
    await screen.findByRole('status', { name: enUS.listFeedback.loading }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Create project' }),
  ).not.toBeInTheDocument();
  await act(async () => {
    finish(list());
  });
  expect(screen.getByText('Alpha')).toBeVisible();
  // The page header holds the only New button.
  expect(
    await screen.findAllByRole('button', { name: 'Create project' }),
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
        if (path === 'skillProjects/summary')
          return { data: { total: rows.length } };
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
    const opener = (
      await screen.findAllByRole('button', {
        name: /^Actions for /,
        expanded: false,
      })
    )[0]!;
    await userEvent.click(opener);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Edit' }),
    );
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
    // The edit dialog returns to the record's drawer; the list stays covered and unread until the drawer closes.
    await waitFor(() => expect(formDialog()).not.toBeInTheDocument());
    expect(reads).toBe(1);
    await closeDrawer();
    await waitFor(() => expect(reads).toBe(2));
    await act(async () => {
      finish();
    });
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
  // Cancel returns to the drawer the edit stacks on; the covered list has not been read.
  expect(await screen.findByRole('dialog', { name: 'Alpha' })).toBeVisible();
  expect(reads).toBe(0);
  await closeDrawer();
  await screen.findByRole('link', { name: 'Alpha' });
  expect(reads).toBe(1);
  await waitFor(() =>
    expect(screen.getByRole('region', { name: 'Projects' })).toHaveFocus(),
  );
});

/** The route dialog's own "Discard changes?" copy, which the edit dialog asks through its `dirty`. */
function dirtyCopy(locale: typeof enUS) {
  return {
    discard: locale['routeOverlay.discardTitle'],
    keepEditing: locale['routeOverlay.keepEditing'],
    discardAction: locale['routeOverlay.discard'],
  };
}

it.each([
  ['en-US', { ...enUS.skillProjects, ...dirtyCopy(enUS) }],
  ['zh-CN', { ...zhCN.skillProjects, ...dirtyCopy(zhCN) }],
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
      expect(
        screen.queryByRole('dialog', { name: copy.edit }),
      ).not.toBeInTheDocument(),
    );
    // Discarding returns to the drawer the edit stacks on.
    expect(await screen.findByRole('dialog', { name: 'Alpha' })).toBeVisible();
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
      // The drawer and its stacked edit dialog each read the record once.
      if (++reads <= 2) {
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
  const dialog = () => screen.getByRole('dialog', { name: 'Edit project' });
  expect(dialog()).toHaveClass('sm:max-w-md');
  expect(
    within(dialog()).getByRole('status', { name: 'Loading projects…' }),
  ).toBeInTheDocument();
  await act(async () => {
    finish();
  });
  const alert = await within(dialog()).findByRole('alert');
  expect(alert).toHaveAttribute('data-slot', 'alert');
  expect(dialog()).toHaveClass('sm:max-w-md');
  await userEvent.click(
    within(dialog()).getByRole('button', { name: 'Retry' }),
  );
  await within(dialog()).findByRole('textbox', { name: 'Name' });
  expect(dialog()).toHaveClass('sm:max-w-md');
});

it.each([
  ['en-US', enUS],
  ['zh-CN', zhCN],
] as const)(
  'shows the built-in localized list states for 401/403/500 in %s',
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
      expect(alert).toHaveTextContent(
        status === 401
          ? copy.listFeedback.unauthenticated
          : status === 403
            ? copy.listFeedback.forbidden
            : copy.listFeedback.failed,
      );
      expect(
        screen.queryByRole('button', { name: copy.skillProjects.create }),
      ).not.toBeInTheDocument();
      if (status === 500) {
        failed = false;
        await userEvent.click(
          screen.getByRole('button', { name: copy.listFeedback.retry }),
        );
        expect(await screen.findByText('Alpha')).toBeVisible();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(
          await screen.findByRole('button', {
            name: copy.skillProjects.create,
          }),
        ).toBeVisible();
      } else {
        expect(
          screen.queryByRole('button', { name: copy.listFeedback.retry }),
        ).not.toBeInTheDocument();
        if (status === 401)
          expect(
            screen.getByText(copy.listFeedback.signIn).closest('a'),
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
    await waitFor(() => expect(formDialog()).not.toBeInTheDocument());
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
    // The typed input is still there to lose although it can no longer be saved, so leaving asks first.
    await userEvent.keyboard('{Escape}');
    const prompt = await screen.findByRole('alertdialog', {
      name: 'Discard changes?',
    });
    await userEvent.click(
      within(prompt).getByRole('button', { name: 'Discard' }),
    );
    await waitFor(() => expect(formDialog()).not.toBeInTheDocument());
    await closeDrawer();
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
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
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
  await waitFor(() => expect(formDialog()).not.toBeInTheDocument());
  expect(writes).toBe(3);
});

it.each(['Cancel', 'Close', 'Escape', 'backdrop', 'back'] as const)(
  'asks before leaving through %s after a failed save with an unknown outcome, and discarding leaves',
  async (way) => {
    let writes = 0;
    let back!: () => void;
    function HistoryBack() {
      const navigate = useNavigate();
      back = () => void navigate(-1);
      return null;
    }
    await render(
      <>
        <Routes>{projectRoutes}</Routes>
        <HistoryBack />
      </>,
      answerApi(({ path, method }) => {
        if (method === 'PATCH') {
          writes += 1;
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
        }
        return path === 'skillProjects' ? list() : { data: original };
      }),
    );
    await screen.findByText('Alpha');
    await openRowEdit(userEvent);
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Renamed Alpha');
    await userEvent.click(
      screen.getByRole('button', { name: 'Save', exact: true }),
    );
    await screen.findByText(enUS.skillProjects.uncertain);
    expect(writes).toBe(1);
    const leave = async () => {
      if (way === 'Escape') await userEvent.keyboard('{Escape}');
      else if (way === 'back') act(() => back());
      else if (way === 'backdrop')
        await userEvent.click(
          screen
            .getByRole('dialog', { name: 'Edit project' })
            .closest('[data-base-ui-portal]')!
            .querySelector(':scope > [data-slot="dialog-overlay"]')!,
        );
      else
        await userEvent.click(
          within(
            screen.getByRole('dialog', { name: 'Edit project' }),
          ).getByRole('button', { name: way }),
        );
    };
    await leave();
    await screen.findByRole('alertdialog', {
      name: enUS['routeOverlay.discardTitle'],
    });
    await userEvent.click(
      screen.getByRole('button', { name: enUS['routeOverlay.keepEditing'] }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog', { name: 'Edit project' })).toBeVisible();
    expect(name).toHaveValue('Renamed Alpha');
    await leave();
    await userEvent.click(
      await screen.findByRole('button', {
        name: enUS['routeOverlay.discard'],
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Edit project' }),
      ).not.toBeInTheDocument(),
    );
    expect(writes).toBe(1);
  },
);

it('opens a directly linked record in its drawer over the unread list, then names the record', async () => {
  let finish!: (value: { data: typeof original }) => void;
  const pending = new Promise<{ data: typeof original }>((resolve) => {
    finish = resolve;
  });
  let reads = 0;
  const view = await mount(
    answerApi(({ path }) => {
      if (path === 'skillProjects/abc') return pending;
      if (path === 'skillProjects') reads += 1;
      return list();
    }),
    '/skill-projects/abc',
  );
  const drawer = screen.getByRole('dialog', { name: 'Project details' });
  expect(
    within(drawer).getByRole('status', { name: 'Loading projects…' }),
  ).toBeInTheDocument();
  await act(async () => {
    finish({ data: original });
  });
  expect(await screen.findByRole('dialog', { name: 'Alpha' })).toBe(drawer);
  expect(within(drawer).getByRole('definition')).toHaveTextContent('Alpha');
  // Edit and Delete are the drawer's footer actions; the covered list was never read.
  expect(
    await within(drawer).findByRole('button', { name: 'Edit' }),
  ).toBeVisible();
  expect(within(drawer).getByRole('button', { name: 'Delete' })).toBeVisible();
  expect(reads).toBe(0);
  await closeDrawer();
  await screen.findByRole('link', { name: 'Alpha' });
  expect(reads).toBe(1);
  view.unmount();
});

it('returns a reloaded edit to its drawer, then the drawer to the same list page (mobile.md M2.3)', async () => {
  function LocationProbe() {
    const location = useLocation();
    return (
      <output data-testid='location'>
        {location.pathname + location.search}
      </output>
    );
  }
  const user = userEvent.setup();
  const writes: unknown[] = [];
  let current = original;
  // A fresh shell at the edit URL is what a reload leaves: no recorded visit to the list.
  await render(
    <>
      <LocationProbe />
      <Routes>{projectRoutes}</Routes>
    </>,
    answerApi(({ path, method, json }) => {
      if (path === 'skillProjects') return list(current.name);
      if (method === 'PATCH') {
        writes.push(json);
        current = { ...original, name: (json as { name: string }).name };
      }
      return { data: current };
    }),
    '/skill-projects/abc/edit?page=2&pageSize=20',
  );
  const name = await screen.findByRole('textbox', { name: 'Name' });
  await user.clear(name);
  await user.type(name, 'Saved Alpha');
  await user.click(screen.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/skill-projects\/abc\?page=2&pageSize=20$/u,
    ),
  );
  expect(writes).toEqual([{ name: 'Saved Alpha' }]);
  expect(
    await screen.findByRole('dialog', { name: 'Saved Alpha' }),
  ).toBeVisible();
  await closeDrawer();
  await waitFor(() =>
    expect(screen.getByTestId('location')).toHaveTextContent(
      /^\/skill-projects\?page=2&pageSize=20$/u,
    ),
  );
  expect(
    await screen.findByRole('link', { name: 'Saved Alpha' }),
  ).toBeVisible();
});

it.each([401, 403, 404, 500])(
  'keeps the fallback title and no record actions after record error %s',
  async (status) => {
    let failing = true;
    const view = await mount(
      answerApi(({ path }) =>
        path === 'skillProjects/abc' && failing
          ? Response.json(
              {
                error: {
                  status: 'NOT_FOUND',
                  reason: 'TEST_RECORD_ERROR',
                  message: 'Test record error',
                },
              },
              { status },
            )
          : path === 'skillProjects/abc'
            ? { data: original }
            : list(),
      ),
      '/skill-projects/abc',
    );
    const drawer = screen.getByRole('dialog', { name: 'Project details' });
    const alert = await within(drawer).findByRole('alert');
    expect(alert).toHaveTextContent(
      status === 404
        ? enUS.skillProjects.detailGone
        : status === 403
          ? enUS.skillProjects.denied
          : status === 401
            ? enUS.skillProjects.expired
            : enUS.skillProjects.failed,
    );
    expect(
      within(drawer).queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole('button', { name: 'Delete' }),
    ).not.toBeInTheDocument();
    if (status === 500) {
      failing = false;
      await userEvent.click(
        within(drawer).getByRole('button', { name: 'Retry' }),
      );
      expect(await screen.findByRole('dialog', { name: 'Alpha' })).toBe(drawer);
    } else
      expect(
        within(drawer).queryByRole('button', { name: 'Retry' }),
      ).not.toBeInTheDocument();
    view.unmount();
  },
);

it('shows Create, Edit and Delete only with the page grant the server checks', async () => {
  const view = await render(
    <>
      <Routes>{projectRoutes}</Routes>
      <SkillProjectsPermissionProbe />
    </>,
    answerApi(({ path }) =>
      path === 'skillProjects' ? list() : { data: original },
    ),
    '/skill-projects',
    'en-US',
    false,
  );
  await screen.findByRole('link', { name: 'Alpha' });
  await screen.findByText('denied', { exact: true });
  expect(
    screen.queryByRole('button', { name: 'Create project' }),
  ).not.toBeInTheDocument();
  // No permitted row action leaves no "⋮" menu.
  expect(
    screen.queryByRole('button', { name: /^Actions for / }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('link', { name: 'Alpha' }));
  const drawer = await screen.findByRole('dialog', { name: 'Alpha' });
  await screen.findByText('denied', { exact: true });
  expect(
    within(drawer).queryByRole('button', { name: 'Edit' }),
  ).not.toBeInTheDocument();
  expect(
    within(drawer).queryByRole('button', { name: 'Delete' }),
  ).not.toBeInTheDocument();
  view.unmount();
});

it('shows each project as a card with its detail link and edit action on a phone', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  try {
    await mount(
      answerApi(({ path }) => {
        if (path === 'skillProjects') return list();
        if (path === 'skillProjects/abc') return { data: original };
        throw new Error(`Unexpected request: ${path}`);
      }),
      '/skill-projects?page=1',
    );
    const card = (await screen.findAllByRole('listitem'))[0];
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(card).toHaveTextContent('Alpha');
    // The name opens the record's drawer and keeps the list's query.
    expect(screen.getByRole('link', { name: 'Alpha' })).toHaveAttribute(
      'href',
      '/skill-projects/abc?page=1',
    );
    await openRowEdit(userEvent);
    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue(
      'Alpha',
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

it('asks before browser back leaves a dirty edit dialog, as Cancel and Escape do', async () => {
  // Browser back (the phone's back gesture) never calls the dialog's beforeClose; the page's navigation guard asks.
  let back!: () => void;
  function HistoryBack() {
    const navigate = useNavigate();
    back = () => void navigate(-1);
    return null;
  }
  await render(
    <>
      <Routes>{projectRoutes}</Routes>
      <HistoryBack />
    </>,
    answerApi(({ path }) =>
      path === 'skillProjects' ? list() : { data: original },
    ),
    '/skill-projects?page=1',
  );
  await screen.findByText('Alpha');
  await openRowEdit(userEvent);
  const name = await screen.findByRole('textbox', { name: 'Name' });
  await userEvent.type(name, ' draft');
  act(() => back());
  expect(
    await screen.findByRole('alertdialog', {
      name: enUS['routeOverlay.discardTitle'],
    }),
  ).toBeVisible();
  await userEvent.click(
    screen.getByRole('button', { name: enUS['routeOverlay.keepEditing'] }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
    'Alpha draft',
  );
  act(() => back());
  await userEvent.click(
    await screen.findByRole('button', {
      name: enUS['routeOverlay.discard'],
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(screen.getByText('Alpha')).toBeVisible();
});
