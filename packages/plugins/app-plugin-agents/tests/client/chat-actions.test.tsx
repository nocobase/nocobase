// @vitest-environment jsdom
import {
  act,
  render,
  fireEvent,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ConversationListPages } from '../../client/chat/use-chat.js';
import { ChatClientProvider } from '../../client/chat/controller.js';
import { useConversationActions } from '../../client/chat/use-chat.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import type * as AppClient from '@nocobase/app-client';
import type * as I18nClient from '@nocobase/i18n/client';
const host = vi.hoisted(() => ({
  request: vi.fn(),
  show: vi.fn(),
  close: vi.fn(),
}));
const api = { request: host.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof AppClient>()),
  useApiClient: () => api,
  useToaster: () => host,
}));
vi.mock('@nocobase/i18n/client', async (original) => ({
  ...(await original<typeof I18nClient>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
function Row() {
  const a = useConversationActions();
  return (
    <>
      <button onClick={() => a.stop.mutate('c')}>Stop</button>
      <button onClick={() => a.archive.mutate({ id: 'c', archived: true })}>
        Archive
      </button>
      <button onClick={() => a.markRead('c')}>Read</button>
      <button
        onClick={() =>
          void a.remove.mutateAsync('c').then(() => host.close('removed'))
        }
      >
        Remove
      </button>
    </>
  );
}
function Tree({ identity, show = true }: { identity: string; show?: boolean }) {
  return (
    <ChatClientProvider key={identity}>
      {show ? <Row /> : null}
    </ChatClientProvider>
  );
}
beforeEach(() => {
  agentsQueryClient().clear();
  host.request.mockReset();
  host.show.mockReset().mockReturnValue('toast');
  host.close.mockReset();
});
afterEach(() => {
  cleanup();
  agentsQueryClient().clear();
});
it.each(['Stop', 'Archive', 'Read', 'Remove'])(
  'ignores a late %s result after A → B → A',
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
    tree.rerender(<Tree identity='A' />);
    agentsQueryClient().clear();
    await act(async () =>
      resolve({ data: { id: 'c', title: 'Private old A' } }),
    );
    expect(
      agentsQueryClient().getQueryData(chatKeys.conversation('c')),
    ).toBeUndefined();
    expect(host.show).not.toHaveBeenCalled();
  },
);
it('ignores a late response across logout and login to the same account', async () => {
  let resolve!: (value: unknown) => void;
  host.request.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const tree = render(<Tree identity='A' />);
  fireEvent.click(screen.getByText('Stop'));
  await waitFor(() => expect(host.request).toHaveBeenCalledOnce());
  tree.rerender(<div />);
  tree.rerender(<Tree identity='A' />);
  agentsQueryClient().clear();
  await act(async () => resolve({ data: { id: 'c' } }));
  expect(
    agentsQueryClient().getQueryData(chatKeys.conversation('c')),
  ).toBeUndefined();
});
it.each([false, true])(
  'keeps row-detached Undo only within its identity (identity changes: %s)',
  async (changed) => {
    host.request.mockResolvedValue({ data: { id: 'c', title: 'Saved' } });
    const tree = render(<Tree identity='A' />);
    fireEvent.click(screen.getByText('Archive'));
    await waitFor(() => expect(host.show).toHaveBeenCalledOnce());
    const toast = host.show.mock.calls[0][0] as {
      action: { onClick: () => void };
    };
    tree.rerender(<Tree identity='A' show={false} />);
    if (changed) {
      tree.rerender(<Tree identity='B' />);
      tree.rerender(<Tree identity='A' />);
    }
    await act(async () => toast.action.onClick());
    if (changed) expect(host.request).toHaveBeenCalledOnce();
    else {
      await waitFor(() => expect(host.request).toHaveBeenCalledTimes(2));
      expect(host.request.mock.calls[1][0].json).toEqual({ archived: false });
    }
  },
);

it('removes the deleted conversation from every list page before navigation and cancels stale responses', async () => {
  render(<Tree identity='A' />);
  const client = agentsQueryClient();
  const pages = {
    pages: [
      { items: [{ id: 'c' }, { id: 'keep' }], nextCursor: 'next' },
      { items: [{ id: 'c' }], nextCursor: null },
    ],
    pageParams: [null, 'next'],
  } as ConversationListPages;
  const keys = [chatKeys.list({}), chatKeys.list({ q: 'match' })];
  for (const key of keys) client.setQueryData(key, pages);
  let release!: (value: ConversationListPages) => void;
  const inflight = client
    .fetchQuery({
      queryKey: keys[1],
      staleTime: 0,
      queryFn: () =>
        new Promise<ConversationListPages>((done) => {
          release = done;
        }),
    })
    .catch(() => undefined);
  host.request.mockResolvedValue({});
  let atNavigation: ConversationListPages[] = [];
  host.close.mockImplementation(() => {
    atNavigation = keys.map((key) =>
      client.getQueryData<ConversationListPages>(key)!,
    );
  });
  fireEvent.click(screen.getByText('Remove'));
  await waitFor(() => expect(host.close).toHaveBeenCalledWith('removed'));
  for (const cached of atNavigation) {
    expect(
      cached.pages.map((page) => page.items.map((item) => item.id)),
    ).toEqual([['keep'], []]);
    expect(cached.pageParams).toEqual(pages.pageParams);
    expect(cached.pages[0].nextCursor).toBe('next');
  }
  await act(async () => {
    release(pages);
    await inflight;
  });
  expect(
    client
      .getQueryData<ConversationListPages>(keys[1])!
      .pages[0].items.map((item) => item.id),
  ).toEqual(['keep']);
  expect(client.getQueryState(keys[0])?.isInvalidated).toBe(true);
});
