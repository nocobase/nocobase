/**
 * The agents' runs on an issue, presented with the installed `agent-run-history` over the agents plugin's headless hooks
 * (`client/runs`): the side column's log, who is working now in the meta line, each run on the activity line, and a
 * run's transcript in the issue's `runs/:runId` dialog. Every transcript link is relative to the issue page. The wording
 * is the agents plugin's own (its namespace), filled into the item's labels here.
 */
import { useClientApplication } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import type { SubjectRun } from '@nocobase/app-plugin-agents/client/runs';
import {
  useAgentNames,
  useRetryRun,
  useRunBrief,
  useRunWithTranscript,
  useStopRun,
  useWorkspaceReset,
} from '@nocobase/app-plugin-agents/client/runs';
import { ACCESS_NAMESPACE as AGENTS_NS } from '@nocobase/app-plugin-agents/shared/access';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import { useNotify } from '@nocobase/app-plugin-projects/client/issues';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { EraserIcon, FileTextIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import {
  RunActions,
  RunActivityRow,
  RunBrief,
  RunHeader,
  AgentRunHistory,
  RunLivePill,
  RunTranscript,
  type AgentRunHistoryLabels,
  type AgentRunHistoryRun,
  type RunTranscriptLabels,
} from '@/components/agent-run-history';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import { useIssueRuns } from './use-issue-runs.js';

const SUBJECT = 'issue';
const AGENT_KIND = 'agent';
const STATUSES = [
  'queued',
  'dispatched',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;
const OPEN: ReadonlySet<string> = new Set(['queued', 'dispatched', 'running']);
const KINDS = [
  'text',
  'thinking',
  'toolUse',
  'toolResult',
  'allowed',
  'denied',
  'input',
  'checkout',
  'status',
  'error',
  'usage',
] as const;

/** Every transcript link is relative to the issue page. */
const runHref = (run: { readonly id: string }): string =>
  `runs/${encodeURIComponent(run.id)}`;

type T = (key: string, options?: Record<string, unknown>) => string;

/** The agents plugin's wording, with i18next's placeholders turned into the item's `{name}` ones. */
function useRunWording(): {
  readonly t: T;
  readonly history: AgentRunHistoryLabels;
  readonly transcript: RunTranscriptLabels;
  readonly failure: (reason: string | null | undefined) => string | null;
} {
  const { t } = useTranslation(AGENTS_NS);
  return useMemo(() => {
    const keep = (...names: string[]) =>
      Object.fromEntries(names.map((name) => [name, `{${name}}`]));
    const per = <K extends string>(
      keys: readonly K[],
      text: (key: K) => string,
    ): Record<K, string> =>
      Object.fromEntries(keys.map((key) => [key, text(key)])) as Record<
        K,
        string
      >;
    return {
      t,
      history: {
        title: t('runs.title'),
        empty: t('runs.empty'),
        status: {
          ...per(STATUSES, (key) => t(`runs.status.${key}`)),
          stopping: t('runs.status.cancelling'),
        },
        activity: per(STATUSES, (key) =>
          t(`runs.activity.${key}`, keep('name')),
        ),
        live: {
          working: t('runs.live.working', keep('name')),
          workingFor: t('runs.live.workingFor', keep('name', 'minutes')),
          queued: t('runs.live.queued', keep('name')),
        },
        viewTranscript: t('runs.viewTranscript'),
        stop: t('runs.cancel'),
        retry: t('runs.retry'),
        viewAll: t('runs.viewAll', keep('count')),
        allTitle: t('runs.allTitle', keep('count')),
        filterAgent: t('runs.filters.agent'),
        filterStatus: t('runs.filters.status'),
        allAgents: t('runs.filters.allAgents'),
        allStatuses: t('runs.filters.allStatuses'),
        noMatch: t('runs.noMatch'),
      },
      transcript: {
        waiting: t('transcript.waiting'),
        empty: t('transcript.empty'),
        fetchFailed: t('transcript.fetchFailed'),
        expand: t('transcript.expand'),
        truncated: t('transcript.truncated'),
        events: t('transcript.title'),
        inputDelivered: t('transcript.inputDelivered_other', keep('count')),
        tokens: t('transcript.tokens', keep('input', 'output')),
        kinds: per(KINDS, (key) => t(`transcript.kinds.${key}`)),
      },
      failure: (reason) =>
        reason ? t(`failures.${reason}`, { defaultValue: reason }) : null,
    };
  }, [t]);
}

function useHistoryRuns(
  runs: readonly (Run | SubjectRun)[],
  failure: (reason: string | null | undefined) => string | null,
  unknownAgent: string,
): readonly AgentRunHistoryRun[] {
  const agentName = useAgentNames();
  return runs.map((run) => ({
    id: run.id,
    agentId: run.agentId,
    agentName: agentName(run.agentId) ?? unknownAgent,
    status: run.status,
    stopping: run.cancelRequestedAt !== null,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    failure: failure(run.failureReason),
  }));
}

function useIssueHistoryRuns(issue: IssueDetail): {
  readonly runs: readonly AgentRunHistoryRun[] | undefined;
  readonly wording: ReturnType<typeof useRunWording>;
} {
  const wording = useRunWording();
  const subjectRuns = useIssueRuns(issue);
  const runs = useHistoryRuns(
    subjectRuns,
    wording.failure,
    wording.t('runs.unknownAgent'),
  );
  return { runs, wording };
}

/** Confirms, then asks a run to stop. */
function StopConfirm({
  run,
  onClose,
}: {
  readonly run: AgentRunHistoryRun | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation(AGENTS_NS);
  const stop = useStopRun();
  const notify = useNotify();
  return (
    <AlertDialog
      open={run !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('runs.cancelTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('runs.cancelDescription', { name: run?.agentName ?? '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.back')}</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            onClick={() => {
              if (run)
                stop.mutate(run.id, {
                  onSuccess: () => notify.success(t('runs.cancelRequested')),
                  onError: (error) => notify.error(error),
                });
              onClose();
            }}
          >
            {t('runs.cancel')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** "Clean working directory", after asking. */
function WorkspaceReset({
  issueId,
}: {
  readonly issueId: string;
}): ReactElement {
  const { t } = useTranslation(AGENTS_NS);
  const notify = useNotify();
  const reset = useWorkspaceReset(SUBJECT, issueId);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <Button
        variant='ghost'
        size='xs'
        disabled={reset.isPending}
        onClick={() => setConfirming(true)}
      >
        <EraserIcon data-icon='inline-start' />
        {t('runs.workspaceReset.button')}
      </Button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('runs.workspaceReset.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('runs.workspaceReset.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                setConfirming(false);
                reset.mutate(undefined, {
                  onSuccess: () =>
                    notify.success(t('runs.workspaceReset.done')),
                  onError: (error) => notify.error(error),
                });
              }}
            >
              {t('runs.workspaceReset.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * The side column's execution log: of an issue an agent executes even before its first run, of any other issue once
 * it has runs.
 */
export function IssueRunPanel({
  issue,
}: {
  readonly issue: IssueDetail;
}): ReactElement | null {
  const navigate = useNavigate();
  const { runs, wording } = useIssueHistoryRuns(issue);
  const [stopping, setStopping] = useState<AgentRunHistoryRun | null>(null);
  const { i18n } = useTranslation();
  if (issue.executor?.type !== AGENT_KIND && (runs?.length ?? 0) === 0)
    return null;
  return (
    <>
      <AgentRunHistory
        runs={runs}
        runHref={runHref}
        onOpenRun={(run) => void navigate(runHref(run))}
        onStop={setStopping}
        actions={<WorkspaceReset issueId={issue.id} />}
        locale={i18n.language}
        labels={wording.history}
        className='border-t pt-6'
      />
      <StopConfirm run={stopping} onClose={() => setStopping(null)} />
    </>
  );
}

/** Who is working on the issue now, for the meta line; nothing while no run is open. */
export function IssueLiveRun({
  issue,
}: {
  readonly issue: IssueDetail;
}): ReactElement | null {
  const navigate = useNavigate();
  const { runs, wording } = useIssueHistoryRuns(issue);
  return (
    <RunLivePill
      runs={runs}
      runHref={runHref}
      onOpenRun={(run) => void navigate(runHref(run))}
      labels={wording.history}
    />
  );
}

/** A run's row on the issue's activity line. */
export function IssueRunRow({
  issue,
  runId,
}: {
  readonly issue: IssueDetail;
  readonly runId: string;
}): ReactElement | null {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { runs, wording } = useIssueHistoryRuns(issue);
  const run = runs?.find((candidate) => candidate.id === runId);
  if (!run) return null;
  return (
    <RunActivityRow
      run={run}
      runHref={runHref}
      onOpenRun={(target) => void navigate(runHref(target))}
      locale={i18n.language}
      labels={wording.history}
    />
  );
}

/** "View brief": the brief the run's latest attempt was given. */
function BriefButton({ runId }: { readonly runId: string }): ReactElement {
  const { t } = useTranslation(AGENTS_NS);
  const [open, setOpen] = useState(false);
  const brief = useRunBrief(runId, open);
  let body: ReactNode = <Skeleton className='h-40 w-full' />;
  if (brief.isError)
    body = (
      <p className='text-sm text-muted-foreground'>
        {t('runs.briefUnavailable')}
      </p>
    );
  else if (brief.data)
    body = (
      <RunBrief
        sections={[
          ...(['system', 'task', 'context', 'agent'] as const).map((key) => ({
            key,
            title: t(`brief.layers.${key}`),
            text: brief.data.layers[key],
          })),
          {
            key: 'turn',
            title: t('brief.layers.turn'),
            text: brief.data.turn,
          },
        ]}
        emptyText={t('brief.empty')}
        note={t('brief.placeholders')}
      />
    );
  return (
    <>
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <FileTextIcon data-icon='inline-start' />
        {t('runs.viewBrief')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-4xl'>
          <DialogHeader>
            <DialogTitle>{t('runs.briefTitle')}</DialogTitle>
            <DialogDescription>{t('runs.briefDescription')}</DialogDescription>
          </DialogHeader>
          <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4'>
            {open ? body : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A run's transcript, for the `runs/:runId` dialog: its state and agent, Stop, Retry and the brief, then the events. */
export function IssueRunTranscript({
  runId,
  renderMarkdown,
}: {
  readonly runId: string;
  readonly renderMarkdown?: (text: string) => ReactNode;
}): ReactElement {
  const navigate = useNavigate();
  const { i18n, t: appT } = useTranslation();
  const wording = useRunWording();
  const { t } = wording;
  const notify = useNotify();
  const { run, events, failed, trigger } = useRunWithTranscript(runId);
  const { session } = useAuthentication();
  const app = useClientApplication();
  const preferenceKey = session?.user.id
    ? `studio:run-transcript:${JSON.stringify([app.config.get<string>('app.basePath', '/'), session.user.id])}`
    : undefined;
  const retry = useRetryRun();
  const [stopping, setStopping] = useState<AgentRunHistoryRun | null>(null);
  const [shown] = useHistoryRuns(
    run.data ? [run.data] : [],
    wording.failure,
    t('runs.unknownAgent'),
  );
  if (run.isError && !run.data)
    return (
      <p className='text-sm text-destructive'>{t('transcript.notFound')}</p>
    );
  const detail = run.data;
  const pending = detail
    ? detail.inputs.filter((input) => input.handledAt === null).length
    : 0;
  const header = shown ? (
    <RunHeader
      run={shown}
      trigger={trigger}
      attempt={
        detail && detail.maxAttempts > 1
          ? t('runs.attempt', {
              attempt: detail.attempt,
              max: detail.maxAttempts,
            })
          : null
      }
      labels={wording.history}
      actions={
        <>
          {detail?.dispatchedAt ? <BriefButton runId={runId} /> : null}
          <RunActions
            run={shown}
            labels={wording.history}
            busy={retry.isPending}
            onStop={() => setStopping(shown)}
            onRetry={() =>
              retry.mutate(runId, {
                onSuccess: (next) => {
                  notify.success(t('runs.retried'));
                  void navigate(`../${encodeURIComponent(next.id)}`, {
                    relative: 'path',
                  });
                },
                onError: (error) => notify.error(error),
              })
            }
          />
        </>
      }
    />
  ) : (
    <Skeleton className='h-10 w-2/3' />
  );
  const duration =
    detail?.startedAt && detail.finishedAt
      ? Math.round(
          (new Date(detail.finishedAt).getTime() -
            new Date(detail.startedAt).getTime()) /
            1000,
        )
      : null;
  // The entry of the agent's list the run worked with: a coding tool and model, or a model service and model, and its effort.
  const effort = detail?.effort
    ? ` · ${t(`agentForm.efforts.${detail.effort}`, { defaultValue: detail.effort })}`
    : '';
  const used = detail?.tool
    ? `${t(`tools.${detail.tool}`)} · ${detail.model ?? t('agents.defaultModel')}${effort}`
    : detail?.modelService
      ? `${detail.modelService} · ${detail.model ?? ''}${effort}`
      : null;
  const summary = detail ? (
    <>
      <p className='text-xs text-muted-foreground'>
        {t('transcript.summary', {
          created: new Date(detail.createdAt).toLocaleString(i18n.language),
          count: events?.length ?? 0,
        })}
        {used ? (
          <span data-testid='run-model'>
            {` · ${t('modelEntries.used', { model: used })}`}
          </span>
        ) : null}
        {duration !== null
          ? ` · ${t('transcript.took', { duration: `${duration}s` })}`
          : ''}
        {pending > 0
          ? ` · ${t('transcript.pendingInputs', { count: pending })}`
          : ''}
      </p>
      {shown?.failure ? (
        <p className='text-sm text-destructive'>
          {shown.failure}
          {detail.failureDetail ? ` — ${detail.failureDetail}` : ''}
        </p>
      ) : null}
      {detail.summary ? <p className='text-sm'>{detail.summary}</p> : null}
    </>
  ) : null;
  return (
    <>
      <RunTranscript
        header={header}
        summary={summary}
        events={events}
        {...(preferenceKey ? { preferenceKey } : {})}
        filterLabels={{
          title: appT('runTranscriptFilters.title'),
          groups: {
            agent: appT('runTranscriptFilters.agent'),
            input: appT('runTranscriptFilters.input'),
            tools: appT('runTranscriptFilters.tools'),
            thinking: appT('runTranscriptFilters.thinking'),
            system: appT('runTranscriptFilters.system'),
          },
          hiddenGroup: appT('runTranscriptFilters.hiddenGroup', {
            count: '{count}',
            group: '{group}',
          }),
          expandHidden: appT('runTranscriptFilters.expandHidden', {
            summary: '{summary}',
          }),
          errorsAlwaysVisible: appT('runTranscriptFilters.errorsAlwaysVisible'),
        }}
        open={!detail || OPEN.has(detail.status)}
        failed={failed}
        locale={i18n.language}
        labels={wording.transcript}
        {...(renderMarkdown ? { renderMarkdown } : {})}
      />
      <StopConfirm run={stopping} onClose={() => setStopping(null)} />
    </>
  );
}
