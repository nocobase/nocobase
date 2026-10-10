/* eslint-disable react-refresh/only-export-components -- shared state and consumers */
import {
  ChatPanelScope,
  useChatApi,
  useChatPanel,
  useConversation,
  type ChatPanelValue,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ComposerSession } from '../components/composer-session.js';
import { ChatSubmissions } from './chat-submissions.js';
import { StudioChatContextProvider } from './use-chat-context.js';

interface StudioState {
  readonly top: ComposerSession;
  readonly editors: Map<string, ComposerSession>;
  readonly submissions: ChatSubmissions;
  readonly temporaryKey: string;
  readonly transfer: { key: string; text: string } | null;
  readonly setTransfer: (
    transfer: { key: string; text: string } | null,
  ) => void;
  readonly fromHeader: () => boolean;
  readonly setFromHeader: (value: boolean) => void;
}
const StudioStateContext = createContext<StudioState | null>(null);
export function chatEditorKey(
  variant: string,
  id: string | null,
  temporaryKey: string,
): string {
  return `${variant}:${id ?? temporaryKey}`;
}
export function StudioChatStateProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const panel = useChatPanel();
  const api = useChatApi();
  const detail = useConversation(panel.conversationId);
  const panelRef = useRef(panel);
  const detailRef = useRef(detail);
  const headerRef = useRef(false);
  const seedRef = useRef(0);
  const [temporaryKey, setTemporaryKey] = useState('new-0');
  const temporaryRef = useRef(temporaryKey);
  const [editors] = useState(() => new Map<string, ComposerSession>());
  const [top] = useState(() => new ComposerSession());
  const [transfer, setTransfer] = useState<StudioState['transfer']>(null);
  useLayoutEffect(() => {
    panelRef.current = panel;
    detailRef.current = detail;
    temporaryRef.current = temporaryKey;
  });
  // The constructor stores this callback; it runs only on completed requests.
  const [submissions] = useState(
    // eslint-disable-next-line react-hooks/refs -- constructor stores callback without invoking it
    () =>
      new ChatSubmissions(api, (result, record, created) => {
        if (created) {
          const editor = editors.get(record.editorKey);
          const destination = `${record.editorKey.split(':')[0]}:${result.id}`;
          if (editor && !editors.has(destination))
            editors.set(destination, editor);
          if (
            record.editorKey === `panel:${temporaryRef.current}` &&
            !panelRef.current.conversationId
          ) {
            panelRef.current.selectConversation(result.id);
            panelRef.current.resetSource();
          }
        }
        if (panelRef.current.conversationId === result.id)
          void detailRef.current.refetch();
      }),
  );
  useSyncExternalStore(
    submissions.subscribe,
    submissions.snapshot,
    submissions.snapshot,
  );
  const lifetimeRef = useRef(0);
  useEffect(() => {
    const lifetime = lifetimeRef;
    const generation = ++lifetime.current;
    return () => {
      // Invalidate requests synchronously on identity exit, before any queued response can send.
      submissions.invalidate();
      queueMicrotask(() => {
        if (lifetime.current !== generation) return;
        submissions.dispose();
        top.dispose();
        for (const editor of new Set(editors.values())) editor.dispose();
        editors.clear();
      });
    };
  }, [submissions, top, editors]);
  const scope: ChatPanelValue = {
    ...panel,
    openChat: (options = {}) => {
      if (options.conversationId === null) {
        seedRef.current += 1;
        setTemporaryKey(`new-${seedRef.current}`);
      }
      panel.openChat(options);
    },
    selectConversation: (id, agentId) => {
      if (id === null && agentId === undefined) {
        seedRef.current += 1;
        setTemporaryKey(`new-${seedRef.current}`);
      }
      panel.selectConversation(id, agentId);
    },
  };
  return (
    <StudioStateContext.Provider
      value={{
        top,
        editors,
        submissions,
        transfer,
        setTransfer,
        temporaryKey,
        fromHeader: () => headerRef.current,
        setFromHeader: (value) => {
          headerRef.current = value;
        },
      }}
    >
      <ChatPanelScope value={scope}>
        <StudioChatContextProvider>{children}</StudioChatContextProvider>
      </ChatPanelScope>
    </StudioStateContext.Provider>
  );
}
export function useStudioChat(): StudioState {
  const state = useContext(StudioStateContext);
  if (!state) throw new Error('StudioChatStateProvider is required');
  return state;
}
export function useChatEditor(key: string): ComposerSession {
  const { editors } = useStudioChat();
  let editor = editors.get(key);
  if (!editor) {
    editor = new ComposerSession();
    editors.set(key, editor);
  }
  useSyncExternalStore(editor.subscribe, editor.snapshot, editor.snapshot);
  return editor;
}
