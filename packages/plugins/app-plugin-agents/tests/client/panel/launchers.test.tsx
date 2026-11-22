// @vitest-environment jsdom
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatContextItem } from '../../../client/chat.js';
import type { ChatPanelValue } from '../../../client/chat/provider.js';
import enUS from '../../../client/locales/en-US.js';
import {
  AgentHeaderButton,
  AskAgentButton,
} from '../../../client/launchers/index.js';

// The launchers reach the panel only through its state; a stand-in records what they ask of it.
const panel = {
  available: true,
  open: false,
  toggleChat: vi.fn(),
  openChat: vi.fn(),
};
vi.mock('../../../client/chat/provider.js', async (original) => ({
  ...(await original<typeof import('../../../client/chat/provider.js')>()),
  useChatPanel: () => panel as unknown as ChatPanelValue,
}));

const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-agents': enUS },
});

function renderWith(node: ReactElement): ReturnType<typeof render> {
  return render(<TestI18nProvider runtime={runtime}>{node}</TestI18nProvider>);
}

beforeEach(() => {
  panel.available = true;
  panel.open = false;
  panel.toggleChat.mockClear();
  panel.openChat.mockClear();
});

const order: ChatContextItem = {
  kind: 'order',
  id: 'A-5521',
  label: 'Order A-5521',
};
const customer: ChatContextItem = {
  kind: 'customer',
  id: 'globex',
  label: 'Globex',
};

describe('AgentHeaderButton', () => {
  it('is named Agent, names ⌘J / Ctrl+J, and toggles the panel', async () => {
    renderWith(<AgentHeaderButton />);
    const button = screen.getByRole('button', { name: 'Agent' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Meta+J Control+J');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.hover(button);
    expect(await screen.findByText(/^(⌘|Ctrl) J$/u)).toBeInTheDocument();
    fireEvent.click(button);
    expect(panel.toggleChat).toHaveBeenCalledTimes(1);
  });

  it('renders nothing where the viewer may not chat', () => {
    panel.available = false;
    const { container } = renderWith(<AgentHeaderButton />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('AskAgentButton', () => {
  it('opens the panel with one object pinned and the prompt as a draft', () => {
    renderWith(
      <AskAgentButton context={order} prompt='Can this ship Monday?' />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ask Agent' }));
    expect(panel.openChat).toHaveBeenCalledTimes(1);
    expect(panel.openChat).toHaveBeenCalledWith({
      pin: order,
      draft: 'Can this ship Monday?',
      view: 'chat',
      source: 'askAgent',
    });
  });

  it('pins several objects to the same conversation, and can start a new one', () => {
    renderWith(
      <AskAgentButton context={[order, customer]} newConversation>
        Ask about this order
      </AskAgentButton>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Ask about this order' }),
    );
    expect(panel.openChat.mock.calls).toEqual([
      [{ pin: order, view: 'chat', source: 'askAgent', conversationId: null }],
      [{ pin: customer, view: 'chat' }],
    ]);
  });

  it('opens the panel without context, and renders nothing where the viewer may not chat', () => {
    const view = renderWith(<AskAgentButton iconOnly />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask Agent' }));
    expect(panel.openChat).toHaveBeenCalledWith({
      view: 'chat',
      source: 'askAgent',
    });
    panel.available = false;
    view.rerender(
      <TestI18nProvider runtime={runtime}>
        <AskAgentButton iconOnly />
      </TestI18nProvider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
