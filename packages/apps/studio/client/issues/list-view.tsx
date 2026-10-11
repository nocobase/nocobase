/**
 * The list view: the projects plugin's issue pages (cursor pages of 50, in the server's order, "Load more") in the
 * installed `IssueTable`, each row with Studio's marks (`issue-marks.tsx`). Ordering by a column header orders on the
 * server. Listing deleted issues offers "Restore".
 */
import {
  findStatus,
  flattenIssuePages,
  statusTone,
  useIssuePages,
  useNotify,
  useStatusName,
  withIssueSort,
  type IssueFilters,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmEmpty,
  PmListSkeleton,
  PmLoadError,
  pmKeys,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueSort } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ListTodoIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import {
  IssueTable,
  type IssueTableLabels,
  type IssueTableSortColumn,
} from '@/components/issue-table';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { IssueMarks } from './issue-marks.js';
import { issueTableRow } from './rows.js';
import type { IssuesPage } from './use-issues-page.js';

const SORT_COLUMN: Readonly<Record<IssueSort, IssueTableSortColumn | null>> = {
  updated: 'updated',
  number: 'identifier',
  priority: 'priority',
  created: null,
};
const COLUMN_SORT: Readonly<Record<IssueTableSortColumn, IssueSort>> = {
  updated: 'updated',
  identifier: 'number',
  priority: 'priority',
};

export function IssueListView({
  page,
  issueHref,
  onOpen,
  deleted,
  empty,
}: {
  readonly page: IssuesPage;
  readonly issueHref: (issueId: string) => string;
  readonly onOpen: (issueId: string) => void;
  /** Listing deleted issues: rows offer "Restore" and do not open. */
  readonly deleted: boolean;
  /** What shows when there are no issues at all. */
  readonly empty: { title: string; description: string; action?: ReactNode };
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const statusName = useStatusName();
  const filters: IssueFilters = page.filters;
  const list = useIssuePages(filters, true);
  const statuses = useQuery({
    queryKey: pmKeys.statuses(filters.projectId ?? null),
    queryFn: () => api.statuses(filters.projectId),
  });
  const issues = flattenIssuePages(list.data?.pages);
  const byId = new Map(issues.map((issue) => [issue.id, issue]));

  if (list.isError && !list.isFetching)
    return (
      <PmLoadError
        title={t('issuesPage.loadFailed')}
        error={list.error}
        onRetry={() => void list.refetch()}
      />
    );
  if (!list.data) return <PmListSkeleton />;
  if (issues.length === 0 && !page.filtered)
    return (
      <PmEmpty
        icon={<ListTodoIcon />}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );

  const sortColumn = SORT_COLUMN[filters.sort ?? 'updated'];
  const labels = t('issuesPage.table', {
    returnObjects: true,
  }) as unknown as IssueTableLabels;
  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='min-h-0 flex-1 overflow-auto rounded-lg'>
        <IssueTable
          rows={issues.map((issue) =>
            issueTableRow(
              issue,
              findStatus(statuses.data, issue.statusKey)
                ? statuses.data
                : undefined,
              { statusName, statusTone },
            ),
          )}
          {...(sortColumn
            ? {
                sort: {
                  column: sortColumn,
                  direction: filters.direction ?? 'desc',
                },
              }
            : {})}
          rowMarks={(row) => {
            const issue = byId.get(row.id);
            return issue ? (
              <IssueMarks
                issue={issue}
                placement='row'
                className='flex-nowrap'
              />
            ) : null;
          }}
          onSortChange={(sort) =>
            page.updateParams((current) =>
              withIssueSort(current, COLUMN_SORT[sort.column], sort.direction),
            )
          }
          {...(deleted
            ? {
                rowAction: (row) => (
                  <Button
                    variant='outline'
                    size='xs'
                    onClick={() =>
                      void api.restoreIssue(row.id).then(
                        () => {
                          notify.success(
                            t('issuesPage.restored', {
                              identifier: row.identifier,
                            }),
                          );
                          void queryClient.invalidateQueries({
                            queryKey: pmKeys.issues,
                          });
                        },
                        (error: unknown) => notify.error(error),
                      )
                    }
                  >
                    {t('issuesPage.restore')}
                  </Button>
                ),
              }
            : {
                rowHref: (row) => issueHref(row.id),
                onRowClick: (row) => onOpen(row.id),
              })}
          empty={
            <div className='flex flex-col items-center gap-2'>
              <span>{t('issuesPage.noResults')}</span>
              <Button variant='outline' size='sm' onClick={page.clearFilters}>
                {t('issuesPage.clearFilters')}
              </Button>
            </div>
          }
          locale={i18n.language}
          labels={labels}
        />
      </div>
      {issues.length > 0 ? (
        <div className='flex shrink-0 items-center justify-between gap-3 text-sm text-muted-foreground'>
          <span className='tabular-nums'>
            {t('issuesPage.shown', { count: issues.length })}
          </span>
          {list.hasNextPage ? (
            <Button
              variant='outline'
              size='sm'
              disabled={list.isFetchingNextPage}
              onClick={() => void list.fetchNextPage()}
            >
              {list.isFetchingNextPage ? (
                <Spinner data-icon='inline-start' />
              ) : null}
              {t('issuesPage.loadMore')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
