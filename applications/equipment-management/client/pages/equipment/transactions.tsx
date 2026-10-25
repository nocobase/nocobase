import { RequiredFieldError, focusInvalid } from './validation.js';
import { useState, type FormEvent } from 'react';
import {
  Link,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';
import { RouteDialog } from '#components/route-dialog';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { LongText, LongTextPreview } from '#components/long-text';
import { toast } from '#components/ui/toast';
import { useTableUrlState } from '../../hooks/use-table-url-state.js';
import {
  useEquipment,
  useEquipmentWrite,
  useCapabilities,
  useReferences,
  type Row,
  type AssetView,
} from './api.js';
import { useFormGuard } from './form-guard.js';
import {
  LoadState,
  Status,
  Display,
  Choice,
  FormFields,
  ErrorNotice,
  type FormField,
} from './shared.js';
type Kind = 'requests' | 'maintenance' | 'stocktakes';
const cap = (kind: Kind) =>
  kind === 'requests' ? 'requests.create' : kind + '.manage';
export function TransactionList({ kind }: { kind: Kind }) {
  const { t } = useTranslation();
  const caps = useCapabilities();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const table = useTableUrlState({
    defaultPageSize: 20,
    sortColumns: ['statusChangedAt'],
  });
  const query = new URLSearchParams(params);
  query.set('page', String(table.paginationState.pageIndex + 1));
  query.set('pageSize', String(table.paginationState.pageSize));
  const result = useEquipment<Row[]>(kind + '?' + query.toString());
  const can = !!caps.data?.data[cap(kind)];
  const createLabel = t(
    'equipment.' +
      (kind === 'requests'
        ? 'newRequest'
        : kind === 'maintenance'
          ? 'newMaintenance'
          : 'newStocktake'),
  );
  const add = can ? (
    <Button
      nativeButton={false}
      render={<Link to={{ pathname: 'new', search: location.search }} />}
    >
      {createLabel}
    </Button>
  ) : null;
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('equipment.' + kind)}
          description={t(
            'equipment.' +
              (kind === 'requests'
                ? 'requestHint'
                : kind === 'maintenance'
                  ? 'maintenanceHint'
                  : 'stocktakeHint'),
          )}
          actions={
            <>
              {!result.isPending && !!result.data?.data.length ? add : null}
              <Button
                variant='outline'
                disabled={result.isFetching}
                onClick={() => void result.refetch()}
              >
                {t('equipment.refresh')}
              </Button>
            </>
          }
        />
        <div className='w-full sm:w-48'>
          <Choice
            id={'status-' + kind}
            label={t('equipment.fields.status')}
            value={params.get('status') || 'all'}
            onChange={(value) =>
              setParams((old) => {
                const next = new URLSearchParams(old);
                next.delete('page');
                if (value === 'all') next.delete('status');
                else next.set('status', value);
                return next;
              })
            }
            options={[
              'all',
              ...(kind === 'requests'
                ? ['pending', 'completed', 'rejected']
                : ['open', 'completed']),
            ].map((value) => ({
              value,
              label: t(
                value === 'all' ? 'equipment.all' : 'equipment.states.' + value,
              ),
            }))}
          />
        </div>
        <LoadState
          loading={result.isPending}
          error={result.error}
          retry={() => void result.refetch()}
          empty={
            !result.isPending && !result.error && !result.data?.data.length
          }
          action={add}
        />
        {!!result.data?.data.length && (
          <DataTable
            data={result.data.data}
            manualPagination
            manualSorting
            rowCount={result.data.meta?.total}
            {...table}
            loading={result.isFetching}
            showSelectedCount={false}
            columns={[
              {
                id: 'record',
                header: t('equipment.record'),
                enableSorting: false,
                cell: ({ row }) => (
                  <Link
                    className='font-medium text-primary hover:underline'
                    to={{ pathname: row.original.id, search: location.search }}
                  >
                    {kind === 'stocktakes'
                      ? String(row.original.name)
                      : t('equipment.transitions.' + row.original.kind) +
                        ' · ' +
                        String(row.original.id).slice(0, 8)}
                  </Link>
                ),
              },
              {
                accessorKey:
                  kind === 'requests'
                    ? 'reason'
                    : kind === 'maintenance'
                      ? 'description'
                      : 'locationId',
                header: t(
                  'equipment.fields.' +
                    (kind === 'requests'
                      ? 'reason'
                      : kind === 'maintenance'
                        ? 'description'
                        : 'locationId'),
                ),
                enableSorting: false,
                cell: ({ getValue }) => (
                  <LongTextPreview
                    label={t('equipment.fields.description')}
                    lines={1}
                    className='max-w-sm'
                  >
                    {typeof getValue() === 'string' ? getValue<string>() : '—'}
                  </LongTextPreview>
                ),
              },
              {
                accessorKey: 'status',
                header: t('equipment.fields.status'),
                enableSorting: false,
                cell: ({ row }) => <Status value={row.original.status} />,
              },
              {
                accessorKey: 'statusChangedAt',
                header: ({ column }) => (
                  <DataTableColumnHeader
                    column={column}
                    title={t('equipment.fields.statusChangedAt')}
                  />
                ),
                cell: ({ getValue }) => <Display value={getValue()} />,
              },
            ]}
          />
        )}
      </PageContainer>
      <Outlet />
    </>
  );
}
export function TransactionDetail({ kind }: { kind: Kind }) {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const result = useEquipment<AssetView>(kind + '/' + id);
  const caps = useCapabilities();
  const location = useLocation();
  const refs = useReferences();
  const record = result.data?.data.record;
  const can =
    caps.data?.data[kind === 'requests' ? 'requests.handle' : kind + '.manage'];
  const completed =
    record?.status === 'completed' || record?.status === 'rejected';
  return (
    <>
      <RouteChildPage>
        <PageContainer className='mx-auto max-w-5xl'>
          <PageHeader
            title={
              record
                ? String(
                    record.name ||
                      t('equipment.transitions.' + record.kind) +
                        ' · ' +
                        id.slice(0, 8),
                  )
                : t('equipment.details')
            }
            actions={
              <>
                <Button
                  variant='outline'
                  nativeButton={false}
                  render={
                    <Link
                      to={{ pathname: '..', search: location.search }}
                      relative='route'
                    />
                  }
                >
                  {t('equipment.back')}
                </Button>
                {record && can && !completed && (
                  <Button
                    nativeButton={false}
                    render={
                      <Link
                        to={{ pathname: 'handle', search: location.search }}
                      />
                    }
                  >
                    {t(
                      'equipment.' +
                        (kind === 'requests' ? 'handle' : 'complete'),
                    )}
                  </Button>
                )}
                <Button
                  variant='outline'
                  disabled={result.isFetching}
                  onClick={() => void result.refetch()}
                >
                  {t('equipment.refresh')}
                </Button>
              </>
            }
          />
          <LoadState
            loading={result.isPending}
            error={result.error}
            retry={() => void result.refetch()}
          />
          {record && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{t('equipment.details')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className='grid gap-4 sm:grid-cols-2'>
                    {Object.entries(record)
                      .filter(
                        ([key]) =>
                          ![
                            'id',
                            'deviceId',
                            'createdById',
                            'requesterId',
                            'handledById',
                            'lifecycleVersion',
                          ].includes(key),
                      )
                      .map(([key, value]) => (
                        <div
                          className='grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 border-b pb-3 text-sm'
                          key={key}
                        >
                          <dt className='text-muted-foreground'>
                            {t('equipment.fields.' + key)}
                          </dt>
                          <dd className='min-w-0 break-words'>
                            {key === 'status' ? (
                              <Status value={value} />
                            ) : [
                                'reason',
                                'description',
                                'resolution',
                              ].includes(key) ? (
                              <LongText>{String(value || '—')}</LongText>
                            ) : key === 'kind' ? (
                              t('equipment.transitions.' + value)
                            ) : key === 'locationId' ? (
                              refs.data?.data.equipmentLocations?.find(
                                (r) => r.id === value,
                              )?.name || '—'
                            ) : (
                              <Display value={value} />
                            )}
                          </dd>
                        </div>
                      ))}
                  </dl>
                  {record.deviceId && (
                    <Button
                      variant='link'
                      nativeButton={false}
                      render={
                        <Link
                          to={{
                            pathname: 'asset/' + record.deviceId,
                            search: location.search,
                          }}
                        />
                      }
                    >
                      {t('equipment.fields.deviceId')}
                    </Button>
                  )}
                </CardContent>
              </Card>
              {kind === 'stocktakes' && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('equipment.observations')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      pagination={false}
                      data={result.data?.data.items || []}
                      columns={[
                        {
                          accessorKey: 'deviceId',
                          header: t('equipment.fields.deviceId'),
                          cell: ({ row }) => (
                            <Link
                              className='text-primary hover:underline'
                              to={{
                                pathname: 'asset/' + row.original.deviceId,
                                search: location.search,
                              }}
                            >
                              {String(row.original.deviceId).slice(0, 8)}
                            </Link>
                          ),
                        },
                        {
                          accessorKey: 'expectedLocationId',
                          header: t('equipment.fields.expectedLocationId'),
                          cell: ({ getValue }) =>
                            refs.data?.data.equipmentLocations?.find(
                              (r) => r.id === getValue(),
                            )?.name || '—',
                        },
                        {
                          accessorKey: 'condition',
                          header: t('equipment.fields.condition'),
                          cell: ({ getValue }) =>
                            getValue()
                              ? t('equipment.states.' + getValue<string>())
                              : '—',
                        },
                        {
                          accessorKey: 'resolved',
                          header: t('equipment.fields.resolved'),
                          cell: ({ getValue }) => (getValue() ? '✓' : '—'),
                        },
                        {
                          id: 'observe',
                          header: '',
                          cell: ({ row }) =>
                            can && !completed ? (
                              <Button
                                size='sm'
                                variant='outline'
                                nativeButton={false}
                                render={
                                  <Link
                                    to={{
                                      pathname: 'observe/' + row.original.id,
                                      search: location.search,
                                    }}
                                  />
                                }
                              >
                                {t('equipment.observe')}
                              </Button>
                            ) : null,
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </PageContainer>
      </RouteChildPage>
      <Outlet />
    </>
  );
}
export function TransactionForm({
  kind,
  handling = false,
  observation = false,
}: {
  kind: Kind;
  handling?: boolean;
  observation?: boolean;
}) {
  const { id, itemId, assetId } = useParams();
  const result = useEquipment<AssetView>(
    handling || observation ? kind + '/' + id : null,
  );
  const existing = result.data?.data.record;
  const refs = useReferences();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const write = useEquipmentWrite();
  const [values, setValues] = useState<Record<string, string>>({
    deviceId: assetId || '',
    kind: kind === 'requests' ? 'issue' : 'maintenance',
    decision: 'complete',
    condition: 'good',
    resolved: 'false',
    cost: '0',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [dirty, setDirty] = useState(false);
  const guard = useFormGuard(dirty, busy);
  const item = result.data?.data.items?.find((r) => r.id === itemId);
  const [loadedItem, setLoadedItem] = useState<string>();
  if (item && loadedItem !== item.id) {
    setLoadedItem(item.id);
    setValues((old) => ({
      ...old,
      actualLocationId: String(
        item.actualLocationId || item.expectedLocationId || '',
      ),
      condition: String(item.condition || 'good'),
      resolved: String(item.resolved ?? false),
      note: String(item.note || ''),
    }));
  }
  const choices = (name: string) =>
    (refs.data?.data[name] || []).map((row) => ({
      value: row.id,
      label: String(row.name),
    }));
  let fields: FormField[];
  if (observation)
    fields = [
      {
        key: 'actualLocationId',
        type: 'select',
        required: true,
        options: choices('equipmentLocations'),
      },
      {
        key: 'condition',
        type: 'select',
        required: true,
        options: ['good', 'damaged', 'missing'].map((v) => ({
          value: v,
          label: t('equipment.states.' + v),
        })),
      },
      {
        key: 'resolved',
        type: 'select',
        required: true,
        options: [
          { value: 'false', label: t('equipment.unresolved') },
          { value: 'true', label: t('equipment.resolved') },
        ],
      },
      { key: 'note', type: 'textarea' },
    ];
  else if (handling && kind === 'requests')
    fields = [
      {
        key: 'decision',
        type: 'select',
        required: true,
        options: ['complete', 'reject'].map((v) => ({
          value: v,
          label: t('equipment.' + (v === 'complete' ? 'confirm' : 'reject')),
        })),
      },
      { key: 'resolution', type: 'textarea', required: true },
      ...(existing?.kind === 'transfer' && values.decision === 'complete'
        ? [
            {
              key: 'departmentId',
              type: 'select' as const,
              required: true,
              options: choices('equipmentDepartments'),
            },
            {
              key: 'locationId',
              type: 'select' as const,
              required: true,
              options: choices('equipmentLocations'),
            },
            {
              key: 'custodianId',
              type: 'select' as const,
              required: false,
              options: choices('users'),
            },
          ]
        : []),
    ];
  else if (handling && kind === 'maintenance')
    fields = [
      { key: 'resolution', type: 'textarea', required: true },
      { key: 'cost', type: 'number', required: true },
    ];
  else if (handling) fields = [];
  else if (kind === 'stocktakes')
    fields = [
      { key: 'name', required: true },
      {
        key: 'locationId',
        type: 'select',
        required: true,
        options: choices('equipmentLocations'),
      },
    ];
  else
    fields = [
      {
        key: 'deviceId',
        type: 'asset',
        required: true,
        disabled: !!assetId,
      },
      {
        key: 'kind',
        type: 'select',
        required: true,
        options: (kind === 'requests'
          ? ['issue', 'return', 'borrow', 'transfer', 'repair']
          : ['repair', 'maintenance']
        ).map((v) => ({ value: v, label: t('equipment.transitions.' + v) })),
      },
      ...(kind === 'requests' && values.kind === 'borrow'
        ? [{ key: 'dueDate', type: 'date' as const, required: true }]
        : []),
      {
        key: kind === 'requests' ? 'reason' : 'description',
        type: 'textarea',
        required: true,
      },
    ];
  const title = t(
    'equipment.' +
      (observation
        ? 'observe'
        : handling
          ? kind === 'requests'
            ? 'handle'
            : 'complete'
          : kind === 'requests'
            ? 'newRequest'
            : kind === 'maintenance'
              ? 'newMaintenance'
              : 'newStocktake'),
  );
  const formId = 'equipment-transaction-form';
  const closePath = '..';
  async function submit(e: FormEvent) {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.key]);
    if (missing) {
      document.getElementById('eq-' + missing.key)?.focus();
      setError(
        new RequiredFieldError(
          typeof missing === 'string' ? missing : missing.key,
        ),
      );
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const payload: Record<string, unknown> = Object.fromEntries(
        fields.map((f) => [f.key, values[f.key] || '']),
      );
      let path = kind;
      let method: 'POST' | 'PUT' = 'POST';
      if (handling) {
        path += '/' + id + '/' + (kind === 'requests' ? 'handle' : 'complete');
        payload.expectVersion = existing?.lifecycleVersion;
      }
      if (observation) {
        path += '/' + id + '/items/' + itemId;
        method = 'PUT';
        payload.expectVersion = existing?.lifecycleVersion;
        payload.resolved = values.resolved === 'true';
      }
      const saved = await write<Row>(path, payload, method);
      guard.allowLeave();
      toast.add({
        title: t('equipment.saved', { name: title }),
        type: 'success',
      });
      await navigate(
        {
          pathname:
            handling || observation
              ? closePath
              : assetId
                ? '..'
                : '../' + saved.id,
          search: location.search,
        },
        { relative: 'route', replace: true },
      );
    } catch (err) {
      setError(err);
      focusInvalid(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <RouteDialog
      title={title}
      description={t(
        'equipment.' +
          (observation
            ? 'resolutionHint'
            : kind === 'requests'
              ? 'requestHint'
              : kind === 'maintenance'
                ? 'maintenanceHint'
                : 'stocktakeHint'),
      )}
      className='max-w-lg'
      closeTo={{ pathname: closePath, search: location.search }}
      beforeClose={guard.beforeClose}
      footer={
        <>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() =>
              void navigate(
                { pathname: closePath, search: location.search },
                { relative: 'route' },
              )
            }
          >
            {t('equipment.cancel')}
          </Button>
          <Button
            form={formId}
            type='submit'
            disabled={busy || ((handling || observation) && !existing)}
          >
            {t('equipment.confirm')}
          </Button>
        </>
      }
    >
      <LoadState
        loading={(handling || observation) && result.isPending}
        error={result.error}
      />
      {item && (
        <p className='mb-4 text-sm text-muted-foreground'>
          {t('equipment.fields.expectedStatus')}:{' '}
          {t('equipment.states.' + item.expectedStatus)}
        </p>
      )}
      <form className='space-y-4' id={formId} onSubmit={(e) => void submit(e)}>
        <ErrorNotice error={error} />
        <FormFields
          error={error}
          fields={fields}
          values={values}
          setValue={(k, v) => {
            setDirty(true);
            setValues((old) => ({ ...old, [k]: v }));
          }}
          disabled={busy}
        />
      </form>
      {guard.guard}
    </RouteDialog>
  );
}
