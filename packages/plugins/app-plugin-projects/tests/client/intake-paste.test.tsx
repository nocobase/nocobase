import { useState } from 'react';
import { IntakeDraftProvider } from '../../client/kit/intake-draft.js';
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
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import NewIssuePage from '../../client/pages/issues/new.js';
import {
  INTAKE_FILES_MAX,
  INTAKE_FILE_SIZE_MAX,
  type IntakeFile,
} from '../../shared/intake.js';
import { permissionsOf } from '../permissions.js';

beforeEach(() => window.localStorage.clear());
function RemountableIntake() {
  const [shown, setShown] = useState(true);
  return (
    <IntakeDraftProvider>
      <button onClick={() => setShown((current) => !current)}>
        Toggle intake route
      </button>
      {shown ? <NewIssuePage /> : <p>Chat route</p>}
    </IntakeDraftProvider>
  );
}

async function setup(
  locale = 'en-US',
  stored: Partial<IntakeFile> = {},
  basePath = '',
  handlers: {
    upload?: (index: number) => Promise<Response>;
    remove?: () => Response;
  } = {},
) {
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
    if (method === 'DELETE')
      return handlers.remove?.() ?? new Response(null, { status: 204 });
    if (path === 'projects/intake/split')
      return new Response(null, { status: 500 });
    return new Response(null, { status: 404 });
  });
  const answer = answerApi(requests);
  const view = await renderWithApp(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RemountableIntake />
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
      config: { app: { basePath } },
      fetch: async (request) => {
        if (
          request.method === 'POST' &&
          new URL(request.url).pathname.endsWith('/intake/files')
        ) {
          uploaded.push(await request.text());
          if (handlers.upload) return handlers.upload(uploaded.length);
          return Response.json({
            data: {
              id: `f${uploaded.length}`,
              filename: `image-${uploaded.length}.png`,
              ext: 'png',
              mimeType: 'image/png',
              size: 5,
              createdAt: '2026-10-01T00:00:00Z',
              ...stored,
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
  return { box, uploaded, requests, toasts: view.toasts };
}

function paste(box: HTMLElement, files: readonly File[]) {
  const event = createEvent.paste(box, {
    clipboardData: { files },
  });
  fireEvent(box, event);
  expect(event.defaultPrevented).toBe(false);
}

function storedImage(id: string): Response {
  return Response.json({
    data: {
      id,
      filename: 'same.png',
      ext: 'png',
      mimeType: 'image/png',
      size: 5,
      createdAt: '2026-10-01T00:00:00Z',
    } satisfies IntakeFile,
  });
}

async function expectSplit(
  requests: ReturnType<typeof vi.fn>,
  box: HTMLElement,
  fileIds: string[],
) {
  fireEvent.change(box, { target: { value: '- Keep task' } });
  await waitFor(() => expect(screen.getByTestId('intake-split')).toBeEnabled());
  fireEvent.click(screen.getByTestId('intake-split'));
  await waitFor(() =>
    expect(
      requests.mock.calls.find(
        ([call]: [ApiCall]) => call.path === 'projects/intake/split',
      )?.[0].json,
    ).toMatchObject({ fileIds }),
  );
}

describe('requirements image paste', () => {
  it('keeps list and submitted IDs in addition order when uploads finish in reverse', async () => {
    const finishes: ((response: Response) => void)[] = [];
    const { box, requests, uploaded } = await setup('en-US', {}, '', {
      upload: () => new Promise((resolve) => finishes.push(resolve)),
    });
    paste(
      box,
      ['first.png', 'second.png', 'third.png'].map(
        (name) => new File(['image'], name, { type: 'image/png' }),
      ),
    );
    await waitFor(() => expect(uploaded).toHaveLength(3));
    finishes[2]!(storedImage('third'));
    finishes[1]!(storedImage('second'));
    expect(screen.getByTestId('intake-split')).toBeDisabled();
    finishes[0]!(storedImage('first'));
    await waitFor(() =>
      expect(
        screen
          .getAllByRole('button', { name: /^Preview / })
          .map((button) => button.getAttribute('aria-label')),
      ).toEqual([
        'Preview first.png',
        'Preview second.png',
        'Preview third.png',
      ]),
    );
    await expectSplit(requests, box, ['first', 'second', 'third']);
  });

  it.each(['paste', 'manual'])(
    'retains independent IDs for repeated identical %s files',
    async (source) => {
      const { box, requests, uploaded } = await setup();
      const image = new File(['same bytes'], 'same.png', { type: 'image/png' });
      for (let count = 1; count <= 2; count += 1) {
        if (source === 'paste') paste(box, [image]);
        else
          fireEvent.change(screen.getByTestId('intake-file-input'), {
            target: { files: [image] },
          });
        await waitFor(() => expect(uploaded).toHaveLength(count));
      }
      await waitFor(() =>
        expect(
          screen.getAllByRole('button', { name: 'Preview same.png' }),
        ).toHaveLength(2),
      );
      await expectSplit(requests, box, ['f1', 'f2']);
    },
  );

  it.each([false, true])(
    'reports deletion failure and retries cleanup (late upload: %s)',
    async (late) => {
      let finish!: (response: Response) => void;
      let attempts = 0;
      const { box, requests, uploaded } = await setup('en-US', {}, '', {
        ...(late
          ? {
              upload: () =>
                new Promise<Response>((resolve) => {
                  finish = resolve;
                }),
            }
          : {}),
        remove: () =>
          new Response(null, { status: ++attempts === 1 ? 500 : 204 }),
      });
      paste(box, [new File(['image'], 'same.png', { type: 'image/png' })]);
      await waitFor(() => expect(uploaded).toHaveLength(1));
      if (!late)
        await screen.findByRole('button', { name: 'Preview same.png' });
      fireEvent.click(
        await screen.findByRole('button', { name: 'Remove same.png' }),
      );
      if (late) finish(storedImage('late'));
      const retry = await screen.findByRole('button', {
        name: 'Retry deleting same.png',
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not delete same.png',
      );
      expect(
        screen.queryByRole('button', { name: 'Preview same.png' }),
      ).toBeNull();
      await expectSplit(requests, box, []);
      fireEvent.click(retry);
      await waitFor(() => expect(attempts).toBe(2));
      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: 'Retry deleting same.png' }),
        ).toBeNull(),
      );
    },
  );

  it('enforces the shared count and size limits on pasted images', async () => {
    const { box, uploaded, requests, toasts } = await setup();
    const oversized = new File(['large'], 'large.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', {
      value: INTAKE_FILE_SIZE_MAX + 1,
    });
    paste(box, [oversized]);
    expect(uploaded).toHaveLength(0);
    expect(screen.queryByText('large.png')).toBeNull();
    expect(toasts()).toMatchObject([
      { type: 'error', title: 'large.png is larger than 20 MB.' },
    ]);
    paste(
      box,
      Array.from(
        { length: INTAKE_FILES_MAX + 1 },
        (_, index) =>
          new File(['image'], `${index}.png`, { type: 'image/png' }),
      ),
    );
    await waitFor(() => expect(uploaded).toHaveLength(INTAKE_FILES_MAX));
    expect(screen.queryByText(`${INTAKE_FILES_MAX}.png`)).toBeNull();
    expect(toasts()).toContainEqual(
      expect.objectContaining({ type: 'error', title: 'At most 10 files.' }),
    );
    await expectSplit(
      requests,
      box,
      Array.from({ length: INTAKE_FILES_MAX }, (_, index) => `f${index + 1}`),
    );
  });

  it('removes failed uploads from the list and submission', async () => {
    const { box, requests, uploaded, toasts } = await setup('en-US', {}, '', {
      upload: async () => new Response(null, { status: 500 }),
    });
    paste(box, [new File(['image'], 'failed.png', { type: 'image/png' })]);
    await waitFor(() => expect(uploaded).toHaveLength(1));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Remove failed.png' }),
      ).toBeNull(),
    );
    await expectSplit(requests, box, []);
    expect(toasts()).toContainEqual(
      expect.objectContaining({
        type: 'error',
        title: 'Could not upload failed.png.',
      }),
    );
  });

  it.each([
    ['HTML with text', '<b>pasted</b>', 'pasted'],
    ['HTML only', '<img src="https://example.com/image.png">', ''],
    ['file path', '', '/tmp/screenshot.png'],
    ['non-image file', '', 'notes'],
  ])(
    'preserves default paste for %s without adding files',
    async (kind, html, text) => {
      const { box, uploaded } = await setup();
      const user = userEvent.setup();
      await user.click(box);
      await user.type(box, 'Before selected after');
      if (!(box instanceof HTMLTextAreaElement))
        throw new Error('Expected textarea');
      box.setSelectionRange(7, 15);
      const clipboard = await user.copy();
      if (!clipboard) throw new Error('Expected clipboard');
      clipboard.clearData();
      if (text) clipboard.setData('text/plain', text);
      if (html) clipboard.setData('text/html', html);
      if (kind === 'non-image file')
        Object.defineProperty(clipboard, 'files', {
          value: [new File(['notes'], 'notes.txt', { type: 'text/plain' })],
        });
      const event = createEvent.paste(box, { clipboardData: clipboard });
      fireEvent(box, event);
      expect(event.defaultPrevented).toBe(false);
      // user-event inserts HTML as text; jsdom has no native paste default.
      if (text) await user.paste(clipboard);
      expect(box).toHaveValue(
        text ? `Before ${text} after` : 'Before selected after',
      );
      expect(uploaded).toHaveLength(0);
      expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull();
    },
  );
  it.each(['paste', 'manual'])(
    'cleans up a %s upload removed before it finishes',
    async (source) => {
      let finish!: (response: Response) => void;
      const { box, requests, uploaded } = await setup('en-US', {}, '', {
        upload: () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      });
      const image = new File(['image'], 'pending.png', { type: 'image/png' });
      if (source === 'paste') paste(box, [image]);
      else
        fireEvent.change(screen.getByTestId('intake-file-input'), {
          target: { files: [image] },
        });
      await waitFor(() => expect(uploaded).toHaveLength(1));
      fireEvent.click(
        await screen.findByRole('button', { name: 'Remove pending.png' }),
      );
      finish(
        Response.json({
          data: {
            id: 'late',
            filename: 'pending.png',
            ext: 'png',
            mimeType: 'image/png',
            size: 5,
            createdAt: '2026-10-01T00:00:00Z',
          } satisfies IntakeFile,
        }),
      );
      await waitFor(() =>
        expect(
          requests.mock.calls.some(
            ([call]) =>
              call.method === 'DELETE' &&
              call.path === 'projects/intake/files/late',
          ),
        ).toBe(true),
      );
      expect(
        screen.queryByRole('button', { name: 'Preview pending.png' }),
      ).toBeNull();
      fireEvent.change(box, { target: { value: '- Keep task' } });
      fireEvent.click(screen.getByTestId('intake-split'));
      await waitFor(() =>
        expect(
          requests.mock.calls.find(
            ([call]) => call.path === 'projects/intake/split',
          )?.[0].json,
        ).toMatchObject({ fileIds: [] }),
      );
    },
  );
  it('restores the text and selected uploads after leaving and returning without automatically submitting', async () => {
    const { box, requests } = await setup();
    fireEvent.change(box, { target: { value: 'Keep the red card and retry' } });
    paste(box, [new File(['image'], 'screen.png', { type: 'image/png' })]);
    await screen.findByRole('button', { name: 'Preview screen.png' });
    fireEvent.click(screen.getByText('Toggle intake route'));
    expect(
      screen.queryByRole('textbox', { name: 'Requirements' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Toggle intake route'));
    expect(
      await screen.findByRole('textbox', { name: 'Requirements' }),
    ).toHaveValue('Keep the red card and retry');
    expect(
      screen.getByRole('button', { name: 'Preview screen.png' }),
    ).toBeInTheDocument();
    expect(
      requests.mock.calls.some(
        ([call]) => call.path === 'projects/intake/split',
      ),
    ).toBe(false);
    fireEvent.click(screen.getByTestId('intake-split'));
    await waitFor(() =>
      expect(
        requests.mock.calls.some(
          ([call]) => call.path === 'projects/intake/split',
        ),
      ).toBe(true),
    );
    expect(
      requests.mock.calls.find(
        ([call]) => call.path === 'projects/intake/split',
      )?.[0].json,
    ).toMatchObject({ fileIds: ['f1'], text: 'Keep the red card and retry' });
  });
  it('reports a failed TXT upload and excludes it from the submitted files', async () => {
    const { box, uploaded, requests } = await setup('en-US', {}, '', {
      upload: async () => new Response(null, { status: 500 }),
    });
    fireEvent.change(box, { target: { value: 'Keep these requirements' } });
    fireEvent.change(screen.getByTestId('intake-file-input'), {
      target: {
        files: [
          new File(['PM307-UPLOAD: Owner filter'], 'notes.txt', {
            type: 'text/plain',
          }),
        ],
      },
    });
    expect(
      await screen.findByText('Could not upload notes.txt.'),
    ).toBeInTheDocument();
    expect(uploaded).toHaveLength(1);
    await waitFor(() =>
      expect(screen.getByTestId('intake-split')).toBeEnabled(),
    );
    fireEvent.click(screen.getByTestId('intake-split'));
    await waitFor(() =>
      expect(
        requests.mock.calls.some(
          ([call]) => call.path === 'projects/intake/split',
        ),
      ).toBe(true),
    );
    expect(
      requests.mock.calls.find(
        ([call]) => call.path === 'projects/intake/split',
      )?.[0].json,
    ).toEqual({
      text: 'Keep these requirements',
      fileIds: [],
      projectId: null,
    });
  });

  it.each([
    ['paste', 'en-US', ''],
    ['manual', 'zh-CN', '/studio'],
  ])(
    'previews %s uploads with the shared attachment UI in %s',
    async (source, locale, basePath) => {
      const { box } = await setup(locale, {}, basePath);
      const user = userEvent.setup();
      const image = new File(['image'], 'screenshot.png', {
        type: 'image/png',
      });
      if (source === 'paste') paste(box, [image]);
      else
        fireEvent.change(screen.getByTestId('intake-file-input'), {
          target: { files: [image] },
        });
      const trigger = await screen.findByRole('button', {
        name: `${locale === 'zh-CN' ? '预览' : 'Preview'} screenshot.png`,
      });
      await user.click(trigger);
      const preview = await screen.findByRole('dialog', {
        name: 'screenshot.png',
      });
      expect(
        within(preview).getByRole('img', { name: 'screenshot.png' }),
      ).toHaveAttribute(
        'src',
        `${basePath}/api/projects/attachments/f1/content`,
      );
      expect(
        within(preview).getByRole('button', {
          name: `${locale === 'zh-CN' ? '下载' : 'Download'} screenshot.png`,
        }),
      ).toHaveAttribute(
        'href',
        `${basePath}/api/projects/attachments/f1/content?download=true`,
      );
      await user.keyboard('{Escape}');
      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: 'screenshot.png' }),
        ).toBeNull(),
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await user.click(
        screen.getByRole('button', {
          name: `${locale === 'zh-CN' ? '移除' : 'Remove'} screenshot.png`,
        }),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole('button', {
            name: `${locale === 'zh-CN' ? '预览' : 'Preview'} screenshot.png`,
          }),
        ).toBeNull(),
      );
    },
  );

  it('does not preview active image markup', async () => {
    const { box } = await setup('en-US', {
      ext: 'svg',
      mimeType: 'image/svg+xml',
    });
    paste(box, [
      new File(['<svg />'], 'drawing.svg', { type: 'image/svg+xml' }),
    ]);
    expect(await screen.findByText('drawing.svg')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('intake-split')).toBeEnabled(),
    );
    expect(
      screen.queryByRole('button', { name: 'Preview drawing.svg' }),
    ).toBeNull();
  });

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
