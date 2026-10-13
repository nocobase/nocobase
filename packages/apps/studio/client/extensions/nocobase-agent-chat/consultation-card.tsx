/**
 * The card of a consultation in a conversation (`ask_agent`): "Consulted ‹agent›", folded to one line that says how it
 * went, and open to the question, the consulted agent's steps while it answers (its own run's transcript, live), its
 * answer as it is written and then final, the plans it proposed and what it used. The server rewrites the card in
 * place while it runs (`metadata.streaming`), so the conversation fetches it again.
 */
import { useLiveRunEvents } from '@nocobase/app-plugin-agents/client/chat';
import type { ConsultationNotice } from '@nocobase/app-plugin-agents/shared/conversations';
import { useLocale } from '@nocobase/i18n/client';
import { ChevronRightIcon, MessagesSquareIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { RunTranscriptRow } from '@/components/agent-run-history';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from 'cn';

import { ChatMarkdown } from './chat-markdown.js';
import { useChatTranslation, useTranscriptLabels } from './chat-i18n.js';
import { Pulse } from './chat-ui.js';

const STEP_TYPES: ReadonlySet<string> = new Set([
  'thinking',
  'toolUse',
  'toolResult',
]);

function renderMarkdown(text: string): ReactElement {
  return <ChatMarkdown content={text} />;
}

/** The consulted agent's steps so far, from its run's transcript, fetched as its topic announces them. */
function ConsultationSteps({
  runId,
}: {
  readonly runId: string;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const { locale } = useLocale();
  const labels = useTranscriptLabels();
  const events = useLiveRunEvents(runId);
  const steps = events.filter((event) => STEP_TYPES.has(event.type));
  if (steps.length === 0) return null;
  return (
    <ol
      aria-label={t('chat.consultation.steps')}
      className='max-h-60 overflow-y-auto rounded-md border p-2'
      data-testid='chat-consultation-steps'
    >
      {steps.map((event) => (
        <RunTranscriptRow
          key={event.seq}
          event={event}
          renderMarkdown={renderMarkdown}
          locale={locale}
          labels={labels}
        />
      ))}
    </ol>
  );
}

export function ConsultationCard({
  notice,
}: {
  readonly notice: ConsultationNotice;
}): ReactElement {
  const { t } = useChatTranslation();
  const running = notice.state === 'running';
  const [open, setOpen] = useState(false);
  const status = t(`chat.consultation.state.${notice.state}`);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='w-full min-w-0 rounded-lg border bg-card text-sm'
      data-testid='chat-consultation'
      data-state-consultation={notice.state}
      aria-busy={running ? true : undefined}
    >
      <CollapsibleTrigger className='flex min-h-9 w-full min-w-0 items-center gap-2 rounded-lg px-3 text-left hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
        <ChevronRightIcon
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none',
            open && 'rotate-90',
          )}
          aria-hidden='true'
        />
        <MessagesSquareIcon
          className='size-4 shrink-0 text-muted-foreground'
          aria-hidden='true'
        />
        <span className='min-w-0 truncate font-medium'>
          {t('chat.consultation.title', { name: notice.agentName })}
        </span>
        <span className='ml-auto flex shrink-0 items-center gap-1.5'>
          {running ? <Pulse /> : null}
          <Badge
            variant={
              notice.state === 'failed' || notice.state === 'refused'
                ? 'destructive'
                : 'secondary'
            }
          >
            {status}
          </Badge>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className='flex flex-col gap-3 border-t px-3 py-3'>
        <section className='flex flex-col gap-1'>
          <h4 className='text-xs font-medium text-muted-foreground'>
            {t('chat.consultation.question')}
          </h4>
          <p className='whitespace-pre-wrap wrap-anywhere'>{notice.question}</p>
        </section>
        {running && notice.runId ? (
          <ConsultationSteps runId={notice.runId} />
        ) : null}
        {notice.answer ? (
          <section className='flex flex-col gap-1'>
            <h4 className='text-xs font-medium text-muted-foreground'>
              {t('chat.consultation.answer')}
            </h4>
            <div className='rounded-md bg-muted px-3 py-2'>
              <ChatMarkdown content={notice.answer} />
            </div>
          </section>
        ) : null}
        {notice.error ? (
          <p className='text-xs text-destructive wrap-anywhere'>
            {notice.error}
          </p>
        ) : null}
        {notice.plans > 0 ? (
          <p className='text-xs text-muted-foreground'>
            {t('chat.consultation.plans', { count: notice.plans })}
          </p>
        ) : null}
        {notice.usage ? (
          <p
            className='text-xs text-muted-foreground tabular-nums'
            data-testid='chat-consultation-usage'
          >
            {t('chat.consultation.usage', {
              input: notice.usage.inputTokens.toLocaleString(),
              output: notice.usage.outputTokens.toLocaleString(),
            })}
          </p>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
