import { JsonToSseTransformStream, type UIMessageChunk } from 'ai';

import { ConsultationCard } from '../../client/extensions/nocobase-agent-chat/consultation-card.js';
import {
  agentsQueryClient,
  ChatExtensionsContext,
  appUIMessageText,
  type ChatExtensions,
  ChatProvider,
  useChatPanel,
  type ChatPanelState,
  type AppUIMessage,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ChatAgent,
  ConversationDetail,
} from '@nocobase/app-plugin-agents/shared/conversations';
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
import { useQuery } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OnlineAgentIdentityScope } from '../../client/components/online-agent/identity-scope.js';
import OnlineAgentPanel from '../../client/components/online-agent/panel.js';
import { OnlineAgentExample } from '../../client/components/online-agent/example.js';
import { ChatHeaderButton } from '../../client/extensions/nocobase-agent-chat/launchers.js';
import { LoadError } from '../../client/extensions/nocobase-agent-chat/chat-ui.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const host = vi.hoisted(() => ({
  request: vi.fn(),
  catalog: vi.fn(),
  stream: vi.fn(),
  canRead: true,
  realtime: { watch: vi.fn(() => ({ close: vi.fn() })) },
  toaster: { show: vi.fn() },
}));
const api = { request: host.request, stream: host.stream };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useService: () => host.realtime,
  useToaster: () => host.toaster,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: host.canRead, isPending: false }),
}));

const agent: ChatAgent = {
  id: 'online',
  name: 'Online Agent',
  description: null,
  nameText: null,
  descriptionText: null,
  avatar: null,
  isSystemDefault: true,
  isMyDefault: false,
  availability: { online: true, reason: null, onlineRunners: 0 },
};
const conversation: ConversationDetail = {
  id: 'saved',
  title: 'Saved conversation',
  titleSource: 'manual',
  category: 'chat',
  showInChatList: true,
  source: 'panel',
  mode: 'online',
  agent: {
    id: 'online',
    name: 'Online Agent',
    nameText: null,
    avatar: null,
    archived: false,
  },
  availability: agent.availability,
  canFallback: false,
  canRestore: false,
  fallbackFrom: null,
  read: true,
  lastMessageAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',

  updatedAt: '2026-01-01T00:00:00Z',
  archivedAt: null,
  run: null,
  execution: { status: 'idle' },
};

const message: AppUIMessage = {
  id: 'reply',
  role: 'assistant',
  metadata: {
    conversationId: 'saved',
    seq: 1,
    revision: 1,
    createdAt: '2026-01-01T00:00:00Z',
  },
  parts: [
    { type: 'text', text: 'Saved reply remains readable.', state: 'done' },
  ],
};
const models = {
  data: [
    {
      name: 'local',
      title: 'Local',
      provider: 'openai-compatible',
      models: [
        { value: 'chat', label: 'Chat', kind: 'chat', dimensions: null },
      ],
    },
  ],
};

let panel: ReturnType<typeof useChatPanel>;
function Probe() {
  const current = useChatPanel();
  useLayoutEffect(() => {
    panel = current;
  });
  return null;
}
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'example-test',
    resources: {
      'en-US': () => Promise.resolve({ default: enUS }),
      'zh-CN': () => Promise.resolve({ default: zhCN }),
    },
  },
  strict: false,
});

async function setup(locale = 'en-US', extensions: ChatExtensions = {}) {
  await runtime.changeLanguage(locale);
  const tree = render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter basename='/demo' initialEntries={['/demo/']}>
        <OnlineAgentIdentityScope>
          <ChatProvider>
            <ChatExtensionsContext.Provider value={extensions}>
              <Probe />
              <ChatHeaderButton />
              <OnlineAgentExample />
              <OnlineAgentPanel />
            </ChatExtensionsContext.Provider>
          </ChatProvider>
        </OnlineAgentIdentityScope>
      </MemoryRouter>
    </TestI18nProvider>,
  );
  fireEvent.click(screen.getByTestId('chat-header-button'));
  return tree;
}
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  agentsQueryClient().clear();
  host.canRead = true;
  host.request.mockReset();
  host.catalog.mockReset();
  host.stream.mockReset();
  host.catalog.mockResolvedValue({ data: [] });
  host.stream.mockResolvedValue(null);
  host.request.mockImplementation(
    async (input: {
      path: string;
      query?: { q?: string };
      method?: string;
    }) => {
      if (input.path === 'agents/models') return host.catalog(input);
      if (input.path === 'agents/chatAgents')
        return { data: [agent], meta: {} };
      if (input.path === 'agents/conversations')
        return { data: input.query?.q ? [] : [conversation], meta: {} };
      if (input.path.endsWith('/messages'))
        return { data: [message], meta: { lastSeq: 1 } };
      if (input.path === 'agents/conversations/saved/config')
        return {
          data: {
            selectedModel: { modelService: 'local', model: 'chat' },
            scope: [],
            tool: [],
            toolVersions: {},
            systemPrompt: '',
          },
        };
      if (input.path === 'agents/conversations/saved')
        return { data: conversation };
      if (input.path.endsWith('/stop'))
        return {
          data: {
            ...conversation,
            execution: { status: 'idle', outcome: 'cancelled' },
          },
        };
      throw new Error(`Unexpected chat API request: ${input.path}`);
    },
  );
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('min-width'),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  agentsQueryClient().clear();
  vi.unstubAllGlobals();
});

