import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import {
  useFormatters,
  durationText,
  compactDateTime,
} from '../../lib/format.js';
import { RUN_STATUS_TONE } from '../../lib/runs.js';
import { Spinner } from '../../components/ui/spinner.js';
import { AgTag } from '../../components/ag-tag.js';
import { QuotaLabel } from '../../components/quota-status.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
export function RunnerRuns({
  runnerId,
}: {
  readonly runnerId: string;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useAgentsApi();
  const format = useFormatters();
  const runs = useQuery({
    queryKey: agentsKeys.runnerRuns(runnerId),
    queryFn: () => api.runnerRuns(runnerId),
  });
  if (runs.isPending)
    return (
      <div className='flex justify-center py-4'>
        <Spinner />
      </div>
    );
  if (runs.isError)
    return (
      <p className='text-sm text-destructive'>
        {t('runtimes.detail.runsFailed')}
      </p>
    );
  if (runs.data.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('runtimes.detail.runsEmpty')}
      </p>
    );
  return (
    <div className='min-w-0 rounded-lg border' data-testid='runner-runs'>
      <Table className='table-fixed min-w-[720px]'>
        <TableHeader>
          <TableRow>
            {[
              ['issue', 'w-44'],
              ['agent', 'w-40'],
              ['status', 'w-44'],
              ['started', 'w-24'],
              ['duration', 'w-20'],
            ].map(([key, width]) => (
              <TableHead key={key} className={width}>
                {t(`runtimes.quota.runColumns.${key}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.data.map((run) => (
            <TableRow key={run.id}>
              <TableCell
                className='max-w-44 truncate'
                title={run.subjectLabel ?? undefined}
              >
                {run.path ? (
                  <Link to={run.path} className='hover:underline'>
                    {run.subjectLabel ?? run.title}
                  </Link>
                ) : (
                  (run.subjectLabel ?? '—')
                )}
              </TableCell>
              <TableCell className='max-w-40 truncate' title={run.title}>
                {run.title}
              </TableCell>
              <TableCell>
                <AgTag tone={RUN_STATUS_TONE[run.status]} dot>
                  {t(`runs.status.${run.status}`)}
                </AgTag>
                {run.failureReason === 'toolQuota' ? (
                  <QuotaLabel usage />
                ) : null}
              </TableCell>
              <TableCell
                className='text-xs text-muted-foreground'
                title={format.dateTime(run.startedAt ?? run.createdAt)}
              >
                {compactDateTime(run.startedAt ?? run.createdAt, i18n.language)}
              </TableCell>
              <TableCell className='text-xs tabular-nums'>
                {durationText(run.startedAt, run.finishedAt) ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
