import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#components/ui/empty';
import { Input } from '#components/ui/input';
import { Skeleton } from '#components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import type { ReviewTask } from './types.js';

interface TaskPage {
  data: ReviewTask[];
  meta: { total: number; page: number; pageSize: number };
}

export default function WorkflowWaitingTasksPage(): ReactElement {
  const api = useApiClient();
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['quotation-review-tasks', search, status, page],
    queryFn: ({ signal }) =>
      api.request<TaskPage>({
        path: 'quotationReviewTasks',
        query: { page, pageSize: 12, q: search.trim(), status },
        signal,
      }),
    retry: false,
  });
  const result = query.data;
  const pages = Math.max(1, Math.ceil((result?.meta.total ?? 0) / 12));
  const amount = (cents: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);

  return (
    <PageContainer>
      <PageHeader
        title={t('workflowTasks.title')}
        description={t('workflowTasks.description')}
        actions={
          <Button
            variant='outline'
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className='size-4' />
            {t('workflowTasks.refresh')}
          </Button>
        }
      />
      <div className='flex flex-wrap gap-3'>
        <Input
          aria-label={t('workflowTasks.search')}
          className='max-w-xs'
          maxLength={64}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder={t('workflowTasks.search')}
          value={search}
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value ?? 'all');
            setPage(1);
          }}
        >
          <SelectTrigger
            aria-label={t('workflowTasks.filterStatus')}
            className='w-40'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['all', 'pending', 'submitting', 'submitted', 'unavailable'].map(
              (item) => (
                <SelectItem key={item} value={item}>
                  {t(`workflowTasks.status.${item}`)}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      {query.isPending ? (
        <div
          role='status'
          aria-label={t('workflowTasks.loading')}
          className='space-y-3 rounded-lg border bg-card p-5'
        >
          <span className='sr-only'>{t('workflowTasks.loading')}</span>
          <Skeleton className='h-8 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
          <Skeleton className='h-12 w-full' />
        </div>
      ) : query.isError ? (
        <div
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive'
        >
          {t('workflowTasks.loadError')}{' '}
          <Button variant='outline' onClick={() => void query.refetch()}>
            {t('workflowTasks.retry')}
          </Button>
        </div>
      ) : result?.data.length === 0 ? (
        <Empty className='border bg-card'>
          <EmptyHeader>
            <EmptyTitle>
              {search || status !== 'all'
                ? t('workflowTasks.noResults')
                : t('workflowTasks.empty')}
            </EmptyTitle>
            <EmptyDescription>
              {search || status !== 'all'
                ? t('workflowTasks.clearFiltersHint')
                : t('workflowTasks.emptyHint')}
            </EmptyDescription>
          </EmptyHeader>
          {search || status !== 'all' ? (
            <EmptyContent>
              <Button
                variant='outline'
                onClick={() => {
                  setSearch('');
                  setStatus('all');
                  setPage(1);
                }}
              >
                {t('workflowTasks.clearFilters')}
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workflowTasks.quotation')}</TableHead>
                <TableHead>{t('workflowTasks.route')}</TableHead>
                <TableHead className='text-right'>
                  {t('workflowTasks.amount')}
                </TableHead>
                <TableHead>{t('workflowTasks.statusLabel')}</TableHead>
                <TableHead>{t('workflowTasks.createdAt')}</TableHead>
                <TableHead>{t('workflowTasks.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result?.data.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className='font-medium'>
                    <Link
                      className='text-primary underline-offset-2 hover:underline'
                      to={`/workflow/waiting-tasks/${task.id}`}
                    >
                      {task.quotationId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {t(`workflowTasks.routeValue.${task.route}`)}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {amount(task.totalCents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline'>
                      {t(`workflowTasks.status.${task.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat(i18n.language, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(task.createdAt))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='outline'
                      size='sm'
                      nativeButton={false}
                      render={
                        <Link to={`/workflow/waiting-tasks/${task.id}`} />
                      }
                    >
                      {task.status === 'pending' &&
                      task.waitStatus === 'pending'
                        ? t('workflowTasks.process')
                        : t('workflowTasks.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <span>
          {t('workflowTasks.total', { count: result?.meta.total ?? 0 })}
        </span>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            {t('workflowTasks.previous')}
          </Button>
          <span>
            {page} / {pages}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            {t('workflowTasks.next')}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
