/** Small pieces the tabs share: badges for states and results, inline code, notes and the load error. */
import { copyText } from '@nocobase/app-client';
import { cn } from 'cn';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert.js';
import { Button } from '../../components/ui/button.js';
import type { OccurrenceStatus, Schedule } from '../../lib/api.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import {
  scheduleState,
  statusTone,
  type ScheduleState,
  type StatusTone,
} from '../../lib/schedule-state.js';

const TONES: Readonly<Record<StatusTone, string>> = {
  success:
    'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  danger: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  warning:
    'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  info: 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  muted: 'bg-muted text-muted-foreground',
};

export function Tag({
  tone,
  dot = false,
  children,
  className,
}: {
  readonly tone: StatusTone;
  readonly dot?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className='size-1.5 rounded-full bg-current' /> : null}
      {children}
    </span>
  );
}

export function StatusTag({
  status,
}: {
  readonly status: OccurrenceStatus;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  return <Tag tone={statusTone(status)}>{t(`status.${status}`)}</Tag>;
}

const STATE_TONES: Readonly<Record<ScheduleState, StatusTone>> = {
  running: 'success',
  paused: 'muted',
  unavailable: 'danger',
  removed: 'muted',
};

export function StateTag({
  schedule,
}: {
  readonly schedule: Schedule;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const state = scheduleState(schedule);
  return (
    <Tag tone={STATE_TONES[state]} dot={state === 'running'}>
      {t(`state.${state}`)}
    </Tag>
  );
}

export function Code({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <code
      className={cn(
        'rounded bg-muted px-1 py-0.5 font-mono text-xs [overflow-wrap:anywhere] text-muted-foreground',
        className,
      )}
    >
      {children}
    </code>
  );
}

/**
 * A translated sentence whose `backticked` parts render as inline code, so the locale files can mark commands and
 * configuration names without markup.
 */
export function Rich({ text }: { readonly text: string }): ReactElement {
  const parts = text.split(/`([^`]+)`/u);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          // eslint-disable-next-line @eslint-react/no-array-index-key -- the parts of one fixed sentence never reorder
          <Code key={index}>{part}</Code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function Notes({
  items,
}: {
  readonly items: readonly string[];
}): ReactElement {
  return (
    <ul className='space-y-1 text-xs text-muted-foreground'>
      {items.map((item) => (
        <li key={item} className='flex gap-1.5'>
          <span aria-hidden>·</span>
          <span>
            <Rich text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LoadError({
  title,
  error,
  onRetry,
}: {
  readonly title: string;
  readonly error: unknown;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  return (
    <Alert variant='destructive'>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className='flex flex-wrap items-center gap-2'>
        <span>{error instanceof Error ? error.message : String(error)}</span>
        <Button size='sm' variant='outline' onClick={onRetry}>
          {t('page.retry')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/** A command in a dark block with a copy button. */
export function CommandBlock({
  command,
}: {
  readonly command: string;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <div className='flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2.5 text-zinc-50 dark:bg-zinc-800'>
      <code className='min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap sm:text-sm'>
        {command}
      </code>
      <Button
        size='sm'
        variant='secondary'
        onClick={() => {
          void copyText(command).then((done) => {
            if (!done) return;
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? t('page.copied') : t('page.copy')}
      </Button>
    </div>
  );
}

/** A label and its value, one row of a definition list that stacks on narrow screens. */
export function Field({
  label,
  children,
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='grid gap-1 py-2 sm:grid-cols-[10rem_1fr] sm:gap-4'>
      <dt className='text-sm text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 text-sm'>{children}</dd>
    </div>
  );
}
