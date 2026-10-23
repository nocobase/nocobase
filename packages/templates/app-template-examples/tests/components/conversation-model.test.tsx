import {
  agentsQueryClient,
  ChatProvider,
  chatKeys,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ConversationDetail,
  OnlineChatConfigSnapshot,
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
import { ConversationView } from '../../client/extensions/nocobase-agent-chat/conversation-view';
import enUS from '../../client/extensions/nocobase-agent-chat/locales/en-US';

const host = vi.hoisted(() => ({
  request: vi.fn(),
  resendPending: false,
  stream: vi.fn(),
  show: vi.fn(),
  realtime: { watch: () => ({ close: () => {} }) },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => host,
  useService: () => host.realtime,
  useToaster: () => ({ show: host.show }),
}));
vi.mock('@nocobase/app-plugin-agents/client/chat', async (original) => {
  const actual =
    await original<typeof import('@nocobase/app-plugin-agents/client/chat')>();
  return {
    ...actual,
    useResendMessage: (
      ...args: Parameters<typeof actual.useResendMessage>
    ) => ({
      ...actual.useResendMessage(...args),
      isPending: host.resendPending,
    }),
  };
});
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'model-choice-test',
    resources: { ...enUS, status: { loading: 'Loading' } },
  },
});
const first = { modelService: 'local', model: 'first' };
const second = { modelService: 'local', model: 'second' };
let config: OnlineChatConfigSnapshot;
let detail: ConversationDetail;
let patch: (body: {
  selectedModel: typeof first;
}) => Promise<OnlineChatConfigSnapshot>;
function Open() {
  const { openChat } = useChatPanel();
  useLayoutEffect(() => openChat({ conversationId: 'c' }), [openChat]);
  return null;
}
function scene() {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider>
          <Open />
          <ConversationView conversationId='c' />
        </ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
function mount() {
  return render(scene());
}
beforeEach(() => {
  agentsQueryClient().clear();
  host.request.mockReset();
  host.resendPending = false;
  host.stream.mockReset();
  config = {
    selectedModel: first,
    scope: ['business'],
    model: ['local/first', 'local/second'],
    tool: ['read'],
    toolVersions: { read: '1' },
    systemPrompt: 'Keep me',
  };
  detail = {
    id: 'c',
    title: 'Existing chat',
    titleSource: 'user',
    category: 'chat',
    showInChatList: true,
    source: 'panel',
    mode: 'online',
    agent: {
      id: 'online',
      name: 'Online agent',
      nameText: null,
      avatar: null,
      archived: false,
    },
    fallbackFrom: null,
    read: true,
    lastMessageAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    archivedAt: null,
    run: null,
    execution: { status: 'idle' },
    availability: { online: true, reason: null, onlineRunners: 0 },
    canFallback: false,
    canRestore: false,
  };
  patch = async (body) =>
    (config = { ...config, selectedModel: body.selectedModel });
  host.request.mockImplementation(async ({ path, method = 'GET', json }) => {
    if (path === 'agents/conversations/c/config')
      return { data: method === 'PATCH' ? await patch(json) : config };
    if (path === 'agents/conversations/c') return { data: detail };
    if (path === 'agents/conversations/c/messages')
      return { data: [], meta: { lastSeq: 0 } };
    if (path === 'agents/models')
      return {
        data: [
          {
            name: 'local',
            title: 'Local',
            models: [
              {
                value: 'first',
                label: 'First model',
                kind: 'chat',
                capabilities: { webSearch: true },
              },
              { value: 'second', label: 'Second model', kind: 'chat' },
              { value: 'forbidden', label: 'Outside scope', kind: 'chat' },
            ],
          },
        ],
      };
    if (path === 'agents/chatAgents') return { data: [] };
    throw new Error('Unexpected request: ' + method + ' ' + path);
  });
});
afterEach(() => agentsQueryClient().clear());
async function ready() {
  const picker = await screen.findByTestId('chat-model-picker');
  await waitFor(() => expect(picker).toBeEnabled());
  expect(picker).toHaveTextContent('First model');
  return picker;
}
it('persists the search toggle through the shared config patch and disables it for unsupported models', async () => {
  mount();
  await ready();
  const button = screen.getByTestId('chat-web-search-toggle');
  expect(button).toHaveAccessibleName(enUS.chat.webSearch.toggle);
  expect(button).toHaveTextContent('');
  expect(button.querySelector('svg')).not.toBeNull();
  expect(
    screen.getByTestId('chat-attach').nextElementSibling?.firstElementChild,
  ).toBe(button);
  expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(button).toBeEnabled();
  patch = async () => (config = { ...config, webSearch: true });
  fireEvent.click(button);
  await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'));
  expect(host.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'agents/conversations/c/config',
      method: 'PATCH',
      json: { config: { webSearch: true } },
    }),
  );
  expect(config.scope).toEqual(['business']);
  config = { ...config, selectedModel: second, webSearch: false };
  await act(async () => {
    await agentsQueryClient().invalidateQueries({
      queryKey: chatKeys.configuration('c'),
      exact: true,
    });
  });
  await waitFor(() => expect(button).toBeDisabled());
  expect(button).toHaveAttribute('aria-pressed', 'false');
});
it('shows only allowed models in an existing native conversation and saves the choice without creating a conversation', async () => {
  mount();
  const picker = await ready();
  const user = userEvent.setup();
  await user.click(screen.getByText('First model'));
  await screen.findByRole('menu');
  expect(
    screen.getByRole('searchbox', { name: 'Search models' }),
  ).toBeVisible();
  expect(screen.queryByText('Outside scope')).toBeNull();
  expect(screen.queryByRole('menuitem', { name: /Agent/ })).toBeNull();
  await user.click(
    screen.getByRole('menuitem', { name: 'Second model Local' }),
  );
  await waitFor(() => expect(picker).toHaveTextContent('Second model'));
  expect(host.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'agents/conversations/c/config',
      method: 'PATCH',
      json: { config: {}, selectedModel: second },
    }),
  );
  expect(
    host.request.mock.calls.some(([input]) => input.method === 'POST'),
  ).toBe(false);
  expect(screen.queryByTestId('chat-agent-picker')).toBeNull();
});
it.each(['absent', 'empty'] as const)(
  'offers all chat models when the saved restriction is %s',
  async (restriction) => {
    if (restriction === 'absent') {
      const { model: _model, ...unrestricted } = config;
      config = unrestricted;
    } else config = { ...config, model: [] };
    mount();
    const picker = await ready();
    const user = userEvent.setup();
    await user.click(screen.getByText('First model'));
    await screen.findByRole('menu');
    expect(
      screen.getByRole('menuitem', { name: 'Second model Local' }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('menuitem', { name: 'Outside scope Local' }),
    );
    await waitFor(() => expect(picker).toHaveTextContent('Outside scope'));
    expect(config.selectedModel).toEqual({
      modelService: 'local',
      model: 'forbidden',
    });
    if (restriction === 'absent') expect(config).not.toHaveProperty('model');
    else expect(config.model).toEqual([]);
  },
);
it('retains the old model and draft and blocks sending while the model update is pending', async () => {
  let finish!: () => void;
  patch = (body) =>
    new Promise((resolve) => {
      finish = () =>
        resolve((config = { ...config, selectedModel: body.selectedModel }));
    });
  mount();
  const picker = await ready();
  fireEvent.change(screen.getByLabelText('Message to the agent'), {
    target: { value: 'Keep this draft' },
  });
  const user = userEvent.setup();
  await user.click(screen.getByText('First model'));
  await screen.findByRole('menu');
  await user.click(
    screen.getByRole('menuitem', { name: 'Second model Local' }),
  );
  await waitFor(() => expect(picker).toBeDisabled());
  expect(picker).toHaveTextContent('First model');
  expect(
    screen.getByRole('button', { name: 'Send', exact: true }),
  ).toBeDisabled();
  fireEvent.keyDown(screen.getByLabelText('Message to the agent'), {
    key: 'Enter',
  });
  expect(host.stream).not.toHaveBeenCalled();
  await act(async () => finish());
  await waitFor(() => expect(picker).toBeEnabled());
  expect(picker).toHaveTextContent('Second model');
  expect(screen.getByLabelText('Message to the agent')).toHaveValue(
    'Keep this draft',
  );
  expect(
    screen.getByRole('button', { name: 'Send', exact: true }),
  ).toBeEnabled();
});
it('keeps the model picker visible but disabled during execution and approval', async () => {
  detail = {
    ...detail,
    execution: { status: 'running', waitingApproval: true },
  };
  mount();
  const picker = await screen.findByTestId('chat-model-picker');
  await waitFor(() => expect(picker).toHaveTextContent('First model'));
  expect(picker).toBeDisabled();
});
it('does not show or load native model configuration for Runner conversations', async () => {
  detail = {
    ...detail,
    mode: 'runner',
    agent: { ...detail.agent, id: 'runner' },
  };
  mount();
  await screen.findByLabelText('Message to the agent');
  expect(screen.queryByTestId('chat-model-picker')).toBeNull();
  expect(
    host.request.mock.calls.some(([input]) => input.path.endsWith('/config')),
  ).toBe(false);
});
it('reconciles a lost update response without retrying the write and lets the user explicitly re-read before sending', async () => {
  patch = async (body) => {
    config = { ...config, selectedModel: body.selectedModel };
    throw new Error('Response lost');
  };
  mount();
  const picker = await ready();
  const user = userEvent.setup();
  await user.click(screen.getByText('First model'));
  await screen.findByRole('menu');
  await user.click(
    screen.getByRole('menuitem', { name: 'Second model Local' }),
  );
  await waitFor(() => expect(picker).toHaveTextContent('Second model'));
  expect(screen.getByText(enUS.chat.errors.requestFailed)).toBeVisible();
  expect(
    host.request.mock.calls.filter(([input]) => input.method === 'PATCH'),
  ).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Retry', exact: true }));
  await waitFor(() => expect(picker).toBeEnabled());
  expect(agentsQueryClient().getQueryData(chatKeys.configuration('c'))).toEqual(
    config,
  );
});

it('blocks model and search configuration while resend admission is pending', async () => {
  const view = mount();
  const picker = await ready();
  const search = screen.getByTestId('chat-web-search-toggle');
  expect(search).toBeEnabled();
  host.resendPending = true;
  view.rerender(scene());
  expect(picker).toBeDisabled();
  expect(search).toBeDisabled();
  host.resendPending = false;
  view.rerender(scene());
  expect(picker).toBeEnabled();
  expect(search).toBeEnabled();
});
