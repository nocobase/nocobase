/**
 * Studio's organiser of requirement intake with AI (`IntakeOrganizer`, bound to `projectsIntakeOrganizerToken`): each
 * request runs an agent once on the `intake` subject, as the person who asked. An online agent is preferred whenever one
 * can answer: it drafts on the server in seconds, with no runner (`intakeAgentOf`). How the request goes is the run's:
 * queued (and why, from the runs' workload) or held (and the newest thing it reported). A run that ends without handing
 * drafts back fails the request (`watchIntakeRuns`).
 */
import {
  TERMINAL_RUN_STATUSES,
  type RunStatus,
} from '@nocobase/agent-protocol';
import type {
  IntakeOrganizer,
  Projects,
} from '@nocobase/app-plugin-projects/server/tokens';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Agent } from '@nocobase/app-plugin-agents/shared/agents';

import { INTAKE_SUBJECT, INTAKE_TRIGGER, intakeLabel } from './subject.js';

/** Runs of an intake request come before an issue's queued work: a person waits on the page. */
const INTAKE_PRIORITY = -10;

type IntakeAgents = Pick<
  Agents,
  'agents' | 'chat' | 'availability' | 'runs' | 'tx' | 'events'
>;

/**
 * The agent a person's request goes to, among those they may wake: an online agent that can answer now (their default
 * chat agent, else the team's, else the first such agent by name), else their default agent or the team's whatever its
 * type, which may have to wait for a runner.
 */
export async function intakeAgentOf(
  agents: IntakeAgents,
  userId: string,
): Promise<Agent | null> {
  const conn = agents.tx.read();
  const usable = (agent: Agent | null): agent is Agent =>
    Boolean(
      agent && !agent.archivedAt && agents.agents.mayInvoke(agent, userId),
    );
  const defaults: Agent[] = [];
  for (const id of [
    (await agents.chat.preferences(userId, conn)).defaultAgentId,
    (await agents.chat.settings(conn)).defaultAgentId,
  ]) {
    const agent = id ? await agents.agents.find(conn, id) : null;
    if (usable(agent)) defaults.push(agent);
  }
  const chats = [
    ...defaults,
    ...(await agents.agents.listActive(conn)).filter(usable),
  ].filter((agent) => agent.type === 'online');
  const online = await agents.availability(conn, chats);
  return (
    chats.find((agent) => online.get(agent.id)?.online) ?? defaults[0] ?? null
  );
}

/** Why a run ended without drafts, in words the page shows. */
function endedWhy(status: RunStatus, detail: string | null) {
  if (status === 'completed')
    return {
      code: 'noDrafts',
      message: 'The agent finished without proposing drafts.',
    };
  if (status === 'cancelled')
    return { code: 'runCancelled', message: 'The agent’s run was cancelled.' };
  return {
    code: 'runFailed',
    message: detail
      ? `The agent’s run failed: ${detail}`
      : 'The agent’s run failed.',
  };
}

export function createIntakeOrganizer(agents: IntakeAgents): IntakeOrganizer {
  return {
    async availability(userId) {
      const agent = await intakeAgentOf(agents, userId);
      if (!agent) return { available: false, reason: 'noAgent' };
      const loads = await agents.availability(agents.tx.read(), [agent]);
      return {
        available: true,
        by: agent.name,
        waits: !(loads.get(agent.id)?.online ?? false),
      };
    },

    async start(task) {
      const agent = await intakeAgentOf(agents, task.requester.userId);
      if (!agent)
        throw new Error(
          'There is no agent to ask: choose a default chat agent, or ask an administrator to set the team’s.',
        );
      const result = await agents.runs.enqueue({
        agentId: agent.id,
        subject: { kind: INTAKE_SUBJECT, id: task.jobId },
        actorUserId: task.requester.userId,
        ownerUserId: task.requester.userId,
        priority: INTAKE_PRIORITY,
        input: {
          type: 'custom',
          actor: {
            kind: 'user',
            id: task.requester.userId,
            name: task.requester.name ?? task.requester.userId,
          },
          text: intakeLabel(task),
          payload: { trigger: INTAKE_TRIGGER, mode: task.mode },
        },
      });
      return { ref: result.runId, by: agent.name };
    },

    async progress(job) {
      if (!job.ref) return null;
      const run = await agents.runs.get(job.ref).catch(() => null);
      if (!run) return null;
      if (TERMINAL_RUN_STATUSES.includes(run.status))
        return { ended: endedWhy(run.status, run.failureDetail) };
      const agent = await agents.agents.find(agents.tx.read(), run.agentId);
      const open = (
        await agents.runs.workload({ subjectKind: INTAKE_SUBJECT })
      ).runs.find((item) => item.id === run.id);
      if (run.status === 'queued')
        return {
          phase: 'queued',
          by: agent?.name ?? null,
          waitReason: open?.wait?.reason ?? null,
          ...(open?.wait?.params ? { waitParams: open.wait.params } : {}),
          activity: null,
          since: run.createdAt,
        };
      return {
        phase: 'working',
        by: agent?.name ?? null,
        waitReason: null,
        activity: open?.lastActivity?.text?.split('\n')[0]?.trim() || null,
        since: run.startedAt,
      };
    },

    async cancel(job, byUserId) {
      if (job.ref) await agents.runs.cancel(job.ref, byUserId);
    },
  };
}

/**
 * Fails the request of an intake run that ended without drafts (a request that has them is no longer running, and
 * stays as it is). Returns what stops listening.
 */
export function watchIntakeRuns(
  agents: Pick<Agents, 'runs' | 'events'>,
  projects: () => Pick<Projects, 'intakeAi'>,
  onError: (error: unknown) => void,
): () => void {
  return agents.events.on('run.changed', (event) => {
    if (!TERMINAL_RUN_STATUSES.includes(event.status)) return;
    const work = async () => {
      const run = await agents.runs.get(event.runId);
      if (run.subject.kind !== INTAKE_SUBJECT) return;
      await projects().intakeAi.ended(
        run.subject.id,
        endedWhy(run.status, run.failureDetail),
      );
    };
    work().catch(onError);
  });
}
