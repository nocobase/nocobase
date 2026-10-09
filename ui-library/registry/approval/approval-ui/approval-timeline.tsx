import { useTranslation } from '@nocobase/i18n/client';
import { Cog } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { cn } from 'cn';

import type { ApprovalTimelineLine } from './types.js';
import { useApprovalUi } from './use-approval-ui.js';

function Line({ line }: { readonly line: ApprovalTimelineLine }): ReactElement {
  const { t } = useTranslation();
  const ui = useApprovalUi();
  const [open, setOpen] = useState(line.collapsed === false);
  const children = line.children ?? [];
  const details = line.details ?? [];
  return (
    <div className='min-w-0 flex-1'>
      <div className='flex flex-wrap items-baseline gap-x-2 text-sm'>
        {line.kind === 'event' ? (
          <>
            <span className='font-medium'>{ui.personName(line.actorId)}</span>
            <span
              className={cn(
                line.emphasis === 'muted' && 'text-muted-foreground',
                line.emphasis === 'accent' && 'text-primary',
              )}
            >
              {line.title}
            </span>
          </>
        ) : (
          <span className='font-medium'>{line.title}</span>
        )}
        {line.onBehalfOf ? (
          <span className='text-xs text-muted-foreground'>
            {t('approvalUi.timeline.onBehalf', {
              name: ui.personName(line.onBehalfOf),
              defaultValue: 'for {{name}}',
            })}
          </span>
        ) : null}
        <time dateTime={line.at} className='text-xs text-muted-foreground'>
          {ui.formatDateTime(line.at)}
        </time>
      </div>
      {details.length ? (
        <dl className='mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground'>
          {details.map((detail) => (
            <div key={detail.label} className='flex gap-1'>
              <dt>{detail.label}</dt>
              <dd className='text-foreground'>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {line.comment ? (
        <p className='mt-0.5 text-xs text-muted-foreground'>“{line.comment}”</p>
      ) : null}
      {children.length ? (
        <div className='mt-1 text-xs text-muted-foreground'>
          <button
            type='button'
            className='underline-offset-2 hover:underline'
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {t('approvalUi.timeline.showEvents', {
              count: children.length,
              defaultValue: 'What changed ({{count}})',
            })}
          </button>
          {open ? (
            <ul className='mt-1 space-y-0.5 border-l pl-3'>
              {children.map((child) => (
                <li key={child.key}>{child.label}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Bookkeeping lines in a row, folded under one line until opened. */
function SystemGroup({
  lines,
}: {
  readonly lines: readonly ApprovalTimelineLine[];
}): ReactElement {
  const { t } = useTranslation();
  const ui = useApprovalUi();
  const [open, setOpen] = useState(false);
  const last = lines.at(-1);
  return (
    <li className='flex gap-3'>
      <span
        aria-hidden='true'
        className='inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
      >
        <Cog className='size-3.5' />
      </span>
      <div className='min-w-0 flex-1 text-sm text-muted-foreground'>
        <div className='flex flex-wrap items-baseline gap-x-2'>
          <button
            type='button'
            className='underline-offset-2 hover:text-foreground hover:underline'
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {t('approvalUi.timeline.system', {
              count: lines.length,
              defaultValue: '{{count}} system updates',
            })}
          </button>
          {last ? (
            <time dateTime={last.at} className='text-xs'>
              {ui.formatDateTime(last.at)}
            </time>
          ) : null}
        </div>
        {open ? (
          <ol className='mt-1 space-y-1 border-l pl-3 text-xs'>
            {lines.map((line) => (
              <li key={line.key}>
                <span className='text-foreground'>
                  {ui.personName(line.actorId)}
                </span>{' '}
                {line.title}{' '}
                <time dateTime={line.at}>{ui.formatDateTime(line.at)}</time>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </li>
  );
}

export interface ApprovalTimelineProps {
  readonly lines: readonly ApprovalTimelineLine[];
  /**
   * Whether two or more `muted` lines in a row fold into one, so the
   * decisions people made stand out from the bookkeeping. Defaults to true.
   */
  readonly foldMuted?: boolean;
  readonly className?: string;
}

type Entry =
  | { readonly kind: 'line'; readonly line: ApprovalTimelineLine }
  | {
      readonly kind: 'system';
      readonly lines: readonly ApprovalTimelineLine[];
    };

/** The sorted lines with each run of muted ones as one entry. */
function entriesOf(
  lines: readonly ApprovalTimelineLine[],
  fold: boolean,
): Entry[] {
  const entries: Entry[] = [];
  let run: ApprovalTimelineLine[] = [];
  const flush = (): void => {
    if (run.length > 1) entries.push({ kind: 'system', lines: run });
    else if (run.length === 1) entries.push({ kind: 'line', line: run[0] });
    run = [];
  };
  for (const line of lines) {
    if (fold && line.kind === 'event' && line.emphasis === 'muted') {
      run.push(line);
      continue;
    }
    flush();
    entries.push({ kind: 'line', line });
  }
  flush();
  return entries;
}

/**
 * Everything that happened to a request, oldest first, each line with its
 * actor: what people did, with what it changed folded under it, and what
 * happened on its own, with bookkeeping in a row folded into one line.
 * Lines of the same instant keep the order given.
 */
export function ApprovalTimeline({
  lines,
  foldMuted = true,
  className,
}: ApprovalTimelineProps): ReactElement {
  const { t } = useTranslation();
  const ui = useApprovalUi();
  const sorted = lines
    .map((line, order) => ({ line, order }))
    .sort((a, b) =>
      a.line.at === b.line.at
        ? a.order - b.order
        : a.line.at.localeCompare(b.line.at),
    )
    .map(({ line }) => line);
  if (!sorted.length)
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('approvalUi.timeline.empty', {
          defaultValue: 'Nothing has happened yet.',
        })}
      </p>
    );
  return (
    <ol className={cn('space-y-3', className)}>
      {entriesOf(sorted, foldMuted).map((entry) =>
        entry.kind === 'system' ? (
          <SystemGroup
            key={`system:${entry.lines[0].key}`}
            lines={entry.lines}
          />
        ) : (
          <li key={entry.line.key} className='flex gap-3'>
            {ui.renderAvatar(entry.line.actorId)}
            <Line line={entry.line} />
          </li>
        ),
      )}
    </ol>
  );
}
