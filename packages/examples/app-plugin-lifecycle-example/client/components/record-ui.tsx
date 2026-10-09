import { useState, type ReactElement, type ReactNode } from 'react';
import { useApiClient } from '@nocobase/app-client';
import type { UseLifecycleResult } from '@nocobase/lifecycle/react';
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRight, Play } from 'lucide-react';

import { useActorName } from '../lib/actor.js';
import {
  blockerMessage,
  errorMessage,
  exampleApi,
  type RecordDetail,
} from '../lib/api.js';
import { useTranslate } from '../lib/use-example-record.js';
import { dateTime, NAMESPACE } from '../lib/format.js';
import { cn } from '../lib/utils.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const RETRYABLE: ReadonlySet<string> = new Set(['failed', 'dead', 'cancelled']);
const CANCELLABLE: ReadonlySet<string> = new Set(['queued', 'running']);

const TONES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-primary/10 text-primary',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  danger: 'bg-destructive/10 text-destructive',
};

/** How each state looks; a state not listed is neutral. */
const STATE_TONES: Readonly<Record<string, Tone>> = {
  new: 'info',
  open: 'warning',
  awaitingCustomer: 'neutral',
  closed: 'success',
  draft: 'neutral',
  awaitingManager: 'warning',
  awaitingFinance: 'warning',
  needsInfo: 'danger',
  approved: 'info',
  rejected: 'danger',
  paid: 'success',
};

export function StateBadge({
  state,
}: {
  readonly state: string;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <Badge className={TONES[STATE_TONES[state] ?? 'neutral']}>
      {t(`states.${state}`)}
    </Badge>
  );
}

export function Banner({
  tone,
  children,
}: {
  readonly tone: Tone;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className={cn('rounded-lg px-3 py-2 text-sm', TONES[tone])}>
      {children}
    </div>
  );
}

/** A label above its value, for record headers. */
export function Field({
  label,
  children,
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='min-w-0'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-0.5 truncate text-sm'>{children}</div>
    </div>
  );
}

/**
 * What the lifecycle recorded for one record: where it can go, the
 * transition log and the effect runs. The pages above it read like the
 * product; this is where the example shows what produced them.
 */
