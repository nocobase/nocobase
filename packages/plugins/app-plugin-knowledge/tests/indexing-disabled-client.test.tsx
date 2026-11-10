/** `knowledge({ indexing: false })`: no indexing entry, and nothing asks the server about indexing. */
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import knowledge from '../client/plugin.js';
import { knowledgeIndexingFormsToken } from '../client/indexing/index.js';
import { KnowledgeIndexingEntry } from '../client/pages.js';

async function render(indexing: boolean) {
  const requested: string[] = [];
  const view = await renderWithApp(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <p>Knowledge</p>
      <KnowledgeIndexingEntry />
    </QueryClientProvider>,
    {
      plugins: [knowledge({ routes: false, indexing })],
      fetch: async (request) => {
        const path = new URL(request.url).pathname.replace(/^\/api\//, '');
        requested.push(path);
        if (path === 'authorization/permissions')
          return Response.json({
            data: {
              unrestricted: false,
              permissions: [
                {
                  resource: { type: 'settings', id: 'kb.indexing' },
                  actions: ['read'],
                },
              ],
            },
          });
        return Response.json({ error: { message: 'unexpected' } }, {
          status: 404,
        });
      },
      services: (app) => {
        app.container.instance(
          authorizationClientToken,
          new AuthorizationClient(app.container.resolve(apiClientToken)),
        );
      },
    },
  );
  await screen.findByText('Knowledge');
  return { view, requested };
}

it('shows no indexing entry and requests no indexing API with indexing off', async () => {
  const { view, requested } = await render(false);
  expect(view.app.container.has(knowledgeIndexingFormsToken)).toBe(false);
  expect(
    screen.queryByRole('button', { name: 'Knowledge index settings' }),
  ).toBeNull();
  expect(requested.filter((path) => path.includes('indexing'))).toEqual([]);
  expect(requested).not.toContain('authorization/permissions');
});

it('shows the entry to a reader of the indexing settings by default', async () => {
  const { view } = await render(true);
  expect(view.app.container.has(knowledgeIndexingFormsToken)).toBe(true);
  expect(
    await screen.findByRole('button', { name: 'Knowledge index settings' }),
  ).toBeTruthy();
});
