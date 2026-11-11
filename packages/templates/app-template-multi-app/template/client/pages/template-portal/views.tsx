import { useEffect, type ReactNode } from 'react';
import { usePageBreadcrumb } from '@nocobase/app-client';
import { InstanceDeploymentHistory } from '@nocobase/app-plugin-multi-app/client';
import { InitialAdmin } from '@nocobase/app-plugin-multi-app/client/components/initial-admin';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import {
  Link,
  Outlet,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { RecordLink } from '#components/record-link';
import { Button } from '#components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#components/ui/tabs';
import { useRouteSearches } from '../../routing/route-context.js';
import IdentityAccess from './identity-access.js';
import {
  Action,
  Entry,
  Feedback,
  MoreActions,
  State,
  TemplateVersion,
  InstanceRuntime,
} from './management-ui.js';
import {
  usePortalData,
  refreshPortal,
  isTerminalError,
  permission,
  namespace,
  type Row,
  type List,
  type Runtime,
} from './data.js';
export { Catalogue } from './catalogue.js';
export { Feedback } from './management-ui.js';

function DetailTabs({
  items,
}: {
  readonly items: { id: string; label: string; content: ReactNode }[];
}) {
  const [params, setParams] = useSearchParams();
  const selected = items.some((item) => item.id === params.get('view'))
    ? params.get('view')
    : items[0].id;
  return (
    <Tabs
      value={selected}
      onValueChange={(value) =>
        setParams((old) => {
          const next = new URLSearchParams(old);
          if (value === items[0].id) next.delete('view');
          else next.set('view', String(value));
          return next;
        })
      }
      className='min-w-0 gap-6'
    >
      <div className='max-w-full overflow-x-auto pb-1'>
        <TabsList
          variant='line'
          aria-label={items.map((item) => item.label).join(' / ')}
          className='h-11'
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className='min-h-10 px-3'
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {items.map((item) => (
        <TabsContent key={item.id} value={item.id} className='min-w-0'>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
function useDetailBreadcrumb(kind: 'templates' | 'instances', row?: Row) {
  const { t } = useTranslation(),
    location = useLocation(),
    searches = useRouteSearches();
  const pathname = `/multi-app/${kind}`;
  const fallback = new URLSearchParams(location.search);
  for (const key of [
    'view',
    'versionsPage',
    'relatedPage',
    'templateId',
    'versionId',
    'environmentId',
  ])
    fallback.delete(key);
  usePageBreadcrumb([
    {
      label: t(kind === 'templates' ? 'portal.templates' : 'portal.management'),
      to: { pathname, search: searches.get(pathname) ?? fallback.toString() },
    },
    {
      label:
        row?.name ??
        t(
          kind === 'templates' ? 'portal.templateDetail' : 'portal.application',
        ),
    },
  ]);
}
function Environment({ id }: { readonly id?: string }) {
  const request = usePortalData<List>('releases/environments?pageSize=100');
  return (
    <span>
      {request.data?.data.find((item) => item.id === id)?.name ?? id ?? '—'}
    </span>
  );
}
function Summary({
  fields,
}: {
  readonly fields: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className='grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3'>
      {fields.map((field) => (
        <div key={field.label} className='min-w-0'>
          <dt className='text-sm text-muted-foreground'>{field.label}</dt>
          <dd className='mt-1 break-words text-sm font-medium'>
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Versions({ template }: { readonly template: Row }) {
  const { t, i18n } = useTranslation(),
    location = useLocation(),
    [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('versionsPage')) || 1);
  const request = usePortalData<List>(
    `multiApp/templates/${template.id}/versions?page=${page}&pageSize=10`,
    true,
  );
  const access = useCan(permission('instances', 'provision'));
  const columns: ColumnDef<Row>[] = [
    {
      id: 'version',
      header: t('portal.version'),
      cell: ({ row }) => (
        <span className='font-medium tabular-nums' translate='no'>
          {row.original.version}
        </span>
      ),
    },
    {
      id: 'description',
      header: t('portal.description'),
      cell: ({ row }) => (
        <span
          className='block max-w-96 truncate'
          title={
            typeof row.original.manifest?.description === 'string'
              ? row.original.manifest.description
              : undefined
          }
        >
          {typeof row.original.manifest?.description === 'string'
            ? row.original.manifest.description
            : '—'}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: t('portal.publishedAt'),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString(i18n.language),
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>{t('portal.actions')}</span>,
      cell: ({ row }) =>
        access.can ? (
          <Button
            variant='ghost'
            size='sm'
            disabled={template.status !== 'active'}
            nativeButton={false}
            render={
              <Link
                to={{
                  pathname: 'provision',
                  search: new URLSearchParams({
                    ...Object.fromEntries(new URLSearchParams(location.search)),
                    templateId: template.id,
                    versionId: row.original.id,
                    environmentId: template.environmentId ?? '',
                  }).toString(),
                }}
              />
            }
          >
            {t('portal.useVersion')}
          </Button>
        ) : null,
    },
  ];
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>{t('portal.versionRule')}</p>
      {request.error ? (
        <Feedback error={request.error} />
      ) : (
        <DataTable
          columns={columns}
          data={request.data?.data ?? []}
          loading={request.loading}
          manualSorting
          manualPagination
          rowCount={request.data?.meta.total ?? 0}
          paginationState={{ pageIndex: page - 1, pageSize: 10 }}
          pageSizeOptions={[10]}
          showSelectedCount={false}
          onPaginationChange={(update) => {
            const next =
              typeof update === 'function'
                ? update({ pageIndex: page - 1, pageSize: 10 })
                : update;
            setParams((old) => {
              const params = new URLSearchParams(old);
              params.set('versionsPage', String(next.pageIndex + 1));
              return params;
            });
          }}
          emptyMessage={t('portal.noVersion')}
        />
      )}
    </div>
  );
}
function RelatedInstances({ templateId }: { readonly templateId: string }) {
  const { t } = useTranslation(),
    [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('relatedPage')) || 1);
  const request = usePortalData<List>(
    `multiApp/instances?templateId=${encodeURIComponent(templateId)}&page=${page}&pageSize=10`,
    true,
  );
  const columns: ColumnDef<Row>[] = [
    {
      id: 'name',
      header: t('portal.name'),
      cell: ({ row }) => (
        <RecordLink to={`/multi-app/instances/${row.original.id}`}>
          {row.original.name}
        </RecordLink>
      ),
    },
    {
      id: 'status',
      header: t('portal.runtimeState'),
      cell: ({ row }) => <InstanceRuntime row={row.original} part='status' />,
    },
    {
      id: 'version',
      header: t('portal.currentVersion'),
      cell: ({ row }) => <InstanceRuntime row={row.original} part='version' />,
    },
  ];
  return request.error ? (
    <Feedback error={request.error} />
  ) : (
    <DataTable
      columns={columns}
      data={request.data?.data ?? []}
      loading={request.loading}
      manualSorting
      manualPagination
      rowCount={request.data?.meta.total ?? 0}
      paginationState={{ pageIndex: page - 1, pageSize: 10 }}
      pageSizeOptions={[10]}
      showSelectedCount={false}
      onPaginationChange={(update) => {
        const next =
          typeof update === 'function'
            ? update({ pageIndex: page - 1, pageSize: 10 })
            : update;
        setParams((old) => {
          const params = new URLSearchParams(old);
          params.set('relatedPage', String(next.pageIndex + 1));
          return params;
        });
      }}
      emptyMessage={t('portal.noRelated')}
    />
  );
}
export function TemplateDetail() {
  const { t } = useTranslation(),
    { id } = useParams();
  const request = usePortalData<{ data: Row }>(`multiApp/templates/${id}`),
    row = request.data?.data;
  useDetailBreadcrumb('templates', row);
  return (
    <PageContainer>
      <PageHeader
        title={
          <span className='break-words'>
            {row?.name ?? t('portal.templateDetail')}
          </span>
        }
        description={row?.description}
        actions={
          !isTerminalError(request.error) ? (
            <>
              {row && (
                <>
                  <TemplateVersion template={row} action />
                  <MoreActions kind='templates' row={row} />
                </>
              )}
            </>
          ) : null
        }
      />
      {!row || request.error ? (
        <Feedback error={request.error} />
      ) : (
        <DetailTabs
          items={[
            {
              id: 'overview',
              label: t('portal.overview'),
              content: (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('portal.templateDetail')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Summary
                      fields={[
                        {
                          label: t('portal.catalogueState'),
                          value: <State value={row.status} />,
                        },
                        {
                          label: t('portal.latest'),
                          value: <TemplateVersion template={row} />,
                        },
                        {
                          label: t('portal.environments'),
                          value: <Environment id={row.environmentId} />,
                        },
                        { label: t('portal.identifier'), value: row.id },
                      ]}
                    />
                  </CardContent>
                </Card>
              ),
            },
            {
              id: 'versions',
              label: t('portal.versions'),
              content: <Versions template={row} />,
            },
            {
              id: 'instances',
              label: t('portal.management'),
              content: <RelatedInstances templateId={row.id} />,
            },
          ]}
        />
      )}
      <Outlet context={{ reload: refreshPortal }} />
    </PageContainer>
  );
}
function Operations({ instanceId }: { readonly instanceId: string }) {
  const { t, i18n } = useTranslation();
  const request = usePortalData<List>(
    `multiApp/operations?${new URLSearchParams({ q: instanceId, pageSize: '20' })}`,
  );
  const columns: ColumnDef<Row>[] = [
    {
      id: 'kind',
      header: t('portal.actions'),
      cell: ({ row }) => (
        <RecordLink to={`/multi-app/operations/${row.original.id}`}>
          {t(`actions.${row.original.kind}`, { ns: namespace })}
        </RecordLink>
      ),
    },
    {
      id: 'status',
      header: t('portal.catalogueState'),
      cell: ({ row }) => <State value={row.original.status} />,
    },
    {
      id: 'createdAt',
      header: t('portal.createdAt'),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleString(i18n.language),
    },
  ];
  return (
    <div className='flex flex-col items-stretch gap-4'>
      {request.error ? (
        <Feedback error={request.error} />
      ) : (
        <DataTable
          columns={columns}
          data={
            request.data?.data.filter((op) => op.instanceId === instanceId) ??
            []
          }
          loading={request.loading}
          pagination={false}
          emptyMessage={t('portal.noOperations')}
        />
      )}
      <Button
        className='self-start'
        variant='outline'
        nativeButton={false}
        render={
          <Link
            to={`/multi-app/operations?q=${encodeURIComponent(instanceId)}`}
          />
        }
      >
        {t('portal.allOperations')}
      </Button>
    </div>
  );
}
export function InstanceDetail() {
  const { t } = useTranslation(),
    { id } = useParams();
  const request = usePortalData<{ data: Row }>(`multiApp/instances/${id}`),
    row = request.data?.data;
  const runtime = usePortalData<{ data: Runtime }>(
      `multiApp/instances/${id}/runtime`,
    ),
    value = runtime.error ? undefined : runtime.data?.data;
  useDetailBreadcrumb('instances', row);
  useEffect(() => {
    if (!row?.operationId) return;
    const timer = window.setInterval(refreshPortal, 4000);
    return () => window.clearInterval(timer);
  }, [row?.operationId]);
  return (
    <PageContainer>
      <PageHeader
        title={
          <span className='break-words'>
            {row?.name ?? t('portal.application')}
          </span>
        }
        description={id}
        actions={
          !isTerminalError(request.error) ? (
            <>
              {row && (
                <>
                  <Entry
                    instance={row}
                    runtime={value}
                    busy={runtime.loading}
                  />
                  <MoreActions kind='instances' row={row} runtime={value} />
                </>
              )}
            </>
          ) : null
        }
      />
      {!row || request.error ? (
        <Feedback error={request.error} />
      ) : (
        <>
          {row.operationId && (
            <p
              role='status'
              className='rounded-lg border border-border bg-muted/40 p-3 text-sm'
            >
              {t('portal.operationPending')}{' '}
              <RecordLink to={`/multi-app/operations/${row.operationId}`}>
                {t('portal.viewProgress')}
              </RecordLink>
            </p>
          )}
          <DetailTabs
            items={[
              {
                id: 'overview',
                label: t('portal.overview'),
                content: (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('portal.applicationInfo')}</CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-6'>
                      {runtime.error ? (
                        <Feedback error={runtime.error} />
                      ) : (
                        <Summary
                          fields={[
                            {
                              label: t('portal.runtimeState'),
                              value: (
                                <State
                                  value={
                                    row.status === 'archived'
                                      ? 'archived'
                                      : value?.state
                                  }
                                />
                              ),
                            },
                            {
                              label: t('portal.currentVersion'),
                              value: value?.currentVersion ?? '—',
                            },
                            ...(row.operationId &&
                            value?.desiredVersion &&
                            value.currentVersion !== value.desiredVersion
                              ? [
                                  {
                                    label: t('portal.targetVersion'),
                                    value: value.desiredVersion,
                                  },
                                ]
                              : []),
                            {
                              label: t('portal.environments'),
                              value: <Environment id={row.environmentId} />,
                            },
                            {
                              label: t('portal.template'),
                              value: (
                                <RecordLink
                                  to={`/multi-app/templates/${row.templateId}`}
                                >
                                  {t('portal.viewTemplate')}
                                </RecordLink>
                              ),
                            },
                          ]}
                        />
                      )}
                      <div className='flex flex-wrap gap-2'>
                        {!row.operationId &&
                          row.status === 'active' &&
                          value && (
                            <Action
                              kind='instances'
                              id={row.id}
                              action={
                                value.state === 'running' ? 'stop' : 'start'
                              }
                            />
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ),
              },
              {
                id: 'access',
                label: t('portal.access'),
                content: (
                  <div className='flex flex-col gap-6'>
                    <IdentityAccess key={row.id} appId={row.id} />
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('portal.localAdministrator')}</CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
                          {t('portal.localAdministratorHint')}
                        </p>
                        <div className='max-w-md [&>section>button]:self-start'>
                          <InitialAdmin key={row.id} instanceId={row.id} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                id: 'deployments',
                label: t('portal.deployments'),
                content: (
                  <InstanceDeploymentHistory key={row.id} instanceId={row.id} />
                ),
              },
              {
                id: 'operations',
                label: t('portal.operations'),
                content: <Operations instanceId={row.id} />,
              },
            ]}
          />
        </>
      )}
      <Outlet context={{ reload: refreshPortal }} />
    </PageContainer>
  );
}
