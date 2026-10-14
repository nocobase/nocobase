import { Empty, EmptyDescription } from '#components/ui/empty';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
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
import type { WorkflowSummary } from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels } from './hooks.js';

export default function DefinitionsPage(): ReactElement {
  const [sort, setSort] = useState<{
    ascending: boolean;
  }>();
  const { t } = useTranslation();
  const labels = useWorkflowLabels();
  const location = useLocation();
  const request = useWorkflowData<{ data: readonly WorkflowSummary[] }>(
    'workflows/definitions',
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
      onClick={() =>
        setSort({
          ascending: sort ? !sort.ascending : true,
        })
      }
    >
      {t('workflows.executionCount')}
      {sort && (sort.ascending ? <ArrowUp /> : <ArrowDown />)}
    </Button>
  );
  return (
    <section className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-base font-medium'>{t('workflows.definitions')}</h2>
        <Button
          variant='outline'
          disabled={request.loading}
          onClick={request.reload}
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
                      className='font-medium text-primary underline-offset-4 hover:underline'
                      to={{
                        pathname: `/workflows/definitions/${workflow.id}`,
                        search: location.search,
                      }}
                    >
                      {labels.title(workflow)}
                    </Link>
                    <p className='text-xs text-muted-foreground'>
                      {workflow.name}
                    </p>
                  </TableCell>
                  <TableCell className='px-3 text-right tabular-nums'>
                    <Link
                      className='text-primary underline-offset-4 hover:underline'
                      to={{
                        pathname: '/workflows/executions',
                        search: new URLSearchParams({
                          workflowId: workflow.id,
                        }).toString(),
                      }}
                      aria-label={`${labels.title(workflow)}: ${t('workflows.viewExecutions')} (${workflow.executionCount})`}
                    >
                      {workflow.executionCount}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {request.data?.data.length === 0 && (
        <Empty>
          <EmptyDescription>{t('workflows.noDefinitions')}</EmptyDescription>
        </Empty>
      )}
      <Outlet />
    </section>
  );
}
