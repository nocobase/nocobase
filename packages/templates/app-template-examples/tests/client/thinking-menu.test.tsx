import {
  agentsQueryClient,
  ChatProvider,
  readThinking,
  rememberThinking,
  thinkingControlOf,
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
import { render, screen, waitFor } from '@testing-library/react';
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
  useRealtimeReadiness: () => true,
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
const third = { modelService: 'local', model: 'third' };
const fourth = { modelService: 'local', model: 'fourth' };
let patch: (body: {
  config: { thinking?: string };
  selectedModel?: typeof first;
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
  window.localStorage.clear();
  host.request.mockReset();
  host.resendPending = false;
  host.stream.mockReset();
  config = {
    selectedModel: first,
    scope: ['business'],
    model: ['local/first', 'local/second', 'local/third', 'local/fourth'],
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
    (config = {
      ...config,
      ...(body.selectedModel ? { selectedModel: body.selectedModel } : {}),
      ...(body.config.thinking ? { thinking: body.config.thinking } : {}),
    });
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
                capabilities: {
                  webSearch: true,
                  reasoning: { levels: ['off', 'low', 'high'] },
                },
              },
              {
                value: 'second',
                label: 'Second model',
                kind: 'chat',
                capabilities: {
                  webSearch: false,
                  reasoning: { levels: ['low'] },
                },
              },
              {
                value: 'third',
                label: 'Third model',
                kind: 'chat',
                capabilities: { webSearch: false },
              },
              {
                value: 'fourth',
                label: 'Fourth model',
                kind: 'chat',
                capabilities: {
                  webSearch: false,
                  reasoning: { levels: ['off', 'high'] },
                },
              },
            ],
          },
        ],
      };
    if (path === 'agents/chatAgents') return { data: [] };
    throw new Error('Unexpected request: ' + method + ' ' + path);
  });
});
afterEach(() => agentsQueryClient().clear());
const menu = () => screen.findByTestId('chat-thinking-menu');
const configPatches = () =>
  host.request.mock.calls
    .map(([input]) => input)
    .filter(
      (input) =>
        input.path === 'agents/conversations/c/config' &&
        input.method === 'PATCH',
    )
    .map((input) => input.json);

it('chooses a model’s thinking level beside the model, saves it to the conversation and remembers it for the model', async () => {
  mount();
  const trigger = await menu();
  await waitFor(() => expect(trigger).toBeEnabled());
  expect(trigger).toHaveAccessibleName('Thinking level: Default');
  const user = userEvent.setup();
  await user.click(trigger);
  expect(
    (await screen.findAllByRole('menuitemradio')).map(
      (item) => item.textContent,
    ),
  ).toEqual(['Default', 'Off', 'Low', 'High']);
  await user.click(screen.getByRole('menuitemradio', { name: 'High' }));
  await waitFor(() =>
    expect(trigger).toHaveAccessibleName('Thinking level: High'),
  );
  expect(configPatches()).toEqual([{ config: { thinking: 'high' } }]);
  expect(readThinking('/', first)).toBe('high');
  // Default stays a choice, restoring the provider's own setting.
  await user.click(await menu());
  await user.click(
    await screen.findByRole('menuitemradio', { name: 'Default' }),
  );
  await waitFor(async () =>
    expect(await menu()).toHaveAccessibleName('Thinking level: Default'),
  );
  expect(readThinking('/', first)).toBe('default');
});

it('shows the conversation’s saved level over the one remembered for the model', async () => {
  rememberThinking('/', first, 'high');
  config = { ...config, thinking: 'low' };
  mount();
  expect(await menu()).toHaveAccessibleName('Thinking level: Low');
  expect(configPatches()).toEqual([]);
});

