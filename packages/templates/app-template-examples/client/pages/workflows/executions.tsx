import { Badge } from '#components/ui/badge';
import { Empty, EmptyDescription } from '#components/ui/empty';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import type {
  WorkflowSummary,
  WorkflowExecutionPage,
} from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels, workflowDate } from './hooks.js';

export default function ExecutionsPage(): ReactElement {
  const { t, i18n } = useTranslation();
  const labels = useWorkflowLabels();
  const location = useLocation();
  const [search, setSearch] = useSearchParams();
  const order = search.get('order') === 'oldest' ? 'oldest' : 'newest';
  const workflowId = search.get('workflowId') ?? '';
  const rawPage = Number(search.get('page') ?? 1);
  const page =
    Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 1000 ? rawPage : 1;
  const query = new URLSearchParams({
    page: String(page),
    pageSize: '20',
    ...(order === 'oldest' ? { order } : {}),
    ...(workflowId ? { workflowId } : {}),
  }).toString();
  const catalog = useWorkflowData<{ data: readonly WorkflowSummary[] }>(
    'workflows/definitions',
  );
  const request = useWorkflowData<WorkflowExecutionPage>(
    'workflows/executions',
    query,
  );
  const changePage = (next: number) => {
    const params = new URLSearchParams(search);
    params.set('page', String(next));
    setSearch(params);
  };
  const workflows = catalog.data?.data ?? [];
  const options = [
    { value: '', label: t('workflows.all') },
    ...workflows.map((workflow) => ({
      value: workflow.id,
      label: labels.title(workflow),
    })),
  ];
  const total = request.data?.meta.total ?? 0;
  return (
    <section className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <Select
            items={options}
            value={workflowId}
            onValueChange={(value) => {
              const params = new URLSearchParams(search);
              params.delete('page');
              if (typeof value === 'string' && value)
                params.set('workflowId', value);
              else params.delete('workflowId');
              setSearch(params);
            }}
          >
            <SelectTrigger
              aria-label={t('workflows.filter')}
              className='max-w-full min-w-52'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-max max-w-[calc(100vw-2rem)] [&_[data-slot=select-item]]:whitespace-normal'>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {workflowId && (
            <Button variant='ghost' onClick={() => setSearch({})}>
              {t('workflows.clear')}
            </Button>
          )}
        </div>
        <Button
          variant='outline'
          disabled={request.loading}
          onClick={() => {
            request.reload();
            catalog.reload();
          }}
        >
          {t('workflows.refresh')}
        </Button>
      </div>
      <DataState {...request} retry={request.reload} />
      {catalog.status && <DataState {...catalog} retry={catalog.reload} />}
      <div className='overflow-hidden rounded-lg border bg-card'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/40 hover:bg-muted/40'>
              <TableHead className='px-3 text-muted-foreground'>
                {t('workflows.workflow')}
              </TableHead>
              <TableHead className='px-3 text-muted-foreground'>
                {t('workflows.record')}
              </TableHead>
              <TableHead className='px-3 text-muted-foreground'>
                {t('workflows.recordTitle')}
              </TableHead>
              <TableHead className='px-3 text-muted-foreground'>
                {t('workflows.state')}
              </TableHead>
              <TableHead
                className='px-3 text-muted-foreground'
                aria-sort={order === 'newest' ? 'descending' : 'ascending'}
              >
                <Button
                  variant='ghost'
                  size='sm'
                  className='-ml-3 h-8'
                  onClick={() => {
                    const params = new URLSearchParams(search);
                    params.set(
                      'order',
                      order === 'newest' ? 'oldest' : 'newest',
                    );
                    params.delete('page');
                    setSearch(params);
                  }}
                >
                  {t('workflows.createdAt')}
                  {order === 'newest' ? <ArrowDown /> : <ArrowUp />}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(request.data?.data ?? []).map((execution) => {
              const workflow = workflows.find(
                (item) => item.id === execution.workflowId,
              );
              return (
                <TableRow key={`${execution.workflowId}:${execution.recordId}`}>
                  <TableCell className='px-3'>
                    <Link
                      className='text-primary hover:underline'
                      to={{
                        pathname: `/workflows/definitions/${execution.workflowId}`,
                        search: location.search,
                      }}
                    >
                      {workflow ? labels.title(workflow) : execution.workflowId}
                    </Link>
                  </TableCell>
                  <TableCell className='px-3'>
                    <Link
                      className='text-primary underline-offset-4 hover:underline'
                      to={{
                        pathname: `/workflows/executions/${execution.workflowId}/${execution.recordId}`,
                        search: location.search,
                      }}
                    >
                      #{execution.recordId}
                    </Link>
                  </TableCell>
                  <TableCell
                    className='max-w-64 truncate px-3'
                    title={execution.title}
                  >
                    {execution.title}
                  </TableCell>
                  <TableCell className='px-3'>
                    <Badge variant='secondary'>
                      {labels.state(
                        workflow?.source ?? 'lifecycle',
                        execution.state,
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className='px-3'>
                    {workflowDate(execution.createdAt, i18n.language)}
                  </TableCell>
                </TableRow>
              );
            })}
            {request.data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Empty>
                    <EmptyDescription>
                      {t(
                        workflowId
                          ? 'workflows.noResults'
                          : 'workflows.noExecutions',
                      )}
                    </EmptyDescription>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3 text-sm'>
        <p>{t('workflows.pagination', { page, total })}</p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            disabled={page <= 1 || request.loading}
            onClick={() => changePage(page - 1)}
          >
            {t('workflows.previous')}
          </Button>
          <Button
            variant='outline'
            disabled={page * 20 >= total || page >= 1000 || request.loading}
            onClick={() => changePage(page + 1)}
          >
            {t('workflows.next')}
          </Button>
        </div>
      </div>
      <Outlet />
    </section>
  );
}
