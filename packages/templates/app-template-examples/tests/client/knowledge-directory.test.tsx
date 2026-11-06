import { useApiClient } from '@nocobase/app-client';
import {
  ChatApi,
  ChatController,
  agentsQueryClient,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import KnowledgePage from '../../client/pages/knowledge/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  KNOWLEDGE_CHAT_SCOPE,
  KNOWLEDGE_CHAT_SOURCE,
} from '../../shared/knowledge-chat.js';

const host = vi.hoisted(() => ({
  available: true,
  active: true,
  canSend: true,
  phase: 'ready' as 'ready' | 'loading' | 'error',
  openChat: vi.fn(),
  refresh: vi.fn(),
  getSession: vi.fn(async () => ({ data: null })),
  view: undefined as { space: unknown; directory?: unknown } | undefined,
}));
const ControllerContext = createContext<ChatController | null>(null);
vi.mock('@nocobase/app-plugin-agents/client/chat', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-agents/client/chat')
  >()),
  useChatPanel: () => ({ available: host.available, openChat: host.openChat }),
  useChatController: () => {
    const controller = useContext(ControllerContext);
    if (!controller) throw new Error('Missing test controller.');
    return controller;
  },
}));
vi.mock('../../client/components/online-agent/identity-context.js', () => ({
  useOnlineAgentIdentityActive: () => () => host.active,
}));
vi.mock('../../client/components/online-agent/use-model-catalog.js', () => ({
  useModelCatalog: () => ({
    canSend: host.canSend,
    phase: host.phase,
    refresh: host.refresh,
  }),
}));
vi.mock('../../client/components/online-agent/models-link.js', () => ({
  ModelsLink: () => <a href='/models'>Models</a>,
}));
// Only the adapter is under test here; Knowledge's own view tests cover its unchanged rendering/CRUD.
vi.mock('@nocobase/app-plugin-knowledge/client/pages', () => ({
  KnowledgeView: ({
    title,
    titleActions,
    ...props
  }: {
    title: ReactNode;
    titleActions: ReactNode;
    space: unknown;
    directory?: unknown;
  }) => {
    host.view = props;
    return (
      <header>
        {title}
        {titleActions}
      </header>
    );
  },
}));
const calls: ApiCall[] = [];
let response: unknown;
let resolveCreate: ((value: unknown) => void) | undefined;
const api = (call: ApiCall) => {
  calls.push(call);
  if (call.path === 'agents/conversations' && call.method === 'POST')
    return response;
  return new Response(null, { status: 404 });
};
function Page() {
  const client = useApiClient();
  const realController = useMemo(
    () => new ChatController(new ChatApi(client)),
    [client],
  );
  useEffect(() => () => realController.dispose(), [realController]);
  return (
    <ControllerContext value={realController}>
      <KnowledgePage />
    </ControllerContext>
  );
}
async function renderPage(locale = 'en-US') {
  return renderWithApp(
    <AuthenticationProvider>
      <Page />
    </AuthenticationProvider>,
    {
      locale,
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: locale === 'zh-CN' ? zhCN : enUS },
      fetch: answerApi(api),
      services: (app) => {
        app.container.instance(authenticationClientToken, {
          getSession: host.getSession,
        });
      },
    },
  );
}
async function openDialog() {
  await userEvent.click(
    screen.getByRole('button', { name: enUS.knowledge.chat.title }),
  );
  return screen.findByRole('dialog');
}
beforeEach(() => {
  agentsQueryClient().clear();
  host.available = host.active = host.canSend = true;
  host.phase = 'ready';
  host.openChat.mockReset();
  host.refresh.mockReset();
  host.getSession.mockClear();
  host.view = undefined;
  calls.length = 0;
  resolveCreate = undefined;
  response = { data: { id: 'knowledge-chat-1' } };
});
afterEach(() => agentsQueryClient().clear());

it.each(['en-US', 'zh-CN'])(
  'shows a single default space and both explanations in %s without opening chat',
  async (locale) => {
    const copy = (locale === 'zh-CN' ? zhCN : enUS).knowledge.chat;
    await renderPage(locale);
    expect(host.view).toMatchObject({
      space: { scope: 'default', scopeId: '' },
    });
    expect(host.view?.directory).toBeUndefined();
    const button = screen.getByRole('button', { name: copy.title });
    expect(button.querySelector('svg')).toHaveClass(
      'lucide-bot-message-square',
    );
    expect(
      screen.queryByRole('button', { name: enUS.knowledge.indexing }),
    ).toBeNull();
    await userEvent.click(button);
    expect(screen.getByRole('radio', { name: copy.onDemand })).toBeChecked();
    expect(screen.getByText(copy.onDemandDescription)).toBeVisible();
    expect(screen.getByText(copy.alwaysDescription)).toBeVisible();
    await userEvent.click(screen.getByRole('radio', { name: copy.always }));
    expect(calls).toEqual([]);
    expect(host.openChat).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', {
        name: (locale === 'zh-CN' ? zhCN : enUS).actions.cancel,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(calls).toEqual([]);
    expect(button).toHaveFocus();
  },
);

