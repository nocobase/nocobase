// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api, clientMocks, resetApi } from './fake-client.js';
import type { OnlineChatConfigSnapshot } from '../../shared/conversations.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);
const { ChatProvider } = await import('../../client/chat/provider.js');
const { useConversationModel } =
  await import('../../client/chat/use-conversation-model.js');
const { useChatController } = await import('../../client/chat/controller.js');
const { agentsQueryClient } = await import('../../client/query.js');
const { chatKeys } = await import('../../client/chat/keys.js');

const first = { modelService: 'local', model: 'first' };
const second = { modelService: 'local', model: 'second' };
function snapshot(model = first): OnlineChatConfigSnapshot {
  return {
    selectedModel: model,
    scope: ['business'],
    model: ['local/first', 'local/second'],
    tool: ['read'],
    toolVersions: { read: '1' },
    systemPrompt: 'Keep this prompt',
    variable: { project: 'private' },
    thinking: 'high',
  };
}
function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ChatProvider>{children}</ChatProvider>
    </MemoryRouter>
  );
}
beforeEach(() => {
  agentsQueryClient().clear();
  resetApi({});
});
afterEach(() => agentsQueryClient().clear());

it('shares pending changes and the persisted snapshot across two mounted consumers', async () => {
  let saved = snapshot();
  let release!: () => void;
  resetApi({
    'agents/conversations/c/config': () => saved,
    'PATCH agents/conversations/c/config': ({ json }) => {
      expect(json).toEqual({ config: {}, selectedModel: second });
      return new Promise((resolve) => {
        release = () => resolve((saved = snapshot(second)));
      });
    },
  });
  const { result } = renderHook(
    () => ({ a: useConversationModel('c'), b: useConversationModel('c') }),
    { wrapper },
  );
  await waitFor(() =>
    expect(result.current.a.configuration.isSuccess).toBe(true),
  );
  act(() => result.current.a.select.mutate(second));
  await waitFor(() => {
    expect(result.current.a.changing).toBe(true);
    expect(result.current.b.changing).toBe(true);
  });
  expect(result.current.b.configuration.data?.selectedModel).toEqual(first);
  await act(async () => release());
  await waitFor(() =>
    expect(result.current.b.configuration.data).toEqual(snapshot(second)),
  );
  expect(saved.scope).toEqual(['business']);
  expect(saved.variable).toEqual({ project: 'private' });
});

it('does not let a late change to another conversation replace the selected conversation', async () => {
  let finish!: () => void;
  resetApi({
    'agents/conversations/a/config': () => snapshot(),
    'agents/conversations/b/config': () => snapshot(),
    'PATCH agents/conversations/a/config': () =>
      new Promise((resolve) => {
        finish = () => resolve(snapshot(second));
      }),
  });
  const tree = renderHook(({ id }) => useConversationModel(id), {
    wrapper,
    initialProps: { id: 'a' },
  });
  await waitFor(() =>
    expect(tree.result.current.configuration.isSuccess).toBe(true),
  );
  act(() => tree.result.current.select.mutate(second));
  await waitFor(() =>
    expect(api.calls.some((c) => c.method === 'PATCH')).toBe(true),
  );
  tree.rerender({ id: 'b' });
  await waitFor(() =>
    expect(tree.result.current.configuration.isSuccess).toBe(true),
  );
  await act(async () => finish());
  expect(tree.result.current.configuration.data?.selectedModel).toEqual(first);
  expect(agentsQueryClient().getQueryData(chatKeys.configuration('a'))).toEqual(
    snapshot(second),
  );
});

it('does not repopulate the shared cache after its authenticated controller is disposed', async () => {
  let finish!: () => void;
  resetApi({
    'agents/conversations/c/config': () => snapshot(),
    'PATCH agents/conversations/c/config': () =>
      new Promise((resolve) => {
        finish = () => resolve(snapshot(second));
      }),
  });
  const tree = renderHook(
    () => ({
      model: useConversationModel('c'),
      controller: useChatController(),
    }),
    { wrapper },
  );
  await waitFor(() =>
    expect(tree.result.current.model.configuration.isSuccess).toBe(true),
  );
  act(() => tree.result.current.model.select.mutate(second));
  await waitFor(() =>
    expect(api.calls.some((c) => c.method === 'PATCH')).toBe(true),
  );
  const controller = tree.result.current.controller;
  tree.unmount();
  controller.dispose();
  agentsQueryClient().clear();
  await act(async () => finish());
  expect(
    agentsQueryClient().getQueryData(chatKeys.configuration('c')),
  ).toBeUndefined();
});

it('does not read a configuration when no native conversation is selected', async () => {
  const tree = renderHook(() => useConversationModel(null), { wrapper });
  await act(async () => Promise.resolve());
  expect(tree.result.current.configuration.data).toBeUndefined();
  expect(api.calls).toHaveLength(0);
});
