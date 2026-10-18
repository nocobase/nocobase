import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { RunnerSummary } from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { AgLoadError } from '../../components/ag-states.js';
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { WorkspaceDiagnostics } from './workspace-diagnostics.js';

export function RunnerWorkspaces({
  runner,
}: {
  readonly runner: RunnerSummary;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const result = useQuery({
    queryKey: [...agentsKeys.runners, 'workspaces', runner.id, status, page],
    queryFn: () => api.runnerWorkspaces(runner.id, status, page),
  });
  const totals = result.data?.meta.usage ?? runner.workspaceUsage;
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
      <div className='flex gap-2'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={page === 1 || result.isPending}
          onClick={() => setPage(page - 1)}
        >
          {t('runtimes.quota.previous')}
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={
            !result.data ||
            page * result.data.meta.pageSize >= result.data.meta.total ||
            result.isPending
          }
          onClick={() => setPage(page + 1)}
        >
          {t('runtimes.quota.next')}
        </Button>
      </div>
    </div>
  );
}
