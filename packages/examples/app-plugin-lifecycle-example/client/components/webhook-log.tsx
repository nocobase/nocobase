import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Send, SendHorizontal } from 'lucide-react';

import { errorMessage } from '../lib/api.js';
import { dateTime, NAMESPACE } from '../lib/format.js';
import { sandboxApi, type WebhookEvent } from '../lib/sandbox-api.js';
import { useTranslate } from '../lib/use-example-record.js';
import { cn } from '../lib/utils.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';

const OUTCOME_TONES: Readonly<Record<string, string>> = {
  applied: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  replayed: 'bg-primary/10 text-primary',
  ignored: 'bg-muted text-muted-foreground',
  retry: 'bg-destructive/10 text-destructive',
  held: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

/** A short line for what the event says. */
function summary(event: WebhookEvent): string {
  const data = event.data;
  const parts = [data.status, data.location, data.paymentRef, data.reason]
    .filter((value) => typeof value === 'string' && value)
    .map(String);
  return parts.join(' · ');
}

/**
 * The console's list of webhooks: each with how its last delivery was
 * answered, and a button to deliver it — the first time, if it was held, or
 * again. Delivering one twice, late, or out of order is the point.
 */
export function WebhookLog({
  events,
  onChange,
}: {
  readonly events: readonly WebhookEvent[];
  readonly onChange: () => Promise<void>;
}): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const api = sandboxApi(useApiClient());
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const deliver = async (eventId: string): Promise<void> => {
    setBusy(eventId);
    setError('');
    try {
      await api.deliver(eventId);
      await onChange();
    } catch (cause) {
      setError(errorMessage(cause, translate));
    } finally {
      setBusy('');
    }
  };

  if (!events.length)
    return (
      <p className='text-sm text-muted-foreground'>{t('webhooks.empty')}</p>
    );

  return (
    <div className='space-y-2'>
      <ul className='space-y-1.5'>
        {events.map((event) => {
          const state = event.status === 'held' ? 'held' : event.outcome;
          return (
            <li
              key={event.eventId}
              className='flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-xs'
            >
              <div className='min-w-0 flex-1 space-y-0.5'>
                <div className='flex flex-wrap items-center gap-1.5'>
                  <span className='font-mono font-medium'>
                    {event.source} · {event.type}
                  </span>
                  {state ? (
                    <Badge className={cn(OUTCOME_TONES[state])}>
                      {t(`webhooks.outcomes.${state}`)}
                    </Badge>
                  ) : null}
                  {event.deliveries > 1 ? (
                    <span className='text-muted-foreground'>
                      {t('webhooks.deliveries', { count: event.deliveries })}
                    </span>
                  ) : null}
                </div>
                <div className='text-muted-foreground'>
                  {t('webhooks.occurred', {
                    time: dateTime(event.occurredAt, i18n.language),
                  })}
                  {summary(event) ? ` · ${summary(event)}` : ''}
                </div>
                {event.outcomeDetail ? (
                  <div className='font-mono break-all text-muted-foreground'>
                    {event.outcomeDetail}
                  </div>
                ) : null}
              </div>
              <Button
                size='sm'
                variant={event.status === 'held' ? 'default' : 'outline'}
                disabled={busy === event.eventId}
                onClick={() => void deliver(event.eventId)}
              >
                {event.status === 'held' ? <Send /> : <SendHorizontal />}
                {event.status === 'held'
                  ? t('webhooks.deliver')
                  : t('webhooks.deliverAgain')}
              </Button>
            </li>
          );
        })}
      </ul>
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
    </div>
  );
}

/** "Hold the webhook" — keep it back to deliver it late or out of order. */
export function HoldToggle({
  value,
  onChange,
}: {
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <label className='inline-flex items-center gap-2 text-sm'>
      <input
        type='checkbox'
        className='size-4 accent-primary'
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
      {t('webhooks.hold')}
    </label>
  );
}
