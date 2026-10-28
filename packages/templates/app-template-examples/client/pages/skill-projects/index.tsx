import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '#components/data-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { useListLocation } from '#hooks/use-list-location';
import { useListData } from '#hooks/use-list-data';

export interface SkillProject {
  id: string;
  name: string;
}

export default function SkillProjectsPage(): ReactElement {
  const { t } = useTranslation();
  const { active } = useListLocation();
  const location = useLocation();
  const request = useListData<{
    data: SkillProject[];
    meta: { total: number };
  }>('skillProjects', { active, keepPreviousData: true });
  const { data, reload, replaceData } = request;
  const context = useMemo(
    () => ({
      reload: reload,
      onSaved: (project: SkillProject) => {
        if (!data) return;
        const existed = data.data.some((row) => row.id === project.id);
        const rows = [
          ...data.data.filter((row) => row.id !== project.id),
          project,
        ];
        rows.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        replaceData({
          data: rows.slice(0, 100),
          meta: { total: data.meta.total + (existed ? 0 : 1) },
        });
      },
    }),
    [reload, replaceData, data],
  );
  const columns = useMemo<ColumnDef<SkillProject>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('skillProjects.name'),
        cell: ({ row }) => (
          <span className='block max-w-64 truncate' title={row.original.name}>
            {row.original.name}
          </span>
        ),
      },
      {
        id: 'actions',
        header: t('skillProjects.actions'),
        cell: ({ row }) => (
          <Button
            variant='ghost'
            render={
              <Link
                to={{
                  pathname: `${row.original.id}/edit`,
                  search: location.search,
                }}
              />
            }
            nativeButton={false}
          >
            {t('skillProjects.edit')}
          </Button>
        ),
      },
    ],
    [t, location.search],
  );
  const status =
    request.error instanceof ApiClientError ? request.error.status : undefined;
  const createAction = (
    <Button
      render={<Link to={{ pathname: 'new', search: location.search }} />}
      nativeButton={false}
    >
      {t('skillProjects.create')}
    </Button>
  );
  return (
    <PageContainer>
      <PageHeader
        title={t('skillProjects.title')}
        description={t('skillProjects.description')}
        actions={
          request.data?.data.length && !request.error ? createAction : undefined
        }
      />
      <div
        className='flex h-8 items-center justify-end'
        data-testid='refresh-slot'
      >
        {active && request.loading && request.data ? (
          <RefreshIndicator />
        ) : null}
      </div>
      {request.error ? (
        <div role='alert' className='space-y-2'>
          <p>
            {t(
              status === 401
                ? 'skillProjects.expired'
                : status === 403
                  ? 'skillProjects.denied'
                  : 'skillProjects.failed',
            )}
          </p>
          {status === 401 ? (
            <Link to='/login'>{t('skillProjects.signIn')}</Link>
          ) : status === 403 ? null : (
            <Button onClick={request.reload}>{t('skillProjects.retry')}</Button>
          )}
        </div>
      ) : null}
      {!request.data && !request.error ? (
        <div role='status' aria-label={t('skillProjects.loading')}>
          <Skeleton className='h-24 w-full' />
        </div>
      ) : request.data?.data.length === 0 && !request.error ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('skillProjects.emptyTitle')}</EmptyTitle>
            <EmptyDescription>{t('skillProjects.empty')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{createAction}</EmptyContent>
        </Empty>
      ) : request.data ? (
        <>
          {request.data.meta.total > request.data.data.length ? (
            <p>{t('skillProjects.cap')}</p>
          ) : null}
          <DataTable
            columns={columns}
            data={request.data.data}
            getRowId={(row) => row.id}
            showSelectedCount={false}
            emptyMessage={t('skillProjects.empty')}
          />
        </>
      ) : null}
      <Outlet context={context} />
    </PageContainer>
  );
}

function RefreshIndicator(): ReactElement | null {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);
  return visible ? (
    <span
      role='status'
      className='flex items-center gap-2 text-sm text-muted-foreground'
    >
      <Spinner />
      {t('skillProjects.refreshing')}
    </span>
  ) : null;
}
