/**
 * Agents: one for each coding tool and model someone enabled, and the application's own (`ensureSystem`). A runner's
 * report (`syncRunner`) only auto-creates, already enabled, the combinations the application recommends
 * (`AgentDefaults.recommendedModels`); every other tool and model a runner reports only joins the available models
 * list (`GET /api/agents/availableModels`) until someone who manages agents creates one from it
 * (`createFromAvailable`) — this is deliberately narrower than "a tool reports it, an agent exists": one ACP tool
 * reporting hundreds of models once created hundreds of pending agents nobody wanted. Someone who manages agents
 * writes what an agent discovered from runners is good at, chooses its default reasoning effort and enables or
 * disables it (`update`); everything else about it is the application's, the same for each (`setDefaults`: its
 * instructions and business actions). Who may change an agent is the route's concern; the service checks the values
 * and the revision an edit was made against, and keeps the history of every change (`agent.history.ts`).
 *
 * Disabling an agent withdraws its queued runs and announces `agent.removed`, so the application lets go of the work
 * it gave the agent. A pending agent nobody enabled and that never ran may be removed outright (`cleanupCandidates`,
 * `cleanup`): it kept no history worth preserving.
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
  type CleanupCandidate,
  type CleanupGroup,
  type RunnerAgentCreateInput,
  type RunnerModelEntry,
  type SystemAgentInput,
} from '../../../shared/agents.js';
import {
  agentNameOf,
  TOOL_LABELS,
  catalogEntry,
  discoveryKey,
  normalizeModel,
  type CatalogModel,
} from '../../../shared/model-catalog.js';
import {
  lockDiscovery,
  preferences,
  type DiscoveryPreference,
} from './discovery.js';
import { reportedModels, type Runner } from '../../../shared/runners.js';
import { runsRepo } from '../runs/run.store.js';
import type { Clock } from '../../kernel/clock.js';
import { invalid, notFound, ProtocolError } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { People } from '../../kernel/people.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { cleanList } from '../../kernel/values.js';
import {
  agentIdsPreviouslyEnabled,
  deleteHistory,
  diffAgents,
  listChanges,
  recordChange,
  type HistoryOptions,
} from './agent.history.js';
import {
  agentDirectory,
  agentNamesOf,
  agentsRepo,
  deleteAgent,
  entriesOf,
  findAgent,
  insertAgent,
  isRemoved,
  listAgents,
  reviseAgent,
  runnerModelEntries,
  toAgent,
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
  expectedRevision: z
    .number()
    .int()
    .min(1)
    .describe('The revision last read; reject if the record has changed.'),
});

/** What every agent discovered from runners is: the application's instructions and business actions. */
export interface AgentDefaults {
  readonly instructions: string | null;
  readonly actions: readonly string[];
  /** Suggested descriptions by tool and normalized model id; never written by applyDefaults. */
  readonly modelDescriptions?: Readonly<
    Partial<Record<AgentTool, Readonly<Record<string, CatalogModel['goodAt']>>>>
  >;
  /**
   * Tool and model combinations the application wants enabled as soon as a runner reports them signed in, instead of
   * only listed for someone to create from (`AgentService.createFromAvailable`). A combination already kept as an
   * agent, enabled or not, is left exactly as it is: the list only ever creates, never re-enables or reconfigures.
   */
  readonly recommendedModels?: readonly {
    readonly tool: AgentTool;
    readonly model: string;
  }[];
}

const NO_DEFAULTS: AgentDefaults = { instructions: null, actions: [] };

/** The suggested description for a tool and model: the application's own list, else the model catalog's. */
function suggestionOf(
  defaults: AgentDefaults,
  tool: AgentTool,
  model: string,
): CatalogModel['goodAt'] | null {
  return (
    defaults.modelDescriptions?.[tool]?.[normalizeModel(tool, model)] ??
    catalogEntry(tool, model)?.goodAt ??
    null
  );
}

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

