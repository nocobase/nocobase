/**
 * Two versions of a document, line by line: removed lines red, added green, unchanged ones folded around changes.
 * Inline shows one column; Split puts the version before beside the version after. Previous and Next move between the
 * runs of changes.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';

import { Button } from './ui/button.js';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.js';
import { cn } from 'cn';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  changeStarts,
  diffLines,
  foldDiff,
  splitRows,
  type DiffLine,
} from '../lib/diff.js';

type Mode = 'inline' | 'split';

const tone = (kind: DiffLine['kind'] | undefined) =>
  cn(
    kind === 'added' &&
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    kind === 'removed' &&
      'bg-destructive/10 text-destructive line-through decoration-destructive/40',
  );

const sign = (kind: DiffLine['kind'] | undefined) =>
  kind === 'added' ? '+' : kind === 'removed' ? '−' : ' ';

function Fold({ count }: { readonly count: number }): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <div className='bg-muted/50 px-3 py-0.5 text-muted-foreground'>
      {t('knowledge.history.unchangedLines', { count })}
    </div>
  );
}

function Line({
  line,
  change,
  className,
}: {
  readonly line: DiffLine | null;
  /** The run of changes this line starts. */
  readonly change?: number | undefined;
  readonly className?: string;
}): ReactElement {
  return (
    <div
      data-change={change}
      className={cn(
        'min-w-0 px-3 whitespace-pre-wrap',
        line ? tone(line.kind) : 'bg-muted/30',
        className,
      )}
    >
      {line ? (
        <>
          <span aria-hidden='true' className='mr-2 select-none opacity-60'>
            {sign(line.kind)}
          </span>
          {line.text || ' '}
        </>
      ) : (
        ' '
      )}
    </div>
  );
}

export function DiffView({
  before,
  after,
  label,
}: {
  readonly before: string;
  readonly after: string;
  readonly label?: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [mode, setMode] = useState<Mode>('inline');
  const [current, setCurrent] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const rows = foldDiff(diffLines(before, after));
  const split = splitRows(rows);
  const shown = mode === 'split' ? split : rows;
  const starts = changeStarts(shown);
  const go = (step: 1 | -1) => {
    if (starts.length === 0) return;
    const next =
      current < 0
        ? step === 1
          ? 0
          : starts.length - 1
        : (current + step + starts.length) % starts.length;
    setCurrent(next);
    boxRef.current
      ?.querySelector(`[data-change="${next}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const changeOf = (index: number) => {
    const found = starts.indexOf(index);
    return found === -1 ? undefined : found;
  };
  return (
    <figure
      className='min-w-0 space-y-2'
      data-testid='knowledge-diff'
      aria-label={label}
    >
      {label || starts.length > 0 ? (
        <div className='flex flex-wrap items-center gap-2'>
          {label ? (
            <p className='mr-auto text-sm font-medium'>{label}</p>
          ) : (
            <span className='mr-auto' />
          )}
          {starts.length > 0 ? (
            <>
              <span className='text-xs text-muted-foreground tabular-nums'>
                {t('knowledge.diff.changes', { count: starts.length })}
              </span>
              <Button
                variant='outline'
                size='icon'
                aria-label={t('knowledge.diff.previous')}
                title={t('knowledge.diff.previous')}
                onClick={() => go(-1)}
              >
                <ChevronUpIcon />
              </Button>
              <Button
                variant='outline'
                size='icon'
                aria-label={t('knowledge.diff.next')}
                title={t('knowledge.diff.next')}
                onClick={() => go(1)}
              >
                <ChevronDownIcon />
              </Button>
              <ToggleGroup
                variant='outline'
                value={[mode]}
                onValueChange={(value: readonly string[]) => {
                  const next = value[0];
                  if (next === 'inline' || next === 'split') {
                    setMode(next);
                    setCurrent(-1);
                  }
                }}
                aria-label={t('knowledge.diff.layout')}
              >
                <ToggleGroupItem value='inline'>
                  {t('knowledge.diff.inline')}
                </ToggleGroupItem>
                <ToggleGroupItem value='split'>
                  {t('knowledge.diff.split')}
                </ToggleGroupItem>
              </ToggleGroup>
            </>
          ) : null}
        </div>
      ) : null}
      {starts.length > 0 ? (
        <div
          ref={boxRef}
          className='overflow-x-auto rounded-lg border font-mono text-xs leading-5'
        >
          {mode === 'split'
            ? split.map((row, index) =>
                row.kind === 'fold' ? (
                  <Fold key={`fold-${row.at}`} count={row.count} />
                ) : (
                  <div
                    key={`pair-${row.at}`}
                    className={cn(
                      'grid grid-cols-2 divide-x',
                      changeOf(index) === current &&
                        current >= 0 &&
                        'ring-1 ring-ring ring-inset',
                    )}
                    data-change={changeOf(index)}
                  >
                    <Line line={row.left?.kind === 'added' ? null : row.left} />
                    <Line
                      line={row.right?.kind === 'removed' ? null : row.right}
                    />
                  </div>
                ),
              )
            : rows.map((row, index) =>
                row.kind === 'fold' ? (
                  <Fold key={`fold-${row.at}`} count={row.count} />
                ) : (
                  <Line
                    key={`line-${row.at}`}
                    line={row}
                    className={cn(
                      changeOf(index) === current &&
                        current >= 0 &&
                        'ring-1 ring-ring ring-inset',
                    )}
                    change={changeOf(index)}
                  />
                ),
              )}
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('knowledge.history.noChanges')}
        </p>
      )}
    </figure>
  );
}
