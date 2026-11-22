// @vitest-environment jsdom
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
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatProvider,
  useChatPanel,
  type AIToolPart,
  type AppUIMessage,
} from '../../../client/chat.js';
import enUS from '../../../client/locales/en-US.js';
import { ChatPanel } from '../../../client/panel/chat-panel.js';
import {
  DefaultComposer,
  type ComposerProps,
} from '../../../client/panel/composer.js';
import {
  DefaultMessageItem,
  MessageItem,
  type MessageItemProps,
} from '../../../client/panel/message-item.js';
import {
  DefaultPanelHeader,
  type PanelHeaderProps,
} from '../../../client/panel/panel-header.js';
import {
  DefaultConfirmationCard,
  DefaultToolCard,
  type ConfirmationCardProps,
  type ToolCardProps,
} from '../../../client/panel/tool-card.js';
import { agentsUi, type AgentSlotProps } from '../../../client/ui-registry.js';
import { resetChatDemo } from './fixtures/chat-client.js';
import { appResources } from './fixtures/i18n.js';

// The plugin's chat hooks need a server; the tests' in-memory stand-in answers in their place.
vi.mock('../../../client/chat.js', () => import('./fixtures/chat-client.js'));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  resolveAppUrl: (x: string) => x,
  useApiClient: (await import('./fixtures/app-client.js')).useApiClient,
}));
vi.mock('../../../client/panel/use-conversation-usage.js', () => ({
  useConversationUsage: () => ({ data: undefined }),
}));
if (!('ResizeObserver' in globalThis))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  );

const undos: (() => void)[] = [];
afterEach(() => {
  for (const undo of undos.splice(0)) undo();
  resetChatDemo();
});

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/test-app', resources: appResources },
  namespaces: { '@nocobase/app-plugin-agents': enUS },
});

function Open({
  conversationId,
}: {
  readonly conversationId: string | null;
}): null {
  const { openChat } = useChatPanel();
  useEffect(() => openChat({ conversationId }), [openChat, conversationId]);
  return null;
}

