// A test fixture: it runs only on the memory store, through the `MemoryRows`
// handle a memory transaction hands out, and is not part of the published
// plugin. A real plugin keeps a second layer's rows in tables of its own,
// created by a migration and written through the transaction's Repository.

import {
  defineLifecycle,
  SYSTEM_ACTOR,
  type JsonObject,
  type Lifecycle,
  type LifecycleActor,
  type LifecycleRecord,
  type LifecycleRuntime,
  type LifecycleTransaction,
  type RecordId,
} from '@nocobase/lifecycle';

import {
  isActor,
  rowsOf,
  SecondLayerError,
  type Row,
  type SecondLayerServices,
} from './rows.js';

// An agent waiting for a person, as a second layer: design step 7. An order
// whose delivery fell through is re-planned by an agent. While it works, the
// order waits in `replanning`; the agent may ask the planner to choose among
// options or answer freely, and continues — every question and answer is a
// row of the agent run, never a write to the order. The run's end moves the
// order: planned, cancelled by the planner, or failed. If the order leaves
// `replanning` first — the planner gives up on the agent, or the stay times
// out — the run is voided, and whatever the agent delivers afterwards is
// refused at the order's version and never stored.

export type ReplanState = 'pending' | 'replanning' | 'confirmed';

export interface ReplanOrder extends LifecycleRecord {
  readonly plannerId: string;
  readonly plan: JsonObject | null;
  readonly status: ReplanState;
}

export interface ReplanTypes {
  record: ReplanOrder;
  state: ReplanState;
  parameters: { replanMinutes: number };
  services: SecondLayerServices;
}

export const REPLANS = 'twoLayerReplans';
export const AGENT_RUNS = 'twoLayerAgentRuns';

export type AgentRunStatus =
  'running' | 'waitingForUser' | 'finished' | 'failed' | 'cancelled' | 'void';

export interface AgentRun {
  readonly id: string;
  readonly orderId: string;
  readonly enteredVersion: number;
  readonly status: AgentRunStatus;
  /** The question waiting for the planner, and the choices it offers. */
  readonly question: string | null;
  readonly options: readonly string[];
  /** Every question and answer so far. */
  readonly turns: readonly JsonObject[];
  readonly result: JsonObject | null;
  readonly rowVersion: number;
}

function toRun(row: Row): AgentRun {
  return {
    id: String(row.id),
    orderId: String(row.orderId),
    enteredVersion: Number(row.enteredVersion),
    status: row.status as AgentRunStatus,
    question: (row.question ?? null) as string | null,
    options: (row.options ?? []) as string[],
    turns: (row.turns ?? []) as JsonObject[],
    result: (row.result ?? null) as JsonObject | null,
    rowVersion: Number(row.rowVersion),
  };
}

export const replanLifecycle: Lifecycle<ReplanTypes> =
  defineLifecycle<ReplanTypes>({
    name: REPLANS,
    initial: 'pending',
    states: ['pending', 'replanning', { name: 'confirmed', final: true }],
    parameters: { replanMinutes: 30 },
    transitions: {
      replan: {
        from: 'pending',
        to: 'replanning',
        guard: ({ record, actor }) =>
          isActor(actor, record.plannerId, 'Only the planner re-plans.'),
      },
      // The planner may also stop waiting for the agent at any time.
      stopReplanning: {
        from: 'replanning',
        to: 'pending',
        guard: ({ record, actor }) =>
          isActor(actor, record.plannerId, 'Only the planner stops it.'),
      },
      replanned: {
        from: 'replanning',
        to: 'confirmed',
        manual: false,
        accept: ['plan'],
      },
      replanCancelled: { from: 'replanning', to: 'pending', manual: false },
      replanFailed: { from: 'replanning', to: 'pending', manual: false },
      replanTimedOut: { from: 'replanning', to: 'pending', manual: false },
    },
    triggers: {
      timeout: {
        transition: 'replanTimedOut',
        when: 'replanning',
        after: ({ replanMinutes }) => replanMinutes * 60_000,
      },
    },
    onEnterState: {
      replanning: async ({ record, tx }) => {
        await rowsOf(tx.handle).insert(AGENT_RUNS, {
          orderId: String(record.id),
          enteredVersion: Number(record.lifecycleVersion),
          status: 'running',
          question: null,
          options: [],
          turns: [],
          result: null,
          rowVersion: 0,
        });
      },
    },
    onLeaveState: {
      replanning: async ({ record, tx, transition, services }) => {
        const rows = rowsOf(tx.handle);
        for (const run of (
          await rows.find(AGENT_RUNS, { orderId: String(record.id) })
        ).map(toRun))
          if (run.status === 'running' || run.status === 'waitingForUser') {
            await rows.update(
              AGENT_RUNS,
              run.id,
              { status: run.status, rowVersion: run.rowVersion },
              { status: 'void', rowVersion: run.rowVersion + 1 },
            );
            // Stopping the agent's process is outside the database: after
            // the commit, and only if the stay really ended.
            tx.afterCommit(() =>
              services.outbox.send(
                'agentRunner',
                `Abort agent run ${run.id}: ${transition}`,
                `abort:${run.id}`,
              ),
            );
          }
      },
    },
  });

