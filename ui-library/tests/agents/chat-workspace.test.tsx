import {
  ChatProvider,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatWorkspace } from '../../registry/agents/agent-chat/workspace';
import { PanelWorkspace } from '../../registry/agents/agent-chat/linked-chat-panel';
import {
  workspaceLayout,
  useChatWorkspace,
} from '../../registry/agents/agent-chat/workspace-layout';
import enUS from '../../registry/agents/agent-chat/locales/en-US';
import { resetChatDemo } from '../../website/demo/agents/agents-chat-client';

vi.mock(
  '@nocobase/app-plugin-agents/client/chat',
  () => import('../../website/demo/agents/agents-chat-client'),
);
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  resolveAppUrl: (x: string) => x,
  useApiClient: (await import('../../website/demo/inbox/app-client'))
    .useApiClient,
}));
vi.mock('../../registry/agents/agent-chat/use-conversation-usage.js', () => ({
  useConversationUsage: () => ({ data: undefined }),
}));

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/test-app', resources: enUS },
});

/** jsdom lays nothing out: the workspace's own width is what these tests say it is. */
let width = 1200;
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        width,
        height: 800,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 800,
        toJSON: () => ({}),
      }) as DOMRect,
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      disconnect(): void {}
    },
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  resetChatDemo();
});

function Shell({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider>{children}</ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}

function Page({
  view = 'conversation',
}: {
  readonly view?: 'list' | 'conversation';
}): ReactElement {
  return (
    <ChatWorkspace
      conversationId='welcome-tour'
      view={view}
      onOpen={() => undefined}
      onNew={() => undefined}
      onBack={() => undefined}
    />
  );
}

function OpenInPanel(): null {
  const { openChat } = useChatPanel();
  useEffect(() => openChat({ conversationId: 'welcome-tour' }), [openChat]);
  return null;
}

const headerButtons = (scope: HTMLElement): (string | null)[] =>
  within(within(scope).getByTestId('conversation-header'))
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'))
    .filter(Boolean);

describe('chat workspace layout by its own width', () => {
  it('names the layout for a width', () => {
    expect(workspaceLayout(390)).toBe('narrow');
    expect(workspaceLayout(639)).toBe('narrow');
    expect(workspaceLayout(640)).toBe('medium');
    expect(workspaceLayout(999)).toBe('medium');
    expect(workspaceLayout(1000)).toBe('wide');
  });

  it('shows the list or the conversation, never both, when narrow', async () => {
    width = 390;
    const view = render(
      <Shell>
        <Page view='list' />
      </Shell>,
    );
    const root = await screen.findByTestId('chat-workspace');
    expect(root).toHaveAttribute('data-layout', 'narrow');
    expect(screen.getByTestId('session-list')).toBeVisible();
    expect(screen.queryByTestId('session-conversation')).toBeNull();
    view.rerender(
      <Shell>
        <Page view='conversation' />
      </Shell>,
    );
    expect(await screen.findByTestId('session-conversation')).toBeVisible();
    expect(screen.getByTestId('session-list')).not.toBeVisible();
    // A page has no Close or Expand; "← list" only because it is narrow.
    expect(headerButtons(root)[0]).toBe('Back to list');
    expect(headerButtons(root)).not.toContain('Close');
  });

  it('puts the list beside the conversation with the details as a sheet when medium', async () => {
    width = 800;
    render(
      <Shell>
        <Page />
      </Shell>,
    );
    const root = await screen.findByTestId('chat-workspace');
    expect(root).toHaveAttribute('data-layout', 'medium');
    expect(screen.getByTestId('session-list')).toBeVisible();
    expect(await screen.findByTestId('session-conversation')).toBeVisible();
    expect(headerButtons(root)).not.toContain('Back to list');
    expect(screen.queryByTestId('chat-conversation-details')).toBeNull();
    fireEvent.click(within(root).getByRole('button', { name: 'Show details' }));
    expect(
      await screen.findByTestId('chat-conversation-details'),
    ).toHaveAttribute('data-placement', 'pane');
    // The list folds to a rail and back.
    fireEvent.click(screen.getByTestId('session-list-fold'));
    expect(screen.queryByTestId('session-list')).toBeNull();
    fireEvent.click(screen.getByTestId('session-list-unfold'));
    expect(screen.getByTestId('session-list')).toBeVisible();
  });

  it('shows the details beside the conversation when wide', async () => {
    width = 1300;
    render(
      <Shell>
        <Page />
      </Shell>,
    );
    const root = await screen.findByTestId('chat-workspace');
    expect(root).toHaveAttribute('data-layout', 'wide');
    expect(
      await screen.findByTestId('chat-conversation-details'),
    ).toHaveAttribute('data-placement', 'beside');
    // Beside, the summary row would repeat the details; it is hidden.
    expect(screen.queryByTestId('conversation-association-summary')).toBeNull();
  });

  it('is the same workspace in the panel, which adds only expand and close', async () => {
    width = 390;
    const page = render(
      <Shell>
        <Page />
      </Shell>,
    );
    const pageButtons = headerButtons(
      await screen.findByTestId('chat-workspace'),
    );
    page.unmount();
    render(
      <Shell>
        <OpenInPanel />
        <PanelWorkspace />
      </Shell>,
    );
    const panelRoot = await screen.findByTestId('chat-workspace');
    await within(panelRoot).findByTestId('session-conversation');
    expect(panelRoot).toHaveAttribute('data-layout', 'narrow');
    const panelButtons = headerButtons(panelRoot);
    expect(
      panelButtons.filter(
        (label) => label !== 'Full width' && label !== 'Close',
      ),
    ).toEqual(pageButtons);
    expect(panelButtons.slice(-1)).toEqual(['Close']);
  });
});

function StartFromNotice(): ReactElement {
  const workspace = useChatWorkspace();
  return (
    <button onClick={() => workspace?.newConversation?.()}>
      Start fresh from notice
    </button>
  );
}
it('lets a composer slot use its page or panel New action', async () => {
  const onNew = vi.fn();
  render(
    <Shell>
      <ChatWorkspace
        conversationId='welcome-tour'
        view='conversation'
        onOpen={() => undefined}
        onNew={onNew}
        onBack={() => undefined}
        renderBody={() => <StartFromNotice />}
      />
    </Shell>,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Start fresh from notice' }),
  );
  expect(onNew).toHaveBeenCalledOnce();
});
