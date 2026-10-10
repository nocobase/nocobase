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
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Link, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import NewIssuePage from '../../client/pages/issues/new.js';
import { permissionsOf } from '../permissions.js';
import { HistoryBack } from './history-back.js';
import { LocationProbe } from './location-probe.js';

afterEach(() => vi.restoreAllMocks());

const stored = (id: string) => ({
  data: {
    id,
    filename: 'screenshot.png',
    ext: 'png',
    mimeType: 'image/png',
    size: 4,
    issueId: null,
    commentId: null,
    uploader: { type: 'user', id: 'u1', name: 'Tester' },
    createdAt: '2026-10-10T00:00:00.000Z',
    contentUrl: `/api/projects/attachments/${id}/content`,
    downloadUrl: `/api/projects/attachments/${id}/content?download=true`,
    previewable: true,
    canDelete: true,
  },
});

/**
 * The New issue dialog in a started client application, over the issue list, with the real API client, translations
 * and unsaved-changes guard. The create request is answered only when the test says so.
 */
async function setup() {
  const calls: ApiCall[] = [];
  let answerCreate = (): void => undefined;
  const requests = (call: ApiCall): unknown => {
    calls.push(call);
    const { method, path } = call;
    if (path === 'projects/me')
      return {
        data: {
          userId: 'u1',
          name: 'Tester',
          permissions: permissionsOf('admin', 'u1'),
          kinds: [
            { key: 'user', title: null, executor: true, mentionable: true },
          ],
        },
      };
    if (method === 'POST' && path === 'projects/attachments')
      return stored('f1');
    if (method === 'POST' && path === 'projects/issues')
      return new Promise((resolve) => {
        answerCreate = () =>
          resolve({ data: { id: 'i1', identifier: 'PM-1' } });
      });
    if (method === 'POST' && path === 'projects/attachments/discard')
      return new Response(null, { status: 204 });
    if (method === 'GET' && path === 'projects/issues/starts')
      return { data: { initialStatus: 'todo', options: [] } };
    if (method === 'GET') return { data: [] };
    return new Response(null, { status: 404 });
  };
  await renderWithApp(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <Routes>
        <Route
          path='/issues'
          element={<Link to='/issues/new?tab=manual'>New issue</Link>}
        />
        <Route path='/issues/new' element={<NewIssuePage />} />
      </Routes>
      <LocationProbe />
      <HistoryBack />
    </QueryClientProvider>,
    {
      namespace: '@nocobase/app-plugin-projects',
      namespaces: {
        '@nocobase/app-plugin-projects': locales,
        // The submit button's spinner names itself in the shared namespace, which no plugin under test provides.
        '@nocobase/i18n': {
          'en-US': () =>
            Promise.resolve({ default: { status: { loading: 'Loading' } } }),
        },
      },
      route: '/issues',
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
  return { calls, answerCreate: () => answerCreate() };
}

describe('leaving the New issue dialog while it creates the issue', () => {
  it('discards none of the files the create request carries', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { calls, answerCreate } = await setup();
    fireEvent.click(await screen.findByRole('link', { name: 'New issue' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(await within(dialog).findByLabelText('Title'), {
      target: { value: 'Broken login' },
    });
    fireEvent.paste(
      within(dialog).getByRole('textbox', { name: 'Description' }),
      {
        clipboardData: {
          files: [
            new File([new Uint8Array([137, 80, 78, 71])], 'image.png', {
              type: 'image/png',
            }),
          ],
          types: ['Files'],
          getData: () => '',
        },
      },
    );
    await waitFor(() =>
      expect(dialog.querySelector('img[src$="/f1/content"]')).not.toBeNull(),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(
        calls.filter(
          (call) => call.method === 'POST' && call.path === 'projects/issues',
        ),
      ).toHaveLength(1),
    );

    // The browser's Back, which the dialog's close guard never sees, while the server may be attaching the files.
    fireEvent.click(screen.getByTestId('history-back'));
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/issues'),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    answerCreate();

    const created = calls.find(
      (call) => call.method === 'POST' && call.path === 'projects/issues',
    );
    expect(created?.json).toMatchObject({ attachmentIds: ['f1'] });
    // Let any cleanup the unmount started reach the API before checking that none did.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(
      calls.filter(
        (call) =>
          call.path === 'projects/attachments/discard' ||
          call.method === 'DELETE',
      ),
    ).toEqual([]);
  });
});
