// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import LLMServicePage from '../client/pages/llm-service-page.js';
import ModelsPage from '../client/pages/llm-services/models.js';
import type { EnabledModel } from '../client/llm-service-service.js';

const ai = vi.hoisted(() => ({
  listLLMServices: vi.fn(),
  listLLMProviders: vi.fn(),
  listProviderModels: vi.fn(),
  updateLLMServiceEnabledModels: vi.fn(),
}));
vi.mock('../client/ai-employee-client.js', () => ({
  useAIEmployeeClient: () => ai,
}));

beforeEach(() => {
  vi.resetAllMocks();
  ai.listLLMServices.mockResolvedValue([
    {
      name: 'provider-service',
      title: 'Provider service',
      provider: 'openai',
      enabled: true,
      enabledModels: {
        mode: 'provider',
        models: [{ value: 'saved', label: 'Saved model' }],
      },
    },
  ]);
  ai.listLLMProviders.mockResolvedValue([]);
  ai.listProviderModels.mockResolvedValue([
    { value: 'new', label: 'New model' },
  ]);
});

async function renderEditor() {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace('@nocobase/app-plugin-ai-employee', locales);
  await runtime.init('en-US');
  const router = createMemoryRouter(
    [
      {
        path: '/settings/ai/llm-services',
        element: <LLMServicePage />,
        children: [{ path: ':serviceName/models', element: <ModelsPage /> }],
      },
    ],
    { initialEntries: ['/settings/ai/llm-services/provider-service/models'] },
  );
  render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  return screen.findByRole('combobox', { name: 'Search provider models' });
}

it('keeps saved selections that are absent from remote results and supports additional selections', async () => {
  await renderEditor();
  expect(
    await screen.findByRole('button', { name: 'Remove Saved model' }),
  ).toBeVisible();
  // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
  await userEvent.click(screen.getByRole('button', { name: 'Select models' }));
  fireEvent.click(await screen.findByRole('option', { name: 'New model' }));
  fireEvent.keyDown(
    screen.getByRole('combobox', { name: 'Search provider models' }),
    { key: 'Escape' },
  );
  expect(
    await screen.findByRole('button', { name: 'Remove Saved model' }),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Remove New model' }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Remove Saved model' }));
  expect(
    screen.queryByRole('button', { name: 'Remove Saved model' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Remove New model' }),
  ).toBeVisible();
});

it('keeps the latest remote results when search requests resolve out of order', async () => {
  const input = await renderEditor();
  let resolveOld!: (models: EnabledModel[]) => void;
  let resolveNew!: (models: EnabledModel[]) => void;
  ai.listProviderModels.mockImplementation((_name: string, search: string) => {
    if (search === 'model')
      return new Promise<EnabledModel[]>((resolve) => {
        resolveOld = resolve;
      });
    if (search === 'model-new')
      return new Promise<EnabledModel[]>((resolve) => {
        resolveNew = resolve;
      });
    return Promise.resolve([]);
  });
  await userEvent.click(screen.getByRole('button', { name: 'Select models' }));
  fireEvent.change(input, { target: { value: 'model' } });
  fireEvent.change(input, { target: { value: 'model-new' } });
  expect(ai.listProviderModels).toHaveBeenCalledWith(
    'provider-service',
    'model-new',
  );
  await act(async () =>
    resolveNew([{ value: 'model-new', label: 'Latest model' }]),
  );
  expect(
    await screen.findByRole('option', { name: 'Latest model' }),
  ).toBeVisible();
  await act(async () =>
    resolveOld([{ value: 'model-new-stale', label: 'Stale model' }]),
  );
  expect(
    screen.queryByRole('option', { name: 'Stale model' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Latest model' })).toBeVisible();
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(
    await screen.findByRole('button', { name: 'Remove Saved model' }),
  ).toBeVisible();
});

it('reports provider search failures without losing saved selections', async () => {
  const input = await renderEditor();
  ai.listProviderModels.mockRejectedValue(new Error('Provider unavailable'));
  fireEvent.change(input, { target: { value: 'failed' } });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Provider unavailable',
  );
  expect(
    screen.getByRole('button', { name: 'Remove Saved model' }),
  ).toBeVisible();
});

it('uses local input controls and rejects empty or duplicate custom model IDs', async () => {
  await renderEditor();
  fireEvent.click(screen.getByRole('radio', { name: 'Manual input' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add model' }));
  const input = screen.getByLabelText('Model ID');
  expect(input).toHaveAttribute('data-slot', 'input');
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Model ID is required.',
  );
  expect(ai.updateLLMServiceEnabledModels).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: 'duplicate' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add model' }));
  fireEvent.change(screen.getAllByLabelText('Model ID')[1]!, {
    target: { value: 'duplicate' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Duplicate Model ID: duplicate',
  );
  expect(ai.updateLLMServiceEnabledModels).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Remove model 1' }));
  await waitFor(() =>
    expect(screen.getAllByLabelText('Model ID')).toHaveLength(1),
  );
  expect(screen.getByLabelText('Model ID')).toHaveValue('duplicate');
});
