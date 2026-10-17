import {
  ChatProvider,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, render, waitFor } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import type { AgentComposerProps } from '../../client/components/agent-composer.js';
import { Composer } from '../../client/extensions/nocobase-agent-chat/composer.js';
import enUS from '../../client/locales/en-US.js';

const host = vi.hoisted(() => ({
  accepted: vi.fn(() => true),
  send: undefined as AgentComposerProps['onSend'] | undefined,
  close: undefined as (() => void) | undefined,
  api: { request: vi.fn() },
  realtime: { subscribe: vi.fn(() => vi.fn()), onOpen: vi.fn(() => vi.fn()) },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => host.api,
  useService: () => host.realtime,
}));
vi.mock('#components/agent-composer', () => ({
  AgentComposer: function CapturedComposer(props: AgentComposerProps) {
    useLayoutEffect(() => {
      host.send = props.onSend;
    });
    return null;
  },
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'test-app', resources: enUS },
  strict: false,
});
function Open() {
  const { openChat, closeChat } = useChatPanel();
  useLayoutEffect(() => {
    host.close = closeChat;
    openChat();
  }, [openChat, closeChat]);
  return null;
}
function Tree({ disabled = false }: { disabled?: boolean }) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider>
          <Open />
          <Composer
            disabled={disabled}
            running={false}
            stopping={false}
            onStop={() => undefined}
            onSend={host.accepted}
          />
        </ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
beforeEach(() => {
  sessionStorage.clear();
  host.send = undefined;
  host.accepted.mockClear();
});

it.each(['disabled', 'closed', 'unmounted'])(
  'rejects an old upload-completion callback after the editor becomes %s',
  async (boundary) => {
    const tree = render(<Tree />);
    await waitFor(() => expect(host.send).toBeDefined());
    const delayedUploadCompletion = host.send!;
    if (boundary === 'disabled') tree.rerender(<Tree disabled />);
    if (boundary === 'closed') act(() => host.close?.());
    if (boundary === 'unmounted') tree.unmount();
    expect(delayedUploadCompletion('Retain this draft', undefined, [])).toBe(
      false,
    );
    expect(host.accepted).not.toHaveBeenCalled();
  },
);

it('accepts a current ready editor callback', async () => {
  render(<Tree />);
  await waitFor(() => expect(host.send).toBeDefined());
  expect(host.send!('Ready', undefined, [])).toBe(true);
  expect(host.accepted).toHaveBeenCalledOnce();
});
