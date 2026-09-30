import { Check, Copy, Lightbulb } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { cn } from '../lib/utils.js';
import { Button } from './ui/button.js';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty.js';
import { useT } from '../locales/index.js';

export interface AgentPromptEmptyStateProps {
  readonly title: string;
  readonly description: string;
  /** Where to open the coding agent. */
  readonly openStep: string;
  /** What sending the prompt does; the prompt panel sits beside the steps. */
  readonly sendStep: string;
  /** What the user does once the agent has finished. */
  readonly finishStep: string;
  readonly prompt: string;
  readonly note?: string;
}

type CopyState = 'idle' | 'copied' | 'selected';

/** Index of the step that sends the prompt. */
const PROMPT_STEP = 1;

/**
 * An empty state for configuration that belongs to the application's files rather than to this page: it walks the
 * user through handing a ready-made prompt to a coding agent opened in the application directory.
 */
export function AgentPromptEmptyState({
  title,
  description,
  openStep,
  sendStep,
  finishStep,
  prompt,
  note,
}: AgentPromptEmptyStateProps): ReactElement {
  const t = useT();
  const steps = [openStep, sendStep, finishStep];
  const promptId = useId();
  const promptRef = useRef<HTMLPreElement>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(resetRef.current), []);

  const copy = async (): Promise<void> => {
    clearTimeout(resetRef.current);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
      resetRef.current = setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Clipboard access can be denied or unavailable; select the prompt so the user can copy it by hand.
      const element = promptRef.current;
      const selection = window.getSelection();
      if (element && selection) {
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setCopyState('selected');
    }
  };

  return (
    <Empty className='border bg-card'>
      {/* Left-aligned with the steps below: the icon sits beside the title, the description under it. */}
      <EmptyHeader className='grid w-full max-w-4xl grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 text-left'>
        <EmptyMedia variant='icon' className='mb-0'>
          <Lightbulb aria-hidden='true' />
        </EmptyMedia>
        <EmptyTitle
          role='heading'
          aria-level={2}
          className='text-base font-semibold'
        >
          {title}
        </EmptyTitle>
        <EmptyDescription className='col-start-2 text-pretty'>
          {description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className='max-w-4xl items-stretch gap-6 text-left text-wrap'>
        <div className='grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8'>
          <ol className='flex flex-col'>
            {steps.map((step, index) => (
              <li key={step} className='relative flex gap-3 pb-6 last:pb-0'>
                {index < steps.length - 1 ? (
                  // The rail joining this step's marker to the next one.
                  <span
                    aria-hidden='true'
                    className='absolute top-7 bottom-1 left-3 w-px -translate-x-1/2 bg-border'
                  />
                ) : null}
                <span
                  aria-hidden='true'
                  className={cn(
                    'relative flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums',
                    // The step that uses the prompt shares its emphasis with the prompt panel.
                    index === PROMPT_STEP
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
                <p className='pt-0.5 text-sm leading-6 text-foreground'>
                  {step}
                </p>
              </li>
            ))}
          </ol>
          <div className='flex min-w-0 flex-col gap-2 self-start'>
            <div className='rounded-lg border bg-muted'>
              <div className='flex items-center justify-between gap-2 border-b px-3 py-1.5'>
                <span
                  id={promptId}
                  className='text-xs font-medium text-muted-foreground'
                >
                  {t('agentPrompt.label')}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void copy()}
                  aria-describedby={promptId}
                >
                  {copyState === 'copied' ? (
                    <Check data-icon='inline-start' aria-hidden='true' />
                  ) : (
                    <Copy data-icon='inline-start' aria-hidden='true' />
                  )}
                  {copyState === 'copied'
                    ? t('agentPrompt.copied')
                    : t('agentPrompt.copy')}
                </Button>
              </div>
              <pre
                ref={promptRef}
                aria-labelledby={promptId}
                className='overflow-x-auto p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground [overflow-wrap:anywhere]'
              >
                {prompt}
              </pre>
            </div>
            <p role='status' aria-live='polite' className='text-xs'>
              {copyState === 'copied' ? (
                <span className='sr-only'>{t('agentPrompt.copied')}</span>
              ) : copyState === 'selected' ? (
                <span className='text-muted-foreground'>
                  {t('agentPrompt.copyFailed')}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        {note ? <p className='text-xs text-muted-foreground'>{note}</p> : null}
      </EmptyContent>
    </Empty>
  );
}