it('switches models with the level remembered for the new one, or default when it no longer takes it', async () => {
  rememberThinking('/', second, 'low');
  rememberThinking('/', third, 'high');
  mount();
  const picker = await screen.findByTestId('chat-model-picker');
  await waitFor(() => expect(picker).toBeEnabled());
  const user = userEvent.setup();
  await user.click(screen.getByText('First model'));
  await user.click(
    await screen.findByRole('menuitem', { name: 'Second model Local' }),
  );
  await waitFor(() => expect(picker).toHaveTextContent('Second model'));
  // One level and no off: still a menu, with default.
  await user.click(await menu());
  expect(
    (await screen.findAllByRole('menuitemradio')).map(
      (item) => item.textContent,
    ),
  ).toEqual(['Default', 'Low']);
  await user.keyboard('{Escape}');
  await user.click(screen.getByText('Second model'));
  await user.click(
    await screen.findByRole('menuitem', { name: 'Third model Local' }),
  );
  await waitFor(() => expect(picker).toHaveTextContent('Third model'));
  expect(configPatches()).toEqual([
    { config: { thinking: 'low' }, selectedModel: second },
    { config: { thinking: 'default' }, selectedModel: third },
  ]);
  // A model that takes only the provider's default shows no menu.
  expect(screen.queryByTestId('chat-thinking-menu')).toBeNull();
});

it('keeps the remembered level when saving it fails', async () => {
  rememberThinking('/', first, 'low');
  patch = async () => {
    throw Object.assign(new Error('Refused'), { status: 400 });
  };
  mount();
  const trigger = await menu();
  await waitFor(() => expect(trigger).toBeEnabled());
  const user = userEvent.setup();
  await user.click(trigger);
  await user.click(await screen.findByRole('menuitemradio', { name: 'High' }));
  await waitFor(() => expect(configPatches()).toHaveLength(1));
  expect(readThinking('/', first)).toBe('low');
});

it('turns thinking on and off with a real switch for a model with off and one level, and goes back to the default', async () => {
  rememberThinking('/', fourth, 'high');
  config = { ...config, selectedModel: fourth };
  mount();
  const toggle = await screen.findByRole('switch');
  await waitFor(() => expect(toggle).toBeEnabled());
  // The conversation has no level yet: the provider's default, neither on nor off.
  expect(toggle).toHaveAccessibleName('Thinking level: Default');
  expect(toggle).toHaveAttribute('aria-checked', 'false');
  expect(screen.queryByTestId('chat-thinking-menu')).toBeNull();
  expect(screen.queryByTestId('chat-thinking-default')).toBeNull();
  const user = userEvent.setup();
  await user.click(toggle);
  await waitFor(() =>
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'),
  );
  expect(screen.getByRole('switch')).toHaveAccessibleName('Thinking level: On');
  await user.click(screen.getByRole('switch'));
  await waitFor(() =>
    expect(screen.getByRole('switch')).toHaveAccessibleName(
      'Thinking level: Off',
    ),
  );
  expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  expect(readThinking('/', fourth)).toBe('off');
  await user.click(
    screen.getByRole('button', { name: 'Use the provider default' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('switch')).toHaveAccessibleName(
      'Thinking level: Default',
    ),
  );
  expect(configPatches()).toEqual([
    { config: { thinking: 'high' } },
    { config: { thinking: 'off' } },
    { config: { thinking: 'default' } },
  ]);
  expect(readThinking('/', fourth)).toBe('default');
});

it('restores the switch’s remembered state when switching to its model', async () => {
  rememberThinking('/', fourth, 'off');
  mount();
  const picker = await screen.findByTestId('chat-model-picker');
  await waitFor(() => expect(picker).toBeEnabled());
  const user = userEvent.setup();
  await user.click(screen.getByText('First model'));
  await user.click(
    await screen.findByRole('menuitem', { name: 'Fourth model Local' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('switch')).toHaveAccessibleName(
      'Thinking level: Off',
    ),
  );
  expect(configPatches()).toEqual([
    { config: { thinking: 'off' }, selectedModel: fourth },
  ]);
});

it('picks a switch, a menu or nothing from a model’s levels', () => {
  expect(thinkingControlOf(undefined)).toEqual({ kind: 'none' });
  expect(
    thinkingControlOf({ webSearch: false, reasoning: { levels: ['off'] } }),
  ).toEqual({ kind: 'menu', levels: ['default', 'off'] });
  expect(
    thinkingControlOf({
      webSearch: false,
      reasoning: { levels: ['high', 'off'] },
    }),
  ).toEqual({ kind: 'toggle', levels: ['default', 'off', 'high'], on: 'high' });
  expect(
    thinkingControlOf({
      webSearch: false,
      reasoning: { levels: ['low', 'max'] },
    }),
  ).toEqual({ kind: 'menu', levels: ['default', 'low', 'max'] });
});
