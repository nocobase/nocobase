/**
 * "Test connection": tries the settings in the form before they are saved (`POST environments/check`) and says what
 * the driver found, such as the Docker version, or why it failed in the reader's language. A driver's form explains
 * its own failures (`check.explain`) and names the details worth showing (`check.details`); the driver's message is
 * kept underneath as sent, for whoever has to fix it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { CircleCheckIcon, CircleXIcon, PlugZapIcon } from 'lucide-react';
import { useEffect, useRef, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { DriverFormDescription } from '../driver-forms/types.js';
import type { CheckOutcome } from '../hooks/use-connection-check.js';
import { errorText, messageText } from '../lib/errors.js';
import { Button } from './ui/button.js';
import { Spinner } from './ui/spinner.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function ConnectionCheckButton({
  outcome,
  disabled,
  onClick,
}: {
  readonly outcome: CheckOutcome;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Button
      type='button'
      variant='outline'
      disabled={disabled || outcome.state === 'running'}
      onClick={onClick}
    >
      {outcome.state === 'running' ? (
        <Spinner data-icon='inline-start' />
      ) : (
        <PlugZapIcon data-icon='inline-start' />
      )}
      {t('ui.driverForm.check')}
    </Button>
  );
}

export function ConnectionCheckResult({
  outcome,
  form,
}: {
  readonly outcome: CheckOutcome;
  readonly form: DriverFormDescription | undefined;
}): ReactElement | null {
  const { t: tOwn } = useTranslation(ACCESS_NAMESPACE);
  const { t: tDriver } = useTranslation(form?.ns ?? ACCESS_NAMESPACE);
  const t = tOwn as unknown as Translate;
  const td = tDriver as unknown as Translate;
  const ref = useRef<HTMLDivElement>(null);
  // The result sits at the end of a long dialog; bring it into view once it arrives.
  useEffect(() => {
    if (outcome.state === 'done' || outcome.state === 'error')
      ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [outcome]);
  if (outcome.state === 'idle' || outcome.state === 'running') return null;
  if (outcome.state === 'done' && outcome.result.ok) {
    const details = isRecord(outcome.result.details)
      ? outcome.result.details
      : {};
    const rows = (form?.check?.details ?? [])
      .filter((entry) => details[entry.key] != null)
      .map((entry) => {
        const raw = String(details[entry.key]);
        const known = entry.values?.[raw];
        return {
          key: entry.key,
          label: td(entry.label),
          value: known ? td(known) : raw,
        };
      });
    return (
      <div
        ref={ref}
        role='status'
        data-slot='check-result'
        data-ok='true'
        className='flex flex-col gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30'
      >
        <p className='flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400'>
          <CircleCheckIcon className='size-4' />
          {t('ui.driverForm.checkOk')}
        </p>
        {rows.length > 0 ? (
          <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1'>
            {rows.map((row) => (
              <div key={row.key} className='contents'>
                <dt className='text-muted-foreground'>{row.label}</dt>
                <dd className='font-mono break-all'>{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    );
  }
  let summary: string;
  let raw: string | undefined;
  if (outcome.state === 'error') {
    summary = errorText(t, outcome.error, t('ui.driverForm.checkFailed'));
    raw = outcome.error instanceof Error ? outcome.error.message : undefined;
  } else {
    raw = outcome.result.message;
    const explained = raw ? form?.check?.explain?.(raw) : null;
    summary = explained
      ? td(explained.key, explained.values)
      : raw
        ? messageText(t, raw)
        : t('ui.driverForm.checkFailed');
  }
  return (
    <div
      ref={ref}
      role='alert'
      data-slot='check-result'
      data-ok='false'
      className='flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm'
    >
      <p className='flex items-center gap-2 font-medium text-destructive'>
        <CircleXIcon className='size-4' />
        {t('ui.driverForm.checkFailedTitle')}
      </p>
      <p>{summary}</p>
      {raw && raw !== summary ? (
        <p className='font-mono text-xs break-all text-muted-foreground'>
          {raw}
        </p>
      ) : null}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
