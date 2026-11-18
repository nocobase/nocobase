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
async function openPicker(user = userEvent.setup()) {
  const picker = await screen.findByTestId('chat-model-picker');
  await waitFor(() => expect(picker).toBeEnabled());
  await user.click(picker);
  await screen.findByRole('menu');
  return picker;
}
const control = () => screen.getByTestId('chat-thinking-control');
const summary = () => screen.getByTestId('agent-picker-model-summary');
const configPatches = () =>
  host.request.mock.calls
    .map(([input]) => input)
    .filter(
      (input) =>
        input.path === 'agents/conversations/c/config' &&
        input.method === 'PATCH',
    )
    .map((input) => input.json);

it('edits thinking below the selected model without a second menu or Done button, and saves only successful choices', async () => {
  mount();
  expect(screen.queryByTestId('chat-thinking-menu')).toBeNull();
  const user = userEvent.setup();
  const picker = await openPicker(user);
  expect(control()).toHaveAccessibleName('Thinking level: Default');
  expect(summary()).toHaveTextContent('· Default');
  expect(picker).toHaveAccessibleName(/Thinking level: Default/);
  expect(control().closest('[data-model-option]')).toHaveAttribute(
    'data-model-option',
    'first',
  );
  expect(
    screen.getAllByRole('menuitemradio').map((item) => item.textContent),
  ).toEqual(['Default', 'Off', 'Low', 'High']);
  expect(screen.queryByRole('button', { name: /done/i })).toBeNull();
  await user.click(screen.getByRole('menuitemradio', { name: 'High' }));
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: High'),
  );
  expect(screen.getByRole('menu')).toBeVisible();
  expect(configPatches()).toEqual([{ config: { thinking: 'high' } }]);
  expect(readThinking('/', first)).toBe('high');
  expect(summary()).toHaveTextContent('· High');
  expect(picker).toHaveAccessibleName(/Thinking level: High/);
  await waitFor(() =>
    expect(
      screen.getByRole('menuitemradio', { name: 'Default' }),
    ).not.toHaveAttribute('aria-disabled', 'true'),
  );
  await user.click(screen.getByRole('menuitemradio', { name: 'Default' }));
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: Default'),
  );
  expect(readThinking('/', first)).toBe('default');
  expect(summary()).toHaveTextContent('· Default');
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  expect(picker).toHaveFocus();
});

it('shows the conversation’s saved level over the one remembered for the model', async () => {
  rememberThinking('/', first, 'high');
  config = { ...config, thinking: 'low' };
  mount();
  await openPicker();
  expect(control()).toHaveAccessibleName('Thinking level: Low');
  expect(summary()).toHaveTextContent('· Low');
  expect(configPatches()).toEqual([]);
});

it('switches inline settings and model memory, and immediately closes for a model without thinking levels', async () => {
  rememberThinking('/', second, 'low');
  rememberThinking('/', third, 'high');
  mount();
  const user = userEvent.setup();
  const picker = await openPicker(user);
  await user.click(
    screen.getByRole('menuitem', { name: 'Second model Local' }),
  );
  await waitFor(() => expect(picker).toHaveTextContent('Second model'));
  expect(
    screen.getAllByRole('menuitemradio').map((item) => item.textContent),
  ).toEqual(['Default', 'Low']);
  expect(screen.getAllByTestId('chat-thinking-control')).toHaveLength(1);
  expect(control().closest('[data-model-option]')).toHaveAttribute(
    'data-model-option',
    'second',
  );
  await waitFor(() =>
    expect(
      screen.getByRole('menuitem', { name: 'Third model Local' }),
    ).not.toHaveAttribute('aria-disabled', 'true'),
  );
  await user.click(screen.getByRole('menuitem', { name: 'Third model Local' }));
  await waitFor(() => expect(picker).toHaveTextContent('Third model'));
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  expect(configPatches()).toEqual([
    { config: { thinking: 'low' }, selectedModel: second },
    { config: { thinking: 'default' }, selectedModel: third },
  ]);
  await openPicker(user);
  expect(screen.queryByTestId('chat-thinking-control')).toBeNull();
  expect(screen.queryByTestId('agent-picker-model-summary')).toBeNull();
});

