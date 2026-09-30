// @vitest-environment jsdom
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import locales from '../client/locales/index.js';
import LLMServicePage from '../client/pages/llm-service-page.js';
import ModelsPage from '../client/pages/llm-services/models.js';
import type { LLMService } from '../client/llm-service-service.js';

const ai = vi.hoisted(() => ({
  listLLMServices: vi.fn(),
  listLLMProviders: vi.fn(),
  listProviderModels: vi.fn(),
  updateLLMServiceEnabled: vi.fn(),
  updateLLMServiceEnabledModels: vi.fn(),
}));
vi.mock('../client/ai-employee-client.js', () => ({
  useAIEmployeeClient: () => ai,
}));
const parent = '/settings/ai/llm-services';
const child = `${parent}/service-one/models`;
const service: LLMService = {
  name: 'service-one',
  title: 'First service',
  provider: 'openai',
  enabled: true,
  enabledModels: {
    mode: 'custom',
    models: [{ value: 'model-one', label: 'First model' }],
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  ai.listLLMServices.mockResolvedValue([structuredClone(service)]);
  ai.listLLMProviders.mockResolvedValue([]);
  ai.listProviderModels.mockResolvedValue([]);
  ai.updateLLMServiceEnabledModels.mockResolvedValue(service);
});

// The host renders a BrowserRouter, so these tests traverse the real window history rather than a data router.
function seedHistory(entries: string[]): void {
  window.history.replaceState(
    { usr: null, key: 'entry-0', idx: 0 },
    '',
    entries[0],
  );
  entries.slice(1).forEach((entry, index) => {
    window.history.pushState(
      { usr: null, key: `entry-${index + 1}`, idx: index + 1 },
      '',
      entry,
    );
  });
}

