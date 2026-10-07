import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import { Alert, AlertDescription, AlertTitle } from '../../shared/ui/alert.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../../shared/ui/input-group.js';
import { LoadingState } from '../../shared/loading-state.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../shared/ui/dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../shared/ui/dropdown-menu.js';
import { cn } from '../../shared/utils.js';
import { Input } from '../../shared/ui/input.js';
import { Label } from '../../shared/ui/label.js';
import { useAIChatBase, type AIConversation } from '../../providers/index.js';
import {
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  LoaderCircle,
} from 'lucide-react';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';

export function ConversationList({
  onClose,
  showCloseButton = true,
}: {
  onClose?: () => void;
  showCloseButton?: boolean;
} = {}) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const {
    conversations,
    activeConversationId,
    selectConversation,
    renameConversation,
    removeConversation,
    startNewConversation,
    setConversationListOpen,
    conversationsLoading,
    conversationSearch,
    searchConversations,
    historyError,
  } = useAIChatBase();
  const [searchValue, setSearchValue] = useState(conversationSearch);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    title: string;
  }>();
  const [renameTitle, setRenameTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  }>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  // Both of these adjust state while rendering, which React supports for
  // state derived from a changed input and which avoids the extra render an
  // effect would cost.
  const [syncedRenameTarget, setSyncedRenameTarget] = useState(renameTarget);
  if (syncedRenameTarget !== renameTarget) {
    setSyncedRenameTarget(renameTarget);
    setRenameTitle(renameTarget?.title ?? '');
    setRenameError(undefined);
  }

  const [syncedSearch, setSyncedSearch] = useState(conversationSearch);
  if (syncedSearch !== conversationSearch) {
    setSyncedSearch(conversationSearch);
    setSearchValue(conversationSearch);
  }

  const submitRename = async (event: FormEvent) => {
    event.preventDefault();
    if (!renameTarget || !renameTitle.trim()) return;
    setRenaming(true);
    setRenameError(undefined);
    try {
      await renameConversation(renameTarget.id, renameTitle);
      setRenameTarget(undefined);
    } catch (error) {
      setRenameError(
        error instanceof Error
          ? error.message
          : t('chat.rename.error', 'Unable to rename conversation'),
      );
    } finally {
      setRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await removeConversation(deleteTarget.id);
      setDeleteTarget(undefined);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : t('chat.delete.error', 'Unable to delete conversation'),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <AIConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelect={selectConversation}
        onCreate={startNewConversation}
        onClose={
          showCloseButton
            ? () => (onClose ? onClose() : setConversationListOpen(false))
            : undefined
        }
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearch={(value) => {
          void searchConversations(value).catch(() => undefined);
        }}
        submittedSearchValue={conversationSearch}
        loading={conversationsLoading}
        error={historyError}
        onRetry={() => {
          void searchConversations(conversationSearch).catch(() => undefined);
        }}
        renderActions={(conversation) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-xs'
                  className='min-h-[44px] min-w-[44px] shrink-0 touch-manipulation'
                  aria-label={t(
                    'chat.conversationActions',
                    'Conversation actions',
                  )}
                />
              }
            >
              <MoreHorizontal aria-hidden='true' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-36'>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className='min-h-[44px]'
                  onClick={() =>
                    setRenameTarget({
                      id: conversation.id,
                      title: conversation.title,
                    })
                  }
                >
                  <Pencil />
                  {t('actions.rename', 'Rename')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='min-h-[44px]'
                  variant='destructive'
                  onClick={() => {
                    setDeleteError(undefined);
                    setDeleteTarget({
                      id: conversation.id,
                      title: conversation.title,
                    });
                  }}
                >
                  <Trash2 />
                  {t('actions.delete', 'Delete')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open && !renaming) setRenameTarget(undefined);
        }}
      >
        <DialogContent>
          <form onSubmit={(event) => void submitRename(event)}>
            <DialogHeader>
              <DialogTitle>
                {t('chat.rename.title', 'Rename conversation')}
              </DialogTitle>
              <DialogDescription>
                {t(
                  'chat.rename.description',
                  'Choose a title that makes this conversation easy to find.',
                )}
              </DialogDescription>
            </DialogHeader>
            <div className='mt-5 space-y-2'>
              <Label htmlFor='conversation-title'>
                {t('chat.rename.field', 'Title')}
              </Label>
              <Input
                id='conversation-title'
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                autoFocus
                maxLength={120}
              />
              {renameError ? (
                <p className='text-xs text-destructive'>{renameError}</p>
              ) : null}
            </div>
            <DialogFooter className='mt-5'>
              <Button
                type='button'
                variant='outline'
                disabled={renaming}
                onClick={() => setRenameTarget(undefined)}
              >
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button type='submit' disabled={renaming || !renameTitle.trim()}>
                {renaming ? <LoaderCircle className='animate-spin' /> : null}
                {t('actions.save', 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('chat.delete.title', 'Delete conversation?')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'chat.delete.description',
                '“{{title}}” and its messages will be permanently deleted.',
                { title: deleteTarget?.title ?? '' },
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className='mt-3 text-sm text-destructive'>{deleteError}</p>
          ) : null}
          <DialogFooter className='mt-5'>
            <Button
              type='button'
              variant='outline'
              disabled={deleting}
              onClick={() => setDeleteTarget(undefined)}
            >
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? <LoaderCircle className='animate-spin' /> : null}
              {t('actions.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export type AIConversationListItem = Pick<AIConversation, 'id' | 'title'> &
  Partial<Pick<AIConversation, 'unread'>>;

export type AIConversationListProps<
  T extends AIConversationListItem = AIConversationListItem,
> = {
  conversations: readonly T[];
  activeConversationId?: string;
  onSelect: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Called on submit and when clearing the search. */
  onSearch?: (value: string) => void;
  /** The applied query, when it differs from the input draft. */
  submittedSearchValue?: string;
  loading?: boolean;
  error?: Error | string | null;
  /** Called only by the error state's retry action; the caller owns fetching. */
  onRetry?: () => void;
  /** Defaults to the localized Conversations heading when omitted. */
  heading?: ReactNode;
  onCreate?: () => void;
  onClose?: () => void;
  renderActions?: (conversation: T) => ReactNode;
  /** Noninteractive content inside the selection button, below its title. */
  renderMetadata?: (conversation: T) => ReactNode;
  /** Noninteractive avatar or icon inside the selection button. */
  renderLeading?: (conversation: T) => ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AIConversationList<T extends AIConversationListItem>({
  conversations,
  activeConversationId,
  onSelect,
  searchValue = '',
  onSearchChange,
  onSearch,
  submittedSearchValue = searchValue,
  loading = false,
  error,
  onRetry,
  heading,
  onCreate,
  onClose,
  renderActions,
  renderMetadata,
  renderLeading,
  footer,
  className,
}: AIConversationListProps<T>) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const searchInputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className={cn(
        'flex h-full min-w-0 flex-1 flex-col overflow-hidden overscroll-contain bg-card text-card-foreground',
        className,
      )}
    >
      <div className='flex min-h-12 shrink-0 items-center justify-between gap-2 border-b px-3'>
        <div className='flex min-w-0 items-center gap-1.5'>
          {onClose ? (
            <Button
              variant='ghost'
              size='icon-sm'
              className='min-h-[44px] min-w-[44px] shrink-0 touch-manipulation'
              aria-label={t(
                'chat.closeConversationList',
                'Close conversation list',
              )}
              onClick={onClose}
            >
              <PanelLeftClose aria-hidden='true' />
            </Button>
          ) : null}
          <h2 className='truncate text-sm font-semibold'>
            {heading === undefined
              ? t('chat.conversations', 'Conversations')
              : heading}
          </h2>
        </div>
        {onCreate ? (
          <Button
            variant='ghost'
            size='icon-sm'
            className='min-h-[44px] min-w-[44px] shrink-0 touch-manipulation'
            aria-label={t('chat.newConversationAction', 'New conversation')}
            onClick={onCreate}
          >
            <Plus aria-hidden='true' />
          </Button>
        ) : null}
      </div>
      {onSearchChange ? (
        <form
          className='shrink-0 border-b p-2.5'
          onSubmit={(event) => {
            event.preventDefault();
            onSearch?.(searchValue);
          }}
        >
          {/* Keep touch targets at least 44px even with a compact theme. */}
          <InputGroup className='h-auto min-h-[44px]'>
            <InputGroupInput
              ref={searchInputRef}
              name='conversation-search'
              type='search'
              autoComplete='off'
              enterKeyHint='search'
              value={searchValue}
              className='min-h-[44px] min-w-0 [&::-webkit-search-cancel-button]:appearance-none'
              placeholder={t(
                'chat.searchConversationsPlaceholder',
                'Search conversations…',
              )}
              aria-label={t('chat.searchConversations', 'Search conversations')}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <InputGroupAddon align='inline-end' className='gap-2 py-0'>
              {searchValue ? (
                <InputGroupButton
                  type='button'
                  size='icon-sm'
                  className='min-h-[44px] min-w-[44px] touch-manipulation'
                  aria-label={t(
                    'chat.clearConversationSearch',
                    'Clear conversation search',
                  )}
                  onClick={() => {
                    onSearchChange('');
                    onSearch?.('');
                    searchInputRef.current?.focus();
                  }}
                >
                  <X aria-hidden='true' />
                </InputGroupButton>
              ) : null}
              {onSearch ? (
                <InputGroupButton
                  type='submit'
                  size='icon-sm'
                  className='min-h-[44px] min-w-[44px] touch-manipulation'
                  aria-label={t(
                    'chat.searchConversations',
                    'Search conversations',
                  )}
                >
                  <Search aria-hidden='true' />
                </InputGroupButton>
              ) : null}
            </InputGroupAddon>
          </InputGroup>
        </form>
      ) : null}
      <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-2'>
        {error ? (
          <Alert variant='destructive' className='mb-2'>
            <AlertTitle>
              {t('chat.conversationsError', 'Unable to load conversations')}
            </AlertTitle>
            <AlertDescription className='break-words'>
              {error instanceof Error ? error.message : error}
            </AlertDescription>
            {onRetry ? (
              <Button
                type='button'
                variant='outline'
                className='mt-2 min-h-[44px] w-fit touch-manipulation'
                disabled={loading}
                onClick={() => onRetry()}
              >
                {t('chat.retryConversations', 'Retry')}
              </Button>
            ) : null}
          </Alert>
        ) : null}
        {loading ? (
          <LoadingState
            className='py-8'
            label={t('chat.loadingConversations', 'Loading conversations…')}
          />
        ) : conversations.length ? (
          <div className='flex flex-col gap-1'>
            {conversations.map((conversation) => {
              const active = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    'group/conversation flex items-start rounded-lg pr-1 transition-colors motion-reduce:transition-none',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/70',
                  )}
                >
                  <button
                    type='button'
                    className='flex min-h-[44px] min-w-0 flex-1 touch-manipulation items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
                    aria-current={active ? 'true' : undefined}
                    onClick={() => onSelect(conversation.id)}
                  >
                    {renderLeading ? (
                      <span className='flex shrink-0 items-center'>
                        {renderLeading(conversation)}
                      </span>
                    ) : null}
                    {conversation.unread && !active ? (
                      <span
                        className='size-2 shrink-0 rounded-full bg-destructive'
                        aria-label={t(
                          'chat.unreadConversation',
                          'Unread conversation',
                        )}
                      />
                    ) : null}
                    <span className='flex min-w-0 flex-1 flex-col gap-1 text-sm'>
                      <span
                        className='block truncate font-medium'
                        title={conversation.title}
                      >
                        {conversation.title}
                      </span>
                      {renderMetadata ? (
                        <span className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 break-words text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]'>
                          {renderMetadata(conversation)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  {renderActions?.(conversation)}
                </div>
              );
            })}
          </div>
        ) : !error ? (
          <div
            role='status'
            className='px-3 py-8 text-center text-sm text-muted-foreground'
          >
            {submittedSearchValue
              ? t('chat.noMatchingConversations', 'No matching conversations.')
              : t('chat.noConversations', 'No conversations yet.')}
          </div>
        ) : null}
      </div>
      {footer}
    </div>
  );
}
