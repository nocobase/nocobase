import { ConsultationCard } from '../../registry/agents/agent-chat/consultation-card';
import {
  ChatProvider,
  useChatContextSource,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  TestI18nProvider,
  createTestI18nRuntime,
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
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatPanel } from '../../registry/agents/agent-chat/chat-panel';
import { ChatConversationPage } from '../../registry/agents/agent-chat/conversation-page';
import { ChatHistoryDialog } from '../../registry/agents/agent-chat/history-list';
import { measureFloatingClearance } from '../../registry/agents/agent-chat/floating-clearance';
import {
  AskAgentButton,
  ChatFloatingButton,
  ChatHeaderButton,
} from '../../registry/agents/agent-chat/launchers';
import enUS from '../../registry/agents/agent-chat/locales/en-US';
import zhCN from '../../registry/agents/agent-chat/locales/zh-CN';
import { resetChatDemo } from '../../website/demo/agents/agents-chat-client';

// The plugin's chat hooks need a server; the preview's in-memory stand-in answers in their place.
vi.mock(
  '@nocobase/app-plugin-agents/client/chat',
  () => import('../../website/demo/agents/agents-chat-client'),
);

afterEach(() => resetChatDemo());

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/test-app', resources: enUS },
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

function Shell({
  children,
  path = '/',
}: {
  readonly children?: ReactNode;
  readonly path?: string;
}): ReactElement {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path]}>
        <ChatProvider conversationPath={(id) => `/chat/${id}`}>
          {children}
        </ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}

function renderPanel(
  conversationId: string | null,
  extra?: ReactNode,
): ReturnType<typeof render> {
  return render(
    <Shell>
      <Open conversationId={conversationId} />
      {extra}
      <div className='relative flex'>
        <main />
        <ChatPanel />
      </div>
    </Shell>,
  );
}

/**
 * jsdom has no layout: nothing lies under a point unless a test says so (`underPoint`), and nothing resizes. The
 * floating button measures both.
 */
let underPoint: () => Element[] = () => [];
Object.defineProperty(document, 'elementsFromPoint', {
  configurable: true,
  value: () => underPoint(),
});
if (!('ResizeObserver' in globalThis))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  );

describe('agent-chat locales', () => {
  it('lists the same keys in every language', () => {
    const keys = (value: object, prefix = ''): string[] =>
      Object.entries(value).flatMap(([key, child]) =>
        typeof child === 'string'
          ? [`${prefix}${key}`]
          : keys(child as object, `${prefix}${key}.`),
      );
    expect(keys(zhCN)).toEqual(keys(enUS));
  });
});

