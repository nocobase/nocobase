/**
 * Agents: who they are, their type, which tool or model they work with and how, their skills, which runners may run
 * them and who may wake them. An agent's type is chosen when it is created and never changes: a `runner` agent drives a
 * coding tool on a runner, an `online` agent talks to a model of a model service on the server and has no tool, runners,
 * tool policy or variables (`checkType`); its skills are read in a sandbox, their scripts never run.
 * Who may change an agent is the route's concern (the `agents.agents` settings item, or the `agents.config` `edit`
 * action's level); the service checks the values and the revision an edit was made against, and keeps the history of
 * every change (`agent.history.ts`).
 *
 * Archiving or deleting an agent withdraws its queued runs and announces `agent.removed`, so the application lets go
 * of the work it gave the agent (the assembling application clears it as executor of unfinished issues).
 */
import { AgentToolSchema, PERMISSION_MODES } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';

import {
  AGENT_ACCESS,
  CONFIRM_CHANGES,
  AGENT_TYPES,
  effortsFor,
  isOnlineEntry,
  isRunnerEntry,
  MAX_MODEL_ENTRIES,
  sameEntry,
  type Agent,
  type AgentChange,
  type AgentInput,
  type AgentModelEntry,
  type AgentPatch,
  type AgentType,
  type OnlineModelEntry,
  type RunnerModelEntry,
} from '../../../shared/agents.js';
import type { I18nText } from '../../../shared/i18n.js';
import { offers, type ModelCatalog } from '../../../shared/models.js';
import type { Clock } from '../../kernel/clock.js';
import {
  invalid,
  notFound,
  precondition,
  ProtocolError,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { People } from '../../kernel/people.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { cleanList } from '../../kernel/values.js';
import {
  attachmentsRepo,
  replaceAttachments,
  skillsRepo,
} from '../skills/skill.store.js';
import {
  diffAgents,
  listChanges,
  recordChange,
  type HistoryOptions,
} from './agent.history.js';
import {
  deleteAgent,
  findAgent,
  insertAgent,
  listAgents,
  replaceUsers,
  reviseAgent,
  type AgentRecord,
} from './agent.store.js';

const ToolPolicyPatchSchema = z
  .object({
    permissionMode: z.enum(PERMISSION_MODES),
    allowedCommands: z.array(z.string().max(500)).max(200),
    deniedPatterns: z.array(z.string().max(500)).max(200),
    allowedDownloads: z.array(z.string().max(500)).max(200),
    maxTurns: z.number().int().positive(),
    idleTimeoutMs: z.number().int().min(60_000).max(86_400_000),
  })
  .partial();

/** An entry's reasoning effort; empty for the default. Which values its tool or service takes is `checkType`'s. */
const EffortSchema = z
  .string()
  .trim()
  .max(32)
  .nullable()
  .optional()
  .transform((effort) => (effort ? effort : null));

const RunnerEntrySchema: z.ZodType<RunnerModelEntry> = z.strictObject({
  tool: AgentToolSchema,
  model: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional()
    .transform((model) => (model ? model : null)),
  effort: EffortSchema,
});

const OnlineEntrySchema: z.ZodType<OnlineModelEntry> = z.strictObject({
  modelService: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(200),
  effort: EffortSchema,
});

/**
 * An agent's list of tools and models: runner entries (`{ tool, model?, effort? }`) or online ones
 * (`{ modelService, model, effort? }`).
 */
export const ModelEntriesSchema: z.ZodType<AgentModelEntry[]> = z
  .array(z.union([RunnerEntrySchema, OnlineEntrySchema]))
  .max(MAX_MODEL_ENTRIES)
  .meta({
    description:
      'The tools and models, in order, the first its default, each with an optional reasoning effort its tool or service takes: `[{"tool":"codex","model":"gpt-5","effort":"high"},{"tool":"claude"}]` for a runner agent, `[{"modelService":"openai","model":"gpt-5","effort":"low"}]` for an online one. A runner agent needs at least one; an online agent may have none until a model is configured.',
  });

const fields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).nullable(),
  avatar: z.string().trim().max(500).nullable(),
  modelEntries: ModelEntriesSchema,
  instructions: z.string().max(100_000).nullable(),
  runnerIds: z.array(z.string().min(1).max(64)).max(100),
  skillIds: z.array(z.string().min(1).max(64)).max(100),
  actions: z.array(z.string().min(1).max(100)).max(100),
  confirmChanges: z.enum(CONFIRM_CHANGES),
  access: z.enum(AGENT_ACCESS),
  userIds: z.array(z.string().min(1).max(64)).max(500),
  ownerUserId: z.string().min(1).max(64),
  maxConcurrentRuns: z.number().int().min(1).max(100),
  maxAttempts: z.number().int().min(1).max(10),
  toolPolicy: ToolPolicyPatchSchema.nullable(),
};