it.each(['en-US', 'zh-CN'])(
  'keeps the installed inline edit and composer draft on unknown resend in %s',
  async (locale) => {
    host.catalog.mockResolvedValue(models);
    const original = host.request.getMockImplementation()!;
    const user: AppUIMessage = {
      ...message,
      id: 'saved-user',
      role: 'user',
      parts: [{ type: 'text', text: 'Original user input' }],
    };
    const reply: AppUIMessage = {
      ...message,
      metadata: { ...message.metadata!, seq: 2, sourceUserMessageId: user.id },
    };
    host.request.mockImplementation((input) =>
      input.path.endsWith('/messages')
        ? Promise.resolve({ data: [user, reply], meta: { lastSeq: 2 } })
        : original(input),
    );
    host.stream.mockRejectedValue(new TypeError('Resend response lost'));
    await setup(locale);
    act(() => panel.openChat({ conversationId: 'saved' }));
    const editLabel = locale === 'zh-CN' ? '编辑' : 'Edit';
    const sendLabel = locale === 'zh-CN' ? '发送' : 'Send';
    const draft = await screen.findByRole('textbox', {
      name: locale === 'zh-CN' ? '发给 Agent 的消息' : 'Message to the agent',
    });
    fireEvent.change(draft, { target: { value: 'Preserved composer draft' } });
    const editButton = await screen.findByRole('button', {
      name: editLabel,
      exact: true,
    });
    await waitFor(() => expect(editButton).toBeEnabled());
    fireEvent.click(editButton);
    const editor = screen.getByRole('textbox', {
      name: editLabel,
      exact: true,
    });
    expect(editor).toHaveClass('bg-background', 'min-h-20', 'resize-none');
    const editing = editor.closest('[data-chat-message-editor]')!;
    expect(editing.parentElement).not.toHaveClass('bg-primary/10');
    expect(editing).not.toHaveTextContent('将保留原附件和上下文。');
    expect(editing).not.toHaveTextContent(
      'Original attachments and context will be kept.',
    );
    expect(
      editor.closest('li')!.querySelector('[data-chat-message-actions]'),
    ).toBeNull();
    fireEvent.change(editor, { target: { value: 'Edited user text' } });
    fireEvent.click(
      within(editor.closest('[data-chat-message-editor]')!).getByRole(
        'button',
        { name: sendLabel, exact: true },
      ),
    );
    await screen.findByText(
      locale === 'zh-CN' ? zhCN.chat.resend.unknown : enUS.chat.resend.unknown,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(editor).toHaveValue('Edited user text');
    expect(draft).toHaveValue('Preserved composer draft');
    expect(host.stream).toHaveBeenCalledTimes(1);
    expect(host.stream.mock.calls[0][0]).toMatchObject({
      path: 'agents/conversations/saved/resend',
      method: 'POST',
      json: { messageId: 'saved-user', input: { text: 'Edited user text' } },
    });
    expect(
      screen.getByText(
        locale === 'zh-CN'
          ? zhCN.chat.resend.unknown
          : enUS.chat.resend.unknown,
      ),
    ).toBeVisible();
  },
);
it.each(['en-US', 'zh-CN'])(
  'guides model configuration in %s, preserves the draft and never sends without a chat model',
  async (locale) => {
    await setup(locale);
    expect(
      await screen.findByText(
        locale === 'zh-CN' ? '尚未配置聊天模型' : 'No chat model configured',
      ),
    ).toBeVisible();
    const notice = screen.getByRole('alert');
    expect(notice.parentElement).toHaveClass('mb-3');
    const links = screen.getAllByRole('button', {
      name: locale === 'zh-CN' ? '打开模型配置' : 'Open models',
    });
    links.forEach((link) =>
      expect(link).toHaveAttribute('href', '/demo/models'),
    );
    const input = screen.getByRole('textbox', {
      name: locale === 'zh-CN' ? '发给 Agent 的消息' : 'Message to the agent',
    });
    const user = userEvent.setup();
    await user.type(input, 'Keep this draft{Enter}');
    expect(input).toHaveValue('Keep this draft');
    expect(
      host.request.mock.calls.filter(([request]) => request.method === 'POST'),
    ).toHaveLength(0);
    host.catalog.mockResolvedValue(models);
    fireEvent(window, new Event('focus'));
    await waitFor(() =>
      expect(
        screen.queryByText(
          locale === 'zh-CN' ? '尚未配置聊天模型' : 'No chat model configured',
        ),
      ).not.toBeInTheDocument(),
    );
    expect(input).toHaveValue('Keep this draft');
    expect(
      screen.getByRole('button', {
        name: locale === 'zh-CN' ? '发送' : 'Send',
      }),
    ).toBeEnabled();
  },
);

it('preserves server-side model defaults until a model is explicitly chosen', async () => {
  host.catalog.mockResolvedValue(models);
  const normal = host.request.getMockImplementation()!;
  host.request.mockImplementation(async (input) => {
    if (input.path === 'agents/conversations' && input.method === 'POST')
      return { data: conversation };
    return normal(input);
  });
  await setup();
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Message to the agent' }),
    'Use the configured default{Enter}',
  );
  await waitFor(() =>
    expect(host.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'agents/conversations', method: 'POST' }),
    ),
  );
  const creation = host.request.mock.calls.find(
    ([request]) =>
      request.path === 'agents/conversations' && request.method === 'POST',
  )![0];
  expect(creation.json).toMatchObject({ agentId: 'online' });
  expect(creation.json).not.toHaveProperty('selectedModel');
});

it('groups native models by service and submits the selected service/model pair', async () => {
  host.catalog.mockResolvedValue({
    data: [
      ...models.data,
      { ...models.data[0], name: 'backup', title: 'Backup service' },
    ],
  });
  const normal = host.request.getMockImplementation()!;
  host.request.mockImplementation(async (input) => {
    if (input.path === 'agents/conversations' && input.method === 'POST')
      return { data: conversation };
    return normal(input);
  });
  await setup();
  await waitFor(() =>
    expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
      'Default model',
    ),
  );
  const user = userEvent.setup();
  await user.click(screen.getByTestId('chat-agent-picker'));
  const menu = await screen.findByRole('menu');
  expect(within(menu).queryByText('Agents')).not.toBeInTheDocument();
  expect(within(menu).queryByText('Models')).not.toBeInTheDocument();
  expect(within(menu).queryByText('Online Agent')).not.toBeInTheDocument();
  expect(within(menu).queryByText('openai-compatible')).not.toBeInTheDocument();
  const localGroup = within(menu).getByRole('group', { name: 'Local' });
  const backupGroup = within(menu).getByRole('group', {
    name: 'Backup service',
  });
  expect(within(localGroup).getByRole('menuitem')).toHaveAttribute(
    'data-model-service',
    'local',
  );
  expect(within(backupGroup).getByRole('menuitem')).toHaveAttribute(
    'data-model-service',
    'backup',
  );
  expect(within(backupGroup).getByRole('menuitem')).not.toHaveTextContent(
    'Backup service',
  );
  await user.click(
    within(menu).getByRole('menuitem', { name: /Chat.*Backup service/ }),
  );
  await user.type(
    screen.getByRole('textbox', { name: 'Message to the agent' }),
    'Use the backup{Enter}',
  );
  await waitFor(() =>
    expect(host.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'agents/conversations',
        method: 'POST',
        json: expect.objectContaining({
          agentId: 'online',
          selectedModel: { modelService: 'backup', model: 'chat' },
        }),
      }),
    ),
  );
});

