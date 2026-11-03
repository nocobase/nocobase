import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import {
  isChatShortcut,
  CHAT_MOBILE_QUERY,
  useChatPanel,
  useConversation,
  useConversationActions,
} from '@nocobase/app-plugin-agents/client/chat';
import { ArchiveIcon, Trash2Icon } from 'lucide-react';
import { Button } from '#components/ui/button';
import { PlusIcon, XIcon } from 'lucide-react';
import { DropdownMenuItem } from '#components/ui/dropdown-menu';
import { ConversationPanelBody } from './panel-body.js';
import { ConversationPanelFrame } from './panel-frame.js';
import { ConversationHeader } from './conversation-header.js';
import { ConversationMetadata } from './conversation-metadata.js';
import { DeleteConversationDialog } from './delete-conversation.js';
import { ConversationView } from './conversation-view.js';
import { HistoryList } from './history-list.js';
import { ConversationDetails } from './conversation-details.js';
import {
  ConversationAssociationSummary,
  ConversationAssociationsProvider,
  type ConversationAssociationOptions,
} from './conversation-associations.js';
import { useMediaQuery } from './use-media-query.js';
import { useConversationUsage } from './use-conversation-usage.js';
import { useChatTranslation } from './chat-i18n.js';

export interface LinkedChatPanelProps extends ConversationAssociationOptions {
  readonly title?: string;
  readonly renderList?: (() => ReactNode) | undefined;
  readonly listHeader?: ReactNode;
  /** Keep an application's conversation controller; the shell remains the registry's. */
  readonly renderConversation?: (() => ReactNode) | undefined;
  readonly content?: ReactNode;
  readonly footer?: ReactNode;
  readonly preferComposer?: boolean;
  /** Hosts with their own transport selector can handle the shortcut themselves. */
  readonly listFirstShortcut?: boolean;
}
export function LinkedChatPanel({
  title,
  renderList,
  listHeader,
  renderConversation,
  content,
  footer,
  preferComposer,
  listFirstShortcut = true,
  ...associations
}: LinkedChatPanelProps): ReactElement | null {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  useEffect(() => {
    if (!listFirstShortcut || !panel.available) return;
    const open = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && !panel.open && isChatShortcut(event)) {
        event.preventDefault();
        panel.openChat({ view: 'history' });
      }
    };
    window.addEventListener('keydown', open, true);
    return () => window.removeEventListener('keydown', open, true);
  }, [listFirstShortcut, panel]);
  if (!panel.available) return null;
  return (
    <ConversationAssociationsProvider {...associations}>
      <ConversationPanelFrame
        title={title ?? t('chat.title')}
        preferComposer={preferComposer}
      >
        {content ?? (
          <ConversationPanelBody
            historyHeader={listHeader ?? <LinkedListHeader />}
            history={
              renderList ? (
                renderList()
              ) : (
                <HistoryList
                  activeId={panel.conversationId}
                  onOpen={panel.selectConversation}
                  header={null}
                />
              )
            }
            conversation={
              renderConversation ? renderConversation() : <LinkedConversation />
            }
          />
        )}
        {footer}
      </ConversationPanelFrame>
    </ConversationAssociationsProvider>
  );
}
function LinkedListHeader(): ReactElement {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  return (
    <div className='flex items-center gap-2 border-b px-4 py-2'>
      <h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
        {t('chat.history.title')}
      </h2>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('chat.newConversation')}
        onClick={() => panel.selectConversation(null)}
      >
        <PlusIcon />
      </Button>
      {/* Expanded, the list is a column beside the conversation, whose header already ends with restore and close. */}
      {panel.mode !== 'expanded' || panel.view === 'history' ? (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('chat.close')}
          onClick={panel.closeChat}
        >
          <XIcon />
        </Button>
      ) : null}
    </div>
  );
}
function LinkedConversation(): ReactElement {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  const detail = useConversation(panel.conversationId).data;
  const actions = useConversationActions();
  const [details, setDetails] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  useConversationUsage(panel.conversationId, false);
  const aside = !phone && panel.mode === 'expanded';
  return (
    <div className='relative flex min-h-0 min-w-0 flex-1'>
      <section className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <ConversationHeader
          title={detail?.title?.trim() || t('chat.newConversation')}
          onRename={
            detail
              ? (title) => actions.rename.mutate({ id: detail.id, title })
              : undefined
          }
          onBack={() => panel.setView('history')}
          onClose={panel.closeChat}
          onNew={detail ? () => panel.selectConversation(null) : undefined}
          onExpand={
            !phone
              ? () =>
                  panel.setMode(
                    panel.mode === 'expanded' ? 'docked' : 'expanded',
                  )
              : undefined
          }
          expanded={panel.mode === 'expanded'}
          onToggleDetails={detail ? () => setDetails(!details) : undefined}
          details={details}
          metadata={
            detail ? <ConversationMetadata conversation={detail} /> : null
          }
          summary={
            detail && !(aside && details) ? (
              <ConversationAssociationSummary
                conversationId={detail.id}
                onOpenDetails={() => setDetails(true)}
              />
            ) : null
          }
          menuItems={
            detail ? (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    actions.archive.mutate({
                      id: detail.id,
                      archived: !detail.archivedAt,
                    })
                  }
                >
                  <ArchiveIcon />
                  {t('chat.archive')}
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
        <ConversationView conversationId={panel.conversationId} />
      </section>
      {detail && (
        <DeleteConversationDialog
          conversation={detail}
          open={deleting}
          onOpenChange={setDeleting}
          onDeleted={() => panel.selectConversation(null)}
        />
      )}
      {detail && (
        <ConversationDetails
          open={details}
          beside={aside}
          conversation={detail}
          onClose={() => setDetails(false)}
        />
      )}
    </div>
  );
}
