import {
  agentsQueryClient,
  ChatProvider,
  readThinking,
  rememberThinking,
  CHAT_THINKING_STORAGE_KEY,
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
import { ConversationView } from '../../registry/agents/agent-chat/conversation-view';
import enUS from '../../registry/agents/agent-chat/locales/en-US';

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
                capabilities: { webSearch: true },
              },
              {
                value: 'second',
                label: 'Second model',
                kind: 'chat',
                capabilities: { webSearch: false },
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
                capabilities: { webSearch: false },
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
  ).toEqual([
    'Default',
    'Off',
    'Minimal',
    'Low',
    'Medium',
    'High',
    'Extra high',
  ]);
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
  expect(configPatches()).toEqual([
    { config: { thinking: 'high' } },
    { config: { thinking: 'provider-default' } },
  ]);
  expect(readThinking('/', first)).toBe('provider-default');
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

it('shows a saved value that is not one of the seven levels with none checked, so choosing Default saves provider-default', async () => {
  config = { ...config, thinking: 'off' };
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  for (const item of screen.getAllByRole('menuitemradio'))
    expect(item).not.toBeChecked();
  await user.click(screen.getByRole('menuitemradio', { name: 'Default' }));
  await waitFor(() =>
    expect(configPatches()).toEqual([
      { config: { thinking: 'provider-default' } },
    ]),
  );
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: Default'),
  );
});

it('switches inline settings and model memory, keeping the menu open on every model', async () => {
  rememberThinking('/', second, 'low');
  rememberThinking('/', third, 'xhigh');
  mount();
  const user = userEvent.setup();
  const picker = await openPicker(user);
  await user.click(
    screen.getByRole('menuitem', { name: 'Second model Local' }),
  );
  await waitFor(() => expect(picker).toHaveTextContent('Second model'));
  expect(
    screen.getAllByRole('menuitemradio').map((item) => item.textContent),
  ).toEqual([
    'Default',
    'Off',
    'Minimal',
    'Low',
    'Medium',
    'High',
    'Extra high',
  ]);
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
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: Extra high'),
  );
  expect(screen.getByRole('menu')).toBeVisible();
  expect(summary()).toHaveTextContent('· Extra high');
  expect(configPatches()).toEqual([
    { config: { thinking: 'low' }, selectedModel: second },
    { config: { thinking: 'xhigh' }, selectedModel: third },
  ]);
});

it('restores a remembered none, and ignores a remembered value that is not one of the seven levels', async () => {
  rememberThinking('/', fourth, 'none');
  window.localStorage.setItem(
    `${CHAT_THINKING_STORAGE_KEY}:/`,
    JSON.stringify({
      ...JSON.parse(
        window.localStorage.getItem(`${CHAT_THINKING_STORAGE_KEY}:/`) ?? '{}',
      ),
      'local:second': 'off',
    }),
  );
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  await user.click(
    screen.getByRole('menuitem', { name: 'Fourth model Local' }),
  );
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: Off'),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('menuitem', { name: 'Second model Local' }),
    ).not.toHaveAttribute('aria-disabled', 'true'),
  );
  await user.click(
    screen.getByRole('menuitem', { name: 'Second model Local' }),
  );
  await waitFor(() => expect(configPatches()).toHaveLength(2));
  expect(configPatches()).toEqual([
    { config: { thinking: 'none' }, selectedModel: fourth },
    { config: {}, selectedModel: second },
  ]);
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

it('supports horizontal keyboard navigation without changing a level until activated', async () => {
  mount();
  const user = userEvent.setup();
  await openPicker(user);
  screen.getByRole('menuitemradio', { name: 'Default' }).focus();
  await user.keyboard('{End}');
  expect(
    screen.getByRole('menuitemradio', { name: 'Extra high' }),
  ).toHaveFocus();
  await user.keyboard('{ArrowLeft}');
  await user.keyboard('{ArrowRight}');
  expect(
    screen.getByRole('menuitemradio', { name: 'Extra high' }),
  ).toHaveFocus();
  expect(configPatches()).toEqual([]);
  await user.keyboard('{Enter}');
  await waitFor(() =>
    expect(control()).toHaveAccessibleName('Thinking level: Extra high'),
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