it('uses the approved Chinese hint and service grouping in the online mode picker, with a switch to Runner agents', async () => {
  host.catalog.mockResolvedValue(models);
  const normal = host.request.getMockImplementation()!;
  host.request.mockImplementation(async (input) =>
    input.path === 'agents/chatAgents'
      ? {
          data: [agent, { ...agent, id: 'runner', name: 'Coding agent' }],
          meta: {},
        }
      : normal(input),
  );
  await setup('zh-CN');
  expect(await screen.findByTestId('chat-mode-switch')).toHaveAccessibleName(
    '切换到执行机 Agent',
  );
  await userEvent.click(screen.getByTestId('chat-agent-picker'));
  const menu = await screen.findByRole('menu');
  // Each mode offers its own kind: the online agent's models, no Runner agents.
  expect(within(menu).queryByText('Agents')).not.toBeInTheDocument();
  expect(within(menu).queryByText('Coding agent')).not.toBeInTheDocument();
  expect(within(menu).getByText('选择与在线大模型对话。')).toBeVisible();
  const service = within(menu).getByRole('group', { name: 'Local' });
  expect(within(service).getByRole('menuitem')).toHaveAttribute(
    'data-model',
    'chat',
  );
});

it('keeps the draft when switching between a model and a Runner and omits native selection for Runner creation', async () => {
  host.catalog.mockResolvedValue(models);
  const normal = host.request.getMockImplementation()!;
  host.request.mockImplementation(async (input) => {
    if (input.path === 'agents/chatAgents')
      return {
        data: [
          agent,
          {
            ...agent,
            id: 'runner',
            name: 'Coding agent',
            description: 'Works in a repository',
            isMyDefault: true,
            personalOnly: true,
          },
        ],
        meta: {},
      };
    if (input.path === 'agents/conversations' && input.method === 'POST')
      return {
        data: {
          ...conversation,
          agent: { ...conversation.agent, id: 'runner', name: 'Coding agent' },
        },
      };
    return normal(input);
  });
  await setup();
  const user = userEvent.setup();
  const input = screen.getByRole('textbox', { name: 'Message to the agent' });
  await user.type(input, 'Keep the draft');
  // The person's default is a Runner agent, so the panel starts with Runner agents.
  await screen.findByTestId('chat-mode-switch');
  await waitFor(() =>
    expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
      'Coding agent',
    ),
  );
  await user.click(screen.getByTestId('chat-agent-picker'));
  let menu = await screen.findByRole('menu');
  expect(within(menu).queryByText('Models')).not.toBeInTheDocument();
  const runner = within(menu).getByRole('menuitem', { name: /Coding agent/ });
  expect(runner).toHaveTextContent('Works in a repository');
  expect(runner).toHaveTextContent('My default');
  expect(runner).toHaveTextContent('Personal runners only');
  await user.keyboard('{Escape}');
  await user.click(screen.getByTestId('chat-mode-switch'));
  expect(input).toHaveValue('Keep the draft');
  await user.click(screen.getByTestId('chat-agent-picker'));
  menu = await screen.findByRole('menu');
  await user.click(within(menu).getByRole('menuitem', { name: /Chat.*Local/ }));
  expect(input).toHaveValue('Keep the draft');
  await user.click(screen.getByTestId('chat-mode-switch'));
  await waitFor(() =>
    expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
      'Coding agent',
    ),
  );
  expect(input).toHaveValue('Keep the draft');
  await user.click(screen.getByTestId('chat-send'));
  await waitFor(() =>
    expect(host.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'agents/conversations', method: 'POST' }),
    ),
  );
  const creation = host.request.mock.calls.find(
    ([request]) =>
      request.path === 'agents/conversations' && request.method === 'POST',
  )![0];
  expect(creation.json).toMatchObject({ agentId: 'runner' });
  expect(creation.json).not.toHaveProperty('selectedModel');
});

it('does not silently replace a selected model that disappears on catalog refresh', async () => {
  host.catalog.mockResolvedValue(models);
  await setup();
  await waitFor(() =>
    expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
      'Default model',
    ),
  );
  const user = userEvent.setup();
  await user.click(screen.getByTestId('chat-agent-picker'));
  await user.click(
    await screen.findByRole('menuitem', { name: /Chat.*Local/ }),
  );
  const input = screen.getByRole('textbox', { name: 'Message to the agent' });
  await user.type(input, 'Do not send using another model');
  host.catalog.mockResolvedValue({
    data: [
      {
        ...models.data[0],
        models: [
          { value: 'other', label: 'Other', kind: 'chat', dimensions: null },
        ],
      },
    ],
  });
  fireEvent(window, new Event('focus'));
  await waitFor(() => expect(screen.getByTestId('chat-send')).toBeDisabled());
  expect(input).toHaveValue('Do not send using another model');
  expect(
    host.request.mock.calls.filter(([request]) => request.method === 'POST'),
  ).toHaveLength(0);
});
it('hides model links from non-readers and offers administrator guidance', async () => {
  host.canRead = false;
  await setup();
  expect(
    await screen.findByText('Ask an administrator to configure a chat model.'),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Open models' }),
  ).not.toBeInTheDocument();
});

it('keeps saved history readable when no model is configured and shares homepage/header state', async () => {
  await setup();
  fireEvent.click(screen.getByTestId('chat-history-button'));
  fireEvent.click(await screen.findByText('Saved conversation'));
  await waitFor(() =>
    expect(screen.getByText('Saved reply remains readable.')).toBeVisible(),
  );
  expect(await screen.findByText('No chat model configured')).toBeVisible();
  const previous: ChatPanelState = panel;
  fireEvent.click(screen.getByTestId('chat-header-button'));
  expect(screen.getByTestId('chat-panel')).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Open Agent chat' }));
  expect(panel.conversationId).toBe(previous.conversationId);
  expect(screen.getByText('Saved reply remains readable.')).toBeVisible();
});

it('revalidates on reopen and focus, blocks send while checking, and ignores obsolete catalog responses', async () => {
  host.catalog.mockResolvedValue(models);
  await setup();
  await waitFor(() => expect(host.catalog).toHaveBeenCalledTimes(1));
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: 'Message to the agent' }),
    'A draft',
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
  );
  let resolve!: (data: unknown) => void;
  host.catalog.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fireEvent(window, new Event('focus'));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled(),
  );
  fireEvent.click(screen.getByTestId('chat-header-button'));
  host.catalog.mockResolvedValue({ data: [] });
  fireEvent.click(screen.getByTestId('chat-header-button'));
  expect(await screen.findByText('No chat model configured')).toBeVisible();
  await act(async () => {
    resolve(models);
  });
  expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  expect(
    screen.getByRole('textbox', { name: 'Message to the agent' }),
  ).toHaveValue('A draft');
});

