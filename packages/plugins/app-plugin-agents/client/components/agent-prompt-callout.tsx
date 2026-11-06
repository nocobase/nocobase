/**
 * A prompt to copy for one's own coding agent, as a compact callout: a bot icon and the title on the first line, the
 * whole description on the second with a small "show" toggle after it, and Copy as the primary action on the right,
 * vertically centred; the prompt itself unfolds beneath. At narrow widths the button wraps under the text. Wherever a
 * prompt and manual steps are both offered, this comes first.
 */
import { copyText } from '@nocobase/app-client';
import { BotIcon, CheckIcon, CopyIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { useNotify } from '../hooks/use-notify.js';
import { Button } from './ui/button.js';
import { Skeleton } from './ui/skeleton.js';

interface AgentPromptCalloutLabels {
  /** The button that copies the prompt. */
  readonly copy: string;
  /** Said on the button for a moment once copied. */
  readonly copied: string;
  readonly copyFailed: string;
  readonly show: string;
  readonly hide: string;
}

export function AgentPromptCallout({
  title,
  description,
  prompt,
  labels,
}: {
  readonly title: string;
  readonly description: string;
  /** Null while it is still being put together. */
  readonly prompt: string | null;
  readonly labels: AgentPromptCalloutLabels;
}): ReactElement {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div
      className='flex min-w-0 flex-col gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 dark:border-primary/20 dark:bg-primary/10'
      data-agent-prompt=''
    >
      <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2'>
        <div className='flex min-w-0 flex-1 basis-64 gap-2'>
          <BotIcon
            className='mt-0.5 size-4 shrink-0 text-primary'
            aria-hidden
          />
          <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='text-sm leading-5 font-medium'>{title}</span>
            <p className='text-xs leading-4 text-muted-foreground'>
              {description}{' '}
              <button
                type='button'
                className='inline whitespace-nowrap text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50'
                aria-expanded={open}
                disabled={!prompt}
                onClick={() => setOpen((value) => !value)}
                data-agent-prompt-toggle=''
              >
                {open ? labels.hide : labels.show}
              </button>
            </p>
          </div>
        </div>
        {prompt ? (
          <Button
            type='button'
            size='sm'
            className='shrink-0'
            onClick={() => {
              void copyText(prompt).then((success) => {
                setCopied(success);
                if (success) window.setTimeout(() => setCopied(false), 1500);
                else notify.error(null, labels.copyFailed);
              });
            }}
            data-agent-prompt-copy=''
          >
            {copied ? (
              <CheckIcon data-icon='inline-start' />
            ) : (
              <CopyIcon data-icon='inline-start' />
            )}
            {copied ? labels.copied : labels.copy}
          </Button>
        ) : (
          <Skeleton className='h-7 w-36 shrink-0' />
        )}
      </div>
      {open && prompt ? (
        <pre
          className='max-h-72 overflow-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap'
          data-agent-prompt-text=''
        >
          {prompt}
        </pre>
      ) : null}
    </div>
  );
}
