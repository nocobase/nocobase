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
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { Organize } from '../../client/agents/intake-agent.js';

const mocks = vi.hoisted(() => ({
  api: { request: vi.fn() },
  plans: { intakeTexts: vi.fn() },
  panel: { available: true, openChat: vi.fn() },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => mocks.api,
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  usePlanApi: () => mocks.plans,
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  useChatPanel: () => mocks.panel,
}));

const started = () => ({
  data: {
    run: { id: 'r1', outcome: 'created' },
    conversation: {
      id: 'c1',
      models: [{ model: 'test' }],
      availability: { online: true, reason: null, onlineRunners: 1 },
      run: { id: 'r1', status: 'queued' },
    },
  },
});

async function show(locale = 'en-US', fileIds: string[] = []) {
  const runtime = await createTestI18nRuntime({
    application: {
      namespace: 'studio',
      resources: locale === 'en-US' ? enUS : zhCN,
    },
    locale,
  });
  return render(
    <TestI18nProvider runtime={runtime} namespace='studio'>
      <MemoryRouter initialEntries={['/issues/new?view=list']}>
        <Routes>
          <Route
            path='/issues'
            element={
              <>
                <span>Issues list</span>
                <Outlet />
              </>
            }
          >
            <Route
              path='new'
              element={
                <Organize
                  text='Keep these requirements'
                  fileIds={fileIds}
                  disabled={false}
                  onPlan={vi.fn()}
                />
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.panel.available = true;
  mocks.api.request.mockResolvedValue(started());
});

describe('intake handoff', () => {
  it.each(['en-US', 'zh-CN'])(
    'keeps a failed submission and offers retry in %s',
    async (locale) => {
      mocks.api.request.mockRejectedValueOnce(
        new ApiClientError('Raw SQL exception', {
          status: 500,
          method: 'POST',
          url: '/organizeIntake',
        }),
      );
      const copy = locale === 'en-US' ? enUS.pmChat.intake : zhCN.pmChat.intake;
      await show(locale);
      fireEvent.click(screen.getByRole('button', { name: copy.organize }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        copy.requestFailed,
      );
      expect(screen.queryByText('Raw SQL exception')).toBeNull();
      expect(mocks.panel.openChat).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: copy.retry }));
      await waitFor(() => expect(mocks.panel.openChat).toHaveBeenCalledOnce());
      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: copy.organize }),
        ).toBeNull(),
      );
      expect(mocks.api.request).toHaveBeenLastCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({ text: 'Keep these requirements' }),
        }),
      );
    },
  );

  it('keeps file extraction failures and permits retry without sending a conversation', async () => {
    mocks.plans.intakeTexts.mockRejectedValueOnce(
      new TypeError('Failed to fetch'),
    );
    await show('en-US', ['file1']);
    fireEvent.click(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.pmChat.intake.requestFailed,
    );
    expect(mocks.api.request).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: enUS.pmChat.intake.retry }),
    ).toBeEnabled();
  });

  it('ignores a late success after the dialog is unmounted and aborts its request', async () => {
    let resolve!: (value: ReturnType<typeof started>) => void;
    mocks.api.request.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const view = await show();
    fireEvent.click(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    );
    await waitFor(() => expect(mocks.api.request).toHaveBeenCalledOnce());
    const signal = (
      mocks.api.request.mock.calls[0]![0] as { signal: AbortSignal }
    ).signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => {
      resolve(started());
    });
    expect(mocks.panel.openChat).not.toHaveBeenCalled();
  });

  it('allows only one pending submission', async () => {
    mocks.api.request.mockReturnValueOnce(new Promise(() => {}));
    await show();
    const button = screen.getByRole('button', {
      name: enUS.pmChat.intake.organize,
    });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(mocks.api.request).toHaveBeenCalledOnce();
  });

  it.each(['modelUnavailable', 'noRunner'] as const)(
    'keeps an unavailable successful response (%s) out of the panel',
    async (reason) => {
      mocks.api.request.mockResolvedValueOnce({
        data: {
          ...started().data,
          conversation: {
            ...started().data.conversation,
            availability: { online: false, reason, onlineRunners: 0 },
          },
        },
      });
      await show();
      fireEvent.click(
        screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(
        reason === 'noRunner'
          ? enUS.pmChat.intake.noRunner
          : enUS.pmChat.intake.modelUnavailable,
      );
      expect(mocks.panel.openChat).not.toHaveBeenCalled();
    },
  );

  it('keeps an accepted message with no run in the dialog', async () => {
    mocks.api.request.mockResolvedValueOnce({
      data: { ...started().data, run: null },
    });
    await show();
    fireEvent.click(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.pmChat.intake.runNotStarted,
    );
    expect(mocks.panel.openChat).not.toHaveBeenCalled();
  });

  it.each(['failed', 'cancelled'])(
    'keeps a run that already %s out of the panel',
    async (status) => {
      mocks.api.request.mockResolvedValueOnce({
        data: {
          ...started().data,
          conversation: {
            ...started().data.conversation,
            run: { id: 'r1', status },
          },
        },
      });
      await show();
      fireEvent.click(
        screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent(
        enUS.pmChat.intake.runNotStarted,
      );
      expect(mocks.panel.openChat).not.toHaveBeenCalled();
    },
  );

  it('explains disabled chat instead of hiding the action', async () => {
    mocks.panel.available = false;
    await show();
    expect(screen.getByRole('alert')).toHaveTextContent(
      enUS.pmChat.intake.chatUnavailable,
    );
    expect(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    ).toBeDisabled();
  });
});
