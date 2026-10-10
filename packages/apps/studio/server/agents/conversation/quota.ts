/**
 * Direct writes: an agent in a conversation changing data for the person without asking first. Each write of a
 * conversation run through the projects API (`issue create`, `issue update`, `issue comment add`, `issue dependency
 * add` and `remove`, handed over by `../run-principal.ts`) becomes a one-off operation plan of the projects plugin, rehearsed, judged here, then created and executed
 * at once (`PlanService.create(…, { execute: true })`), so the change is the person's, marked "via ‹Agent›", and can be
 * undone like any plan.
 *
 * A write is allowed only when all of these hold; otherwise the command answers 409 `PLAN_REQUIRED` (the CLI's exit
 * code 7) with `details.reasons`, and the agent proposes an operation plan instead:
 *
 * | reason           | the write would …                                                                      |
 * | ---------------- | -------------------------------------------------------------------------------------- |
 * | `alwaysConfirm`  | be made by an agent set to confirm every change (`Agent.confirmChanges` `always`)      |
 * | `startsRun`      | wake an agent (an executor, a mention, a reply), as the rehearsal reports              |
 * | `finalStatus`    | move an issue to a done or closed status                                               |
 * | `ownerChange`    | change an issue's owner, or create one owned by someone else                           |
 * | `agentExecutor`  | make an agent an issue's executor (a person, or none, is fine)                         |
 * | `createsProject` | create a project                                                                       |
 * | `quota`          | touch a third distinct object in this turn (a comment or a dependency counts on its issue) |
 *
 * A turn is one run. The ledger (`studioDirectWrites`) is counted twice: before the write, to answer early, and inside the
 * transaction that executes the plan (`PlanHooks.onPlanDecided`), under the conversation's lock, so two writes sent at
 * once can never pass the quota together. Replies in the conversation and its title are not writes and never count.
 */
import { randomUUID } from 'node:crypto';

import {
  ERROR_STATUS,
  ProtocolError,
  type ErrorCode,
} from '@nocobase/agent-protocol';
import {
  DomainError,
  type Projects,
  type ProjectsTx,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { ApiErrorBody } from '@nocobase/app-plugin-projects/shared/common';
import type {
  Plan,
  PlanDecided,
  PlanObjectRef,
  PlanRiskFlag,
  PlanRowCheck,
  PlanRowInput,
} from '@nocobase/app-plugin-projects/shared/plans';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Asker } from './acting.js';

/** Distinct objects a turn may change directly. */
export const DIRECT_WRITE_LIMIT = 2;

/** The source kind of a direct write's plan. */
export const DIRECT_WRITE_SOURCE = 'directWrite';

export const PLAN_REQUIRED_REASONS = [
  'alwaysConfirm',
  'startsRun',
  'finalStatus',
  'ownerChange',
  'agentExecutor',
  'createsProject',
  'quota',
] as const;

export type PlanRequiredReason = (typeof PLAN_REQUIRED_REASONS)[number];

const FLAG_REASONS: Readonly<Record<PlanRiskFlag, PlanRequiredReason>> = {
  startsRun: 'startsRun',
  finalStatus: 'finalStatus',
  ownerChange: 'ownerChange',
  agentExecutor: 'agentExecutor',
  createsProject: 'createsProject',
};

const REASON_WORDS: Readonly<Record<PlanRequiredReason, string>> = {
  alwaysConfirm: 'you are set to confirm every change',
  startsRun: 'it would wake an agent',
  finalStatus: 'it finishes or closes an issue',
  ownerChange: "it changes an issue's owner",
  agentExecutor: 'it makes an agent the executor',
  createsProject: 'it creates a project',
  quota: `this turn may change at most ${DIRECT_WRITE_LIMIT} objects directly`,
};

/** The source data of a direct write's plan. */
interface DirectSource {
  readonly conversationId: string;
  readonly runId: string;
}

/** Studio's ledger of direct writes (`database/main/migrations/…_studio_create_direct_writes.ts`). */
const LEDGER = 'studioDirectWrites';

interface LedgerRecord {
  readonly id: string;
  readonly runId: string;
  readonly conversationId: string;
  readonly objectKey: string;
  readonly planId: string;
  readonly createdAt: string;
}

/** The 409 that tells the agent to propose a plan. */
export function planRequired(
  reasons: readonly PlanRequiredReason[],
  details: Readonly<Record<string, unknown>> = {},
): ProtocolError {
  return new ProtocolError(
    'PLAN_REQUIRED',
    `Not changed: propose an operation plan instead (plan create), because ${reasons
      .map((reason) => REASON_WORDS[reason])
      .join('; ')}.`,
    { reasons, ...details },
  );
}

/** A refusal of the projects plugin, as a protocol error; its own code stays in `details.code`. */
export function rowError(error: ApiErrorBody): ProtocolError {
  const code: ErrorCode =
    error.code in ERROR_STATUS
      ? (error.code as ErrorCode)
      : error.code.endsWith('NOT_FOUND')
        ? 'NOT_FOUND'
        : error.code.endsWith('FORBIDDEN')
          ? 'FORBIDDEN'
          : error.code.endsWith('CONFLICT') || error.code === 'PLAN_STALE'
            ? 'CONFLICT'
            : 'INVALID_REQUEST';
  return new ProtocolError(code, error.message, {
    code: error.code,
    ...(error.details ?? {}),
  });
}

/** The object a row counts on: its issue (or project), or null for one it creates. */
function objectKey(ref: PlanObjectRef | null): string | null {
  if (!ref?.id) return null;
  if (ref.type === 'issue' || ref.type === 'project')
    return `${ref.type}:${ref.id}`;
  return null;
}

