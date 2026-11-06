// @vitest-environment jsdom
import {
  ClientApplicationContext,
  realtimeClientToken,
  type ApiClient,
  type ClientApplication,
} from '@nocobase/app-client';
import { ServiceContainer } from '@nocobase/service-provider';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { sdkController } from './sdk-controller.js';
import { sdkResponse } from './sdk-chat.js';
import { CONVERSATIONS_TOPIC } from '../../shared/conversations.js';
import type * as AppClient from '@nocobase/app-client';
const host = vi.hoisted(() => ({
  api: undefined as unknown as ApiClient,
  realtime: {
    watch: vi.fn(
      (
        _topic: string,
        _options?: {
          onReady?: () => void;
          onStateChange?: (state: string) => void;
        },
      ) => ({
        close: vi.fn(),
      }),
    ),
  },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof AppClient>()),
  useApiClient: () => host.api,
  useService: () => host.realtime,
}));
const {
  ChatProvider,
  useConversationMessages,
  useChatController,
  useChatStream,
  appUIMessageText,
  agentsQueryClient,
} = await import('../../client/chat.js');
type Controller = ReturnType<typeof useChatController>;
let fixture: ReturnType<typeof sdkController>;
afterEach(() => {
  cleanup();
  fixture?.controller.dispose();
  agentsQueryClient().clear();
  host.realtime.watch.mockClear();
});
it('moves every mounted surface to one fresh SDK owner for a full-prefix replay after acknowledged realtime recovery', async () => {
  fixture = sdkController();
  host.api = fixture.host;
  const output = fixture.output(),
    owners: Controller[] = [];
  function Surface() {
    const controller = useChatController(),
      messages = useConversationMessages('c1'),
      stream = useChatStream('c1');
    useLayoutEffect(() => {
      owners.push(controller);
    }, [controller]);
    return (
      <output
        data-testid='surface'
        data-status={stream?.status}
        data-count={messages.items.length}
      >
        {messages.items.map(appUIMessageText).join('\n')}
      </output>
    );
  }
  const services = new ServiceContainer();
  services.instance(realtimeClientToken, host.realtime as never);
  render(
    <ClientApplicationContext
      value={{ services } as unknown as ClientApplication}
    >
      <MemoryRouter>
        <ChatProvider>
          <Surface />
          <Surface />
        </ChatProvider>
      </MemoryRouter>
    </ClientApplicationContext>,
  );
  await act(async () => {
    for (const [, options] of host.realtime.watch.mock.calls)
      options?.onReady?.();
  });
  await waitFor(() => expect(output.attached).toBe(true));
  expect(owners).toHaveLength(2);
  expect(owners[0]).toBe(owners[1]);
  const previous = owners[0].chat('c1');
  output.emit({
    type: 'start',
    messageId: 'answer',
    messageMetadata: {
      conversationId: 'c1',
      createdAt: '2026-01-01T00:00:00Z',
      revision: 0,
    },
  });
  output.emit({ type: 'text-start', id: 'text' });
  output.emit({ type: 'text-delta', id: 'text', delta: 'A' });
  await waitFor(() =>
    screen
      .getAllByTestId('surface')
      .forEach((surface) => expect(surface).toHaveTextContent('A')),
  );
  output.error(new TypeError('Network connection lost'));
  await waitFor(() =>
    screen
      .getAllByTestId('surface')
      .forEach((surface) =>
        expect(surface).toHaveAttribute('data-status', 'error'),
      ),
  );
  fixture.setResponse(() =>
    sdkResponse([
      {
        type: 'start',
        messageId: 'answer',
        messageMetadata: {
          conversationId: 'c1',
          createdAt: '2026-01-01T00:00:00Z',
          revision: 0,
        },
      },
      { type: 'text-start', id: 'text' },
      { type: 'text-delta', id: 'text', delta: 'AB' },
      { type: 'text-end', id: 'text' },
      { type: 'finish' },
    ]),
  );
  expect(fixture.stream.mock.calls).toHaveLength(1);
  const conversationWatches = host.realtime.watch.mock.calls.filter(
    ([topic]) => topic === CONVERSATIONS_TOPIC,
  );
  await act(async () => {
    for (const [, options] of conversationWatches)
      options?.onStateChange?.('pending');
    for (const [, options] of conversationWatches) options?.onReady?.();
  });
  await waitFor(() =>
    screen.getAllByTestId('surface').forEach((surface) => {
      expect(surface).toHaveTextContent(/^AB$/);
      expect(surface).toHaveAttribute('data-count', '1');
    }),
  );
  expect(owners[0].chat('c1')).not.toBe(previous);
  expect(owners[0].chat('c1')).toBe(owners[1].chat('c1'));
  expect(
    fixture.stream.mock.calls.map(
      (call) => (call[0] as { method: string }).method,
    ),
  ).toEqual(['GET', 'GET']);
});
