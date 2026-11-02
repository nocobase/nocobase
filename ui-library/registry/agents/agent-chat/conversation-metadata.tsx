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
  // Only a Runner conversation already bound to a named runner shows one; online agents run on no runner.
  const runner = conversation.mode === 'online' ? null : conversation.runner;
  const runnerName = runner?.name ?? null;
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
      {runner && runnerName && (
        <ConversationMetaChip
          title={runnerName}
          data-testid='conversation-runner'
          data-status={runner.status}
        >
          <ServerIcon className='size-4 shrink-0' />
          <span className='truncate'>{runnerName}</span>
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              runner.status === 'online'
                ? 'bg-emerald-500'
                : 'border-[1.5px] border-muted-foreground',
            )}
          />
        </ConversationMetaChip>
      )}
    </>
  );
}
