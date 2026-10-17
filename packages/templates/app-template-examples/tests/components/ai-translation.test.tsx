import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AiTranslationPage from '../../client/pages/ai-translation/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { TRANSLATION_MAX_LENGTH } from '../../shared/ai-translation.js';

const host = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  refresh: vi.fn(),
  userId: 'alice',
  canRead: true,
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => host.api,
  useToaster: () => host.toaster,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: { user: { id: host.userId } },
    isPending: false,
    refresh: host.refresh,
  }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: host.canRead, isPending: false }),
}));

const models = {
  data: [
    {
      name: 'local',
      title: 'Local',
      provider: 'openai-compatible',
      models: [
        { value: 'first', label: 'First', kind: 'chat', dimensions: null },
        { value: 'second', label: 'Second', kind: 'chat', dimensions: null },
      ],
    },
  ],
};
const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/app-template-examples',
    resources: {
      'en-US': () => Promise.resolve({ default: enUS }),
      'zh-CN': () => Promise.resolve({ default: zhCN }),
    },
  },
});
function tree() {
  return (
    <StrictMode>
      <TestI18nProvider runtime={runtime}>
        <MemoryRouter>
          <AiTranslationPage />
        </MemoryRouter>
      </TestI18nProvider>
    </StrictMode>
  );
}
async function mount(locale = 'en-US') {
  await runtime.changeLanguage(locale);
  return render(tree());
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const submissions = () =>
  host.api.request.mock.calls.filter(([input]) => input.method === 'POST');
const ready = () =>
  waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Translate', exact: true }),
    ).toBeEnabled(),
  );
function apiError(status: number, reason?: string) {
  return new ApiClientError('PRIVATE PROVIDER DETAIL', {
    status,
    reason,
    method: 'POST',
    url: '/api/aiTranslation',
  });
}
beforeEach(() => {
  host.userId = 'alice';
  host.canRead = true;
  host.refresh.mockReset();
  host.toaster.show.mockReset();
  host.api.request
    .mockReset()
    .mockImplementation(async ({ method }) =>
      method === 'POST' ? { data: { translation: 'Hello, world!' } } : models,
    );
});