function Shell({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider conversationPath={(id) => `/chat/${id}`}>
          {children}
        </ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}

function renderPanel(
  conversationId: string | null,
  width?: number,
): ReturnType<typeof render> {
  return render(
    <Shell>
      <Open conversationId={conversationId} />
      <div className='relative flex'>
        <main />
        <ChatPanel {...(width === undefined ? {} : { width })} />
      </div>
    </Shell>,
  );
}

describe('ChatPanel width', () => {
  it('docks at 420 pixels by default and at the width it is given', async () => {
    const first = renderPanel(null);
    const panel = await screen.findByTestId('chat-panel');
    expect(panel).toHaveAttribute('data-mode', 'docked');
    expect(panel.style.width).toBe('420px');
    first.unmount();
    renderPanel(null, 360);
    expect((await screen.findByTestId('chat-panel')).style.width).toBe('360px');
  });
});

describe('replaceable components', () => {
  it('renders replacements of the header, the composer and the messages with their props and the plugin’s own', async () => {
    const header: PanelHeaderProps[] = [];
    const composer: ComposerProps[] = [];
    const messages: MessageItemProps[] = [];
    undos.push(
      agentsUi.components.replace<PanelHeaderProps>(
        'PanelHeader',
        ({ Default, ...props }) => {
          header.push(props);
          expect(Default).toBe(DefaultPanelHeader);
          return (
            <div data-testid='custom-header'>
              <Default {...props} />
            </div>
          );
        },
      ),
      agentsUi.components.replace<ComposerProps>(
        'Composer',
        ({ Default, ...props }) => {
          composer.push(props);
          expect(Default).toBe(DefaultComposer);
          return (
            <div data-testid='custom-composer'>
              <Default {...props} />
            </div>
          );
        },
      ),
      agentsUi.components.replace<MessageItemProps>(
        'MessageItem',
        ({ Default, ...props }) => {
          messages.push(props);
          expect(Default).toBe(DefaultMessageItem);
          return <Default {...props} extra={<span>custom extra</span>} />;
        },
      ),
    );
    renderPanel('release-plan');
    const panel = await screen.findByTestId('chat-panel');
    const customHeader = await within(panel).findByTestId('custom-header');
    // Replacements can opt into a header slot; the default keeps choices in the composer.
    expect(within(customHeader).queryByTestId('chat-header-choice')).toBeNull();
    expect(typeof header.at(-1)?.choiceSlot).toBe('function');
    const customComposer = within(panel).getByTestId('custom-composer');
    expect(
      within(customComposer).getByTestId('chat-composer'),
    ).toBeInTheDocument();
    expect(composer.at(-1)).toMatchObject({
      conversationId: 'release-plan',
      agentId: 'online',
      running: false,
    });
    expect(typeof composer.at(-1)?.onSend).toBe('function');
    expect(
      (await within(panel).findAllByText('custom extra')).length,
    ).toBeGreaterThan(0);
    expect(messages.some((props) => props.message.id.length > 0)).toBe(true);
    expect(typeof messages.at(-1)?.agentName).toBe('function');

    // Unregistering brings the plugin's own back.
    act(() => {
      for (const undo of undos.splice(0)) undo();
    });
    await waitFor(() =>
      expect(screen.queryByTestId('custom-header')).toBeNull(),
    );
    expect(screen.queryByTestId('custom-composer')).toBeNull();
    expect(screen.queryByText('custom extra')).toBeNull();
    expect(within(panel).getByTestId('chat-composer')).toBeInTheDocument();
    expect(
      within(panel).getByTestId('conversation-header'),
    ).toBeInTheDocument();
  });

  const approvalMessage: AppUIMessage = {
    id: 'reply',
    role: 'assistant',
    metadata: {
      conversationId: 'c',
      executionId: 'execution',
      revision: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
    parts: [
      {
        type: 'tool-propose',
        toolCallId: 'call',
        state: 'approval-requested',
        input: { amount: 3 },
        approval: { id: 'approval' },
      } as AIToolPart,
    ],
  };

  function renderMessage(
    onApproval: MessageItemProps['onApproval'],
  ): ReturnType<typeof render> {
    return render(
      <TestI18nProvider runtime={runtime}>
        <ol>
          <MessageItem
            message={approvalMessage}
            agentName={() => 'Agent'}
            onApproval={onApproval}
          />
        </ol>
      </TestI18nProvider>,
    );
  }

  it('renders a replacement of the generic tool card and of its confirmation', async () => {
    const approval = vi.fn().mockResolvedValue(undefined);
    const tools: ToolCardProps[] = [];
    const confirmations: ConfirmationCardProps[] = [];
    const undoTool = agentsUi.components.replace<ToolCardProps>(
      'ToolCard',
      ({ Default, ...props }) => {
        tools.push(props);
        expect(Default).toBe(DefaultToolCard);
        return (
          <div data-testid='custom-tool'>
            <Default {...props} />
          </div>
        );
      },
    );
    const undoConfirmation = agentsUi.components.replace<ConfirmationCardProps>(
      'ConfirmationCard',
      ({ Default, approval: choice, toolName }) => {
        confirmations.push({ approval: choice, toolName } as never);
        expect(Default).toBe(DefaultConfirmationCard);
        return (
          <button type='button' onClick={() => void choice.respond(true)}>
            {`Allow ${toolName}`}
          </button>
        );
      },
    );
    undos.push(undoTool, undoConfirmation);
    const view = renderMessage(approval);
    const tool = screen.getByTestId('custom-tool');
    expect(within(tool).getByText('propose')).toBeVisible();
    expect(tools.at(-1)).toMatchObject({
      toolName: 'propose',
      part: { toolCallId: 'call', state: 'approval-requested' },
      message: { id: 'reply' },
      context: { readOnly: false },
    });
    expect(confirmations.at(-1)?.approval.disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Allow propose' }));
    await waitFor(() =>
      expect(approval).toHaveBeenCalledWith({
        messageId: 'reply',
        executionId: 'execution',
        approval: { id: 'approval', approved: true },
      }),
    );

    act(() => {
      undoConfirmation();
      undoTool();
    });
    view.rerender(
      <TestI18nProvider runtime={runtime}>
        <ol>
          <MessageItem
            message={approvalMessage}
            agentName={() => 'Agent'}
            onApproval={approval}
          />
        </ol>
      </TestI18nProvider>,
    );
    expect(screen.queryByTestId('custom-tool')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Allow propose' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Deny' })).toBeEnabled();
  });
});

describe('slots', () => {
  it('renders composer actions and the empty state with what they need, and inserts text into the composer', async () => {
    const composerProps: AgentSlotProps['composerActions'][] = [];
    const emptyProps: AgentSlotProps['emptyState'][] = [];
    undos.push(
      agentsUi.slots.composerActions.add({
        key: 'quote',
        component: (props) => {
          composerProps.push(props);
          return (
            <button type='button' onClick={() => props.insertText('Quote')}>
              Insert quote
            </button>
          );
        },
      }),
      agentsUi.slots.composerActions.add({
        key: 'first',
        order: -1,
        component: () => <span data-testid='first-action'>first</span>,
      }),
      agentsUi.slots.emptyState.add({
        key: 'suggestion',
        component: (props) => {
          emptyProps.push(props);
          return (
            <button
              type='button'
              onClick={() => props.insertText('Summarize this week')}
            >
              Suggest
            </button>
          );
        },
      }),
    );
    renderPanel(null);
    const composer = await screen.findByTestId('chat-composer');
    const insert = within(composer).getByRole('button', {
      name: 'Insert quote',
    });
    // Lower `order` first.
    expect(
      within(composer)
        .getByTestId('first-action')
        .compareDocumentPosition(insert) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(composerProps.at(-1)).toMatchObject({ conversationId: null });
    expect(typeof composerProps.at(-1)?.agentId).toBe('string');
    expect(emptyProps.at(-1)?.agentId).toBe(composerProps.at(-1)?.agentId);

    const box = screen.getByLabelText<HTMLTextAreaElement>(
      'Message to the agent',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Suggest' }));
    await waitFor(() => expect(box.value).toBe('Summarize this week'));
    fireEvent.click(insert);
    await waitFor(() => expect(box.value).toBe('Summarize this week\nQuote'));
  });

  it('adds message actions to a conversation’s messages', async () => {
    const seen: AgentSlotProps['messageActions'][] = [];
    undos.push(
      agentsUi.slots.messageActions.add({
        key: 'pin',
        component: (props) => {
          seen.push(props);
          return <button type='button'>{`Pin ${props.message.role}`}</button>;
        },
      }),
    );
    renderPanel('release-plan');
    const panel = await screen.findByTestId('chat-panel');
    const pin = (
      await within(panel).findAllByRole('button', {
        name: /^Pin /u,
      })
    )[0];
    expect(pin.closest('[data-chat-message-actions]')).not.toBeNull();
    expect(seen.at(-1)?.conversationId).toBe('release-plan');
    expect(seen.at(-1)?.message.id).toBeTruthy();
  });
});
