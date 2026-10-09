import { useTranslation } from '@nocobase/i18n/client';
import { GitFork, Zap } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertDescription } from '#components/ui/alert';
import { cn } from 'cn';

import type { ApprovalRoute } from './types.js';
import { useApprovalUi } from './use-approval-ui.js';

/** How many people a stop lists before it counts the rest. */
const SHOWN = 4;

/** One stop on a previewed route: a dot, a name, the people there, and a note. */
function Stop({
  title,
  people,
  note,
  trigger,
  muted = false,
  last = false,
}: {
  readonly title: string;
  readonly people: readonly string[];
  readonly note?: string;
  /** What added the stop, such as a threshold the request crosses. */
  readonly trigger?: string;
  readonly muted?: boolean;
  readonly last?: boolean;
}): ReactElement {
  const ui = useApprovalUi();
  return (
    <li className='relative flex gap-3 pb-4 last:pb-0'>
      {last ? null : (
        <span
          aria-hidden='true'
          className='absolute top-4 bottom-0 left-1.5 w-px -translate-x-1/2 bg-border'
        />
      )}
      <span
        aria-hidden='true'
        className={cn(
          'relative mt-1 size-3 shrink-0 rounded-full border-2 border-primary bg-background',
          muted && 'border-dashed border-muted-foreground',
        )}
      />
      <div className={cn('min-w-0 flex-1 space-y-1', muted && 'opacity-60')}>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span className='text-sm font-medium'>{title}</span>
          {trigger ? (
            <span className='inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary'>
              <Zap className='size-3' />
              {trigger}
            </span>
          ) : null}
        </div>
        {people.length ? (
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            {people.slice(0, SHOWN).map((id) => (
              <span key={id} className='inline-flex items-center gap-1 text-xs'>
                {ui.renderAvatar(id)}
                {ui.personName(id)}
              </span>
            ))}
            {people.length > SHOWN ? (
              <span className='text-xs text-muted-foreground'>
                +{people.length - SHOWN}
              </span>
            ) : null}
          </div>
        ) : null}
        {note ? <p className='text-xs text-muted-foreground'>{note}</p> : null}
      </div>
    </li>
  );
}

export interface ApprovalRoutePreviewProps {
  /** The route; undefined while it is being worked out. */
  readonly route: ApprovalRoute | undefined;
  /** Who submits it: the first stop. */
  readonly applicantId: string;
  readonly className?: string;
}

/**
 * Who a request would go to if it were submitted now, shown beside the form
 * that fills it in: each stage in order, or the branches that would run in
 * parallel, with the stages it skips and why, what stops it from going
 * anywhere, and the notes that explain who was chosen.
 */
export function ApprovalRoutePreview({
  route: preview,
  applicantId,
  className,
}: ApprovalRoutePreviewProps): ReactElement {
  const { t } = useTranslation();
  const submit = t('approvalUi.preview.submit', { defaultValue: 'Submit' });
  const finished = t('approvalUi.preview.finished', {
    defaultValue: 'Decided',
  });
  let body: ReactElement;
  if (!preview)
    body = (
      <p role='status' className='text-xs text-muted-foreground'>
        {t('approvalUi.preview.loading', {
          defaultValue: 'Working out the route…',
        })}
      </p>
    );
  else if (preview.mode === 'none')
    body = (
      <p className='text-xs text-muted-foreground'>
        {t('approvalUi.preview.none', {
          defaultValue: 'This request is decided without an approval.',
        })}
      </p>
    );
  else if (preview.mode === 'branches')
    body = (
      <ol>
        <Stop title={submit} people={[applicantId]} />
        <li className='relative flex gap-3 pb-4'>
          <span
            aria-hidden='true'
            className='absolute top-0 bottom-0 left-1.5 w-px -translate-x-1/2 bg-border'
          />
          <div className='ml-6 min-w-0 flex-1 space-y-2 rounded-lg border border-dashed p-3'>
            <span className='flex items-center gap-1 text-xs text-muted-foreground'>
              <GitFork className='size-3' />
              {t('approvalUi.preview.parallel', {
                defaultValue: 'In parallel',
              })}
            </span>
            <ol>
              {preview.stops.map((step, index) => (
                <Stop
                  key={step.key}
                  title={step.title}
                  people={step.people}
                  {...(step.required !== false
                    ? {}
                    : {
                        note: t('approvalUi.preview.optional', {
                          defaultValue: 'Optional',
                        }),
                      })}
                  last={index === preview.stops.length - 1}
                />
              ))}
            </ol>
          </div>
        </li>
        <Stop title={finished} people={[]} last />
      </ol>
    );
  else {
    const included = preview.stops.filter((step) => step.included);
    body = (
      <ol>
        <Stop title={submit} people={[applicantId]} />
        {included.map((step) => {
          const note =
            step.people.length > 1
              ? (step.policy ?? undefined)
              : step.people.length
                ? undefined
                : t('approvalUi.preview.nobody', {
                    defaultValue: 'Nobody qualified yet',
                  });
          return (
            <Stop
              key={step.key}
              title={step.title}
              people={step.people}
              {...(note ? { note } : {})}
              {...(step.because ? { trigger: step.because } : {})}
            />
          );
        })}
        <Stop
          title={
            included.length
              ? finished
              : t('approvalUi.preview.automatic', {
                  defaultValue: 'Approved without a decision',
                })
          }
          people={[]}
          last
        />
      </ol>
    );
  }
  const skipped = preview?.stops.filter((step) => !step.included) ?? [];
  return (
    <section
      className={cn('space-y-3 rounded-xl border bg-muted/30 p-4', className)}
    >
      <h3 className='text-sm font-semibold'>
        {t('approvalUi.preview.title', { defaultValue: 'Who will decide' })}
      </h3>
      {body}
      {skipped.length ? (
        <p className='text-xs text-muted-foreground'>
          {t('approvalUi.preview.skipped', {
            stages: skipped
              .map(
                (step) =>
                  `${step.title}${step.because ? ` (${step.because})` : ''}`,
              )
              .join(', '),
            defaultValue: 'Not needed: {{stages}}',
          })}
        </p>
      ) : null}
      {preview?.problems.length ? (
        <Alert variant='destructive'>
          <AlertDescription>{preview.problems.join(' ')}</AlertDescription>
        </Alert>
      ) : null}
      {preview?.notes.length ? (
        <ul className='list-inside list-disc text-xs text-muted-foreground'>
          {preview.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
