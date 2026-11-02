import { useTranslation } from '@nocobase/i18n/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';
import { useChatPanel } from '../../chat/provider.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import {
  useFormatters,
  durationText,
  compactDateTime,
} from '../../lib/format.js';
import { RUN_STATUS_TONE } from '../../lib/runs.js';
import { Spinner } from '../../components/ui/spinner.js';
import { TONE_CLASS } from '../../components/ag-tag-tones.js';
import { Badge } from '../../components/ui/badge.js';
import { QuotaLabel } from '../../components/quota-status.js';
import { RunnerPagination } from './runner-pagination.js';
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
  onNavigate,
}: {
  readonly runnerId: string;
  readonly onNavigate: () => void;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const api = useAgentsApi();
  const { conversationPath } = useChatPanel();
  const format = useFormatters();
  const [selectedPage, setSelectedPage] = useState(0);
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
  const pageIndex = Math.min(selectedPage, runs.data.pages.length - 1);
  const page = runs.data.pages[pageIndex];
  const pageCount = Math.max(1, Math.ceil(page.meta.total / 20));
  const next = async () => {
    if (runs.data.pages[pageIndex + 1]) {
      setSelectedPage(pageIndex + 1);
      return;
    }
    const result = await runs.fetchNextPage();
    if (!result.isFetchNextPageError && result.data?.pages[pageIndex + 1])
      setSelectedPage(pageIndex + 1);
  };
  return (
    <div className='min-w-0' data-testid='runner-runs'>
      <div className='rounded-lg border'>
        <Table className='table-fixed min-w-[720px]'>
          <TableHeader>
            <TableRow>
              {[
                ['issue', 'w-44'],
                ['agent', 'w-40'],
                ['status', 'w-44'],
                ['started', 'w-32'],
                ['duration', 'w-20'],
              ].map(([key, width]) => (
                <TableHead key={key} className={width}>
                  {t(`runtimes.quota.runColumns.${key}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className='text-center text-muted-foreground'
                >
                  {t('runtimes.detail.runsEmpty')}
                </TableCell>
              </TableRow>
            ) : null}
            {page.data.map((run) => (
              <TableRow key={run.id}>
                <TableCell
                  className='max-w-44 truncate'
                  title={run.subjectLabel ?? undefined}
                >
                  {run.path ? (
                    <Link
                      to={
                        run.path.startsWith('?chat=') && conversationPath
                          ? conversationPath(
                              new URLSearchParams(run.path).get('chat')!,
                            )
                          : run.path
                      }
                      onClick={onNavigate}
                      className='hover:underline'
                    >
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
                  className='whitespace-nowrap text-xs text-muted-foreground'
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
      </div>
      <RunnerPagination
        ariaLabel={t('runtimes.detail.runsPagination')}
        pageLabel={t('runtimes.detail.runsPage', {
          page: pageIndex + 1,
          pageCount,
        })}
        previousLabel={t('runtimes.detail.runsPrevious')}
        nextLabel={t('runtimes.detail.runsNext')}
        canGoPrevious={pageIndex > 0 && !runs.isFetching}
        canGoNext={Boolean(page.meta.nextCursor) && !runs.isFetching}
        nextLoading={runs.isFetchingNextPage}
        summary={
          <p className='text-sm text-muted-foreground' aria-live='polite'>
            {t('runtimes.detail.runsTotal', { count: page.meta.total })}
          </p>
        }
        onPrevious={() => setSelectedPage(pageIndex - 1)}
        onNext={() => void next()}
      />
      {runs.isFetchNextPageError && pageIndex === runs.data.pages.length - 1 ? (
        <p role='alert' className='mt-2 text-sm text-destructive'>
          {t('runtimes.detail.runsFailed')}
        </p>
      ) : null}
    </div>
  );
}
