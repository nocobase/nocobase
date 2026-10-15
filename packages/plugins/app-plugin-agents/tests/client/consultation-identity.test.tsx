// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type {
  ConsultationNotice,
  ConversationMessage,
} from '../../shared/conversations.js';
import { clientMocks, FakeApiError, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);
const { ChatClientProvider } = await import('../../client/chat/controller.js');
const { agentsQueryClient } = await import('../../client/query.js');
const { useConsultationIdentity } =
  await import('../../client/chat/consultation-identity.js');
const { noticeText } = await import('../../client/chat/message-model.js');
const { useConversationMessages } =
  await import('../../client/chat/use-chat.js');
const client = agentsQueryClient();
const notice: ConsultationNotice = {
  code: 'consultation',
  callId: 'old',
  agentId: 'manager',
  agentName: 'Project manager',
  runId: 'completed',
  state: 'completed',
  question: 'Original question',
  answer: 'Original answer',
  error: null,
  usage: null,
  plans: 0,
};
const message: ConversationMessage = {
  id: 'm1',
  conversationId: 'c1',
  seq: 1,
  role: 'system',
  content: { type: 'text', content: 'Original body' },
  metadata: { notice },
  toolCalls: null,
  attachments: null,
  workContext: null,
  runId: null,
  createdAt: '2026-10-01T00:00:00Z',
};
function Wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={client}>
      <ChatClientProvider>{children}</ChatClientProvider>
    </QueryClientProvider>
  );
}
beforeEach(() => {
  client.clear();
  client.setDefaultOptions({ queries: { retry: false } });
});
afterEach(() => client.clear());

it.each([false, true])(
  'refreshes a loaded completed message without a new sequence (run-only: %s)',
  async (runOnly) => {
    let name = '项目经理';
    const original = {
      ...message,
      metadata: { notice: { ...notice, agentId: runOnly ? null : 'manager' } },
    };
    resetApi({
      'agents/conversations/c1/messages': ({ query }) => ({
        data: query.after ? [] : [original],
        meta: { lastSeq: 1 },
      }),
      'agents/agentNames': () => [{ id: 'manager', name, nameText: null }],
      'agents/runs/completed': () => ({ agentId: 'manager' }),
    });
    const { result } = renderHook(
      () => {
        const messages = useConversationMessages('c1');
        const current = messages.items[0]?.metadata.notice;
        const identity = useConsultationIdentity(
          current?.code === 'consultation' ? current : undefined,
        );
        return {
          messages,
          identity,
          title: noticeText(
            (key, options) => `${key}:${options?.name ?? ''}`,
            current,
            '',
            () => '',
            undefined,
            identity,
          ),
        };
      },
      { wrapper: Wrapper },
    );
    await waitFor(() =>
      expect(result.current.identity).toEqual({ state: 'resolved', name }),
    );
    for (const renamed of ['负责人', 'Release lead']) {
      name = renamed;
      await act(() => client.invalidateQueries({ queryKey: ['agents'] }));
      await waitFor(() =>
        expect(result.current.title).toBe(`chat.consultation.title:${renamed}`),
      );
      expect(result.current.messages.items).toEqual([original]);
      expect(original.metadata.notice.agentName).toBe('Project manager');
    }
  },
);

it.each([403, 404])(
  'distinguishes a refused run from a missing run (%s)',
  async (status) => {
    resetApi({
      'agents/agentNames': () => [{ id: 'manager', name: 'Visible name' }],
      'agents/runs/completed': () => {
        throw new FakeApiError(status);
      },
    });
    const { result } = renderHook(
      () => useConsultationIdentity({ ...notice, agentId: null }),
      { wrapper: Wrapper },
    );
    expect(result.current.state).toBe('loading');
    await waitFor(() =>
      expect(result.current).toEqual(
        status === 404
          ? { state: 'snapshot', name: 'Project manager' }
          : { state: 'unavailable', name: null },
      ),
    );
  },
);

it('does not leak the snapshot on a directory refusal, including after previously resolving it', async () => {
  let refused = false;
  resetApi({
    'agents/agentNames': () => {
      if (refused) throw new FakeApiError(403);
      return [{ id: 'manager', name: 'Visible name' }];
    },
  });
  const { result } = renderHook(() => useConsultationIdentity(notice), {
    wrapper: Wrapper,
  });
  await waitFor(() => expect(result.current.state).toBe('resolved'));
  refused = true;
  await act(() => client.invalidateQueries({ queryKey: ['agents'] }));
  await waitFor(() =>
    expect(result.current).toEqual({ state: 'unavailable', name: null }),
  );
});

it('uses an explicitly marked snapshot only after a successful lookup finds no subject', async () => {
  let release: (value: unknown[]) => void = () => {};
  resetApi({
    'agents/agentNames': () =>
      new Promise<unknown[]>((resolve) => {
        release = resolve;
      }),
  });
  const { result } = renderHook(() => useConsultationIdentity(notice), {
    wrapper: Wrapper,
  });
  expect(result.current.state).toBe('loading');
  await act(async () => release([]));
  await waitFor(() =>
    expect(result.current).toEqual({
      state: 'snapshot',
      name: 'Project manager',
    }),
  );
});
