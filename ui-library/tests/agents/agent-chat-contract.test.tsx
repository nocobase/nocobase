import {
  ChatExtensionsContext,
  ChatProvider,
  useChatPanel,
  appUIMessageText,
  chatMessageSegments,
  type AppUIMessage,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import { MessageItem } from '../../registry/agents/agent-chat/message-item';
import { Composer } from '../../registry/agents/agent-chat/composer';
import enUS from '../../registry/agents/agent-chat/locales/en-US';

const host = vi.hoisted(() => ({
  api: { request: vi.fn(), stream: vi.fn() },
  realtime: { subscribe: () => () => {}, onOpen: () => () => {} },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => host.api,
  useService: () => host.realtime,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'contract-test', resources: enUS },
});
const metadata = {
  conversationId: 'c',
  createdAt: '2026-01-01T00:00:00Z',
  revision: 1,
  seq: 2,
  executionId: 'native',
};
const notice: AppUIMessage = {
  id: 'news',
  role: 'system',
  metadata,
  parts: [
    {
      type: 'data-notice',
      id: 'notice',
      data: {
        type: 'planDecided',
        title: 'English fallback',
        params: { title: 'Plan' },
      },
    },
  ],
};
function Open() {
  const { openChat } = useChatPanel();
  useLayoutEffect(() => openChat({ conversationId: 'c' }), [openChat]);
  return null;
}
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider>
          <Open />
          {children}
        </ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
it('uses the formal public extension for notice cards, translated text, null fallback and ordered business parts', () => {
  const message: AppUIMessage = {
    ...notice,
    parts: [
      { type: 'text', text: 'Before' },
      ...notice.parts,
      {
        type: 'data-business',
        id: 'custom',
        data: { kind: 'plan', id: 'plan-1', payload: { title: 'Plan' } },
      },
      { type: 'text', text: 'After' },
    ],
  };
  const extension = {
    renderNews: vi.fn(() => null),
    newsText: vi.fn(() => 'Translated plan'),
    renderDataPart: vi.fn((part: AppUIMessage['parts'][number]) =>
      part.type === 'data-business' ? <article>Plan card</article> : null,
    ),
  };
  const tree = render(
    <ChatExtensionsContext.Provider value={extension}>
      <ol>
        <MessageItem message={message} agentName={() => 'Agent'} />
      </ol>
    </ChatExtensionsContext.Provider>,
    { wrapper },
  );
  expect(screen.getByText('Translated plan')).toBeVisible();
  expect(screen.getByText('Plan card')).toBeVisible();
  expect(extension.renderNews).toHaveBeenCalledWith(
    (
      notice.parts[0] as Extract<
        AppUIMessage['parts'][number],
        { type: 'data-notice' }
      >
    ).data,
    message,
  );
  expect(appUIMessageText(message)).toBe('Before\nAfter'.replace('\\n', '\n'));
  tree.rerender(
    <ChatExtensionsContext.Provider
      value={{ renderNews: () => null, newsText: () => null }}
    >
      <ol>
        <MessageItem message={notice} agentName={() => 'Agent'} />
      </ol>
    </ChatExtensionsContext.Provider>,
  );
  expect(screen.getByText('English fallback')).toBeVisible();
});
it('binds approval actions to the persisted message and execution and renders denial and tool results', async () => {
  const approval = vi.fn().mockResolvedValue(undefined);
  const message: AppUIMessage = {
    id: 'answer',
    role: 'assistant',
    metadata,
    parts: [
      {
        type: 'tool-update',
        toolCallId: 'call',
        state: 'approval-requested',
        input: { title: 'Review' },
        approval: { id: 'approval' },
      },
    ],
  };
  const tree = render(
    <ol>
      <MessageItem
        message={message}
        agentName={() => 'Agent'}
        onApproval={approval}
      />
    </ol>,
    { wrapper },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(approval).toHaveBeenCalledExactlyOnceWith({
      messageId: 'answer',
      executionId: 'native',
      approval: { id: 'approval', approved: true },
    }),
  );
  tree.rerender(
    <ol>
      <MessageItem
        message={{
          ...message,
          parts: [
            {
              type: 'tool-update',
              toolCallId: 'call',
              state: 'output-denied',
              input: { title: 'Review' },
              approval: { id: 'approval', approved: false },
            },
          ],
        }}
        agentName={() => 'Agent'}
      />
    </ol>,
  );
  expect(screen.getByText('Tool execution was denied.')).toBeVisible();
});
it('preserves stable source segments and complete SDK objects without manufacturing logical messages', () => {
  const logical: AppUIMessage = {
    id: 'run',
    role: 'assistant',
    metadata: {
      ...metadata,
      sourceRecords: [
        {
          recordId: 'a',
          seq: 2,
          partId: 'text-a',
          partIndex: 0,
          createdAt: '2026-01-01T00:00:01Z',
        },
        {
          recordId: 'b',
          seq: 4,
          partId: 'text-b',
          partIndex: 1,
          createdAt: '2026-01-01T00:00:03Z',
        },
      ],
    },
    parts: [
      { type: 'text', text: 'First' },
      { type: 'text', text: 'Second' },
    ],
  };
  const notification = {
    ...notice,
    metadata: { ...metadata, seq: 3, createdAt: '2026-01-01T00:00:02Z' },
  };
  const segments = chatMessageSegments([logical, notification]);
  expect(segments.map((segment) => segment.seq)).toEqual([2, 3, 4]);
  expect(segments[0].message).toBe(logical);
  expect(segments[2].message).toBe(logical);
  expect(segments.map((segment) => segment.key)).toEqual(
    chatMessageSegments([logical, notification]).map((segment) => segment.key),
  );
  expect(new Set(segments.map((segment) => segment.message.id)).size).toBe(2);
});
it('keeps Composer toolbar and notice injections through send and independent Stop', () => {
  const send = vi.fn(() => true),
    stop = vi.fn();
  const tree = render(
    <Composer
      running={false}
      onSend={send}
      onStop={stop}
      toolbar={<button>Application action</button>}
      notice={<p>Application notice</p>}
    />,
    { wrapper },
  );
  expect(screen.getByText('Application action')).toBeVisible();
  expect(screen.getByText('Application notice')).toBeVisible();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } });
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(send).toHaveBeenCalledOnce();
  tree.rerender(
    <Composer
      running={true}
      stopping={false}
      onSend={send}
      onStop={stop}
      toolbar={<button>Application action</button>}
      notice={<p>Application notice</p>}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Stop', exact: true }));
  expect(stop).toHaveBeenCalledOnce();
  expect(screen.getByText('Application action')).toBeVisible();
});

