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
import { beforeEach, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import locales from '../client/locales/index.js';
import { listLLMServices } from '../client/llm-service-service.js';
import LLMServicePage from '../client/pages/llm-service-page.js';

const api = {};
vi.mock('@nocobase/app-client', () => ({
  apiClientToken: {},
  createApiClient: () => ({}),
  resolveAppUrl: (path: string) => path,
  useService: () => api,
  useApiClient: () => api,
}));
vi.mock('../client/llm-service-service.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  listLLMServices: vi.fn(),
  listLLMProviders: async () => [],
}));

beforeEach(() => {
  vi.mocked(listLLMServices).mockReset();
});

async function renderPage() {
  const runtime = new I18nRuntime({
    applicationNamespace: 'app',
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
  });
  runtime.registerApplicationNamespace('app', {
    'en-US': async () => ({ default: {} }),
  });
  runtime.registerNamespace('@nocobase/app-plugin-ai-employee', locales);
  await runtime.init('en-US');
  const router = createMemoryRouter(
    [{ path: '/settings/ai/llm-services', element: <LLMServicePage /> }],
    { initialEntries: ['/settings/ai/llm-services'] },
  );
  render(
    <I18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  return runtime;
}

it('shows a delayed loading status, never a table, before the empty state that guides configuration', async () => {
  let resolve!: (value: []) => void;
  vi.mocked(listLLMServices).mockReturnValue(
    new Promise<[]>((done) => {
      resolve = done;
    }),
  );
  const runtime = await renderPage();
  // Loading renders no table the empty state would then replace, and stays silent while the response is quick.
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(emptyHeading()).not.toBeInTheDocument();
  await act(async () => resolve([]));
  expect(emptyHeading()).toBeVisible();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
  const steps = within(screen.getByRole('list')).getAllByRole('listitem');
  expect(steps).toHaveLength(3);
  expect(steps[0]).toHaveTextContent('the one that contains config.yml');
  expect(steps[1]).toHaveTextContent('Send it the prompt.');
  // The prompt sits beside the steps rather than inside one of them.
  expect(within(steps[1]).queryByLabelText('Prompt')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Prompt')).toHaveTextContent(
    'nocobase-app-plugin-ai-employee Skill',
  );
  expect(steps[2]).toHaveTextContent('Set the API key yourself');
  await act(() => runtime.changeLanguage('zh-CN'));
  expect(
    screen.getByRole('heading', { name: '还没有配置 LLM 服务' }),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '复制提示词' })).toBeVisible();
});

function emptyHeading(): HTMLElement | null {
  return screen.queryByRole('heading', {
    name: 'No LLM services configured yet',
  });
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

it('copies the prompt shown in the current language and confirms it briefly', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const writeText = vi.fn(async (_text: string) => {});
  stubClipboard(writeText);
  vi.mocked(listLLMServices).mockResolvedValue([]);
  try {
    const runtime = await renderPage();
    const button = await screen.findByRole('button', { name: 'Copy prompt' });
    const prompt = screen.getByLabelText('Prompt');
    await act(async () => fireEvent.click(button));
    expect(writeText).toHaveBeenCalledWith(prompt.textContent);
    expect(prompt.textContent).toMatch(/^Configure an LLM service/);
    expect(button).toHaveTextContent('Copied');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    await act(async () => vi.advanceTimersByTime(2000));
    expect(button).toHaveTextContent('Copy prompt');
    await act(() => runtime.changeLanguage('zh-CN'));
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: '复制提示词' })),
    );
    expect(writeText).toHaveBeenLastCalledWith(
      screen.getByLabelText('提示词').textContent,
    );
    expect(writeText.mock.lastCall?.[0]).toMatch(/^请为这个 NocoBase 应用/);
  } finally {
    vi.useRealTimers();
  }
});

it('selects the prompt for manual copying when the clipboard is unavailable', async () => {
  stubClipboard(async () => {
    throw new Error('Clipboard denied');
  });
  vi.mocked(listLLMServices).mockResolvedValue([]);
  await renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Copy prompt' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'The prompt is selected. Press Ctrl+C',
  );
  expect(window.getSelection()?.toString()).toBe(
    screen.getByLabelText('Prompt').textContent,
  );
  expect(
    screen.getByRole('button', { name: 'Copy prompt' }),
  ).toBeInTheDocument();
});

it('does not treat a failed request as an empty configuration', async () => {
  vi.mocked(listLLMServices).mockRejectedValue(new Error('Request failed'));
  await renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent('Request failed');
  await waitFor(() =>
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument(),
  );
  expect(emptyHeading()).not.toBeInTheDocument();
});

it('renders configured services without an empty state', async () => {
  vi.mocked(listLLMServices).mockResolvedValue([
    {
      name: 'test-service',
      title: 'Test service',
      provider: 'openai',
      enabled: true,
      enabledModels: { mode: 'provider', models: [] },
    },
  ]);
  await renderPage();
  expect(await screen.findByText('Test service')).toBeVisible();
  expect(emptyHeading()).not.toBeInTheDocument();
});
