import { usePageBreadcrumb } from '@nocobase/app-client';
/**
 * Route `/agents/:agentId`: a covering child page over the agent list. Its header sums the agent up in one line (type,
 * coding tool or model, where it runs, whether it is busy); below, four tabs, the chosen one kept in `?tab=`:
 *
 * - General: basics and instructions (with "Preview brief"), and who may use it.
 * - Capabilities: the coding tool and model (an online agent's model and where it runs), skills, business capabilities
 *   and whether it confirms before changing data.
 * - Runtime (runner agents only): where it runs, the commands it may run there, and its environment variables.
 * - History: who changed what and when (`history.tsx`).
 *
 * Each tab is saved as a whole: a bar appears while any of its sections holds unsaved changes and saves them in one
 * request (`tab-draft.ts`); switching tabs or leaving the page asks first. Environment variables save row by row.
 *
 * Read-only for anyone the server says may not change it (`canEdit`: managers of agents, and its owner at the related
 * level). Every save names the revision the page shows; when someone else saved the agent meanwhile, the page reloads
 * and a dialog shows what they changed.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CopyIcon,
  Trash2Icon,
} from 'lucide-react';
import { useCallback, useState, type ReactElement } from 'react';
import { AgentAvatar } from '../../../components/agent-avatar.js';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';

import type { AgentSummary } from '../../../../shared/agents.js';
import type { RunnerSummary } from '../../../../shared/runners.js';
import { agentsKeys } from '../../../api/keys.js';
import { chatKeys } from '../../../chat/keys.js';
import { useChatApi } from '../../../chat/use-chat.js';
import { AgListSkeleton, AgLoadError } from '../../../components/ag-states.js';
import { AgTag } from '../../../components/ag-tag.js';
import { PageContainer } from '../../../components/page-container.js';
import { PageHeader } from '../../../components/page-header.js';
import { RouteChildPage } from '../../../components/route-child-page.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog.js';
import { Alert, AlertDescription } from '../../../components/ui/alert.js';
import { Button } from '../../../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import { Spinner } from '../../../components/ui/spinner.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs.js';
import { VariablesPanel } from '../../../components/variables/variables-panel.js';
import { useAgentSave } from '../../../hooks/use-agent-save.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { useAgentText } from '../../../hooks/use-vocabulary.js';
import { entryText } from '../../../lib/agents.js';
import {
  AccessSection,
  ActionsSection,
  BasicsSection,
  CommandPolicySection,
  ConfirmSection,
  ModelSection,
  PlacementSection,
  SkillsSection,
  ToolSection,
} from './sections.js';
import { AgentTypeTag } from '../../../components/agent-type.js';
import { useDefaultModelText } from '../../../hooks/use-model-catalog.js';
import { AgentChangeList, AgentHistory } from './history.js';
import { useDiscardGuard, useTabDrafts } from './tab-draft.js';
import { DiscardDialog, UnsavedBar } from './unsaved-bar.js';

const TABS = ['general', 'capabilities', 'runtime', 'history'] as const;

type AgentTab = (typeof TABS)[number];

export default function AgentDetailPage(): ReactElement {
  const { agentId = '' } = useParams();
  return (
    <RouteChildPage>
      <AgentDetailView key={agentId} agentId={agentId} />
    </RouteChildPage>
  );
}

function AgentDetailView({
  agentId,
}: {
  readonly agentId: string;
}): ReactElement {
  const { t } = useTranslation();
  const agentText = useAgentText();
  const api = useAgentsApi();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  // The revision the page held when a save was refused: the dialog shows what changed after it.
  const [conflictSince, setConflictSince] = useState<number | null>(null);
  // Raised by "Discard": every section starts again from the saved agent.
  const [generation, setGeneration] = useState(0);
  const reportConflict = useCallback(
    (revision: number) => {
      setConflictSince(revision);
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.agent(agentId),
      });
    },
    [queryClient, agentId],
  );
  const agent = useQuery({
    queryKey: agentsKeys.agent(agentId),
    queryFn: () => api.agent(agentId),
  });
  const runners = useQuery({
    queryKey: agentsKeys.runners,
    queryFn: () => api.runners(),
  });
  const save = useAgentSave(
    { id: agentId, revision: agent.data?.revision ?? 0 },
    reportConflict,
  );
  const drafts = useTabDrafts(save.isPending);
  const guard = useDiscardGuard(drafts.dirty);
  const levels = [
    { label: t('agents.title'), to: '/agents' },
    {
      label: agent.data
        ? agentText.name(agent.data)
        : t('agentDetail.breadcrumb'),
    },
  ];
  // The header's trail (the shell renders it): the list, then this agent.
  usePageBreadcrumb(levels);

  if (agent.isError && !agent.data)
    return (
      <PageContainer>
        <AgLoadError
          title={t('agentDetail.loadFailed')}
          error={agent.error}
          onRetry={() => void agent.refetch()}
        />
        <Button
          variant='outline'
          size='sm'
          nativeButton={false}
          render={<Link to='/agents' />}
        >
          {t('agentDetail.backToList')}
        </Button>
      </PageContainer>
    );
  if (!agent.data)
    return (
      <PageContainer>
        <AgListSkeleton rows={6} />
      </PageContainer>
    );

  const current = agent.data;
  const { canEdit } = current;
  const online = current.type === 'online';
  const tabs = TABS.filter((item) => !(online && item === 'runtime'));
  const requested = params.get('tab');
  const tab: AgentTab = tabs.find((item) => item === requested) ?? 'general';
  const showTab = (next: AgentTab): void =>
    setParams(
      (previous) => {
        const nextParams = new URLSearchParams(previous);
        if (next === 'general') nextParams.delete('tab');
        else nextParams.set('tab', next);
        return nextParams;
      },
      { replace: true },
    );
  // Keyed by the revision, so a save elsewhere reseeds each section instead of keeping a stale draft.
  const key = (name: string): string =>
    `${name}:${current.revision}:${generation}`;
  const saveTab = (): void => {
    const patch = drafts.collect();
    if (!patch || Object.keys(patch).length === 0) return;
    save.mutate(patch, {
      // The sections start again from what was saved at once, rather than once the agent is fetched again.
      onSuccess: (saved) =>
        queryClient.setQueryData<AgentSummary>(
          agentsKeys.agent(agentId),
          (old) => (old ? { ...old, ...saved } : old),
        ),
    });
  };
  return (
    <drafts.Provider value={drafts.registry}>
      <PageContainer>
        <PageHeader
          title={
            <span className='inline-flex flex-wrap items-center gap-3'>
              <AgentAvatar name={agentText.name(current)} />
              {agentText.name(current)}
              {current.archivedAt ? (
                <AgTag tone='grey'>{t('agents.archivedTag')}</AgTag>
              ) : null}
            </span>
          }
          description={
            <AgentSummaryLine agent={current} runners={runners.data} />
          }
          actions={
            canEdit || current.canCopy ? (
              <>
                {current.canCopy ? <CopyAsMine agent={current} /> : null}
                {canEdit ? <HeaderActions agent={current} /> : null}
              </>
            ) : undefined
          }
        />
        <Tabs
          value={tab}
          onValueChange={(value: string) => {
            const next = tabs.find((item) => item === value);
            if (next && next !== tab) guard.confirm(() => showTab(next));
          }}
        >
          <TabsList variant='line' aria-label={t('agentDetail.tabs.label')}>
            {tabs.map((item) => (
              <TabsTrigger key={item} value={item}>
                {t(`agentDetail.tabs.${item}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          {canEdit || tab === 'history' ? null : (
            <Alert>
              <AlertDescription>{t('agentDetail.readOnly')}</AlertDescription>
            </Alert>
          )}
          <TabsContent value='general' className='space-y-8 pt-4'>
            {tab === 'general' ? (
              <>
                <BasicsSection
                  key={key('basics')}
                  agent={current}
                  canEdit={canEdit}
                />
                <AccessSection
                  key={key('access')}
                  agent={current}
                  canEdit={canEdit}
                />
              </>
            ) : null}
          </TabsContent>
          <TabsContent value='capabilities' className='space-y-8 pt-4'>
            {tab === 'capabilities' ? (
              <>
                {/* An online agent talks to a model on the server: no coding tool or runtime; its skills are read, never run. */}
                {online ? (
                  <ModelSection
                    key={key('model')}
                    agent={current}
                    canEdit={canEdit}
                  />
                ) : (
                  <ToolSection
                    key={key('tool')}
                    agent={current}
                    runners={runners.data}
                    canEdit={canEdit}
                  />
                )}
                <SkillsSection
                  key={key('skills')}
                  agent={current}
                  canEdit={canEdit}
                />
                <ActionsSection
                  key={key('actions')}
                  agent={current}
                  canEdit={canEdit}
                />
                <ConfirmSection
                  key={key('confirm')}
                  agent={current}
                  canEdit={canEdit}
                />
                {online ? (
                  <PlacementSection
                    key={key('placement')}
                    agent={current}
                    runners={runners.data}
                    canEdit={canEdit}
                  />
                ) : null}
              </>
            ) : null}
          </TabsContent>
          {online ? null : (
            <TabsContent value='runtime' className='space-y-8 pt-4'>
              {tab === 'runtime' ? (
                <>
                  <PlacementSection
                    key={key('placement')}
                    agent={current}
                    runners={runners.data}
                    canEdit={canEdit}
                  />
                  <CommandPolicySection
                    key={key('commands')}
                    agent={current}
                    canEdit={canEdit}
                  />
                  <VariablesPanel
                    scope='agent'
                    scopeId={current.id}
                    canEdit={canEdit}
                    title={t('envVars.title')}
                    description={t('envVars.description')}
                  />
                </>
              ) : null}
            </TabsContent>
          )}
          <TabsContent value='history' className='pt-4'>
            {tab === 'history' ? <AgentHistory agentId={current.id} /> : null}
          </TabsContent>
        </Tabs>
        {drafts.dirty ? (
          <UnsavedBar
            pending={save.isPending}
            onDiscard={() => setGeneration((value) => value + 1)}
            onSave={saveTab}
          />
        ) : null}
        <DiscardDialog guard={guard} />
        <ConflictDialog
          agentId={current.id}
          since={conflictSince}
          onClose={() => setConflictSince(null)}
        />
      </PageContainer>
    </drafts.Provider>
  );
}

