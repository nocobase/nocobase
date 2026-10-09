import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Link, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import WorkflowDetailPage from '../../client/pages/config/workflow-detail.js';
import locales from '../../client/locales/index.js';
import {
  BUILTIN_STATUSES,
  type WorkflowListItem,
} from '../../shared/workflows.js';
import { permissionsOf } from '../permissions.js';

afterEach(() => vi.restoreAllMocks());

function workflow(): WorkflowListItem {
  return {
    id: 'wf1',
    name: 'Release train',
    description: null,
    isDefault: false,
    builtInKey: null,
    definition: { states: BUILTIN_STATUSES, transitions: [] },
    revision: 1,
    projectCount: 0,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };
}

function unloading(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

async function setup(
  locale = 'en-US',
  fail = false,
  failRefetch = false,
): Promise<Mock<(call: ApiCall) => unknown>> {
  let saved = workflow();
  const requests = vi.fn(({ method, path, json }: ApiCall): unknown => {
    if (path === 'projects/me')
      return {
        data: {
          userId: 'u1',
          name: 'Tester',
          permissions: permissionsOf('admin', 'u1'),
          kinds: [],
        },
      };
    if (path === 'projects/workflows') {
      if (failRefetch && saved.revision > 1)
        return new Response(null, { status: 500 });
      return { data: [saved] };
    }
    if (path.endsWith('/preview'))
      return { data: { rules: [], attention: [] } };
    if (method === 'PATCH') {
      if (fail)
        return new Response(
          JSON.stringify({
            error: { message: 'Save failed', status: 500, code: 'INTERNAL' },
          }),
          { status: 500, headers: { 'content-type': 'application/json' } },
        );
      saved = { ...saved, ...(json as Partial<WorkflowListItem>), revision: 2 };
      return { data: saved };
    }
    return new Response(null, { status: 404 });
  });
  await renderWithApp(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Link to='/elsewhere'>Elsewhere</Link>
      <Routes>
        <Route
          path='/config/workflows/:workflowId'
          element={<WorkflowDetailPage />}
        />
        <Route path='/elsewhere' element={<p>Destination</p>} />
      </Routes>
    </QueryClientProvider>,
    {
      namespace: '@nocobase/app-plugin-projects',
      namespaces: { '@nocobase/app-plugin-projects': locales },
      route: '/config/workflows/wf1',
      locale,
      fetch: answerApi(requests),
      services: (app) => {
        app.container.singleton(
          authorizationClientToken,
          (resolver) =>
            new AuthorizationClient(resolver.resolve(apiClientToken)),
        );
      },
    },
  );
  return requests;
}

describe('workflow save and leave behavior', () => {
  it.each([
    ['en-US', 'Edit', 'Name', 'Discard changes'],
    ['zh-CN', '编辑', '名称', '放弃修改'],
  ])(
    'only warns for unsaved edits in %s and preserves a declined draft',
    async (locale, edit, name, cancel) => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      await setup(locale);
      fireEvent.click(
        await screen.findByRole('button', { name: edit, exact: true }),
      );
      expect(unloading()).toBe(false);
      const input = screen.getByRole('textbox', { name });
      fireEvent.change(input, { target: { value: 'Changed' } });
      expect(unloading()).toBe(true);
      fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }));
      expect(confirm).toHaveBeenCalledOnce();
      expect(input).toHaveValue('Changed');
      fireEvent.change(input, { target: { value: 'Release train' } });
      expect(unloading()).toBe(false);
      fireEvent.change(input, { target: { value: 'Changed again' } });
      fireEvent.click(
        screen.getByRole('button', { name: cancel, exact: true }),
      );
      expect(unloading()).toBe(false);
      fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }));
      expect(await screen.findByText('Destination')).toBeInTheDocument();
      expect(confirm).toHaveBeenCalledOnce();
    },
  );

  it('leaves after confirming discard', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await setup();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit', exact: true }),
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Changed' },
    });
    fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }));
    expect(await screen.findByText('Destination')).toBeInTheDocument();
    expect(unloading()).toBe(false);
  });

  it.each([false, true])(
    'shows the saved workflow and releases the warning even if refetch fails: %s',
    async (failRefetch) => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const requests = await setup('en-US', false, failRefetch);
      fireEvent.click(
        await screen.findByRole('button', { name: 'Edit', exact: true }),
      );
      fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
        target: { value: 'Changed' },
      });
      fireEvent.click(
        screen.getByRole('button', { name: 'Save', exact: true }),
      );
      await screen.findByRole('button', { name: 'Edit', exact: true });
      expect(
        await screen.findByRole('heading', { name: 'Changed', exact: true }),
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(
          requests.mock.calls.filter(
            ([request]) => request.path === 'projects/workflows',
          ).length,
        ).toBeGreaterThan(1),
      );
      expect(
        requests.mock.calls.some(([request]) =>
          request.path.endsWith('/preview'),
        ),
      ).toBe(true);
      expect(
        requests.mock.calls.some(([request]) => request.method === 'PATCH'),
      ).toBe(true);
      expect(unloading()).toBe(false);
      fireEvent.click(screen.getByRole('link', { name: 'Elsewhere' }));
      expect(await screen.findByText('Destination')).toBeInTheDocument();
      expect(confirm).not.toHaveBeenCalled();
    },
  );

  it('keeps the warning and draft after a failed save', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const requests = await setup('en-US', true);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit', exact: true }),
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Changed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
    await waitFor(() =>
      expect(
        requests.mock.calls.some(([request]) => request.method === 'PATCH'),
      ).toBe(true),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save', exact: true }),
      ).toBeEnabled(),
    );
    expect(unloading()).toBe(true);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Changed',
    );
  });
});
