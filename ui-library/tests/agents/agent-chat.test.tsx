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
import { MemoryRouter, Route, Routes } from 'react-router';
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
    expect(within(panel).getByTestId('chat-model')).toBeVisible();
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
    fireEvent.change(box, { target: { value: 'And the docs?' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(await screen.findByText('And the docs?')).toBeVisible();
    expect(await screen.findByTestId('chat-live-steps')).toBeVisible();
    expect(box).toHaveValue('');
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
      act(() => vi.advanceTimersByTime(5000));
      expect(screen.getByText('Again')).toBeVisible();
      expect(screen.getAllByText(/Here is what I would do/u)).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sums up a runner’s steps in one line that expands to them', async () => {
    renderPanel('flaky-test');
    const line = await screen.findByTestId('chat-step-line');
    expect(line).toHaveTextContent(
      'Working on pnpm test:e2e sign-in --repeat-each 20',
    );
    expect(line).toHaveTextContent('4 steps');
    fireEvent.click(line);
    expect(
      await screen.findByRole('list', { name: 'Steps' }),
    ).toHaveTextContent('Bash');
  });

  it('shows the page’s context as chips in the composer, each removable', async () => {
    function Page(): null {
      useChatContextSource({ kind: 'issue', id: 'pm-12', label: 'PM-12 Tour' });
      return null;
    }
    renderPanel(null, <Page />);
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
    fireEvent.click(within(history).getByRole('tab', { name: 'Archived' }));
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

  it('offers the online agent’s models before the first message and starts on the chosen one', async () => {
    renderPanel(null);
    const picker = await screen.findByTestId('chat-model');
    // The model after its service's title, not the bare id; the title shows only where the composer is wide.
    expect(picker).toHaveTextContent('OpenAI · gpt-5-mini');
    expect(picker).toHaveAccessibleName('Model: OpenAI · gpt-5-mini');
    expect(within(picker).getByTestId('chat-model-service')).toHaveClass(
      'hidden',
      '@md:inline',
    );
    expect(picker).toHaveClass('max-w-40', '@md:max-w-64');
    expect(screen.getByTestId('chat-composer')).toHaveClass('@container');
    // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
    await userEvent.click(picker);
    const option = await screen.findByRole('option', {
      name: /claude-sonnet/u,
    });
    // The menu groups the models by their service.
    expect(screen.getByText('Anthropic')).toBeVisible();
    expect(screen.getByRole('option', { name: /gpt-5-mini/u })).toBeVisible();
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.pointerUp(option, { pointerType: 'mouse' });
    fireEvent.mouseUp(option);
    fireEvent.click(option);
    await waitFor(() =>
      expect(screen.getByTestId('chat-model')).toHaveTextContent(
        'Anthropic · claude-sonnet',
      ),
    );
    const box = screen.getByLabelText('Message to the agent');
    fireEvent.change(box, { target: { value: 'Which model?' } });
    fireEvent.click(screen.getByTestId('chat-send'));
    expect(
      await screen.findByRole('heading', { name: 'Which model?' }),
    ).toBeVisible();
    // The conversation it created answers with that model, and keeps offering the switch.
    expect(screen.getByTestId('chat-model')).toHaveTextContent('claude-sonnet');
  });

  it('chooses the agent of a new conversation in the composer, then shows it read-only', async () => {
    renderPanel(null);
    const composer = await screen.findByTestId('chat-composer');
    const picker = await within(composer).findByTestId('chat-agent-picker');
    expect(picker).toHaveTextContent('Assistant');
    // Fitted to the composer: the availability is in its name, the type tag only where the composer is wide.
    expect(picker).toHaveAccessibleName(
      'Agent: Assistant, Online; choose another',
    );
    expect(within(picker).getByText('Online').closest('[title]')).toHaveClass(
      'hidden',
      '@md:inline-flex',
    );
    // Before the first message the header names no agent: the composer chooses it.
    expect(screen.queryByTestId('chat-agent')).toBeNull();
    await userEvent.click(picker);
    // Every agent, grouped by type.
    expect(await screen.findByText('Runner agents')).toBeVisible();
    fireEvent.click(screen.getByRole('menuitem', { name: /Coding agent/u }));
    await waitFor(() =>
      expect(screen.getByTestId('chat-agent-picker')).toHaveTextContent(
        'Coding agent',
      ),
    );
    // A runner agent has no model to choose.
    expect(screen.queryByTestId('chat-model')).toBeNull();
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
  it('shows one conversation with its title, agent and mode', async () => {
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
    expect(within(page).getByTestId('chat-mode')).toHaveTextContent('Runner');
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
