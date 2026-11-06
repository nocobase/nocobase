import { apiClientToken } from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import projects from '../../client/plugin.js';
import {
  newIssueRoute,
  projectsRoute,
  issueDetailChildRoutes,
} from '../../client/pages.js';
import { BUSINESS_KEYS, SETTINGS_KEYS } from '../../shared/access.js';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { beforeAll, describe, expect, it } from 'vitest';

import { RouteLeaveBoundary } from '../../../../templates/app-template-examples/client/routing/route-leave-boundary.js';
import { useRouteOverlay } from '../../../../templates/app-template-examples/client/components/use-route-overlay.js';
import { memo, useLayoutEffect, type ReactNode } from 'react';

import { renderRouteTree } from '../../../../templates/app-template-examples/client/routing/route-tree.js';
import enUS from '../../../../templates/app-template-examples/client/locales/en-US.js';
import packageMetadata from '../../../../templates/app-template-examples/package.json' with { type: 'json' };

const LOAD = { timeout: 10_000 };

beforeAll(async () => {
  // Prepare the real lazy modules before timing interactions. Each route still
  // calls its public namespace-wrapping loader, retaining its identity regression.
  await Promise.all([
    newIssueRoute.componentLoader!(),
    projectsRoute.children![0]!.componentLoader!(),
    issueDetailChildRoutes[0]!.componentLoader!(),
  ]);
});

function Parent() {
  return (
    <main>
      <Link to='new?tab=manual'>Open editor</Link>
      <Outlet />
    </main>
  );
}
function Location() {
  const location = useLocation();
  return (
    <output data-testid='location'>
      {location.pathname}
      {location.search}
    </output>
  );
}

async function renderEditor(
  definition: typeof newIssueRoute,
  locale = 'en-US',
  protectedRoute = false,
  protectedParent = false,
) {
  const created: unknown[] = [];
  const response = Promise.withResolvers<unknown>();
  let permissions = Promise.resolve<unknown>({
    data: { unrestricted: true, permissions: [] },
  });
  let close: () => Promise<void> = async () => {};
  let navigate: ReturnType<typeof useNavigate>;
  const permission = { resource: { type: 'user', id: '*' }, action: 'create' };
  let loads = 0;
  function Shell({ children }: { readonly children: ReactNode }) {
    const { isPending } = useCan(
      protectedRoute || protectedParent ? permission : undefined,
    );
    const currentNavigate = useNavigate();
    useLayoutEffect(() => {
      navigate = currentNavigate;
    }, [currentNavigate]);
    return (
      <RouteLeaveBoundary
        hidden={(protectedRoute || protectedParent) && isPending}
      >
        {children}
      </RouteLeaveBoundary>
    );
  }
  const route: AppClientRegisteredRoute = {
    ...definition,
    id: 'application:editor',
    name: 'editor',
    path: '/items/new',
    auth: 'required',
    authz: protectedRoute ? permission : 'skip',
    componentLoader: async () => {
      loads += 1;
      // Use the public loader as shipped: its namespace wrapper has a new component identity on every call.
      const module = await definition.componentLoader!();
      const Component = memo(module.default);
      function Editor() {
        const overlay = useRouteOverlay();
        useLayoutEffect(() => {
          close = overlay.close;
        }, [overlay.close]);
        return <Component />;
      }
      return { default: Editor };
    },
    packageName: packageMetadata.name,
    source: 'application',
  };
  const user = userEvent.setup();
  const { app } = await renderWithApp(
    <Shell>
      <Routes>
        {renderRouteTree([
          {
            id: 'application:parent',
            name: 'parent',
            path: '/items',
            auth: 'required',
            authz: protectedParent ? permission : 'skip',
            packageName: packageMetadata.name,
            source: 'application',
            componentLoader: async () => ({ default: Parent }),
            children: [route],
          },
        ])}
        <Route path='/issues/created' element={<p>Created issue</p>} />
      </Routes>
      <Location />
    </Shell>,
    {
      route: '/items?filter=mine',
      namespace: packageMetadata.name,
      locale,
      namespaces: { [packageMetadata.name]: enUS },
      plugins: [projects({ routes: false, realtime: false })],
      services(app) {
        app.container.singleton(
          authorizationClientToken,
          (resolver) =>
            new AuthorizationClient(resolver.resolve(apiClientToken)),
        );
      },
      fetch: answerApi(async ({ method, path, json }) => {
        if (path === 'authorization/permissions') return permissions;
        if (method === 'GET' && path === 'projects/me')
          return {
            data: {
              userId: 'host-user',
              name: 'Host user',
              kinds: [
                { key: 'user', title: null, executor: true, mentionable: true },
              ],
              permissions: {
                scopes: Object.fromEntries(
                  BUSINESS_KEYS.map(({ key }) => [key, 'all']),
                ),
                settings: Object.fromEntries(
                  SETTINGS_KEYS.map(({ key }) => [key, true]),
                ),
              },
            },
          };
        if (
          method === 'GET' &&
          ['projects', 'projects/members', 'projects/labels'].includes(path)
        )
          return { data: [] };
        if (method === 'GET' && path === 'projects/issues/')
          return {
            data: { id: 'parent', title: 'Parent issue', projectId: null },
          };
        if (method === 'POST' && path === 'projects/issues') {
          created.push(json);
          return response.promise;
        }
        return new Response(null, { status: 404 });
      }),
    },
  );
  await user.click(
    await screen.findByRole('link', { name: 'Open editor' }, LOAD),
  );
  return {
    user,
    created,
    response,
    loads: () => loads,
    close: () => close(),
    navigate: (to: string | number) =>
      typeof to === 'number' ? navigate(to) : navigate(to),
    async recheck() {
      const pending = Promise.withResolvers<unknown>();
      permissions = pending.promise;
      await act(async () =>
        app.container.resolve(authorizationClientToken).invalidate(),
      );
      await waitFor(() =>
        expect(
          screen.getByLabelText('Title', { exact: true }),
        ).not.toBeVisible(),
      );
      return async (allowed = true) => {
        await act(async () =>
          pending.resolve({ data: { unrestricted: allowed, permissions: [] } }),
        );
      };
    },
  };
}