describe('ChatPanel', () => {
  it('shows a conversation: replies as Markdown, the context a message carried and a consultation', async () => {
    renderPanel('release-plan');
    const panel = await screen.findByTestId('chat-panel');
    expect(panel).toHaveAttribute('data-mode', 'docked');
    expect(
      within(panel).getByRole('heading', {
        name: 'Plan the onboarding release',
      }),
    ).toBeVisible();
    const log = within(panel).getByRole('log', { name: 'Messages' });
    expect(within(log).getByRole('table')).toBeVisible();
    expect(within(log).getByText('Onboarding')).toBeVisible();
    fireEvent.click(within(log).getByText('Consulted Coding agent'));
    expect(
      await within(log).findByText(
        'About an hour: the templates are done, the tests remain.',
      ),
    ).toBeVisible();
  });

  it('keeps the message list positioned, so absolutely placed content stays inside it', async () => {
    renderPanel('release-plan');
    const log = await screen.findByRole('log', { name: 'Messages' });
    const scroller = log.closest('.overflow-y-auto');
    expect(scroller).toHaveClass('relative');
  });

  it('sends a message and shows the agent at work', async () => {
    renderPanel('release-plan');
    const box = await screen.findByLabelText('Message to the agent');
    vi.useFakeTimers();
    try {
      await act(async () => {
        fireEvent.change(box, { target: { value: 'And the docs?' } });
        fireEvent.keyDown(box, { key: 'Enter' });
      });
      expect(screen.getByText('And the docs?')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'Stop', exact: true }),
      ).toBeVisible();
      expect(screen.queryByTestId('chat-live-steps')).toBeNull();
      const thinking = screen.getByText('Thinking…');
      const log = screen.getByRole('log', { name: 'Messages' });
      expect(log).toContainElement(thinking);
      const row = thinking.closest('li');
      expect(row?.parentElement?.lastElementChild).toBe(row);
      expect(row?.previousElementSibling).toHaveTextContent('And the docs?');
      expect(
        thinking
          .closest('[data-chat-feedback]')
          ?.querySelector('[data-slot="spinner"]'),
      ).toBeVisible();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1100);
      });
      expect(screen.getByText(/Here is what I would do/u)).toBeVisible();
      expect(screen.queryByText('Thinking…')).not.toBeInTheDocument();
      expect(box).toHaveValue('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops a reply still on its way when the demo is reset', async () => {
    renderPanel('release-plan');
    const box = await screen.findByLabelText('Message to the agent');
    vi.useFakeTimers();
    try {
      fireEvent.change(box, { target: { value: 'And the docs?' } });
      fireEvent.keyDown(box, { key: 'Enter' });
      expect(screen.getByText('And the docs?')).toBeVisible();
      // As between two tests: the reply would start in the next test's conversations, and stream over the message
      // that next takes its sequence number.
      act(() => resetChatDemo());
      act(() => vi.advanceTimersByTime(1000));
      act(() => resetChatDemo());
      fireEvent.change(box, { target: { value: 'Again' } });
      fireEvent.keyDown(box, { key: 'Enter' });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(screen.getByText('Again')).toBeVisible();
      expect(screen.getAllByText(/Here is what I would do/u)).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses shared Stop controls for managed Runner execution without a legacy steps panel', async () => {
    renderPanel('flaky-test');
    const stop = await screen.findByRole('button', {
      name: 'Stop',
      exact: true,
    });
    expect(screen.queryByTestId('chat-step-line')).toBeNull();
    expect(screen.queryByRole('list', { name: 'Steps' })).toBeNull();
    expect(
      screen.getByText(
        'The sign-in test fails about once in ten runs. Can you find out why?',
      ),
    ).toBeVisible();
    fireEvent.click(stop);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Stop', exact: true }),
      ).toBeNull(),
    );
    expect(screen.getByLabelText('Message to the agent')).toBeEnabled();
  });

  it('includes explicitly requested page context as removable chips after New', async () => {
    function Page(): ReactElement {
      const item = { kind: 'issue', id: 'pm-12', label: 'PM-12 Tour' };
      useChatContextSource(item);
      return <AskAgentButton item={item} />;
    }
    renderPanel(null, <Page />);
    expect(screen.queryByTestId('chat-context-chips')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Ask agent', exact: true }),
    );
    const chips = await screen.findByTestId('chat-context-chips');
    expect(within(chips).getByText('PM-12 Tour')).toBeVisible();
    fireEvent.click(
      screen.getByRole('button', { name: 'Remove context: PM-12 Tour' }),
    );
    await waitFor(() =>
      expect(screen.queryByTestId('chat-context-chips')).toBeNull(),
    );
  });

  it('shows the files a message was sent with: images open larger, other files download', async () => {
    renderPanel('flaky-test');
    const sent = await screen.findByTestId('chat-message-files');
    const link = within(sent).getByRole('link', { name: 'sign-in.log' });
    expect(link).toHaveAttribute('download', 'sign-in.log');
    fireEvent.click(
      within(sent).getByRole('button', { name: 'Preview test-report.png' }),
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('img', { name: 'test-report.png' }),
    ).toBeVisible();
  });

  it('sends files dropped on the conversation with the next message', async () => {
    renderPanel('release-plan');
    const conversation = await screen.findByTestId('chat-conversation');
    const dataTransfer = {
      files: [new File(['log'], 'deploy.log', { type: 'text/plain' })],
      types: ['Files'],
    };
    fireEvent.dragEnter(conversation, { dataTransfer });
    expect(screen.getByTestId('chat-drop-zone')).toHaveTextContent(
      'Drop files to attach them',
    );
    fireEvent.drop(conversation, { dataTransfer });
    expect(screen.queryByTestId('chat-drop-zone')).toBeNull();
    const files = screen.getByTestId('chat-composer-files');
    expect(within(files).getByText('deploy.log')).toBeVisible();
    fireEvent.click(screen.getByTestId('chat-send'));
    const log = screen.getByRole('log', { name: 'Messages' });
    // The sent message may render again as the reply arrives, so wait on the link as it is, not one found earlier.
    await waitFor(() =>
      expect(
        within(log).getByRole('link', { name: 'deploy.log' }),
      ).toBeVisible(),
    );
  });

  it('opens the history, filters archived conversations, and opens one', async () => {
    renderPanel('release-plan');
    fireEvent.click(await screen.findByTestId('chat-history-button'));
    const history = await screen.findByTestId('chat-history');
    expect(
      within(history).getByText('Fix the flaky sign-in test'),
    ).toBeVisible();
    expect(within(history).queryByText('Release notes draft')).toBeNull();
    // Archived is a toggle at the bottom of the list, not a tab.
    const archived = within(history).getByTestId('chat-history-archived');
    expect(archived).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(archived);
    expect(archived).toHaveAttribute('aria-pressed', 'true');
    expect(
      await within(history).findByText('Release notes draft'),
    ).toBeVisible();
    fireEvent.click(within(history).getByText('Release notes draft'));
    expect(
      await screen.findByRole('heading', { name: 'Release notes draft' }),
    ).toBeVisible();
    // The run failed: a notice in place of a reply, and the agent cannot answer now.
    expect(
      screen.getByText(/The agent stopped before answering\./u),
    ).toBeVisible();
    expect(screen.getByTestId('chat-offline')).toHaveTextContent(
      'Release manager has no runner online right now',
    );
  });

  it('chooses the agent of a new conversation in the composer, then shows it read-only', async () => {
    renderPanel(null);
    const composer = await screen.findByTestId('chat-composer');
    const picker = await within(composer).findByTestId('chat-agent-picker');
    expect(picker).toHaveTextContent('Assistant');
    // Fitted to the composer: the availability is in its name.
    expect(picker).toHaveAccessibleName(
      'Agent: Assistant, Online; choose another',
    );
    // Before the first message the header names no agent: the composer chooses it.
    expect(screen.queryByTestId('chat-agent')).toBeNull();
    await userEvent.click(picker);
    // Every enabled agent; one that cannot answer now says why and cannot be picked.
    const release = await screen.findByRole('menuitem', {
      name: /Release manager/u,
    });
    expect(release).toHaveTextContent('No runner online, cannot be chosen');
    expect(release).toHaveTextContent('Personal runners only');
    expect(release).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('menuitem', { name: /Coding agent/u }));
    await waitFor(() =>
      expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
        'Coding agent',
      ),
    );
    const box = screen.getByLabelText('Message to the agent');
    fireEvent.change(box, { target: { value: 'Fix the build' } });
    fireEvent.click(screen.getByTestId('chat-send'));
    expect(
      await screen.findByRole('heading', { name: 'Fix the build' }),
    ).toBeVisible();
    // The conversation's agent is its identity: in the header, with no picker left in the composer.
    expect(await screen.findByTestId('chat-agent')).toHaveTextContent(
      'Coding agent',
    );
    expect(screen.queryByTestId('chat-agent-picker')).toBeNull();
  });

  it('starts a new conversation with the default agent', async () => {
    renderPanel(null);
    expect(
      await screen.findByText('What can Assistant do for you?'),
    ).toBeVisible();
    const box = screen.getByLabelText('Message to the agent');
    fireEvent.change(box, { target: { value: 'Hello there' } });
    fireEvent.click(screen.getByTestId('chat-send'));
    expect(
      await screen.findByRole('heading', { name: 'Hello there' }),
    ).toBeVisible();
  });
});

