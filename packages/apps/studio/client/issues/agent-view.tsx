/**
 * The Agent view: what the agents are doing with the page's issues, as a queue (the installed `agent-queue` block),
 * from Studio's agent board (`GET /api/agentBoard`, `agents/board/api.ts`), which composes the agents and
 * projects plugins and keeps to what the viewer may see. The page's search and filters narrow it on the server;
 * "Only mine" is `?mine=1`, offered unless the page shows only the viewer's issues already (`mineToggle`). The idle
 * issues unfold while the page is searched or filtered; "Start" on one starts its agent
 * (`POST /api/agentBoard/issues/:issueId/start`). It stays live as the board query does: announcements refetch it,
 * and it polls while visible. A queued issue says why it waits in short; unfolding it reads the exact reason
 * (`GET /api/agentBoard/issues/:issueId/agents/:agentId/wait`).
 */
import { useAgentText } from '@nocobase/app-plugin-agents/client/kit';
import {
  formatRunWait,
  runWaitBlocks,
} from '@nocobase/app-plugin-agents/client/runs';
import {
  PmLoadError,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { PmListSkeleton } from '@nocobase/app-plugin-projects/client/kit';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';
import { AgentQueue } from '@/extensions/nocobase-agent-queue/agent-queue';
import type { AgentQueueLabels } from '@/extensions/nocobase-agent-queue/labels';
import type { AgentQueueFormatWait } from '@/extensions/nocobase-agent-queue/model';
import type { AgentQueueAgent } from '@/extensions/nocobase-agent-queue/types';

import type { AgentBoardStartResult } from '../../shared/agent-board.js';
import { useNotify } from '../access/notify.js';
import {
  agentBoardKeys,
  useAgentBoard,
  useAgentBoardWait,
} from '../agents/board/api.js';
import type { IssuesPage } from './use-issues-page.js';

const MINE_PARAM = 'mine';

export function AgentQueueView({
  page,
  issueHref,
  mineToggle = true,
}: {
  readonly page: IssuesPage;
  readonly issueHref: (issueId: string) => string;
  /** Offers "Only mine"; off where the page shows only the viewer's issues already. */
  readonly mineToggle?: boolean;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const viewer = useViewer();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { q, projectId, labelId, ownerUserId, executorId, involvesUserId } =
    page.filters;
  const board = useAgentBoard({
    ...(q ? { q } : {}),
    ...(projectId ? { projectId } : {}),
    ...(labelId ? { labelId } : {}),
    ...(ownerUserId ? { ownerUserId } : {}),
    ...(executorId ? { executorId } : {}),
    ...(involvesUserId ? { involvesUserId } : {}),
  });
  const onlyMine = mineToggle && page.params.get(MINE_PARAM) === '1';
  // The agents' names in the viewer's language (a built-in agent's `nameText`).
  const agentText = useAgentText();
  const data = useMemo(
    () =>
      board.data && {
        ...board.data,
        agents: Object.fromEntries(
          Object.entries(board.data.agents).map(([id, agent]) => [
            id,
            { ...agent, name: agentText.name(agent) },
          ]),
        ),
      },
    [board.data, agentText],
  );

  const start = async (issue: { id: string; identifier: string }) => {
    try {
      const { data } = await api.request<{
        readonly data: AgentBoardStartResult;
      }>({
        method: 'POST',
        path: `agentBoard/issues/${encodeURIComponent(issue.id)}/start`,
      });
      const values = { identifier: issue.identifier };
      if (data.started)
        notify.success(t('issuesPage.agentStart.started', values));
      else
        notify.error(
          null,
          t(`issuesPage.agentStart.skipped.${data.skipped ?? ''}`, {
            ...values,
            defaultValue: t('issuesPage.agentStart.notStarted', values),
          }),
        );
    } catch (error) {
      notify.error(error);
    } finally {
      await queryClient.invalidateQueries({ queryKey: agentBoardKeys.all });
    }
  };

  const formatWait: AgentQueueFormatWait = (wait) => ({
    text: formatRunWait(t, wait, { locale: i18n.language }),
    blocking: runWaitBlocks(wait),
  });

  if (board.isError && !board.data)
    return (
      <PmLoadError
        title={t('issuesPage.agentLoadFailed')}
        error={board.error}
        onRetry={() => void board.refetch()}
      />
    );
  if (!data) return <PmListSkeleton />;
  return (
    <AgentQueue
      data={data}
      viewerId={viewer?.userId ?? null}
      issueHref={(issue) => issueHref(issue.id)}
      onNavigate={(href) => void navigate(href)}
      onlyMine={onlyMine}
      {...(mineToggle
        ? {
            onOnlyMineChange: (next: boolean) =>
              page.updateParams((current) => {
                const copy = new URLSearchParams(current);
                if (next) copy.set(MINE_PARAM, '1');
                else copy.delete(MINE_PARAM);
                return copy;
              }),
          }
        : {})}
      onStart={start}
      expandIdle={page.filtered}
      extra={
        board.isFetching ? (
          <Spinner className='size-3.5' aria-label={t('issuesPage.loading')} />
        ) : null
      }
      labels={
        t('issuesPage.agentQueue', {
          returnObjects: true,
        }) as unknown as AgentQueueLabels
      }
      locale={i18n.language}
      formatWait={formatWait}
      waitDetail={(item, agent) => (
        <ExactWait
          issueId={item.issue.id}
          agent={agent}
          formatWait={formatWait}
        />
      )}
    />
  );
}

/** An unfolded queued issue's exact reason, read while it shows. */
function ExactWait({
  issueId,
  agent,
  formatWait,
}: {
  readonly issueId: string;
  readonly agent: AgentQueueAgent;
  readonly formatWait: AgentQueueFormatWait;
}): ReactElement {
  const { t } = useTranslation();
  const wait = useAgentBoardWait(issueId, agent.id);
  if (wait.data) {
    const view = formatWait(wait.data, agent);
    return (
      <span
        title={typeof view.detail === 'string' ? view.detail : undefined}
        className={cn(view.blocking && 'text-amber-700 dark:text-amber-300')}
      >
        {view.text}
      </span>
    );
  }
  if (wait.isError)
    return (
      <span>
        {wait.error instanceof ApiClientError && wait.error.status === 404
          ? t('issuesPage.agentWait.gone')
          : t('issuesPage.agentWait.failed')}
      </span>
    );
  return (
    <span className='inline-flex items-center gap-1' role='status'>
      <Spinner className='size-3' />
      {t('issuesPage.agentWait.loading')}
    </span>
  );
}