/**
 * The agent's side and the planner's side of a run. Intermediate steps
 * change the run row alone, conditionally on its status and version; the
 * run's end fires the order's transition at the version the run began at.
 */
export class ReplanAgent {
  public constructor(private readonly runtime: LifecycleRuntime) {}

  private async step(
    tx: LifecycleTransaction,
    runId: string,
    expected: AgentRunStatus,
    values: Partial<Omit<AgentRun, 'id' | 'rowVersion'>>,
  ): Promise<AgentRun> {
    const rows = rowsOf(tx.handle);
    const row = await rows.get(AGENT_RUNS, runId);
    if (!row)
      throw new SecondLayerError('NOT_FOUND', `No agent run "${runId}".`);
    const run = toRun(row);
    if (run.status !== expected)
      throw new SecondLayerError(
        run.status === 'void' ? 'STALE' : 'NOT_YOUR_TURN',
        `The agent run is ${run.status}.`,
      );
    const written = await rows.update(
      AGENT_RUNS,
      runId,
      { status: run.status, rowVersion: run.rowVersion },
      { ...values, rowVersion: run.rowVersion + 1 },
    );
    if (!written)
      throw new SecondLayerError('CONFLICT', 'The run changed meanwhile.');
    return { ...run, ...values, rowVersion: run.rowVersion + 1 };
  }

  public current(orderId: RecordId): Promise<AgentRun | undefined> {
    return this.runtime.transaction(async (tx) =>
      (await rowsOf(tx.handle).find(AGENT_RUNS, { orderId: String(orderId) }))
        .map(toRun)
        .at(-1),
    );
  }

  /** The agent asks the planner to choose. */
  public ask(
    runId: string,
    question: string,
    options: readonly string[],
  ): Promise<AgentRun> {
    return this.runtime.transaction((tx) =>
      this.step(tx, runId, 'running', {
        status: 'waitingForUser',
        question,
        options,
      }),
    );
  }

  /**
   * The planner answers: one of the options, free text, or `cancel` — which
   * ends the run, and with it the stay.
   */
  public answer(
    runId: string,
    actor: LifecycleActor,
    answer: string,
  ): Promise<AgentRun> {
    return this.runtime.transaction(async (tx) => {
      const row = await rowsOf(tx.handle).get(AGENT_RUNS, runId);
      const order = row
        ? ((await tx.read(REPLANS, String(row.orderId))) as
            ReplanOrder | undefined)
        : undefined;
      if (!order || order.plannerId !== actor.id)
        throw new SecondLayerError('NOT_ASSIGNEE', 'Only the planner answers.');
      const run = toRun(row as Row);
      const turns = [...run.turns, { question: run.question, answer }];
      if (answer === 'cancel') {
        const ended = await this.step(tx, runId, 'waitingForUser', {
          status: 'cancelled',
          turns,
        });
        await tx.fire(REPLANS, order.id, 'replanCancelled', {
          actor,
          expect: { version: run.enteredVersion },
        });
        return ended;
      }
      return this.step(tx, runId, 'waitingForUser', {
        status: 'running',
        question: null,
        options: [],
        turns,
      });
    });
  }

  /** The agent delivers its plan: the run and the order end together. */
  public finish(runId: string, plan: JsonObject): Promise<AgentRun> {
    return this.runtime.transaction(async (tx) => {
      const done = await this.step(tx, runId, 'running', {
        status: 'finished',
        result: plan,
      });
      await tx.fire(REPLANS, done.orderId, 'replanned', {
        actor: SYSTEM_ACTOR,
        input: { plan },
        expect: { version: done.enteredVersion },
      });
      return done;
    });
  }

  public fail(runId: string, error: string): Promise<AgentRun> {
    return this.runtime.transaction(async (tx) => {
      const failed = await this.step(tx, runId, 'running', {
        status: 'failed',
        result: { error },
      });
      await tx.fire(REPLANS, failed.orderId, 'replanFailed', {
        actor: SYSTEM_ACTOR,
        input: { error },
        expect: { version: failed.enteredVersion },
      });
      return failed;
    });
  }
}
