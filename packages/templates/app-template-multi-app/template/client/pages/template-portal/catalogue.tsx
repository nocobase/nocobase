import { ApplicationSources, ExternalAppsList } from './external-apps.js';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Outlet,
  useLocation,
  useResolvedPath,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { RecordLink } from '#components/record-link';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  Action,
  InstanceRuntime,
  MoreActions,
  State,
  TemplateVersion,
} from './management-ui.js';
import {
  usePortalData,
  refreshPortal,
  isTerminalError,
  type Row,
  type List,
} from './data.js';

function InstanceCount({ template }: { readonly template: Row }) {
  const { i18n } = useTranslation();
  const request = usePortalData<List>(
    `multiApp/instances?templateId=${encodeURIComponent(template.id)}&pageSize=1`,
  );
  return (
    <span className='tabular-nums'>
      {request.error || !request.data
        ? '—'
        : new Intl.NumberFormat(i18n.language).format(request.data.meta.total)}
    </span>
  );
}
function TemplateName({ id }: { readonly id?: string }) {
  const request = usePortalData<{ data: Row }>(`multiApp/templates/${id}`);
  return (
    <span className='block max-w-48 truncate' title={request.data?.data.name}>
      {request.error ? '—' : (request.data?.data.name ?? '—')}
    </span>
  );
}
export function Catalogue({
  kind = 'instances',
}: {
  readonly kind?: 'instances' | 'templates';
}) {
  const location = useLocation(),
    base = useResolvedPath('.').pathname;
  const tail = location.pathname.slice(base.length).replace(/^\//, '');
  // Lists stay mounted beneath their create dialog; details own their content and queries.
  if (tail && tail !== 'new' && tail !== 'create')
    return <Outlet context={{ reload: refreshPortal }} />;
  if (
    kind === 'instances' &&
    new URLSearchParams(location.search).get('source') === 'external'
  )
    return <ExternalAppsList />;
  return <CatalogueList kind={kind} />;
}
function CatalogueList({ kind }: { readonly kind: 'instances' | 'templates' }) {
  const { t } = useTranslation(),
    location = useLocation(),
    [params, setParams] = useSearchParams();
  const inactive = kind === 'templates' ? 'retired' : 'archived';
  const q = params.get('q') ?? '',
    status = params.get('status') === inactive ? inactive : 'active';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = [10, 20, 50].includes(Number(params.get('pageSize')))
    ? Number(params.get('pageSize'))
    : 10;
  const templateId = kind === 'instances' ? params.get('templateId') : null;
  const [draft, setDraft] = useState(q),
    [committedLocation, setCommittedLocation] = useState(location);
  if (committedLocation !== location) {
    setCommittedLocation(location);
    setDraft(q);
  }
  const query = new URLSearchParams({
    q,
    status,
    page: String(page),
    pageSize: String(pageSize),
    ...(templateId ? { templateId } : {}),
  });
  const request = usePortalData<List>(`multiApp/${kind}?${query}`, true);
  const rows = request.data?.data ?? [];
  const environments = usePortalData<List>(
    'releases/environments?pageSize=100',
  );
  const showEnvironment = (environments.data?.data.length ?? 0) > 1;
  const terminal = isTerminalError(request.error);
  const pendingOperation = rows.some((row) => !!row.operationId);
  useEffect(() => {
    if (!pendingOperation) return;
    const timer = window.setInterval(request.reload, 4000);
    return () => window.clearInterval(timer);
  }, [pendingOperation, request.reload]);

  function change(values: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    next.delete('page');
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next);
  }
  useEffect(() => {
    if (request.loading || request.error || !request.data) return;
    const last = Math.max(1, Math.ceil(request.data.meta.total / pageSize));
    if (page > last)
      setParams(
        (old) => {
          const next = new URLSearchParams(old);
          next.set('page', String(last));
          return next;
        },
        { replace: true },
      );
  }, [request.loading, request.error, request.data, page, pageSize, setParams]);
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: 'name',
        header: t('portal.name'),
        cell: ({ row: { original: row } }) => (
          <div className='flex min-w-40 flex-col gap-1 py-1'>
            <RecordLink
              className='block max-w-64 truncate'
              title={row.name}
              to={{
                pathname: `/multi-app/${kind}/${row.id}`,
                search: location.search,
              }}
            >
              {row.name}
            </RecordLink>
            <span
              className='max-w-64 truncate text-xs text-muted-foreground'
              title={kind === 'templates' ? row.description : row.id}
            >
              {kind === 'templates' ? row.description : row.id}
            </span>
          </div>
        ),
      },
      ...(kind === 'instances'
        ? ([
            {
              id: 'status',
              header: t('portal.runtimeState'),
              cell: ({ row }) => (
                <InstanceRuntime row={row.original} part='status' />
              ),
            },
            {
              id: 'template',
              header: t('portal.template'),
              cell: ({ row }) => <TemplateName id={row.original.templateId} />,
            },
            {
              id: 'version',
              header: t('portal.currentVersion'),
              cell: ({ row }) => (
                <InstanceRuntime row={row.original} part='version' />
              ),
            },
          ] satisfies ColumnDef<Row>[])
        : ([
            {
              id: 'status',
              header: t('portal.catalogueState'),
              cell: ({ row }) => <State value={row.original.status} />,
            },
            {
              id: 'version',
              header: t('portal.latest'),
              cell: ({ row }) => <TemplateVersion template={row.original} />,
            },
            {
              id: 'count',
              header: () => (
                <div className='text-right'>{t('portal.instanceCount')}</div>
              ),
              cell: ({ row }) => (
                <div className='text-right'>
                  <InstanceCount template={row.original} />
                </div>
              ),
            },
          ] satisfies ColumnDef<Row>[])),
      ...(kind === 'instances' && showEnvironment
        ? ([
            {
              id: 'environment',
              header: t('portal.environments'),
              cell: ({ row }) =>
                environments.data?.data.find(
                  (env) => env.id === row.original.environmentId,
                )?.name ??
                row.original.environmentId ??
                '—',
            },
          ] satisfies ColumnDef<Row>[])
        : []),
      {
        id: 'actions',
        header: () => <span className='sr-only'>{t('portal.actions')}</span>,
        cell: ({ row }) =>
          kind === 'instances' ? (
            <InstanceRuntime row={row.original} part='actions' />
          ) : (
            <div className='flex items-center justify-end gap-1'>
              <MoreActions kind='templates' row={row.original} />
            </div>
          ),
      },
    ],
    [kind, location.search, showEnvironment, environments.data, t],
  );
  const ListContent = kind === 'instances' ? ApplicationSources : Fragment;
  const state = isTerminalError(request.error)
    ? request.error.status === 401
      ? 'unauthenticated'
      : request.error.status === 403
        ? 'forbidden'
        : 'failed'
    : request.error
      ? rows.length
        ? 'refresh-failed'
        : 'failed'
      : !request.data
        ? 'loading'
        : rows.length
          ? 'ready'
          : q
            ? 'no-results'
            : 'empty';
  return (
    <PageContainer>
      <PageHeader
        title={t(
          kind === 'templates' ? 'portal.templates' : 'portal.management',
        )}
        description={t(
          kind === 'templates'
            ? 'portal.templateDescription'
            : 'portal.appsDescription',
        )}
        actions={
          <>
            {request.data && !terminal && (
              <Action kind={kind} action='new' primary />
            )}
          </>
        }
      />
      <ListContent>
        {!terminal && (
          <form
            className='flex flex-wrap items-center gap-2'
            onSubmit={(event) => {
              event.preventDefault();
              change({ q: draft || undefined });
            }}
          >
            <Input
              aria-label={t('portal.search')}
              name='q'
              autoComplete='off'
              placeholder={t(
                kind === 'templates'
                  ? 'portal.searchTemplates'
                  : 'portal.search',
              )}
              className='w-full sm:w-72'
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button variant='outline' type='submit'>
              <Search aria-hidden='true' />
              {t('portal.searchAction')}
            </Button>
            <Select
              value={status}
              onValueChange={(value) => {
                if (value)
                  change({ status: value === 'active' ? undefined : value });
              }}
              items={[
                { value: 'active', label: t('portal.activeFilter') },
                { value: inactive, label: t(`portal.states.${inactive}`) },
              ]}
            >
              <SelectTrigger
                className='w-full sm:w-40'
                aria-label={t('portal.catalogueState')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value='active'>
                    {t('portal.activeFilter')}
                  </SelectItem>
                  <SelectItem value={inactive}>
                    {t(`portal.states.${inactive}`)}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {(q || status === inactive || templateId) && (
              <Button
                type='button'
                variant='ghost'
                onClick={() =>
                  change({
                    q: undefined,
                    status: undefined,
                    templateId: undefined,
                  })
                }
              >
                {t('portal.clearFilters')}
              </Button>
            )}
          </form>
        )}
        <DataTable
          columns={columns}
          data={terminal ? [] : rows}
          manualSorting
          manualPagination
          rowCount={request.data?.meta.total ?? 0}
          paginationState={{ pageIndex: page - 1, pageSize }}
          onPaginationChange={(updater) => {
            const next =
              typeof updater === 'function'
                ? updater({ pageIndex: page - 1, pageSize })
                : updater;
            change({
              page:
                next.pageSize === pageSize
                  ? String(next.pageIndex + 1)
                  : undefined,
              pageSize: String(next.pageSize),
            });
          }}
          pageSizeOptions={[10, 20, 50]}
          showSelectedCount={false}
          loading={request.loading}
          listState={state}
          onRetry={refreshPortal}
          onClearFilters={() =>
            change({ q: undefined, status: undefined, templateId: undefined })
          }
          emptyMessage={t(
            status === inactive
              ? kind === 'templates'
                ? 'portal.noRetired'
                : 'portal.noArchived'
              : kind === 'templates'
                ? 'portal.emptyTemplates'
                : 'portal.emptyInstances',
          )}
          className='min-w-0 [&_th:last-child]:sticky [&_th:last-child]:right-0 [&_th:last-child]:bg-muted [&_td:last-child]:sticky [&_td:last-child]:right-0 [&_td:last-child]:bg-background'
        />
      </ListContent>
      <Outlet context={{ reload: refreshPortal }} />
    </PageContainer>
  );
}