/** What creating an agent accepts. */
export const AgentInputSchema: z.ZodType<AgentInput> = z.strictObject({
  ...fields,
  type: z.enum(AGENT_TYPES).optional(),
  modelEntries: fields.modelEntries.optional(),
  description: fields.description.optional(),
  avatar: fields.avatar.optional(),
  instructions: fields.instructions.optional(),
  runnerIds: fields.runnerIds.optional(),
  skillIds: fields.skillIds.optional(),
  actions: fields.actions.optional(),
  confirmChanges: fields.confirmChanges.optional(),
  access: fields.access.optional(),
  userIds: fields.userIds.optional(),
  ownerUserId: fields.ownerUserId.optional(),
  maxConcurrentRuns: fields.maxConcurrentRuns.optional(),
  maxAttempts: fields.maxAttempts.optional(),
  toolPolicy: fields.toolPolicy.optional(),
});

/**
 * What updating an agent accepts: any field of the input but its type, and the revision the edit was made against. A
 * patch naming a type is refused (`AGENT_TYPE_IMMUTABLE`) rather than having it ignored.
 */
export const AgentPatchSchema: z.ZodType<AgentPatch> = z
  .strictObject(fields)
  .partial()
  .extend({
    expectedRevision: z.number().int().min(1),
    type: z.never({ error: 'An agent keeps its type.' }).optional(),
  });

export interface AgentService {
  list(options?: { readonly includeArchived?: boolean }): Promise<Agent[]>;
  /** 404 when absent. */
  get(id: string): Promise<Agent>;
  find(conn: DatabaseConnection, id: string): Promise<Agent | null>;
  /** The agent when it can be given work (present and not archived), read on `conn`. */
  findWorkable(conn: DatabaseConnection, id: string): Promise<Agent | null>;
  /** The agents not archived, by name, read on `conn`. */
  listActive(conn: DatabaseConnection): Promise<Agent[]>;
  create(createdById: string, input: AgentCreation): Promise<Agent>;
  /**
   * Changes the fields `patch` names, as `byUserId`, when the agent is still at `patch.expectedRevision`: 409
   * `REVISION_CONFLICT` with the current `metadata.revision` otherwise. A patch that changes
   * nothing leaves the revision and the history alone.
   */
  update(
    id: string,
    byUserId: string | null,
    patch: AgentPatch,
  ): Promise<Agent>;
  /**
   * Archived agents are not run: their queued runs are withdrawn now, and `agent.removed` is announced so the
   * application lets go of the work it gave the agent.
   */
  archive(id: string, byUserId: string | null): Promise<Agent>;
  restore(id: string, byUserId: string | null): Promise<Agent>;
  /**
   * Deletes an archived agent with no open runs, its variables, skill attachments and history; its past runs stay.
   * `CONFLICT` otherwise. Announces `agent.removed`.
   */
  remove(id: string, byUserId: string | null): Promise<void>;
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
  /** Whether `userId` may wake the agent. */
  mayInvoke(agent: Agent, userId: string): boolean;
}

export interface AgentServiceDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  /** Names of the people in the history. */
  readonly people: People;
  /** The models online agents may use (the model gateway's catalog): one is saved only with a model offered now. */
  readonly models: () => Promise<ModelCatalog>;
  /** The agent types a business action may be given to (`AgentActionOption.types`); every type when undefined. */
  readonly actionTypes?: (key: string) => readonly AgentType[] | undefined;
  /** The agent's variables and runs: deleting it checks its open runs and clears its variables; archiving it withdraws its queued runs. */
  readonly owned?: {
    readonly openRuns: (
      conn: DatabaseConnection,
      agentId: string,
    ) => Promise<number>;
    readonly clearVariables: (
      conn: DatabaseConnection,
      agentId: string,
    ) => Promise<void>;
    readonly withdrawQueued: (
      unit: Tx,
      agentId: string,
      byUserId: string | null,
    ) => Promise<void>;
  };
}

