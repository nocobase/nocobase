/**
 * Consultations: an online agent asking another online agent a question while it works, and waiting for the answer
 * (`ask_agent`, the AI SDK's subagent pattern). The answer comes from a run of its own, a child of the run that asks
 * (`parentRunId`), on the subject `{ kind: 'consultation', id: <the asking run> }`, one thread per tool call:
 *
 * - **Who**: an online agent, configured with a model, that the person the asking run acts for may use (its "who may
 *   use it"). A runner agent is never consulted: work goes to it through a task.
 * - **As whom**: the child run has its own run token, acting for the same person; what it may do is what any run of the
 *   consulted agent may do for that person (its configured actions within theirs), kept to reading
 *   (`callers/index.ts`). It may propose an operation plan, which the person confirms in their conversation.
 * - **How deep**: a consulted agent may consult another, `CONSULT_MAX_DEPTH` deep at most, and never one already asked
 *   in the chain (A asks B, B asks A: refused).
 * - **When**: never through the queue. The instance holding the asking run takes the child at once
 *   (`ClaimService.claimChild`) and runs it within the tool call, bounded by a time and token budget
 *   (`agents.server.consult`); it has one attempt.
 *
 * The consulted agent's brief is this domain's (`prompt.ts`), with the application's rules (how to propose a change).
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import { ACCESS_NAMESPACE } from '../../../shared/access.js';
import { onlineEntries, type Agent } from '../../../shared/agents.js';
import {
  CONSULTATION_SUBJECT,
  CONSULT_MAX_DEPTH,
} from '../../../shared/runs.js';
import type { People } from '../../kernel/people.js';
import type { TxRunner } from '../../kernel/tx.js';
import { findAgent, listAgents } from '../agents/index.js';
import type { ConversationRuleLines } from '../conversations/index.js';
import type {
  ClaimContext,
  RunService,
  SubjectAssembly,
  SubjectBinding,
} from '../runs/index.js';
import { queuedRun } from '../runs/index.js';
import { findRunRecord, type RunRecord } from '../runs/run.store.js';
import {
  consultationContext,
  consultationSystemLayer,
  consultationTask,
  questionText,
  type ConsultTarget,
} from './prompt.js';

/** What an agent asks another (`ask_agent`'s input). */
export interface ConsultRequest {
  /** The agent asked, by name or id. */
  readonly agent: string;
  readonly question: string;
  /** What the agent asked needs to know, as the asking agent writes it. */
  readonly context?: string;
}

/** What a consulted agent's brief is told by the application, as a conversation's is (`ConversationRuleLines`). */
export type ConsultationRules = (
  conn: DatabaseConnection,
  context: {
    readonly agent: Agent;
    readonly ownerName: string;
    readonly cli: string;
    readonly dialect: 'cli' | 'tools';
  },
) => Promise<ConversationRuleLines>;

/** The trigger of a consultation's input. */
export const CONSULTATION_TRIGGER = 'consultation';

export interface ConsultationService {
  /** The `consultation` subject kind. */
  readonly binding: SubjectBinding;
  /** Where the application adds rules to a consulted agent's brief. */
  readonly rules: {
    provide(source: ConsultationRules): () => void;
  };
  /** The run and the runs that asked it, the first asker first. */
  chain(conn: DatabaseConnection, run: RunRecord): Promise<RunRecord[]>;
  /**
   * The agents `run` of `agent` may consult now: online agents with a model, which its person may use, not already in
   * its chain, while it is not `CONSULT_MAX_DEPTH` deep. By name.
   */
  targets(
    conn: DatabaseConnection,
    run: RunRecord,
    agent: Agent,
  ): Promise<ConsultTarget[]>;
  /**
   * Queues the consultation as a child of `parentRunId`, for the holder of that run to take at once; refuses with a
   * `ProtocolError` whose `details.reason` says why (`AGENT_NOT_FOUND`, `AMBIGUOUS`, `RUNNER_AGENT`, `FORBIDDEN`,
   * `NOT_CONFIGURED`, `CYCLE`, `DEPTH`).
   */
  start(
    parentRunId: string,
    callId: string,
    request: ConsultRequest,
  ): Promise<{ readonly runId: string; readonly agent: Agent }>;
}