/** Of `ids`, the ones with at least one run against them: never safe to delete outright. */
async function agentIdsWithRuns(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Set<string>> {
  const withRuns = new Set<string>();
  for (let offset = 0; offset < ids.length; offset += 200) {
    const batch = ids.slice(offset, offset + 200);
    if (batch.length === 0) continue;
    const rows = await runsRepo(conn).findMany({
      filter: (f) => f.or(batch.map((id) => f.string('agentId').eq(id))),
    });
    for (const row of rows) withRuns.add(row.agentId);
  }
  return withRuns;
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
  setIgnored(
    groups: readonly { key: string; expectedRevision: number }[],
    ignored: boolean,
  ): Promise<DiscoveryPreference[]>;
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
  /** The application's suggested description, falling back to the model catalog. */
  suggestion(
    this: void,
    tool: AgentTool,
    model: string,
  ): CatalogModel['goodAt'] | null;
  /** The tool and model combinations the application auto-enables when a runner reports them (`AgentDefaults.recommendedModels`). */
  recommended(): readonly {
    readonly tool: AgentTool;
    readonly model: string;
  }[];
  /** Writes the current defaults to every discovered agent that differs; answers how many changed. */
  applyDefaults(options?: { preserveInstructions?: boolean }): Promise<number>;
  /**
   * Creates and enables an agent for a tool and model nobody has kept one for yet, from the available models list
   * (`GET /api/agents/availableModels`): 400 `AGENT_EXISTS` when one already exists (enabled, disabled or pending),
   * `GOOD_AT_REQUIRED` without a description, `EFFORT_UNSUPPORTED` for an effort its tool does not take.
   */
  createFromAvailable(
    input: RunnerAgentCreateInput,
    byUserId: string | null,
  ): Promise<Agent>;
  /**
   * Runner-discovered agents nobody enabled and that never ran: safe to remove outright. Left over from before the
   * application stopped creating one pending agent per model a runner reports (`syncRunner` now only creates an
   * agent for a recommended combination), or from igniting a tool that reports far more models than anyone enables.
   * `filter.tool` scopes to one tool's candidates (for the cleanup drawer's rows, paged by the route); omitted, every
   * candidate (for `cleanupGroups` and the CLI, which has no drawer to page through).
   */
  cleanupCandidates(filter?: {
    readonly tool?: AgentTool;
    readonly q?: string;
  }): Promise<CleanupCandidate[]>;
  /** One row per tool with candidates, for the cleanup drawer's group headers, matching `q` against the agent name. */
  cleanupGroups(q?: string): Promise<CleanupGroup[]>;
  /**
   * Removes the named agents outright, each re-checked against `cleanupCandidates`' own rule first: anything no
   * longer pending, now enabled, disabled, or with a run against it (another request may have changed it since it was
   * listed) is left alone and reported back, never removed. Answers what was actually removed and what was skipped.
   */
  cleanup(
    ids: readonly string[],
    byUserId: string | null,
  ): Promise<{
    readonly removed: readonly string[];
    readonly skipped: readonly string[];
  }>;
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

  /** The name `base`, or `base #2`, `base #3`… the first not already held by a non-removed agent. */
  async function uniqueAgentName(
    conn: DatabaseConnection,
    base: string,
  ): Promise<string> {
    const clashes = await agentsRepo(conn).findMany({
      filter: (f) =>
        f.and([f.string('name').startsWith(base), f.date('deletedAt').empty()]),
    });
    const taken = new Set(clashes.map((record) => record.name));
    if (!taken.has(base)) return base;
    let suffix = 2;
    while (taken.has(`${base} #${suffix}`)) suffix += 1;
    return `${base} #${suffix}`;
  }

  async function createRunnerAgent(
    unit: Tx,
    tool: AgentTool,
    model: string,
    now: string,
    displayModel: string | undefined,
    enable: boolean,
  ): Promise<boolean> {
    const id = runnerAgentId(tool, model);
    const { instructions, actions } = currentDefaults();
    const description = enable
      ? (suggestionOf(defaults(), tool, model)?.en ?? null)
      : null;
    const name = await uniqueAgentName(
      unit.conn,
      agentNameOf(tool, model, displayModel),
    );
    try {
      // A savepoint: another runner's report creating the same agent at once leaves this transaction usable.
      await unit.conn.transaction((conn) =>
        insertAgent(conn, {
          id,
          name,
          description,
          nameText: null,
          descriptionText: null,
          avatar: null,
          type: 'runner',
          source: 'runner',
          status: enable ? 'enabled' : 'pending',
          tool,
          model: model || null,
          modelEntries: [
            { tool, model: model || null, effort: initialEffort(tool) },
          ],
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

  async function candidatesMatching(filter: {
    readonly tool?: AgentTool;
    readonly q?: string;
  }): Promise<CleanupCandidate[]> {
    const conn = tx.read();
    const pending = (await listAgents(conn)).filter(
      (agent) => agent.source === 'runner' && agent.status === 'pending',
    );
    const withRuns = await agentIdsWithRuns(
      conn,
      pending.map((agent) => agent.id),
    );
    const previouslyEnabled = await agentIdsPreviouslyEnabled(
      conn,
      pending.map((agent) => agent.id),
    );
    const needle = filter.q?.trim().toLowerCase();
    return pending
      .filter((agent) => !withRuns.has(agent.id))
      .filter((agent) => !previouslyEnabled.has(agent.id))
      .filter((agent) => !filter.tool || agent.tool === filter.tool)
      .filter((agent) => !needle || agent.name.toLowerCase().includes(needle))
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        tool: agent.tool,
        model: agent.model,
        createdAt: agent.createdAt,
      }));
  }

  return {
    setIgnored: (groups, ignored) =>
      tx.run(async ({ conn, emit }) => {
        const result: DiscoveryPreference[] = [];
        const lockedGroups: DiscoveryPreference[] = [];
        // Stable ordering avoids deadlocks between overlapping batches.
        for (const group of [...groups].sort((a, b) =>
          a.key.localeCompare(b.key),
        )) {
          lockedGroups.push(
            await lockDiscovery(conn, group.key, group.expectedRevision),
          );
        }
        const agents = await listAgents(conn);
        for (const group of lockedGroups) {
          const members = agents.filter(
            (agent) =>
              agent.source === 'runner' &&
              agent.tool &&
              agent.model &&
              discoveryKey(agent.tool, agent.model) === group.key,
          );
          if (
            !members.some((agent) => agent.status === 'pending') ||
            members.some((agent) => agent.status === 'enabled')
          )
            throw invalid(
              'Only pending discovery groups can be ignored or restored. Reload the list.',
              { reason: 'DISCOVERY_NOT_PENDING' },
            );
          await preferences(conn).updateMany({
            filter: { key: group.key },
            values: { ignored },
          });
          for (const member of members)
            emit({ type: 'agent.changed', agentId: member.id });
          result.push({ ...group, ignored });
        }
        return result;
      }),
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
          if (before.tool && before.model) {
            const group = await lockDiscovery(
              conn,
              discoveryKey(before.tool, before.model),
            );
            if (patch.enabled && group.ignored)
              throw invalid(
                'Restore this discovery group before enabling it.',
                { reason: 'DISCOVERY_IGNORED' },
              );
          }
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
      const known = new Map<string, AgentRecord>();
      // Several selected ACP tools can each report 256 models. Bound SQL parameters and OR depth on every dialect.
      for (let offset = 0; offset < combos.length; offset += 200) {
        const batch = combos.slice(offset, offset + 200);
        const records = await agentsRepo(unit.conn).findMany({
          filter: (f) =>
            f.or(
              batch.map((combo) =>
                f.string('id').eq(runnerAgentId(combo.tool, combo.model)),
              ),
            ),
        });
        for (const record of records) known.set(record.id, record);
      }
      const recommended = new Set(
        (defaults().recommendedModels ?? []).map(
          (item) => `${item.tool}\u0000${item.model}`,
        ),
      );
      const created: string[] = [];
      const repaired: string[] = [];
      const stale: string[] = [];
      for (const combo of combos) {
        const id = runnerAgentId(combo.tool, combo.model);
        const record = known.get(id);
        if (!record) {
          // Everything else a runner signs in to only joins the available models list (`AgentService.createFromAvailable`
          // builds its rows); creating one per reported model is how one ACP tool once produced hundreds of pending agents.
          if (!recommended.has(`${combo.tool}\u0000${combo.model}`)) continue;
          if (
            await createRunnerAgent(
              unit,
              combo.tool,
              combo.model,
              nowText,
              runner.tools
                .find((tool) => tool.kind === combo.tool)
                ?.models?.find((model) => model.id === combo.model)?.name,
              true,
            )
          )
            created.push(id);
          continue;
        }
        const restore =
          record.source === 'runner' &&
          (record.deletedAt !== null || record.archivedAt !== null);
        const fillModelEntries =
          record.source === 'runner' &&
          entriesOf(record.modelEntries).length === 0;
        if (restore || fillModelEntries) {
          const values: Partial<AgentRecord> = {
            ...(restore
              ? { status: 'pending', deletedAt: null, archivedAt: null }
              : {}),
            ...(fillModelEntries
              ? { modelEntries: runnerModelEntries(record) }
              : {}),
            lastReportedAt: nowText,
            updatedAt: nowText,
          };
          if (restore && record.status !== 'pending') {
            if (!(await reviseAgent(unit.conn, id, record.revision, values)))
              continue;
            const after = await findAgent(unit.conn, id);
            if (after) {
              const changes = diffAgents(toAgent(record), after);
              if (changes.length > 0)
                await recordChange(unit.conn, {
                  id: ids.next(),
                  agentId: id,
                  revision: after.revision,
                  action: 'restored',
                  actorUserId: null,
                  changes,
                  createdAt: nowText,
                });
            }
          } else {
            await updateAgent(unit.conn, id, values);
          }
          repaired.push(id);
          continue;
        }
        const generated = agentNameOf(combo.tool, combo.model);
        if (
          record.status === 'pending' &&
          record.name ===
            `${TOOL_LABELS[combo.tool]} · ${combo.model.split('/').at(-1)}` &&
          record.name !== generated
        )
          await updateAgent(unit.conn, id, { name: generated });
        if (
          !record.lastReportedAt ||
          now.getTime() - Date.parse(record.lastReportedAt) >= REPORT_REFRESH_MS
        )
          stale.push(id);
      }
      for (let offset = 0; offset < stale.length; offset += 200) {
        const batch = stale.slice(offset, offset + 200);
        await agentsRepo(unit.conn).updateMany({
          filter: (f) => f.or(batch.map((id) => f.string('id').eq(id))),
          values: { lastReportedAt: nowText },
        });
      }
      for (const id of [...created, ...repaired])
        unit.emit({ type: 'agent.changed', agentId: id });
    },
    setDefaults(provider) {
      defaults = provider;
      return () => {
        if (defaults === provider) defaults = () => NO_DEFAULTS;
      };
    },
    suggestion(tool, model) {
      return suggestionOf(defaults(), tool, model);
    },
    recommended() {
      return defaults().recommendedModels ?? [];
    },
    async createFromAvailable(input, byUserId) {
      const tool = input.tool;
      const model = input.model;
      const description = input.description.trim();
      if (!description)
        throw invalid(
          'Write what the agent is good at before enabling it: the project manager hands it work by this.',
          { reason: 'GOOD_AT_REQUIRED' },
        );
      const efforts = effortsFor({ tool });
      const effort =
        input.effort === undefined
          ? initialEffort(tool)
          : input.effort
            ? input.effort
            : null;
      if (effort && !efforts.includes(effort))
        throw invalid(
          `${tool} takes no reasoning effort ${effort}: use one of ${efforts.join(', ')}.`,
          { reason: 'EFFORT_UNSUPPORTED' },
        );
      return tx.run(async (unit) => {
        const { conn, emit } = unit;
        const id = runnerAgentId(tool, model);
        const now = clock.now().toISOString();
        const existing = await agentsRepo(conn).findOne({ filter: { id } });
        if (existing) {
          const restore =
            existing.source === 'runner' &&
            (existing.deletedAt !== null || existing.archivedAt !== null);
          const fillModelEntries =
            existing.source === 'runner' &&
            entriesOf(existing.modelEntries).length === 0;
          if (!restore && !fillModelEntries)
            throw invalid(
              'An agent for this tool and model already exists: enable it from the agent list instead.',
              { reason: 'AGENT_EXISTS' },
            );
          const currentEntry = entriesOf(existing.modelEntries).find(
            (entry) => entry.tool === tool && entry.model === model,
          );
          const adoptedDescription = existing.description?.trim()
            ? existing.description
            : description;
          const values: Partial<AgentRecord> = {
            ...(restore
              ? { status: 'pending', deletedAt: null, archivedAt: null }
              : {}),
            ...(restore || fillModelEntries
              ? {
                  modelEntries: [
                    {
                      tool,
                      model,
                      effort: currentEntry ? currentEntry.effort : effort,
                    },
                  ],
                }
              : {}),
            ...(existing.description === adoptedDescription
              ? {}
              : { description: adoptedDescription, descriptionText: null }),
            lastReportedAt: now,
            updatedAt: now,
          };
          const shouldRevise =
            (restore && existing.status !== 'pending') ||
            existing.description !== adoptedDescription;
          if (shouldRevise) {
            if (!(await reviseAgent(conn, id, existing.revision, values)))
              throw revisionConflict((await require(conn, id)).revision);
            const after = await findAgent(conn, id);
            if (after) {
              const changes = diffAgents(toAgent(existing), after);
              if (changes.length > 0)
                await recordChange(conn, {
                  id: ids.next(),
                  agentId: id,
                  revision: after.revision,
                  action: restore ? 'restored' : 'updated',
                  actorUserId: byUserId,
                  changes,
                  createdAt: now,
                });
            }
          } else {
            await updateAgent(conn, id, values);
          }
          emit({ type: 'agent.changed', agentId: id });
          return (await findAgent(conn, id))!;
        }
        const name = await uniqueAgentName(
          conn,
          agentNameOf(tool, model, input.displayModel),
        );
        const { instructions, actions } = currentDefaults();
        await insertAgent(conn, {
          id,
          name,
          description,
          nameText: null,
          descriptionText: null,
          avatar: null,
          type: 'runner',
          source: 'runner',
          status: 'enabled',
          tool,
          model: model || null,
          modelEntries: [{ tool, model: model || null, effort }],
          instructions,
          runnerIds: [],
          actions: [...actions],
          confirmChanges: 'larger',
          access: 'everyone',
          ownerUserId: 'system',
          maxConcurrentRuns: RUNNER_AGENT_CONCURRENCY,
          maxAttempts: AGENT_ATTEMPTS,
          toolPolicy: null,
          // It came from the available models list, built from current reports: treat creation itself as a report.
          lastReportedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        await recordChange(conn, {
          id: ids.next(),
          agentId: id,
          revision: 1,
          action: 'created',
          actorUserId: byUserId,
          changes: [],
          createdAt: now,
        });
        emit({ type: 'agent.changed', agentId: id });
        return (await findAgent(conn, id))!;
      });
    },
    cleanupCandidates: (filter = {}) => candidatesMatching(filter),
    async cleanupGroups(q) {
      const candidates = await candidatesMatching({ q });
      const counts = new Map<AgentTool | null, number>();
      for (const candidate of candidates)
        counts.set(candidate.tool, (counts.get(candidate.tool) ?? 0) + 1);
      return [...counts.entries()]
        .map(([tool, count]): CleanupGroup => ({ tool, count }))
        .sort((a, b) => (a.tool ?? '').localeCompare(b.tool ?? ''));
    },
    async cleanup(requested, byUserId) {
      const unique = [...new Set(requested)];
      return tx.run(async ({ conn, emit }) => {
        const withRuns = await agentIdsWithRuns(conn, unique);
        const previouslyEnabled = await agentIdsPreviouslyEnabled(conn, unique);
        const removed: string[] = [];
        const skipped: string[] = [];
        for (const id of unique) {
          const agent = await findAgent(conn, id);
          if (
            !agent ||
            agent.source !== 'runner' ||
            agent.status !== 'pending' ||
            withRuns.has(id) ||
            previouslyEnabled.has(id)
          ) {
            skipped.push(id);
            continue;
          }
          await deleteHistory(conn, id);
          await deleteAgent(conn, id);
          emit({
            type: 'agent.removed',
            agentId: id,
            name: agent.name,
            reason: 'deleted',
            byUserId,
          });
          removed.push(id);
        }
        return { removed, skipped };
      });
    },
    async applyDefaults(options = {}) {
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
            (options.preserveInstructions ||
              agent.instructions === instructions) &&
            JSON.stringify(agent.actions) === JSON.stringify(actions)
          )
            continue;
          await updateAgent(conn, record.id, {
            ...(options.preserveInstructions ? {} : { instructions }),
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
