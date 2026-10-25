import { RequiredFieldError, focusInvalid } from './validation.js';
import { downloadCsv } from './download.js';
import { useState, useCallback, type FormEvent } from 'react';
import {
  Link,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useApiClient, createUuid } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  Plus,
  RefreshCw,
  MoreHorizontal,
  FileDown,
  FileUp,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';
import { RouteDialog } from '#components/route-dialog';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#components/ui/dropdown-menu';
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
  type Envelope,
} from './api.js';
import { useFormGuard } from './form-guard.js';
import {
  LoadState,
  Status,
  Display,
  SearchBox,
  Choice,
  FormFields,
  ErrorNotice,
  type FormField,
} from './shared.js';
export function AssetList({ mine = false }: { mine?: boolean }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const caps = useCapabilities();
  const refs = useReferences();
  const api = useApiClient();
  const [exportError, setExportError] = useState<unknown>();
  const [exporting, setExporting] = useState(false);
  const tableState = useTableUrlState({
    defaultPageSize: 20,
    sortColumns: [
      'statusChangedAt',
      'assetNumber',
      'name',
      'purchaseCost',
      'createdAt',
    ],
  });
  const query = new URLSearchParams(params);
  query.set('page', String(tableState.paginationState.pageIndex + 1));
  query.set('pageSize', String(tableState.paginationState.pageSize));
  if (mine) query.set('mine', 'true');
  const result = useEquipment<Row[]>('assets?' + query.toString());
  const setFilter = useCallback(
    (key: string, value: string) =>
      setParams(
        (old) => {
          const next = new URLSearchParams(old);
          next.delete('page');
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const can = caps.data?.data || {};
  const records = result.data?.data || [];
  const total = result.data?.meta?.total || 0;
  const filtered =
    !!params.get('q') ||
    !!params.get('status') ||
    !!params.get('categoryId') ||
    !!params.get('locationId') ||
    !!params.get('exception');
  const label = (name: string, id: unknown) =>
    refs.data?.data[name]?.find((r) => r.id === id)?.name || '—';
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: 'assetNumber',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('equipment.fields.assetNumber')}
        />
      ),
      cell: ({ row }) => (
        <Link
          className='font-medium text-primary hover:underline'
          to={{
            pathname: (mine ? 'asset/' : '') + row.original.id,
            search: location.search,
          }}
        >
          {String(row.original.assetNumber)}
        </Link>
      ),
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('equipment.fields.name')}
        />
      ),
      cell: ({ row }) => (
        <LongTextPreview
          label={t('equipment.fields.name')}
          lines={1}
          className='max-w-xs'
        >
          {row.original.name}
        </LongTextPreview>
      ),
    },
    {
      accessorKey: 'categoryId',
      header: t('equipment.fields.categoryId'),
      enableSorting: false,
      cell: ({ row }) => label('equipmentCategories', row.original.categoryId),
    },
    {
      accessorKey: 'locationId',
      header: t('equipment.fields.locationId'),
      enableSorting: false,
      cell: ({ row }) => label('equipmentLocations', row.original.locationId),
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
      cell: ({ row }) => <Display value={row.original.statusChangedAt} />,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='ghost'
                size='icon'
                aria-label={t('equipment.menu', { name: row.original.name })}
              />
            }
          >
            <MoreHorizontal aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-auto min-w-40'>
            <DropdownMenuItem
              nativeButton={false}
              render={
                <Link
                  to={{
                    pathname: (mine ? 'asset/' : '') + row.original.id,
                    search: location.search,
                  }}
                />
              }
            >
              {t('equipment.details')}
            </DropdownMenuItem>
            {can['assets.operate'] && (
              <DropdownMenuItem
                nativeButton={false}
                render={
                  <Link
                    to={{
                      pathname: 'edit/' + row.original.id,
                      search: location.search,
                    }}
                  />
                }
              >
                {t('equipment.edit')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  const add =
    can['assets.create'] && !mine ? (
      <Button
        nativeButton={false}
        render={<Link to={{ pathname: 'new', search: location.search }} />}
      >
        <Plus aria-hidden />
        {t('equipment.create')}
      </Button>
    ) : null;
  async function exportRows() {
    setExporting(true);
    setExportError(undefined);
    try {
      const response = await api.request<Envelope<{ csv: string }>>({
        path: 'equipment/export?' + query.toString(),
      });
      downloadCsv(response.data.csv, 'equipment.csv');
    } catch (error) {
      setExportError(error);
    } finally {
      setExporting(false);
    }
  }
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('equipment.' + (mine ? 'myEquipment' : 'equipment'))}
          description={t('equipment.scopeHint')}
          actions={
            <>
              {!result.isPending && (total > 0 || filtered) ? add : null}
              {!mine && can['assets.import'] && (
                <Button
                  variant='outline'
                  nativeButton={false}
                  render={
                    <Link
                      to={{ pathname: 'import', search: location.search }}
                    />
                  }
                >
                  <FileUp aria-hidden />
                  {t('equipment.import')}
                </Button>
              )}
              {can['assets.export'] && (
                <Button
                  variant='outline'
                  disabled={exporting}
                  onClick={() => void exportRows()}
                >
                  <FileDown aria-hidden />
                  {t('equipment.export')}
                </Button>
              )}
              <Button
                variant='outline'
                disabled={result.isFetching}
                onClick={() => void result.refetch()}
              >
                <RefreshCw aria-hidden />
                {t('equipment.refresh')}
              </Button>
            </>
          }
        />
        <div className='flex flex-wrap gap-2'>
          <SearchBox
            value={params.get('q') || ''}
            onSearch={(v) => setFilter('q', v)}
          />
          <div className='w-full sm:w-40'>
            <Choice
              id='filter-status'
              label={t('equipment.fields.status')}
              value={params.get('status') || 'all'}
              onChange={(v) => setFilter('status', v === 'all' ? '' : v)}
              options={[
                'all',
                'idle',
                'issued',
                'loaned',
                'maintenance',
                'scrapped',
              ].map((v) => ({
                value: v,
                label: t(
                  v === 'all' ? 'equipment.all' : 'equipment.states.' + v,
                ),
              }))}
            />
          </div>
          {(['categoryId', 'locationId'] as const).map((key) => (
            <div className='w-full sm:w-44' key={key}>
              <Choice
                id={'filter-' + key}
                label={t('equipment.fields.' + key)}
                value={params.get(key) || 'all'}
                onChange={(v) => setFilter(key, v === 'all' ? '' : v)}
                options={[
                  {
                    value: 'all',
                    label:
                      t('equipment.fields.' + key) + ': ' + t('equipment.all'),
                  },
                  ...(
                    refs.data?.data[
                      key === 'categoryId'
                        ? 'equipmentCategories'
                        : 'equipmentLocations'
                    ] || []
                  ).map((r) => ({ value: r.id, label: String(r.name) })),
                ]}
              />
            </div>
          ))}
          {filtered && !!result.data?.data.length && (
            <Button variant='ghost' onClick={() => setParams({})}>
              {t('equipment.clear')}
            </Button>
          )}
        </div>
        <ErrorNotice error={exportError} />
        <LoadState
          loading={result.isPending}
          error={result.error}
          retry={() => void result.refetch()}
          empty={
            !result.isPending && !result.error && !records.length && !filtered
          }
          action={add}
        />
        {!result.isPending &&
          !result.error &&
          (records.length > 0 || filtered) && (
            <DataTable
              columns={columns}
              data={records}
              manualPagination
              rowCount={total}
              {...tableState}
              manualSorting
              loading={result.isFetching}
              showSelectedCount={false}
              emptyMessage={
                <div className='space-y-3 py-6'>
                  <p>{t('equipment.noResults')}</p>
                  <Button variant='outline' onClick={() => setParams({})}>
                    {t('equipment.clear')}
                  </Button>
                </div>
              }
            />
          )}
      </PageContainer>
      <Outlet />
    </>
  );
}
export function AssetDetail() {
  const { assetId: id = '' } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const result = useEquipment<AssetView>('assets/' + id);
  const caps = useCapabilities();
  const refs = useReferences();
  const { session } = useAuthentication();
  const record = result.data?.data.record;
  const can = caps.data?.data || {};
  const label = (key: string, value: unknown) => {
    const dict =
      key === 'categoryId'
        ? 'equipmentCategories'
        : key === 'locationId'
          ? 'equipmentLocations'
          : key === 'departmentId'
            ? 'equipmentDepartments'
            : key === 'custodianId'
              ? 'users'
              : null;
    if (dict) {
      const found = refs.data?.data[dict]?.find((r) => r.id === value);
      return (
        found?.name || (value === session?.user.id ? t('equipment.me') : '—')
      );
    }
    return <Display value={value} />;
  };
  const actions =
    result.data?.data.available?.filter((a) =>
      [
        'issue',
        'borrow',
        'return',
        'transferIdle',
        'transferIssued',
        'transferLoaned',
        'scrap',
      ].includes(a.name),
    ) || [];
  return (
    <>
      <RouteChildPage>
        <PageContainer className='mx-auto max-w-5xl'>
          <PageHeader
            title={record ? String(record.name) : t('equipment.details')}
            description={record ? String(record.assetNumber) : undefined}
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
                {record &&
                  can['assets.operate'] &&
                  record.status !== 'scrapped' && (
                    <Button
                      variant='outline'
                      nativeButton={false}
                      render={
                        <Link
                          to={{ pathname: 'edit', search: location.search }}
                        />
                      }
                    >
                      {t('equipment.edit')}
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
              <div className='flex flex-wrap items-center gap-2'>
                <Status value={record.status} />
                {can['assets.operate'] &&
                  actions.map((a) => (
                    <Button
                      key={a.name}
                      variant={a.name === 'scrap' ? 'destructive' : 'outline'}
                      disabled={!a.allowed}
                      title={
                        !a.allowed ? t('equipment.statusBlocked') : undefined
                      }
                      nativeButton={false}
                      render={
                        a.allowed ? (
                          <Link
                            to={{
                              pathname: 'action/' + a.name,
                              search: location.search,
                            }}
                          />
                        ) : undefined
                      }
                    >
                      {t('equipment.transitions.' + a.name)}
                    </Button>
                  ))}
                {can['requests.create'] && (
                  <Button
                    variant='outline'
                    nativeButton={false}
                    render={
                      <Link
                        to={{ pathname: 'request', search: location.search }}
                      />
                    }
                  >
                    {t('equipment.newRequest')}
                  </Button>
                )}
              </div>
              {[
                [
                  'details',
                  [
                    'assetNumber',
                    'name',
                    'serialNumber',
                    'model',
                    'manufacturer',
                    'categoryId',
                  ],
                ],
                [
                  'assignment',
                  [
                    'status',
                    'locationId',
                    'departmentId',
                    'custodianId',
                    'dueDate',
                    'nextMaintenanceAt',
                  ],
                ],
                ...(can['assets.inspect']
                  ? [
                      [
                        'procurement',
                        [
                          'purchaseDate',
                          'purchaseCost',
                          'vendor',
                          'warrantyUntil',
                          'notes',
                        ],
                      ],
                    ]
                  : []),
              ].map(([section, fields]) => (
                <Card key={String(section)}>
                  <CardHeader>
                    <CardTitle>{t('equipment.' + String(section))}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className='grid gap-4 sm:grid-cols-2'>
                      {(fields as string[]).map((key) => (
                        <div
                          key={key}
                          className='grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 border-b pb-3'
                        >
                          <dt className='text-sm text-muted-foreground'>
                            {t('equipment.fields.' + key)}
                          </dt>
                          <dd className='min-w-0 text-sm break-words'>
                            {key === 'status' ? (
                              <Status value={record[key]} />
                            ) : key === 'notes' ? (
                              <LongText>{String(record[key] || '—')}</LongText>
                            ) : (
                              label(key, record[key])
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              ))}
              {can['assets.inspect'] && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('equipment.history')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className='space-y-3'>
                      {result.data?.data.history?.transitions.map((entry) => (
                        <li
                          key={entry.id}
                          className='flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm'
                        >
                          <span>
                            {t('equipment.transitions.' + entry.transition)} ·{' '}
                            {t('equipment.states.' + entry.to)}
                          </span>
                          <span className='text-muted-foreground'>
                            <Display value={entry.at} />
                          </span>
                        </li>
                      ))}
                    </ol>
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
const assetKeys = [
  'assetNumber',
  'name',
  'serialNumber',
  'model',
  'manufacturer',
  'categoryId',
  'departmentId',
  'locationId',
  'purchaseDate',
  'purchaseCost',
  'vendor',
  'warrantyUntil',
  'nextMaintenanceAt',
  'notes',
];
export function AssetFormPage() {
  const { assetId: id } = useParams();
  const result = useEquipment<AssetView>(id ? 'assets/' + id : null);
  return (
    <RouteChildPage>
      {id && !result.data ? (
        <PageContainer>
          <LoadState
            loading={result.isPending}
            error={result.error}
            retry={() => void result.refetch()}
          />
        </PageContainer>
      ) : (
        <AssetForm
          key={id + ':' + String(result.data?.data.record.lifecycleVersion)}
          record={result.data?.data.record}
        />
      )}
    </RouteChildPage>
  );
}
function AssetForm({ record }: { record?: Row }) {
  const { t } = useTranslation();
  const refs = useReferences();
  const navigate = useNavigate();
  const location = useLocation();
  const write = useEquipmentWrite();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      assetKeys.map((key) => [
        key,
        String(record?.[key] ?? (key === 'purchaseCost' ? '0' : '')),
      ]),
    ),
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const guard = useFormGuard(dirty, busy);
  const fields: FormField[] = assetKeys.map((key) => ({
    key,
    required: [
      'assetNumber',
      'name',
      'categoryId',
      'departmentId',
      'locationId',
    ].includes(key),
    type: key.endsWith('Id')
      ? 'select'
      : key === 'notes'
        ? 'textarea'
        : key === 'purchaseCost'
          ? 'number'
          : ['purchaseDate', 'warrantyUntil', 'nextMaintenanceAt'].includes(key)
            ? 'date'
            : 'text',
    disabled:
      !!record &&
      record.status !== 'idle' &&
      ['departmentId', 'locationId'].includes(key),
    options: (
      refs.data?.data[
        key === 'categoryId'
          ? 'equipmentCategories'
          : key === 'departmentId'
            ? 'equipmentDepartments'
            : 'equipmentLocations'
      ] || []
    ).map((row) => ({ value: row.id, label: String(row.name) })),
  }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.key]);
    if (missing) {
      document.getElementById('eq-' + missing.key)?.focus();
      setError(new RequiredFieldError(missing.key));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const saved = await write<Row>(
        record ? 'assets/' + record.id : 'assets',
        {
          ...values,
          ...(record ? { expectVersion: record.lifecycleVersion } : {}),
        },
        record ? 'PATCH' : 'POST',
      );
      guard.allowLeave();
      toast.add({
        title: t('equipment.saved', { name: saved.name }),
        type: 'success',
      });
      await navigate(
        { pathname: record ? '..' : '../' + saved.id, search: location.search },
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
    <PageContainer className='mx-auto max-w-3xl'>
      <PageHeader
        title={t('equipment.' + (record ? 'edit' : 'create'))}
        description={t('equipment.description')}
      />
      <form onSubmit={(e) => void submit(e)} className='space-y-6'>
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
        <div className='flex justify-end gap-2 border-t pt-4'>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() =>
              void navigate(
                { pathname: '..', search: location.search },
                { relative: 'route' },
              )
            }
          >
            {t('equipment.cancel')}
          </Button>
          <Button type='submit' disabled={busy || refs.isPending}>
            {t('equipment.save')}
          </Button>
        </div>
      </form>
      {guard.guard}
    </PageContainer>
  );
}
export function AssetAction() {
  const { assetId: id = '', transition = '' } = useParams();
  const result = useEquipment<AssetView>('assets/' + id);
  const { t } = useTranslation();
  const refs = useReferences();
  const write = useEquipmentWrite();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const guard = useFormGuard(dirty, busy);
  const record = result.data?.data.record;
  const keys =
    transition === 'borrow'
      ? ['custodianId', 'dueDate']
      : transition === 'issue'
        ? ['custodianId']
        : transition.startsWith('transfer')
          ? [
              'departmentId',
              'locationId',
              ...(transition === 'transferIdle' ? [] : ['custodianId']),
            ]
          : transition === 'scrap'
            ? ['reason']
            : [];
  const fields: FormField[] = keys.map((key) => ({
    key,
    required: true,
    type: key === 'reason' ? 'textarea' : key === 'dueDate' ? 'date' : 'select',
    options: (
      refs.data?.data[
        key === 'custodianId'
          ? 'users'
          : key === 'departmentId'
            ? 'equipmentDepartments'
            : 'equipmentLocations'
      ] || []
    ).map((row) => ({ value: row.id, label: String(row.name) })),
  }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    const missing = keys.find((k) => !values[k]);
    if (missing) {
      document.getElementById('eq-' + missing)?.focus();
      setError(new RequiredFieldError(missing));
      return;
    }
    setBusy(true);
    try {
      await write('assets/' + id + '/fire', {
        transition,
        input: values,
        expectVersion: record?.lifecycleVersion,
        requestId: createUuid(),
      });
      guard.allowLeave();
      toast.add({
        title: t('equipment.saved', { name: record?.name }),
        type: 'success',
      });
      await navigate(
        { pathname: '..', search: location.search },
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
      className='max-w-lg'
      title={t('equipment.confirmTitle', {
        action: t('equipment.transitions.' + transition),
        name: record?.name || '',
      })}
      description={
        transition === 'scrap'
          ? t('equipment.scrapWarning')
          : t('equipment.description')
      }
      beforeClose={guard.beforeClose}
      closeTo={{ pathname: '..', search: location.search }}
      footer={
        <>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() =>
              void navigate(
                { pathname: '..', search: location.search },
                { relative: 'route' },
              )
            }
          >
            {t('equipment.cancel')}
          </Button>
          <Button
            variant={transition === 'scrap' ? 'destructive' : 'default'}
            form='equipment-action'
            type='submit'
            disabled={busy || !record}
          >
            {t('equipment.confirm')}
          </Button>
        </>
      }
    >
      <LoadState loading={result.isPending} error={result.error} />
      <form
        id='equipment-action'
        onSubmit={(e) => void submit(e)}
        className='space-y-5'
      >
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
