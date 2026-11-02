import {
  CHAT_MOBILE_QUERY,
  useAgentText,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ConversationDetail,
  ConversationLink,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '#components/ui/sheet';
import { ConversationAssociations } from './conversation-associations.js';
import { useChatTranslation } from './chat-i18n.js';
import { useConversationUsage } from './use-conversation-usage.js';
import { UsageSection } from './usage.js';
import { useMediaQuery } from './use-media-query.js';

export function ConversationDetails({
  beside = false,
  open,
  conversation,
  onClose,
  onOpen,
  metadata,
  testId = 'chat-conversation-details',
}: {
  readonly beside?: boolean;
  readonly open: boolean;
  readonly conversation: ConversationDetail;
  readonly onClose: () => void;
  readonly onOpen?: ((link: ConversationLink) => boolean | void) | undefined;
  readonly metadata?: ReactNode;
  readonly testId?: string;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const { i18n } = useTranslation();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  const agent = useAgentText();
  const usage = useConversationUsage(conversation.id, false, { passive: true });
  const content = (
    <div className='min-h-0 flex-1 overflow-y-auto overscroll-y-contain'>
      <ConversationAssociations
        conversationId={conversation.id}
        onOpen={onOpen}
      />
      <section className='flex flex-col gap-2.5 border-b px-5 py-4'>
        <h3 className='text-sm font-semibold'>{t('chat.sessionDetails')}</h3>
        <dl className='grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs [&>dd]:min-w-0 [&>dd]:break-words [&>dt]:whitespace-nowrap'>
          {conversation.mode !== 'online' && conversation.runner?.name ? (
            <>
              <dt className='text-muted-foreground'>{t('chat.runtime')}</dt>
              <dd>{conversation.runner.name}</dd>
            </>
          ) : null}
          <dt className='text-muted-foreground'>{t('chat.agent')}</dt>
          <dd>{agent.name(conversation.agent) ?? t('chat.deletedAgent')}</dd>
          {metadata}
          <dt className='text-muted-foreground'>{t('chat.started')}</dt>
          <dd>
            {new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(conversation.createdAt))}
          </dd>
        </dl>
      </section>
      {usage.data && (usage.data.runs > 0 || usage.data.context) && (
        <section className='flex flex-col gap-2.5 border-b px-5 py-4'>
          <h3 className='text-sm font-semibold'>{t('chat.usageTitle')}</h3>
          <UsageSection usage={usage.data} />
        </section>
      )}
      <section className='flex flex-col gap-2.5 border-b px-5 py-4'>
        <h3 className='text-sm font-semibold'>{t('chat.record')}</h3>
        <p className='text-xs text-muted-foreground'>{t('chat.recordBody')}</p>
      </section>
    </div>
  );
  if (beside)
    return open ? (
      <aside
        className='flex w-[296px] shrink-0 flex-col border-l bg-background'
        aria-label={t('chat.detailsTitle')}
        data-testid={testId}
        data-placement='beside'
      >
        {content}
      </aside>
    ) : null;
  if (!phone)
    return open ? (
      <PaneSheet
        title={t('chat.detailsTitle')}
        testId={testId}
        onClose={onClose}
      >
        {content}
      </PaneSheet>
    ) : null;
  // A phone's conversation fills the screen, so the full-screen sheet is the conversation area.
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        className='gap-0 data-[side=right]:w-[min(100%,22rem)]'
        aria-describedby={undefined}
        data-testid={testId}
        data-placement='over'
      >
        <SheetHeader className='shrink-0 border-b px-5 py-3 pr-14'>
          <SheetTitle>{t('chat.detailsTitle')}</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}

/**
 * The details over the conversation pane only: the overlay and the sheet are positioned against the nearest
 * `relative` ancestor (the conversation's own container), so the application's sidebar, header and a session list
 * beside the conversation stay sharp and usable. Escape and the overlay close it; focus moves into it on opening.
 */
function PaneSheet({
  title,
  testId,
  onClose,
  children,
}: {
  readonly title: string;
  readonly testId: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useChatTranslation();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    element.focus();
    // Native, so it runs before a host panel's own Escape handling on an ancestor.
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    element.addEventListener('keydown', onKeyDown);
    return () => {
      element.removeEventListener('keydown', onKeyDown);
      if (opener?.isConnected) opener.focus();
    };
  }, [onClose]);
  return (
    <>
      <div
        aria-hidden='true'
        data-slot='pane-sheet-overlay'
        className='absolute inset-0 z-40 animate-in bg-black/10 duration-150 fade-in supports-backdrop-filter:backdrop-blur-xs'
        onClick={onClose}
      />
      <aside
        ref={ref}
        tabIndex={-1}
        role='dialog'
        aria-modal='false'
        aria-label={title}
        data-testid={testId}
        data-placement='pane'
        className='absolute inset-y-0 right-0 z-40 flex w-[min(100%,22rem)] animate-in flex-col border-l bg-popover text-sm text-popover-foreground shadow-lg duration-200 outline-none slide-in-from-right-10 fade-in'
      >
        <header className='flex shrink-0 items-center gap-2 border-b px-5 py-3'>
          <h2 className='min-w-0 flex-1 truncate text-base font-medium'>
            {title}
          </h2>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('chat.close')}
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </header>
        {children}
      </aside>
    </>
  );
}
