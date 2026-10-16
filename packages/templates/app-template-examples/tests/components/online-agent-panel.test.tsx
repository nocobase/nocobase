import {
  agentsQueryClient,
  ChatProvider,
  useChatPanel,
  type ChatPanelState,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ChatAgent,
  ConversationDetail,
  ConversationMessage,
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
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  realtime: { subscribe: vi.fn(() => vi.fn()), onOpen: vi.fn(() => vi.fn()) },
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

const message: ConversationMessage = {
  id: 'reply',
  conversationId: 'saved',
  seq: 1,
  role: 'assistant',
  content: { type: 'text', content: 'Saved reply remains readable.' },
  metadata: {},
  toolCalls: null,
  attachments: null,
  createdAt: '2026-01-01T00:00:00Z',
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

async function setup(locale = 'en-US') {
  await runtime.changeLanguage(locale);
  const tree = render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter basename='/demo' initialEntries={['/demo/']}>
        <OnlineAgentIdentityScope>
          <ChatProvider>
            <Probe />
            <ChatHeaderButton />
            <OnlineAgentExample />
            <OnlineAgentPanel />
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
  'guides model configuration in %s, preserves the draft and never sends without a chat model',
  async (locale) => {
    await setup(locale);
    expect(
      await screen.findByText(
        locale === 'zh-CN' ? '尚未配置聊天模型' : 'No chat model configured',
      ),
    ).toBeVisible();
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
  const normal = host.request.getMockImplementation()!;
  host.catalog.mockResolvedValue(models);
  host.request.mockImplementation((input) =>
    input.path.endsWith('/messages') && input.method === 'POST'
      ? Promise.reject({
          domain: 'agents',
          reason: 'INVALID_REQUEST',
          status: 400,
        })
      : normal(input),
  );
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
