/**
 * One conversation as a page of its own, for an application that gives it a route (for example, `/chat/:conversationId`,
 * where a conversation started from the home page lands). It is the panel's conversation view in its page form: the
 * messages centred at a readable width, the composer under them, and a header with the title (click to rename), the
 * agent with its availability and the conversation's mode, then new conversation, history, "Open in side panel" and a
 * menu (archive).
 *
 * The page puts its own value over the panel's (`ChatPanelScope`), so the view, the composer and the application's
 * extensions (plan cards, reference cards) work here unchanged: selecting another conversation moves to its page, a new
 * conversation goes to `newConversationPath` (the application's place to start one), and nothing pinned to the panel
 * or drafted for it lands here. Arriving closes the panel, so the same conversation is never shown twice with two
 * composers; "Open in side panel" opens it there and goes back to where the person was before the page.
 *
 * It needs `ChatProvider` with `conversationPath` above it.
 */
import {
  CHAT_MOBILE_QUERY,
  CHAT_PANEL_ATTRIBUTE,
  ChatPanelScope,
  useChatPageTracking,
  useChatPanel,
  useConversation,
  useConversationActions,
  type ChatPanelValue,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  ArchiveIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  PanelRightIcon,
  SquarePenIcon,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useNavigate } from 'react-router';

import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { cn } from 'cn';

import { AgentLine } from './agent-status.js';
import { useChatTranslation } from './chat-i18n.js';
import { ConversationView, PAGE_COLUMN } from './conversation-view.js';
import { ChatHistoryDialog } from './history-list.js';
import { ConversationTitle } from './panel-header.js';
import { useMediaQuery } from './use-media-query.js';

function noop(): void {}

/** Only where a pointer can aim: on a phone, focusing the box on arrival would raise the keyboard over the reply. */
function finePointer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches
  );
}

export interface ChatConversationPageProps {
  readonly conversationId: string;
  /** Where a new conversation starts (for example, its home page, whose composer picks the agent). */
  readonly newConversationPath: string;
}

export function ChatConversationPage({
  conversationId,
  newConversationPath,
}: ChatConversationPageProps): ReactElement {
  const outer = useChatPanel();
  const tracking = useChatPageTracking();
  const navigate = useNavigate();
  const pathOf = outer.conversationPath;

  useEffect(() => tracking?.enter(), [tracking]);

  // Arriving closes the panel: one conversation, one composer.
  const { open, closeChat } = outer;
  const arrivedRef = useRef<string | null>(null);
  useEffect(() => {
    if (arrivedRef.current === conversationId) return;
    arrivedRef.current = conversationId;
    if (open) closeChat();
  }, [conversationId, open, closeChat]);

  const focusRef = useRef<(() => void) | null>(null);
  const registerComposer = useCallback((focus: () => void) => {
    focusRef.current = focus;
    if (finePointer()) focus();
    return () => {
      if (focusRef.current === focus) focusRef.current = null;
    };
  }, []);
  const focusComposer = useCallback(() => focusRef.current?.(), []);

  const select = useCallback(
    (id: string | null) => {
      if (id === null) void navigate(newConversationPath);
      else if (id !== conversationId && pathOf) void navigate(pathOf(id));
    },
    [navigate, newConversationPath, conversationId, pathOf],
  );

  const scoped = useMemo<ChatPanelValue>(
    () => ({
      ...outer,
      open: true,
      mode: 'docked',
      view: 'chat',
      conversationId,
      newAgentId: null,
      setMode: noop,
      setView: noop,
      selectConversation: select,
      pinned: [],
      clearPinned: noop,
      draft: null,
      source: 'panel',
      resetSource: noop,
      registerComposer,
      focusComposer,
    }),
    [outer, conversationId, select, registerComposer, focusComposer],
  );

  function dock(): void {
    outer.openChat({ conversationId, view: 'chat' });
    outer.setMode('docked');
    void navigate(tracking?.returnTo() ?? newConversationPath);
  }

  return (
    <ChatPanelScope value={scoped}>
      <div
        className='flex h-full min-h-0 flex-col'
        {...{ [CHAT_PANEL_ATTRIBUTE]: '' }}
        data-testid='chat-page'
        data-conversation={conversationId}
      >
        <PageBar
          conversationId={conversationId}
          onNew={() => select(null)}
          onOpen={select}
          onDock={dock}
        />
        <ConversationView
          conversationId={conversationId}
          variant='page'
          className='flex-1'
        />
      </div>
    </ChatPanelScope>
  );
}

function PageBar({
  conversationId,
  onNew,
  onOpen,
  onDock,
}: {
  readonly conversationId: string;
  readonly onNew: () => void;
  readonly onOpen: (conversationId: string) => void;
  readonly onDock: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  const detail = useConversation(conversationId);
  const conversation = detail.data ?? null;
  const actions = useConversationActions();
  const mobile = useMediaQuery(CHAT_MOBILE_QUERY);
  const [historyOpen, setHistoryOpen] = useState(false);
  const shown = conversation
    ? conversation.title?.trim() || t('chat.untitled')
    : '';

  return (
    // The header lines up with the messages' column, as the title of what is under it.
    <header
      className={cn(PAGE_COLUMN, 'flex shrink-0 items-center gap-1 pt-4 pb-1')}
    >
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <ConversationTitle
          conversation={conversation}
          shown={shown}
          level={1}
          className='text-base font-semibold'
        />
        {conversation ? (
          <AgentLine
            conversation={conversation}
            data-testid='chat-page-agent'
          />
        ) : null}
      </div>
      <Button
        variant='ghost'
        size='icon'
        aria-label={t('chat.newConversation')}
        title={t('chat.newConversation')}
        onClick={onNew}
        data-testid='chat-page-new'
      >
        <SquarePenIcon />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        aria-label={t('chat.history.title')}
        title={t('chat.history.title')}
        onClick={() => setHistoryOpen(true)}
        data-testid='chat-page-history'
      >
        <HistoryIcon />
      </Button>
      {mobile ? null : (
        <Button
          variant='ghost'
          size='icon'
          aria-label={t('chat.openInPanel')}
          title={t('chat.openInPanel')}
          onClick={onDock}
          data-testid='chat-page-dock'
        >
          <PanelRightIcon />
        </Button>
      )}
      {conversation ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant='ghost' size='icon' aria-label={t('chat.more')} />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  actions.archive.mutate({
                    id: conversation.id,
                    archived: true,
                  });
                  onNew();
                }}
              >
                <ArchiveIcon />
                {t('chat.archive')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <ChatHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        activeId={conversationId}
        onOpen={onOpen}
      />
    </header>
  );
}
