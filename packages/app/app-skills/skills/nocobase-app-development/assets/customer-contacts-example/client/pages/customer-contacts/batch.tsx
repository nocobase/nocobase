import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useId, useState } from 'react';
import { useOutletContext } from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Label } from '#components/ui/label';
import { RelationPicker } from './relation-picker.js';
import { Choice, StatusChoice, WriteFeedback } from './shared.js';
import { base, useCrmAction, useWriteLock, type BatchResult } from './model.js';
import type { CustomerListContext } from './index.js';

export default function CustomerBatchPage() {
  const context = useOutletContext<CustomerListContext>();
  const [ids] = useState(() => [...context.selected]);
  const { t } = useTranslation();
  const api = useApiClient();
  const edit = useCrmAction('customers', 'edit');
  const assign = useCrmAction('customers', 'assign');
  const [field, setField] = useState('status');
  const currentField = !edit.can && assign.can ? 'ownerId' : field;
  const [status, setStatus] = useState('active');
  const [ownerId, setOwnerId] = useState('');
  const [validOwner, setValidOwner] = useState(false);
  const [error, setError] = useState<unknown>();
  const [result, setResult] = useState<BatchResult>();
  const lock = useWriteLock();
  const formId = useId();
  const allowed = currentField === 'status' ? edit.can : assign.can;
  const submit = async () => {
    if (
      !ids.length ||
      !allowed ||
      (currentField === 'ownerId' && !validOwner) ||
      !lock.acquire()
    )
      return;
    setError(undefined);
    try {
      const values = currentField === 'status' ? { status } : { ownerId };
      const response = await api.request<{ data: BatchResult }>({
        path: `${base}/customers/batchUpdate`,
        method: 'POST',
        json: { ids, values },
      });
      setResult(response.data);
      context.onBatchSaved(
        response.data.items
          .filter((item) => item.outcome === 'updated')
          .map((item) => item.id),
        values,
      );
      context.reload();
      context.clearSelection();
    } catch (failure) {
      setError(failure);
    } finally {
      lock.release();
    }
  };
  return (
    <RouteDialog
      title={t('customerContacts.batchTitle')}
      beforeClose={() => !lock.locked()}
      footer={
        result || !ids.length ? (
          <BatchClose />
        ) : (
          <>
            <BatchClose disabled={lock.busy} cancel />
            <Button
              type='submit'
              form={formId}
              disabled={
                lock.busy ||
                !allowed ||
                (currentField === 'ownerId' && !validOwner)
              }
            >
              {lock.busy
                ? t('customerContacts.saving')
                : t('customerContacts.apply')}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className='flex flex-col gap-4' role='status'>
          <p className='font-medium'>
            {t('customerContacts.result', {
              updated: result.updated,
              failed: result.failed,
            })}
          </p>
          <ul className='flex flex-col gap-2 text-sm'>
            {result.items.map((item) => (
              <li key={item.id} className='break-words'>
                {item.id}:{' '}
                {item.outcome === 'failed'
                  ? t(`customerContacts.${item.reason}`)
                  : t('customerContacts.done')}
              </li>
            ))}
          </ul>
        </div>
      ) : !ids.length ? (
        <p>{t('customerContacts.noSelection')}</p>
      ) : (
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className='flex flex-col gap-4'
        >
          <p>{t('customerContacts.batchCount', { count: ids.length })}</p>
          <WriteFeedback error={error} />
          <Label>{t('customerContacts.batchField')}</Label>
          <Choice
            label={t('customerContacts.batchField')}
            value={currentField}
            disabled={lock.busy}
            onChange={setField}
            options={[
              ...(edit.can
                ? [{ value: 'status', label: t('customerContacts.status') }]
                : []),
              ...(assign.can
                ? [{ value: 'ownerId', label: t('customerContacts.owner') }]
                : []),
            ]}
          />
          {currentField === 'status' ? (
            <StatusChoice
              value={status}
              disabled={lock.busy}
              onChange={setStatus}
            />
          ) : (
            <RelationPicker
              kind='salesReps'
              label={t('customerContacts.owner')}
              value={ownerId}
              disabled={lock.busy}
              onChange={setOwnerId}
              onValidityChange={setValidOwner}
            />
          )}
        </form>
      )}
    </RouteDialog>
  );
}
function BatchClose({
  disabled = false,
  cancel = false,
}: {
  disabled?: boolean;
  cancel?: boolean;
}) {
  const { close } = useRouteOverlay();
  const { t } = useTranslation();
  return (
    <Button variant='outline' disabled={disabled} onClick={() => void close()}>
      {t(cancel ? 'customerContacts.cancel' : 'customerContacts.close')}
    </Button>
  );
}
