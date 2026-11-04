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
import type { ConversationShare } from '@nocobase/app-plugin-agents/shared/conversations';

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
    shareCandidates: async () => [{ id: 'bob', name: 'Bob' }],
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
    screen.getByRole('combobox', { name: 'Select an application user' }),
  );
  await user.click(await screen.findByRole('option', { name: 'Bob' }));
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
