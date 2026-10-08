import { resolveAppUrl } from '@nocobase/app-client';
import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  readPendingDeliveries,
  clearPendingDelivery,
  type PendingDelivery,
} from '../lib/mail-pending-delivery.js';
import { useMailClient } from '../runtime.js';
import { Button } from './ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';
export function MailPendingDeliveries({
  accountIds,
  onResolved,
}: {
  readonly accountIds: readonly string[];
  readonly onResolved: () => void;
}): ReactElement | null {
  const mail = useMailClient();
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const items = readPendingDeliveries(accountIds);
  const reconcile = async (item: PendingDelivery): Promise<void> => {
    setBusy(item.input.idempotencyKey);
    setError(false);
    try {
      if (item.mode === 'bulk') await mail.sendBulk(item.input);
      else await mail.sendMessage(item.input);
      clearPendingDelivery(item.accountId, item.input.idempotencyKey);
      setRevision(revision + 1);
      onResolved();
    } catch {
      setError(true);
    } finally {
      setBusy(undefined);
    }
  };
  if (!items.length) return null;
  return (
    <div className='space-y-3 rounded-xl border p-4'>
      <p>
        {t('workspace.pendingDelivery', {
          defaultValue:
            'These sending requests could not be confirmed. Their content is preserved here.',
        })}
      </p>
      {items.map((item) => (
        <Collapsible key={item.input.idempotencyKey}>
          <CollapsibleTrigger className='cursor-pointer text-left font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring'>
            {item.input.subject}
          </CollapsibleTrigger>
          <CollapsibleContent className='mt-2 space-y-2'>
            <p>
              {(item.mode === 'bulk' ? item.input.recipients : item.input.to)
                .map((address) => address.address)
                .join(', ')}
            </p>
            <pre className='whitespace-pre-wrap'>{item.input.text}</pre>
            {item.input.attachmentIds?.map((id, index) => (
              <a
                className='block underline'
                href={resolveAppUrl(
                  `/api/mail/attachments/${encodeURIComponent(id)}`,
                )}
                download
                key={id}
              >
                {t('workspace.attachmentNumber', {
                  number: index + 1,
                  defaultValue: 'Attachment {{number}}',
                })}
              </a>
            ))}
            <Button
              disabled={Boolean(busy)}
              onClick={() => void reconcile(item)}
            >
              {t('workspace.reconcileDelivery', {
                defaultValue: 'Resume the original sending request',
              })}
            </Button>
          </CollapsibleContent>
        </Collapsible>
      ))}
      {error ? (
        <p role='alert'>
          {t('workspace.pendingDeliveryOffline', {
            defaultValue:
              'Unable to reach the mail service. The original request is still preserved.',
          })}
        </p>
      ) : null}
    </div>
  );
}
