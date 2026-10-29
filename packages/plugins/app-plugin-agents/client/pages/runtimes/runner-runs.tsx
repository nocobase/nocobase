import { useTranslation } from '@nocobase/i18n/client';
import { useInfiniteQuery } from '@tanstack/react-query';
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
import { Button } from '../../components/ui/button.js';
import { Spinner } from '../../components/ui/spinner.js';
import { TONE_CLASS } from '../../components/ag-tag-tones.js';
import { Badge } from '../../components/ui/badge.js';
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
  const runs = useInfiniteQuery({
    queryKey: agentsKeys.runnerRuns(runnerId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api.runnerRuns(runnerId, pageParam),
    getNextPageParam: (page) => page.meta.nextCursor ?? undefined,
  });
  if (runs.isPending)
    return (
      <div className='flex justify-center py-4'>
        <Spinner />
      </div>
    );
  if (runs.isError && !runs.data)
    return (
      <p className='text-sm text-destructive'>
        {t('runtimes.detail.runsFailed')}
      </p>
    );
  if (runs.data.pages[0]?.data.length === 0)
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
          {runs.data.pages
            .flatMap((page) => page.data)
            .map((run) => (
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
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <Badge
                      variant='secondary'
                      className={TONE_CLASS[RUN_STATUS_TONE[run.status]]}
                    >
                      <span
                        aria-hidden='true'
                        className='size-1.5 rounded-full bg-current'
                      />
                      {t(`runs.status.${run.status}`)}
                    </Badge>
                    {run.failureReason === 'toolQuota' ? (
                      <QuotaLabel usage warning />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell
                  className='text-xs text-muted-foreground'
                  title={format.dateTime(run.startedAt ?? run.createdAt)}
                >
                  {compactDateTime(
                    run.startedAt ?? run.createdAt,
                    i18n.language,
                  )}
                </TableCell>
                <TableCell className='text-xs tabular-nums'>
                  {durationText(run.startedAt, run.finishedAt) ?? '—'}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {runs.hasNextPage ? (
        <div className='flex flex-col items-center gap-2 border-t p-3'>
          {runs.isFetchNextPageError ? (
            <p role='alert' className='text-sm text-destructive'>
              {t('runtimes.detail.runsFailed')}
            </p>
          ) : null}
          <Button
            variant='outline'
            disabled={runs.isFetching}
            onClick={() => void runs.fetchNextPage()}
          >
            {runs.isFetchingNextPage ? <Spinner /> : null}
            {t('agents.loadMore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
