/**
 * A previewed brief as the agent is sent it. The system prompt comes in two parts: the platform's (its rules, the task,
 * the context and the English lead-in to the agent's prompt), collapsed to a one-line summary, and the agent's own
 * prompt, which ends it, open as a card. The first message follows. Everything shows rendered as Markdown or as the raw
 * text. The placeholders the runner fills in stay visible, annotated, so nobody mistakes them for text the agent reads
 * as is.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRightIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import type { BriefPreview } from '../../shared/briefs.js';
import { AgMarkdown } from './ag-markdown.js';
import { Button } from './ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';

type Mode = 'rendered' | 'raw';

const RAW = 'font-mono text-xs leading-5 whitespace-pre-wrap wrap-anywhere';

/** About how long a text is, in characters, rounded to the hundred once it is that long. */
function approximateLength(text: string): number {
  const length = text.trim().length;
  return length < 100 ? length : Math.round(length / 100) * 100;
}

function Body({
  mode,
  text,
  muted,
  testId,
}: {
  readonly mode: Mode;
  readonly text: string;
  /** On a muted panel, scrolling past a height; otherwise as it flows in its card. */
  readonly muted?: boolean;
  readonly testId: string;
}): ReactElement {
  const panel = muted ? 'max-h-96 overflow-auto rounded-md bg-muted p-3' : '';
  return mode === 'raw' ? (
    <pre data-testid={testId} className={`${RAW} ${panel}`}>
      {text}
    </pre>
  ) : (
    <div data-testid={testId} className={panel}>
      <AgMarkdown content={text} />
    </div>
  );
}

function Block({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section aria-labelledby={id} className='flex flex-col gap-2'>
      <h3 id={id} className='text-sm font-medium'>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function BriefView({
  brief,
}: {
  readonly brief: Pick<
    BriefPreview,
    'platform' | 'agentPrompt' | 'firstMessage'
  >;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<Mode>('rendered');
  const size = new Intl.NumberFormat(i18n.language).format(
    approximateLength(brief.platform),
  );
  return (
    <div className='flex flex-col gap-4'>
      <div
        role='group'
        aria-label={t('brief.showAs')}
        className='inline-flex w-fit gap-0.5 rounded-lg border p-0.5'
      >
        {(['rendered', 'raw'] as const).map((value) => (
          <Button
            key={value}
            type='button'
            size='xs'
            variant={mode === value ? 'secondary' : 'ghost'}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {t(`brief.${value}`)}
          </Button>
        ))}
      </div>
      <Block id='ag-brief-system' title={t('brief.system')}>
        <Collapsible className='flex flex-col gap-2'>
          <div className='flex flex-col gap-0.5'>
            <CollapsibleTrigger className='group flex w-fit cursor-pointer items-center gap-1 rounded-sm text-left text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none'>
              <ChevronRightIcon
                aria-hidden='true'
                className='size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open:rotate-90 motion-reduce:transition-none'
              />
              {t('brief.platform', { size })}
            </CollapsibleTrigger>
            <p className='pl-5 text-xs text-muted-foreground'>
              {t('brief.platformNote')}
            </p>
          </div>
          <CollapsibleContent>
            <Body
              mode={mode}
              text={brief.platform}
              muted
              testId='ag-brief-platform'
            />
          </CollapsibleContent>
        </Collapsible>
        <section
          aria-labelledby='ag-brief-agent'
          className='flex flex-col gap-2 rounded-lg border p-3'
        >
          <h4 id='ag-brief-agent' className='text-sm font-medium'>
            {t('brief.agentPrompt')}
          </h4>
          {brief.agentPrompt.trim() ? (
            <Body
              mode={mode}
              text={brief.agentPrompt}
              testId='ag-brief-agent-prompt'
            />
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t('brief.noAgentPrompt')}
            </p>
          )}
        </section>
      </Block>
      <Block id='ag-brief-first' title={t('brief.firstMessage')}>
        {brief.firstMessage.trim() ? (
          <Body
            mode={mode}
            text={brief.firstMessage}
            muted
            testId='ag-brief-first'
          />
        ) : (
          <p className='text-sm text-muted-foreground'>{t('brief.empty')}</p>
        )}
      </Block>
      <p className='text-xs text-muted-foreground'>
        {t('brief.previewPlaceholders')}
      </p>
    </div>
  );
}