it.each(['on-demand', 'always'])(
  'creates once with %s through the real SDK, then opens the returned conversation without sending',
  async (policy) => {
    await renderPage();
    await openDialog();
    if (policy === 'always')
      await userEvent.click(
        screen.getByRole('radio', { name: enUS.knowledge.chat.always }),
      );
    await userEvent.click(
      screen.getByRole('button', { name: enUS.knowledge.chat.start }),
    );
    await waitFor(() =>
      expect(host.openChat).toHaveBeenCalledWith({
        conversationId: 'knowledge-chat-1',
        view: 'chat',
        draft: '',
      }),
    );
    expect(calls).toEqual([
      {
        path: 'agents/conversations',
        method: 'POST',
        json: {
          agentId: 'online',
          source: KNOWLEDGE_CHAT_SOURCE,
          title: `${enUS.knowledge.title} · ${policy === 'always' ? enUS.knowledge.chat.always : enUS.knowledge.chat.onDemand}`,
          config: {
            scope: [KNOWLEDGE_CHAT_SCOPE],
            context: { variable: { knowledgeRetrieval: policy } },
          },
        },
      },
    ]);
  },
);

it('locks same-turn duplicate confirmation and prevents closing while creating', async () => {
  response = new Promise((resolve) => {
    resolveCreate = resolve;
  });
  await renderPage();
  await openDialog();
  const button = screen.getByRole('button', {
    name: enUS.knowledge.chat.start,
  });
  act(() => {
    fireEvent.click(button);
    fireEvent.click(button);
  });
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(
    screen.getByRole('button', { name: enUS.actions.cancel }),
  ).toBeDisabled();
  await userEvent.keyboard('{Escape}');
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(host.openChat).not.toHaveBeenCalled();
  await act(async () => resolveCreate!({ data: { id: 'one-only' } }));
  await waitFor(() => expect(host.openChat).toHaveBeenCalledTimes(1));
});

it.each([400, 401, 403, 500])(
  'keeps the selected policy and distinguishes creation HTTP %s',
  async (status) => {
    response = new Response(null, { status });
    await renderPage();
    await openDialog();
    await userEvent.click(
      screen.getByRole('radio', { name: enUS.knowledge.chat.always }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: enUS.knowledge.chat.start }),
    );
    const failure =
      status === 401
        ? 'expired'
        : status === 403
          ? 'forbidden'
          : status === 500
            ? 'unknown'
            : 'failed';
    await screen.findByText(enUS.knowledge.chat[failure]);
    expect(
      screen.getByRole('radio', { name: enUS.knowledge.chat.always }),
    ).toBeChecked();
    expect(host.openChat).not.toHaveBeenCalled();
    if (status !== 400)
      expect(
        screen.getByRole('button', { name: enUS.knowledge.chat.start }),
      ).toBeDisabled();
    if (status === 500) {
      await userEvent.click(
        screen.getByRole('button', { name: enUS.actions.cancel }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await openDialog();
      expect(
        screen.getByRole('button', { name: enUS.knowledge.chat.start }),
      ).toBeDisabled();
      expect(calls).toHaveLength(1);
      await userEvent.click(
        screen.getByRole('button', { name: enUS.knowledge.chat.history }),
      );
      await waitFor(() =>
        expect(host.openChat).toHaveBeenCalledWith({ view: 'history' }),
      );
    }
  },
);

it('keeps sign-in recovery actionable when refreshing the session fails', async () => {
  response = new Response(null, { status: 401 });
  await renderPage();
  await openDialog();
  await userEvent.click(
    screen.getByRole('button', { name: enUS.knowledge.chat.start }),
  );
  await screen.findByText(enUS.knowledge.chat.expired);
  const before = host.getSession.mock.calls.length;
  host.getSession.mockRejectedValueOnce(
    new Error('Session transport unavailable'),
  );
  await userEvent.click(
    screen.getByRole('button', { name: enUS.knowledge.chat.signIn }),
  );
  await waitFor(() =>
    expect(host.getSession).toHaveBeenCalledTimes(before + 1),
  );
  expect(screen.getByText(enUS.knowledge.chat.expired)).toBeVisible();
  expect(calls).toHaveLength(1);
  expect(host.openChat).not.toHaveBeenCalled();
});

it.each(['loading', 'error', 'empty'] as const)(
  'blocks creation for model readiness %s',
  async (state) => {
    host.phase = state === 'empty' ? 'ready' : state;
    host.canSend = false;
    await renderPage();
    await openDialog();
    expect(
      screen.getByRole('button', { name: enUS.knowledge.chat.start }),
    ).toBeDisabled();
    expect(calls).toEqual([]);
  },
);

it.each(['unmount', 'identity'] as const)(
  'does not open a late-created chat after %s',
  async (change) => {
    response = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    const tree = await renderPage();
    await openDialog();
    await userEvent.click(
      screen.getByRole('button', { name: enUS.knowledge.chat.start }),
    );
    await waitFor(() => expect(calls).toHaveLength(1));
    if (change === 'unmount') tree.unmount();
    else host.active = false;
    await act(async () => resolveCreate!({ data: { id: 'obsolete' } }));
    expect(host.openChat).not.toHaveBeenCalled();
  },
);

it('hides the action when the shared panel is unavailable', async () => {
  host.available = false;
  await renderPage();
  expect(
    screen.queryByRole('button', { name: enUS.knowledge.chat.title }),
  ).toBeNull();
});
