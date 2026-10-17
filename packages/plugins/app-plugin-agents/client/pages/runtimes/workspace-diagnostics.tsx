import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { WORKSPACE_REPORT_INTERVAL_MS } from '@nocobase/agent-protocol';
import {
  runnerLowOnDisk,
  workspaceCategory,
  type RunnerSummary,
  type RunnerListItem,
} from '../../../shared/runners.js';
import { AgSection } from '../../components/ag-section.js';
import { AgTag } from '../../components/ag-tag.js';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert.js';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '../../components/ui/table.js';
import { useFormatters } from '../../lib/format.js';

function workspaceDiskState(
  runner: Pick<RunnerListItem, 'workspaceUsage' | 'status'>,
  now: number = Date.now(),
): { low: boolean; stale: boolean } {
  const usage = runner.workspaceUsage;
  const measured = Date.parse(usage?.diskMeasuredAt ?? usage?.measuredAt ?? '');
  return {
    low: runnerLowOnDisk(runner),
    stale:
      runner.status !== 'online' ||
      !Number.isFinite(measured) ||
      now - measured >
        (usage?.diskMeasuredAt
          ? 60_000
          : (usage?.intervalMs ?? WORKSPACE_REPORT_INTERVAL_MS)),
  };
}

export function WorkspaceDiskTag({
  runner,
}: {
  readonly runner: RunnerListItem;
}): ReactElement | null {
  const { t } = useTranslation();
  const { low, stale } = workspaceDiskState(runner);
  return low ? (
    <AgTag tone='amber'>
      {t(stale ? 'runtimes.workspaces.previousLow' : 'runtimes.workspaces.low')}
    </AgTag>
  ) : null;
}

function bytes(value: number): string {
  const power =
    value >= 1024 ** 3 ? 3 : value >= 1024 ** 2 ? 2 : value >= 1024 ? 1 : 0;
  return `${(value / 1024 ** power).toFixed(2)} ${['B', 'KiB', 'MiB', 'GiB'][power]}`;
}

export function WorkspaceDiagnostics({
  runner,
}: {
  readonly runner: RunnerSummary;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const usage = runner.workspaceUsage;
  const { low, stale } = workspaceDiskState(runner);
  const summary = (
    <div className='grid gap-2 rounded-lg border p-4 text-sm sm:grid-cols-2 [overflow-wrap:anywhere]'>
      {usage?.totalBytes !== undefined ? (
        <p>
          {t('runtimes.quota.workspaceSize', {
            value: `${usage.sizeUnknownCount ? '≥ ' : ''}${bytes(usage.totalBytes)}`,
          })}
        </p>
      ) : null}
      {!usage ? (
        <p>{t('runtimes.workspaces.notReported')}</p>
      ) : (
        <>
          {!usage.disk ? (
            <p>{t('runtimes.workspaces.diskUnknown')}</p>
          ) : (
            <>
              <p>
                {t('runtimes.workspaces.free', {
                  value: bytes(usage.disk.freeBytes),
                })}
              </p>
              <p>
                {usage.disk.minFreeBytes === null
                  ? t('runtimes.workspaces.thresholdOff')
                  : t('runtimes.workspaces.threshold', {
                      value: bytes(usage.disk.minFreeBytes),
                    })}
              </p>
              <div
                className='relative h-1.5 rounded-full bg-muted sm:col-span-2'
                aria-hidden='true'
              >
                <div
                  className='h-full bg-primary'
                  style={{
                    width: `${Math.max(0, Math.min(100, (1 - usage.disk.freeBytes / Math.max(1, usage.disk.totalBytes)) * 100))}%`,
                  }}
                />
                {usage.disk.minFreeBytes !== null ? (
                  <span
                    data-testid='minimum-free-marker'
                    className='absolute -top-1 h-3.5 w-0.5 bg-amber-600'
                    style={{
                      left: `${Math.max(0, Math.min(100, (1 - usage.disk.minFreeBytes / Math.max(1, usage.disk.totalBytes)) * 100))}%`,
                    }}
                  />
                ) : null}
              </div>
            </>
          )}
          <p className='text-xs text-muted-foreground sm:col-span-2'>
            {t('runtimes.workspaces.reportedAt', {
              time: format.dateTime(usage.diskMeasuredAt ?? usage.measuredAt),
            })}
          </p>
          {low && !stale ? <p>{t('runtimes.workspaces.paused')}</p> : null}
          {stale ? <p>{t('runtimes.workspaces.stale')}</p> : null}
        </>
      )}
    </div>
  );
  return (
    <>
      {low ? (
        <Alert>
          <AlertTitle>{t('runtimes.workspaces.low')}</AlertTitle>
          <AlertDescription>{summary}</AlertDescription>
        </Alert>
      ) : (
        summary
      )}
      {runner.canSeeMachine === true ? (
        <AgSection
          id='workspace-diagnostics'
          title={t('runtimes.workspaces.title')}
        >
          {!usage || !usage.measuredAt ? (
            <p className='text-sm text-muted-foreground'>
              {t('runtimes.workspaces.notReported')}
            </p>
          ) : usage.workspaces.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('runtimes.workspaces.empty')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    'directory',
                    'type',
                    'size',
                    'push',
                    'status',
                    'lastUsed',
                  ].map((key) => (
                    <TableHead key={key}>
                      {t(`runtimes.quota.columns.${key}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {usage.workspaces.map((workspace) => (
                  <TableRow key={workspace.workDir}>
                    <TableCell className='max-w-48'>
                      <div className='truncate'>
                        {workspace.subjectKey ??
                          workspace.subjectId ??
                          workspace.workDir.split('/').pop()}
                      </div>
                      <div
                        title={workspace.workDir}
                        className='truncate font-mono text-xs text-muted-foreground'
                      >
                        {workspace.workDir}
                      </div>
                    </TableCell>
                    <TableCell>
                      {t(
                        workspace.workDir.includes('.readonly-')
                          ? 'runtimes.quota.readOnly'
                          : 'runtimes.quota.working',
                      )}
                    </TableCell>
                    <TableCell>
                      {workspace.sizeBytes === undefined
                        ? '—'
                        : bytes(workspace.sizeBytes)}
                    </TableCell>
                    <TableCell>
                      <AgTag tone={workspace.unpushed ? 'amber' : 'green'}>
                        {t(
                          workspace.unpushed
                            ? 'runtimes.quota.unpushed'
                            : 'runtimes.quota.clean',
                        )}
                      </AgTag>
                    </TableCell>
                    <TableCell className='max-w-48 whitespace-normal'>
                      {workspaceCategory(workspace) === 'retained' ? (
                        <AgTag tone='amber'>
                          {t('runtimes.quota.filter.retained')}
                        </AgTag>
                      ) : null}
                      <span>
                        {workspace.cleanup &&
                        workspaceCategory(workspace) === 'retained'
                          ? t(
                              `runtimes.workspaces.cleanup.${workspace.cleanup.reason}`,
                            )
                          : workspace.decision
                            ? t(
                                `runtimes.workspaces.decision.${workspace.decision.reason}`,
                              )
                            : t(
                                workspace.settled === false
                                  ? 'runtimes.workspaces.active'
                                  : workspace.settled === true
                                    ? 'runtimes.workspaces.ended'
                                    : 'runtimes.workspaces.unknown',
                              )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format.relative(workspace.lastUsedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AgSection>
      ) : null}
    </>
  );
}
