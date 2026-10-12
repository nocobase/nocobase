/**
 * Agents: one for each coding tool and model the runners report (`syncRunner`), and the application's own
 * (`ensureSystem`). Nobody creates or deletes an agent. Someone who manages agents writes what an agent discovered from
 * runners is good at, chooses its default reasoning effort and enables or disables it (`update`); everything else about
 * it is the application's, the same for each (`setDefaults`: its instructions and business actions). Who may change an
 * agent is the route's concern; the service checks the values and the revision an edit was made against, and keeps
 * the history of every change (`agent.history.ts`).
 *
 * Disabling an agent withdraws its queued runs and announces `agent.removed`, so the application lets go of the work
 * it gave the agent.
 */
import { createHash } from 'node:crypto';

import type { AgentTool } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';

import {
  effortsFor,
  MAX_MODEL_ENTRIES,
  type Agent,
  type AgentChange,
  type AgentName,
  type AgentPatch,
  type RunnerModelEntry,
  type SystemAgentInput,
} from '../../../shared/agents.js';
import { agentNameOf } from '../../../shared/model-catalog.js';
import { reportedModels, type Runner } from '../../../shared/runners.js';
import type { Clock } from '../../kernel/clock.js';
import { invalid, notFound, ProtocolError } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { People } from '../../kernel/people.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { cleanList } from '../../kernel/values.js';
import {
  diffAgents,
  listChanges,
  recordChange,
  type HistoryOptions,
} from './agent.history.js';
import {
  agentDirectory,
  agentNamesOf,
  agentsRepo,
  findAgent,
  insertAgent,
  isRemoved,
  listAgents,
  reviseAgent,
  updateAgent,
  type AgentRecord,
} from './agent.store.js';

/** What changing an agent accepts. */
export const AgentPatchSchema: z.ZodType<AgentPatch> = z.strictObject({
  description: z.string().max(10_000).nullable().optional().meta({
    description:
      'What it is good at: the project manager hands it work by this. Required to enable it.',
  }),
  effort: z.string().trim().max(32).nullable().optional().meta({
    description:
      "Its default reasoning effort, one of its tool's; null for the tool's default.",
  }),
  enabled: z
    .boolean()
    .optional()
    .meta({ description: 'Offer it work, or stop offering it.' }),
  expectedRevision: z.number().int().min(1),
});

/** What every agent discovered from runners is: the application's instructions and business actions. */
export interface AgentDefaults {
  readonly instructions: string | null;
  readonly actions: readonly string[];
}

const NO_DEFAULTS: AgentDefaults = { instructions: null, actions: [] };

/** How often a runner's report refreshes when its tools and models were last seen. */
const REPORT_REFRESH_MS = 10 * 60_000;

/** How many runs of one discovered agent may run at once: as many as the runners' slots allow. */
const RUNNER_AGENT_CONCURRENCY = 100;

/** How many attempts a run of any agent gets. */
const AGENT_ATTEMPTS = 3;

/** The effort a discovered agent starts with: `medium` when its tool takes it, else the tool's default. */
function initialEffort(tool: AgentTool): string | null {
  return effortsFor({ tool }).includes('medium') ? 'medium' : null;
}

/** The fixed id of the agent of a tool and model, so two runners reporting it at once create one. */
export function runnerAgentId(tool: AgentTool, model: string): string {
  const hash = createHash('sha256')
    .update(`${tool}\u0000${model}`)
    .digest('hex')
    .slice(0, 20);
  return `runner-${tool}-${hash}`;
}

