/** One semantic color and compact reset label across every quota surface. */
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type { QuotaLocation } from '../../shared/quota.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { compactDateTime } from '../lib/format.js';
import { Badge } from './ui/badge.js';

export function QuotaLabel({
  resetsAt,
  near = false,
  reset = false,
  usage = false,
}: {
  readonly resetsAt?: string | null;
  readonly near?: boolean;
  readonly reset?: boolean;
  readonly usage?: boolean;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const time = resetsAt ? compactDateTime(resetsAt, i18n.language) : '';
  return (
    <Badge
      variant='secondary'
      data-quota-hint
      className={
        near
          ? 'bg-amber-500/10 !text-amber-700 dark:!text-amber-300'
          : 'bg-destructive/10 !text-destructive'
      }
    >
      {t(
        near
          ? 'runtimes.quota.near'
          : usage
            ? 'runtimes.quota.usageLimit'
            : 'runtimes.quota.reached',
      )}
      {reset
        ? ` · ${resetsAt ? t('runtimes.quota.shortReset', { time }) : t('runtimes.quota.shortUnknown')}`
        : ''}
    </Badge>
  );
}

export function AgentQuotaHint({
  quota = [],
  online,
  names = [],
}: {
  readonly quota?: readonly QuotaLocation[];
  readonly online: boolean;
  readonly names?: readonly string[];
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (!quota.length) return null;
  if (online)
    return (
      <span
        data-quota-hint
        className='block truncate text-xs !text-destructive'
      >
        {t('runtimes.quota.partial', {
          available:
            names
              .filter((name) => !quota.some((q) => q.runnerName === name))
              .join(', ') || names.join(', '),
          blocked: quota.map((q) => q.runnerName).join(', '),
        })}
      </span>
    );
  return (
    <span className='block truncate text-xs'>
      <QuotaLabel
        resetsAt={
          quota.flatMap((q) => (q.resetsAt ? [q.resetsAt] : [])).sort()[0] ??
          null
        }
        reset
      />
    </span>
  );
}

export function QuotaQueueHint(): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <p
      data-quota-queue-hint
      className='border-t px-2 py-2 text-xs whitespace-normal text-muted-foreground'
    >
      {t('runtimes.quota.queueHint')}
    </p>
  );
}