/**
 * The header's one line about the agent: its type, its coding tool (and model) or model, where it runs, whether it is
 * working now, and its owner.
 */
function AgentSummaryLine({
  agent,
  runners,
}: {
  readonly agent: AgentSummary;
  readonly runners: readonly RunnerSummary[] | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const online = agent.type === 'online';
  const runnerName = (id: string): string =>
    runners?.find((runner) => runner.id === id)?.name ?? id;
  const defaultModel = useDefaultModelText();
  const [first, ...others] = agent.modelEntries;
  const engine = first
    ? `${entryText(first, t)}${others.length > 0 ? ` +${others.length}` : ''}`
    : online && defaultModel
      ? t('agents.defaultModelShort', { model: defaultModel })
      : t('agents.needsModel');
  const placement = online
    ? t('agentTypes.onServer')
    : agent.runnerIds.length === 0
      ? t('agents.anyRunner')
      : agent.runnerIds.map(runnerName).join(', ');
  const busy = agent.activeRuns > 0;
  return (
    <span
      data-testid='agent-summary'
      className='flex flex-wrap items-center gap-x-2 gap-y-1'
    >
      <AgentTypeTag type={agent.type} />
      <span>{engine}</span>
      <span aria-hidden='true'>·</span>
      <span>{placement}</span>
      <span aria-hidden='true'>·</span>
      <AgTag tone={busy ? 'blue' : 'green'} dot>
        {busy
          ? t('agentDetail.busy', { count: agent.activeRuns })
          : t('agentDetail.free')}
      </AgTag>
      {/* Nothing can take its work now: no runner online, or its model no longer offered. */}
      {agent.onlineRunners === 0 ? (
        <AgTag tone='red' dot>
          {online
            ? agent.modelEntries.length === 0
              ? t('agents.needsModel')
              : t('agents.modelUnavailable')
            : t('agents.onlineCount', { count: 0 })}
        </AgTag>
      ) : null}
      <span aria-hidden='true'>·</span>
      <span>{t('agentDetail.owner', { name: agent.ownerName ?? '—' })}</span>
    </span>
  );
}

/** What changed since the revision a refused save was made against; the page behind has already reloaded. */
function ConflictDialog({
  agentId,
  since,
  onClose,
}: {
  readonly agentId: string;
  readonly since: number | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const changes = useQuery({
    queryKey: [...agentsKeys.agentHistory(agentId), 'since', since],
    queryFn: () => api.agentHistory(agentId, since ?? 0),
    enabled: since !== null,
  });
  return (
    <Dialog
      open={since !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('agentDetail.conflict.title')}</DialogTitle>
          <DialogDescription>
            {t('agentDetail.conflict.description')}
          </DialogDescription>
        </DialogHeader>
        <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4'>
          {changes.data ? (
            <AgentChangeList entries={changes.data} />
          ) : (
            <Skeleton className='h-24 w-full' />
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t('agentDetail.conflict.ok')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Copy as my agent": a private copy of the agent that only the caller may use, with its instructions, business actions
 * and settings (`ChatApi.copyAgent`); the page then opens the copy, to edit it. Making it the default chat agent is the
 * Preferences page's choice.
 */
function CopyAsMine({ agent }: { readonly agent: AgentSummary }): ReactElement {
  const { t } = useTranslation();
  const agentText = useAgentText();
  const chat = useChatApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const copy = useMutation({
    mutationFn: () =>
      chat.copyAgent(agent.id, {
        name: t('agentDetail.copyName', { name: agentText.name(agent) }),
      }),
    onSuccess: (copied) => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      notify.success(t('agentDetail.copied', { name: copied.name }));
      void navigate(`/agents/${encodeURIComponent(copied.id)}`);
    },
    onError: (error) => notify.error(error),
  });
  return (
    <Button
      variant='outline'
      disabled={copy.isPending}
      onClick={() => copy.mutate()}
    >
      {copy.isPending ? (
        <Spinner data-icon='inline-start' />
      ) : (
        <CopyIcon data-icon='inline-start' />
      )}
      {t('agentDetail.copyAsMine')}
    </Button>
  );
}

/** Archive or restore, and delete once archived (an application may archive first). */
function HeaderActions({
  agent,
}: {
  readonly agent: AgentSummary;
}): ReactElement {
  const { t } = useTranslation();
  const agentText = useAgentText();
  const api = useAgentsApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
    void queryClient.invalidateQueries({
      queryKey: agentsKeys.agent(agent.id),
    });
    void queryClient.invalidateQueries({
      queryKey: agentsKeys.agentHistory(agent.id),
    });
  };
  const archive = useMutation({
    mutationFn: () =>
      agent.archivedAt
        ? api.restoreAgent(agent.id)
        : api.archiveAgent(agent.id),
    onSuccess: (saved) =>
      notify.success(
        t(saved.archivedAt ? 'agents.archived' : 'agents.restored', {
          name: agentText.name(saved),
        }),
      ),
    onError: (error) => notify.error(error),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: () => api.deleteAgent(agent.id),
    onSuccess: () => {
      notify.success(t('agentDetail.deleted', { name: agentText.name(agent) }));
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void navigate('/agents');
    },
    onError: (error) => notify.error(error, t('agentDetail.activeRuns')),
  });
  return (
    <>
      <Button
        variant='outline'
        disabled={archive.isPending}
        onClick={() => archive.mutate()}
      >
        {agent.archivedAt ? (
          <ArchiveRestoreIcon data-icon='inline-start' />
        ) : (
          <ArchiveIcon data-icon='inline-start' />
        )}
        {agent.archivedAt ? t('agents.restore') : t('agents.archive')}
      </Button>
      {agent.archivedAt ? (
        <Button
          variant='outline'
          disabled={remove.isPending}
          onClick={() => setDeleting(true)}
        >
          <Trash2Icon data-icon='inline-start' />
          {t('agentDetail.delete')}
        </Button>
      ) : null}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('agentDetail.deleteTitle', { name: agentText.name(agent) })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('agentDetail.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                setDeleting(false);
                remove.mutate();
              }}
            >
              {t('agentDetail.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
