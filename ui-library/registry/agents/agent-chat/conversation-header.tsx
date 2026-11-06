import { useState, type ReactElement, type ReactNode } from 'react';
import { CONVERSATION_TITLE_MAX } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ArrowLeftIcon,
  MoreHorizontalIcon,
  PanelRightIcon,
  XIcon,
  PlusIcon,
  Maximize2Icon,
  Minimize2Icon,
} from 'lucide-react';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { cn } from 'cn';
import { useChatTranslation } from './chat-i18n.js';

export interface ConversationHeaderProps {
  readonly title: string;
  readonly onRename?: ((title: string) => void) | undefined;
  readonly onBack?: (() => void) | undefined;
  readonly backClassName?: string;
  readonly onNew?: (() => void) | undefined;
  readonly onClose?: (() => void) | undefined;
  readonly onToggleDetails?: (() => void) | undefined;
  readonly details?: boolean | undefined;
  readonly onExpand?: (() => void) | undefined;
  readonly expanded?: boolean;
  readonly metadata?: ReactNode;
  readonly summary?: ReactNode;
  /** Low-frequency native commands such as archive and delete. */
  readonly menuItems?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
}

/** Page, panel and empty headers share the same ordered controls and accessible names. */
export function ConversationHeader({
  title,
  onRename,
  onBack,
  backClassName,
  onNew,
  onClose,
  onToggleDetails,
  details = false,
  onExpand,
  expanded = false,
  metadata,
  summary,
  menuItems,
  actions,
  className,
}: ConversationHeaderProps): ReactElement {
  const { t } = useChatTranslation();
  return (
    <header
      className={cn(
        'flex shrink-0 flex-col gap-2 border-b px-4 py-2 @md/agent-session:px-5 @md/agent-session:py-3',
        className,
      )}
      data-testid='conversation-header'
    >
      <div className='flex min-w-0 items-center gap-1'>
        {onBack && (
          <Button
            variant='ghost'
            size='icon-sm'
            className={cn('shrink-0', backClassName)}
            data-testid='chat-history-button'
            aria-label={t('chat.backToList')}
            onClick={onBack}
          >
            <ArrowLeftIcon />
          </Button>
        )}
        <ConversationHeading title={title} onRename={onRename} />
        {onNew && (
          <Button
            variant='ghost'
            size='icon-sm'
            data-testid='chat-new-conversation'
            aria-label={t('chat.newConversation')}
            onClick={onNew}
          >
            <PlusIcon />
          </Button>
        )}
        {onToggleDetails && (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t(details ? 'chat.hideDetails' : 'chat.showDetails')}
            aria-pressed={details}
            onClick={onToggleDetails}
          >
            <PanelRightIcon />
          </Button>
        )}
        {onExpand && (
          <Button
            variant='ghost'
            size='icon-sm'
            data-testid='chat-expand'
            aria-label={t(expanded ? 'chat.restorePanel' : 'chat.expandPanel')}
            onClick={onExpand}
          >
            {expanded ? <Minimize2Icon /> : <Maximize2Icon />}
          </Button>
        )}
        {menuItems && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('chat.more')}
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>{menuItems}</DropdownMenuContent>
          </DropdownMenu>
        )}
        {actions}
        {onClose && (
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('chat.close')}
            onClick={onClose}
          >
            <XIcon />
          </Button>
        )}
      </div>
      {metadata && (
        <div className='flex min-w-0 flex-nowrap items-center gap-1.5'>
          {metadata}
        </div>
      )}
      {summary}
    </header>
  );
}

export function ConversationHeading({
  title,
  onRename,
  level = 2,
  className,
}: {
  readonly title: string;
  readonly onRename?: ((title: string) => void) | undefined;
  readonly level?: 1 | 2;
  readonly className?: string;
}): ReactElement {
  const { t } = useChatTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const Heading = level === 1 ? 'h1' : 'h2';
  const save = () => {
    setEditing(false);
    const next = draft.trim().slice(0, CONVERSATION_TITLE_MAX);
    if (next && next !== title) onRename?.(next);
  };
  return editing ? (
    <Input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          save();
        } else if (event.key === 'Escape') {
          event.stopPropagation();
          setEditing(false);
        }
      }}
      aria-label={t('chat.rename')}
      className='min-w-0 flex-1'
    />
  ) : (
    <Heading
      className={cn('min-w-0 flex-1 text-[15px] font-semibold', className)}
    >
      {onRename ? (
        <button
          type='button'
          title={t('chat.renameHint', { title })}
          className='block max-w-full truncate rounded-md px-1 text-left enabled:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
          data-testid='chat-title'
          onClick={() => {
            setDraft(title);
            setEditing(true);
          }}
        >
          {title}
        </button>
      ) : (
        <span data-testid='chat-title' className='block truncate px-1'>
          {title}
        </span>
      )}
    </Heading>
  );
}

export function ConversationMetaChip({
  title,
  children,
  className,
  ...props
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly 'data-testid'?: string;
  readonly 'data-status'?: string;
}): ReactElement {
  return (
    <span
      {...props}
      title={title}
      className={cn(
        'inline-flex h-7.5 min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-full border bg-card px-2.5 text-xs whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  );
}
