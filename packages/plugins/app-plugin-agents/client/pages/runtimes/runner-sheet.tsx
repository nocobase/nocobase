/** Runtime details: shared header and independent tabs, with settings actions only on Overview. */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import {
  listedTools,
  type RunnerPatch,
  type RunnerSummary,
  type RunnerListItem,
} from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import { AgLoadError } from '../../components/ag-states.js';
import { Badge } from '../../components/ui/badge.js';
import { Button } from '../../components/ui/button.js';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../components/ui/sheet.js';
import { Spinner } from '../../components/ui/spinner.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useQuotaClock } from '../../hooks/use-quota-expiry.js';
import {
  RunnerStatusCell,
  RunnerUpgradeRequired,
  RunnerVersionCell,
} from './runner-cells.js';
import { RunnerOverview } from './runner-overview.js';
import { RunnerWorkspaces } from './runner-workspaces.js';
import { RunnerRuns } from './runner-runs.js';

export function RunnerSheet({
  runner,
  onClose,
}: {
  readonly runner: RunnerListItem | null;
  readonly onClose: () => void;
}): ReactElement {
  return (
    <Sheet
      open={runner !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        className='w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[780px]'
        data-testid='runner-sheet'
      >
        {runner ? (
          <LoadRunnerDetail key={runner.id} runner={runner} onClose={onClose} />
        ) : (
          <SheetTitle className='sr-only'>Runtime</SheetTitle>
        )}
      </SheetContent>
    </Sheet>
  );
}

function LoadRunnerDetail({
  runner,
  onClose,
}: {
  readonly runner: RunnerListItem;
  readonly onClose: () => void;
}): ReactElement {
  const api = useAgentsApi();
  const { t } = useTranslation();
  const detail = useQuery({
    queryKey: agentsKeys.runner(runner.id),
    queryFn: () => api.runner(runner.id),
  });
  if (detail.isPending || detail.isError)
    return (
      <>
        <SheetHeader>
          <SheetTitle>{runner.name}</SheetTitle>
          <SheetDescription>{t('runtimes.description')}</SheetDescription>
        </SheetHeader>
        {detail.isPending ? (
          <div className='p-4'>
            <Spinner />
          </div>
        ) : (
          <AgLoadError
            title={t('runtimes.loadFailed')}
            error={detail.error}
            onRetry={() => void detail.refetch()}
          />
        )}
      </>
    );
  return <RunnerDetail runner={detail.data} onClose={onClose} />;
}

function RunnerDetail({
  runner,
  onClose,
}: {
  readonly runner: RunnerSummary;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const query = useQueryClient();
  const [tab, setTab] = useState('overview');
  const now = useQuotaClock([
    ...(runner.unavailableModels ?? []).map((m) => m.resetsAt),
    ...(runner.quotaUsage ?? []).map((u) => u.resetsAt),
  ]);
  const marks = (runner.unavailableModels ?? []).filter(
    (m) =>
      m.reason === 'toolQuota' && (!m.resetsAt || Date.parse(m.resetsAt) > now),
  );
  const editable = runner.canManage && runner.status !== 'revoked';
  const update = useMutation({
    mutationFn: (patch: RunnerPatch) => api.updateRunner(runner.id, patch),
    onSuccess: (saved) =>
      notify.success(t('runtimes.edit.saved', { name: saved.name })),
    onError: (error) => notify.error(error),
    onSettled: () => {
      void query.invalidateQueries({ queryKey: agentsKeys.runners });
      void query.invalidateQueries({ queryKey: agentsKeys.agents });
    },
  });
  return (
    <>
      <SheetHeader className='shrink-0 border-b pr-12'>
        <SheetTitle>{runner.name}</SheetTitle>
        <SheetDescription className='flex flex-wrap gap-x-1'>
          <span>
            {[
              `${runner.os} · ${runner.arch}`,
              runner.hostname,
              runner.ownerName
                ? t('runtimes.detail.owner', { name: runner.ownerName })
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
          {runner.version ? (
            <>
              <span aria-hidden>·</span>
              <RunnerVersionCell runner={runner} plain />
            </>
          ) : null}
        </SheetDescription>
        <div className='flex flex-wrap items-center gap-2'>
          <RunnerStatusCell runner={runner} />
          {marks.length ? (
            <Badge
              variant='secondary'
              className='bg-destructive/10 text-destructive'
            >
              {t('runtimes.quota.marks', { count: marks.length })}
            </Badge>
          ) : null}
        </div>
        <div className='flex flex-wrap gap-x-3 text-xs text-muted-foreground'>
          {listedTools(runner).map((tool) => (
            <span key={tool}>
              {t(`tools.${tool}`)} {runner.activeByTool?.[tool] ?? 0}/
              {runner.toolSlots?.[tool] ?? runner.slots}
            </span>
          ))}
        </div>
      </SheetHeader>
      <Tabs value={tab} onValueChange={setTab} className='min-h-0 flex-1 gap-0'>
        <div className='shrink-0 overflow-x-auto border-b px-4'>
          <TabsList variant='line' className='w-max'>
            <TabsTrigger value='overview'>
              {t('runtimes.quota.overview')}
            </TabsTrigger>
            <TabsTrigger value='workspaces'>
              {t('runtimes.quota.workspaces')}{' '}
              <span aria-hidden className='text-xs text-muted-foreground'>
                {runner.workspaceUsage?.count ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value='runs'>
              {t('runtimes.quota.runs')}{' '}
              <span aria-hidden className='text-xs text-muted-foreground'>
                {runner.recentRunsCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          keepMounted
          value='overview'
          className='min-h-0 space-y-4 overflow-y-auto p-4'
        >
          {runner.status === 'upgrade_required' ? (
            <RunnerUpgradeRequired runner={runner} />
          ) : null}
          {!runner.canManage && !runner.canManageTools ? (
            <p className='text-sm text-muted-foreground'>
              {t('runtimes.detail.readOnly')}
            </p>
          ) : null}
          {(editable || runner.canManageTools) && runner.status === 'online' ? (
            <Button
              type='button'
              variant='outline'
              disabled={update.isPending}
              onClick={() => update.mutate({ redetectTools: true })}
            >
              {t('runtimes.tool.redetect')}
            </Button>
          ) : null}
          <RunnerOverview
            runner={runner}
            editable={editable}
            now={now}
            onSave={(patch) => update.mutate(patch)}
          />
        </TabsContent>
        <TabsContent value='workspaces' className='min-h-0 overflow-y-auto p-4'>
          <RunnerWorkspaces runner={runner} />
        </TabsContent>
        <TabsContent value='runs' className='min-h-0 overflow-y-auto p-4'>
          <RunnerRuns runnerId={runner.id} />
        </TabsContent>
        {(editable || runner.canManageTools) &&
        runner.status !== 'revoked' &&
        tab === 'overview' ? (
          <div
            data-fixed-sheet-footer
            className='flex shrink-0 justify-end gap-2 border-t bg-background p-4'
          >
            <Button
              type='button'
              variant='outline'
              className='max-sm:flex-1'
              onClick={onClose}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              type='submit'
              className='max-sm:flex-1'
              form='runtime-settings'
              disabled={update.isPending}
            >
              {update.isPending ? <Spinner /> : null}
              {t('actions.save')}
            </Button>
          </div>
        ) : null}
      </Tabs>
    </>
  );
}
