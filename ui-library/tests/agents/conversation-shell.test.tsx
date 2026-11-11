import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import { ConversationHeader } from '../../registry/agents/agent-chat/conversation-header';
import {
  ConversationAssociations,
  ConversationAssociationSummary,
  ConversationAssociationsProvider,
} from '../../registry/agents/agent-chat/conversation-associations';
import enUS from '../../registry/agents/agent-chat/locales/en-US';

const state = vi.hoisted(() => ({
  remove: vi.fn(),
  links: [
    {
      id: 'l',
      kind: 'work',
      targetId: 'w',
      view: {
        key: 'W-1',
        title: 'Generic work',
        status: 'Ready',
        url: '/work/w',
      },
    },
  ],
}));
vi.mock('../../registry/agents/agent-chat/conversation-links.js', () => ({
  useConversationLinks: () => ({ data: state.links }),
  useRemoveConversationLink: () => ({
    mutate: state.remove,
    isPending: false,
    isError: false,
  }),
}));
vi.mock('@nocobase/app-client', () => ({ resolveAppUrl: (x: string) => x }));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'shell-test', resources: enUS },
});
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>{children}</MemoryRouter>
    </TestI18nProvider>
  );
}

it.each(['panel', 'page'] as const)(
  'orders existing and empty %s headers independently of associations',
  (kind) => {
    const onNew = vi.fn(),
      close = vi.fn(),
      toggle = vi.fn(),
      back = vi.fn();
    const props = {
      title: 'Saved conversation',
      onBack: back,
      onNew,
      onToggleDetails: toggle,
      onClose: kind === 'panel' ? close : undefined,
      onExpand: kind === 'panel' ? vi.fn() : undefined,
      menuItems: <span>Archive</span>,
    };
    const view = render(<ConversationHeader {...props} />, { wrapper });
    expect(
      within(screen.getByTestId('conversation-header'))
        .getAllByRole('button')
        .map((x) => x.getAttribute('aria-label'))
        .filter(Boolean),
    ).toEqual(
      kind === 'panel'
        ? [
            'Back to list',
            'New conversation',
            'Show details',
            'Full width',
            'More',
            'Close',
          ]
        : ['Back to list', 'New conversation', 'Show details', 'More'],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show details' }));
    expect(toggle).toHaveBeenCalledOnce();
    view.rerender(
      <ConversationHeader
        title='New conversation'
        onBack={back}
        onExpand={props.onExpand}
        onClose={props.onClose}
      />,
    );
    expect(
      within(screen.getByTestId('conversation-header'))
        .getAllByRole('button')
        .map((x) => x.getAttribute('aria-label'))
        .filter(Boolean),
    ).toEqual(
      kind === 'panel'
        ? ['Back to list', 'Full width', 'Close']
        : ['Back to list'],
    );
    expect(
      screen.queryByRole('button', { name: 'New conversation' }),
    ).toBeNull();
    if (kind === 'panel') {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(close).toHaveBeenCalledOnce();
    }
  },
);
it('renders generic links without application registrations and unlinks through their existing contract', () => {
  render(<ConversationAssociations conversationId='c' />, { wrapper });
  // The title has the first line to itself; the key and the status share the second.
  expect(
    screen.getByRole('link', { name: 'W-1 Generic work' }),
  ).toHaveTextContent('Generic workW-1Ready');
  expect(screen.getByText('Ready')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: enUS.chat.unlink }));
  expect(state.remove).toHaveBeenCalledWith(state.links[0]);
});
it('uses per-kind slots without placing business data in the generic panel', () => {
  render(
    <ConversationAssociationsProvider
      slots={{
        work: {
          label: 'Related work',
          render: ({ links }) => <div>Adapter {links[0]!.targetId}</div>,
        },
      }}
    >
      <ConversationAssociations conversationId='c' />
    </ConversationAssociationsProvider>,
    { wrapper },
  );
  expect(screen.getByText('Adapter w')).toBeVisible();
  expect(screen.queryByRole('link')).toBeNull();
});
it('summarizes generic links by their status words and opens the details', () => {
  const open = vi.fn();
  render(
    <ConversationAssociationSummary conversationId='c' onOpenDetails={open} />,
    { wrapper },
  );
  const summary = screen.getByTestId('conversation-association-summary');
  expect(summary).toHaveTextContent(`${enUS.chat.relatedWork} 1`);
  expect(within(summary).getByText('Ready 1')).toBeVisible();
  fireEvent.click(summary);
  expect(open).toHaveBeenCalledOnce();
});
it('keeps the default rows under a slot label without a renderer', () => {
  render(
    <ConversationAssociationsProvider slots={{ work: { label: 'Documents' } }}>
      <ConversationAssociations conversationId='c' />
    </ConversationAssociationsProvider>,
    { wrapper },
  );
  expect(screen.getByRole('heading', { name: /Documents/ })).toBeVisible();
  // The title has the first line to itself; the key and the status share the second.
  expect(
    screen.getByRole('link', { name: 'W-1 Generic work' }),
  ).toHaveTextContent('Generic workW-1Ready');
});
