import { RefreshCw } from 'lucide-react';
import type { ReactElement } from 'react';

import type { MailAccountView } from '../mail-client.js';
import { MailStatusBadge, type MailStatusTone } from './mail-status-badge.js';
import { Button } from './ui/button.js';
import { Card } from './ui/card.js';

export interface MailAccountCardProps {
  readonly account: MailAccountView;
  readonly canSync?: boolean;
  readonly providerLabel: string;
  readonly syncLabel?: string;
  readonly statusLabel: string;
  readonly ownerLabel?: string;
  readonly syncing?: boolean;
  readonly onSync?: (account: MailAccountView) => void;
}

export function MailAccountCard({
  account,
  canSync = true,
  providerLabel,
  syncLabel,
  statusLabel,
  ownerLabel,
  syncing = false,
  onSync,
}: MailAccountCardProps): ReactElement {
  return (
    <Card className='p-5 shadow-sm'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='truncate font-semibold'>{account.address}</h3>
            <MailStatusBadge
              label={statusLabel}
              tone={accountStatusTone(account.status)}
            />
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>
            {account.displayName ? `${account.displayName} · ` : ''}
            {providerLabel}
          </p>
          {ownerLabel ? (
            <p className='mt-1 text-xs text-muted-foreground'>{ownerLabel}</p>
          ) : null}
        </div>
        {canSync && onSync && syncLabel ? (
          <Button
            disabled={syncing || account.status !== 'active'}
            onClick={() => onSync(account)}
            type='button'
          >
            <RefreshCw
              aria-hidden='true'
              className={`size-4 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncLabel}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function accountStatusTone(status: MailAccountView['status']): MailStatusTone {
  if (status === 'active') return 'success';
  if (status === 'connecting') return 'info';
  if (status === 'reauthorizationRequired') return 'warning';
  return 'danger';
}