export interface ConsultationServiceDeps {
  readonly tx: TxRunner;
  readonly runs: Pick<RunService, 'enqueue'>;
  readonly mayInvoke: (agent: Agent, userId: string) => boolean;
  readonly people: People;
}

function refused(
  code: 'AGENT_NOT_FOUND' | 'FORBIDDEN' | 'INVALID_REQUEST' | 'CONFLICT',
  reason: string,
  message: string,
): ProtocolError {
  return new ProtocolError(code, message, { reason });
}

/** The subject key of a consultation: it names the consulted run's thread. */
export function consultationKey(parentRunId: string): string {
  return `consult-${parentRunId}`;
}

export function createConsultationService(
  deps: ConsultationServiceDeps,
): ConsultationService {
  const rules: ConsultationRules[] = [];

  async function chain(
    conn: DatabaseConnection,
    run: RunRecord,
  ): Promise<RunRecord[]> {
    const runs = [run];
    let current = run;
    // Bounded: a chain is never deeper than the limit, and a broken link ends it.
    while (current.parentRunId && runs.length <= CONSULT_MAX_DEPTH + 1) {
      const parent = await findRunRecord(conn, current.parentRunId);
      if (!parent) break;
      runs.unshift(parent);
      current = parent;
    }
    return runs;
  }

  async function nameOf(conn: DatabaseConnection, userId: string) {
    return (await deps.people.names(conn, [userId])).get(userId) ?? userId;
  }

  async function assemble(
    conn: DatabaseConnection,
    claim: ClaimContext,
  ): Promise<SubjectAssembly> {
    const parent = await findRunRecord(conn, claim.run.subject.id);
    const asker = parent ? await findAgent(conn, parent.agentId) : null;
    const askerName = asker?.name ?? 'Another agent';
    const ownerName = await nameOf(conn, claim.run.actorUserId);
    const key = consultationKey(claim.run.subject.id);
    const added = await Promise.all(
      rules.map((source) =>
        source(conn, {
          agent: claim.agent,
          ownerName,
          cli: claim.cli,
          dialect: claim.dialect,
        }),
      ),
    );
    return {
      subject: { key, url: '', noun: 'consultation' },
      system: consultationSystemLayer({
        agentName: claim.agent.name,
        askerName,
        ownerName,
        key,
        cli: claim.cli,
        appName: claim.appName,
        rules: added.flatMap((lines) => lines.rules ?? []),
        sections: added.flatMap((lines) => lines.sections ?? []),
      }),
      task: consultationTask({ key, askerName, ownerName }),
      context: consultationContext({
        askerName,
        ownerName,
        askedAt: claim.run.createdAt,
      }),
      turn: { prompt: 'The question:' },
      data: {
        kind: CONSULTATION_SUBJECT,
        parentRunId: claim.run.subject.id,
      },
      dirs: [],
      scopes: [],
    };
  }

  const binding: SubjectBinding = {
    kind: CONSULTATION_SUBJECT,
    // Read only by the people the run involves, as the conversation it answers for.
    private: true,
    agentTypes: ['online'],
    title: { key: 'subjects.consultation', ns: ACCESS_NAMESPACE },
    triggers: {
      [CONSULTATION_TRIGGER]: {
        key: 'runs.trigger.consultation',
        ns: ACCESS_NAMESPACE,
      },
    },
    context: { assemble },
  };

  async function targets(
    conn: DatabaseConnection,
    run: RunRecord,
    agent: Agent,
  ): Promise<ConsultTarget[]> {
    const runs = await chain(conn, run);
    if (runs.length > CONSULT_MAX_DEPTH) return [];
    const asked = new Set([agent.id, ...runs.map((entry) => entry.agentId)]);
    return (await listAgents(conn, false))
      .filter(
        (candidate) =>
          candidate.type === 'online' &&
          !asked.has(candidate.id) &&
          onlineEntries(candidate).length > 0 &&
          deps.mayInvoke(candidate, run.actorUserId),
      )
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        description: candidate.description,
      }));
  }

  /** The agent asked, by id or by name (ignoring case), among those not archived. */
  async function resolve(
    conn: DatabaseConnection,
    wanted: string,
  ): Promise<Agent> {
    const value = wanted.trim();
    const byId = await findAgent(conn, value);
    if (byId && !byId.archivedAt) return byId;
    const named = (await listAgents(conn, false)).filter(
      (agent) => agent.name.toLowerCase() === value.toLowerCase(),
    );
    if (named.length > 1)
      throw refused(
        'INVALID_REQUEST',
        'AMBIGUOUS',
        `Several agents are called ${value}: name the one you mean by its id.`,
      );
    if (named.length === 0)
      throw refused(
        'AGENT_NOT_FOUND',
        'AGENT_NOT_FOUND',
        `There is no agent called ${value}. Ask one of the agents listed under "Agents you may consult".`,
      );
    return named[0];
  }

  return {
    binding,
    rules: {
      provide(source) {
        rules.push(source);
        return () => {
          const at = rules.indexOf(source);
          if (at >= 0) rules.splice(at, 1);
        };
      },
    },
    chain,
    targets,

    async start(parentRunId, callId, request) {
      const conn = deps.tx.read();
      const parent = await findRunRecord(conn, parentRunId);
      if (!parent)
        throw refused('INVALID_REQUEST', 'RUN_GONE', 'The asking run is gone.');
      const target = await resolve(conn, request.agent);
      if (target.type !== 'online')
        throw refused(
          'INVALID_REQUEST',
          'RUNNER_AGENT',
          `${target.name} is a runner agent: it is not consulted. Use a task to delegate to a runner agent.`,
        );
      if (!deps.mayInvoke(target, parent.actorUserId))
        throw refused(
          'FORBIDDEN',
          'FORBIDDEN',
          `${target.name} may not be consulted: the person you work for may not use it.`,
        );
      if (onlineEntries(target).length === 0)
        throw refused(
          'INVALID_REQUEST',
          'NOT_CONFIGURED',
          `${target.name} has no model configured, so it cannot answer.`,
        );
      const runs = await chain(conn, parent);
      if (
        target.id === parent.agentId ||
        runs.some((run) => run.agentId === target.id)
      )
        throw refused(
          'CONFLICT',
          'CYCLE',
          `${target.name} is already part of this consultation: an agent is never asked by one it asked.`,
        );
      if (runs.length > CONSULT_MAX_DEPTH)
        throw refused(
          'CONFLICT',
          'DEPTH',
          `Consultations go ${CONSULT_MAX_DEPTH} levels deep at most: answer with what you know.`,
        );
      const asker = await findAgent(conn, parent.agentId);
      const enqueued = queuedRun(
        await deps.runs.enqueue({
          agentId: target.id,
          subject: { kind: CONSULTATION_SUBJECT, id: parent.id },
          threadScope: callId.slice(0, 64),
          actorUserId: parent.actorUserId,
          // The question is the asking run's doing: its chain of work goes on.
          causedByRunId: parent.id,
          ownerUserId: parent.ownerUserId,
          parentRunId: parent.id,
          maxAttempts: 1,
          input: {
            type: 'custom',
            actor: {
              kind: 'agent',
              id: parent.agentId,
              name: asker?.name ?? parent.agentId,
            },
            text: questionText(request.question, request.context),
            payload: {
              trigger: CONSULTATION_TRIGGER,
              question: request.question,
              ...(request.context ? { context: request.context } : {}),
            },
          },
        }),
      );
      return { runId: enqueued.runId, agent: target };
    },
  };
}
