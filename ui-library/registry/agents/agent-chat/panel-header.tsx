import { useContext, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ShareConversation } from './share-conversation.js';
import { useState, type ComponentType, type ReactElement } from 'react';
import {
  AgentsOptionsContext,
  PageDraftStoreContext,
  CHAT_MOBILE_QUERY,
  useChatPanel,
  useConversation,
  useConversationActions,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Share2Icon,
  Trash2Icon,
} from 'lucide-react';
import { DropdownMenuItem } from '#components/ui/dropdown-menu';
import { Button } from '#components/ui/button';
import { SquarePenIcon, XIcon } from 'lucide-react';
import {
  ConversationHeader,
  ConversationHeading,
} from './conversation-header.js';
import { ConversationMetadata } from './conversation-metadata.js';
import { DeleteConversationDialog } from './delete-conversation.js';
import { useMediaQuery } from './use-media-query.js';
import { useChatMode } from './chat-mode.js';
import { useChatTranslation } from './chat-i18n.js';
import { replaceable } from '@nocobase/app-plugin-agents/client/chat';

export interface PanelHeaderProps {
  /**
   * Receives the element the conversation renders its choices into (the agent, the model and its thinking level);
   * a replacement that leaves it out shows them in the composer's toolbar instead.
   */
  readonly choiceSlot?: ((element: HTMLElement | null) => void) | undefined;
}

/**
 * The panel's header over a conversation: its choices, the conversation list, a new conversation, the full-page view,
 * the panel's size, the conversation's menu and close, then its title; replaceable as `PanelHeader`.
 */
export function DefaultPanelHeader(): ReactElement {
  const panel = useChatPanel();
  const conversation = useConversation(panel.conversationId, {
    passive: true,
  }).data;
  const actions = useConversationActions();
  const { t } = useChatTranslation();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const store = useContext(PageDraftStoreContext);
  const { chatPath } = useContext(AgentsOptionsContext);
  const navigate = useNavigate();
  const openingRef = useRef(false);
  const [openError, setOpenError] = useState(false);
  async function openSessions(): Promise<void> {
    if (!store || openingRef.current) return;
    openingRef.current = true;
    setOpenError(false);
    try {
      const context = await store.readers.context?.();
      const editor = store.readers.editor?.();
      if (editor === null) return;
      const key = store.save({
        id: panel.conversationId,
        agent: panel.newAgentId,
        model: null,
        thinking: undefined,
        search: false,
        ...store.readers.choices?.(),
        text: editor?.text ?? '',
        files: editor?.files ?? [],
        ...(context ? { context } : {}),
      });
      const search = new URLSearchParams(
        panel.conversationId
          ? { conversation: panel.conversationId }
          : { draft: '1' },
      );
      await navigate(
        { pathname: chatPath, search: search.toString() },
        { state: { agentDraft: key } },
      );
      panel.closeChat();
      panel.selectConversation(null);
    } catch {
      setOpenError(true);
    } finally {
      openingRef.current = false;
    }
  }
  return (
    <>
      <ConversationHeader
        title={conversation?.title?.trim() || t('chat.newConversation')}
        onRename={
          conversation && !conversation.snapshot
            ? (title) => actions.rename.mutate({ id: conversation.id, title })
            : undefined
        }
        onHistory={() => panel.setView('history')}
        onOpenPage={
          store
            ? () => void openSessions()
            : conversation && !conversation.snapshot && panel.openPage
              ? () => panel.openPage?.(conversation.id)
              : undefined
        }
        onNew={() => panel.selectConversation(null)}
        onExpand={
          !store && !phone
            ? () =>
                panel.setMode(panel.mode === 'expanded' ? 'docked' : 'expanded')
            : undefined
        }
        expanded={panel.mode === 'expanded'}
        onClose={panel.closeChat}
        metadata={
          conversation && !conversation.snapshot ? (
            <ConversationMetadata conversation={conversation} />
          ) : null
        }
        menuItems={
          conversation && !conversation.snapshot ? (
            <>
              <DropdownMenuItem onClick={() => setSharing(true)}>
                <Share2Icon />
                {t('chat.sharing.share')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  actions.archive.mutate({
                    id: conversation.id,
                    archived: !conversation.archivedAt,
                  })
                }
              >
                {conversation.archivedAt ? (
                  <ArchiveRestoreIcon />
                ) : (
                  <ArchiveIcon />
                )}
                {t(conversation.archivedAt ? 'chat.unarchive' : 'chat.archive')}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setDeleting(true)}
              >
                <Trash2Icon />
                {t('chat.delete')}
              </DropdownMenuItem>
            </>
          ) : null
        }
      />
      {openError && <p role='alert'>{t('chat.contextFailed')}</p>}
      {conversation && (
        <ShareConversation
          conversationId={conversation.id}
          open={sharing}
          onOpenChange={setSharing}
        />
      )}
      {conversation && (
        <DeleteConversationDialog
          conversation={conversation}
          open={deleting}
          onOpenChange={setDeleting}
          onDeleted={() => panel.selectConversation(null)}
        />
      )}
    </>
  );
}
// eslint-disable-next-line react-refresh/only-export-components -- wrapped once at load, so replacements follow it
export const PanelHeader: ComponentType<PanelHeaderProps> = replaceable(
  'PanelHeader',
  DefaultPanelHeader,
);

export function PanelHistoryHeader(): ReactElement {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  return (
    <header
      data-testid='chat-history-header'
      className='flex items-center gap-2 border-b px-4 py-2'
    >
      <h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
        {t('chat.list.label')}
      </h2>
      <NewConversationButton />
      {!(!phone && panel.mode === 'expanded' && panel.view !== 'history') && (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('chat.close')}
          onClick={panel.closeChat}
        >
          <XIcon />
        </Button>
      )}
    </header>
  );
}
/** Compatibility for page titles; all editing UI lives in ConversationHeading. */
export function ConversationTitle({
  conversation,
  shown,
  level = 2,
  className,
}: {
  readonly conversation: ConversationDetail | null;
  readonly shown: string;
  readonly level?: 1 | 2;
  readonly className?: string;
}): ReactElement {
  const actions = useConversationActions();
  return (
    <ConversationHeading
      title={shown}
      level={level}
      className={className}
      onRename={
        conversation
          ? (title) => actions.rename.mutate({ id: conversation.id, title })
          : undefined
      }
    />
  );
}

/** Public list action retained for applications that compose their own list heading. */
export function NewConversationButton(): ReactElement {
  const mode = useChatMode();
  const { t } = useChatTranslation();
  return (
    <Button
      data-testid='chat-new-conversation'
      variant='ghost'
      size='icon-sm'
      aria-label={t('chat.newConversation')}
      onClick={mode.startNew}
    >
      <SquarePenIcon />
    </Button>
  );
}
