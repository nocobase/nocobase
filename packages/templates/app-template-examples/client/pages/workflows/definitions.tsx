import { RecordLink } from '#components/record-link';
import { useMatch, useLocation } from 'react-router';
import { CategoryManager, type Category } from './categories.js';
import type { ReactElement } from 'react';
import { Outlet } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Input } from '#components/ui/input';
import { useUrlSearch } from '#hooks/use-url-search';
import { WorkflowDefinitionList } from '#extensions/nocobase-workflow-management/definition-list';
import type { WorkflowSummary } from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels, workflowDate } from './hooks.js';

export default function DefinitionsPage(): ReactElement {
  const location = useLocation();
  const detail = useMatch({
    path: '/workflows/definitions/:workflowId',
    end: false,
  });
  const { t, i18n } = useTranslation();
  const labels = useWorkflowLabels();
  const nameFilter = useUrlSearch({ param: 'name' });
  const search = nameFilter.searchParams;
  const activityOrder = search.get('activityOrder');
  const sort =
    activityOrder === 'asc' || activityOrder === 'desc'
      ? { ascending: activityOrder === 'asc' }
      : undefined;
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
  if (detail) return <Outlet />;
  return (
    <WorkflowDefinitionList
      rows={rows.map((workflow) => ({
        id: workflow.id,
        name:
          workflow.name === labels.title(workflow) ? undefined : workflow.name,
        title: (
          <RecordLink
            to={{
              pathname: `/workflows/definitions/${workflow.id}`,
              search: location.search,
            }}
          >
            {labels.title(workflow)}
          </RecordLink>
        ),
        activity:
          workflow.executionCount > 0 ? (
            <>
              <RecordLink
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
              </RecordLink>
              {workflow.lastExecutedAt && (
                <p className='text-xs text-muted-foreground'>
                  {t('workflows.lastExecutedAt', {
                    date: workflowDate(workflow.lastExecutedAt, i18n.language),
                  })}
                </p>
              )}
            </>
          ) : (
            <span className='text-muted-foreground'>
              {t('workflows.neverExecuted')}
            </span>
          ),
      }))}
      categories={
        <>
          {categories.data && (
            <CategoryManager
              categories={categories.data.data}
              value={category}
              onChange={(value) =>
                nameFilter.updateParams((next) => {
                  if (value === 'all') next.delete('category');
                  else next.set('category', value);
                })
              }
              onSaved={(deletedId) => {
                if (deletedId === category)
                  nameFilter.updateParams((next) => next.delete('category'));
                categories.reload();
                request.reload();
              }}
            />
          )}
          <DataState {...categories} retry={categories.reload} />
        </>
      }
      search={
        <Input
          type='search'
          className='w-full sm:max-w-xs'
          aria-label={t('workflows.filterByName')}
          placeholder={t('workflows.filterByName')}
          {...nameFilter.inputProps}
        />
      }
      status={<DataState {...request} retry={request.reload} />}
      loaded={Boolean(request.data)}
      loading={request.loading}
      labels={{
        refresh: t('workflows.refresh'),
        workflow: t('workflows.workflow'),
        executionCount: t('workflows.executionCount'),
        executionActivity: t('workflows.executionActivity'),
      }}
      empty={t(
        normalizedName || category !== 'all'
          ? 'workflows.noResults'
          : 'workflows.noDefinitions',
      )}
      sort={sort}
      onSort={() =>
        nameFilter.updateParams((next) =>
          next.set('activityOrder', sort?.ascending ? 'desc' : 'asc'),
        )
      }
      onRefresh={() => {
        request.reload();
        categories.reload();
      }}
    />
  );
}
