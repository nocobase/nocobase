import { useMatch } from 'react-router';
import { CategoryManager, type Category } from './categories.js';
import { Empty, EmptyDescription } from '#components/ui/empty';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, Outlet } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { useUrlSearch } from '#hooks/use-url-search';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import type { WorkflowSummary } from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels, workflowDate } from './hooks.js';

export default function DefinitionsPage(): ReactElement {
  const [sort, setSort] = useState<{
    ascending: boolean;
  }>();
  const detail = useMatch({
    path: '/workflows/definitions/:workflowId',
    end: false,
  });
  const { t, i18n } = useTranslation();
  const labels = useWorkflowLabels();
  const nameFilter = useUrlSearch({ param: 'name' });
  const search = nameFilter.searchParams;
  const category = search.get('category') ?? 'all';
  const normalizedName = nameFilter.search;
  const categories = useWorkflowData<{ data: Category[] }>(
    'workflows/categories',
  );
  const request = useWorkflowData<{ data: readonly WorkflowSummary[] }>(
    'workflows/definitions',
    new URLSearchParams({
      ...(nameFilter.search ? { q: nameFilter.search } : {}),
      ...(category !== 'all' ? { category } : {}),
    }).toString(),
  );
  const rows = [...(request.data?.data ?? [])].sort((a, b) =>
    sort
      ? (sort.ascending ? 1 : -1) * (a.executionCount - b.executionCount)
      : 0,
  );
  const sortButton = (
    <Button
      variant='ghost'
      size='sm'
      className='-mr-3 h-8'
      title={t('workflows.executionCount')}
      onClick={() =>
        setSort({
          ascending: sort ? !sort.ascending : true,
        })
      }
    >
      {t('workflows.executionActivity')}
      {sort && (sort.ascending ? <ArrowUp /> : <ArrowDown />)}
    </Button>
  );
  if (detail) return <Outlet />;
  return (
    <section className='flex items-start gap-3 sm:gap-4'>
      <aside className='w-32 shrink-0 space-y-4 border-r pr-2 sm:w-48 sm:pr-4'>
        {categories.data && (
          <CategoryManager
            categories={categories.data.data}
            value={category}
            onChange={(value) => {
              nameFilter.updateParams((next) => {
                if (value === 'all') next.delete('category');
                else next.set('category', value);
              });
            }}
            onSaved={(deletedId) => {
              if (deletedId === category) {
                nameFilter.updateParams((next) => next.delete('category'));
              }
              categories.reload();
              request.reload();
            }}
          />
        )}
        <DataState {...categories} retry={categories.reload} />
      </aside>
      <div className='flex min-w-0 flex-1 flex-col gap-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Input
            type='search'
            className='w-full sm:max-w-xs'
            aria-label={t('workflows.filterByName')}
            placeholder={t('workflows.filterByName')}
            {...nameFilter.inputProps}
          />
          <Button
            variant='outline'
            disabled={request.loading}
            onClick={() => {
              request.reload();
              categories.reload();
            }}
          >
            {t('workflows.refresh')}
          </Button>
        </div>
        <DataState {...request} retry={request.reload} />
        {request.data && request.data.data.length > 0 && (
          <div className='overflow-hidden rounded-lg border bg-card'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableHead className='px-3 text-muted-foreground'>
                    {t('workflows.workflow')}
                  </TableHead>
                  <TableHead
                    className='px-3 text-right text-muted-foreground'
                    aria-sort={
                      sort
                        ? sort.ascending
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    {sortButton}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className='px-3'>
                      <Link
                        className='font-medium underline-offset-4 hover:underline'
                        to={{
                          pathname: `/workflows/definitions/${workflow.id}`,
                        }}
                      >
                        {labels.title(workflow)}
                      </Link>
                      <p className='text-xs text-muted-foreground'>
                        {workflow.name}
                      </p>
                    </TableCell>
                    <TableCell className='px-3 text-right tabular-nums'>
                      {workflow.executionCount > 0 ? (
                        <>
                          <Link
                            className='underline-offset-4 hover:underline'
                            to={{
                              pathname: '/workflows/executions',
                              search: new URLSearchParams({
                                workflowId: workflow.id,
                              }).toString(),
                            }}
                            aria-label={`${labels.title(workflow)}: ${t('workflows.viewExecutions')} (${workflow.executionCount})`}
                          >
                            {t('workflows.executionCountLink', {
                              count: workflow.executionCount,
                            })}
                          </Link>
                          {workflow.lastExecutedAt && (
                            <p className='text-xs text-muted-foreground'>
                              {t('workflows.lastExecutedAt', {
                                date: workflowDate(
                                  workflow.lastExecutedAt,
                                  i18n.language,
                                ),
                              })}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className='text-muted-foreground'>
                          {t('workflows.neverExecuted')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {request.data && rows.length === 0 && (
          <Empty>
            <EmptyDescription>
              {t(
                normalizedName || category !== 'all'
                  ? 'workflows.noResults'
                  : 'workflows.noDefinitions',
              )}
            </EmptyDescription>
          </Empty>
        )}
      </div>
      <Outlet />
    </section>
  );
}