function isDirect(
  decided: Pick<PlanDecided, 'source'>,
): DirectSource | undefined {
  if (decided.source.kind !== DIRECT_WRITE_SOURCE) return undefined;
  const data = decided.source.data as Partial<DirectSource> | undefined;
  return typeof data?.conversationId === 'string' &&
    typeof data.runId === 'string'
    ? { conversationId: data.conversationId, runId: data.runId }
    : undefined;
}

export interface DirectWrites {
  /**
   * Writes `rows` for the asker as one direct write, or throws: 409 `PLAN_REQUIRED` with the reasons, or the row's
   * refusal. Answers the executed plan.
   */
  write(
    asker: Asker,
    viewer: Viewer,
    request: { readonly title: string; readonly rows: readonly PlanRowInput[] },
  ): Promise<Plan>;
  /** In the transaction executing a direct write's plan: counts it against the turn's quota, or refuses it. */
  onPlanDecided(tx: ProjectsTx, decided: PlanDecided): Promise<void>;
  /** Whether the plan is a direct write; its decisions wake nobody. */
  isDirect(decided: Pick<PlanDecided, 'source'>): boolean;
  /** The distinct objects the run changed directly. */
  used(runId: string): Promise<number>;
}

export function createDirectWrites(deps: {
  readonly agents: Pick<Agents, 'tx' | 'conversations' | 'clock'>;
  readonly projects: () => Pick<Projects, 'plans'>;
}): DirectWrites {
  const { agents } = deps;
  const ledger = (conn: ProjectsTx['conn']) =>
    conn.repository<LedgerRecord>(LEDGER);

  async function keysOf(
    conn: ProjectsTx['conn'],
    runId: string,
  ): Promise<Set<string>> {
    const rows = await ledger(conn).findMany({ filter: { runId } });
    return new Set(rows.map((row) => row.objectKey));
  }

  return {
    isDirect: (decided) => isDirect(decided) !== undefined,

    async used(runId) {
      return (await keysOf(agents.tx.read(), runId)).size;
    },

    async write(asker, viewer, request) {
      const plans = deps.projects().plans;
      const read = agents.tx.read();
      if (asker.confirmChanges === 'always')
        throw planRequired(['alwaysConfirm']);
      const source = {
        kind: DIRECT_WRITE_SOURCE,
        key: null,
        data: {
          conversationId: asker.conversation.id,
          runId: asker.runId,
        } satisfies DirectSource,
      };
      const input = {
        title: request.title,
        source,
        rows: request.rows,
      };
      const rehearsal = await plans.rehearse(viewer, input);
      const failing = rehearsal.rows.find((row) => !row.ok);
      if (failing?.error) throw rowError(failing.error);

      const reasons = new Set<PlanRequiredReason>();
      for (const row of rehearsal.rows)
        for (const flag of row.flags) reasons.add(FLAG_REASONS[flag]);
      const before = await keysOf(read, asker.runId);
      const touched = touchedBy(rehearsal.rows);
      const after = new Set([...before, ...touched.known]);
      const count = after.size + touched.created;
      if (count > DIRECT_WRITE_LIMIT) reasons.add('quota');
      const quota = { used: before.size, limit: DIRECT_WRITE_LIMIT };
      if (reasons.size > 0)
        throw planRequired(
          PLAN_REQUIRED_REASONS.filter((reason) => reasons.has(reason)),
          {
            quota,
            wakes: rehearsal.rows.flatMap((row) =>
              row.wakes.filter((wake) => wake.started),
            ),
          },
        );

      const plan = await plans.create(viewer, input, { execute: true });
      if (plan.status === 'executed') return plan;
      // Not applied: the plan goes, so it never waits in the person's list.
      await plans
        .void(viewer, plan.id, { revision: plan.revision })
        .catch(() => undefined);
      const failure = plan.failure ?? {
        code: 'INTERNAL_ERROR',
        message: 'The change could not be made.',
      };
      if (failure.code === 'PLAN_REQUIRED')
        throw planRequired(['quota'], {
          quota: {
            used: (await keysOf(agents.tx.read(), asker.runId)).size,
            limit: DIRECT_WRITE_LIMIT,
          },
        });
      throw rowError(failure);
    },

    async onPlanDecided(tx, decided) {
      const direct = isDirect(decided);
      if (!direct || decided.outcome !== 'executed') return;
      // One write at a time per conversation: the second of two concurrent writes counts the first.
      await agents.conversations.lock(tx.conn, direct.conversationId);
      const before = await keysOf(tx.conn, direct.runId);
      const mine = new Set<string>();
      for (const row of decided.rows) {
        const key = objectKey(row.target) ?? objectKey(row.created);
        if (key) mine.add(key);
      }
      const after = new Set([...before, ...mine]);
      if (after.size > DIRECT_WRITE_LIMIT)
        throw new DomainError(
          'conflict',
          'PLAN_REQUIRED',
          `This turn may change at most ${DIRECT_WRITE_LIMIT} objects directly.`,
        );
      const at = agents.clock.now().toISOString();
      for (const key of mine)
        if (!before.has(key))
          await ledger(tx.conn).createOne({
            values: {
              id: randomUUID(),
              runId: direct.runId,
              conversationId: direct.conversationId,
              objectKey: key,
              planId: decided.planId,
              createdAt: at,
            },
          });
    },
  };
}

/** The objects rehearsed rows touch: existing ones by key, and how many they create. */
function touchedBy(rows: readonly PlanRowCheck[]): {
  readonly known: ReadonlySet<string>;
  readonly created: number;
} {
  const known = new Set<string>();
  let created = 0;
  for (const row of rows) {
    const key = objectKey(row.target);
    if (key) known.add(key);
    else created += 1;
  }
  return { known, created };
}
