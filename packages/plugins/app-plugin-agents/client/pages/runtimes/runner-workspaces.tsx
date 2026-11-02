import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { RunnerSummary } from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { AgLoadError } from '../../components/ag-states.js';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { RunnerPagination } from './runner-pagination.js';
import { WorkspaceDiagnostics } from './workspace-diagnostics.js';

export function RunnerWorkspaces({
  runner,
}: {
  readonly runner: RunnerSummary;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const [status, setStatus] = useState<'all' | 'active' | 'retained' | 'ended'>(
    'all',
  );
  const [page, setPage] = useState(1);
  const result = useQuery({
    queryKey: [...agentsKeys.runners, 'workspaces', runner.id, status, page],
    queryFn: () => api.runnerWorkspaces(runner.id, status, page),
  });
  const totals = result.data?.meta.usage ?? runner.workspaceUsage;
  const pageSize = result.data?.meta.pageSize ?? 50;
  const total = result.data?.meta.total ?? totals?.counts?.[status] ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const filters = (
    <div
      className='flex flex-wrap gap-2'
      role='group'
      aria-label={t('runtimes.quota.workspaces')}
    >
      {(['all', 'active', 'retained', 'ended'] as const).map((value) => (
        <Button
          key={value}
          type='button'
          size='sm'
          variant={status === value ? 'default' : 'outline'}
          aria-pressed={status === value}
          onClick={() => {
            setStatus(value);
            setPage(1);
          }}
        >
          {t(`runtimes.quota.filter.${value}`)}{' '}
          <span aria-hidden className='text-xs'>
            {totals?.counts?.[value] ?? '—'}
          </span>
        </Button>
      ))}
    </div>
  );
  return (
    <div className='min-w-0 space-y-3'>
      <WorkspaceDiagnostics
        runner={{
          ...runner,
          workspaceUsage: totals
            ? {
                ...totals,
                workspaces: result.data ? [...result.data.data] : [],
              }
            : null,
        }}
        filters={filters}
        rowsPending={result.isPending}
      />
      {result.isPending ? (
        <Spinner />
      ) : result.isError ? (
        <AgLoadError
          title={t('runtimes.loadFailed')}
          error={result.error}
          onRetry={() => void result.refetch()}
        />
      ) : null}
      <RunnerPagination
        ariaLabel={t('runtimes.quota.workspaces')}
        pageLabel={t('runtimes.detail.runsPage', { page, pageCount })}
        previousLabel={t('runtimes.quota.previous')}
        nextLabel={t('runtimes.quota.next')}
        canGoPrevious={page > 1 && !result.isPending}
        canGoNext={Boolean(
          result.data &&
          page * pageSize < result.data.meta.total &&
          !result.isPending,
        )}
        onPrevious={() => setPage(page - 1)}
        onNext={() => setPage(page + 1)}
      />
    </div>
  );
}
