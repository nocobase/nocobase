import { useMatch } from 'react-router';
import { Badge } from '#components/ui/badge';
import type { ReactElement } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { useUrlSearch } from '#hooks/use-url-search';
import { WorkflowExecutionList } from '#extensions/nocobase-workflow-management/execution-list';
import type {
  WorkflowSummary,
  WorkflowExecutionPage,
} from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels, workflowDate } from './hooks.js';

export default function ExecutionsPage(): ReactElement {
  const detail = useMatch({
    path: '/workflows/executions/:workflowId/:recordId',
    end: false,
  });
  const { t, i18n } = useTranslation();
  const labels = useWorkflowLabels();
  const location = useLocation();
  const [search, setSearch] = useSearchParams();
  const nameFilter = useUrlSearch({
    param: 'name',
    resetParams: ['page', 'workflowId'],
  });
  const normalizedName = nameFilter.search;
  const catalog = useWorkflowData<{ data: readonly WorkflowSummary[] }>(
    'workflows/definitions',
  );
  const workflows = catalog.data?.data ?? [];
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
    ...(normalizedName ? { q: normalizedName } : {}),
  }).toString();
  const request = useWorkflowData<WorkflowExecutionPage>(
    'workflows/executions',
    query,
  );
  const changePage = (next: number) => {
    const params = new URLSearchParams(search);
    params.set('page', String(next));
    setSearch(params);
  };
  const total = request.data?.meta.total ?? 0;
  const selectedWorkflow = workflows.find((item) => item.id === workflowId);
  if (detail) return <Outlet />;
  return (
    <WorkflowExecutionList
      rows={(request.data?.data ?? []).map((execution) => {
        const workflow = workflows.find(
          (item) => item.id === execution.workflowId,
        );
        return {
          id: `${execution.workflowId}:${execution.recordId}`,
          record: (
            <>
              <Link
                className='underline-offset-4 hover:underline'
                to={{
                  pathname: `/workflows/executions/${execution.workflowId}/${execution.recordId}`,
                  search: location.search,
                }}
              >
                #{execution.recordId}
              </Link>
            </>
          ),
          workflow: (
            <>
              <Link
                className='underline-offset-4 hover:underline'
                to={{
                  pathname: `/workflows/definitions/${execution.workflowId}`,
                  search: location.search,
                }}
              >
                {workflow ? labels.title(workflow) : execution.workflowId}
              </Link>
            </>
          ),
          state: (
            <>
              <Badge variant='secondary'>
                {labels.state(workflow?.source ?? 'lifecycle', execution.state)}
              </Badge>
            </>
          ),
          createdAt: <>{workflowDate(execution.createdAt, i18n.language)}</>,
        };
      })}
      filters={
        <>
          {' '}
          <Input
            type='search'
            className='w-full sm:w-72'
            aria-label={t('workflows.filterByName')}
            placeholder={t('workflows.filterByName')}
            {...nameFilter.inputProps}
          />
          {workflowId && (
            <Badge variant='secondary'>
              {selectedWorkflow ? labels.title(selectedWorkflow) : workflowId}
            </Badge>
          )}
          {(workflowId || nameFilter.text) && (
            <Button
              variant='ghost'
              onClick={() =>
                nameFilter.clear((params) => {
                  params.delete('workflowId');
                  params.delete('page');
                })
              }
            >
              {t('workflows.clear')}
            </Button>
          )}
        </>
      }
      status={
        <>
          <DataState {...request} retry={request.reload} />
          {catalog.status && <DataState {...catalog} retry={catalog.reload} />}
        </>
      }
      loaded={Boolean(request.data)}
      loading={request.loading}
      empty={t(
        workflowId || normalizedName
          ? 'workflows.noResults'
          : 'workflows.noExecutions',
      )}
      labels={{
        refresh: t('workflows.refresh'),
        record: t('workflows.record'),
        workflow: t('workflows.workflow'),
        state: t('workflows.state'),
        createdAt: t('workflows.createdAt'),
        previous: t('workflows.previous'),
        next: t('workflows.next'),
      }}
      order={order}
      onSort={() => {
        const params = new URLSearchParams(search);
        params.set('order', order === 'newest' ? 'oldest' : 'newest');
        params.delete('page');
        setSearch(params);
      }}
      onRefresh={() => {
        request.reload();
        catalog.reload();
      }}
      pagination={t('workflows.pagination', { page, total })}
      previousDisabled={page <= 1 || request.loading}
      nextDisabled={page * 20 >= total || page >= 1000 || request.loading}
      onPrevious={() => changePage(page - 1)}
      onNext={() => changePage(page + 1)}
    />
  );
}