it('updates a genuine consultation part in the same logical message without losing its expanded state', () => {
  const consultation = {
    code: 'consultation',
    callId: 'call',
    runId: null,
    agentId: 'reviewer',
    agentName: 'Reviewer',
    question: 'Is this ready?',
    state: 'running',
    answer: null,
    error: null,
    usage: null,
    plans: 0,
  };
  const message: AppUIMessage = {
    id: 'consultation-message',
    role: 'system',
    metadata,
    parts: [
      {
        type: 'data-business',
        id: 'consultation-part',
        data: { kind: 'consultation', id: 'call', payload: consultation },
      },
    ],
  };
  const view = render(
    <ol>
      <MessageItem message={message} agentName={() => 'Agent'} />
    </ol>,
    { wrapper },
  );
  expect(screen.getByTestId('chat-consultation')).toHaveAttribute(
    'data-state-consultation',
    'running',
  );
  fireEvent.click(screen.getByText('Consulted Reviewer'));
  expect(screen.getByText('Is this ready?')).toBeVisible();
  view.rerender(
    <ol>
      <MessageItem
        message={{
          ...message,
          metadata: { ...metadata, revision: 2 },
          parts: [
            {
              type: 'data-business',
              id: 'consultation-part',
              data: {
                kind: 'consultation',
                id: 'call',
                payload: {
                  ...consultation,
                  state: 'completed',
                  answer: 'Ready for review',
                },
              },
            },
          ],
        }}
        agentName={() => 'Agent'}
      />
    </ol>,
  );
  expect(screen.getAllByTestId('chat-consultation')).toHaveLength(1);
  expect(screen.getByTestId('chat-consultation')).toHaveAttribute(
    'data-state-consultation',
    'completed',
  );
  expect(screen.getByText('Ready for review')).toBeVisible();
});