/** What creating an agent takes inside the server: the input, and a description's i18n reference a copy keeps. */
export type AgentCreation = AgentInput & {
  readonly descriptionText?: I18nText | null;
};

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

function columns(
  input: Partial<AgentInput>,
): Partial<Omit<AgentRecord, 'id' | 'createdAt'>> {
  const values: Record<string, unknown> = {};
  for (const key of [
    'name',
    'description',
    'avatar',
    'modelEntries',
    'instructions',
    'confirmChanges',
    'access',
    'ownerUserId',
    'maxConcurrentRuns',
    'maxAttempts',
    'toolPolicy',
  ] as const)
    if (input[key] !== undefined) values[key] = input[key];
  if (input.runnerIds !== undefined)
    values.runnerIds = cleanList(input.runnerIds);
  if (input.actions !== undefined) values.actions = cleanList(input.actions);
  return values;
}

/** Attaches `skillIds` to the agent; unknown skills are refused. */
async function attachSkills(
  conn: DatabaseConnection,
  agentId: string,
  skillIds: readonly string[],
  ids: IdSource,
  now: string,
): Promise<void> {
  const unique = cleanList(skillIds);
  if (unique.length > 0) {
    const found = await skillsRepo(conn).findMany({
      filter: (f) => f.or(unique.map((id) => f.string('id').eq(id))),
    });
    if (found.length !== unique.length)
      throw invalid('Some of the skills do not exist.');
  }
  await replaceAttachments(
    conn,
    'agent',
    agentId,
    unique,
    () => ids.next(),
    now,
  );
}

/** What an agent of a type is saved with, checked as a whole (the stored agent with a patch applied). */
interface TypedFields {
  readonly type: AgentType;
  readonly modelEntries: readonly AgentModelEntry[];
  readonly runnerIds: readonly string[];
  readonly toolPolicy: unknown;
  readonly skillIds: readonly string[];
  readonly actions: readonly string[];
}

/**
 * 400 unless the fields fit the type: a runner agent's entries name coding tools, at least one; an online agent's name
 * model services and their models (none while it is not configured), and it has none of what only a runner uses
 * (runners, a tool policy), nor a business action meant for runner agents only. No entry is listed twice, and each
 * entry's effort is one its tool or service takes.
 */
async function checkType(
  deps: Pick<AgentServiceDeps, 'models' | 'actionTypes'>,
  agent: TypedFields,
  /** The entries saved before; an online entry among them stays even when its service no longer offers it. */
  previous: readonly AgentModelEntry[],
): Promise<void> {
  const wrongType = (key: string) =>
    (deps.actionTypes?.(key) ?? AGENT_TYPES).includes(agent.type) === false;
  const refused = agent.actions.filter(wrongType);
  if (refused.length > 0)
    throw invalid(
      `A ${agent.type} agent cannot be given ${refused.join(', ')}.`,
      { reason: 'ACTION_NOT_FOR_TYPE', actions: refused },
    );
  const entries = agent.modelEntries;
  if (entries.length === 0 && agent.type === 'runner')
    throw invalid(
      'A runner agent needs at least one coding tool (modelEntries).',
    );
  if (
    entries.some((entry, index) =>
      entries.slice(0, index).some((other) => sameEntry(entry, other)),
    )
  )
    throw invalid('The same tool and model are listed twice.');
  for (const entry of entries)
    if (entry.effort && !effortsFor(entry).includes(entry.effort))
      throw invalid(
        `${isRunnerEntry(entry) ? entry.tool : entry.modelService} takes no reasoning effort ${entry.effort}: use one of ${effortsFor(entry).join(', ')}.`,
        { reason: 'EFFORT_UNSUPPORTED' },
      );
  if (agent.type === 'runner') {
    if (!entries.every(isRunnerEntry))
      throw invalid(
        'A runner agent works with coding tools: each entry names a tool, not a model service.',
      );
    return;
  }
  if (!entries.every(isOnlineEntry))
    throw invalid(
      'An online agent has no coding tool: each entry names a model service and a model.',
    );
  if (agent.runnerIds.length > 0 || agent.toolPolicy !== null)
    throw invalid(
      'An online agent runs on the server: it takes no runners or tool policy.',
    );
  // An entry saved before its service changed stays until someone changes it; a new one must be offered now.
  const added = entries.filter(
    (entry) => !previous.some((saved) => sameEntry(saved, entry)),
  );
  if (added.length === 0) return;
  const catalog = await deps.models();
  for (const entry of added)
    if (!offers(catalog, entry.modelService, entry.model))
      throw invalid(
        `The model service ${entry.modelService} does not offer the model ${entry.model}.`,
        { reason: 'MODEL_UNAVAILABLE' },
      );
}

