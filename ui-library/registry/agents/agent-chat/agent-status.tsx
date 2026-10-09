/**
 * Whether a conversation's agent can answer, in words: a dot beside its name, the agent line above the conversation
 * (who it talks to, read-only: a conversation stays with its agent), and the notice above the composer when the agent
 * cannot answer (the message is kept; the conversation may switch to the system default) or while the conversation uses
 * the system default in its place (it may switch back).
 */
import {
  AgentAvatar,
  useAgentText,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ChatAvailability,
  ConversationDetail,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { RepeatIcon, UnplugIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { AvailabilityDot as AgentAvailabilityDot } from '#components/agent-picker';
import { Alert, AlertDescription, AlertTitle } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { cn } from 'cn';

import { useAgentPickerLabels, useChatTranslation } from './chat-i18n.js';
import { ChatTag, ModeTag } from './chat-ui.js';

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
 * full-page view show it under the title. "Temporary" marks the system default answering in place of the conversation's
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
      <ModeTag mode={conversation.mode} />
      {conversation.fallbackFrom ? (
        <ChatTag tone='amber'>{t('chat.agents.temporary')}</ChatTag>
      ) : null}
    </p>
  );
}

export interface AgentNoticeProps {
  readonly conversation: ConversationDetail;
  readonly busy: boolean;
  readonly onFallback: () => void;
  readonly onRestore: () => void;
}

/**
 * The notice about who answers: the agent is offline (the message waits; "use the system default"), or the
 * conversation uses the system default for now ("switch back"). Nothing while the agent answers normally.
 */
export function AgentNotice({
  conversation,
  busy,
  onFallback,
  onRestore,
}: AgentNoticeProps): ReactElement | null {
  const { t } = useChatTranslation();
  const text = useAgentText();
  const name = text.name(conversation.agent) ?? t('chat.agentGone');
  const { availability } = conversation;
  if (!availability.online) {
    return (
      <Alert data-testid='chat-offline'>
        <UnplugIcon />
        <AlertTitle>
          {t(`chat.offline.${availability.reason ?? 'noRunner'}`, { name })}
        </AlertTitle>
        <AlertDescription>
          <p>{t('chat.offline.kept')}</p>
          {/* Under the text rather than beside it: the panel is too narrow for both on one line. */}
          {conversation.canFallback ? (
            <Button
              variant='outline'
              size='sm'
              className='mt-1.5'
              disabled={busy}
              onClick={onFallback}
            >
              {busy ? <Spinner data-icon='inline-start' /> : null}
              {t('chat.offline.fallback')}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }
  if (conversation.fallbackFrom) {
    const own = text.name(conversation.fallbackFrom) ?? t('chat.agentGone');
    return (
      <div
        className='flex flex-wrap items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground'
        data-testid='chat-fallback'
      >
        <span className='mr-auto'>
          {t('chat.offline.usingDefault', { name, own })}
        </span>
        {conversation.canRestore ? (
          <Button
            variant='outline'
            size='sm'
            disabled={busy}
            onClick={onRestore}
          >
            {busy ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <RepeatIcon data-icon='inline-start' />
            )}
            {t('chat.offline.restore', { own })}
          </Button>
        ) : null}
      </div>
    );
  }
  return null;
}
