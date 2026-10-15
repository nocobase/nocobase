import { ApiClientError } from '@nocobase/app-client';
import projects from '@nocobase/app-plugin-projects/client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import KnowledgeSearchSettingsPage from '../../client/pages/config/knowledge-search.js';
import {
  DEFAULT_KNOWLEDGE_SEARCH,
  type KnowledgeSearchConfig,
} from '../../shared/knowledge.js';

const api = vi.hoisted(() => ({
  knowledgeSearch: vi.fn(),
  updateKnowledgeSearch: vi.fn(),
}));
vi.mock('../../client/access/api.js', () => ({ useStudioApi: () => api }));
vi.mock('../../client/access/notify.js', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const runtime = await createTestI18nRuntime({
  application: { namespace: 'app', resources: enUS },
  namespaces: { '@nocobase/app-plugin-projects': projects().locales! },
});
const key = ['studio', 'knowledge', 'search'];
const data: KnowledgeSearchConfig = {
  settings: DEFAULT_KNOWLEDGE_SEARCH,
  index: {
    available: true,
    store: { type: 'sqlite-vec' },
    reason: null,
    active: null,
    building: null,
    pending: 0,
    failed: 0,
  },
  models: { embedding: [], rerank: [], chat: [] },
  spaces: [],
  canManage: true,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <KnowledgeSearchSettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
  return client;
}

beforeEach(() => {
  api.knowledgeSearch.mockReset();
  api.updateKnowledgeSearch.mockReset();
});

it('exits initial loading after failure and retries without writing settings', async () => {
  let reject!: (error: Error) => void;
  api.knowledgeSearch
    .mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    )
    .mockResolvedValue(data);
  renderPage();
  expect(screen.getByRole('status', { name: 'Loading…' })).toBeVisible();
  await act(async () => reject(new Error('Private server details')));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load the knowledge search settings.',
  );
  expect(
    screen.queryByRole('status', { name: 'Loading…' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Private server details')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByText('Search status', { exact: true }),
  ).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(api.knowledgeSearch).toHaveBeenCalledTimes(2);
  expect(api.updateKnowledgeSearch).not.toHaveBeenCalled();
});

it('keeps cached settings and unsaved input when a refresh fails, then recovers', async () => {
  api.knowledgeSearch
    .mockResolvedValueOnce(data)
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValue(data);
  const client = renderPage();
  const results = await screen.findByLabelText('Results', { exact: true });
  await userEvent.clear(results);
  await userEvent.type(results, '7');
  await act(async () => {
    await client.invalidateQueries({ queryKey: key });
  });
  expect(await screen.findByRole('alert')).toBeVisible();
  expect(results).toHaveValue(7);
  expect(client.getQueryData(key)).toEqual(data);
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
  );
  expect(results).toHaveValue(7);
  expect(api.updateKnowledgeSearch).not.toHaveBeenCalled();
});

it('keeps the existing permission-denied behavior without offering retry', async () => {
  api.knowledgeSearch.mockRejectedValue(
    new ApiClientError('Private details', { status: 403 }),
  );
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You do not have permission',
  );
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('status', { name: 'Loading…' }),
  ).not.toBeInTheDocument();
});
