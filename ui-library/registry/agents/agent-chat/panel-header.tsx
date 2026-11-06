import { ShareConversation } from './share-conversation.js';
import { useState, type ReactElement } from 'react';
import {
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
import { PlusIcon, XIcon } from 'lucide-react';
import {
  ConversationHeader,
  ConversationHeading,
} from './conversation-header.js';
import { ConversationMetadata } from './conversation-metadata.js';
import { DeleteConversationDialog } from './delete-conversation.js';
import { useMediaQuery } from './use-media-query.js';
import { useChatMode } from './chat-mode.js';
import { useChatTranslation } from './chat-i18n.js';

export function PanelHeader(): ReactElement {
  const panel = useChatPanel();
  const conversation = useConversation(panel.conversationId, {
    passive: true,
  }).data;
  const actions = useConversationActions();
  const { t } = useChatTranslation();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  return (
    <>
      <ConversationHeader
        title={conversation?.title?.trim() || t('chat.newConversation')}
        onRename={
          conversation && !conversation.snapshot
            ? (title) => actions.rename.mutate({ id: conversation.id, title })
            : undefined
        }
        onBack={() => panel.setView('history')}
        onNew={
          conversation && !conversation.snapshot
            ? () => panel.selectConversation(null)
            : undefined
        }
        onExpand={
          !phone
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
export function PanelHistoryHeader(): ReactElement {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  const mode = useChatMode();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  return (
    <header
      data-testid='chat-history-header'
      className='flex items-center gap-2 border-b px-4 py-2'
    >
      <h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
        {t(mode.mode === 'online' ? 'chat.modes.online' : 'chat.modes.runner')}
      </h2>
      <ModeSwitchButton />
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
      <PlusIcon />
    </Button>
  );
}
export function ModeSwitchButton(): ReactElement | null {
  const mode = useChatMode();
  const { t } = useChatTranslation();
  return mode.switchable && mode.other ? (
    <Button
      variant='ghost'
      size='icon-sm'
      data-testid='chat-mode-switch'
      aria-label={t(
        mode.other === 'online'
          ? 'chat.modes.switchToOnline'
          : 'chat.modes.switchToRunner',
      )}
      onClick={() => mode.other && mode.switchTo(mode.other)}
    >
      ⇄
    </Button>
  ) : null;
}