it('treats catalog failure as an error rather than an empty catalog and retries explicitly', async () => {
  host.catalog.mockRejectedValue(new Error('network failure'));
  await setup();
  expect(await screen.findByText('Could not load chat models.')).toBeVisible();
  expect(
    screen.queryByText('No chat model configured'),
  ).not.toBeInTheDocument();
  host.catalog.mockResolvedValue(models);
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() =>
    expect(
      screen.queryByText('Could not load chat models.'),
    ).not.toBeInTheDocument(),
  );
});

it('keeps Stop available independently of the model catalog', async () => {
  await setup();
  act(() => {
    panel.openChat({ conversationId: 'saved' });
  });
  await screen.findByText('Saved reply remains readable.');
  act(() =>
    agentsQueryClient().setQueryData(
      ['agents', 'chat', 'conversation', 'saved'],
      { ...conversation, execution: { status: 'running' } },
    ),
  );
  const stop = await screen.findByRole('button', { name: 'Stop' });
  expect(stop).toBeEnabled();
  fireEvent.click(stop);
  await waitFor(() =>
    expect(host.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'agents/conversations/saved/stop',
        method: 'POST',
      }),
    ),
  );
});
it('keeps an unbound historical run stoppable and an idle effect hint nonblocking', async () => {
  host.catalog.mockResolvedValue(models);
  await setup();
  act(() => panel.openChat({ conversationId: 'saved' }));
  await screen.findByText('Saved reply remains readable.');
  act(() =>
    agentsQueryClient().setQueryData(
      ['agents', 'chat', 'conversation', 'saved'],
      {
        ...conversation,
        execution: undefined,
        run: { id: 'old-run', status: 'running' },
        availability: { online: false, reason: 'agentGone', onlineRunners: 0 },
      },
    ),
  );
  expect(await screen.findByRole('button', { name: 'Stop' })).toBeEnabled();
  expect(
    screen.getByText(
      'This historical conversation is read-only. Start a new chat to continue.',
    ),
  ).toBeVisible();
  act(() =>
    agentsQueryClient().setQueryData(
      ['agents', 'chat', 'conversation', 'saved'],
      {
        ...conversation,
        execution: {
          status: 'idle',
          outcome: 'cancelled',
          requiresEffectReview: true,
        },
      },
    ),
  );
  const input = screen.getByRole('textbox', { name: 'Message to the agent' });
  fireEvent.change(input, { target: { value: 'Continue after completion' } });
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
  );
});
it.each(['empty', 'failed'])(
  'lets an available Runner send when the native catalog is %s',
  async (phase) => {
    if (phase === 'failed')
      host.catalog.mockRejectedValue(new Error('Native catalog unavailable'));
    const request = host.request.getMockImplementation()!;
    host.request.mockImplementation(async (input) =>
      input.path === 'agents/chatAgents'
        ? {
            data: [
              {
                ...agent,
                id: 'runner-fixture',
                name: 'Runner fixture',
                availability: { online: true, reason: null, onlineRunners: 1 },
              },
            ],
            meta: {},
          }
        : request(input),
    );
    await setup();
    await act(async () => panel.selectConversation(null, 'runner-fixture'));
    await waitFor(() =>
      expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
        'Runner fixture',
      ),
    );
    const textarea = screen
      .getByTestId('chat-composer')
      .querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Runner draft' } });
    expect(screen.getByTestId('chat-send')).toBeEnabled();
    expect(
      screen.queryByText('No chat model configured'),
    ).not.toBeInTheDocument();
  },
);

it.each([false, true])(
  'keeps model search editable inside the chat panel (mobile=%s)',
  async (mobile) => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width') ? mobile : !mobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    host.catalog.mockResolvedValue(models);
    await setup();
    await waitFor(() =>
      expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
        'Default model',
      ),
    );
    const user = userEvent.setup();
    await user.click(screen.getByTestId('chat-agent-picker'));
    const search = await screen.findByRole('searchbox');
    await user.click(search);
    await user.keyboard('no matching model');
    expect(search).toHaveFocus();
    expect(search).toHaveValue('no matching model');
    expect(screen.getByText('No matching models or agents')).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.getByTestId('chat-panel')).toBeVisible();
    expect(screen.getByTestId('chat-agent-picker')).toHaveFocus();
  },
);

it('preserves the same composer across phone close/reopen and desktop breakpoint transitions', async () => {
  let mobile = true;
  const changes = new EventTarget();
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('max-width') ? mobile : !mobile;
    },
    addEventListener: changes.addEventListener.bind(changes),
    removeEventListener: changes.removeEventListener.bind(changes),
  }));
  await setup();
  const input = await screen.findByRole('textbox', {
    name: 'Message to the agent',
  });
  await userEvent.setup().type(input, 'Phone draft');
  act(() => {
    panel.closeChat();
  });
  act(() => {
    panel.openChat();
  });
  expect(screen.getByRole('textbox', { name: 'Message to the agent' })).toBe(
    input,
  );
  expect(input).toHaveValue('Phone draft');
  act(() => {
    mobile = false;
    changes.dispatchEvent(new Event('change'));
  });
  expect(screen.getByRole('textbox', { name: 'Message to the agent' })).toBe(
    input,
  );
  expect(screen.getByTestId('chat-panel')).toHaveAttribute(
    'data-mode',
    'docked',
  );
  expect(input).toHaveValue('Phone draft');
});

it('renders unreadable message history as an error instead of an empty conversation', async () => {
  const normal = host.request.getMockImplementation()!;
  host.request.mockImplementation((input) =>
    input.path.endsWith('/messages')
      ? Promise.reject({ status: 403 })
      : normal(input),
  );
  await setup();
  act(() => {
    panel.openChat({ conversationId: 'saved' });
  });
  expect(
    await screen.findByText('Could not load the conversation'),
  ).toBeVisible();
  expect(
    screen.queryByText('What can Online Agent do for you?'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument();
});

it('lets a failed known-unsubmitted input be discarded without leaving Send blocked', async () => {
  host.catalog.mockResolvedValue(models);
  host.stream.mockRejectedValue({
    domain: 'agents',
    reason: 'INVALID_REQUEST',
    status: 400,
  });
  await setup();
  act(() => {
    panel.openChat({ conversationId: 'saved' });
  });
  const input = await screen.findByRole('textbox', {
    name: 'Message to the agent',
  });
  await userEvent.setup().type(input, 'Rejected input{Enter}');
  fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));
  await userEvent.setup().type(input, 'A different input');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled(),
  );
  expect(screen.queryByText('Rejected input')).not.toBeInTheDocument();
});

