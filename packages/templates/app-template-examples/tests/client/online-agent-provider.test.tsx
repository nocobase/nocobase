import {
  agentsQueryClient,
  CHAT_PANEL_STORAGE_KEY,
  chatKeys,
  useChatController,
  useChatPanel,
  type ChatController,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OnlineAgentProvider } from '../../client/components/online-agent/provider.js';

const host = vi.hoisted(() => ({
  identity: 'A' as string | null,
  pending: false,
  api: { request: vi.fn(), stream: vi.fn() },
  realtime: { watch: vi.fn(() => ({ close: vi.fn() })) },
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: host.identity ? { user: { id: host.identity } } : null,
    isPending: host.pending,
  }),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useRealtimeReadiness: () => true,
  useApiClient: () => host.api,
  useService: () => host.realtime,
}));
let controller: ChatController;
function Probe() {
  const panel = useChatPanel();
  const current = useChatController();
  useLayoutEffect(() => {
    controller = current;
  });
  return (
    <>
      <button
        onClick={() =>
          panel.openChat({ conversationId: 'A-private', draft: 'A draft' })
        }
      >
        Open private chat
      </button>
      <button onClick={panel.closeChat}>Close chat</button>
      <output>
        {JSON.stringify({
          open: panel.open,
          id: panel.conversationId,
          draft: panel.draft?.text ?? null,
        })}
      </output>
      <Link to='/other'>Navigate</Link>
    </>
  );
}
function Available() {
  const panel = useChatPanel();
  return panel.available ? <Probe /> : <p>Chat unavailable</p>;
}
function Tree() {
  return (
    <MemoryRouter>
      <OnlineAgentProvider>
        <Available />
        <Routes>
          <Route path='*' element={<h1>Page</h1>} />
        </Routes>
      </OnlineAgentProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  host.identity = 'A';
  host.pending = false;
  host.api.request.mockReset();
  host.api.stream.mockReset();
  host.realtime.watch.mockClear();
  sessionStorage.clear();
  agentsQueryClient().clear();
});
afterEach(() => agentsQueryClient().clear());

it('clears unscoped persisted state before first mount, including StrictMode remounts', async () => {
  sessionStorage.setItem(
    CHAT_PANEL_STORAGE_KEY,
    JSON.stringify({
      open: true,
      conversationId: 'previous-owner',
      view: 'history',
    }),
  );
  render(
    <StrictMode>
      <Tree />
    </StrictMode>,
  );
  await screen.findByRole('button', { name: 'Open private chat' });
  expect(screen.getByRole('status')).toHaveTextContent(
    '{"open":false,"id":null,"draft":null}',
  );
  expect(host.api.request).not.toHaveBeenCalled();
});

it('keeps the same controller, selection and draft across close/reopen, navigation and shortcuts', async () => {
  render(<Tree />);
  fireEvent.click(await screen.findByText('Open private chat'));
  const first = controller;
  fireEvent.click(screen.getByText('Navigate'));
  expect(controller).toBe(first);
  fireEvent.click(screen.getByText('Close chat'));
  expect(screen.getByRole('status')).toHaveTextContent('"open":false');
  fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
  expect(screen.getByRole('status')).toHaveTextContent('"open":true');
  expect(screen.getByRole('status')).toHaveTextContent('A-private');
  expect(screen.getByRole('status')).toHaveTextContent('A draft');
  fireEvent.keyDown(window, { key: 'j', ctrlKey: true, isComposing: true });
  expect(screen.getByRole('status')).toHaveTextContent('"open":true');
});

it.each(['direct', 'signed-out', 'pending'] as const)(
  'isolates A → B via %s, aborts old streams and ignores late history',
  async (transition) => {
    let resolve!: (value: unknown) => void;
    host.api.request
      .mockResolvedValueOnce({ data: [], meta: { lastSeq: 0 } })
      .mockResolvedValueOnce({ data: [], meta: { lastSeq: 0 } });
    host.api.request.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    let signal: AbortSignal | undefined;
    host.api.stream.mockImplementation((input: { signal: AbortSignal }) => {
      signal = input.signal;
      return Promise.resolve(new ReadableStream());
    });
    const { rerender } = render(<Tree />);
    fireEvent.click(await screen.findByText('Open private chat'));
    const first = controller;
    await act(async () => {
      await first.loadHistory('A-private');
    });
    act(() =>
      first.receive('A-private', {
        id: 'A-private',
        execution: { status: 'running' },
      } as never),
    );
    await waitFor(() => expect(signal).toBeDefined());
    let history!: Promise<void>;
    act(() => {
      history = first.loadHistory('A-private');
    });
    agentsQueryClient().setQueryData(chatKeys.agents, [{ id: 'A-secret' }]);
    if (transition !== 'direct') {
      if (transition === 'pending') host.pending = true;
      else host.identity = null;
      rerender(<Tree />);
      expect(screen.getByText('Chat unavailable')).toBeInTheDocument();
    }
    host.identity = 'B';
    host.pending = false;
    rerender(<Tree />);
    await waitFor(() => expect(controller).not.toBe(first));
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent(
      '{"open":false,"id":null,"draft":null}',
    );
    expect(agentsQueryClient().getQueryData(chatKeys.agents)).toBeUndefined();
    await act(async () => {
      resolve({
        data: [{ id: 'private-message', seq: 1 }],
        meta: { lastSeq: 1 },
      });
      await history;
    });
    expect(controller.history('A-private').state.items).toEqual([]);
    expect(first.history('A-private').state.items).toEqual([]);
    expect(screen.queryByText('A draft')).not.toBeInTheDocument();
    const second = controller;
    host.identity = 'A';
    rerender(<Tree />);
    await waitFor(() => expect(controller).not.toBe(second));
    expect(controller).not.toBe(first);
    expect(controller.history('A-private').state.items).toEqual([]);
  },
);

it('mounts no controller/subscription while signed out or pending', () => {
  host.identity = null;
  const { rerender } = render(<Tree />);
  host.identity = 'A';
  host.pending = true;
  rerender(<Tree />);
  expect(screen.getByText('Chat unavailable')).toBeInTheDocument();
  expect(host.realtime.watch).not.toHaveBeenCalled();
  expect(host.api.request).not.toHaveBeenCalled();
});