export interface AgentService {
  /** The agents not removed, by name. */
  list(): Promise<Agent[]>;
  /** 404 when absent or removed. */
  get(id: string): Promise<Agent>;
  /** Any agent by id, a removed one included (runs name it), read on `conn`. */
  find(conn: DatabaseConnection, id: string): Promise<Agent | null>;
  /** The names of agents by id, removed ones included, read on `conn`. */
  names(
    conn: DatabaseConnection,
    ids: readonly string[],
  ): Promise<Map<string, string>>;
  /** Every agent's name, removed ones and the application's own included, read on `conn`. */
  directory(conn: DatabaseConnection): Promise<AgentName[]>;
  /** The agent when it can be given work: enabled, with a tool and model, read on `conn`. */
  findWorkable(conn: DatabaseConnection, id: string): Promise<Agent | null>;
  /** The agents that can be given work, by name, read on `conn`. */
  listActive(conn: DatabaseConnection): Promise<Agent[]>;
  /**
   * Changes what an agent discovered from runners is good at, its default effort or whether it is enabled, as
   * `byUserId`, when it is still at `patch.expectedRevision`: 409 `REVISION_CONFLICT` with the current
   * `metadata.revision` otherwise. Enabling needs a description (400 `GOOD_AT_REQUIRED`). The application's own agents
   * are changed through the application (400 `AGENT_MANAGED`). A patch that changes nothing changes no revision.
   */
  update(
    id: string,
    byUserId: string | null,
    patch: AgentPatch,
  ): Promise<Agent>;
  /**
   * Keeps an agent of the application's own as `input` says, creating it the first time; enabled, and recorded in its
   * history when something changed.
   */
  ensureSystem(
    input: SystemAgentInput,
    byUserId?: string | null,
  ): Promise<Agent>;
  /**
   * What `runner` reports, in the transaction of its report: an agent for each tool and model it has signed in that
   * none is kept for yet (pending), and when the others were last reported.
   */
  syncRunner(unit: Tx, runner: Runner): Promise<void>;
  /** Where every discovered agent's instructions and business actions come from; returns what removes it. */
  setDefaults(provider: () => AgentDefaults): () => void;
  /** Writes the current defaults to every discovered agent that differs; answers how many changed. */
  applyDefaults(): Promise<number>;
  /** The agent's history, newest first; with `afterRevision`, the changes made after that revision. 404 when absent. */
  history(id: string, options?: HistoryOptions): Promise<AgentChange[]>;
  /** Records in the agent's history, on `conn`, that one of its variables was added, changed or removed. */
  noteVariable(
    conn: DatabaseConnection,
    agentId: string,
    variable: {
      readonly name: string;
      readonly change: 'added' | 'changed' | 'removed';
      readonly byUserId: string | null;
    },
  ): Promise<void>;
  /** Whether work may be given to the agent: it is enabled, with a tool and model. Anyone may wake such an agent. */
  mayInvoke(agent: Agent, userId: string): boolean;
}

export interface AgentServiceDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  /** Names of the people in the history. */
  readonly people: People;
  /** The agent's runs: disabling it withdraws its queued runs. */
  readonly owned?: {
    readonly withdrawQueued: (
      unit: Tx,
      agentId: string,
      byUserId: string | null,
    ) => Promise<void>;
  };
}

/** Thrown inside an update's transaction when the patch changes nothing, to roll the raised revision back. */
class Unchanged extends Error {
  public constructor(public readonly agent: Agent) {
    super('unchanged');
  }
}

function revisionConflict(current: number): Error {
  return new ProtocolError(
    'REVISION_CONFLICT',
    'The agent was changed by someone else since you opened it. Reload it to see what changed, then make your change again.',
    { revision: current },
  );
}

/** Whether work may be given to the agent: enabled, with at least one tool and model. */
export function isWorkable(agent: Agent): boolean {
  return agent.status === 'enabled' && agent.modelEntries.length > 0;
}

/** The tools and models a runner reports signed in, normalized, each once. */
export function reportedCombos(
  runner: Runner,
): { readonly tool: AgentTool; readonly model: string }[] {
  const tools = [...new Set(runner.tools.map((tool) => tool.kind))];
  return tools.flatMap((tool) =>
    reportedModels(runner, tool).map((model) => ({ tool, model })),
  );
}

