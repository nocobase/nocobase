import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, NamespaceScope, APP_NS } from '@nocobase/i18n/client';
import { beforeEach, expect, it, vi } from 'vitest';
import ArticlesPage from '../../client/pages/articles.tsx';
import enUS from '../../client/locales/en-US.ts';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => ({ request }),
}));
const article = {
  id: '1',
  title: 'Welcome',
  summary: 'A useful introduction',
  content: 'Article body',
  status: 'draft',
  updatedAt: '2026-09-08T00:00:00Z',
};
beforeEach(() => {
  request.mockReset().mockResolvedValue({
    data: [article],
    meta: { page: 1, pageSize: 12, total: 1 },
  });
});
async function mount() {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US'],
    applicationNamespace: '@nocobase/app-template-examples',
  });
  runtime.registerApplicationNamespace('@nocobase/app-template-examples', {
    'en-US': () => Promise.resolve({ default: enUS }),
  });
  await runtime.init('en-US');
  render(
    <I18nProvider runtime={runtime}>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NamespaceScope ns={APP_NS}>
          <ArticlesPage />
        </NamespaceScope>
      </QueryClientProvider>
    </I18nProvider>,
  );
}
it('loads articles, previews content, searches and filters', async () => {
  await mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }));
  expect(await screen.findByText('Article body')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Search titles…' }), {
    target: { value: 'test' },
  });
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ q: 'test', pageSize: 12 }),
      }),
    ),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Published', exact: true }),
  );
  await waitFor(() =>
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ status: 'published', page: 1 }),
      }),
    ),
  );
});
it('creates an article and refreshes the list', async () => {
  await mount();
  await screen.findByText('Welcome');
  fireEvent.click(screen.getByRole('button', { name: 'New article' }));
  const editor = within(await screen.findByRole('dialog'));
  fireEvent.change(editor.getByLabelText('Title'), {
    target: { value: 'My article' },
  });
  fireEvent.change(editor.getByLabelText('Content'), {
    target: { value: 'My text' },
  });
  fireEvent.click(editor.getByRole('button', { name: 'Save', exact: true }));
  await waitFor(() =>
    expect(request).toHaveBeenCalledWith({
      path: 'articles',
      method: 'POST',
      json: {
        title: 'My article',
        summary: '',
        content: 'My text',
        status: 'draft',
      },
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
});
it('keeps unsaved edits when a save fails', async () => {
  await mount();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Edit article Welcome' }),
  );
  const editor = within(await screen.findByRole('dialog'));
  fireEvent.change(editor.getByLabelText('Title'), {
    target: { value: 'Changed title' },
  });
  request.mockRejectedValueOnce(new Error('Forbidden'));
  fireEvent.click(editor.getByRole('button', { name: 'Save', exact: true }));
  expect(await editor.findByRole('alert')).toHaveTextContent('Unable to save');
  expect(request).toHaveBeenLastCalledWith({
    path: 'articles/1',
    method: 'PATCH',
    json: { title: 'Changed title' },
  });
  expect(editor.getByLabelText('Title')).toHaveValue('Changed title');
});
it('shows an empty state and recovers from a load error', async () => {
  request.mockRejectedValueOnce(new Error('Offline'));
  await mount();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load articles',
  );
  request.mockResolvedValue({
    data: [],
    meta: { page: 1, pageSize: 12, total: 0 },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No matching articles')).toBeVisible();
});
