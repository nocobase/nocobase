import {
  agentsQueryClient,
  ChatProvider,
  useChatPanel,
  useChatContextSource,
  useChatFilterSource,
  useChatSources,
  useChatUIContextSource,
  type ChatUIContextSource,
} from '@nocobase/app-plugin-agents/client/chat';
import type { MessageAttachment } from '@nocobase/app-plugin-agents/shared/conversations';
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
import { StrictMode, useLayoutEffect } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  Composer,
  type ComposerProps,
} from '../../registry/agents/agent-chat/composer';
import enUS from '../../registry/agents/agent-chat/locales/en-US';

const host = vi.hoisted(() => ({
  request: vi.fn(),
  realtime: { watch: () => ({ close: () => {} }) },
  send: vi.fn(() => true),
  snapshot: vi.fn<ChatUIContextSource['getSnapshot']>(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useRealtimeReadiness: () => true,
  useApiClient: () => host,
  useService: () => host.realtime,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'composer-lifecycle-test', resources: enUS },
  strict: false,
});
let panel: ReturnType<typeof useChatPanel>;
let sources: ReturnType<typeof useChatSources>;
let navigate: ReturnType<typeof useNavigate>;
function Probe() {
  const current = useChatPanel();
  const currentSources = useChatSources();
  const currentNavigate = useNavigate();
  useChatContextSource({
    kind: 'issue',
    id: 'page-item',
    label: 'Current page issue',
  });
  useChatFilterSource({
    page: 'issues',
    params: { status: 'open' },
    label: 'Old filter',
  });
  useChatUIContextSource({
    kind: 'form',
    id: 'procurement',
    label: 'Procurement',
    getSnapshot: host.snapshot,
  });
  useLayoutEffect(() => {
    panel = current;
    sources = currentSources;
    navigate = currentNavigate;
  });
  return <span data-testid='page-selection'>Old selected page text</span>;
}
function mount(registerAddFiles?: ComposerProps['registerAddFiles']) {
  return render(
    <StrictMode>
      <TestI18nProvider runtime={runtime}>
        <MemoryRouter>
          <ChatProvider>
            <Probe />
            <Composer
              running={false}
              stopping={false}
              onStop={() => {}}
              onSend={host.send}
              {...(registerAddFiles ? { registerAddFiles } : {})}
            />
          </ChatProvider>
        </MemoryRouter>
      </TestI18nProvider>
    </StrictMode>,
  );
}
const box = () => screen.getByRole('textbox');
const type = (text: string) =>
  fireEvent.change(box(), { target: { value: text } });
const submit = () => fireEvent.keyDown(box(), { key: 'Enter' });
const pick = (filename: string) =>
  fireEvent.change(screen.getByTestId('chat-attach-input'), {
    target: { files: [new File(['test'], filename, { type: 'text/plain' })] },
  });
const attachment: MessageAttachment = {
  id: 'upload',
  filename: 'note.txt',
  ext: 'txt',
  mimeType: 'text/plain',
  size: 4,
  contentUrl: '/files/upload',
  downloadUrl: '/files/upload',
  previewable: false,
};
beforeEach(() => {
  sessionStorage.clear();
  agentsQueryClient().clear();
  host.send.mockClear();
  host.request.mockReset().mockResolvedValue({ data: attachment });
  host.snapshot
    .mockReset()
    .mockResolvedValue({ kind: 'form', id: 'procurement' });
});
afterEach(() => agentsQueryClient().clear());

it.each(['select', 'open', 'link'])(
  'clears all carried work context on New via %s without unregistering page sources',
  (mode) => {
    mount();
    act(() =>
      panel.openChat({
        pin: { kind: 'issue', id: 'old-pin', label: 'Old pinned issue' },
      }),
    );
    act(() => sources.selectUI(sources.uiSources[0]!, true));
    const range = document.createRange();
    range.selectNodeContents(screen.getByTestId('page-selection'));
    const selection = document.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    act(() => document.dispatchEvent(new Event('selectionchange')));
    expect(sources.selection?.text).toBe('Old selected page text');
    expect(screen.getByTestId('chat-context-chips')).toHaveTextContent(
      'Old pinned issue',
    );
    expect(screen.getByTestId('chat-context-chips')).toHaveTextContent(
      'Procurement',
    );
    act(() => panel.closeChat());
    act(() => panel.openChat());
    expect(sources.selectedUIKeys.size).toBe(1);
    expect(panel.pinned).toHaveLength(1);
    act(() => {
      if (mode === 'select') panel.selectConversation(null);
      else if (mode === 'open') panel.openChat({ conversationId: null });
      else void navigate('/?chat=new');
    });
    expect(panel.pinned).toEqual([]);
    expect(sources.selectedUIKeys.size).toBe(0);
    expect(sources.selection).toBeNull();
    expect(sources.uiSources).toHaveLength(1);
    expect(sources.items).toHaveLength(1);
    expect(screen.queryByTestId('chat-context-chips')).toBeNull();
    type('Without old context');
    submit();
    expect(host.send).toHaveBeenCalledWith(
      'Without old context',
      { route: '/', items: [] },
      [],
    );
    expect(host.snapshot).not.toHaveBeenCalled();
  },
);

it('does not lose the context reset when New and a launcher update are batched', () => {
  mount();
  act(() => sources.selectUI(sources.uiSources[0]!));
  act(() => {
    panel.selectConversation(null);
    panel.openChat({
      pin: { kind: 'issue', id: 'fresh-pin', label: 'Fresh pin' },
    });
  });
  expect(sources.selectedUIKeys.size).toBe(0);
  expect(screen.getByTestId('chat-context-chips')).toHaveTextContent(
    'Fresh pin',
  );
  expect(screen.getByTestId('chat-context-chips')).not.toHaveTextContent(
    'Procurement',
  );
});

it('refuses sending when an explicitly included UI source is unavailable', async () => {
  mount();
  act(() =>
    panel.openChat({
      conversationId: null,
      draft: 'Keep this draft',
      uiSources: [{ kind: 'form', id: 'unavailable' }],
    }),
  );
  submit();
  await waitFor(() => expect(screen.getByRole('alert')).toBeVisible());
  expect(host.send).not.toHaveBeenCalled();
  expect(box()).toHaveValue('Keep this draft');
});

it('replaces old context atomically with only the business entry pin and selected form', async () => {
  mount();
  const oldForm = {
    kind: 'form',
    id: 'old-form',
    label: 'Old form',
    getSnapshot: () => ({ kind: 'form', id: 'old-form' }),
  };
  act(() => {
    sources.registerUI(oldForm);
  });
  act(() => sources.selectUI(oldForm));
  act(() =>
    panel.openChat({
      pin: { kind: 'issue', id: 'old-pin', label: 'Old pinned issue' },
    }),
  );
  act(() =>
    panel.openChat({
      conversationId: 'new-business-chat',
      draft: 'Read the current form',
      pin: { kind: 'issue', id: 'page-item', label: 'Current page issue' },
      uiSources: [{ kind: 'form', id: 'procurement' }],
    }),
  );
  const chips = screen.getByTestId('chat-context-chips');
  expect(chips).toHaveTextContent('Current page issue');
  expect(chips).toHaveTextContent('Procurement');
  expect(chips).not.toHaveTextContent('Old');
  expect(sources.selectedUIKeys.size).toBe(1);
  act(() =>
    panel.selectConversation('promoted', undefined, { preserveComposer: true }),
  );
  expect(sources.selectedUIKeys.size).toBe(1);
  submit();
  await waitFor(() =>
    expect(host.send).toHaveBeenCalledWith(
      'Read the current form',
      {
        route: '/',
        items: [{ kind: 'issue', id: 'page-item' }],
        ui: { version: 1, items: [{ kind: 'form', id: 'procurement' }] },
      },
      [],
    ),
  );
});

it('allows an explicit Ask action to re-include a previously removed page object without resetting text', () => {
  mount();
  const pin = { kind: 'issue', id: 'page-item', label: 'Current page issue' };
  act(() => panel.openChat({ conversationId: null, pin }));
  act(() => sources.remove('issue:page-item'));
  expect(screen.queryByTestId('chat-context-chips')).toBeNull();
  type('Keep this draft');
  act(() => panel.openChat({ pin }));
  expect(screen.getByTestId('chat-context-chips')).toHaveTextContent(
    'Current page issue',
  );
  expect(box()).toHaveValue('Keep this draft');
});

it('resets every explicit new chat, including an already blank conversation, without replaying prefill', async () => {
  mount();
  act(() => panel.openChat({ conversationId: null, draft: 'First prompt' }));
  expect(box()).toHaveValue('First prompt');
  type('My edited prompt');
  const first = box();
  act(() => panel.selectConversation(null));
  expect(box()).not.toBe(first);
  expect(box()).toHaveValue('');
  expect(panel.draft).toBeNull();
  type('A second draft');
  act(() => {
    panel.selectConversation(null);
    panel.focusComposer();
  });
  expect(box()).toHaveValue('');
  expect(panel.conversationId).toBeNull();
  await waitFor(() => expect(box()).toHaveFocus());
});

it('atomically replaces old text and prefill when a business entry opens another conversation', () => {
  mount();
  act(() =>
    panel.openChat({ conversationId: 'form-1', draft: 'First form prompt' }),
  );
  expect(box()).toHaveValue('First form prompt');
  type('An unsent edit');
  act(() =>
    panel.openChat({ conversationId: 'form-2', draft: 'Second form prompt' }),
  );
  expect(box()).toHaveValue('Second form prompt');
  expect(panel.conversationId).toBe('form-2');
  act(() => panel.openChat({ conversationId: null }));
  expect(box()).toHaveValue('');
  expect(panel.draft).toBeNull();
  act(() => panel.openChat({ conversationId: null, draft: '' }));
  expect(panel.draft?.text).toBe('');
  expect(box()).toHaveValue('');
});

it('keeps local text and attachments when closing and reopening the same conversation', async () => {
  mount();
  act(() =>
    panel.openChat({ conversationId: 'saved', draft: 'Initial prompt' }),
  );
  type('My unsent words');
  pick('note.txt');
  await waitFor(() =>
    expect(screen.getByTestId('chat-composer-files')).toHaveTextContent(
      'note.txt',
    ),
  );
  const editor = box();
  const revision = panel.composerRevision;
  act(() => panel.closeChat());
  act(() => panel.openChat());
  act(() => panel.openChat({ conversationId: 'saved' }));
  expect(box()).toBe(editor);
  expect(box()).toHaveValue('My unsent words');
  expect(panel.composerRevision).toBe(revision);
  expect(screen.getByTestId('chat-composer-files')).toHaveTextContent(
    'note.txt',
  );
});

it('preserves the composer on pre-send agent changes and first-send ID promotion', () => {
  mount();
  act(() => panel.openChat({ conversationId: null, draft: 'Keep the prompt' }));
  const editor = box();
  const revision = panel.composerRevision;
  act(() =>
    panel.selectConversation(null, 'online', { preserveComposer: true }),
  );
  expect(box()).toBe(editor);
  expect(box()).toHaveValue('Keep the prompt');
  act(() =>
    panel.selectConversation('created', undefined, { preserveComposer: true }),
  );
  expect(box()).toBe(editor);
  expect(box()).toHaveFocus();
  expect(box()).toHaveValue('Keep the prompt');
  expect(panel.composerRevision).toBe(revision);
  expect(panel.draft).toBeNull();
  act(() => panel.selectConversation('other'));
  expect(box()).toHaveValue('');
  act(() => panel.selectConversation('created'));
  expect(box()).toHaveValue('');
});

it('handles repeated ?chat=new links without treating an ordinary reopen as a reset', () => {
  mount();
  act(() => panel.openChat({ conversationId: null, draft: 'Old prompt' }));
  type('Old edit');
  act(() => {
    void navigate('/?chat=new');
  });
  expect(box()).toHaveValue('');
  expect(panel.draft).toBeNull();
  type('Another draft');
  act(() => {
    void navigate('/?chat=new');
  });
  expect(box()).toHaveValue('');
});

it('rejects a retained file-drop handler belonging to the previous composer', async () => {
  const handlers: ((files: readonly File[]) => void)[] = [];
  mount((add) => {
    handlers.push(add);
    return () => {};
  });
  act(() => panel.openChat({ conversationId: null }));
  const oldDrop = handlers.at(-1)!;
  act(() => panel.selectConversation(null));
  const file = new File(['test'], 'note.txt', { type: 'text/plain' });
  act(() => oldDrop([file]));
  expect(host.request).not.toHaveBeenCalled();
  act(() => handlers.at(-1)!([file]));
  await waitFor(() => expect(host.request).toHaveBeenCalledOnce());
  expect(screen.getByTestId('chat-composer-files')).toHaveTextContent(
    'note.txt',
  );
});

it('aborts queued uploads and ignores late completion after a new chat', async () => {
  let resolve: (value: { data: MessageAttachment }) => void = () => {};
  let signal: AbortSignal | undefined;
  host.request.mockImplementation(
    (request: { method: string; signal?: AbortSignal }) => {
      if (request.method !== 'POST') return Promise.resolve({});
      signal = request.signal;
      return new Promise<{ data: MessageAttachment }>((done) => {
        resolve = done;
      });
    },
  );
  mount();
  act(() => panel.openChat({ conversationId: null }));
  type('Old message');
  pick('note.txt');
  submit();
  expect(signal?.aborted).toBe(false);
  act(() => panel.selectConversation(null));
  expect(signal?.aborted).toBe(true);
  type('New draft');
  await act(async () => resolve({ data: attachment }));
  expect(host.send).not.toHaveBeenCalled();
  expect(box()).toHaveValue('New draft');
  expect(screen.queryByTestId('chat-composer-files')).toBeNull();
  expect(host.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'DELETE',
      path: 'agents/chatAttachments/upload',
    }),
  );
  submit();
  expect(host.send).toHaveBeenCalledOnce();
});

it.each(['resolve', 'reject'])(
  'ignores a late UI context %s after reset and allows the new draft to send',
  async (outcome) => {
    let resolve: (item: { kind: string; id: string }) => void = () => {};
    let reject: (error: Error) => void = () => {};
    host.snapshot.mockImplementation(
      () =>
        new Promise((done, fail) => {
          resolve = done;
          reject = fail;
        }),
    );
    mount();
    act(() => panel.openChat({ conversationId: null }));
    const source = sources.uiSources[0]!;
    act(() => sources.selectUI(source, true));
    type('Read the old form');
    submit();
    expect(host.snapshot).toHaveBeenCalledOnce();
    act(() => panel.selectConversation(null));
    type('New draft');
    await act(async () => {
      if (outcome === 'resolve') resolve({ kind: 'form', id: 'procurement' });
      else reject(new Error('Old snapshot failed'));
    });
    expect(host.send).not.toHaveBeenCalled();
    expect(box()).toHaveValue('New draft');
    expect(screen.queryByRole('alert')).toBeNull();
    act(() => sources.selectUI(source, false));
    submit();
    expect(host.send).toHaveBeenCalledOnce();
  },
);
