import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { WORKSPACE_REPORT_INTERVAL_MS } from '@nocobase/agent-protocol';
import type { RunnerSummary } from '../../../shared/runners.js';
import { AgSection } from '../../components/ag-section.js';
import { AgTag } from '../../components/ag-tag.js';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible.js';
import { useFormatters } from '../../lib/format.js';

function workspaceDiskState(
  runner: Pick<RunnerSummary, 'workspaceUsage' | 'status'>,
  now: number = Date.now(),
): { low: boolean; stale: boolean } {
  const usage = runner.workspaceUsage;
  const disk = usage?.disk;
  const measured = Date.parse(usage?.measuredAt ?? '');
  return {
    low:
      disk !== undefined &&
      disk !== null &&
      disk.minFreeBytes !== null &&
      disk.freeBytes < disk.minFreeBytes,
    stale:
      runner.status !== 'online' ||
      !Number.isFinite(measured) ||
      now - measured > (usage?.intervalMs ?? WORKSPACE_REPORT_INTERVAL_MS),
  };
}

export function WorkspaceDiskTag({
  runner,
}: {
  readonly runner: RunnerSummary;
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
  return `${(value / 1024 ** 3).toFixed(2)} GiB`;
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
    <div className='flex flex-col gap-1 text-sm [overflow-wrap:anywhere]'>
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
            </>
          )}
          <p>
            {t('runtimes.workspaces.reportedAt', {
              time: format.dateTime(usage.measuredAt),
            })}
          </p>
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
          {!usage ? (
            <p className='text-sm text-muted-foreground'>
              {t('runtimes.workspaces.notReported')}
            </p>
          ) : usage.workspaces.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('runtimes.workspaces.empty')}
            </p>
          ) : (
            usage.workspaces.map((workspace) => (
              <Collapsible
                key={workspace.workDir}
                className='min-w-0 rounded-lg border p-2'
              >
                <CollapsibleTrigger className='w-full text-left text-sm whitespace-normal [overflow-wrap:anywhere] focus-visible:outline-2'>
                  {workspace.subjectId ?? workspace.workDir.split('/').pop()} ·{' '}
                  {t(
                    workspace.settled === true
                      ? 'runtimes.workspaces.ended'
                      : workspace.settled === false
                        ? 'runtimes.workspaces.active'
                        : 'runtimes.workspaces.unknown',
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className='space-y-2 pt-2 text-sm text-muted-foreground [overflow-wrap:anywhere]'>
                  <p>{workspace.workDir}</p>
                  <p>
                    {workspace.decision
                      ? t(
                          `runtimes.workspaces.decision.${workspace.decision.reason}`,
                        )
                      : t('runtimes.workspaces.oldRunner')}
                  </p>
                  <p>
                    {workspace.cleanup
                      ? t(
                          `runtimes.workspaces.cleanup.${workspace.cleanup.reason}`,
                        )
                      : t('runtimes.workspaces.noCleanup')}
                  </p>
                  {workspace.cleanup?.reason === 'allowed' &&
                  workspace.cleanup.discardsUntracked ? (
                    <p>{t('runtimes.workspaces.discardsUntracked')}</p>
                  ) : null}
                  <p>
                    {t('runtimes.workspaces.reportedAt', {
                      time: format.dateTime(usage.measuredAt),
                    })}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </AgSection>
      ) : null}
    </>
  );
}
