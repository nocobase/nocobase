import {
  ChatProvider,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  OnlineAgentResendOptions,
  ResendResult,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { ChatPanel } from '../../registry/agents/agent-chat/chat-panel';
import enUS from '../../registry/agents/agent-chat/locales/en-US';
import { resetChatDemo } from '../../website/demo/agents/agents-chat-client';

const control = vi.hoisted(() => ({
  result: null as ResendResult | Promise<ResendResult> | null,
  noSource: false,
  archived: false,
  splitAssistant: false,
  hideUser: false,
  resend: vi.fn<(options: OnlineAgentResendOptions) => void>(),
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', async () => {
  const demo = await import('../../website/demo/agents/agents-chat-client');
  return {
    ...demo,
    useResendMessage: (id: string | null) => {
      const original = demo.useResendMessage(id);
      return {
        ...original,
        resend: async (
          options: OnlineAgentResendOptions & { messageId: string },
        ) => {
          control.resend(options);
          return control.result ?? original.resend(options);
        },
      };
    },
    useConversationMessages: (id: string | null) => {
      const original = demo.useConversationMessages(id);
      return {
        ...original,
        items: original.items
          .filter((message) => !control.hideUser || message.role !== 'user')
          .map((message) => ({
            ...message,
            ...(control.splitAssistant && message.role === 'assistant'
              ? {
                  parts: [
                    {
                      type: 'reasoning' as const,
                      text: 'Private reasoning',
                      state: 'done' as const,
                    },
                    { type: 'text' as const, text: 'First segment' },
                    { type: 'text' as const, text: 'Second segment' },
                  ],
                }
              : {}),
            metadata: message.metadata
              ? {
                  ...message.metadata,
                  ...(control.noSource
                    ? { sourceUserMessageId: undefined }
                    : {}),
                  ...(control.splitAssistant && message.role === 'assistant'
                    ? {
                        sourceRecords: [
                          {
                            recordId: 'segment-one',
                            seq: 2,
                            partId: 'reasoning',
                            partIndex: 0,
                          },
                          {
                            recordId: 'segment-one',
                            seq: 2,
                            partId: 'first',
                            partIndex: 1,
                          },
                          {
                            recordId: 'segment-two',
                            seq: 3,
                            partId: 'second',
                            partIndex: 2,
                          },
                        ],
                      }
                    : {}),
                }
              : undefined,
          })),
      };
    },
    useConversation: (id: string | null) => {
      const original = demo.useConversation(id);
      return control.archived && original.data
        ? {
            ...original,
            data: { ...original.data, archivedAt: '2026-01-01T00:00:00Z' },
          }
        : original;
    },
  };
});
afterEach(() => {
  control.result = null;
  control.noSource = false;
  control.archived = false;
  control.splitAssistant = false;
  control.hideUser = false;
  control.resend.mockClear();
  resetChatDemo();
});
const runtime = await createTestI18nRuntime({
  application: { namespace: 'resend-ui-test', resources: enUS },
});
function Open({ id }: { readonly id: string }) {
  const { openChat } = useChatPanel();
  useLayoutEffect(() => openChat({ conversationId: id }), [id, openChat]);
  return null;
}
function Panel({ id = 'release-plan' }: { readonly id?: string }) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider>
          <Open id={id} />
          <ChatPanel />
        </ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
function panel(id = 'release-plan') {
  return render(<Panel id={id} />);
}

function inlineEditor() {
  return within(
    screen
      .getByRole('textbox', { name: 'Edit', exact: true })
      .closest('[data-chat-message-editor]')!,
  );
}
it('edits inline, preserves context and bottom draft, and cancels editing without a write', async () => {
  panel();
  const draft = await screen.findByLabelText('Message to the agent');
  fireEvent.change(draft, { target: { value: 'Keep this unsent draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
  const editor = screen.getByRole('textbox', { name: 'Edit', exact: true });
  expect(editor).toHaveClass('bg-background', 'min-h-20', 'resize-none');
  const editing = editor.closest('[data-chat-message-editor]')!;
  expect(editing.parentElement).not.toHaveClass('bg-primary/10');
  expect(editing).not.toHaveTextContent(
    'Original attachments and context will be kept.',
  );
  expect(
    editor.closest('li')!.querySelector('[data-chat-message-actions]'),
  ).toBeNull();
  expect(editor.nextElementSibling).toContainElement(
    inlineEditor().getByRole('button', { name: 'Send', exact: true }),
  );
  fireEvent.change(editor, { target: { value: '修改第一段\nSecond line' } });
  fireEvent.keyDown(editor, { key: 'Enter', isComposing: true });
  expect(control.resend).not.toHaveBeenCalled();
  expect(screen.getByText('Onboarding')).toBeVisible();
  expect(draft).toHaveValue('Keep this unsent draft');
  expect(control.resend).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
  expect(
    screen.queryByRole('textbox', { name: 'Edit', exact: true }),
  ).toBeNull();
  expect(draft).toHaveValue('Keep this unsent draft');
});

it.each(['rejected', 'unknown'] as const)(
  'keeps the edit and does not automatically retry %s admission',
  async (outcome) => {
    control.result = { outcome, error: new Error('fixture') };
    panel();
    await screen.findByRole('button', { name: 'Edit', exact: true });
    fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Edit', exact: true }),
      { target: { value: 'Retained edit' } },
    );
    fireEvent.click(
      inlineEditor().getByRole('button', { name: 'Send', exact: true }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        enUS.chat.resend[outcome],
      ),
    );
    expect(
      screen.getByRole('textbox', { name: 'Edit', exact: true }),
    ).toHaveValue('Retained edit');
    expect(control.resend).toHaveBeenCalledExactlyOnceWith({
      messageId: 'release-plan-1',
      input: { text: 'Retained edit' },
    });
  },
);

it('closes an accepted edit even when history needs synchronization, without clearing the composer', async () => {
  control.result = { outcome: 'accepted', needsSync: true };
  panel();
  const draft = await screen.findByLabelText('Message to the agent');
  fireEvent.change(draft, { target: { value: 'Unsent' } });
  fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
  fireEvent.click(
    inlineEditor().getByRole('button', { name: 'Send', exact: true }),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() =>
    expect(
      screen.queryByRole('textbox', { name: 'Edit', exact: true }),
    ).toBeNull(),
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    enUS.chat.resend.needsSync,
  );
  expect(draft).toHaveValue('Unsent');
});

it('refreshes only its explicit source user, without resubmitting text or context', async () => {
  control.result = { outcome: 'accepted' };
  panel();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Regenerate', exact: true }),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() =>
    expect(control.resend).toHaveBeenCalledExactlyOnceWith({
      messageId: 'release-plan-1',
    }),
  );
});

it('hides refresh without source metadata and offers Runner copy only', async () => {
  control.noSource = true;
  const view = panel();
  await screen.findByRole('button', { name: 'Edit', exact: true });
  expect(
    screen.queryByRole('button', { name: 'Regenerate', exact: true }),
  ).toBeNull();
  view.unmount();
  panel('flaky-test');
  await screen.findByRole('button', { name: 'Copy', exact: true });
  expect(
    screen.queryByRole('button', { name: 'Edit', exact: true }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Regenerate', exact: true }),
  ).toBeNull();
});

it('disables mutation on archived conversations but still copies public body only', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText');
  control.archived = true;
  panel();
  const edit = await screen.findByRole('button', { name: 'Edit', exact: true });
  expect(edit).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Regenerate', exact: true }),
  ).toBeDisabled();
  const userMessage = edit.closest('li')!;
  await user.click(
    within(userMessage).getByRole('button', { name: 'Copy', exact: true }),
  );
  expect(copy).toHaveBeenCalledExactlyOnceWith(
    'What is left before we can ship the onboarding release?',
  );
});

it('renders one bubble and action group for a multi-part logical assistant and copies its public text', async () => {
  control.splitAssistant = true;
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText').mockClear();
  panel();
  const first = await screen.findByText('First segment');
  const second = screen.getByText('Second segment');
  const bubble = first.closest('li')!;
  expect(bubble).toBe(second.closest('li'));
  const reasoning = bubble.querySelector('[data-chat-part="reasoning"]')!;
  expect(reasoning).toBeInTheDocument();
  expect(
    reasoning.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    within(bubble).getAllByRole('button', { name: 'Copy', exact: true }),
  ).toHaveLength(1);
  expect(
    within(bubble).getAllByRole('button', { name: 'Regenerate', exact: true }),
  ).toHaveLength(1);
  expect(
    screen.getAllByRole('button', { name: 'Copy', exact: true }),
  ).toHaveLength(2);
  expect(
    screen.getAllByRole('button', { name: 'Regenerate', exact: true }),
  ).toHaveLength(1);
  await user.click(
    within(second.closest('li')!).getByRole('button', {
      name: 'Copy',
      exact: true,
    }),
  );
  expect(copy).toHaveBeenCalledTimes(1);
  expect(copy.mock.calls[0][0]).toContain('First segment');
  expect(copy.mock.calls[0][0]).toContain('Second segment');
  expect(copy.mock.calls[0][0]).toBe('First segment\nSecond segment');
  expect(copy.mock.calls[0][0]).not.toContain('Private reasoning');
});

it('closes an inline editor when authoritative history deletes the target', async () => {
  const view = panel();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Edit', exact: true }),
  );
  control.hideUser = true;
  view.rerender(<Panel />);
  await waitFor(() =>
    expect(
      screen.queryByRole('textbox', { name: 'Edit', exact: true }),
    ).toBeNull(),
  );
  expect(screen.queryByRole('dialog', { name: 'Resend message?' })).toBeNull();
  expect(control.resend).not.toHaveBeenCalled();
});

it('does not apply an old unmounted admission result to a replacement editor', async () => {
  let resolve!: (result: ResendResult) => void;
  control.result = new Promise<ResendResult>((done) => {
    resolve = done;
  });
  const view = panel();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Edit', exact: true }),
  );
  const send = inlineEditor().getByRole('button', {
    name: 'Send',
    exact: true,
  });
  act(() => {
    send.click();
    send.click();
  });
  expect(control.resend).toHaveBeenCalledTimes(1);
  view.unmount();
  panel();
  fireEvent.click(
    await screen.findByRole('button', { name: 'Edit', exact: true }),
  );
  fireEvent.change(screen.getByRole('textbox', { name: 'Edit', exact: true }), {
    target: { value: 'Replacement editor draft' },
  });
  await act(async () => {
    resolve({ outcome: 'accepted', needsSync: true });
  });
  await waitFor(() =>
    expect(
      screen.getByRole('textbox', { name: 'Edit', exact: true }),
    ).toHaveValue('Replacement editor draft'),
  );
  expect(screen.queryByText(enUS.chat.resend.needsSync)).toBeNull();
  expect(control.resend).toHaveBeenCalledTimes(1);
});
