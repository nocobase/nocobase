import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { OrderRelations } from './order-relations.js';
import { Link, useSearchParams } from 'react-router';
import { useState, type ReactElement } from 'react';
import { apiClientToken, useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { NS } from '../../catalog.js';
import { operationError } from './operation-error.js';
import { useExample } from './use-example.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
interface SalesRecord {
  id: string;
  title: string;
  notes: string;
  projectId?: string;
  project?: { title: string; region: string };
  quoteId?: string;
  preparedByName?: string;
  operations: Partial<Record<'edit' | 'submit' | 'deliver', string>>;
  region?: string;
  amount?: number;
  status?: string;
  deliveryReference?: string | null;
}
export default function SalesPage({
  path,
}: {
  path: 'projects' | 'quotes' | 'orders';
}): ReactElement {
  const { t } = useTranslation(NS);
  const [revision, setRevision] = useState(0);
  return (
    <PageContainer>
      <PageHeader
        title={t(`sales.${path}`)}
        description={t(`sales.descriptions.${path}`)}
      />
      <SalesTable
        path={path}
        onSaved={() => setRevision((value) => value + 1)}
      />
      {path === 'orders' && <OrderRelations revision={revision} />}
    </PageContainer>
  );
}
function SalesTable({
  path,
  onSaved,
}: {
  path: string;
  onSaved: () => void;
}): ReactElement {
  const { t } = useTranslation(NS);
  const api = useService(apiClientToken);
  const [search, setSearch] = useSearchParams();
  // The example's data set is small, so one page of the largest size shows all of it.
  const state = useExample<
    SalesRecord[],
    { navigation?: { projects: boolean; quotes: boolean; orders: boolean } }
  >(`sales/${path}?pageSize=100`);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [references, setReferences] = useState<Record<string, string>>({});
  function refresh(): void {
    onSaved();
    setNotes({});
    setAmounts({});
    setReferences({});
    state.reload();
  }
  function clearDraft(row: SalesRecord): void {
    setNotes((current) => {
      const next = { ...current };
      delete next[row.id];
      return next;
    });
    setAmounts((current) => {
      const next = { ...current };
      delete next[row.id];
      return next;
    });
    setReferences((current) => {
      const next = { ...current };
      delete next[row.id];
      return next;
    });
  }
  function hasChanges(row: SalesRecord): boolean {
    return (
      (notes[row.id] !== undefined && notes[row.id] !== row.notes) ||
      (amounts[row.id] !== undefined && amounts[row.id] !== row.amount)
    );
  }
  async function transition(
    row: SalesRecord,
    action: 'submit' | 'deliver',
  ): Promise<void> {
    setBusy(true);
    setMessage('');
    try {
      await api.request({
        method: 'POST',
        path: `/authorizationExample/sales/${path}/${encodeURIComponent(row.id)}/${action}`,
        ...(action === 'deliver'
          ? {
              json: {
                deliveryReference:
                  references[row.id] ?? row.deliveryReference ?? '',
              },
            }
          : {}),
      });
      clearDraft(row);
      state.reload();
      onSaved();
      setMessage('sales.saved');
    } catch (error) {
      setMessage(operationError(error));
    } finally {
      setBusy(false);
    }
  }
  async function save(row: SalesRecord): Promise<void> {
    setBusy(true);
    setMessage('');
    try {
      const values = {
        notes: notes[row.id] ?? row.notes,
        ...(path === 'quotes' ? { amount: amounts[row.id] ?? row.amount } : {}),
      };
      if (path === 'projects')
        await api.request({
          method: 'POST',
          path: '/authorizationExample/salesProjects/updateOne',
          json: { filter: { id: row.id }, values },
        });
      else
        await api.request({
          method: 'PATCH',
          path: `/authorizationExample/sales/${path}/${encodeURIComponent(row.id)}`,
          json: values,
        });
      setMessage('sales.saved');
      clearDraft(row);
      state.reload();
    } catch (error) {
      setMessage(operationError(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className='overflow-hidden rounded-xl border bg-card'>
      <div className='flex items-center justify-between border-b p-4'>
        <h2 className='font-semibold'>{t(`sales.${path}`)}</h2>
        <Button variant='outline' disabled={busy} onClick={refresh}>
          {t('sales.refresh')}
        </Button>
      </div>
      {(search.get('project') || search.get('record')) && (
        <div className='flex items-center justify-between border-b bg-muted/30 px-4 py-2 text-sm'>
          <span>
            {t('sales.filtered')}:{' '}
            {search.get('project') ?? search.get('record')}
          </span>
          <Button variant='outline' onClick={() => setSearch({})}>
            {t('sales.clearFilter')}
          </Button>
        </div>
      )}
      {state.error ? (
        <p role='alert' className='p-4'>
          {t(state.error)}
        </p>
      ) : state.loading ? (
        <p className='p-4'>{t('sales.loading')}</p>
      ) : (
        <div className='overflow-auto'>
          <table className='w-full text-left text-sm'>
            <thead>
              <tr>
                <th className='p-3'>{t('sales.record')}</th>
                <th className='p-3'>{t('sales.relationships')}</th>
                <th className='p-3'>
                  {t(
                    path === 'orders'
                      ? 'sales.deliveryReference'
                      : 'sales.notes',
                  )}
                </th>
                <th className='p-3'>
                  {t(path === 'quotes' ? 'sales.amount' : 'sales.status')}
                </th>
                <th className='p-3'>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(state.data ?? [])
                .filter(
                  (row) =>
                    (!search.get('project') ||
                      row.projectId === search.get('project')) &&
                    (!search.get('record') || row.id === search.get('record')),
                )
                .map((row) => (
                  <tr key={row.id} className='border-t'>
                    <td className='p-3'>
                      <div className='font-medium'>{row.title}</div>
                      <div className='text-xs text-muted-foreground'>
                        {row.id}
                      </div>
                      {path === 'quotes' && (
                        <div className='text-xs text-muted-foreground'>
                          {t(`sales.states.${row.status}`)}
                        </div>
                      )}
                      {row.region ? (
                        <span className='ml-2 text-muted-foreground'>
                          {row.region}
                        </span>
                      ) : null}
                    </td>
                    <td className='space-y-2 p-3'>
                      {row.projectId && (
                        <div>
                          {t('sales.parentProject')}:{' '}
                          {state.meta?.navigation?.projects ? (
                            <Link
                              className='text-primary underline underline-offset-4'
                              to={`/authorization-example/projects?record=${encodeURIComponent(row.projectId)}`}
                            >
                              {row.project?.title ?? row.projectId}
                            </Link>
                          ) : (
                            <span>
                              {row.projectId} · {t('sales.noPageAccess')}
                            </span>
                          )}
                        </div>
                      )}
                      {row.project && (
                        <div className='text-xs text-muted-foreground'>
                          {row.projectId} · {row.project.region}
                        </div>
                      )}
                      {row.quoteId && (
                        <div>
                          {t('sales.sourceQuote')}:{' '}
                          {state.meta?.navigation?.quotes ? (
                            <Link
                              className='text-primary underline underline-offset-4'
                              to={`/authorization-example/quotes?record=${encodeURIComponent(row.quoteId)}`}
                            >
                              {row.quoteId}
                            </Link>
                          ) : (
                            <span>
                              {row.quoteId} · {t('sales.noPageAccess')}
                            </span>
                          )}
                        </div>
                      )}
                      {row.preparedByName && (
                        <div className='text-muted-foreground'>
                          {t('sales.preparedBy')}: {row.preparedByName}
                        </div>
                      )}
                      {path === 'projects' && (
                        <div className='flex flex-wrap gap-3'>
                          {state.meta?.navigation?.quotes && (
                            <Link
                              className='text-primary underline underline-offset-4'
                              to={`/authorization-example/quotes?project=${encodeURIComponent(row.id)}`}
                            >
                              {t('sales.relatedQuotes')}
                            </Link>
                          )}
                          {state.meta?.navigation?.orders && (
                            <Link
                              className='text-primary underline underline-offset-4'
                              to={`/authorization-example/orders?project=${encodeURIComponent(row.id)}`}
                            >
                              {t('sales.relatedOrders')}
                            </Link>
                          )}
                        </div>
                      )}
                    </td>
                    <td className='p-3'>
                      {path === 'orders' ? (
                        <Input
                          aria-label={`${row.title}: ${t('sales.deliveryReference')}`}
                          disabled={
                            busy || row.operations.deliver !== 'allowed'
                          }
                          value={
                            references[row.id] ?? row.deliveryReference ?? ''
                          }
                          onChange={(event) =>
                            setReferences({
                              ...references,
                              [row.id]: event.target.value,
                            })
                          }
                        />
                      ) : row.operations.edit === 'allowed' ? (
                        <Input
                          aria-label={`${row.title}: ${t('sales.notes')}`}
                          disabled={busy}
                          maxLength={500}
                          value={notes[row.id] ?? row.notes}
                          onChange={(event) =>
                            setNotes({ ...notes, [row.id]: event.target.value })
                          }
                        />
                      ) : (
                        row.notes
                      )}
                    </td>
                    <td className='p-3'>
                      {path === 'quotes' ? (
                        <Input
                          type='number'
                          min={0}
                          aria-label={`${row.title}: ${t('sales.amount')}`}
                          disabled={busy || row.operations.edit !== 'allowed'}
                          value={amounts[row.id] ?? row.amount ?? 0}
                          onChange={(event) =>
                            setAmounts({
                              ...amounts,
                              [row.id]: Number(event.target.value),
                            })
                          }
                        />
                      ) : row.status ? (
                        t(`sales.states.${row.status}`)
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className='space-x-2 p-3'>
                      {row.operations.edit &&
                        row.operations.edit !== 'allowed' && (
                          <p className='text-xs text-muted-foreground'>
                            {t(`sales.operation.${row.operations.edit}`)}
                          </p>
                        )}
                      {row.operations.deliver &&
                        row.operations.deliver !== 'allowed' && (
                          <p className='text-xs text-muted-foreground'>
                            {t(`sales.operation.${row.operations.deliver}`)}
                          </p>
                        )}
                      {row.operations.edit === 'allowed' ? (
                        <Button disabled={busy} onClick={() => void save(row)}>
                          {t('sales.save')}
                        </Button>
                      ) : null}
                      {row.operations.submit &&
                      row.operations.submit !== 'notGranted' ? (
                        <Button
                          disabled={
                            busy ||
                            hasChanges(row) ||
                            row.operations.submit !== 'allowed'
                          }
                          onClick={() => void transition(row, 'submit')}
                        >
                          {t('sales.submit')}
                        </Button>
                      ) : null}
                      {path === 'quotes' &&
                        row.operations.submit &&
                        row.operations.submit !== 'notGranted' && (
                          <p className='mt-2 text-xs text-muted-foreground'>
                            {t(
                              hasChanges(row)
                                ? 'sales.saveFirst'
                                : `sales.operation.${row.operations.submit}`,
                            )}
                          </p>
                        )}
                      {row.operations.deliver &&
                      row.operations.deliver !== 'notGranted' ? (
                        <Button
                          disabled={
                            busy ||
                            row.operations.deliver !== 'allowed' ||
                            !(
                              references[row.id] ??
                              row.deliveryReference ??
                              ''
                            ).trim()
                          }
                          onClick={() => void transition(row, 'deliver')}
                        >
                          {t('sales.deliver')}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!state.data?.some(
            (row) =>
              (!search.get('project') ||
                row.projectId === search.get('project')) &&
              (!search.get('record') || row.id === search.get('record')),
          ) ? (
            <p className='p-4 text-muted-foreground'>{t('sales.empty')}</p>
          ) : null}
        </div>
      )}
      {message ? (
        <p role='status' className='border-t p-3 text-sm'>
          {t(message)}
        </p>
      ) : null}
    </section>
  );
}
