import { Clock } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type { MailMessageSummary } from '../mail-client.js';
import { cn } from '../lib/utils.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';

export function MailScheduledStatus({
  message,
  variant = 'compact',
  action,
}: {
  readonly message: MailMessageSummary;
  readonly variant?: 'compact' | 'banner';
  readonly action?: ReactNode;
}): ReactElement | null {
  const { t, i18n } = useTranslation(MAIL_PLUGIN_NS);
  const [currentYear] = useState(() => new Date().getFullYear());
  const delivery = message.scheduledSend;
  if (!delivery) return null;
  const banner = variant === 'banner';
  const pending = delivery.status === 'pending';
  const failed = delivery.status === 'failed';
  const scheduledAt = delivery.scheduledAt
    ? new Date(delivery.scheduledAt)
    : undefined;
  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center gap-x-3 gap-y-2',
        banner
          ? 'mb-4 rounded-md border border-primary/20 bg-primary/10 px-3 py-2 text-sm'
          : 'mt-2 text-xs',
        banner && failed && 'border-destructive/20 bg-destructive/10',
      )}
    >
      <div
        className='flex min-w-0 flex-1 flex-wrap items-center gap-2'
        role='status'
      >
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 font-medium',
            pending ? 'text-primary' : 'text-muted-foreground',
            failed && 'text-destructive',
            !banner && 'rounded bg-primary/10 px-1.5 py-0.5',
            !banner && !pending && 'bg-muted',
            !banner && failed && 'bg-destructive/10',
          )}
        >
          <Clock
            aria-hidden='true'
            className={banner ? 'size-4' : 'size-3.5'}
          />
          {pending
            ? t(
                banner
                  ? 'workspace.scheduledPending'
                  : 'workspace.scheduledPendingCompact',
                {
                  defaultValue: 'Scheduled',
                },
              )
            : t(`status.submission.${delivery.status}`, {
                defaultValue: delivery.status,
              })}
        </span>
        {scheduledAt ? (
          <time
            className={
              banner
                ? 'font-semibold text-foreground'
                : 'font-medium text-foreground'
            }
            dateTime={delivery.scheduledAt}
            title={scheduledAt.toLocaleString(i18n.language, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'long',
            })}
          >
            {scheduledAt.toLocaleString(i18n.language, {
              year:
                scheduledAt.getFullYear() !== currentYear
                  ? 'numeric'
                  : undefined,
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })}
          </time>
        ) : null}
        {delivery.error ? (
          <span className='basis-full text-destructive'>
            {t(`errors.${delivery.error.code}`, {
              defaultValue: delivery.error.code,
            })}
          </span>
        ) : null}
      </div>
      {banner ? action : null}
    </div>
  );
}