describe('AI Translation demo', () => {
  it('selects model and languages, submits once while loading and shows a plain read-only result', async () => {
    const result = deferred<{ data: { translation: string } }>();
    host.api.request.mockImplementation(async ({ method }) =>
      method === 'POST' ? result.promise : models,
    );
    await mount();
    await ready();
    expect(host.api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'agents/models',
        query: { kind: 'chat' },
      }),
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: /Language model/ }));
    await user.click(screen.getByRole('option', { name: 'Local / Second' }));
    fireEvent.keyDown(
      screen.getByRole('combobox', { name: 'Target language' }),
      { key: 'ArrowDown' },
    );
    await user.click(
      screen.getByRole('option', { name: 'French', exact: true }),
    );
    fireEvent.keyDown(
      screen.getByRole('combobox', { name: 'Source language' }),
      { key: 'ArrowDown' },
    );
    await user.click(
      screen.getByRole('option', { name: 'Simplified Chinese', exact: true }),
    );
    const original = screen.getByRole('textbox', { name: /Original/ });
    fireEvent.change(original, {
      target: { value: '你好，世界！\n保留换行。' },
    });
    const button = screen.getByRole('button', {
      name: 'Translate',
      exact: true,
    });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(submissions()).toHaveLength(1);
    expect(submissions()[0][0]).toMatchObject({
      path: 'aiTranslation',
      method: 'POST',
      json: {
        text: '你好，世界！\n保留换行。',
        sourceLanguage: 'zh-CN',
        targetLanguage: 'fr',
        model: { modelService: 'local', model: 'second' },
      },
    });
    expect(screen.getByRole('button', { name: /Translating/ })).toBeDisabled();
    expect(original).toHaveAttribute('readonly');
    for (const select of screen.getAllByRole('combobox'))
      expect(select).toBeDisabled();
    await act(async () =>
      result.resolve({ data: { translation: '<b>Bonjour</b>\nLe monde !' } }),
    );
    const output = screen.getByRole('textbox', {
      name: 'Translation',
      exact: true,
    });
    expect(output).toHaveValue('<b>Bonjour</b>\nLe monde !');
    expect(output).toHaveAttribute('readonly');
    expect(host.toaster.show).toHaveBeenCalledWith({
      id: 'ai-translation',
      type: 'success',
      title: 'Translation complete',
    });
    expect(original).not.toHaveAttribute('readonly');
    fireEvent.change(original, { target: { value: '新的原文' } });
    expect(output).toHaveValue('');
  });

  it('validates only on submit and focuses the original without a model call', async () => {
    await mount();
    await ready();
    const original = screen.getByRole('textbox', { name: /Original/ });
    fireEvent.change(original, { target: { value: '   ' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Translate', exact: true }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter text to translate',
    );
    expect(original).toHaveFocus();
    fireEvent.change(original, {
      target: { value: 'a'.repeat(TRANSLATION_MAX_LENGTH + 1) },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Use up to 10,000 characters',
    );
    expect(submissions()).toHaveLength(0);
    fireEvent.change(original, {
      target: { value: 'a'.repeat(TRANSLATION_MAX_LENGTH) },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Translate', exact: true }),
    );
    await waitFor(() =>
      expect(host.toaster.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      ),
    );
    expect(submissions()[0][0].json).toMatchObject({
      sourceLanguage: 'auto',
      targetLanguage: 'en',
    });
  });

  it('shows catalog loading independently of draft input', async () => {
    const catalog = deferred<typeof models>();
    host.api.request.mockReturnValue(catalog.promise);
    await mount();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Translate' })).toBeDisabled();
    await userEvent.type(
      screen.getByRole('textbox', { name: /Original/ }),
      'draft',
    );
    await act(async () => catalog.resolve(models));
    await ready();
    expect(screen.getByRole('textbox', { name: /Original/ })).toHaveValue(
      'draft',
    );
  });

  it.each([true, false])(
    'shows a permission-aware model prerequisite, manage access=%s',
    async (canRead) => {
      host.canRead = canRead;
      host.api.request.mockResolvedValue({ data: [] });
      await mount();
      expect(
        await screen.findByText(enUS.aiTranslation.noModels),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Translate' })).toBeDisabled();
      expect(
        Boolean(screen.queryByRole('button', { name: 'Open models' })),
      ).toBe(canRead);
      if (!canRead)
        expect(
          screen.getByText(enUS.onlineAgent.noModels.readOnly),
        ).toBeVisible();
    },
  );

  it('does not offer Retry for a missing catalog endpoint', async () => {
    host.api.request.mockRejectedValue(apiError(404));
    await mount();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.aiTranslation.unavailable,
    );
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
  });
  it('distinguishes a failed catalog from no models and offers explicit retry', async () => {
    host.api.request.mockRejectedValue(new Error('network failure'));
    await mount();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.aiTranslation.catalogFailed,
    );
    expect(
      screen.queryByText(enUS.aiTranslation.noModels),
    ).not.toBeInTheDocument();
    host.api.request.mockResolvedValue(models);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await ready();
  });

  it.each([401, 403])(
    'does not retry catalog access errors (%s)',
    async (status) => {
      host.api.request.mockRejectedValue(apiError(status));
      await mount();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        status === 401
          ? enUS.aiTranslation.sessionExpired
          : enUS.aiTranslation.forbidden,
      );
      expect(
        screen.queryByRole('button', { name: 'Retry' }),
      ).not.toBeInTheDocument();
      if (status === 401) {
        await userEvent.click(
          screen.getByRole('button', { name: 'Sign in again' }),
        );
        expect(host.refresh).toHaveBeenCalledOnce();
      }
    },
  );

  it.each([
    [apiError(500), 'failed'],
    [apiError(504, 'TRANSLATION_TIMEOUT'), 'timeout'],
    [apiError(503, 'REQUEST_TIMEOUT'), 'unknownOutcome'],
    [new Error('PRIVATE PROVIDER DETAIL'), 'unknownOutcome'],
    [apiError(401), 'sessionExpired'],
    [apiError(403), 'forbidden'],
  ] as const)(
    'keeps the source, handles failure safely, and never resends (%s)',
    async (error, copy) => {
      host.api.request.mockImplementation(async ({ method }) => {
        if (method === 'POST') throw error;
        return models;
      });
      await mount();
      await ready();
      fireEvent.change(screen.getByRole('textbox', { name: /Original/ }), {
        target: { value: '原文' },
      });
      await userEvent.click(
        screen.getByRole('button', { name: 'Translate', exact: true }),
      );
      await waitFor(() =>
        expect(host.toaster.show).toHaveBeenCalledWith({
          id: 'ai-translation',
          type: 'error',
          title: enUS.aiTranslation[copy],
        }),
      );
      expect(screen.getByRole('textbox', { name: /Original/ })).toHaveValue(
        '原文',
      );
      expect(
        screen.getByRole('textbox', { name: 'Translation', exact: true }),
      ).toHaveValue('');
      expect(
        screen.queryByText('PRIVATE PROVIDER DETAIL'),
      ).not.toBeInTheDocument();
      expect(submissions()).toHaveLength(1);
    },
  );

  it.each(['resolve', 'reject'] as const)(
    'ignores a late %s after changing accounts and aborts observation',
    async (settle) => {
      const old = deferred<{ data: { translation: string } }>();
      host.api.request.mockImplementation(async ({ method }) =>
        method === 'POST' ? old.promise : models,
      );
      const view = await mount();
      await ready();
      fireEvent.change(screen.getByRole('textbox', { name: /Original/ }), {
        target: { value: 'Alice draft' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Translate' }));
      const signal = submissions()[0][0].signal as AbortSignal;
      host.userId = 'bob';
      view.rerender(tree());
      await ready();
      expect(signal.aborted).toBe(true);
      expect(screen.getByRole('textbox', { name: /Original/ })).toHaveValue('');
      await act(async () => {
        if (settle === 'resolve')
          old.resolve({ data: { translation: 'Private Alice result' } });
        else old.reject(apiError(500));
      });
      expect(
        screen.getByRole('textbox', { name: 'Translation', exact: true }),
      ).toHaveValue('');
      expect(host.toaster.show).not.toHaveBeenCalled();
    },
  );

  it('renders and translates in Chinese with the real locale resources', async () => {
    await mount('zh-CN');
    expect(
      await screen.findByRole('heading', { name: 'AI 翻译' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '翻译', exact: true }),
      ).toBeEnabled(),
    );
    expect(
      screen.getByRole('combobox', { name: '原文语言' }),
    ).toHaveTextContent('自动检测');
    expect(
      screen.getByRole('combobox', { name: '目标语言' }),
    ).toHaveTextContent('英语');
    fireEvent.change(screen.getByRole('textbox', { name: /原文/ }), {
      target: { value: '你好' },
    });
    fireEvent.click(screen.getByRole('button', { name: '翻译', exact: true }));
    await waitFor(() =>
      expect(host.toaster.show).toHaveBeenCalledWith({
        id: 'ai-translation',
        type: 'success',
        title: '翻译完成',
      }),
    );
  });
});
