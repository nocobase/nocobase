/**
 * Settings › Knowledge search in the browser: the search status (keyword search always, semantic search with why it is
 * unavailable and how to fix it), the vector store with its location and index progress, the model pickers' link to
 * the model services and their empty hint, contextual retrieval as a switch with its model and spaces, and the
 * whole-knowledge threshold with its approximate size. Each part saves on its own over the latest settings.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_KNOWLEDGE_SEARCH,
  type KnowledgeSearchConfig,
  type KnowledgeSearchSettings,
} from '../../shared/knowledge';

const api = {
  knowledgeSearch: vi.fn<() => Promise<KnowledgeSearchConfig>>(),
  updateKnowledgeSearch:
    vi.fn<
      (settings: KnowledgeSearchSettings) => Promise<KnowledgeSearchConfig>
    >(),
};

vi.mock('../../client/access/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../client/access/api')>()),
  useStudioApi: () => api,
}));
vi.mock('../../client/access/notify', () => ({
  useNotify: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@nocobase/i18n/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en-US' },
  }),
}));

const { default: KnowledgeSearchSettingsPage } =
  await import('../../client/pages/config/knowledge-search');

const wrap = (ui: ReactElement) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const embed = {
  modelService: 'openai',
  model: 'text-embedding-3-small',
  label: 'text-embedding-3-small',
  serviceTitle: 'OpenAI',
};
const chat = {
  modelService: 'openai',
  model: 'gpt-mini',
  label: 'GPT mini',
  serviceTitle: 'OpenAI',
};

function config(
  overrides: Partial<KnowledgeSearchConfig> = {},
): KnowledgeSearchConfig {
  return {
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
    spaces: [
      { key: 'system:', scope: 'system', scopeId: '', title: '' },
      { key: 'project:p1', scope: 'project', scopeId: 'p1', title: 'Studio' },
    ],
    models: { embedding: [embed], rerank: [], chat: [chat] },
    canManage: true,
    ...overrides,
  };
}

beforeEach(() => {
  api.knowledgeSearch.mockReset();
  api.updateKnowledgeSearch.mockReset();
  api.updateKnowledgeSearch.mockImplementation((settings) =>
    Promise.resolve(config({ settings })),
  );
});

const statusCard = async () =>
  within(
    (await screen.findByText('knowledge.searchSettings.status.title')).closest(
      '[data-slot="card"]',
    ) as HTMLElement,
  );

/** One section of the page, by the id its heading carries. */
const section = (name: string) =>
  within(
    document.querySelector(
      `[aria-labelledby="kb-search-${name}"]`,
    ) as HTMLElement,
  );

