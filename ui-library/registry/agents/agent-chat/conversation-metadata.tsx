import { useAgentText } from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import { BotIcon, ServerIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from 'cn';
import { ConversationMetaChip } from './conversation-header.js';
import { useChatTranslation } from './chat-i18n.js';

export function ConversationMetadata({
  conversation,
  children,
}: {
  readonly conversation: ConversationDetail;
  readonly children?: ReactNode;
}): ReactElement {
  const text = useAgentText();
  const { t } = useChatTranslation();
  const name = text.name(conversation.agent) ?? t('chat.deletedAgent');
  const runtime = conversation.runner?.name ?? t('chat.unboundRuntime');
  return (
    <>
      <ConversationMetaChip
        data-testid='chat-agent'
        title={name}
        className='max-w-40 shrink-0'
      >
        <BotIcon className='size-4 shrink-0' />
        <span className='truncate'>{name}</span>
      </ConversationMetaChip>
      {children}
      <ConversationMetaChip
        title={runtime}
        data-testid='conversation-runner'
        data-status={conversation.runner?.status}
      >
        <ServerIcon className='size-4 shrink-0' />
        <span className='truncate'>{runtime}</span>
        {conversation.runner && (
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              conversation.runner.status === 'online'
                ? 'bg-emerald-500'
                : 'border-[1.5px] border-muted-foreground',
            )}
          />
        )}
      </ConversationMetaChip>
    </>
  );
}