it('keeps the saved and remembered level when saving fails', async () => {
  rememberThinking('/', first, 'low');
  config = { ...config, thinking: 'low' };
  patch = async () => {
    throw Object.assign(new Error('Refused'), { status: 400 });
  };
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  await user.click(screen.getByRole('menuitemradio', { name: 'High' }));
  await waitFor(() => expect(configPatches()).toHaveLength(1));
  expect(readThinking('/', first)).toBe('low');
  expect(control()).toHaveAccessibleName('Thinking level: Low');
  expect(summary()).toHaveTextContent('· Low');
});

it('uses a real switch with a separate default and never closes while toggling', async () => {
  rememberThinking('/', fourth, 'high');
  config = { ...config, selectedModel: fourth };
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  expect(screen.getByRole('switch')).toHaveAccessibleName(
    'Thinking level: Default',
  );
  expect(screen.getByRole('switch')).not.toBeChecked();
  expect(screen.getByRole('menuitemradio', { name: 'Default' })).toBeChecked();
  await user.click(screen.getByRole('switch'));
  await waitFor(() =>
    expect(screen.getByRole('switch')).toHaveAccessibleName(
      'Thinking level: On',
    ),
  );
  await waitFor(() => expect(screen.getByRole('switch')).toBeEnabled());
  expect(summary()).toHaveTextContent('· On');
  await user.click(screen.getByRole('switch'));
  await waitFor(() =>
    expect(screen.getByRole('switch')).toHaveAccessibleName(
      'Thinking level: Off',
    ),
  );
  expect(screen.getByRole('switch')).not.toBeChecked();
  expect(
    screen.getByRole('menuitemradio', { name: 'Default' }),
  ).not.toBeChecked();
  expect(readThinking('/', fourth)).toBe('off');
  expect(summary()).toHaveTextContent('· Off');
  await waitFor(() =>
    expect(
      screen.getByRole('menuitemradio', { name: 'Default' }),
    ).not.toHaveAttribute('aria-disabled', 'true'),
  );
  await user.click(screen.getByRole('menuitemradio', { name: 'Default' }));
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: Default'),
  );
  expect(configPatches()).toEqual([
    { config: { thinking: 'high' } },
    { config: { thinking: 'off' } },
    { config: { thinking: 'default' } },
  ]);
  expect(readThinking('/', fourth)).toBe('default');
  expect(summary()).toHaveTextContent('· Default');
  expect(screen.getByRole('menu')).toBeVisible();
});

it('restores the switch’s remembered state when switching to its model', async () => {
  rememberThinking('/', fourth, 'off');
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  await user.click(
    screen.getByRole('menuitem', { name: 'Fourth model Local' }),
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

it('supports horizontal keyboard navigation without changing a level until activated', async () => {
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  screen.getByRole('menuitemradio', { name: 'Default' }).focus();
  await user.keyboard('{End}');
  expect(screen.getByRole('menuitemradio', { name: 'High' })).toHaveFocus();
  await user.keyboard('{ArrowLeft}');
  expect(screen.getByRole('menuitemradio', { name: 'Low' })).toHaveFocus();
  expect(configPatches()).toEqual([]);
  await user.keyboard('{Enter}');
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: Low'),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('menuitemradio', { name: 'Default' }),
    ).not.toHaveAttribute('aria-disabled', 'true'),
  );
  await user.keyboard('{Home}');
  expect(screen.getByRole('menuitemradio', { name: 'Default' })).toHaveFocus();
});

it('keeps the menu mounted and blocks repeat changes while saving a level', async () => {
  let resolve!: (value: OnlineChatConfigSnapshot) => void;
  patch = () =>
    new Promise((done) => {
      resolve = done;
    });
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  await user.click(screen.getByRole('menuitemradio', { name: 'High' }));
  await waitFor(() =>
    expect(screen.getByRole('menuitemradio', { name: 'Low' })).toHaveAttribute(
      'aria-disabled',
      'true',
    ),
  );
  expect(screen.getByRole('menu')).toBeVisible();
  expect(readThinking('/', first)).toBeNull();
  resolve({ ...config, thinking: 'high' });
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: High'),
  );
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
