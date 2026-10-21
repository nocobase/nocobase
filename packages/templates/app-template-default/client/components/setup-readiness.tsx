import { useId, useState, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import type {
  SetupReadinessState,
  SetupUnknownReason,
} from './setup-readiness-state.js';

export interface SetupReadinessLabels {
  readonly title: string;
  readonly checking: string;
  readonly checkAgain: string;
  readonly ready: string;
  readonly missing: string;
  readonly unknown: Readonly<Record<SetupUnknownReason, string>>;
}

/** A feature mounts this only for its actual prerequisites, never every plugin. */
export function SetupReadiness({
  state,
  labels,
}: {
  readonly state: SetupReadinessState;
  readonly labels: SetupReadinessLabels;
}): ReactElement | null {
  const id = useId();
  const [keepConfirmation, setKeepConfirmation] = useState(false);
  const pending = state.items.filter(({ status }) => status !== 'ready');
  if (!state.active) return null;
  if (!state.loading && pending.length === 0 && !keepConfirmation) return null;
  const canRefresh =
    state.loading ||
    state.items.some(
      ({ status, reason }) => status !== 'unknown' || reason === 'unavailable',
    );
  return (
    <section
      aria-labelledby={id}
      aria-busy={state.loading}
      className='flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground'
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 id={id} className='text-base font-medium'>
          {labels.title}
        </h2>
        {(canRefresh || keepConfirmation) && (
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={state.loading || !canRefresh}
            onClick={() => {
              setKeepConfirmation(true);
              state.refresh();
            }}
          >
            {labels.checkAgain}
          </Button>
        )}
      </div>
      <p role='status' className='text-sm text-muted-foreground'>
        {state.loading
          ? labels.checking
          : pending.length
            ? labels.missing
            : labels.ready}
      </p>
      {!state.loading && pending.length > 0 && (
        <ul className='divide-y'>
          {pending.map((item) => (
            <li
              key={item.id}
              className='flex flex-wrap items-center justify-between gap-3 py-2 first:pt-0 last:pb-0'
            >
              <div className='min-w-0 flex-1 basis-48 break-words'>
                <p className='text-sm font-medium'>{item.title}</p>
                <p className='text-sm text-muted-foreground'>
                  {item.status === 'missing'
                    ? item.description
                    : labels.unknown[item.reason ?? 'invalid']}
                </p>
              </div>
              {item.status === 'missing' &&
                item.canConfigure !== false &&
                item.action}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