describe('the knowledge search settings page', () => {
  it('says why semantic search is unavailable, how to fix it, and names the store type', async () => {
    api.knowledgeSearch.mockResolvedValue(
      config({
        index: {
          available: false,
          store: {
            type: 'pgvector',
            target: 'postgres://vec@db.internal:5432/vectors',
          },
          reason: 'PGVECTOR_EXTENSION_MISSING',
          active: null,
          building: null,
          pending: 0,
          failed: 0,
        },
      }),
    );
    render(wrap(<KnowledgeSearchSettingsPage />));
    const card = await statusCard();
    expect(
      card.getByText('knowledge.searchSettings.status.keyword'),
    ).toBeInTheDocument();
    expect(
      card.getByText('knowledge.searchSettings.status.unavailable'),
    ).toBeInTheDocument();
    expect(
      card.getByText(
        /reasons\.PGVECTOR_EXTENSION_MISSING\.title knowledge\.searchSettings\.reasons\.PGVECTOR_EXTENSION_MISSING\.fix/u,
      ),
    ).toBeInTheDocument();
    expect(
      card.getByRole('link', { name: 'knowledge.searchSettings.status.docs' }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining(
        'nocobase/nocobase/blob/v3-develop/packages/apps/studio/docs/knowledge.md#vector-store',
      ) as string,
    );

    expect(
      screen.getByText('knowledge.searchSettings.store.types.pgvector'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('postgres://vec@db.internal:5432/vectors'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/agents:\s+vectors:/u)).toBeInTheDocument();
  });

  it('shows the index being built with its progress', async () => {
    api.knowledgeSearch.mockResolvedValue(
      config({
        settings: {
          ...DEFAULT_KNOWLEDGE_SEARCH,
          embedding: { modelService: embed.modelService, model: embed.model },
        },
        index: {
          available: true,
          store: { type: 'sqlite-vec' },
          reason: null,
          active: null,
          building: {
            modelService: 'openai',
            model: embed.model,
            dimension: 1536,
            indexed: 120,
            total: 480,
          },
          pending: 360,
          failed: 0,
        },
      }),
    );
    render(wrap(<KnowledgeSearchSettingsPage />));
    const card = await statusCard();
    expect(
      card.getByText('knowledge.searchSettings.status.building'),
    ).toBeInTheDocument();
    expect(
      card.getByText(/status\.buildingHint .*"indexed":120,"total":480/u),
    ).toBeInTheDocument();
    expect(
      screen.getByText('knowledge.searchSettings.store.types.sqlite-vec'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('storage/vectors.sqlite'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', {
        name: /store\.buildingIndex .*"indexed":120,"total":480/u,
      }),
    ).toBeInTheDocument();
  });

  it('labels each model picker as from the model services, with a hint when there is none', async () => {
    api.knowledgeSearch.mockResolvedValue(config());
    render(wrap(<KnowledgeSearchSettingsPage />));
    await screen.findByText('knowledge.searchSettings.rerank.title');
    expect(
      screen.getByText(/knowledge\.searchSettings\.rerank\.empty/u),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/knowledge\.searchSettings\.embedding\.empty/u),
    ).toBeNull();
    const links = screen.getAllByRole('link', {
      name: 'knowledge.searchSettings.manageModels',
    });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/models');
  });

  it('turns contextual retrieval on with a model, then per space, and off again', async () => {
    api.knowledgeSearch.mockResolvedValue(config());
    render(wrap(<KnowledgeSearchSettingsPage />));
    const toggle = await screen.findByRole('switch', {
      name: 'knowledge.searchSettings.contextual.enable',
    });
    expect(
      screen.getByText('knowledge.searchSettings.contextual.cost'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', {
        name: 'knowledge.searchSettings.contextual.model',
      }),
    ).toBeNull();

    await userEvent.click(toggle);
    // Switched on, nothing is saved until a model is chosen; the spaces wait for it.
    expect(api.updateKnowledgeSearch).not.toHaveBeenCalled();
    expect(
      screen.getByText('knowledge.searchSettings.contextual.chooseModel'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('combobox', {
        name: 'knowledge.searchSettings.contextual.model',
      }),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: 'OpenAI · GPT mini' }),
    );
    await waitFor(() =>
      expect(api.updateKnowledgeSearch).toHaveBeenLastCalledWith({
        ...DEFAULT_KNOWLEDGE_SEARCH,
        contextModel: { modelService: 'openai', model: 'gpt-mini' },
      }),
    );

    const studio = await screen.findByRole('switch', {
      name: /contextual\.space .*"space":"Studio"/u,
    });
    await userEvent.click(studio);
    await waitFor(() =>
      expect(api.updateKnowledgeSearch).toHaveBeenLastCalledWith({
        ...DEFAULT_KNOWLEDGE_SEARCH,
        contextModel: { modelService: 'openai', model: 'gpt-mini' },
        contextual: ['project:p1'],
      }),
    );

    await userEvent.click(
      screen.getByRole('switch', {
        name: 'knowledge.searchSettings.contextual.enable',
      }),
    );
    await waitFor(() =>
      expect(api.updateKnowledgeSearch).toHaveBeenLastCalledWith({
        ...DEFAULT_KNOWLEDGE_SEARCH,
        contextModel: null,
        contextual: ['project:p1'],
      }),
    );
  });

  it('names the whole-knowledge threshold and states its size', async () => {
    api.knowledgeSearch.mockResolvedValue(config());
    render(wrap(<KnowledgeSearchSettingsPage />));
    expect(
      await screen.findByText('knowledge.searchSettings.whole.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/whole\.approx .*"value":"150K"/u),
    ).toBeInTheDocument();
    const input = screen.getByRole('textbox', {
      name: 'knowledge.searchSettings.whole.title',
    });
    await userEvent.clear(input);
    await userEvent.type(input, '20000');
    expect(
      screen.getByText(/whole\.approx .*"value":"20K"/u),
    ).toBeInTheDocument();
    await userEvent.click(
      section('whole').getByRole('button', {
        name: 'knowledge.searchSettings.save',
      }),
    );
    await waitFor(() =>
      expect(api.updateKnowledgeSearch).toHaveBeenLastCalledWith({
        ...DEFAULT_KNOWLEDGE_SEARCH,
        wholeTokens: 20000,
      }),
    );
  });

  it('saves the ranking, refusing values out of range', async () => {
    api.knowledgeSearch.mockResolvedValue(config());
    render(wrap(<KnowledgeSearchSettingsPage />));
    await screen.findByText('knowledge.searchSettings.recall.title');
    const recall = section('recall');
    const save = recall.getByRole('button', {
      name: 'knowledge.searchSettings.save',
    });
    expect(save).toBeDisabled();
    const weight = recall.getByLabelText(
      'knowledge.searchSettings.recall.keywordWeight',
    );
    await userEvent.clear(weight);
    await userEvent.type(weight, '2');
    expect(
      recall.getByText('knowledge.searchSettings.recall.invalid'),
    ).toBeInTheDocument();
    expect(save).toBeDisabled();
    await userEvent.clear(weight);
    await userEvent.type(weight, '0.7');
    const minScore = recall.getByLabelText(
      'knowledge.searchSettings.recall.minScore',
    );
    await userEvent.clear(minScore);
    await userEvent.type(minScore, '0.2');
    await userEvent.click(save);
    await waitFor(() =>
      expect(api.updateKnowledgeSearch).toHaveBeenLastCalledWith({
        ...DEFAULT_KNOWLEDGE_SEARCH,
        recall: {
          ...DEFAULT_KNOWLEDGE_SEARCH.recall,
          keywordWeight: 0.7,
          minScore: 0.2,
        },
      }),
    );
  });

  it('saves the default chunking', async () => {
    api.knowledgeSearch.mockResolvedValue(config());
    render(wrap(<KnowledgeSearchSettingsPage />));
    await screen.findByText('knowledge.searchSettings.chunking.title');
    const chunking = section('chunking');
    const max = chunking.getByLabelText(
      'knowledge.searchSettings.chunking.max',
    );
    await userEvent.clear(max);
    await userEvent.type(max, '1000');
    expect(
      chunking.getByText('knowledge.searchSettings.chunking.invalid'),
    ).toBeInTheDocument();
    await userEvent.clear(max);
    await userEvent.type(max, '3000');
    await userEvent.click(
      chunking.getByRole('button', { name: 'knowledge.searchSettings.save' }),
    );
    await waitFor(() =>
      expect(api.updateKnowledgeSearch).toHaveBeenLastCalledWith({
        ...DEFAULT_KNOWLEDGE_SEARCH,
        chunking: { headingDepth: 3, target: 1200, max: 3000 },
      }),
    );
  });

  it('says a change of the vector store needs a restart', async () => {
    api.knowledgeSearch.mockResolvedValue(config());
    render(wrap(<KnowledgeSearchSettingsPage />));
    expect(
      await screen.findByText(/knowledge\.searchSettings\.store\.restart/u),
    ).toBeInTheDocument();
  });
});