it('retires a blank editor and its creation observer when New is requested before creation completes', async () => {
  const normal = host.request.getMockImplementation()!;
  let finishOld: (value: { data: ConversationDetail }) => void = () => {};
  let creations = 0;
  host.catalog.mockResolvedValue(models);
  host.request.mockImplementation((input) => {
    if (input.path === 'agents/conversations' && input.method === 'POST') {
      creations += 1;
      if (creations === 1)
        return new Promise<{ data: ConversationDetail }>((resolve) => {
          finishOld = resolve;
        });
      return new Promise(() => {});
    }
    if (input.path.endsWith('/messages') && input.method === 'POST')
      return Promise.resolve({
        data: { conversation, message: { ...message, role: 'user' } },
      });
    return normal(input);
  });
  await setup();
  const first = await screen.findByRole('textbox', {
    name: 'Message to the agent',
  });
  await userEvent.setup().type(first, 'Abandoned pending message{Enter}');
  await waitFor(() => expect(creations).toBe(1));
  act(() => {
    panel.selectConversation(null);
    panel.focusComposer();
  });
  const second = screen.getByRole('textbox', { name: 'Message to the agent' });
  expect(second).not.toBe(first);
  expect(
    screen.queryByText('Abandoned pending message'),
  ).not.toBeInTheDocument();
  await userEvent.setup().type(second, 'New pending message{Enter}');
  await waitFor(() => expect(creations).toBe(2));
  fireEvent.change(second, { target: { value: 'Unsent new draft' } });
  await act(async () => finishOld({ data: conversation }));
  await waitFor(() =>
    expect(host.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'agents/conversations/saved/messages',
        method: 'POST',
      }),
    ),
  );
  expect(panel.conversationId).toBeNull();
  expect(second).toHaveValue('Unsent new draft');
  expect(
    screen.queryByText('Abandoned pending message'),
  ).not.toBeInTheDocument();
  expect(screen.getByText('New pending message')).toBeVisible();
});

it('recovers uncertain conversation creation only after an explicit user decision', async () => {
  const normal = host.request.getMockImplementation()!;
  let creations = 0;
  host.catalog.mockResolvedValue(models);
  host.request.mockImplementation((input) => {
    if (input.path === 'agents/conversations' && input.method === 'POST') {
      creations += 1;
      return creations === 1
        ? Promise.reject(new Error('creation response lost'))
        : Promise.resolve({ data: conversation });
    }
    if (input.path.endsWith('/messages') && input.method === 'POST')
      return Promise.resolve({
        data: { conversation, message: { ...message, role: 'user' } },
      });
    return normal(input);
  });
  await setup();
  await userEvent
    .setup()
    .type(
      screen.getByRole('textbox', { name: 'Message to the agent' }),
      'Uncertain creation{Enter}',
    );
  const recovery = await screen.findByRole('button', {
    name: 'Create another conversation and send',
  });
  expect(creations).toBe(1);
  expect(
    screen.queryByRole('button', { name: 'Refresh history' }),
  ).not.toBeInTheDocument();
  fireEvent.click(recovery);
  await waitFor(() => expect(panel.conversationId).toBe('saved'));
  expect(creations).toBe(2);
});

it.each([401, 403, 404, 500])(
  'gives the appropriate recovery action for HTTP %s',
  async (status) => {
    render(
      <TestI18nProvider runtime={runtime}>
        <MemoryRouter basename='/demo' initialEntries={['/demo/models']}>
          <LoadError title='Failed' error={{ status }} onRetry={vi.fn()} />
        </MemoryRouter>
      </TestI18nProvider>,
    );
    if (status === 401)
      expect(screen.getByRole('button', { name: 'Sign in' })).toHaveAttribute(
        'href',
        '/demo/login?redirect=%2Fmodels',
      );
    expect(screen.queryByRole('button', { name: 'Retry' }) !== null).toBe(
      status === 500,
    );
  },
);

