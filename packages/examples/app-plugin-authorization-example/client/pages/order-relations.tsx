import { useState, type ReactElement } from 'react';
import { apiClientToken, useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { NS } from '../../catalog.js';
import { useExample } from './use-example.js';
import { operationError } from './operation-error.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';

interface OrderRelationsData {
  id: string;
  title: string;
  access: string;
  operations: Record<string, string[]>;
  options: Record<string, { id: string; title: string }[]>;
  carrier: { id: string; title: string } | null;
  checks: { id: string; title: string; done: boolean }[];
  collaborators: { id: string; title: string }[];
}
export function OrderRelations({
  revision = 0,
}: {
  revision?: number;
}): ReactElement {
  const { t } = useTranslation(NS);
  const orders = useExample<{ id: string; title: string }[]>(
    'sales/orders?pageSize=100',
  );
  const [selected, setSelected] = useState('');
  const id = selected || orders.data?.[0]?.id;
  return (
    <section className='space-y-4 rounded-lg border bg-card p-6 text-card-foreground'>
      <h2 className='text-xl font-semibold'>{t('relations.title')}</h2>
      <p className='text-sm text-muted-foreground'>
        {t('relations.description')}
      </p>
      <label className='block space-y-2'>
        <span>{t('relations.order')}</span>
        <select
          className='w-full rounded-md border border-input bg-background p-2'
          value={id ?? ''}
          onChange={(event) => setSelected(event.target.value)}
        >
          {orders.data?.map((order) => (
            <option key={order.id} value={order.id}>
              {order.title}
            </option>
          ))}
        </select>
      </label>
      {id && <RelationEditor key={`${id}:${revision}`} id={id} />}
    </section>
  );
}
function RelationEditor({ id }: { id: string }): ReactElement {
  const { t } = useTranslation(NS);
  const api = useService(apiClientToken);
  const state = useExample<OrderRelationsData>(
    `sales/orders/${encodeURIComponent(id)}/relations`,
  );
  const [title, setTitle] = useState('');
  const [carrier, setCarrier] = useState('');
  const [collaborator, setCollaborator] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function mutate(values: object): Promise<void> {
    setBusy(true);
    setMessage('');
    try {
      await api.request({
        method: 'PATCH',
        path: `/authorizationExample/sales/orders/${encodeURIComponent(id)}/relations`,
        json: values,
      });
      state.reload();
      setMessage('sales.saved');
    } catch (error) {
      setMessage(operationError(error));
    } finally {
      setBusy(false);
    }
  }
  const order = state.data;
  if (!order)
    return (
      <p role='status'>
        {t(state.error ? 'relations.unavailable' : 'relations.loading')}
      </p>
    );
  const can = (relation: string, operation: string): boolean =>
    !busy && !!order.operations?.[relation]?.includes(operation);
  const deliveryId = carrier || order.options?.carrier?.[0]?.id;
  const collaboratorId = collaborator || order.options?.collaborators?.[0]?.id;
  return (
    <div className='space-y-5'>
      {order.access !== 'allowed' && (
        <p role='status'>{t(`relations.access.${order.access}`)}</p>
      )}
      <div className='space-y-2'>
        <h3 className='font-medium'>{t('relations.carrier')}</h3>
        <p>{order.carrier?.title ?? t('relations.unassigned')}</p>
        <select
          aria-label={t('relations.carrier')}
          className='rounded-md border border-input bg-background p-2'
          value={deliveryId ?? ''}
          onChange={(event) => setCarrier(event.target.value)}
          disabled={!can('carrier', 'connect')}
        >
          {order.options?.carrier?.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.title}
            </option>
          ))}
        </select>
        <div className='flex flex-wrap gap-2'>
          <Button
            disabled={!can('carrier', 'connect') || !deliveryId}
            onClick={() =>
              void mutate({ carrier: { connect: { id: deliveryId } } })
            }
          >
            {t('relations.assign')}
          </Button>
          <Button
            variant='outline'
            disabled={!can('carrier', 'disconnect') || !order.carrier}
            onClick={() => void mutate({ carrier: { disconnect: true } })}
          >
            {t('relations.disconnect')}
          </Button>
        </div>
      </div>
      <div className='space-y-2'>
        <h3 className='font-medium'>{t('relations.checks')}</h3>
        {order.checks.map((check) => (
          <div key={check.id} className='flex flex-wrap items-center gap-2'>
            <span className='flex-1'>
              {check.title} ·{' '}
              {t(check.done ? 'relations.done' : 'relations.pending')}
            </span>
            <Button
              variant='outline'
              disabled={!can('checks', 'update')}
              onClick={() =>
                void mutate({
                  checks: {
                    update: [
                      {
                        filter: { id: check.id },
                        values: { done: !check.done },
                      },
                    ],
                  },
                })
              }
            >
              {t('relations.toggle')}
            </Button>
            <Button
              variant='outline'
              disabled={!can('checks', 'delete')}
              onClick={() =>
                void mutate({
                  checks: { delete: [{ filter: { id: check.id } }] },
                })
              }
            >
              {t('relations.delete')}
            </Button>
          </div>
        ))}
        <div className='flex flex-wrap gap-2'>
          <Input
            aria-label={t('relations.checkTitle')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button
            disabled={!can('checks', 'create') || !title.trim()}
            onClick={() =>
              void mutate({
                checks: {
                  create: [
                    {
                      id: crypto.randomUUID(),
                      title: title.trim(),
                      done: false,
                    },
                  ],
                },
              })
            }
          >
            {t('relations.add')}
          </Button>
        </div>
      </div>
      <div className='space-y-2'>
        <h3 className='font-medium'>{t('relations.collaborators')}</h3>
        <p>
          {order.collaborators.map((carrier) => carrier.title).join(', ') ||
            t('relations.unassigned')}
        </p>
        <select
          aria-label={t('relations.collaborators')}
          className='rounded-md border border-input bg-background p-2'
          value={collaboratorId ?? ''}
          onChange={(event) => setCollaborator(event.target.value)}
          disabled={
            !can('collaborators', 'connect') && !can('collaborators', 'set')
          }
        >
          {order.options?.collaborators?.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.title}
            </option>
          ))}
        </select>
        <Input
          aria-label={t('relations.note')}
          placeholder={t('relations.note')}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className='flex flex-wrap gap-2'>
          <Button
            disabled={!can('collaborators', 'connect') || !collaboratorId}
            onClick={() =>
              void mutate({
                collaborators: {
                  connect: [
                    { where: { id: collaboratorId }, through: { note } },
                  ],
                },
              })
            }
          >
            {t('relations.addProposal')}
          </Button>
          <Button
            variant='outline'
            disabled={!can('collaborators', 'set') || !collaboratorId}
            onClick={() =>
              void mutate({
                collaborators: {
                  set: [{ where: { id: collaboratorId }, through: { note } }],
                },
              })
            }
          >
            {t('relations.replace')}
          </Button>
          <Button
            variant='outline'
            disabled={
              !can('collaborators', 'disconnect') || !order.collaborators.length
            }
            onClick={() =>
              void mutate({
                collaborators: {
                  disconnect: order.collaborators.map((carrier) => ({
                    id: carrier.id,
                  })),
                },
              })
            }
          >
            {t('relations.clear')}
          </Button>
        </div>
      </div>
      {message && <p role='status'>{t(message)}</p>}
    </div>
  );
}
