import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Badge } from '#components/ui/badge';
import { cn } from 'cn';

import type { ApprovalReceipt, ApprovalReceiptState } from './types.js';
import { useApprovalUi } from './use-approval-ui.js';

const VARIANTS: Readonly<
  Record<ApprovalReceiptState, 'default' | 'secondary' | 'outline'>
> = {
  unread: 'outline',
  read: 'secondary',
  confirmed: 'default',
  revoked: 'outline',
};

function Meter({
  label,
  count,
  total,
}: {
  readonly label: string;
  readonly count: number;
  readonly total: number;
}): ReactElement {
  const percent = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className='min-w-0 flex-1 space-y-1'>
      <div className='flex items-baseline justify-between gap-2 text-xs'>
        <span className='text-muted-foreground'>{label}</span>
        <span className='font-medium tabular-nums'>
          {count}/{total} · {percent}%
        </span>
      </div>
      <div
        role='meter'
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={count}
        className='h-1.5 overflow-hidden rounded-full bg-muted'
      >
        <span
          className='block h-full bg-primary'
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export interface ApprovalReceiptsProps {
  readonly receipts: readonly ApprovalReceipt[];
  /** Whether recipients are asked to confirm, beyond reading it. */
  readonly confirm?: boolean;
  readonly className?: string;
}

/**
 * Who a notice reached and what they did with it: how many have read it
 * and, when they are asked to, confirmed it, then each recipient with
 * their state and what they said. A notice is not decided, so there is no
 * progress to show — only how far it has got.
 */
export function ApprovalReceipts({
  receipts,
  confirm = false,
  className,
}: ApprovalReceiptsProps): ReactElement {
  const { t } = useTranslation();
  const ui = useApprovalUi();
  const live = receipts.filter((receipt) => receipt.state !== 'revoked');
  const read = live.filter((receipt) => receipt.state !== 'unread').length;
  const confirmed = live.filter(
    (receipt) => receipt.state === 'confirmed',
  ).length;
  if (!receipts.length)
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        {t('approvalUi.receipts.empty', {
          defaultValue: 'Nobody has received it yet.',
        })}
      </p>
    );
  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex flex-col gap-3 sm:flex-row'>
        <Meter
          label={t('approvalUi.receipts.read', { defaultValue: 'Read' })}
          count={read}
          total={live.length}
        />
        {confirm ? (
          <Meter
            label={t('approvalUi.receipts.confirmed', {
              defaultValue: 'Confirmed',
            })}
            count={confirmed}
            total={live.length}
          />
        ) : null}
      </div>
      <ul className='divide-y rounded-lg border'>
        {receipts.map((receipt) => (
          <li
            key={receipt.key}
            className={cn(
              'flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2',
              receipt.state === 'revoked' && 'opacity-60',
            )}
          >
            {ui.renderAvatar(receipt.personId)}
            <span className='text-sm'>{ui.personName(receipt.personId)}</span>
            <Badge variant={VARIANTS[receipt.state]}>{receipt.label}</Badge>
            {receipt.at ? (
              <time
                dateTime={receipt.at}
                className='ml-auto text-xs text-muted-foreground'
              >
                {ui.formatDateTime(receipt.at)}
              </time>
            ) : null}
            {receipt.comments?.map((comment) => (
              <span
                key={comment.key}
                className='w-full pl-8 text-xs text-muted-foreground'
              >
                “{comment.text}”
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