describe('ChatPanel modes and layout', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('switches between runner and online agents, each with its own conversations', async () => {
    renderPanel(null);
    const panel = await screen.findByTestId('chat-panel');
    // The person's default is a runner agent, so the panel starts there.
    expect(await within(panel).findByTestId('chat-title')).toHaveTextContent(
      'Runner agents',
    );
    const toggle = within(panel).getByTestId('chat-mode-switch');
    expect(toggle).toHaveAccessibleName('Switch to the online agent');
    fireEvent.click(within(panel).getByTestId('chat-history-button'));
    const runner = await within(panel).findByTestId('chat-history');
    expect(runner).toHaveAttribute('data-mode', 'runner');
    expect(
      within(runner).getByText('Fix the flaky sign-in test'),
    ).toBeVisible();
    expect(
      within(runner).queryByText('Name the onboarding checklist'),
    ).toBeNull();

    fireEvent.click(toggle);
    const online = await within(panel).findByTestId('chat-history');
    await waitFor(() => expect(online).toHaveAttribute('data-mode', 'online'));
    expect(within(panel).getByTestId('chat-title')).toHaveTextContent(
      'Online agent',
    );
    expect(
      within(online).getByText('Name the onboarding checklist'),
    ).toBeVisible();
    expect(within(online).queryByText('Fix the flaky sign-in test')).toBeNull();
    // One online agent: nothing to filter by.
    expect(
      within(online).queryByRole('combobox', { name: 'Agent' }),
    ).toBeNull();
    expect(within(panel).getByTestId('chat-mode-switch')).toHaveAccessibleName(
      'Switch to runner agents',
    );
    // A new conversation in this mode chooses a model, not a runner agent.
    fireEvent.click(within(panel).getByTestId('chat-new-conversation'));
    const composer = await within(panel).findByTestId('chat-composer');
    expect(
      within(composer).queryByText('What can Assistant do for you?'),
    ).toBeNull();
    expect(within(composer).getByTestId('chat-agent-picker')).toHaveTextContent(
      'Default model',
    );
  });

  it('hides the switch while only one kind of agent is configured', async () => {
    window.history.replaceState(null, '', '/?agents=runner');
    renderPanel(null);
    const panel = await screen.findByTestId('chat-panel');
    expect(await within(panel).findByTestId('chat-title')).toHaveTextContent(
      'New conversation',
    );
    expect(within(panel).queryByTestId('chat-mode-switch')).toBeNull();
  });

  it('starts the history with its search and filters, ends it with the archived toggle, and says so in one line when empty', async () => {
    renderPanel('release-plan');
    fireEvent.click(await screen.findByTestId('chat-history-button'));
    const history = await screen.findByTestId('chat-history');
    const archived = within(history).getByTestId('chat-history-archived');
    expect(history.lastElementChild).toContainElement(archived);
    expect(within(history).queryByRole('tab')).toBeNull();
    fireEvent.change(within(history).getByLabelText('Search conversations'), {
      target: { value: 'nothing like this' },
    });
    const empty = await within(history).findByTestId('chat-history-empty');
    expect(empty.tagName).toBe('P');
    expect(empty).toHaveTextContent('No conversation matches');
  });

  it('puts the conversation list on the left while covering the content, and docks again on another page', async () => {
    function Elsewhere(): ReactElement {
      const navigate = useNavigate();
      return (
        <button type='button' onClick={() => void navigate('/other')}>
          Go elsewhere
        </button>
      );
    }
    renderPanel('release-plan', <Elsewhere />);
    const panel = await screen.findByTestId('chat-panel');
    // Docked: "+" first among the header's buttons, and the history behind its own button.
    const newButton = await within(panel).findByTestId('chat-new-conversation');
    expect(newButton.className).not.toMatch(/bg-primary/u);
    const headerButtons = within(newButton.closest('header')!).getAllByRole(
      'button',
    );
    // After the title (which renames the conversation).
    expect(headerButtons.indexOf(newButton)).toBe(1);
    fireEvent.click(within(panel).getByTestId('chat-expand'));
    await waitFor(() => expect(panel).toHaveAttribute('data-mode', 'expanded'));
    const split = within(panel).getByTestId('chat-split');
    const header = within(split).getByTestId('chat-history-header');
    expect(header).toHaveTextContent('Runner agents');
    expect(within(header).getByTestId('chat-new-conversation')).toBeVisible();
    expect(within(split).getByText('Fix the flaky sign-in test')).toBeVisible();
    expect(
      within(split).getByRole('heading', {
        name: 'Plan the onboarding release',
      }),
    ).toBeVisible();
    expect(within(panel).queryByTestId('chat-history-button')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Go elsewhere' }));
    await waitFor(() => expect(panel).toHaveAttribute('data-mode', 'docked'));
  });

  it('shows what a chip carries, in the composer and under a sent message', async () => {
    function Page(): ReactElement {
      const item = { kind: 'issue', id: 'pm-12', label: 'PM-12 Tour' };
      useChatContextSource(item);
      return <AskAgentButton item={item} />;
    }
    renderPanel('release-plan', <Page />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Ask agent', exact: true }),
    );
    const chip = await screen.findByRole('button', {
      name: 'Show context: PM-12 Tour',
    });
    fireEvent.click(chip);
    const preview = await screen.findByTestId('chat-context-preview');
    expect(
      within(preview).getByRole('heading', { name: 'Context: PM-12 Tour' }),
    ).toBeVisible();
    expect(preview).toHaveTextContent('"id": "pm-12"');
    fireEvent.keyDown(preview, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByTestId('chat-context-preview')).toBeNull(),
    );
    // Ask agent started a new conversation; the sent message's context is in the one before it.
    fireEvent.click(screen.getByTestId('chat-history-button'));
    fireEvent.click(await screen.findByText('Plan the onboarding release'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Show context: Onboarding' }),
    );
    const sent = await screen.findByTestId('chat-context-preview');
    expect(sent).toHaveTextContent('"title": "Onboarding"');
  });

  it('starts the next new conversation with the agent last used, also after a reload', async () => {
    const first = renderPanel(null);
    await userEvent.click(await screen.findByTestId('chat-agent-picker'));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: /Coding agent/u }),
    );
    const box = screen.getByLabelText('Message to the agent');
    fireEvent.change(box, { target: { value: 'Fix the build' } });
    fireEvent.click(screen.getByTestId('chat-send'));
    expect(
      await screen.findByRole('heading', { name: 'Fix the build' }),
    ).toBeVisible();
    fireEvent.click(screen.getByTestId('chat-new-conversation'));
    await waitFor(() =>
      expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
        'Coding agent',
      ),
    );
    first.unmount();
    renderPanel(null);
    expect(await screen.findByTestId('chat-agent-picker')).toHaveTextContent(
      'Coding agent',
    );
  });

  it('takes the focus as it opens, so Escape closes it', async () => {
    renderPanel(null);
    const panel = await screen.findByTestId('chat-panel');
    await waitFor(() =>
      expect(panel).toContainElement(document.activeElement as HTMLElement),
    );
    fireEvent.keyDown(document.activeElement ?? panel, { key: 'Escape' });
    await waitFor(() => expect(panel).not.toBeVisible());
  });
});