export function createAgentService(deps: AgentServiceDeps): AgentService {
  const { tx, ids, clock, people } = deps;
  let defaults: () => AgentDefaults = () => NO_DEFAULTS;

  const require = async (
    conn: DatabaseConnection,
    id: string,
  ): Promise<Agent> => {
    const agent = await findAgent(conn, id);
    if (!agent || (await isRemoved(conn, id))) throw notFound('Agent');
    return agent;
  };

  const removed = (unit: Tx, agent: Agent, byUserId: string | null): void =>
    unit.emit({
      type: 'agent.removed',
      agentId: agent.id,
      name: agent.name,
      reason: 'disabled',
      byUserId,
    });

  /** The defaults as stored: the instructions, and the actions each once. */
  const currentDefaults = (): AgentDefaults => {
    const value = defaults();
    return {
      instructions: value.instructions,
      actions: cleanList(value.actions),
    };
  };

  async function createRunnerAgent(
    unit: Tx,
    tool: AgentTool,
    model: string,
    now: string,
  ): Promise<boolean> {
    const id = runnerAgentId(tool, model);
    const { instructions, actions } = currentDefaults();
    try {
      // A savepoint: another runner's report creating the same agent at once leaves this transaction usable.
      await unit.conn.transaction((conn) =>
        insertAgent(conn, {
          id,
          name: agentNameOf(tool, model),
          description: null,
          nameText: null,
          descriptionText: null,
          avatar: null,
          type: 'runner',
          source: 'runner',
          status: 'pending',
          tool,
          model,
          modelEntries: [{ tool, model, effort: initialEffort(tool) }],
          instructions,
          runnerIds: [],
          actions: [...actions],
          confirmChanges: 'larger',
          access: 'everyone',
          ownerUserId: 'system',
          maxConcurrentRuns: RUNNER_AGENT_CONCURRENCY,
          maxAttempts: AGENT_ATTEMPTS,
          toolPolicy: null,
          lastReportedAt: now,
          createdAt: now,
          updatedAt: now,
        }),
      );
    } catch (error) {
      if (await agentsRepo(unit.conn).findOne({ filter: { id } })) return false;
      throw error;
    }
    await recordChange(unit.conn, {
      id: ids.next(),
      agentId: id,
      revision: 1,
      action: 'created',
      actorUserId: null,
      changes: [],
      createdAt: now,
    });
    return true;
  }

  return {
    list: () => listAgents(tx.read()),
    get: (id) => require(tx.read(), id),
    find: findAgent,
    names: agentNamesOf,
    directory: agentDirectory,
    async findWorkable(conn, id) {
      const agent = await findAgent(conn, id);
      if (!agent || !isWorkable(agent) || (await isRemoved(conn, id)))
        return null;
      return agent;
    },
    async listActive(conn) {
      return (await listAgents(conn)).filter(isWorkable);
    },
    async update(id, byUserId, patch) {
      const current = await require(tx.read(), id);
      if (current.source !== 'runner')
        throw invalid(
          'This agent is kept by the application: change it in the application’s settings.',
          { reason: 'AGENT_MANAGED' },
        );
      const effort = patch.effort === undefined ? undefined : patch.effort;
      const entry = current.modelEntries[0];
      if (effort && entry && !effortsFor(entry).includes(effort))
        throw invalid(
          `${entry.tool} takes no reasoning effort ${effort}: use one of ${effortsFor(entry).join(', ')}.`,
          { reason: 'EFFORT_UNSUPPORTED' },
        );
      const description =
        patch.description === undefined
          ? current.description
          : patch.description?.trim()
            ? patch.description.trim()
            : null;
      const status =
        patch.enabled === undefined
          ? current.status
          : patch.enabled
            ? 'enabled'
            : current.status === 'pending'
              ? 'pending'
              : 'disabled';
      if (status === 'enabled' && !description)
        throw invalid(
          'Write what the agent is good at before enabling it: the project manager hands it work by this.',
          { reason: 'GOOD_AT_REQUIRED' },
        );
      try {
        return await tx.run(async (unit) => {
          const { conn, emit } = unit;
          const before = await require(conn, id);
          if (patch.expectedRevision !== before.revision)
            throw revisionConflict(before.revision);
          const now = clock.now().toISOString();
          const modelEntries: RunnerModelEntry[] =
            effort === undefined
              ? [...before.modelEntries]
              : before.modelEntries.map((item, index) =>
                  index === 0 ? { ...item, effort } : item,
                );
          if (
            !(await reviseAgent(conn, id, before.revision, {
              description,
              descriptionText:
                description === before.description && before.descriptionText
                  ? {
                      key: before.descriptionText.key,
                      ns: before.descriptionText.ns,
                    }
                  : null,
              status,
              modelEntries: modelEntries.slice(0, MAX_MODEL_ENTRIES),
              updatedAt: now,
            }))
          )
            throw revisionConflict((await require(conn, id)).revision);
          const after = await require(conn, id);
          const changes = diffAgents(before, after);
          if (changes.length === 0) throw new Unchanged(before);
          await recordChange(conn, {
            id: ids.next(),
            agentId: id,
            revision: after.revision,
            action:
              before.status !== after.status
                ? after.status === 'enabled'
                  ? 'enabled'
                  : 'disabled'
                : 'updated',
            actorUserId: byUserId,
            changes,
            createdAt: now,
          });
          if (before.status === 'enabled' && after.status !== 'enabled') {
            await deps.owned?.withdrawQueued(unit, id, byUserId);
            removed(unit, after, byUserId);
          }
          emit({ type: 'agent.changed', agentId: id });
          return after;
        });
      } catch (error) {
        if (error instanceof Unchanged) return error.agent;
        throw error;
      }
    },
    ensureSystem: (input, byUserId = null) =>
      tx.run(async ({ conn, emit }) => {
        const now = clock.now().toISOString();
        const values = {
          name: input.name,
          nameText: input.nameText ? { ...input.nameText } : null,
          description: input.description,
          instructions: input.instructions,
          actions: cleanList(input.actions),
          modelEntries: input.modelEntries
            .slice(0, MAX_MODEL_ENTRIES)
            .map((entry) => ({ ...entry })),
        };
        const before = await findAgent(conn, input.id);
        if (!before) {
          await insertAgent(conn, {
            id: input.id,
            ...values,
            descriptionText: null,
            avatar: null,
            type: 'runner',
            source: 'system',
            status: 'enabled',
            tool: null,
            model: null,
            runnerIds: [],
            confirmChanges: 'larger',
            access: 'everyone',
            ownerUserId: 'system',
            maxConcurrentRuns: RUNNER_AGENT_CONCURRENCY,
            maxAttempts: AGENT_ATTEMPTS,
            toolPolicy: null,
            lastReportedAt: null,
            createdAt: now,
            updatedAt: now,
          });
          await recordChange(conn, {
            id: ids.next(),
            agentId: input.id,
            revision: 1,
            action: 'created',
            actorUserId: byUserId,
            changes: [],
            createdAt: now,
          });
          emit({ type: 'agent.changed', agentId: input.id });
          return (await findAgent(conn, input.id))!;
        }
        const unchanged =
          !(await isRemoved(conn, input.id)) &&
          before.source === 'system' &&
          before.status === 'enabled' &&
          before.name === values.name &&
          JSON.stringify(before.nameText) === JSON.stringify(values.nameText) &&
          before.description === values.description &&
          before.instructions === values.instructions &&
          JSON.stringify(before.actions) === JSON.stringify(values.actions) &&
          JSON.stringify(before.modelEntries) ===
            JSON.stringify(
              values.modelEntries.map((entry) => ({
                tool: entry.tool,
                model: entry.model ?? null,
                effort: entry.effort ?? null,
              })),
            );
        if (unchanged) return before;
        await reviseAgent(conn, input.id, before.revision, {
          ...values,
          source: 'system',
          status: 'enabled',
          archivedAt: null,
          deletedAt: null,
          updatedAt: now,
        });
        const after = (await findAgent(conn, input.id))!;
        await recordChange(conn, {
          id: ids.next(),
          agentId: input.id,
          revision: after.revision,
          action: 'updated',
          actorUserId: byUserId,
          changes: diffAgents(before, after),
          createdAt: now,
        });
        emit({ type: 'agent.changed', agentId: input.id });
        return after;
      }),
    async syncRunner(unit, runner) {
      const combos = reportedCombos(runner);
      if (combos.length === 0) return;
      const now = clock.now();
      const nowText = now.toISOString();
      const known = new Map<string, AgentRecord>(
        (
          await agentsRepo(unit.conn).findMany({
            filter: (f) =>
              f.or(
                combos.map((combo) =>
                  f.string('id').eq(runnerAgentId(combo.tool, combo.model)),
                ),
              ),
          })
        ).map((record) => [record.id, record]),
      );
      const created: string[] = [];
      const stale: string[] = [];
      for (const combo of combos) {
        const id = runnerAgentId(combo.tool, combo.model);
        const record = known.get(id);
        if (!record) {
          if (await createRunnerAgent(unit, combo.tool, combo.model, nowText))
            created.push(id);
          continue;
        }
        if (
          !record.lastReportedAt ||
          now.getTime() - Date.parse(record.lastReportedAt) >= REPORT_REFRESH_MS
        )
          stale.push(id);
      }
      if (stale.length > 0)
        await agentsRepo(unit.conn).updateMany({
          filter: (f) => f.or(stale.map((id) => f.string('id').eq(id))),
          values: { lastReportedAt: nowText },
        });
      for (const id of created)
        unit.emit({ type: 'agent.changed', agentId: id });
    },
    setDefaults(provider) {
      defaults = provider;
      return () => {
        if (defaults === provider) defaults = () => NO_DEFAULTS;
      };
    },
    async applyDefaults() {
      const { instructions, actions } = currentDefaults();
      return tx.run(async ({ conn, emit }) => {
        const records = await agentsRepo(conn).findMany({
          filter: (f) =>
            f.and([
              f.string('source').eq('runner'),
              f.date('deletedAt').empty(),
            ]),
        });
        let changed = 0;
        for (const record of records) {
          const agent = (await findAgent(conn, record.id))!;
          if (
            agent.instructions === instructions &&
            JSON.stringify(agent.actions) === JSON.stringify(actions)
          )
            continue;
          await updateAgent(conn, record.id, {
            instructions,
            actions: [...actions],
            updatedAt: clock.now().toISOString(),
          });
          emit({ type: 'agent.changed', agentId: record.id });
          changed += 1;
        }
        return changed;
      });
    },
    async history(id, options = {}) {
      const conn = tx.read();
      await require(conn, id);
      return listChanges(conn, people, id, options);
    },
    async noteVariable(conn, agentId, variable) {
      const agent = await findAgent(conn, agentId);
      if (!agent) return;
      await recordChange(conn, {
        id: ids.next(),
        agentId,
        revision: agent.revision,
        action: 'variables',
        actorUserId: variable.byUserId,
        changes: [
          {
            field: 'variable',
            name: variable.name,
            change: variable.change,
          },
        ],
        createdAt: clock.now().toISOString(),
      });
    },
    mayInvoke: (agent) => isWorkable(agent),
  };
}