export function LifecyclePanel({
  detail,
  actions,
  onChange,
}: {
  readonly detail: RecordDetail;
  /** The library's operator actions on this record's runs. */
  readonly actions: Pick<
    UseLifecycleResult,
    'retryRun' | 'continueRun' | 'cancelRun'
  >;
  readonly onChange: () => Promise<void>;
}): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = useApiClient();
  const actorName = useActorName();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const state = String(detail.record.status);
  const transitionNames = new Map(
    detail.history.transitions.map((entry) => [entry.id, entry.transition]),
  );

  // What an operator does with a run that is stuck or gave up.
  const operate = async (
    action: 'retryRun' | 'continueRun' | 'cancelRun',
    runId: string,
  ): Promise<void> => {
    try {
      await actions[action](runId);
      setNote('');
      await onChange();
    } catch (cause) {
      setNote(errorMessage(cause, translate));
    }
  };

  const runTriggers = async (): Promise<void> => {
    try {
      const count = await exampleApi(client).runTriggers();
      setNote(t('lifecycle.swept', { count }));
      await onChange();
    } catch (cause) {
      setNote(errorMessage(cause, translate));
    }
  };

  return (
    <section className='rounded-xl border border-dashed'>
      <button
        type='button'
        className='flex w-full items-start gap-2 px-4 py-3 text-left text-sm'
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          className={cn(
            'mt-0.5 size-4 shrink-0 transition-transform',
            open && 'rotate-90',
          )}
        />
        <span>
          <span className='font-medium'>{t('lifecycle.title')}</span>
          <span className='block text-xs text-muted-foreground'>
            {t('lifecycle.hint')}
          </span>
        </span>
      </button>
      {open ? (
        <div className='space-y-5 border-t px-4 py-4 text-sm'>
          <div className='space-y-2'>
            <h3 className='font-medium'>{t('lifecycle.states')}</h3>
            <div className='flex flex-wrap gap-1.5'>
              {detail.description.states.map((name) => (
                <Badge
                  key={name}
                  variant={name === state ? 'default' : 'outline'}
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='font-medium'>{t('lifecycle.available')}</h3>
            {detail.available.length ? (
              <ul className='space-y-1'>
                {detail.available.map((item) => (
                  <li key={item.name} className='flex flex-wrap gap-x-2'>
                    <span
                      className={cn(
                        'font-mono',
                        item.allowed
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {item.allowed ? '✓' : '✗'} {item.name}
                    </span>
                    {item.blockers.map((blocker) => (
                      <span
                        key={blocker.code + blocker.message}
                        className='text-muted-foreground'
                      >
                        {blockerMessage(blocker, translate)}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-muted-foreground'>{t('lifecycle.final')}</p>
            )}
          </div>

          <div className='space-y-2'>
            <h3 className='font-medium'>{t('lifecycle.parameters')}</h3>
            <code className='block rounded-md bg-muted px-2 py-1.5 text-xs break-all'>
              {JSON.stringify(detail.parameters)}
            </code>
            <div className='flex flex-wrap items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => void runTriggers()}
              >
                <Play />
                {t('lifecycle.runTriggers')}
              </Button>
              <span className='text-xs text-muted-foreground'>
                {note || t('lifecycle.sweepNote')}
              </span>
            </div>
          </div>

          <details className='space-y-2'>
            <summary className='cursor-pointer font-medium'>
              {t('lifecycle.diagram')}
            </summary>
            <p className='text-xs text-muted-foreground'>
              {t('lifecycle.diagramHint')}
            </p>
            <pre className='overflow-x-auto rounded-md bg-muted px-2 py-1.5 text-xs'>
              {detail.diagram}
            </pre>
          </details>

          <div className='space-y-2'>
            <h3 className='font-medium'>{t('lifecycle.transitions')}</h3>
            {detail.history.transitions.length ? (
              <div className='overflow-x-auto'>
                <table className='w-full text-xs'>
                  <thead className='text-left text-muted-foreground'>
                    <tr>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.time')}
                      </th>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.transition')}
                      </th>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.change')}
                      </th>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.actor')}
                      </th>
                      <th className='py-1 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.input')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.history.transitions.map((entry) => (
                      <tr key={entry.id} className='border-t align-top'>
                        <td className='py-1.5 pr-3 whitespace-nowrap'>
                          {dateTime(entry.at, i18n.language)}
                        </td>
                        <td className='py-1.5 pr-3 font-mono'>
                          {entry.transition}
                        </td>
                        <td className='py-1.5 pr-3 font-mono whitespace-nowrap'>
                          {entry.from ?? '∅'} → {entry.to}
                        </td>
                        <td className='py-1.5 pr-3 whitespace-nowrap'>
                          {actorName(entry.actorId)}
                        </td>
                        <td className='py-1.5 font-mono break-all'>
                          {Object.keys(entry.input).length
                            ? JSON.stringify(entry.input)
                            : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='text-muted-foreground'>
                {t('lifecycle.noTransitions')}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <h3 className='font-medium'>{t('lifecycle.effects')}</h3>
            {detail.history.effectRuns.length ? (
              <div className='overflow-x-auto'>
                <table className='w-full text-xs'>
                  <thead className='text-left text-muted-foreground'>
                    <tr>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.effect')}
                      </th>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.transition')}
                      </th>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.status')}
                      </th>
                      <th className='py-1 pr-3 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.attempts')}
                      </th>
                      <th className='py-1 font-normal whitespace-nowrap'>
                        {t('lifecycle.columns.error')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.history.effectRuns.map((run) => (
                      <tr key={run.id} className='border-t align-top'>
                        <td className='py-1.5 pr-3 font-mono'>{run.effect}</td>
                        <td className='py-1.5 pr-3 font-mono'>
                          {transitionNames.get(run.transitionId) ?? ''}
                        </td>
                        <td className='py-1.5 pr-3 whitespace-nowrap'>
                          <div>{t(`runs.${run.status}`)}</div>
                          {/* A failed run whose onFailure still waits is
                              continued, not retried: a retry is refused. */}
                          {RETRYABLE.has(run.status) && !run.continuation ? (
                            <Button
                              size='sm'
                              variant='outline'
                              className='mt-1'
                              onClick={() => void operate('retryRun', run.id)}
                            >
                              {t('lifecycle.retry')}
                            </Button>
                          ) : CANCELLABLE.has(run.status) ? (
                            <Button
                              size='sm'
                              variant='ghost'
                              className='mt-1'
                              onClick={() => void operate('cancelRun', run.id)}
                            >
                              {t('lifecycle.cancel')}
                            </Button>
                          ) : null}
                          {run.continuation ? (
                            // The outcome is recorded but what follows it
                            // could not fire yet; the sweep tries it again,
                            // unless it gave up, and this tries it now.
                            <Button
                              size='sm'
                              variant='outline'
                              className='mt-1 ml-1'
                              onClick={() =>
                                void operate('continueRun', run.id)
                              }
                            >
                              {t('lifecycle.continue')}
                            </Button>
                          ) : null}
                        </td>
                        <td className='py-1.5 pr-3'>
                          {t('lifecycle.attempts', {
                            attempts: run.attempts,
                            max: run.maxAttempts,
                          })}
                        </td>
                        <td className='min-w-40 py-1.5 break-words text-destructive'>
                          {run.error ? <div>{run.error}</div> : null}
                          {run.continuation ? (
                            <div>
                              {t(
                                run.continuation.abandonedAt
                                  ? 'lifecycle.continuationAbandoned'
                                  : 'lifecycle.continuationWaits',
                                {
                                  transition: run.continuation.transition,
                                  error: run.continuation.error,
                                  attempts: run.continuation.attempts,
                                },
                              )}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className='text-muted-foreground'>
                {t('lifecycle.noEffects')}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
