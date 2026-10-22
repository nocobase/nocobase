import {
  agentsQueryClient,
  chatKeys,
  ChatProvider,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useConversationActions } from '../../client/extensions/nocobase-agent-chat/conversation-actions.js';
import { MemoryRouter } from 'react-router';
import enUS from '../../client/locales/en-US.js';

const host = vi.hoisted(() => ({
  request: vi.fn(),
  toaster: { show: vi.fn(), close: vi.fn() },
  realtime: { watch: () => ({ close: () => {} }) },
}));
const api = { request: host.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => host.toaster,
  useService: () => host.realtime,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'test-app', resources: enUS },
  strict: false,
});
function Actions() {
  const actions = useConversationActions();
  return (
    <>
      <button onClick={() => actions.markRead('A-private')}>Read</button>
      <button
        onClick={() =>
          actions.rename.mutate({
            id: 'A-private',
            title: 'A confidential title',
          })
        }
      >
        Rename
      </button>
      <button
        onClick={() =>
          actions.archive.mutate({ id: 'A-private', archived: true })
        }
      >
        Archive
      </button>
      <button onClick={() => actions.stop.mutate('A-private')}>Stop</button>
    </>
  );
}
function Tree({ identity, show = true }: { identity: string; show?: boolean }) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider key={identity}>{show ? <Actions /> : null}</ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
beforeEach(() => {
  agentsQueryClient().clear();
  host.request.mockReset();
  host.toaster.show.mockReset();
});
afterEach(() => agentsQueryClient().clear());

it.each(['Read', 'Rename', 'Archive', 'Stop'])(
  'ignores a late %s response after the identity boundary unmounts the old UI',
  async (action) => {
    let resolve!: (value: unknown) => void;
    host.request.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const tree = render(<Tree identity='A' />);
    fireEvent.click(screen.getByText(action));
    await waitFor(() => expect(host.request).toHaveBeenCalledOnce());
    tree.rerender(<Tree identity='B' />);
    agentsQueryClient().clear();
    await act(async () => {
      resolve({ data: { id: 'A-private', title: 'A confidential title' } });
    });
    expect(
      agentsQueryClient().getQueryData(chatKeys.conversation('A-private')),
    ).toBeUndefined();
    expect(host.toaster.show).not.toHaveBeenCalled();
  },
);

it('still updates cache and notifies the current identity', async () => {
  host.request.mockResolvedValue({
    data: { id: 'A-private', title: 'A confidential title' },
  });
  render(<Tree identity='A' />);
  fireEvent.click(screen.getByText('Rename'));
  await waitFor(() =>
    expect(
      agentsQueryClient().getQueryData(chatKeys.conversation('A-private')),
    ).toMatchObject({ title: 'A confidential title' }),
  );
  expect(host.toaster.show).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'success' }),
  );
});

it.each(['A', 'B'])(
  'archive Undo survives row removal only within its original identity (%s)',
  async (identity) => {
    host.request.mockResolvedValue({
      data: { id: 'A-private', title: 'A confidential title' },
    });
    const tree = render(<Tree identity='A' />);
    fireEvent.click(screen.getByText('Archive'));
    await waitFor(() => expect(host.toaster.show).toHaveBeenCalled());
    const toast = host.toaster.show.mock.calls[0][0] as {
      action: { onClick: () => void };
    };
    tree.rerender(<Tree identity={identity} show={false} />);
    act(() => toast.action.onClick());
    if (identity === 'A') {
      await waitFor(() => expect(host.request).toHaveBeenCalledTimes(2));
      expect(host.request.mock.calls[1][0]).toMatchObject({
        json: { archived: false },
      });
    } else {
      expect(host.request).toHaveBeenCalledOnce();
    }
  },
);
