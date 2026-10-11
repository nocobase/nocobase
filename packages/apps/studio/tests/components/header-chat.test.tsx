import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import type { ChatPanelValue } from '@nocobase/app-plugin-agents/client/chat';
import {
  agentsQueryClient,
  chatKeys,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import { SubmissionStatus } from '../../client/agents/submission-status.js';
import { HeaderChat } from '../../client/agents/header-chat.js';
import {
  StudioChatStateProvider,
  chatEditorKey,
  useChatEditor,
  useStudioChat,
} from '../../client/agents/chat-state.js';
import { AgentComposer } from '../../client/components/agent-composer.js';
import locales from '../../client/locales/index.js';

const mock = vi.hoisted(() => ({
  create: vi.fn(),
  send: vi.fn(),
  open: vi.fn(),
  history: vi.fn(() => ({ data: undefined })),
  noAgent: false,
  target: null as string | null,
  conversation: {
    data: undefined as ConversationDetail | undefined,
    isSuccess: false,
    isError: false,
  },
}));
const PanelContext = createContext<ChatPanelValue | null>(null);
vi.mock('@nocobase/app-plugin-agents/client/chat', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-agents/client/chat')
  >()),
  ChatPanelScope: ({
    value,
    children,
  }: {
    value: ChatPanelValue;
    children: ReactNode;
  }) => <PanelContext.Provider value={value}>{children}</PanelContext.Provider>,
  useChatPanel: () => useContext(PanelContext),
  useChatApi: () => ({
    createConversation: mock.create,
    sendMessage: mock.send,
    messages: vi.fn(async () => ({ items: [], nextCursor: null })),
  }),
  useConversation: () => mock.conversation,
  useConversationList: () => mock.history(),
  useChatAgents: () => ({
    data: mock.noAgent
      ? []
      : [{ id: 'a', name: 'Agent A', isSystemDefault: true }],
    isSuccess: true,
  }),
  useAgentText: () => ({ name: (agent: { name: string }) => agent.name }),
  useChatSources: () => ({
    items: [],
    filter: null,
    selection: null,
    remove: vi.fn(),
  }),
}));
function Controls({ dual = false }: { readonly dual?: boolean }): ReactNode {
  const panel = useContext(PanelContext)!;
  const state = useStudioChat();
  const editor = useChatEditor(
    chatEditorKey('panel', panel.conversationId, state.temporaryKey),
  );
  return (
    <>
      <HeaderChat />
      {dual ? <HeaderChat mobile /> : null}
      <button onClick={() => panel.selectConversation(null, 'a')}>
        Change agent
      </button>
      <button onClick={() => panel.selectConversation(null)}>New target</button>
      <button onClick={() => panel.closeChat()}>Close panel</button>
      <output data-testid='target'>
        {panel.conversationId ?? state.temporaryKey}
      </output>
      <output data-testid='conflict'>{state.transfer?.text}</output>
      <SubmissionStatus
        conversationId={panel.conversationId}
        editorKey={chatEditorKey(
          'panel',
          panel.conversationId,
          state.temporaryKey,
        )}
      />
      <button
        onClick={() =>
          state.submissions.submit({
            content: 'Page question',
            context: undefined,
            attachments: [],
            conversationId: 'page',
            editorKey: 'page:page',
            create: {},
          })
        }
      >
        Send from page
      </button>
      <AgentComposer
        session={editor}
        onSend={() => true}
        labels={{ label: 'Panel editor' }}
      />
    </>
  );
}
function Fixture({ dual = false }: { readonly dual?: boolean }): ReactNode {
  const [target, setTarget] = useState<string | null>(mock.target);
  const [open, setOpen] = useState(false);
  const panel = {
    available: true,
    open,
    conversationId: target,
    newAgentId: null,
    pinned: [],
    source: 'panel',
    openChat: () => {
      mock.open();
      setOpen(true);
    },
    closeChat: () => setOpen(false),
    selectConversation: (id: string | null) => setTarget(id),
    focusComposer: vi.fn(),
    clearPinned: vi.fn(),
    resetSource: vi.fn(),
  } as unknown as ChatPanelValue;
  return (
    <PanelContext.Provider value={panel}>
      <StudioChatStateProvider>
        <Controls dual={dual} />
      </StudioChatStateProvider>
    </PanelContext.Provider>
  );
}
async function setup(dual = false) {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'test-app',
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init('en-US');
  return render(
    <I18nProvider runtime={runtime}>
      <MemoryRouter>
        <Fixture dual={dual} />
      </MemoryRouter>
    </I18nProvider>,
  );
}
beforeEach(() => {
  mock.noAgent = false;
  mock.target = null;
  mock.conversation = { data: undefined, isSuccess: false, isError: false };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  agentsQueryClient().clear();
});
describe('header interaction', () => {
  it('caches a newly created conversation before its send finishes', async () => {
    const created = { id: 'created', title: 'New conversation' };
    mock.create.mockResolvedValue(created);
    mock.send.mockReturnValue(new Promise(() => undefined));
    const cache = agentsQueryClient();
    cache.setQueryData(chatKeys.list({}), { pages: [] });
    await setup();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { target: { value: 'Question' } },
    );
    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { key: 'Enter' },
    );
    await waitFor(() =>
      expect(cache.getQueryData(chatKeys.conversation('created'))).toEqual(
        created,
      ),
    );
    expect(cache.getQueryState(chatKeys.list({}))?.isInvalidated).toBe(true);
    expect(mock.send).toHaveBeenCalledOnce();
    expect(mock.history).not.toHaveBeenCalled();
  });
  it('explains how to configure an unavailable agent and keeps the question', async () => {
    mock.noAgent = true;
    await setup();
    const input = screen.getByRole('textbox', { name: 'Question for Agent' });
    fireEvent.change(input, { target: { value: 'Keep this question' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose a default agent in account preferences',
    );
    expect(input).toHaveAccessibleDescription(/No agent is available/);
    expect(input).toHaveValue('Keep this question');
    expect(mock.create).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Send question' }),
    ).toBeDisabled();
  });
  it.each([false, true])(
    'explains a loading or inaccessible existing conversation (error: %s)',
    async (isError) => {
      mock.target = 'missing';
      mock.conversation.isError = isError;
      await setup();
      const input = screen.getByRole('textbox', { name: 'Question for Agent' });
      fireEvent.change(input, { target: { value: 'Keep question' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(screen.getByRole('alert')).toHaveTextContent(
        isError
          ? 'This conversation is unavailable'
          : 'Loading this conversation',
      );
      expect(input.title).not.toContain('New conversation');
      expect(input).toHaveValue('Keep question');
      fireEvent.click(
        screen.getByRole('button', { name: 'Continue editing in panel' }),
      );
      expect(mock.open).toHaveBeenCalledOnce();
      expect(mock.create).not.toHaveBeenCalled();
      fireEvent.click(screen.getByText('Close panel'));
      expect(
        screen.getByRole('textbox', { name: 'Question for Agent' }),
      ).toHaveValue('Keep question');
    },
  );
  it('explains pending sends and does not query recovery history for an unknown send', async () => {
    mock.create.mockResolvedValue({ id: 'pending' });
    mock.send.mockRejectedValue(new Error('Connection lost'));
    await setup();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { target: { value: 'First question' } },
    );
    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { key: 'Enter' },
    );
    await screen.findByText('Send result awaiting confirmation');
    fireEvent.click(screen.getByText('Close panel'));
    const input = screen.getByRole('textbox', { name: 'Question for Agent' });
    fireEvent.change(input, { target: { value: 'Next question' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveAccessibleDescription(/Open the panel to check it/);
    expect(input).toHaveValue('Next question');
    expect(mock.send).toHaveBeenCalledOnce();
    expect(mock.history).not.toHaveBeenCalled();
  });
  it('loads recovery history only after an unknown creation', async () => {
    mock.create.mockRejectedValue(new Error('Connection lost'));
    await setup();
    expect(mock.history).not.toHaveBeenCalled();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { target: { value: 'Question' } },
    );
    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { key: 'Enter' },
    );
    await screen.findByText('Conversation creation awaiting confirmation');
    expect(mock.history).toHaveBeenCalled();
    expect(mock.send).not.toHaveBeenCalled();
  });
  it('updates a page conversation and invalidates history while the panel targets another conversation', async () => {
    mock.target = 'panel';
    const detail = { id: 'page', title: 'Updated title', run: { id: 'run' } };
    mock.send.mockResolvedValue({
      conversation: detail,
      message: { id: 'm', metadata: {} },
    });
    const cache = agentsQueryClient();
    cache.setQueryData(chatKeys.list({}), { pages: [] });
    await setup();
    fireEvent.click(screen.getByText('Send from page'));
    await waitFor(() =>
      expect(cache.getQueryData(chatKeys.conversation('page'))).toEqual(detail),
    );
    expect(cache.getQueryState(chatKeys.list({}))?.isInvalidated).toBe(true);
    expect(screen.getByTestId('target')).toHaveTextContent('panel');
    expect(mock.create).not.toHaveBeenCalled();
  });
  it('only the visible mobile editor consumes close focus restoration', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(
      function (this: HTMLElement) {
        return this.closest('[data-testid="header-chat-mobile"]')
          ? document.body
          : null;
      },
    );
    await setup(true);
    fireEvent.click(
      screen.getByTestId('header-chat-mobile').querySelector('button')!,
    );
    fireEvent.click(screen.getByText('Close panel'));
    await waitFor(() =>
      expect(
        screen.getByTestId('header-chat-mobile').querySelector('textarea'),
      ).toHaveFocus(),
    );
  });
  it('typing and IME do not open; submitting preserves multiline and blocks double Enter', async () => {
    mock.create.mockReturnValue(new Promise(() => undefined));
    await setup();
    const input = screen.getByRole('textbox', { name: 'Question for Agent' });
    fireEvent.change(input, { target: { value: 'Question\n中文' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(mock.create).not.toHaveBeenCalled();
    expect(mock.open).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mock.create).toHaveBeenCalledTimes(1);
    expect(mock.open).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('textbox', { name: 'Question for Agent' }),
    ).toBeNull();
  });
  it('continue editing transfers original newlines without sending; existing draft gets a choice', async () => {
    await setup();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { target: { value: 'top\ntext' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue editing in panel' }),
    );
    expect(screen.getByRole('textbox', { name: 'Panel editor' })).toHaveValue(
      'top\ntext',
    );
    expect(mock.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Close panel'));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { target: { value: 'second' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue editing in panel' }),
    );
    expect(screen.getByTestId('conflict')).toHaveTextContent('second');
    expect(screen.getByRole('textbox', { name: 'Panel editor' })).toHaveValue(
      'top\ntext',
    );
  });
  it('changing agent preserves the editor; explicitly starting new gives a fresh editor', async () => {
    await setup();
    fireEvent.change(screen.getByRole('textbox', { name: 'Panel editor' }), {
      target: { value: 'keep draft' },
    });
    fireEvent.click(screen.getByText('Change agent'));
    expect(screen.getByRole('textbox', { name: 'Panel editor' })).toHaveValue(
      'keep draft',
    );
    fireEvent.click(screen.getByText('New target'));
    expect(screen.getByRole('textbox', { name: 'Panel editor' })).toHaveValue(
      '',
    );
  });
  it('creation completion does not replace a newer temporary target', async () => {
    let resolve!: (value: { id: string }) => void;
    mock.create.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mock.send.mockResolvedValue({
      conversation: { id: 'old' },
      message: { id: 'm', metadata: {} },
    });
    await setup();
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { target: { value: 'question' } },
    );
    fireEvent.keyDown(
      screen.getByRole('textbox', { name: 'Question for Agent' }),
      { key: 'Enter' },
    );
    fireEvent.click(screen.getByText('New target'));
    await act(async () => {
      resolve({ id: 'old' });
    });
    await waitFor(() => expect(mock.send).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('target')).toHaveTextContent('new-1');
  });
});
