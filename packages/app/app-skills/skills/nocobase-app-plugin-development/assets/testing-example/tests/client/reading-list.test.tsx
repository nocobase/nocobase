import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import readingList, { ReadingList } from '../../client/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

it.each([
  ['en-US', enUS],
  ['zh-CN', zhCN],
] as const)(
  'loads the registered plugin locales and entries in %s',
  async (locale, messages) => {
    const pending = Promise.withResolvers<Response>();
    const api = vi.fn((call: ApiCall) =>
      call.method === 'GET' && call.path === 'readingList'
        ? pending.promise
        : new Response(null, { status: 404 }),
    );
    try {
      await renderWithApp(<ReadingList />, {
        plugins: [readingList()],
        locale,
        fetch: answerApi(api),
      });
      expect(
        screen.getByRole('heading', { name: messages.title }),
      ).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(messages.loading);
      await act(async () => {
        pending.resolve(
          Response.json({
            data: [{ id: 'client-entry', title: 'Read the migration guide' }],
            meta: { total: 1 },
          }),
        );
        await pending.promise;
      });
      expect(await screen.findByRole('listitem')).toHaveTextContent(
        'Read the migration guide',
      );
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(api).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: 'readingList' }),
      );
    } finally {
      await act(async () => {
        pending.resolve(new Response(null, { status: 503 }));
        await pending.promise;
      });
    }
  },
);

it('reports a denied response using the plugin translation', async () => {
  await renderWithApp(<ReadingList />, {
    plugins: [readingList()],
    locale: 'zh-CN',
    fetch: answerApi((call) =>
      call.method === 'GET' && call.path === 'readingList'
        ? Response.json(
            { error: { reason: 'AUTHORIZATION_DENIED', message: 'Denied' } },
            { status: 403 },
          )
        : new Response(null, { status: 404 }),
    ),
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(zhCN.failed);
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
});

it('renders an empty list explicitly', async () => {
  await renderWithApp(<ReadingList />, {
    plugins: [readingList()],
    fetch: answerApi((call) =>
      call.method === 'GET' && call.path === 'readingList'
        ? { data: [], meta: { total: 0 } }
        : new Response(null, { status: 404 }),
    ),
  });
  expect(await screen.findByText(enUS.empty)).toBeInTheDocument();
});