// BrowserRouter commits location changes in a transition, so the URL can move before the dialog unmounts.
async function waitForParent(): Promise<void> {
  await waitFor(() => {
    expect(window.location.pathname).toBe(parent);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
}

async function traverse(delta: number): Promise<void> {
  await act(async () => {
    window.history.go(delta);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

async function renderRoutes(initialEntries: string[] = [child], current = -1) {
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
  seedHistory(initialEntries);
  const back =
    initialEntries.length -
    1 -
    (current < 0 ? initialEntries.length - 1 : current);
  if (back) await traverse(-back);
  const result = render(
    <I18nProvider runtime={runtime}>
      <BrowserRouter>
        <Routes>
          <Route path={parent} element={<LLMServicePage />}>
            <Route path=':serviceName/models' element={<ModelsPage />} />
          </Route>
          <Route path='/elsewhere' element={<p>Other page</p>} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>,
  );
  return result;
}

it('waits for a direct child URL and keeps its parent mounted with query-preserving close', async () => {
  let resolve!: (value: LLMService[]) => void;
  ai.listLLMServices.mockReturnValue(
    new Promise<LLMService[]>((done) => {
      resolve = done;
    }),
  );
  const { container } = await renderRoutes([`${child}?filter=enabled`]);
  const dialog = await screen.findByRole('dialog', { name: 'Edit models' });
  expect(within(dialog).getByRole('status')).toHaveTextContent('Loading…');
  expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => resolve([service]));
  expect(await screen.findByLabelText('Model ID')).toHaveValue('model-one');
  expect(container).toHaveTextContent('First service');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitForParent();
  expect(window.location.search).toBe('?filter=enabled');
  expect(ai.listLLMServices).toHaveBeenCalledTimes(1);
});

it.each(['missing', 'failure'])(
  'distinguishes %s from loading on a direct URL',
  async (kind) => {
    if (kind === 'missing') ai.listLLMServices.mockResolvedValue([]);
    else ai.listLLMServices.mockRejectedValue(new Error('Service list failed'));
    await renderRoutes();
    const dialog = await screen.findByRole('dialog', { name: 'Edit models' });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      kind === 'missing' ? 'LLM service not found.' : 'Service list failed',
    );
    expect(within(dialog).queryByLabelText('Model ID')).not.toBeInTheDocument();
    expect(ai.listProviderModels).not.toHaveBeenCalled();
  },
);

it('compares against the saved baseline so reverting a draft closes without confirmation', async () => {
  await renderRoutes();
  const input = await screen.findByLabelText('Model ID');
  fireEvent.change(input, { target: { value: 'changed' } });
  fireEvent.change(input, { target: { value: 'model-one' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitForParent();
  expect(
    screen.queryByRole('button', { name: 'Discard changes' }),
  ).not.toBeInTheDocument();
});

it('protects dirty back navigation and uses exactly one confirmation before proceeding', async () => {
  await renderRoutes([parent, child]);
  fireEvent.change(await screen.findByLabelText('Model ID'), {
    target: { value: 'changed' },
  });
  await traverse(-1);
  expect(
    await screen.findByRole('button', { name: 'Discard changes' }),
  ).toBeVisible();
  // The editor stays mounted while the user decides, although the browser has already moved.
  expect(screen.getByLabelText('Model ID')).toHaveValue('changed');
  fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  await waitFor(() => expect(window.location.pathname).toBe(child));
  expect(
    screen.queryByRole('button', { name: 'Discard changes' }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Model ID')).toHaveValue('changed');
  await traverse(-1);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );
  await waitForParent();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await traverse(1);
  expect(await screen.findByLabelText('Model ID')).toHaveValue('model-one');
  expect(ai.listLLMServices).toHaveBeenCalledTimes(1);
});

it('protects dirty forward navigation until the discard is confirmed', async () => {
  await renderRoutes([child, parent], 0);
  fireEvent.change(await screen.findByLabelText('Model ID'), {
    target: { value: 'changed' },
  });
  await traverse(1);
  fireEvent.click(await screen.findByRole('button', { name: 'Keep editing' }));
  await waitFor(() => expect(window.location.pathname).toBe(child));
  expect(
    screen.queryByRole('button', { name: 'Discard changes' }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Model ID')).toHaveValue('changed');
  await traverse(1);
  fireEvent.click(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );
  await waitForParent();
});

it.each(['Escape', 'backdrop', 'Close', 'Cancel'])(
  'guards dirty %s dismissal using the same confirmation',
  async (method) => {
    await renderRoutes();
    const input = await screen.findByLabelText('Model ID');
    fireEvent.change(input, { target: { value: 'changed' } });
    if (method === 'Escape') fireEvent.keyDown(input, { key: 'Escape' });
    else if (method === 'backdrop') {
      const backdrop = document.querySelector('[data-slot=dialog-overlay]')!;
      fireEvent.mouseDown(backdrop, { button: 0 });
      fireEvent.mouseUp(backdrop, { button: 0 });
      fireEvent.click(backdrop);
    } else
      fireEvent.click(
        screen.getByRole('button', { name: method, exact: true }),
      );
    expect(
      await screen.findByRole('button', { name: 'Discard changes' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: 'Discard changes' }),
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    await waitForParent();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
);

it('protects browser unload only while changed and removes the listener on exit', async () => {
  await renderRoutes();
  const input = await screen.findByLabelText('Model ID');
  const clean = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);
  fireEvent.change(input, { target: { value: 'changed' } });
  const dirty = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(dirty);
  expect(dirty.defaultPrevented).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Discard changes' }),
  );
  await waitForParent();
  const exited = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(exited);
  expect(exited.defaultPrevented).toBe(false);
});

it('locks pending saves, rejects duplicate submits and blocks navigation until success', async () => {
  let resolve!: (value: LLMService) => void;
  ai.updateLLMServiceEnabledModels.mockReturnValue(
    new Promise<LLMService>((done) => {
      resolve = done;
    }),
  );
  await renderRoutes([parent, child]);
  const input = await screen.findByLabelText('Model ID');
  fireEvent.change(input, { target: { value: 'saved-model' } });
  const submit = screen.getByRole('button', { name: 'Submit' });
  fireEvent.click(submit);
  fireEvent.click(submit);
  expect(submit).toBeDisabled();
  expect(input).toBeDisabled();
  expect(ai.updateLLMServiceEnabledModels).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(input, { key: 'Escape' });
  await traverse(-1);
  await waitFor(() => expect(window.location.pathname).toBe(child));
  expect(
    screen.queryByRole('button', { name: 'Discard changes' }),
  ).not.toBeInTheDocument();
  expect(input).toHaveValue('saved-model');
  await act(async () =>
    resolve({
      ...service,
      enabledModels: {
        mode: 'custom',
        models: [{ value: 'saved-model', label: 'Saved label' }],
      },
    }),
  );
  await waitForParent();
  expect(await screen.findByText('Saved label')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit models for service-one' }),
  );
  expect(await screen.findByLabelText('Model ID')).toHaveValue('saved-model');
});