describe('launchers', () => {
  it('opens and closes the panel from the header button', async () => {
    render(
      <Shell>
        <ChatHeaderButton />
        <ChatPanel />
      </Shell>,
    );
    const button = screen.getByTestId('chat-header-button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(await screen.findByTestId('chat-panel')).toBeVisible();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(button);
    await waitFor(() =>
      expect(screen.getByTestId('chat-panel')).not.toBeVisible(),
    );
  });

  it('hides the floating button while the panel is open', async () => {
    render(
      <Shell>
        <ChatFloatingButton />
        <ChatPanel />
      </Shell>,
    );
    fireEvent.click(screen.getByTestId('chat-floating-button'));
    expect(await screen.findByTestId('chat-panel')).toBeVisible();
    expect(screen.queryByTestId('chat-floating-button')).toBeNull();
  });

  it('keeps the floating button off a composer: above it, or hidden when it cannot clear it', () => {
    const composer = document.createElement('div');
    composer.setAttribute('data-floating-avoid', '');
    const field = document.createElement('textarea');
    composer.append(field);
    document.body.append(composer);
    underPoint = () => [field, composer];
    const height = window.innerHeight;
    const place = (top: number, size: number): void => {
      composer.getBoundingClientRect = () =>
        ({ top, height: size, bottom: top + size }) as DOMRect;
    };
    try {
      // Under the button's resting place, though not pinned: the button rises above its top edge.
      place(height - 150, 150);
      expect(measureFloatingClearance(null)).toBe(150);
      // Taller than half the screen: no place above it, so the button hides.
      place(height - 500, 500);
      expect(measureFloatingClearance(null)).toBeNull();
    } finally {
      underPoint = () => [];
      composer.remove();
    }
  });

  it('pins the page’s object and puts a draft into the composer', async () => {
    render(
      <Shell>
        <AskAgentButton
          item={{ kind: 'issue', id: 'pm-12', label: 'PM-12 Tour' }}
          draft='Summarize this issue.'
          newConversation
        />
        <ChatPanel />
      </Shell>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ask agent' }));
    expect(await screen.findByLabelText('Message to the agent')).toHaveValue(
      'Summarize this issue.',
    );
    expect(screen.getByTestId('chat-context-chips')).toHaveTextContent(
      'PM-12 Tour',
    );
  });
});

describe('ChatConversationPage', () => {
  it('shows one conversation with its title and agent', async () => {
    render(
      <Shell path='/chat/flaky-test'>
        <Routes>
          <Route
            path='/chat/:conversationId'
            element={
              <ChatConversationPage
                conversationId='flaky-test'
                newConversationPath='/'
              />
            }
          />
        </Routes>
      </Shell>,
    );
    const page = await screen.findByTestId('chat-page');
    expect(
      within(page).getByRole('heading', {
        level: 1,
        name: 'Fix the flaky sign-in test',
      }),
    ).toBeVisible();
    expect(within(page).getByTestId('chat-page-agent')).toHaveTextContent(
      'Coding agent',
    );
    expect(within(page).queryByTestId('chat-mode')).toBeNull();
  });

  it('lists the conversations in a dialog for a page', async () => {
    const onOpen = vi.fn();
    render(
      <Shell>
        <ChatHistoryDialog open onOpenChange={() => {}} onOpen={onOpen} />
      </Shell>,
    );
    const dialog = await screen.findByTestId('chat-history-dialog');
    await act(async () => {
      fireEvent.click(within(dialog).getByText('Plan the onboarding release'));
    });
    expect(onOpen).toHaveBeenCalledWith('release-plan');
  });
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
