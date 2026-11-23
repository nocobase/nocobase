import {
  useCallback,
  useEffect,
  useContext,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import {
  PageDraftStoreContext,
  RestoredPageDraftContext,
} from '../../chat/page-draft.js';
import { useLocation, useSearchParams } from 'react-router';
import {
  ChatPanelScope,
  useChatPanel,
  type ChatPanelValue,
} from '../../chat.js';
import { ChatWorkspace } from '../../panel/workspace.js';
import { useChatTranslation } from '../../panel/chat-i18n.js';

export default function MyConversations(): ReactElement {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  const [query, setQuery] = useSearchParams();
  const id = query.get('conversation');
  const store = useContext(PageDraftStoreContext);
  const location = useLocation();
  const state: unknown = location.state;
  const transferKey =
    state && typeof state === 'object' && 'agentDraft' in state
      ? state.agentDraft
      : null;
  const [handoff, setHandoff] = useState(() => {
    const pending = store?.pending;
    return pending && pending.key === transferKey && pending.draft.id === id
      ? pending
      : null;
  });
  useEffect(() => {
    if (handoff) store?.release(handoff.key);
  }, [store, handoff]);
  const restored =
    handoff && transferKey === handoff.key && handoff.draft.id === id
      ? handoff.draft
      : null;
  const [agentId, setAgentId] = useState<string | null>(
    restored?.agent ?? null,
  );
  const [revision, setRevision] = useState(0);
  const focusRef = useRef<(() => void) | null>(null);
  const registerComposer = useCallback((callback: () => void) => {
    focusRef.current = callback;
    return () => {
      if (focusRef.current === callback) focusRef.current = null;
    };
  }, []);
  const { open, closeChat } = panel;
  useEffect(() => {
    if (open) closeChat();
  }, [open, closeChat]);

  const select: ChatPanelValue['selectConversation'] = (
    next,
    agent,
    options,
  ) => {
    if (next === null && agent !== undefined) setAgentId(agent);
    if (!options?.preserveComposer) {
      setHandoff(null);
      setRevision((value) => value + 1);
      if (!agent) setAgentId(null);
    }
    const params: Record<string, string> = next
      ? { conversation: next }
      : { draft: '1' };
    if (next !== id || (!next && !query.has('draft'))) {
      setQuery(params, { replace: Boolean(next && options?.preserveComposer) });
    }
  };
  return (
    <ChatPanelScope
      value={{
        ...panel,
        open: true,
        conversationId: id,
        agentMode: null,
        newAgentId: agentId,
        selectConversation: select,
        pinned: [],
        draft: null,
        composerRevision: revision,
        source: 'panel',
        registerComposer,
        focusComposer: () => focusRef.current?.(),
      }}
    >
      <RestoredPageDraftContext.Provider value={restored}>
        <ChatWorkspace
          conversationId={id}
          view={id || query.has('draft') ? 'conversation' : 'list'}
          onOpen={select}
          onNew={() => select(null)}
          onBack={() => setQuery({})}
          onDeleted={() => setQuery({})}
          list={{
            heading: (
              <h1 className='truncate text-base font-semibold'>
                {t('myConversations')}
              </h1>
            ),
          }}
        />
      </RestoredPageDraftContext.Provider>
    </ChatPanelScope>
  );
}