it.each([
  ['en-US', true],
  ['zh-CN', true],
  ['en-US', false],
  ['zh-CN', false],
] as const)(
  'shows thinking after sending in %s (new conversation: %s) before the first stream event',
  async (locale, fresh) => {
    let accepted = false;
    let terminal = false;
    let accept!: () => void;
    let output!: ReadableStreamDefaultController<UIMessageChunk>;
    const inputMessage = {
      ...message,
      id: 'input',
      metadata: { ...message.metadata!, seq: fresh ? 1 : 2 },
      role: 'user' as const,
      parts: [
        {
          type: 'text' as const,
          text: 'Next question',
          state: 'done' as const,
        },
      ],
    };
    const reply = {
      ...message,
      id: 'answer',
      metadata: {
        ...message.metadata!,
        seq: inputMessage.metadata.seq! + 1,
        executionId: 'native-1',
      },
      parts: [
        { type: 'text' as const, text: 'First body', state: 'done' as const },
      ],
    };
    const detail = () => ({
      ...conversation,
      execution: terminal
        ? { status: 'idle', outcome: 'completed' }
        : { status: accepted ? 'running' : 'idle' },
    });
    const original = host.request.getMockImplementation()!;
    host.catalog.mockResolvedValue(models);
    host.stream.mockImplementation(async (input) => {
      expect(input.method).toBe('POST');
      const body = input.json as { message: AppUIMessage };
      inputMessage.id = body.message.id;
      await new Promise<void>((resolve) => {
        accept = resolve;
      });
      accepted = true;
      return new ReadableStream<UIMessageChunk>({
        start(controller) {
          output = controller;
        },
      })
        .pipeThrough(new JsonToSseTransformStream())
        .pipeThrough(new TextEncoderStream());
    });
    host.request.mockImplementation(async (input) => {
      if (input.path === 'agents/conversations' && input.method === 'POST')
        return { data: detail() };
      if (input.path === 'agents/conversations/saved')
        return { data: detail() };
      if (input.path.endsWith('/messages')) {
        return {
          data: [
            ...(!fresh ? [{ ...message, id: 'previous-reply' }] : []),
            ...(accepted ? [inputMessage] : []),
            ...(terminal ? [reply] : []),
          ],
          meta: {
            lastSeq: terminal
              ? reply.metadata.seq
              : accepted
                ? inputMessage.metadata.seq
                : fresh
                  ? 0
                  : 1,
          },
        };
      }
      return original(input);
    });
    await setup(locale);
    if (!fresh) act(() => panel.openChat({ conversationId: 'saved' }));
    const send = await screen.findByTestId('chat-send');
    fireEvent.change(
      screen.getByRole('textbox', {
        name: locale === 'zh-CN' ? '发给 Agent 的消息' : 'Message to the agent',
      }),
      { target: { value: 'Next question' } },
    );
    await waitFor(() => expect(send).toBeEnabled());
    fireEvent.click(send);
    await waitFor(() => expect(accept).toBeTypeOf('function'));
    const log = screen.getByRole('log');
    const sending = document.querySelector('[data-chat-feedback="sending"]')!;
    expect(sending).toBeVisible();
    expect(log).toContainElement(sending);
    expect(sending.closest('li')?.previousElementSibling).toHaveTextContent(
      'Next question',
    );
    await act(async () => accept());
    const thinking = await screen.findByText(
      locale === 'zh-CN' ? '正在思考…' : 'Thinking…',
    );
    const status = thinking.closest('[data-chat-feedback]')!;
    expect(status).toHaveAttribute('data-chat-feedback', 'thinking');
    expect(status.querySelector('[data-slot="spinner"]')).toBeVisible();
    expect(log).toContainElement(status);
    const row = status.closest('li');
    expect(row?.parentElement?.lastElementChild).toBe(row);
    expect(row?.previousElementSibling).toHaveTextContent('Next question');
    await waitFor(() => expect(output).toBeDefined());
    expect(thinking).toBeVisible();
    const emit = (event: UIMessageChunk) => output.enqueue(event);
    await act(async () => {
      emit({
        type: 'start',
        messageId: 'answer',
        messageMetadata: reply.metadata,
      });
      emit({ type: 'text-start', id: 'text' });
    });
    expect(document.querySelector('[data-message-id="answer"]')).toBeNull();
    expect(thinking).toBeVisible();
    act(() => {
      emit({ type: 'reasoning-start', id: 'reasoning' });
      emit({
        type: 'reasoning-delta',
        id: 'reasoning',
        delta: 'Reasoning only',
      });
    });
    expect(await screen.findByText('Reasoning only')).toBeVisible();
    expect(
      document.querySelector('[data-chat-feedback="thinking"]'),
    ).toBeNull();
    expect(
      screen.queryByLabelText(locale === 'zh-CN' ? '正在输入…' : 'Writing…'),
    ).toBeNull();
    act(() => emit({ type: 'reasoning-end', id: 'reasoning' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: locale === 'zh-CN' ? '推理过程' : 'Reasoning',
        }),
      ).toHaveAttribute('aria-expanded', 'false'),
    );
    act(() => emit({ type: 'text-delta', id: 'text', delta: 'First body' }));
    expect(await screen.findByText('First body')).toBeVisible();
    expect(
      document.querySelector('[data-chat-feedback="thinking"]'),
    ).toBeNull();
    terminal = true;
    act(() => {
      emit({ type: 'text-end', id: 'text' });
      emit({ type: 'finish', messageMetadata: reply.metadata });
      output.close();
    });
    await waitFor(() => expect(screen.queryByTestId('chat-stop')).toBeNull());
    expect(
      screen.queryByText(locale === 'zh-CN' ? '已完成。' : 'Completed.'),
    ).toBeNull();
    expect(
      document.querySelector('[data-chat-feedback="completed"]'),
    ).toBeNull();
    expect(
      document.querySelector('[data-chat-feedback] [data-slot="spinner"]'),
    ).toBeNull();
    expect(screen.getAllByText('First body')).toHaveLength(1);
  },
);

it.each(['en-US', 'zh-CN'])(
  'shows first-response and cancellation confirmation feedback in %s without hiding the reply',
  async (locale) => {
    let output!: ReadableStreamDefaultController<UIMessageChunk>;
    let terminal = false;
    const original = host.request.getMockImplementation()!;
    host.catalog.mockResolvedValue(models);
    host.stream.mockResolvedValue(
      new ReadableStream<UIMessageChunk>({
        start(controller) {
          output = controller;
        },
      })
        .pipeThrough(new JsonToSseTransformStream())
        .pipeThrough(new TextEncoderStream()),
    );
    host.request.mockImplementation(async (input) => {
      if (
        input.path === 'agents/conversations/saved' ||
        input.path.endsWith('/stop')
      )
        return {
          data: {
            ...conversation,
            execution: terminal
              ? { status: 'idle', outcome: 'cancelled' }
              : { status: 'running' },
          },
        };
      if (input.path.endsWith('/messages'))
        return {
          data: [
            {
              ...message,
              id: 'input',
              role: 'user',
              parts: [{ type: 'text', text: 'Question', state: 'done' }],
            },
            ...(terminal
              ? [
                  {
                    id: 'answer',
                    role: 'assistant',
                    metadata: {
                      ...message.metadata,
                      seq: 2,
                      executionId: 'native-1',
                    },
                    parts: [
                      { type: 'text', text: 'First body', state: 'done' },
                    ],
                  },
                ]
              : []),
          ],
          meta: { lastSeq: terminal ? 2 : 1 },
        };
      return original(input);
    });
    await setup(locale);
    act(() => panel.openChat({ conversationId: 'saved' }));
    expect(
      await screen.findByText(locale === 'zh-CN' ? '正在思考…' : 'Thinking…'),
    ).toBeVisible();
    const emit = (event: UIMessageChunk) => output.enqueue(event);
    act(() => {
      emit({
        type: 'start',
        messageId: 'answer',
        messageMetadata: {
          conversationId: 'saved',
          createdAt: message.metadata!.createdAt,
          revision: 0,
          executionId: 'native-1',
        },
      });
      emit({ type: 'text-start', id: 'text' });
      emit({ type: 'text-delta', id: 'text', delta: 'First body' });
    });
    expect(await screen.findByText('First body')).toBeVisible();
    expect(
      screen.queryByText(locale === 'zh-CN' ? '正在思考…' : 'Thinking…'),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: locale === 'zh-CN' ? '停止' : 'Stop',
      }),
    );
    expect(
      await screen.findByText(
        locale === 'zh-CN'
          ? '已请求停止，等待 Agent 确认结束…'
          : 'Stop requested. Waiting for the agent to finish…',
      ),
    ).toBeVisible();
    terminal = true;
    act(() => {
      emit({ type: 'text-end', id: 'text' });
      emit({ type: 'finish' });
      output.close();
    });
    expect(
      await screen.findByText(
        locale === 'zh-CN'
          ? '已取消。再次执行前请核对可能已完成的操作。'
          : 'Cancelled. Check possibly completed actions before repeating them.',
      ),
    ).toBeVisible();
    expect(screen.getByText('First body')).toBeVisible();
  },
);

