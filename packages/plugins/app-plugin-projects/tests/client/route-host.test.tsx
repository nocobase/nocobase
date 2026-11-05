import { apiClientToken } from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import projects from '../../client/plugin.js';
import {
  newIssueRoute,
  projectsRoute,
  issueDetailChildRoutes,
} from '../../client/pages.js';
import { BUSINESS_KEYS, SETTINGS_KEYS } from '../../shared/access.js';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';

import { renderRouteTree } from '../../../../templates/app-template-examples/client/routing/route-tree.js';
import enUS from '../../../../templates/app-template-examples/client/locales/en-US.js';
import packageMetadata from '../../../../templates/app-template-examples/package.json' with { type: 'json' };

const LOAD = { timeout: 10_000 };

function Parent() {
  return (
    <>
      <Link to='new?tab=manual'>Open editor</Link>
      <Outlet />
    </>
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
) {
  const created: unknown[] = [];
  const response = Promise.withResolvers<unknown>();
  const route: AppClientRegisteredRoute = {
    ...definition,
    id: 'application:editor',
    name: 'editor',
    path: '/items/new',
    auth: 'required',
    authz: 'skip',
    packageName: packageMetadata.name,
    source: 'application',
  };
  const user = userEvent.setup();
  await renderWithApp(
    <>
      <Routes>
        {renderRouteTree([
          {
            id: 'application:parent',
            name: 'parent',
            path: '/items',
            auth: 'required',
            authz: 'skip',
            packageName: packageMetadata.name,
            source: 'application',
            componentLoader: async () => ({ default: Parent }),
            children: [route],
          },
        ])}
        <Route path='/issues/created' element={<p>Created issue</p>} />
      </Routes>
      <Location />
    </>,
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
  return { user, created, response };
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
