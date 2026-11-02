import {
  AgentAvatar,
  useAgentText,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ChatAvailability,
  ConversationDetail,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { UnplugIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { AvailabilityDot as AgentAvailabilityDot } from '#components/agent-picker';
import { Alert, AlertDescription, AlertTitle } from '#components/ui/alert';
import { cn } from 'cn';

import { useAgentPickerLabels, useChatTranslation } from './chat-i18n.js';
import { ChatTag } from './chat-ui.js';

/** A green or grey dot with its meaning for screen readers (`agent-picker`'s, in the chat's wording). */
export function AvailabilityDot({
  availability,
  className,
}: {
  readonly availability: ChatAvailability;
  readonly className?: string;
}): ReactElement {
  const labels = useAgentPickerLabels();
  return (
    <AgentAvailabilityDot
      availability={availability}
      labels={labels}
      {...(className === undefined ? {} : { className })}
    />
  );
}

/**
 * Who a conversation talks to, whether they can answer now, and its mode, read-only: the panel's header and the
 * full-page view show it under the title. "Temporary" marks another agent answering in place of the conversation's
 * own agent.
 */
export function AgentLine({
  conversation,
  className,
  'data-testid': testId = 'chat-agent',
}: {
  readonly conversation: ConversationDetail;
  readonly className?: string;
  readonly 'data-testid'?: string;
}): ReactElement {
  const { t } = useChatTranslation();
  const own = useAgentText().name(conversation.agent);
  const name = own ?? t('chat.agentGone');
  return (
    <p
      className={cn(
        'flex min-w-0 items-center gap-1.5 px-1 text-xs text-muted-foreground',
        className,
      )}
      data-testid={testId}
    >
      <AgentAvatar name={own} size='xs' />
      <span className='truncate font-medium text-foreground'>{name}</span>
      <AvailabilityDot availability={conversation.availability} />
      {conversation.fallbackFrom ? (
        <ChatTag tone='amber'>{t('chat.agents.temporary')}</ChatTag>
      ) : null}
    </p>
  );
}

export interface AgentNoticeProps {
  readonly conversation: ConversationDetail;
}

/** Chat never silently switches to a Runner or another profile. */
export function AgentNotice({
  conversation,
}: AgentNoticeProps): ReactElement | null {
  const { t } = useChatTranslation();
  const name = useAgentText().name(conversation.agent) ?? t('chat.agentGone');
  if (!conversation.execution)
    return (
      <Alert>
        <UnplugIcon />
        <AlertTitle>{t('chat.historicalReadOnly')}</AlertTitle>
      </Alert>
    );
  if (conversation.execution.outcome === 'failed')
    return (
      <Alert>
        <UnplugIcon />
        <AlertTitle>{t('chat.executionFailed')}</AlertTitle>
      </Alert>
    );
  if (conversation.execution.requiresEffectReview)
    return (
      <Alert>
        <AlertTitle>{t('chat.feedback.effectReview')}</AlertTitle>
      </Alert>
    );
  if (conversation.availability.online) return null;
  return (
    <Alert data-testid='chat-offline'>
      <UnplugIcon />
      <AlertTitle>
        {t(
          `chat.offline.${conversation.availability.reason ?? 'modelUnavailable'}`,
          { name },
        )}
      </AlertTitle>
      <AlertDescription>{t('chat.connectionUnknown')}</AlertDescription>
    </Alert>
  );
}