it('uses formal extensions with one SDK response, interleaved display segments, revisions and complete history pages', async () => {
  const at = (second: number) => `2026-01-01T00:00:0${second}Z`;
  const reply: AppUIMessage = {
    id: 'logical-run',
    role: 'assistant',
    metadata: {
      conversationId: 'saved',
      seq: 2,
      revision: 1,
      createdAt: at(1),
      executionId: 'run',
      sourceRecords: [
        {
          recordId: 'block-a',
          partId: 'text-a',
          partIndex: 0,
          seq: 2,
          createdAt: at(1),
        },
        {
          recordId: 'block-b',
          partId: 'text-b',
          partIndex: 1,
          seq: 4,
          createdAt: at(3),
        },
      ],
    },
    parts: [
      {
        type: 'text',
        text: 'First block: PM-1 PM-1. `PM-2`\n\n```ts\nPM-4\n```',
        state: 'done',
      },
      { type: 'text', text: 'Second block: PM-3', state: 'done' },
    ],
  };
  const notice: AppUIMessage = {
    id: 'independent',
    role: 'system',
    metadata: {
      conversationId: 'saved',
      seq: 3,
      revision: 1,
      createdAt: at(2),
    },
    parts: [
      {
        type: 'data-notice',
        id: 'news',
        data: {
          type: 'delegated',
          title: 'Delegation notice',
          params: { runId: 'child' },
        },
      },
    ],
  };
  let records = [reply, notice],
    revision = 1;
  const normal = host.request.getMockImplementation()!;
  host.request.mockImplementation(async (input) => {
    if (input.path === 'fixture/plans')
      return {
        data: [{ id: 'plan-1', title: `Plan revision ${revision}`, at: at(1) }],
      };
    if (input.path === 'fixture/references')
      return { data: [{ key: 'PM-1', title: 'Readable issue' }] }; // PM-3 is deliberately unreadable.
    if (input.path.endsWith('/messages'))
      return {
        data: input.query?.ids
          ? records.filter((row) => input.query.ids.split(',').includes(row.id))
          : records,
        meta: {
          lastSeq: 4,
          nextPageToken: input.query?.pageToken ? null : 'older',
        },
      };
    return normal(input);
  });
  function References({ message }: { message: AppUIMessage }) {
    const text = appUIMessageText(message).replace(/`[^`]*`/gu, '');
    const keys = [...new Set(text.match(/PM-\d+/gu) ?? [])];
    const query = useQuery(
      {
        queryKey: ['fixture-references', ...keys],
        queryFn: () =>
          api.request({
            path: 'fixture/references',
            query: { keys: keys.join(',') },
          }),
      },
      agentsQueryClient(),
    );
    return (
      <aside aria-label='References'>
        {query.data?.data.map((record: { key: string; title: string }) => (
          <a key={record.key} href={`/issues/${record.key}`}>
            {record.title}
          </a>
        ))}
      </aside>
    );
  }
  const extra = vi.fn((row: AppUIMessage) =>
    row.role === 'assistant' ? <References message={row} /> : null,
  );
  const extensions: ChatExtensions = {
    useTimelineItems: (id, version) => {
      const query = useQuery(
        {
          queryKey: ['fixture-plans', id, version],
          queryFn: () => api.request({ path: 'fixture/plans' }),
        },
        agentsQueryClient(),
      );
      return (
        query.data?.data.map(
          (plan: { id: string; title: string; at: string }) => ({
            key: plan.id,
            at: plan.at,
            node: <article>{plan.title}</article>,
          }),
        ) ?? []
      );
    },
    renderMessageExtra: extra,
    renderNews: (news) =>
      news.type === 'delegated' ? <article>Delegation card</article> : null,
    newsText: (news) =>
      news.type === 'translated' ? 'Translated notification' : null,
  };
  await setup('en-US', extensions);
  act(() => panel.openChat({ conversationId: 'saved' }));
  await waitFor(() =>
    expect(screen.getByText('Second block: PM-3')).toBeVisible(),
  );
  expect(await screen.findByText('Plan revision 1')).toBeVisible();
  expect(await screen.findByText('Readable issue')).toBeVisible();
  const log = screen.getByRole('log');
  const assertOrder = () => {
    expect(
      [...log.querySelectorAll('ol[aria-label="Messages"] > li')]
        .filter((node) => !node.querySelector('[data-chat-feedback]'))
        .map(
          (node) =>
            node.getAttribute('data-message-id') ??
            node.getAttribute('data-chat-item'),
        ),
    ).toEqual(['logical-run', 'plan-1', 'independent', 'logical-run']);
    const bubbles = log.querySelectorAll<HTMLElement>(
      '[data-message-id="logical-run"]',
    );
    expect(bubbles).toHaveLength(2);
    expect(within(bubbles[0]).getByText(/First block:/)).toBeVisible();
    expect(within(bubbles[0]).queryByText('Second block: PM-3')).toBeNull();
    expect(within(bubbles[1]).getByText('Second block: PM-3')).toBeVisible();
    expect(within(bubbles[1]).queryByText(/First block:/)).toBeNull();
    expect(within(log).getAllByText('Second block: PM-3')).toHaveLength(1);
    expect(within(log).getAllByText(/First block:/)).toHaveLength(1);
    expect(within(log).getAllByText('Delegation card')).toHaveLength(1);
    expect(within(log).getAllByLabelText('References')).toHaveLength(1);
    expect(log.querySelector('a[href="/issues/PM-3"]')).toBeNull();
  };
  assertOrder();
  expect(
    extra.mock.calls
      .filter(([row]) => row.id === 'logical-run')
      .every(
        ([row]) =>
          row ===
          extra.mock.calls.find(
            ([message]) => message.id === 'logical-run',
          )?.[0],
      ),
  ).toBe(true);
  const referenceRequest = host.request.mock.calls.find(
    ([request]) => request.path === 'fixture/references',
  )![0];
  expect(referenceRequest.query.keys).toBe('PM-1,PM-3');
  expect(
    within(screen.getByLabelText('References')).queryByText('PM-2'),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Earlier messages' }));
  await waitFor(() =>
    expect(host.request).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ pageToken: 'older' }),
      }),
    ),
  );
  assertOrder();
  revision = 2;
  records = [
    { ...reply, metadata: { ...reply.metadata!, revision: 2 } },
    notice,
  ];
  const callbacks = host.realtime.watch.mock.calls as unknown as [
    string,
    { onEvent: (event: { payload: unknown }) => void },
  ][];
  act(() =>
    callbacks
      .filter(([topic]) => topic === 'agents:conversations')
      .forEach(([, listener]) =>
        listener.onEvent({
          payload: {
            kind: 'conversation.messageUpdated',
            conversationId: 'saved',
            messageId: 'logical-run',
            revision: 2,
          },
        }),
      ),
  );
  expect(await screen.findByText('Plan revision 2')).toBeVisible();
  await waitFor(() =>
    expect(extra).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'logical-run',
        metadata: expect.objectContaining({ revision: 2 }),
      }),
    ),
  );
  assertOrder();
  revision = 3;
  await act(async () => {
    await agentsQueryClient().invalidateQueries({
      queryKey: ['fixture-plans'],
    });
  });
  await waitFor(() =>
    expect(screen.getByText('Plan revision 3')).toBeVisible(),
  );
  assertOrder();
});

it.each(['en-US', 'zh-CN'])(
  'renders a historical consultation with plans in %s without a quantity prompt',
  async (locale) => {
    const cardRuntime = await createTestI18nRuntime({
      application: {
        namespace: 'consultation-test',
        resources: {
          'en-US': () => Promise.resolve({ default: enUS }),
          'zh-CN': () => Promise.resolve({ default: zhCN }),
        },
      },
    });
    await cardRuntime.changeLanguage(locale);
    render(
      <TestI18nProvider runtime={cardRuntime}>
        <ConsultationCard
          notice={{
            code: 'consultation',
            callId: 'historic',
            agentId: 'agent',
            agentName: 'Review agent',
            runId: null,
            question: 'Review this change',
            answer: 'The change is ready.',
            state: 'completed',
            error: null,
            usage: { inputTokens: 1840, outputTokens: 212 },
            plans: 3,
          }}
        />
      </TestI18nProvider>,
    );
    fireEvent.click(
      screen.getByTestId('chat-consultation').querySelector('button')!,
    );
    expect(await screen.findByText('The change is ready.')).toBeVisible();
    expect(screen.getByText(/1,840/)).toBeVisible();
    expect(
      screen.queryByText(/Proposed .*plans|提出了.*计划/u),
    ).not.toBeInTheDocument();
  },
);

it.each(['assistant', 'system'] as const)(
  'keeps application-only extras for invisible %s messages in history',
  async (role) => {
    const hidden: AppUIMessage = {
      ...message,
      id: 'application-only',
      role,
      metadata: { ...message.metadata!, seq: 2 },
      parts: [
        {
          type: 'data-notice',
          id: 'execution-status',
          data: { type: 'completed', title: 'Completed' },
        },
      ],
    };
    const original = host.request.getMockImplementation()!;
    host.request.mockImplementation(async (input) =>
      input.path.endsWith('/messages')
        ? { data: [message, hidden], meta: { lastSeq: 2 } }
        : original(input),
    );
    await setup('en-US', {
      renderMessageExtra: (row) =>
        row.id === hidden.id ? <article>Application-only card</article> : null,
    });
    act(() => panel.openChat({ conversationId: 'saved' }));
    expect(await screen.findByText('Application-only card')).toBeVisible();
    expect(screen.getAllByText('Application-only card')).toHaveLength(1);
    expect(screen.queryByText('Completed', { exact: true })).toBeNull();
    expect(
      document.querySelector(
        '[data-message-id="application-only"] .rounded-lg',
      ),
    ).toBeNull();
    expect(
      document.querySelector('[data-message-id="application-only"]')
        ?.previousElementSibling,
    ).toHaveAttribute('data-message-id', message.id);
  },
);

it('lists the conversations on the left while covering the content, with the archived toggle at the foot', async () => {
  await setup();
  const panelElement = await screen.findByTestId('chat-panel');
  fireEvent.click(await screen.findByTestId('chat-expand'));
  await waitFor(() =>
    expect(panelElement).toHaveAttribute('data-mode', 'expanded'),
  );
  const split = screen.getByTestId('chat-split');
  const history = within(split).getByTestId('chat-history');
  expect(within(history).getByTestId('chat-history-header')).toContainElement(
    within(history).getByTestId('chat-new-conversation'),
  );
  expect(await within(history).findByText('Saved conversation')).toBeVisible();
  expect(history.lastElementChild).toContainElement(
    within(history).getByTestId('chat-history-archived'),
  );
  // Only the online agent is configured: no switch.
  expect(screen.queryByTestId('chat-mode-switch')).not.toBeInTheDocument();
  fireEvent.keyDown(panelElement, { key: 'Escape' });
  await waitFor(() =>
    expect(panelElement).toHaveAttribute('data-mode', 'docked'),
  );
});

it.each([
  [
    'imageCapability',
    '所选模型尚未配置图片输入能力，请切换已确认支持图片的模型。',
  ],
  [
    'unreadable',
    '附件中没有可读取的文字。纯图片或扫描文档需要先做 OCR 文字识别。',
  ],
  [
    'documentTooLarge',
    '附件提取出的文字超出限制，请拆分文档或使用更小的文件。',
  ],
  ['__proto__', '无法准备附件，请检查文件访问权限和格式后重试。'],
  [undefined, '执行失败。再次执行前请查看已保存历史，核对可能已完成的操作。'],
] as const)(
  'renders stored failure %s safely in the real Examples panel',
  async (reason, expected) => {
    const previous = host.request.getMockImplementation();
    if (!previous) throw new Error('Missing request fixture.');
    const failure: AppUIMessage = {
      ...message,
      parts: [
        {
          type: 'data-notice',
          id: 'execution-status',
          data: {
            type: 'failed',
            title: reason ? 'private-provider-response' : 'Interrupted',
            ...(reason ? { params: { fileInputReason: reason } } : {}),
          },
        },
      ],
    };
    host.request.mockImplementation(async (input: { path: string }) =>
      input.path.endsWith('/messages')
        ? { data: [failure], meta: { lastSeq: 1 } }
        : previous(input),
    );
    await setup('zh-CN');
    act(() => panel.openChat({ conversationId: 'saved' }));
    expect(await screen.findByText(expected)).toBeVisible();
    expect(screen.queryByText('private-provider-response')).toBeNull();
    expect(screen.queryByText('Interrupted')).toBeNull();
  },
);
