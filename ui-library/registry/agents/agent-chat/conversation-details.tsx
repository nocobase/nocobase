import { useAgentText } from '@nocobase/app-plugin-agents/client/chat';
import type {
  ConversationDetail,
  ConversationLink,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ConversationAssociations } from './conversation-associations.js';
import { useChatTranslation } from './chat-i18n.js';
import { useConversationUsage } from './use-conversation-usage.js';
import { UsageSection } from './usage.js';
import {
  PaneSheet,
  PaneSheetContent,
  PaneSheetHeader,
  PaneSheetTitle,
} from './pane-sheet.js';

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
  const agent = useAgentText();
  const usage = useConversationUsage(conversation.id, false, { passive: true });
  const content = (
    <div className='min-h-0 flex-1 overflow-y-auto overscroll-y-contain'>
      <ConversationAssociations
        conversationId={conversation.id}
        onOpen={onOpen}
      />
      <section className='flex flex-col gap-2.5 border-b px-5 py-4'>
        <h3 className='flex items-center gap-1.5 text-sm font-semibold'>
          {t('chat.sessionDetails')}
        </h3>
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
          <h3 className='flex items-center gap-1.5 text-sm font-semibold'>
            {t('chat.usageTitle')}
          </h3>
          <UsageSection usage={usage.data} />
        </section>
      )}
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
  return (
    <DetailsSheet
      open={open}
      onClose={onClose}
      title={t('chat.detailsTitle')}
      testId={testId}
    >
      {content}
    </DetailsSheet>
  );
}

/**
 * The details over the conversation pane, at every width: the sheet opens within the element that holds the
 * conversation and its details (their `relative` parent), so its overlay blurs only that pane and the application's
 * sidebar, header and session list stay usable. On a phone that pane is the whole screen.
 */
function DetailsSheet({
  open,
  onClose,
  title,
  testId,
  children,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly testId: string;
  readonly children: ReactNode;
}): ReactElement {
  const [pane, setPane] = useState<HTMLElement | null>(null);
  const anchorRef = useCallback(
    (element: HTMLSpanElement | null) =>
      setPane(element?.parentElement ?? null),
    [],
  );
  return (
    <>
      <span ref={anchorRef} hidden />
      <PaneSheet
        open={open && pane !== null}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        {/* Narrower than the pane by a strip of overlay, so even a narrow panel or a phone can be closed by pressing it. */}
        <PaneSheetContent
          container={pane}
          className='gap-0 w-[min(calc(100%-2.5rem),22rem)] sm:max-w-none'
          aria-describedby={undefined}
          data-testid={testId}
          data-placement='pane'
        >
          <PaneSheetHeader className='shrink-0 border-b px-5 py-3 pr-14'>
            <PaneSheetTitle className='text-[15px] font-semibold'>
              {title}
            </PaneSheetTitle>
          </PaneSheetHeader>
          {children}
        </PaneSheetContent>
      </PaneSheet>
    </>
  );
}
