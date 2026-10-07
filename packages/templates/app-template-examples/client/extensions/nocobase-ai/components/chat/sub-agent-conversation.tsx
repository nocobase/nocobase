import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import { cn } from '../../shared/utils.js';
import { ChevronDown, ChevronRight, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import {
  useAI,
  type AISubAgentConversation as AISubAgentConversationType,
  type AIToolCallDecision,
  type AIEmployee,
} from '../../providers/index.js';
import { AIEmployeeAvatar } from './ai-employee-avatar.js';
import { MarkdownMessage } from './markdown-message.js';
import { ReasoningPanel } from './reasoning-panel.js';
import { ToolCallCard } from './tool-call-card.js';
import { getToolCallName, isToolCallPart } from './tool-call-utils.js';
import { withStableKeys } from '../../shared/keys.js';

const getPartKey = (
  part: AISubAgentConversationType['messages'][number]['parts'][number],
) => {
  if (part.type === 'data-subAgent') return part.id ?? part.data.sessionId;
  if (isToolCallPart(part)) return part.toolCallId;
  return part.type;
};

type SubAgentConversationProps = {
  conversation: AISubAgentConversationType;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  decideToolCall?: (decision: AIToolCallDecision) => Promise<void>;
  focusComposer?: () => void;
  readOnly?: boolean;
};

export function SubAgentConversation(props: SubAgentConversationProps) {
  return props.readOnly ? (
    <SubAgentConversationView {...props} />
  ) : (
    <ConnectedSubAgentConversation {...props} />
  );
}

function ConnectedSubAgentConversation(props: SubAgentConversationProps) {
  const ai = useAI();
  return (
    <SubAgentConversationView
      {...props}
      employee={ai.employees.find(
        (item) => item.username === props.conversation.username,
      )}
    />
  );
}

function SubAgentConversationView({
  conversation,
  onToolCallDecision,
  status = 'ready',
  decideToolCall,
  focusComposer,
  readOnly = false,
  employee = {
    username: conversation.username,
    nickname: conversation.username,
  },
}: SubAgentConversationProps & { employee?: AIEmployee }) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const completed = conversation.status === 'completed';
  const [expanded, setExpanded] = useState(true);
  const messages =
    conversation.messages[0]?.role === 'user'
      ? conversation.messages.slice(1)
      : conversation.messages;
  const interactionPending = status === 'streaming' || status === 'submitted';

  return (
    <section className='min-w-0 max-w-full rounded-xl border border-dashed bg-muted/15'>
      <Button
        type='button'
        variant='ghost'
        className='h-auto w-full justify-start rounded-xl px-3 py-2 text-left'
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? (
          <ChevronDown className='size-4 shrink-0' />
        ) : (
          <ChevronRight className='size-4 shrink-0' />
        )}
        <AIEmployeeAvatar employee={employee} className='size-6' />
        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
          {employee.nickname}
        </span>
        <span className='flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground'>
          {!completed ? <LoaderCircle className='size-3 animate-spin' /> : null}
          {completed
            ? t('tool.status.completed', 'Completed')
            : t('tool.subAgent.statusWorking', 'Working')}
        </span>
      </Button>
      {expanded ? (
        <div className='min-w-0 space-y-3 border-t border-dashed px-3 py-3'>
          {messages.flatMap((message) =>
            withStableKeys(message.parts, getPartKey).map(
              ({ key, item: part }) => {
                if (part.type === 'reasoning') {
                  return (
                    <ReasoningPanel
                      key={`${message.id}-${key}`}
                      streaming={part.state === 'streaming'}
                    >
                      {part.text}
                    </ReasoningPanel>
                  );
                }
                if (part.type === 'text') {
                  return (
                    <div
                      key={`${message.id}-${key}`}
                      className='ai-markdown min-w-0 max-w-full [overflow-wrap:anywhere] text-sm leading-6 text-foreground'
                    >
                      <MarkdownMessage>{part.text}</MarkdownMessage>
                    </div>
                  );
                }
                if (part.type === 'data-subAgent') {
                  return (
                    <SubAgentConversation
                      key={`${message.id}-${key}`}
                      conversation={part.data}
                      readOnly={readOnly}
                      onToolCallDecision={onToolCallDecision}
                      status={status}
                      decideToolCall={decideToolCall}
                      focusComposer={focusComposer}
                    />
                  );
                }
                if (!isToolCallPart(part)) return [];
                return (
                  <ToolCallCard
                    key={`${message.id}-${key}`}
                    part={part}
                    approval={
                      message.metadata?.toolApprovals?.[part.toolCallId]
                    }
                    disabled={interactionPending}
                    readOnly={readOnly}
                    onRevise={focusComposer}
                    onDecision={async (decision, input) => {
                      if (readOnly) return;
                      const toolDecision = {
                        messageId: message.id,
                        toolCallId: part.toolCallId,
                        toolName: getToolCallName(part),
                        decision,
                        input,
                      } satisfies AIToolCallDecision;
                      await decideToolCall?.(toolDecision);
                      await onToolCallDecision?.(toolDecision);
                    }}
                  />
                );
              },
            ),
          )}
          {!messages.length ? (
            <div
              className={cn(
                'text-xs text-muted-foreground',
                !completed && 'animate-pulse',
              )}
            >
              {completed
                ? t('tool.subAgent.noOutput', 'No visible output.')
                : t('tool.subAgent.starting', 'Starting delegated work…')}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
