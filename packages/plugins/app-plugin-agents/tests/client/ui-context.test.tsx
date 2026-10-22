// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  buildPageContext,
  contextChips,
  snapshotUIContext,
  uiItemKey,
  type ChatUIContextSource,
} from '../../client/chat/context-model.js';
import {
  ChatProvider,
  useChatSources,
  useChatUIContextSource,
} from '../../client/chat/provider.js';

vi.mock('../../client/chat/use-chat.js', () => ({ useChatRealtime: () => {} }));
vi.mock('../../client/chat/controller.js', () => ({
  ChatClientProvider: ({ children }: { children: ReactNode }) => children,
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <ChatProvider available={false}>{children}</ChatProvider>
  </MemoryRouter>
);

it('registers separately from selection, reads latest callbacks, clones snapshots and removes the UI chip', async () => {
  let value = { kind: 'application-widget', id: 'one', custom: { value: 1 } };
  const hook = renderHook(
    () => {
      useChatUIContextSource({
        kind: value.kind,
        id: value.id,
        label: 'Widget',
        getSnapshot: () => value,
      });
      return useChatSources();
    },
    { wrapper },
  );
  await waitFor(() => expect(hook.result.current.uiSources).toHaveLength(1));
  expect(await hook.result.current.snapshotUI()).toBeUndefined();
  act(() => hook.result.current.selectUI(value));
  value = { ...value, custom: { value: 2 } };
  hook.rerender();
  const ui = await hook.result.current.snapshotUI();
  const input = {
    route: '/',
    pinned: [],
    sources: [],
    filter: null,
    selection: null,
    removed: new Set<string>(),
    uiSources: hook.result.current.uiSources,
    ui,
  };
  const payload = buildPageContext(input);
  expect(payload?.ui?.items[0].custom).toEqual({ value: 2 });
  value.custom.value = 3;
  expect(payload?.ui?.items[0].custom).toEqual({ value: 2 });
  expect(contextChips(input)[0]).toMatchObject({
    kind: 'ui',
    key: uiItemKey(value),
  });
  act(() => hook.result.current.remove(uiItemKey(value)));
  expect(await hook.result.current.snapshotUI()).toBeUndefined();
  hook.unmount();
});

it('rejects changed/unmounted sources or changed selection during an async read', async () => {
  let resolve!: (value: { kind: string; id: string }) => void;
  const hook = renderHook(() => useChatSources(), { wrapper });
  const source: ChatUIContextSource = {
    kind: 'x',
    id: 'one',
    label: 'One',
    getSnapshot: () =>
      new Promise((done) => {
        resolve = done;
      }),
  };
  let cleanup!: () => void;
  act(() => {
    cleanup = hook.result.current.registerUI(source);
  });
  act(() => hook.result.current.selectUI(source));
  const pending = hook.result.current.snapshotUI();
  act(() => cleanup());
  resolve({ kind: 'x', id: 'one' });
  await expect(pending).rejects.toThrow(/changed/);
  hook.unmount();
});

it('does not let an old cleanup remove a new lease of the same descriptor and rejects selection races', async () => {
  const hook = renderHook(() => useChatSources(), { wrapper });
  let complete!: (value: { kind: string; id: string }) => void;
  const source: ChatUIContextSource = {
    kind: 'x',
    id: 'one',
    label: 'One',
    getSnapshot: () =>
      new Promise((done) => {
        complete = done;
      }),
  };
  let oldCleanup!: () => void;
  act(() => {
    oldCleanup = hook.result.current.registerUI(source);
  });
  act(() => oldCleanup());
  act(() => {
    hook.result.current.registerUI(source);
  });
  act(() => oldCleanup());
  expect(hook.result.current.uiSources).toHaveLength(1);
  act(() => hook.result.current.selectUI(source));
  const pending = hook.result.current.snapshotUI();
  act(() => hook.result.current.selectUI(source, false));
  complete({ kind: 'x', id: 'one' });
  await expect(pending).rejects.toThrow(/selection/);
  hook.unmount();
});

it('invalidates pending reads when the identity-scoped provider unmounts', async () => {
  const hook = renderHook(() => useChatSources(), { wrapper });
  let resolve!: (value: { kind: string; id: string }) => void;
  const source: ChatUIContextSource = {
    kind: 'x',
    id: 'one',
    label: 'One',
    getSnapshot: () =>
      new Promise((done) => {
        resolve = done;
      }),
  };
  act(() => {
    hook.result.current.registerUI(source);
  });
  act(() => hook.result.current.selectUI(source));
  const pending = hook.result.current.snapshotUI();
  hook.unmount();
  resolve({ kind: 'x', id: 'one' });
  await expect(pending).rejects.toThrow(/changed/);
});

it('rejects duplicate source identities, mismatched snapshots and non-JSON async snapshots', async () => {
  const hook = renderHook(() => useChatSources(), { wrapper });
  const source = {
    kind: 'x',
    id: 'one',
    label: 'One',
    getSnapshot: async () => ({ kind: 'x', id: 'other' }),
  };
  act(() => {
    hook.result.current.registerUI(source);
  });
  expect(() => hook.result.current.registerUI(source)).toThrow(
    /already registered/,
  );
  await expect(snapshotUIContext([source])).rejects.toThrow(/identity/);
  await expect(
    snapshotUIContext([
      {
        ...source,
        getSnapshot: async () => ({ kind: 'x', id: 'one', bad: NaN }),
      },
    ]),
  ).rejects.toThrow(/JSON/);
  hook.unmount();
});
