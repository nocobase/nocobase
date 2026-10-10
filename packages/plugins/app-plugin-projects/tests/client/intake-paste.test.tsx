import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createEvent,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import NewIssuePage from '../../client/pages/issues/new.js';
import type { IntakeFile } from '../../shared/intake.js';
import { permissionsOf } from '../permissions.js';

beforeEach(() => window.localStorage.clear());

async function setup(locale = 'en-US') {
  const uploaded: string[] = [];
  const requests = vi.fn(({ path, method }: ApiCall): unknown => {
    if (path === 'projects/me')
      return {
        data: {
          userId: 'u1',
          name: 'Tester',
          permissions: permissionsOf('admin', 'u1'),
          kinds: [],
        },
      };
    if (
      path === 'projects' ||
      path === 'projects/labels' ||
      path === 'projects/members'
    )
      return { data: [] };
    if (path === 'projects/intake/aiAvailability')
      return {
        data: { available: false, reason: 'noAgent', by: null, waits: false },
      };
    if (method === 'DELETE') return new Response(null, { status: 204 });
    if (path === 'projects/intake/split')
      return new Response(null, { status: 500 });
    return new Response(null, { status: 404 });
  });
  const answer = answerApi(requests);
  await renderWithApp(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <NewIssuePage />
    </QueryClientProvider>,
    {
      namespace: '@nocobase/app-plugin-projects',
      namespaces: {
        '@nocobase/app-plugin-projects': locales,
        '@nocobase/i18n': {
          status: { loading: locale === 'zh-CN' ? '加载中' : 'Loading' },
        },
      },
      route: '/issues/new?tab=ai',
      locale,
      fetch: async (request) => {
        if (
          request.method === 'POST' &&
          new URL(request.url).pathname.endsWith('/intake/files')
        ) {
          uploaded.push(await request.text());
          return Response.json({
            data: {
              id: `f${uploaded.length}`,
              filename: `image-${uploaded.length}.png`,
              ext: '.png',
              mimeType: 'image/png',
              size: 5,
              createdAt: '2026-10-01T00:00:00Z',
            } satisfies IntakeFile,
          });
        }
        return answer(request);
      },
      services: (app) => {
        app.container.singleton(
          authorizationClientToken,
          (resolver) =>
            new AuthorizationClient(resolver.resolve(apiClientToken)),
        );
      },
    },
  );
  const box = await screen.findByRole('textbox', {
    name: locale === 'zh-CN' ? '需求' : 'Requirements',
  });
  await waitFor(() =>
    expect(
      requests.mock.calls.some(
        ([call]) => call.path === 'projects/intake/aiAvailability',
      ),
    ).toBe(true),
  );
  return { box, uploaded, requests };
}

function paste(box: HTMLElement, files: readonly File[]) {
  const event = createEvent.paste(box, {
    clipboardData: { files },
  });
  fireEvent(box, event);
  expect(event.defaultPrevented).toBe(false);
}

describe('requirements image paste', () => {
  it.each(['en-US', 'zh-CN'])(
    'uploads only images through the file list and removes them in %s',
    async (locale) => {
      const { box, uploaded, requests } = await setup(locale);
      fireEvent.change(box, { target: { value: 'Keep these requirements' } });
      paste(box, [
        new File(['image'], 'screenshot.png', { type: 'image/png' }),
        new File(['notes'], 'notes.txt', { type: 'text/plain' }),
        new File(['image'], 'diagram.jpg', { type: 'image/jpeg' }),
      ]);
      expect(await screen.findByText('screenshot.png')).toBeInTheDocument();
      expect(await screen.findByText('diagram.jpg')).toBeInTheDocument();
      await waitFor(() => expect(uploaded).toHaveLength(2));
      expect(uploaded[0]).toContain('Content-Type: image/png');
      expect(uploaded[1]).toContain('Content-Type: image/jpeg');
      expect(screen.queryByText('notes.txt')).toBeNull();
      expect(box).toHaveValue('Keep these requirements');
      const remove = await screen.findByRole('button', {
        name:
          locale === 'zh-CN' ? '移除 screenshot.png' : 'Remove screenshot.png',
      });
      await waitFor(() =>
        expect(screen.getByTestId('intake-split')).toBeEnabled(),
      );
      fireEvent.click(remove);
      await waitFor(() =>
        expect(
          requests.mock.calls.some(
            ([call]) =>
              call.method === 'DELETE' &&
              call.path === 'projects/intake/files/f1',
          ),
        ).toBe(true),
      );
      expect(screen.queryByText('screenshot.png')).toBeNull();
      fireEvent.click(screen.getByTestId('intake-split'));
      await waitFor(() =>
        expect(
          requests.mock.calls.some(
            ([call]) =>
              call.path === 'projects/intake/split' && call.method === 'POST',
          ),
        ).toBe(true),
      );
      expect(
        requests.mock.calls.find(
          ([call]) => call.path === 'projects/intake/split',
        )?.[0].json,
      ).toEqual({
        text: 'Keep these requirements',
        fileIds: ['f2'],
        projectId: null,
      });
    },
  );

  it('preserves text paste at the selection without uploading files', async () => {
    const { box, uploaded } = await setup();
    const user = userEvent.setup();
    await user.click(box);
    await user.type(box, 'Before after');
    if (!(box instanceof HTMLTextAreaElement))
      throw new Error('Expected a textarea');
    box.setSelectionRange(7, 7);
    await user.paste('pasted ');
    expect(box).toHaveValue('Before pasted after');
    expect(uploaded).toHaveLength(0);
  });

  it('uploads images while allowing the text from the same clipboard to paste', async () => {
    const { box, uploaded } = await setup();
    const user = userEvent.setup();
    await user.click(box);
    await user.type(box, 'Before after');
    if (!(box instanceof HTMLTextAreaElement))
      throw new Error('Expected a textarea');
    box.setSelectionRange(0, 6);
    const clipboard = await user.copy();
    if (!clipboard) throw new Error('Expected clipboard data');
    clipboard.setData('text/plain', 'pasted ');
    Object.defineProperty(clipboard, 'files', {
      value: [new File(['image'], 'mixed.png', { type: 'image/png' })],
    });
    box.setSelectionRange(7, 7);
    await user.paste(clipboard);
    await waitFor(() => expect(uploaded).toHaveLength(1));
    expect(await screen.findByText('mixed.png')).toBeInTheDocument();
    expect(box).toHaveValue('Before pasted after');
  });
});