export function createAgentService(deps: AgentServiceDeps): AgentService {
  const { tx, ids, clock, people } = deps;

  const require = async (
    conn: DatabaseConnection,
    id: string,
  ): Promise<Agent> => {
    const agent = await findAgent(conn, id);
    if (!agent) throw notFound('Agent');
    return agent;
  };

  /** Raises the revision from `agent.revision` with `values`, or refuses when someone got there first. */
  const revise = async (
    conn: DatabaseConnection,
    agent: Agent,
    values: Partial<Omit<AgentRecord, 'id' | 'createdAt' | 'revision'>>,
  ): Promise<void> => {
    if (!(await reviseAgent(conn, agent.id, agent.revision, values)))
      throw revisionConflict((await require(conn, agent.id)).revision);
  };

  const removed = (
    unit: Tx,
    agent: Agent,
    reason: 'archived' | 'deleted',
    byUserId: string | null,
  ): void =>
    unit.emit({
      type: 'agent.removed',
      agentId: agent.id,
      name: agent.name,
      reason,
      byUserId,
    });

  return {
    list: (options = {}) =>
      listAgents(tx.read(), options.includeArchived ?? false),
    get: (id) => require(tx.read(), id),
    find: findAgent,
    async findWorkable(conn, id) {
      const agent = await findAgent(conn, id);
      if (!agent || agent.archivedAt) return null;
      return agent;
    },
    listActive: (conn) => listAgents(conn, false),
    async create(createdById, input) {
      const type = input.type ?? 'runner';
      await checkType(
        deps,
        {
          type,
          modelEntries: input.modelEntries ?? [],
          runnerIds: input.runnerIds ?? [],
          toolPolicy: input.toolPolicy ?? null,
          skillIds: input.skillIds ?? [],
          actions: input.actions ?? [],
        },
        [],
      );
      return tx.run(async ({ conn, emit }) => {
        const now = clock.now().toISOString();
        const id = ids.next();
        await insertAgent(conn, {
          id,
          name: input.name,
          description: input.description ?? null,
          nameText: null,
          descriptionText: input.descriptionText
            ? { ...input.descriptionText }
            : null,
          avatar: input.avatar ?? null,
          type,
          modelEntries: [...(input.modelEntries ?? [])],
          instructions: input.instructions ?? null,
          runnerIds: cleanList(input.runnerIds ?? []),
          actions: cleanList(input.actions ?? []),
          confirmChanges: input.confirmChanges ?? 'larger',
          access: input.access ?? 'ownerOnly',
          ownerUserId: input.ownerUserId ?? createdById,
          maxConcurrentRuns: input.maxConcurrentRuns ?? 2,
          maxAttempts: input.maxAttempts ?? 3,
          toolPolicy: input.toolPolicy ?? null,
          createdAt: now,
          updatedAt: now,
        });
        await replaceUsers(
          conn,
          id,
          cleanList(input.userIds ?? []),
          () => ids.next(),
          now,
        );
        if (input.skillIds !== undefined)
          await attachSkills(conn, id, input.skillIds, ids, now);
        await recordChange(conn, {
          id: ids.next(),
          agentId: id,
          revision: 1,
          action: 'created',
          actorUserId: createdById,
          changes: [],
          createdAt: now,
        });
        emit({ type: 'agent.changed', agentId: id });
        return require(conn, id);
      });
    },
    async update(id, byUserId, patch) {
      const current = await require(tx.read(), id);
      await checkType(
        deps,
        {
          type: current.type,
          modelEntries: patch.modelEntries ?? current.modelEntries,
          runnerIds: patch.runnerIds ?? current.runnerIds,
          toolPolicy:
            patch.toolPolicy === undefined
              ? current.toolPolicy
              : patch.toolPolicy,
          skillIds: patch.skillIds ?? current.skillIds,
          actions: patch.actions ?? current.actions,
        },
        current.modelEntries,
      );
      try {
        return await tx.run(async ({ conn, emit }) => {
          const before = await require(conn, id);
          if (patch.expectedRevision !== before.revision)
            throw revisionConflict(before.revision);
          const now = clock.now().toISOString();
          await revise(conn, before, {
            ...columns(patch),
            // Editing a field drops its translation: what someone wrote shows as written.
            ...(patch.name !== undefined && patch.name !== before.name
              ? { nameText: null }
              : {}),
            ...(patch.description !== undefined &&
            (patch.description ?? null) !== before.description
              ? { descriptionText: null }
              : {}),
            updatedAt: now,
          });
          if (patch.userIds !== undefined)
            await replaceUsers(
              conn,
              id,
              cleanList(patch.userIds),
              () => ids.next(),
              now,
            );
          if (patch.skillIds !== undefined)
            await attachSkills(conn, id, patch.skillIds, ids, now);
          const after = await require(conn, id);
          const changes = diffAgents(before, after);
          if (changes.length === 0) throw new Unchanged(before);
          await recordChange(conn, {
            id: ids.next(),
            agentId: id,
            revision: after.revision,
            action: 'updated',
            actorUserId: byUserId,
            changes,
            createdAt: now,
          });
          emit({ type: 'agent.changed', agentId: id });
          return after;
        });
      } catch (error) {
        if (error instanceof Unchanged) return error.agent;
        throw error;
      }
    },
    archive: (id, byUserId) =>
      tx.run(async (unit) => {
        const agent = await require(unit.conn, id);
        if (agent.archivedAt) return agent;
        const now = clock.now().toISOString();
        await revise(unit.conn, agent, { archivedAt: now, updatedAt: now });
        await recordChange(unit.conn, {
          id: ids.next(),
          agentId: id,
          revision: agent.revision + 1,
          action: 'archived',
          actorUserId: byUserId,
          changes: [],
          createdAt: now,
        });
        await deps.owned?.withdrawQueued(unit, id, byUserId);
        unit.emit({ type: 'agent.changed', agentId: id });
        removed(unit, agent, 'archived', byUserId);
        return require(unit.conn, id);
      }),
    restore: (id, byUserId) =>
      tx.run(async ({ conn, emit }) => {
        const agent = await require(conn, id);
        if (!agent.archivedAt) return agent;
        const now = clock.now().toISOString();
        await revise(conn, agent, { archivedAt: null, updatedAt: now });
        await recordChange(conn, {
          id: ids.next(),
          agentId: id,
          revision: agent.revision + 1,
          action: 'restored',
          actorUserId: byUserId,
          changes: [],
          createdAt: now,
        });
        emit({ type: 'agent.changed', agentId: id });
        return require(conn, id);
      }),
    remove: (id, byUserId) =>
      tx.run(async (unit) => {
        const { conn } = unit;
        const agent = await require(conn, id);
        if (!agent.archivedAt)
          throw precondition(
            'AGENT_NOT_ARCHIVED',
            'Archive the agent before deleting it.',
          );
        if (deps.owned && (await deps.owned.openRuns(conn, id)) > 0)
          throw precondition(
            'AGENT_HAS_ACTIVE_RUNS',
            'The agent still has runs that have not ended.',
          );
        await attachmentsRepo(conn).deleteMany({
          filter: { scope: 'agent', scopeId: id },
        });
        await deps.owned?.clearVariables(conn, id);
        await deleteAgent(conn, id);
        unit.emit({ type: 'agent.changed', agentId: id });
        removed(unit, agent, 'deleted', byUserId);
      }),
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
    mayInvoke(agent, userId) {
      if (agent.archivedAt) return false;
      if (agent.ownerUserId === userId) return true;
      if (agent.access === 'everyone') return true;
      return agent.access === 'users' && agent.userIds.includes(userId);
    },
  };
}
