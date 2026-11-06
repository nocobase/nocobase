import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { ShareConversation } from '../../registry/agents/agent-chat/share-conversation.js';
import enUS from '../../registry/agents/agent-chat/locales/en-US.js';
import zhCN from '../../registry/agents/agent-chat/locales/zh-CN.js';
import type { ConversationShare } from '@nocobase/app-plugin-agents/shared/conversations';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '#components/ui/dialog';

const state = vi.hoisted(() => ({
  rows: [] as ConversationShare[],
  share: vi.fn(),
  revoke: vi.fn(),
  copy: vi.fn().mockResolvedValue(undefined),
  toast: vi.fn(),
}));
vi.mock('@nocobase/app-client', () => ({
  copyText: state.copy,
  resolveAppUrl: (path: string) => `/mounted${path}`,
  useToaster: () => ({ show: state.toast }),
}));
const queries = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});
vi.mock('@nocobase/app-plugin-agents/client/chat', () => ({
  agentsQueryClient: () => queries,
  useChatPanel: () => ({ conversationPath: (id: string) => `/chat/${id}` }),
  useChatApi: () => ({
    shareCandidates: async () => [
      { id: 'bob', name: 'Bob' },
      { id: 'carol', name: 'Carol' },
    ],
    shares: async () => state.rows,
    share: state.share,
    revokeShare: state.revoke,
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'sharing-test', resources: enUS },
});
afterEach(() => {
  queries.clear();
  state.rows = [];
  vi.clearAllMocks();
});

it('selects a named recipient, updates, copies the mounted link and revokes without a host query provider', async () => {
  state.share.mockImplementation(async () => {
    const share = {
      userId: 'bob',
      name: 'Bob',
      cutoffSeq: 2,
      snapshotAt: '2026-11-04T00:00:00.000Z',
      updatedAt: '2026-11-04T00:00:00.000Z',
    };
    state.rows = [share];
    return share;
  });
  state.revoke.mockImplementation(async () => {
    state.rows = [];
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <ShareConversation
        conversationId='conversation'
        open
        onOpenChange={vi.fn()}
      />
    </TestI18nProvider>,
  );
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('combobox', { name: 'Select application users' }),
  );
  await user.click(await screen.findByRole('option', { name: 'Bob' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Share', exact: true }));
  await waitFor(() =>
    expect(state.share).toHaveBeenCalledWith('conversation', 'bob'),
  );
  await screen.findByRole('button', { name: 'Update', exact: true });
  fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
  await waitFor(() =>
    expect(state.copy).toHaveBeenCalledWith(
      expect.stringContaining('/mounted/chat/conversation'),
    ),
  );
  await user.click(screen.getByRole('button', { name: 'Update', exact: true }));
  await waitFor(() => expect(state.share).toHaveBeenCalledTimes(2));
  await user.click(screen.getByRole('button', { name: 'Revoke', exact: true }));
  await waitFor(() =>
    expect(state.revoke).toHaveBeenCalledWith('conversation', 'bob'),
  );
  await screen.findByText('No recipients yet.');
});

function renderSharing() {
  render(
    <TestI18nProvider runtime={runtime}>
      <ShareConversation
        conversationId='conversation'
        open
        onOpenChange={vi.fn()}
      />
    </TestI18nProvider>,
  );
}

it('renders a backdrop above a parent dialog and closes only sharing on Escape', async () => {
  function NestedSharing() {
    const [open, setOpen] = useState(true);
    return (
      <Dialog open>
        <DialogContent>
          <DialogTitle>Agent panel</DialogTitle>
          <ShareConversation
            conversationId='nested'
            open={open}
            onOpenChange={setOpen}
          />
        </DialogContent>
      </Dialog>
    );
  }
  render(
    <TestI18nProvider runtime={runtime}>
      <NestedSharing />
    </TestI18nProvider>,
  );
  await screen.findByTestId('share-conversation');
  expect(
    document.querySelectorAll('[data-slot="dialog-overlay"]'),
  ).toHaveLength(2);
  await userEvent.setup().keyboard('{Escape}');
  await waitFor(() =>
    expect(screen.queryByTestId('share-conversation')).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('dialog', { name: 'Agent panel' })).toBeVisible();
  expect(
    document.querySelectorAll('[data-slot="dialog-overlay"]'),
  ).toHaveLength(1);
});
function savedShare(userId: string): ConversationShare {
  const share = {
    userId,
    name: userId === 'bob' ? 'Bob' : 'Carol',
    cutoffSeq: 2,
    snapshotAt: '2026-11-04T00:00:00.000Z',
    updatedAt: '2026-11-04T00:00:00.000Z',
  };
  state.rows = [...state.rows.filter((row) => row.userId !== userId), share];
  return share;
}
async function selectBoth(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('combobox', { name: 'Select application users' }),
  );
  await user.click(await screen.findByRole('option', { name: 'Bob' }));
  await user.click(screen.getByRole('option', { name: 'Carol' }));
  await user.keyboard('{Escape}');
}

it('shares with multiple recipients and prevents empty or repeated submissions while requests are pending', async () => {
  const finish = new Map<string, () => void>();
  state.share.mockImplementation(
    (_conversation: string, id: string) =>
      new Promise<ConversationShare>((resolve) => {
        finish.set(id, () => resolve(savedShare(id)));
      }),
  );
  renderSharing();
  const user = userEvent.setup();
  const submit = screen.getByRole('button', { name: 'Share', exact: true });
  expect(submit).toBeDisabled();
  await selectBoth(user);
  expect(screen.getByRole('combobox')).toHaveTextContent('Bob, Carol');
  await user.click(submit);
  await waitFor(() => expect(state.share).toHaveBeenCalledTimes(2));
  expect(submit).toBeDisabled();
  expect(screen.getByRole('combobox')).toBeDisabled();
  await user.click(submit);
  expect(state.share).toHaveBeenCalledTimes(2);
  finish.get('bob')!();
  finish.get('carol')!();
  await waitFor(() =>
    expect(
      screen.getAllByRole('button', { name: 'Update', exact: true }),
    ).toHaveLength(2),
  );
  expect(screen.getByRole('combobox')).toHaveTextContent(
    'Select application users',
  );
  expect(submit).toBeDisabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('lists successful shares, keeps failed recipients selected and retries only those recipients', async () => {
  let failCarol = true;
  state.share.mockImplementation(async (_conversation: string, id: string) => {
    if (id === 'carol' && failCarol)
      throw new Error('Recipient request failed');
    return savedShare(id);
  });
  renderSharing();
  const user = userEvent.setup();
  await selectBoth(user);
  await user.click(screen.getByRole('button', { name: 'Share', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not share with: Carol. These users remain selected for retry.',
  );
  expect(screen.getByRole('combobox')).toHaveTextContent('Carol');
  expect(screen.getByRole('combobox')).not.toHaveTextContent('Bob');
  expect(
    screen.getAllByRole('button', { name: 'Update', exact: true }),
  ).toHaveLength(1);
  failCarol = false;
  await user.click(screen.getByRole('button', { name: 'Share', exact: true }));
  await waitFor(() =>
    expect(
      screen.getAllByRole('button', { name: 'Update', exact: true }),
    ).toHaveLength(2),
  );
  expect(state.share.mock.calls.map((args) => args[1])).toEqual([
    'bob',
    'carol',
    'carol',
  ]);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('retains all failed recipients and removes their retry warning when the user deselects them', async () => {
  state.share.mockRejectedValue(new Error('Sharing unavailable'));
  renderSharing();
  const user = userEvent.setup();
  await selectBoth(user);
  await user.click(screen.getByRole('button', { name: 'Share', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not share with: Bob, Carol.',
  );
  expect(screen.getByRole('combobox')).toHaveTextContent('Bob, Carol');
  expect(
    screen.queryByRole('button', { name: 'Update', exact: true }),
  ).not.toBeInTheDocument();
  const recipientSelector = await screen.findByRole('combobox', {
    name: 'Select application users',
  });
  await waitFor(() => expect(recipientSelector).toBeEnabled());
  await user.click(recipientSelector);
  await waitFor(() =>
    expect(recipientSelector).toHaveAttribute('aria-expanded', 'true'),
  );
  await user.click(await screen.findByRole('option', { name: 'Bob' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not share with: Carol.',
  );
  await user.click(screen.getByRole('option', { name: 'Carol' }));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Share', exact: true }),
  ).toBeDisabled();
});

it('formats the recipient cutoff in the application language instead of the browser default', async () => {
  savedShare('bob');
  const chinese = await createTestI18nRuntime({
    locale: 'zh-CN',
    application: { namespace: 'sharing-test', resources: zhCN },
  });
  render(
    <TestI18nProvider runtime={chinese}>
      <ShareConversation conversationId='chinese' open onOpenChange={vi.fn()} />
    </TestI18nProvider>,
  );
  const cutoff = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(state.rows[0]!.snapshotAt));
  expect(await screen.findByText(`截至 ${cutoff} 的分享`)).toBeVisible();
});
