import { useAgentText } from '@nocobase/app-plugin-agents/client/chat';
import type {
  ConversationDetail,
  ConversationLink,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
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
        <h3 className='text-sm font-semibold'>{t('chat.sessionDetails')}</h3>
        <dl className='grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs [&>dd]:min-w-0 [&>dd]:break-words [&>dt]:whitespace-nowrap'>
          <dt className='text-muted-foreground'>{t('chat.runtime')}</dt>
          <dd>{conversation.runner?.name ?? t('chat.unboundRuntime')}</dd>
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
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        className='gap-0 data-[side=right]:w-[min(100%,22rem)] md:data-[side=right]:top-16 md:data-[side=right]:h-auto'
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
