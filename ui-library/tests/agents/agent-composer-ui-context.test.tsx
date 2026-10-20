import {
  ChatProvider,
  useChatPanel,
  useChatSources,
  useChatUIContextSource,
  type ChatUIContextSource,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  PageContext,
  PageUIItem,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import {
  AgentComposer,
  ComposerContextChips,
} from '../../registry/agents/agent-composer';
import { Composer } from '../../registry/agents/agent-chat/composer';
import { SentContext } from '../../registry/agents/agent-chat/context-chips';
import enUS from '../../registry/agents/agent-chat/locales/en-US';

const host = vi.hoisted(() => ({
  api: { request: vi.fn(), stream: vi.fn() },
  realtime: { watch: () => ({ close: () => {} }) },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => host.api,
  useService: () => host.realtime,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'ui-context-composer', resources: enUS },
});
function Open() {
  const { openChat } = useChatPanel();
  useLayoutEffect(() => openChat(), [openChat]);
  return null;
}
function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <ChatProvider>
          <Open />
          {children}
        </ChatProvider>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
function SelectedSource({ source }: { readonly source: ChatUIContextSource }) {
  useChatUIContextSource(source);
  const { selectUI } = useChatSources();
  const { kind, id } = source;
  useEffect(() => {
    selectUI({ kind, id });
  }, [kind, id, selectUI]);
  return null;
}
const item: PageUIItem = {
  kind: 'custom-widget',
  id: 'widget',
  title: 'Widget snapshot',
  nested: { value: false },
};

it('shows removable selected UI chips and readonly sent UI identity without exposing arbitrary values', () => {
  const remove = vi.fn();
  const source: ChatUIContextSource = {
    ...item,
    label: 'Selected widget',
    getSnapshot: () => item,
  };
  const view = render(
    <ComposerContextChips
      chips={[{ kind: 'ui', key: 'ui-key', source }]}
      onRemove={remove}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Remove context: Selected widget' }),
  );
  expect(remove).toHaveBeenCalledWith('ui-key');
  view.unmount();
  render(
    <SentContext
      context={{
        route: '/',
        items: [],
        dropped: 0,
        ui: {
          version: 1,
          items: [
            item,
            { kind: 'unknown', id: 'other', privateValue: 'do not display' },
          ],
        },
      }}
    />,
    { wrapper },
  );
  expect(screen.getByText('Widget snapshot')).toBeVisible();
  expect(screen.getByText('unknown: other')).toBeVisible();
  expect(screen.queryByText('do not display')).toBeNull();
});

it('awaits selected source latest values, deduplicates send and detaches the submitted snapshot', async () => {
  let resolve: ((value: PageUIItem) => void) | undefined;
  const read = vi.fn(
    () =>
      new Promise<PageUIItem>((done) => {
        resolve = done;
      }),
  );
  const send = vi.fn(() => true);
  const source: ChatUIContextSource = {
    kind: item.kind,
    id: item.id,
    label: 'Selected widget',
    getSnapshot: read,
  };
  render(
    <>
      <SelectedSource source={source} />
      <Composer
        running={false}
        stopping={false}
        onSend={send}
        onStop={() => {}}
      />
    </>,
    { wrapper },
  );
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Use this widget' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
  expect(read).toHaveBeenCalledOnce();
  expect(send).not.toHaveBeenCalled();
  resolve?.(item);
  await waitFor(() => expect(send).toHaveBeenCalledOnce());
  const sent = send.mock.calls[0];
  expect(sent).toEqual([
    'Use this widget',
    { route: '/', items: [], ui: { version: 1, items: [item] } },
    [],
  ]);
  expect(screen.getByRole('textbox')).toHaveValue('');
});

it('fails closed with a translated error when a selected source is removed during its async read', async () => {
  let resolve: ((value: PageUIItem) => void) | undefined;
  const source: ChatUIContextSource = {
    kind: item.kind,
    id: item.id,
    label: 'Selected widget',
    getSnapshot: () =>
      new Promise((done) => {
        resolve = done;
      }),
  };
  const send = vi.fn(() => true);
  render(
    <>
      <SelectedSource source={source} />
      <Composer
        running={false}
        stopping={false}
        onSend={send}
        onStop={() => {}}
      />
    </>,
    { wrapper },
  );
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Keep this draft' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Remove context: Selected widget' }),
  );
  resolve?.(item);
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(
      enUS.chat.contextFailed,
    ),
  );
  expect(send).not.toHaveBeenCalled();
  expect(screen.getByRole('textbox')).toHaveValue('Keep this draft');
});

it.each(['disabled', 'unmounted'] as const)(
  'does not send after readiness becomes %s during async snapshot',
  async (state) => {
    let resolve: ((value: PageContext | undefined) => void) | undefined;
    const build = () =>
      new Promise<PageContext | undefined>((done) => {
        resolve = done;
      });
    const send = vi.fn(() => true);
    const view = render(
      <AgentComposer
        context={{ chips: [], onRemove: () => {}, build }}
        onSend={send}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Keep draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    if (state === 'disabled')
      view.rerender(
        <AgentComposer
          disabled
          context={{ chips: [], onRemove: () => {}, build }}
          onSend={send}
        />,
      );
    else view.unmount();
    resolve?.({ route: '/', items: [] });
    await Promise.resolve();
    expect(send).not.toHaveBeenCalled();
    if (state === 'disabled')
      expect(screen.getByRole('textbox')).toHaveValue('Keep draft');
  },
);
