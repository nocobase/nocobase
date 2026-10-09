/**
 * The agent at work, below the last message: "waiting for a runner" while the run is queued, then one line for what it
 * is doing ("thinking…", "looking at ‹PM-12›") that expands to the steps since it last wrote. The steps come from the
 * run's transcript (`useLiveRunEvents`), fetched as the run's topic announces them and polled meanwhile.
 */
import {
  liveStepsView,
  stepLineText,
  useLiveRunEvents,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationRun } from '@nocobase/app-plugin-agents/shared/conversations';
import { useLocale } from '@nocobase/i18n/client';
import { ChevronRightIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { RunTranscriptRow } from '#components/agent-run-history';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import { cn } from 'cn';

import { ChatMarkdown } from './chat-markdown.js';
import { useChatTranslation, useTranscriptLabels } from './chat-i18n.js';
import { Pulse } from './chat-ui.js';

export interface LiveStepsProps {
  readonly run: ConversationRun;
  readonly agentName: string;
  /** An online agent waits for no runner: the application takes its run at once. */
  readonly mode?: 'online' | 'runner';
}

export function LiveSteps({
  run,
  agentName,
  mode = 'runner',
}: LiveStepsProps): ReactElement {
  const { t } = useChatTranslation();
  const waiting = run.status === 'queued';
  return (
    <div
      className='flex flex-col gap-1'
      data-testid='chat-live-steps'
      data-status={run.status}
      aria-busy='true'
    >
      <p className='flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground'>
        <Pulse />
        <span className='shrink-0 font-medium'>{agentName}</span>
      </p>
      {waiting ? (
        <p className='px-1.5 text-xs text-muted-foreground'>
          {mode === 'online'
            ? t('chat.steps.starting')
            : t('chat.steps.waiting')}
        </p>
      ) : (
        <RunSteps runId={run.id} />
      )}
    </div>
  );
}

function renderMarkdown(text: string): ReactElement {
  return <ChatMarkdown content={text} />;
}

function RunSteps({ runId }: { readonly runId: string }): ReactElement {
  const { t } = useChatTranslation();
  const { locale } = useLocale();
  const labels = useTranscriptLabels();
  const events = useLiveRunEvents(runId);
  const [expanded, setExpanded] = useState(false);
  const view = liveStepsView(events);
  const line = stepLineText(t, view.line);
  if (view.steps.length === 0)
    return (
      <p
        className='px-1.5 text-xs text-muted-foreground'
        data-testid='chat-step-line'
      >
        {line}
      </p>
    );
  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger
        className='flex min-h-8 w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 text-left text-xs text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'
        data-testid='chat-step-line'
      >
        <ChevronRightIcon
          className={cn(
            'size-3.5 shrink-0 transition-transform motion-reduce:transition-none',
            expanded && 'rotate-90',
          )}
          aria-hidden='true'
        />
        <span className='truncate'>{line}</span>
        <span className='ml-auto shrink-0 tabular-nums'>
          {t('chat.steps.count', { count: view.steps.length })}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        render={<ol />}
        aria-label={t('chat.steps.title')}
        className='mt-1 max-h-80 overflow-y-auto rounded-md border p-2'
      >
        {view.steps.map((event) => (
          <RunTranscriptRow
            key={event.seq}
            event={event}
            renderMarkdown={renderMarkdown}
            locale={locale}
            labels={labels}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Says "replying" once when the agent starts and "reply finished" once when it ends (a polite live region that stays
 * mounted), so screen readers do not read each step.
 */
export function TurnAnnouncer({
  running,
}: {
  readonly running: boolean;
}): ReactElement {
  const { t } = useChatTranslation();
  const [message, setMessage] = useState('');
  const [wasRunning, setWasRunning] = useState(running);
  if (running !== wasRunning) {
    setWasRunning(running);
    setMessage(running ? t('chat.steps.started') : t('chat.steps.finished'));
  }
  return (
    <p className='sr-only' aria-live='polite'>
      {message}
    </p>
  );
}
