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
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import type { ConversationMode } from '@nocobase/app-plugin-agents/shared/conversations';
import { useChatMode } from './chat-mode.js';
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
  const [listFolded, setListFolded] = useState(false);
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
  // Expanded beside a conversation, the list folds to a rail, as on My sessions; elsewhere it is the whole panel.
  const folded =
    listFolded && panel.mode === 'expanded' && panel.view !== 'history';
  return (
    <ConversationAssociationsProvider {...associations}>
      <ConversationPanelFrame
        title={title ?? t('chat.title')}
        preferComposer={preferComposer}
      >
        {content ?? (
          <ConversationPanelBody
            historyClassName={folded ? 'w-12' : undefined}
            historyHeader={
              folded ? (
                <LinkedListRail onUnfold={() => setListFolded(false)} />
              ) : (
                (listHeader ?? (
                  <LinkedListHeader onFold={() => setListFolded(true)} />
                ))
              )
            }
            history={
              folded ? null : renderList ? renderList() : <LinkedHistory />
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
/** The default list, of the mode its tabs show. */
function LinkedHistory(): ReactElement {
  const panel = useChatPanel();
  const mode = useChatMode();
  return (
    <HistoryList
      mode={mode.mode}
      activeId={panel.conversationId}
      onOpen={panel.selectConversation}
      header={null}
    />
  );
}
/** Tabs, New, then Close in the docked panel or, expanded beside a conversation, Fold the list (Studio's order). */
function LinkedListHeader({
  onFold,
}: {
  readonly onFold: () => void;
}): ReactElement {
  const panel = useChatPanel();
  const mode = useChatMode();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  const { t } = useChatTranslation();
  const beside =
    !phone && panel.mode === 'expanded' && panel.view !== 'history';
  return (
    <div className='flex items-center gap-2 border-b px-4 py-2'>
      {mode.switchable ? (
        <Tabs
          value={mode.mode ?? mode.modes[0]}
          className='min-w-0 flex-1'
          onValueChange={(next: ConversationMode) => mode.switchTo(next)}
        >
          <h2 className='sr-only'>{t('chat.history.title')}</h2>
          <TabsList className='w-full min-w-0'>
            {mode.modes.map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                className='min-w-0 flex-auto px-1 text-xs'
              >
                <span className='truncate'>
                  {t(
                    item === 'online'
                      ? 'chat.modes.online'
                      : 'chat.modes.runner',
                  )}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : (
        <h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
          {t('chat.history.title')}
        </h2>
      )}
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('chat.newConversation')}
        onClick={() => panel.selectConversation(null)}
      >
        <PlusIcon />
      </Button>
      {beside ? (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('chat.history.fold')}
          title={t('chat.history.fold')}
          onClick={onFold}
          data-testid='chat-history-fold'
        >
          <PanelLeftCloseIcon />
        </Button>
      ) : (
        <Button
          variant='ghost'
          size='icon-sm'
          aria-label={t('chat.close')}
          onClick={panel.closeChat}
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}
/** The folded list beside the conversation: Unfold and New, as My sessions' rail. */
function LinkedListRail({
  onUnfold,
}: {
  readonly onUnfold: () => void;
}): ReactElement {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  return (
    <div
      className='flex flex-col items-center gap-2 py-3'
      data-testid='chat-history-rail'
    >
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('chat.history.unfold')}
        title={t('chat.history.unfold')}
        onClick={onUnfold}
        data-testid='chat-history-unfold'
      >
        <PanelLeftOpenIcon />
      </Button>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('chat.newConversation')}
        onClick={() => panel.selectConversation(null)}
      >
        <PlusIcon />
      </Button>
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
