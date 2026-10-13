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
import { intakeMessage } from '../../server/agents/conversation/intake.js';
import type { OrganizeRequest } from '../../shared/intake.js';
import { pickerAgent } from '../fixtures/picker-agents';

const mocks = vi.hoisted(() => ({
  api: { request: vi.fn() },
  plans: { intakeTexts: vi.fn() },
  panel: { available: true, openChat: vi.fn() },
  agents: [] as unknown[],
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
  useChatAgents: () => ({ data: mocks.agents }),
  useAgentText: () => ({ name: (agent: { name: string }) => agent.name }),
  AgentAvatar: () => null,
}));

const started = () => ({
  data: {
    run: { id: 'r1', outcome: 'created' },
    conversation: {
      id: 'c1',
      availability: { online: true, reason: null, onlineRunners: 1 },
      run: { id: 'r1', status: 'queued' },
    },
  },
});

async function show(
  locale = 'en-US',
  fileIds: string[] = [],
  text = 'Keep these requirements',
) {
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
                  text={text}
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
  mocks.agents = [];
  mocks.panel.available = true;
  mocks.api.request.mockResolvedValue(started());
});

describe('intake handoff', () => {
  it('passes every selected attachment body into the AI message, excluding a removed file', async () => {
    const documents = [
      {
        fileId: 'f1',
        filename: 'notes.txt',
        text: 'PM307-CHECK-7319: Filter tasks by owner.',
      },
      {
        fileId: 'f3',
        filename: 'details.md',
        text: 'PM307-CHECK-8420: Preserve the filter after reload.',
      },
    ];
    mocks.plans.intakeTexts.mockResolvedValue({
      documents,
      files: documents.map((file) => ({
        ...file,
        state: 'read',
        chars: file.text.length,
      })),
    });
    await show('en-US', ['f1', 'f3']);
    fireEvent.click(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    );
    await waitFor(() => expect(mocks.api.request).toHaveBeenCalledOnce());
    expect(mocks.plans.intakeTexts).toHaveBeenCalledWith(['f1', 'f3']);
    const request = mocks.api.request.mock.calls[0]![0].json as OrganizeRequest;
    expect(request.files).toEqual(
      documents.map((file) => ({ name: file.filename, text: file.text })),
    );
    const message = intakeMessage(request);
    for (const document of documents) expect(message).toContain(document.text);
    expect(message).not.toContain('removed.txt');
  });

  it.each([
    'failed',
    'truncated',
    'skipped',
    'empty',
    'image',
    'unsupported',
    'legacy',
  ])(
    'does not silently send an extraction result with state %s',
    async (state) => {
      mocks.plans.intakeTexts.mockResolvedValue({
        documents:
          state === 'truncated'
            ? [{ fileId: 'f1', filename: 'notes.txt', text: 'partial' }]
            : [],
        files: [
          {
            fileId: 'f1',
            filename: 'notes.txt',
            state,
            chars: state === 'truncated' ? 7 : 0,
          },
        ],
      });
      await show('en-US', ['f1']);
      fireEvent.click(
        screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
      );
      expect(await screen.findByRole('alert')).toHaveTextContent('notes.txt');
      expect(mocks.api.request).not.toHaveBeenCalled();
      expect(mocks.panel.openChat).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: enUS.pmChat.intake.retry }),
      ).toBeEnabled();
    },
  );

  it.each(['en-US', 'zh-CN'])(
    'explains a failed file in %s and retries extraction with the input intact',
    async (locale) => {
      const copy = locale === 'en-US' ? enUS.pmChat.intake : zhCN.pmChat.intake;
      mocks.plans.intakeTexts
        .mockResolvedValueOnce({
          documents: [],
          files: [
            { fileId: 'f1', filename: 'notes.txt', state: 'failed', chars: 0 },
          ],
        })
        .mockResolvedValueOnce({
          documents: [
            {
              fileId: 'f1',
              filename: 'notes.txt',
              text: 'PM307-RETRY: Owner filter',
            },
          ],
          files: [
            { fileId: 'f1', filename: 'notes.txt', state: 'read', chars: 25 },
          ],
        });
      await show(locale, ['f1']);
      fireEvent.click(screen.getByRole('button', { name: copy.organize }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        copy.filesUnreadable.replace('{{files}}', '"notes.txt"'),
      );
      fireEvent.click(screen.getByRole('button', { name: copy.retry }));
      await waitFor(() => expect(mocks.api.request).toHaveBeenCalledOnce());
      expect(mocks.plans.intakeTexts).toHaveBeenCalledTimes(2);
      expect(mocks.api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({
            text: 'Keep these requirements',
            files: [{ name: 'notes.txt', text: 'PM307-RETRY: Owner filter' }],
          }),
        }),
      );
    },
  );

  it('refuses a missing extraction outcome even when another file was read', async () => {
    mocks.plans.intakeTexts.mockResolvedValue({
      documents: [{ fileId: 'f1', filename: 'notes.txt', text: 'body' }],
      files: [{ fileId: 'f1', filename: 'notes.txt', state: 'read', chars: 4 }],
    });
    await show('en-US', ['f1', 'f2']);
    fireEvent.click(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('f2');
    expect(mocks.api.request).not.toHaveBeenCalled();
  });

  it('hands off a file-only requirement with its complete body', async () => {
    mocks.plans.intakeTexts.mockResolvedValue({
      documents: [
        {
          fileId: 'f1',
          filename: 'notes.txt',
          text: 'PM307-FILE-ONLY: Owner filter',
        },
      ],
      files: [
        { fileId: 'f1', filename: 'notes.txt', state: 'read', chars: 26 },
      ],
    });
    await show('en-US', ['f1'], '');
    fireEvent.click(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    );
    await waitFor(() => expect(mocks.api.request).toHaveBeenCalledOnce());
    expect(mocks.api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          text: enUS.pmChat.intake.filesOnly,
          files: [{ name: 'notes.txt', text: 'PM307-FILE-ONLY: Owner filter' }],
        }),
      }),
    );
  });

  it('rejects oversized combined file bodies instead of dropping later content', async () => {
    const documents = [1, 2, 3].map((n) => ({
      fileId: `f${n}`,
      filename: `notes-${n}.txt`,
      text: `${'x'.repeat(19_980)}PM307-END-${n}`,
    }));
    mocks.plans.intakeTexts.mockResolvedValue({
      documents,
      files: documents.map((file) => ({
        ...file,
        state: 'read',
        chars: file.text.length,
      })),
    });
    await show('en-US', ['f1', 'f2', 'f3']);
    fireEvent.click(
      screen.getByRole('button', { name: enUS.pmChat.intake.organize }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      enUS.pmChat.intake.tooLong,
    );
    expect(mocks.api.request).not.toHaveBeenCalled();
  });

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

  it.each(['agentArchived', 'noRunner'] as const)(
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
          : enUS.pmChat.intake.agentUnavailable,
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

  it('asks the agent chosen under “Organized by”, the team default first, and says why one cannot answer', async () => {
    mocks.agents = [
      pickerAgent('sonnet', 'Claude · Sonnet 5'),
      pickerAgent('opus', 'Claude · Opus 5.5', {
        isSystemDefault: true,
        description: 'Designs and hard bugs',
      }),
      pickerAgent('kimi', 'OpenCode · Kimi K2', {
        availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
      }),
    ];
    await show('zh-CN');
    const picker = screen.getByTestId('intake-agent-picker');
    expect(picker).toHaveTextContent('Claude · Opus 5.5');
    fireEvent.click(picker);
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((item) => item.getAttribute('data-agent'))).toEqual([
      'opus',
      'sonnet',
      'kimi',
    ]);
    expect(items[0]).toHaveTextContent('Designs and hard bugs');
    expect(items[2]).toHaveAttribute('aria-disabled', 'true');
    expect(items[2]).toHaveTextContent('暂无执行机，选不了');
    fireEvent.click(items[1]!);
    fireEvent.click(
      screen.getByRole('button', { name: zhCN.pmChat.intake.organize }),
    );
    await waitFor(() =>
      expect(mocks.api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          json: expect.objectContaining({ agentId: 'sonnet' }),
        }),
      ),
    );
  });
});