describe('Projects pages in the application route host', () => {
  it.each([
    ['issue', newIssueRoute, 'Create and start'],
    ['project', projectsRoute.children![0] as typeof newIssueRoute, 'Create'],
    ['sub-issue', issueDetailChildRoutes[0] as typeof newIssueRoute, 'Create'],
  ])(
    'translates the %s footer outside its page namespace and closes the shared panel',
    async (_, definition, label) => {
      const { user } = await renderEditor(definition);
      const submit = await screen.findByRole(
        'button',
        { name: label, exact: true },
        LOAD,
      );
      const dialog = screen.getByRole('dialog');
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(
        within(dialog).getByRole('button', { name: 'Cancel', exact: true }),
      ).toBeVisible();
      expect(submit).toHaveAttribute('form');
      await user.click(
        within(dialog).getByRole('button', { name: 'Cancel', exact: true }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(screen.getByTestId('location')).toHaveTextContent('/items');
    },
  );

  it.each([
    [
      'en-US',
      'Create and start',
      'Creating…',
      'Title',
      'Cancel',
      'Discard unsaved changes?',
      'Keep editing',
    ],
    [
      'zh-CN',
      '创建并开始',
      '正在创建…',
      '标题',
      '取消',
      '放弃未提交的内容？',
      '继续编辑',
    ],
  ])(
    'keeps translated actions, the draft guard and form submission connected in %s',
    async (locale, create, busy, title, cancel, discard, keep) => {
      const { user, created, response } = await renderEditor(
        newIssueRoute,
        locale,
      );
      try {
        await screen.findByRole('button', { name: create, exact: true }, LOAD);
        await user.type(
          screen.getByLabelText(title, { exact: true }),
          'Hosted issue',
        );
        await user.click(
          screen.getByRole('button', { name: cancel, exact: true }),
        );
        const confirmation = await screen.findByRole('alertdialog', {
          name: discard,
        });
        await user.click(
          within(confirmation).getByRole('button', { name: keep }),
        );
        expect(screen.getByLabelText(title, { exact: true })).toHaveValue(
          'Hosted issue',
        );
        await user.click(
          screen.getByRole('button', { name: create, exact: true }),
        );
        await waitFor(() => expect(created).toHaveLength(1));
        expect(created[0]).toMatchObject({
          title: 'Hosted issue',
          statusKey: 'in_progress',
        });
        expect(
          await screen.findByRole('button', { name: new RegExp(busy, 'u') }),
        ).toBeDisabled();
        expect(
          screen.getByRole('button', { name: cancel, exact: true }),
        ).toBeDisabled();
        await act(async () =>
          response.resolve({ data: { id: 'created', identifier: 'HOST-1' } }),
        );
        await waitFor(() =>
          expect(screen.getByTestId('location')).toHaveTextContent(
            '/issues/created',
          ),
        );
        expect(screen.queryByRole('dialog')).toBeNull();
      } finally {
        await act(async () =>
          response.resolve({ data: { id: 'created', identifier: 'HOST-1' } }),
        );
      }
    },
  );
});

describe('Projects draft protection during real permission rechecks', () => {
  it('retains the public wrapped module through repeated shared parent and child permission rechecks', async () => {
    const fixture = await renderEditor(newIssueRoute, 'en-US', true, true);
    const title = await screen.findByLabelText('Title', { exact: true }, LOAD);
    await fixture.user.type(title, 'Shared permission draft');
    for (let recheck = 0; recheck < 2; recheck += 1) {
      const restore = await fixture.recheck();
      await restore();
      expect(
        await screen.findByLabelText('Title', { exact: true }, LOAD),
      ).toHaveValue('Shared permission draft');
      expect(screen.getByLabelText('Title', { exact: true })).toBe(title);
      expect(fixture.loads()).toBe(1);
    }
    await fixture.user.type(title, ' after rechecks');
    await fixture.user.keyboard('{Escape}');
    await fixture.user.click(
      await screen.findByRole('button', { name: 'Keep editing' }),
    );
    await fixture.user.click(
      screen.getByRole('button', { name: 'Create and start', exact: true }),
    );
    await waitFor(() => expect(fixture.created).toHaveLength(1));
    expect(fixture.created[0]).toMatchObject({
      title: 'Shared permission draft after rechecks',
    });
    await act(async () =>
      fixture.response.resolve({
        data: { id: 'created', identifier: 'HOST-1' },
      }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/issues/created',
      ),
    );
  });

  it('blocks every close path and navigation, then restores the child form registration', async () => {
    const fixture = await renderEditor(newIssueRoute, 'en-US', true);
    const { user } = fixture;
    await user.type(
      await screen.findByLabelText('Title', { exact: true }, LOAD),
      'Protected draft',
    );
    const restore = await fixture.recheck();
    try {
      expect(
        document.querySelector('[data-slot="route-overlay-footer"]'),
      ).toBeNull();
      const unload = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(unload);
      expect(unload.defaultPrevented).toBe(true);
      await user.keyboard('{Escape}');
      await user.click(
        screen.getByRole('button', { name: 'Close', exact: true }),
      );
      await act(async () => fixture.close());
      await act(async () => fixture.navigate('/elsewhere'));
      await act(async () => fixture.navigate(-1));
      await waitFor(() =>
        expect(screen.getByTestId('location')).toHaveTextContent('/items/new'),
      );
      expect(screen.queryByRole('alertdialog')).toBeNull();
    } finally {
      await restore();
    }
    expect(
      await screen.findByLabelText('Title', { exact: true }, LOAD),
    ).toHaveValue('Protected draft');
    await user.keyboard('{Escape}');
    const question = await screen.findByRole('alertdialog', {
      name: 'Discard unsaved changes?',
    });
    await user.click(
      within(question).getByRole('button', { name: 'Keep editing' }),
    );
    expect(screen.getByLabelText('Title', { exact: true })).toHaveValue(
      'Protected draft',
    );
    await user.keyboard('{Escape}');
    await user.click(
      await screen.findByRole('button', { name: 'Discard', exact: true }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('invalidates a close already asking when Activity disconnects the dirty child form', async () => {
    const fixture = await renderEditor(newIssueRoute, 'en-US', true);
    await fixture.user.type(
      await screen.findByLabelText('Title', { exact: true }, LOAD),
      'Still editing',
    );
    await fixture.user.keyboard('{Escape}');
    await screen.findByRole('alertdialog', {
      name: 'Discard unsaved changes?',
    });
    const restore = await fixture.recheck();
    await restore();
    expect(
      await screen.findByLabelText('Title', { exact: true }, LOAD),
    ).toHaveValue('Still editing');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/items/new');
    await fixture.user.keyboard('{Escape}');
    expect(
      await screen.findByRole('alertdialog', {
        name: 'Discard unsaved changes?',
      }),
    ).toBeVisible();
  });

  it('keeps protection above a parent Activity that disconnects the nested Projects host', async () => {
    const fixture = await renderEditor(newIssueRoute, 'en-US', false, true);
    await fixture.user.type(
      await screen.findByLabelText('Title', { exact: true }, LOAD),
      'Parent recheck draft',
    );
    const restore = await fixture.recheck();
    try {
      await act(async () => fixture.navigate('/elsewhere'));
      await act(async () => fixture.navigate(-1));
      expect(screen.getByTestId('location')).toHaveTextContent('/items/new');
      const unload = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(unload);
      expect(unload.defaultPrevented).toBe(true);
    } finally {
      await restore();
    }
    expect(
      await screen.findByLabelText('Title', { exact: true }, LOAD),
    ).toHaveValue('Parent recheck draft');
    await fixture.user.keyboard('{Escape}');
    expect(
      await screen.findByRole('alertdialog', {
        name: 'Discard unsaved changes?',
      }),
    ).toBeVisible();
  });

  it('unmounts a denied editor and releases both the wait lock and the old confirmation', async () => {
    const fixture = await renderEditor(newIssueRoute, 'en-US', true);
    await fixture.user.type(
      await screen.findByLabelText('Title', { exact: true }, LOAD),
      'Revoked draft',
    );
    await fixture.user.keyboard('{Escape}');
    await screen.findByRole('alertdialog');
    const restore = await fixture.recheck();
    await restore(false);
    expect(await screen.findByText('Access denied', {}, LOAD)).toBeVisible();
    expect(screen.queryByLabelText('Title', { exact: true })).toBeNull();
    expect(
      document.querySelector('[data-slot="route-overlay-footer"]'),
    ).toBeNull();
    await fixture.user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const unload = new Event('beforeunload', { cancelable: true });
    fireEvent(window, unload);
    expect(unload.defaultPrevented).toBe(false);
  });
});
