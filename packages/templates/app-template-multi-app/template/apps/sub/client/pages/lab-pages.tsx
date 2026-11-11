import { Loading } from '#components/loading';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { DataTable } from '#components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '#components/ui/alert-dialog';
import { useId, useState, type ReactElement } from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { RouteDialog } from '#components/route-dialog';
import { FeedbackForm } from '#components/feedback-form';
import {
  useLabData,
  useLabWrite,
  errorKey,
  isTerminalError,
  type LabRecord,
  type Settings,
  type Summary,
} from './lab-data.js';
export function Feedback({
  error,
}: {
  readonly error?: unknown;
}): ReactElement {
  const { t } = useTranslation();
  if (!error) return <Loading label={t('lab.loading')} className='p-4' />;
  return (
    <p role='alert' className='p-4 text-sm text-muted-foreground'>
      {t(errorKey(error))}
    </p>
  );
}
export function Overview(): ReactElement {
  const { t } = useTranslation(),
    request = useLabData<{ data: Summary }>('lab/summary'),
    value = request.data?.data;
  return (
    <PageContainer>
      <PageHeader
        title={t('lab.overview')}
        description={t('lab.description')}
        actions={
          !isTerminalError(request.error) ? (
            <Button variant='outline' onClick={request.reload}>
              <RefreshCw />
              {t('lab.refresh')}
            </Button>
          ) : null
        }
      />
      {!value || request.error ? (
        <Feedback error={request.error} />
      ) : (
        <>
          <div className='grid gap-4 sm:grid-cols-3'>
            {[
              [t('lab.total'), value.records.meta.total],
              [t('lab.version'), value.version],
              [t('lab.manager'), value.settings.manager || '—'],
            ].map(([label, count]) => (
              <Card key={String(label)}>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>{label}</p>
                  <p className='mt-2 text-2xl font-semibold'>{count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('lab.recent')}</CardTitle>
            </CardHeader>
            <CardContent>
              {value.records.data.length ? (
                value.records.data.map((row) => (
                  <div
                    className='flex justify-between gap-3 border-b border-border py-3'
                    key={row.id}
                  >
                    <span className='truncate'>{row.name}</span>
                    <span className='text-muted-foreground'>
                      {row.location}
                    </span>
                  </div>
                ))
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('lab.empty')}
                </p>
              )}
              <Button
                className='mt-4'
                variant='outline'
                nativeButton={false}
                render={<Link to='/records' />}
              >
                {t('lab.records')}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
export function Records(): ReactElement {
  const access = useCan({
    resource: { type: 'composite', id: 'lab' },
    action: 'edit',
  });
  const { t, i18n } = useTranslation(),
    [params, setParams] = useSearchParams(),
    location = useLocation(),
    [committedLocation, setCommittedLocation] = useState(location),
    q = params.get('q') ?? '',
    [draft, setDraft] = useState(q),
    page = Math.max(1, Number(params.get('page')) || 1),
    request = useLabData<{ data: LabRecord[]; meta: { total: number } }>(
      `lab/records?${new URLSearchParams({ search: q, offset: String((page - 1) * 10), limit: '10', direction: params.get('direction') === 'asc' ? 'asc' : 'desc' })}`,
    ),
    rows = request.data?.data;
  // A history traversal can return before a pending search commits; track the location, not only q.
  if (committedLocation !== location) {
    setCommittedLocation(location);
    setDraft(q);
  }
  const columns: ColumnDef<LabRecord>[] = [
    {
      accessorKey: 'name',
      header: t('lab.name'),
      cell: ({ row }) => (
        <div className='max-w-64'>
          <p className='truncate font-medium' title={row.original.name}>
            {row.original.name}
          </p>
          <p
            className='truncate text-xs text-muted-foreground'
            title={row.original.detail}
          >
            {row.original.detail || '—'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: t('lab.location'),
      cell: ({ row }) => (
        <span className='block max-w-48 truncate' title={row.original.location}>
          {row.original.location}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('lab.createdAt'),
      enableSorting: true,
      cell: ({ row }) =>
        new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
          new Date(row.original.createdAt),
        ),
    },
    {
      id: 'actions',
      header: t('lab.actions'),
      cell: ({ row }) =>
        access.can ? (
          <Button
            variant='ghost'
            nativeButton={false}
            render={
              <Link
                to={{
                  pathname: `${row.original.id}/delete`,
                  search: location.search,
                }}
              />
            }
          >
            {t('lab.delete')}
          </Button>
        ) : null,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t('lab.records')}
        description={t('lab.recordsDescription')}
        actions={
          <>
            {access.can && rows && !request.error ? (
              <Button
                nativeButton={false}
                render={
                  <Link to={{ pathname: 'new', search: location.search }} />
                }
              >
                <Plus />
                {t('lab.create')}
              </Button>
            ) : null}
            {!isTerminalError(request.error) ? (
              <Button variant='outline' onClick={request.reload}>
                <RefreshCw />
                {t('lab.refresh')}
              </Button>
            ) : null}
          </>
        }
      />
      {!isTerminalError(request.error) ? (
        <form
          className='flex flex-wrap gap-2'
          onSubmit={(e) => {
            e.preventDefault();
            setParams(draft ? { q: draft } : {});
          }}
        >
          <Input
            key={q}
            autoComplete='off'
            id='lab-records-search'
            className='w-full sm:w-80'
            aria-label={t('lab.search')}
            placeholder={t('lab.search')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button variant='outline' type='submit'>
            <Search />
            {t('lab.searchAction')}
          </Button>
          {q ? (
            <Button
              variant='ghost'
              onClick={() => {
                setParams({});
              }}
            >
              {t('lab.clear')}
            </Button>
          ) : null}
        </form>
      ) : null}
      {request.error || !rows ? (
        <Feedback error={request.error} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowCount={request.data?.meta.total ?? 0}
            pagination
            manualPagination
            paginationState={{ pageIndex: page - 1, pageSize: 10 }}
            pageSizeOptions={[10]}
            onPaginationChange={(updater) => {
              const next =
                typeof updater === 'function'
                  ? updater({ pageIndex: page - 1, pageSize: 10 })
                  : updater;
              const search = new URLSearchParams(params);
              search.set('page', String(next.pageIndex + 1));
              setParams(search);
            }}
            manualSorting
            sortingState={[
              { id: 'createdAt', desc: params.get('direction') !== 'asc' },
            ]}
            onSortingChange={(updater) => {
              const current = [
                { id: 'createdAt', desc: params.get('direction') !== 'asc' },
              ];
              const next =
                typeof updater === 'function' ? updater(current) : updater;
              const search = new URLSearchParams(params);
              search.set('direction', next[0]?.desc === false ? 'asc' : 'desc');
              search.delete('page');
              setParams(search);
            }}
            listState={rows.length ? 'ready' : q ? 'no-results' : 'empty'}
            loading={request.loading}
          />
        </>
      )}
      <Outlet />
    </PageContainer>
  );
}
export function CreateRecord(): ReactElement {
  const access = useCan({
    resource: { type: 'composite', id: 'lab' },
    action: 'edit',
  });
  const { t } = useTranslation(),
    id = useId(),
    navigate = useNavigate(),
    location = useLocation(),
    write = useLabWrite('create'),
    [error, setError] = useState<unknown>(),
    [values, setValues] = useState({ name: '', detail: '', location: '' });
  async function submit(): Promise<void> {
    try {
      setError(undefined);
      if (await write.run('lab/records', 'POST', values))
        await navigate({ pathname: '..', search: location.search });
    } catch (e) {
      setError(e);
    }
  }
  return (
    <RouteDialog
      title={t('lab.create')}
      beforeClose={() => !write.busy && !write.pending}
      footer={
        <>
          <Button
            variant='outline'
            disabled={write.busy || write.pending}
            nativeButton={false}
            render={<Link to={{ pathname: '..', search: location.search }} />}
          >
            {t('lab.cancel')}
          </Button>
          <Button type='submit' form={id} disabled={write.busy || !access.can}>
            {t(
              write.busy
                ? 'lab.saving'
                : write.pending
                  ? 'lab.retry'
                  : 'lab.submit',
            )}
          </Button>
        </>
      }
    >
      <FeedbackForm
        className='flex flex-col gap-4'
        id={id}
        onSubmit={submit}
        error={error}
        submitting={write.busy}
      >
        {write.pending ? <p role='status'>{t('lab.pending')}</p> : null}
        {(['name', 'detail', 'location'] as const).map((key) => (
          <div key={key} className='space-y-2'>
            <Label htmlFor={`${id}-${key}`}>
              {t(`lab.${key}`)}
              {key !== 'detail' ? ' *' : ''}
            </Label>
            <Input
              id={`${id}-${key}`}
              name={key}
              disabled={write.busy || write.pending || !access.can}
              required={key !== 'detail'}
              maxLength={key === 'detail' ? 240 : 120}
              value={values[key]}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
          </div>
        ))}
      </FeedbackForm>
    </RouteDialog>
  );
}
export function DeleteRecord(): ReactElement {
  const { t } = useTranslation(),
    { id } = useParams(),
    request = useLabData<{ data: LabRecord }>(`lab/records/${id}`),
    write = useLabWrite(`delete:${id}`),
    navigate = useNavigate(),
    location = useLocation(),
    [error, setError] = useState<unknown>();
  async function remove(): Promise<void> {
    try {
      setError(undefined);
      if (await write.run(`lab/records/${id}`, 'DELETE', { id }))
        await navigate({ pathname: '..', search: location.search });
    } catch (e) {
      setError(e);
    }
  }
  async function close(): Promise<void> {
    if (!write.busy && !write.pending)
      await navigate({ pathname: '..', search: location.search });
  }
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) close().catch(setError);
      }}
    >
      <AlertDialogContent
        finalFocus={() => document.getElementById('lab-records-search')}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('lab.deleteTitle', { name: request.data?.data.name ?? '…' })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('lab.deleteWarning')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!request.data || request.error ? (
          <Feedback error={request.error} />
        ) : null}
        {error ? <Feedback error={error} /> : null}
        {write.pending ? <p role='status'>{t('lab.pending')}</p> : null}
        <AlertDialogFooter>
          <Button
            variant='outline'
            disabled={write.busy || write.pending}
            onClick={() => {
              close().catch(setError);
            }}
          >
            {t('lab.cancel')}
          </Button>
          <Button
            variant='destructive'
            onClick={() => {
              remove().catch(setError);
            }}
            disabled={!request.data || !!request.error || write.busy}
          >
            {t(write.pending ? 'lab.retry' : 'lab.delete')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function SettingsPage(): ReactElement {
  const { t } = useTranslation(),
    request = useLabData<{ data: Settings }>('lab/settings');
  return (
    <PageContainer>
      <PageHeader
        title={t('lab.settings')}
        description={t('lab.settingsDescription')}
        actions={
          !isTerminalError(request.error) ? (
            <Button variant='outline' onClick={request.reload}>
              {t('lab.refresh')}
            </Button>
          ) : null
        }
      />
      {!request.data || request.error ? (
        <Feedback error={request.error} />
      ) : (
        <SettingsEditor
          key={request.data.data.revision}
          initial={request.data.data}
        />
      )}
    </PageContainer>
  );
}
function SettingsEditor({
  initial,
}: {
  readonly initial: Settings;
}): ReactElement {
  const { t } = useTranslation(),
    [values, setValues] = useState(initial),
    [error, setError] = useState<unknown>(),
    write = useLabWrite('settings');
  async function save(): Promise<void> {
    try {
      setError(undefined);
      await write.run('lab/settings', 'PUT', {
        manager: values.manager,
        location: values.location,
        revision: values.revision,
      });
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('lab.basicSettings')}</CardTitle>
      </CardHeader>
      <CardContent>
        <FeedbackForm
          className='flex flex-col gap-4'
          onSubmit={save}
          error={error}
          submitting={write.busy}
        >
          {write.pending ? <p role='status'>{t('lab.pending')}</p> : null}
          {(['manager', 'location'] as const).map((key) => (
            <div className='space-y-2' key={key}>
              <Label htmlFor={key}>{t(`lab.${key}`)}</Label>
              <Input
                id={key}
                name={key}
                disabled={write.busy || write.pending}
                value={values[key]}
                maxLength={key === 'manager' ? 80 : 120}
                onChange={(e) =>
                  setValues({ ...values, [key]: e.target.value })
                }
              />
            </div>
          ))}
          <Button type='submit' disabled={write.busy}>
            {t(
              write.busy
                ? 'lab.saving'
                : write.pending
                  ? 'lab.retry'
                  : 'lab.save',
            )}
          </Button>
        </FeedbackForm>
      </CardContent>
    </Card>
  );
}
