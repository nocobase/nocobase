import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import ArticlesPage from '../../client/pages/articles.tsx';
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';

async function mount(
  options: {
    empty?: boolean;
    route?: string;
    beforeRequest?: (request: Request) => void;
  } = {},
) {
  return renderAuthenticatedClient(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ArticlesPage />
    </QueryClientProvider>,
    {
      member: true,
      route: options.route,
      beforeRequest: options.beforeRequest,
      async prepare(server, session) {
        await server.connection.query
          .deleteFrom('articles')
          .allowAllRows()
          .execute();
        if (options.empty) return;
        const response = await session.fetch('/articles', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            origin: 'http://localhost',
          },
          body: JSON.stringify({
            title: 'Welcome',
            summary: 'A useful introduction',
            content: 'Article body',
            status: 'draft',
          }),
        });
        expect(response.status).toBe(201);
      },
    },
  );
}
it('corrects an out-of-range page using the successful total before showing the actual list', async () => {
  const pages: string[] = [];
  await mount({
    route: '/articles?page=999',
    beforeRequest(request) {
      const url = new URL(request.url);
      if (request.method === 'GET' && url.pathname.endsWith('/articles'))
        pages.push(url.searchParams.get('page') ?? '');
    },
  });
  expect(
    await screen.findByRole('button', { name: 'Welcome', exact: true }),
  ).toBeVisible();
  expect(pages).toEqual(['999', '1']);
  expect(screen.queryByText('No articles yet.')).not.toBeInTheDocument();
});
it('loads articles, previews content, searches and filters persisted results', async () => {
  await mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }));
  expect(await screen.findByText('Article body')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  const search = screen.getByRole('textbox', { name: 'Search titles…' });
  fireEvent.change(search, { target: { value: 'no-such-title' } });
  expect(await screen.findByText('No matching results.')).toBeVisible();
  fireEvent.change(search, { target: { value: 'Welcome' } });
  expect(await screen.findByRole('button', { name: 'Welcome' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Published' }));
  expect(await screen.findByText('No matching results.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Draft' }));
  expect(await screen.findByRole('button', { name: 'Welcome' })).toBeVisible();
});
it('creates an article, persists its content and refreshes the list', async () => {
  const view = await mount();
  await screen.findByRole('button', { name: 'Welcome' });
  fireEvent.click(screen.getByRole('button', { name: 'New article' }));
  const editor = within(await screen.findByRole('dialog'));
  fireEvent.change(editor.getByLabelText('Title'), {
    target: { value: 'My article' },
  });
  fireEvent.change(editor.getByLabelText('Content'), {
    target: { value: 'My text' },
  });
  fireEvent.click(editor.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'My article' }));
  expect(
    await within(await screen.findByRole('dialog')).findByText('My text'),
  ).toBeVisible();
  const response = await view.session.fetch('/articles?q=My%20article');
  expect(await response.json()).toMatchObject({
    data: [{ title: 'My article', content: 'My text', status: 'draft' }],
    meta: { total: 1 },
  });
});
it('keeps unsaved edits on network failure and persists them on retry', async () => {
  let offline = true;
  const view = await mount({
    beforeRequest(request) {
      // Inject only the transport failure; authentication, request encoding and persistence stay real.
      if (
        offline &&
        request.method === 'PATCH' &&
        request.url.includes('/articles/')
      )
        throw new TypeError('Failed to fetch');
    },
  });
  fireEvent.click(
    await screen.findByRole('button', { name: 'Edit article Welcome' }),
  );
  const editor = within(await screen.findByRole('dialog'));
  fireEvent.change(editor.getByLabelText('Title'), {
    target: { value: 'Changed title' },
  });
  fireEvent.click(editor.getByRole('button', { name: 'Save' }));
  expect(await editor.findByRole('alert')).toHaveTextContent('Unable to save');
  expect(editor.getByLabelText('Title')).toHaveValue('Changed title');
  expect(await (await view.session.fetch('/articles')).json()).toMatchObject({
    data: [{ title: 'Welcome' }],
  });
  offline = false;
  fireEvent.click(editor.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(
    await screen.findByRole('button', { name: 'Changed title' }),
  ).toBeVisible();
  expect(await (await view.session.fetch('/articles')).json()).toMatchObject({
    data: [{ title: 'Changed title' }],
  });
});
it('recovers from a load error to the real empty state', async () => {
  let offline = true;
  await mount({
    empty: true,
    beforeRequest(request) {
      if (
        offline &&
        request.method === 'GET' &&
        new URL(request.url).pathname.endsWith('/articles')
      )
        throw new TypeError('Failed to fetch');
    },
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load this list.',
  );
  offline = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('No articles yet.')).toBeVisible();
});
