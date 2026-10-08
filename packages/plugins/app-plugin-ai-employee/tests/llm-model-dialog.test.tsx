// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import ModelsPage from '../client/pages/llm-services/models.js';
import locales from '../client/locales/index.js';
import { updateLLMServiceEnabledModels } from '../client/llm-service-service.js';
import LLMServicePage from '../client/pages/llm-service-page.js';

const service = {
  name: 'test-service',
  title: 'Test service',
  provider: 'openai',
  enabled: true,
  enabledModels: {
    mode: 'custom' as const,
    models: [{ value: 'model-1', label: 'Model one' }],
  },
};
vi.mock('@nocobase/app-client', () => ({
  apiClientToken: {},
  createApiClient: () => ({}),
  resolveAppUrl: (path: string) => path,
  useService: () => api,
  useApiClient: () => api,
}));
const api = {};
vi.mock('../client/llm-service-service.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  listLLMServices: async () => [service],
  listLLMProviders: async () => [],
  listProviderModels: async () =>
    Array.from({ length: 30 }, (_, index) => ({
      value: `provider-${index}`,
      label: `Provider model ${index}`,
    })),
  updateLLMServiceEnabledModels: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(updateLLMServiceEnabledModels).mockReset();
});

async function openEditor() {
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
    { initialEntries: ['/settings/ai/llm-services'] },
  );
  const result = render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  const trigger = await screen.findByRole('button', {
    name: 'Edit models for test-service',
  });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Edit models' });
  return { ...result, dialog, trigger };
}

it('uses the shared portal, accessible title and buttons, and restores focus after Escape', async () => {
  const { container, dialog, trigger } = await openEditor();
  expect(container).not.toContainElement(dialog);
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(
    within(dialog).getByRole('button', { name: 'Cancel' }),
  ).toHaveAttribute('data-slot', 'button');
  expect(
    within(dialog).getByRole('button', { name: 'Submit' }),
  ).toHaveAttribute('data-slot', 'button');
  await waitFor(() =>
    expect(dialog).toContainElement(document.activeElement as HTMLElement),
  );
  fireEvent.keyDown(document.activeElement ?? dialog, { key: 'Escape' });
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(updateLLMServiceEnabledModels).not.toHaveBeenCalled();
});

it('dismisses on backdrop interaction without saving', async () => {
  await openEditor();
  const overlay = document.querySelector('[data-slot="dialog-overlay"]');
  expect(overlay).toBeInTheDocument();
  fireEvent.mouseDown(overlay!, { button: 0 });
  fireEvent.mouseUp(overlay!, { button: 0 });
  fireEvent.click(overlay!);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(updateLLMServiceEnabledModels).not.toHaveBeenCalled();
});

it.each(['Cancel', 'Close'])(
  'confirms before dismissing with %s and discarding unsaved changes',
  async (name) => {
    const { trigger } = await openEditor();
    fireEvent.change(screen.getByLabelText('Model ID'), {
      target: { value: 'unsaved' },
    });
    fireEvent.click(screen.getByRole('button', { name, exact: true }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Discard changes' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(updateLLMServiceEnabledModels).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    expect(await screen.findByLabelText('Model ID')).toHaveValue('model-1');
  },
);

it('keeps selected chips inside the searchable input and portals the options outside the editor', async () => {
  const { dialog } = await openEditor();
  fireEvent.click(screen.getByRole('radio', { name: 'Select models' }));
  const input = screen.getByRole('combobox', {
    name: 'Search provider models',
  });
  // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
  await userEvent.click(screen.getByRole('button', { name: 'Select models' }));
  const lastModel = await screen.findByRole('option', {
    name: 'Provider model 29',
  });
  expect(dialog).not.toContainElement(lastModel);
  fireEvent.click(lastModel);
  const remove = within(dialog).getByRole('button', {
    name: 'Remove Provider model 29',
  });
  expect(input.parentElement).toContainElement(remove);
  expect(input).toHaveValue('');
  fireEvent.change(input, { target: { value: 'MODEL 12' } });
  expect(
    await screen.findByRole('option', { name: 'Provider model 12' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('option', { name: 'Provider model 29' }),
  ).not.toBeInTheDocument();
  expect(remove).toBeInTheDocument();
  fireEvent.click(screen.getByRole('option', { name: 'Provider model 12' }));
  expect(
    within(dialog).getByRole('button', { name: 'Remove Provider model 12' }),
  ).toBeInTheDocument();
  fireEvent.keyDown(input, { key: 'Escape' });
  await waitFor(() =>
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
  );
  expect(dialog).toBeInTheDocument();
  expect(input).toBeInTheDocument();
  fireEvent.click(remove);
  expect(
    within(dialog).queryByRole('button', { name: 'Remove Provider model 29' }),
  ).not.toBeInTheDocument();
});

it('supports selecting a filtered model with the keyboard', async () => {
  const { dialog } = await openEditor();
  fireEvent.click(screen.getByRole('radio', { name: 'Select models' }));
  const input = screen.getByRole('combobox', {
    name: 'Search provider models',
  });
  await userEvent.click(screen.getByRole('button', { name: 'Select models' }));
  fireEvent.change(input, { target: { value: 'provider-29' } });
  await screen.findByRole('option', { name: 'Provider model 29' });
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(
    within(dialog).getByRole('button', { name: 'Remove Provider model 29' }),
  ).toBeInTheDocument();
});

it('filters by model ID, shows no matches, and restores options when search is cleared', async () => {
  await openEditor();
  fireEvent.click(screen.getByRole('radio', { name: 'Select models' }));
  const input = screen.getByRole('combobox', {
    name: 'Search provider models',
  });
  await userEvent.click(screen.getByRole('button', { name: 'Select models' }));
  fireEvent.change(input, { target: { value: 'provider-29' } });
  expect(
    await screen.findByRole('option', { name: 'Provider model 29' }),
  ).toBeVisible();
  expect(
    screen.queryByRole('option', { name: 'Provider model 12' }),
  ).not.toBeInTheDocument();
  fireEvent.change(input, { target: { value: 'not-a-model' } });
  expect(await screen.findByText('No models')).toBeVisible();
  expect(screen.queryAllByRole('option')).toHaveLength(0);
  fireEvent.change(input, { target: { value: '' } });
  await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(30));
});

it('keeps edits visible on save failure and closes after a successful retry', async () => {
  vi.mocked(updateLLMServiceEnabledModels).mockRejectedValueOnce(
    new Error('Save failed'),
  );
  await openEditor();
  fireEvent.change(screen.getByLabelText('Model ID'), {
    target: { value: 'model-2' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
  expect(screen.getByLabelText('Model ID')).toHaveValue('model-2');
  const enabledModels = {
    mode: 'custom' as const,
    models: [{ value: 'model-2', label: 'Model one' }],
  };
  vi.mocked(updateLLMServiceEnabledModels).mockResolvedValueOnce({
    ...service,
    enabledModels,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(updateLLMServiceEnabledModels).toHaveBeenLastCalledWith(
    api,
    service.name,
    enabledModels,
  );
});
