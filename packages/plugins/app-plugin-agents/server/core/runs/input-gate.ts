/**
 * The subject's admission and input policy (`ContextProvider.admit` and `selectInputs`) applied to a run that is
 * already working: before new input joins it, and before its pending input is delivered.
 */
import type { RunInput } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agent } from '../../../shared/agents.js';
import { findAgent } from '../agents/index.js';
import {
  inputsRepo,
  pendingInputs,
  toInput,
  toRun,
  type InputRecord,
  type RunRecord,
} from './run.store.js';
import { dialectOf, type SubjectRegistry } from './ports.js';

export interface InputGateDeps {
  readonly subjects: SubjectRegistry;
  readonly cliName: string;
  readonly appName: string;
}

/**
 * Of `inputs` for `run`, the ones its agent may act on now: none when the subject rejects the agent's work on it, else
 * what the subject selects. Without a policy, all of them.
 */
export async function gateInputs(
  conn: DatabaseConnection,
  deps: InputGateDeps,
  run: RunRecord,
  agent: Agent,
  inputs: readonly RunInput[],
): Promise<readonly RunInput[]> {
  const context = deps.subjects.get(run.subjectKind)?.context;
  if (!context || inputs.length === 0) return inputs;
  const claim = {
    run: toRun(run),
    agent,
    runner: null,
    inputs,
    cli: deps.cliName,
    appName: deps.appName,
    dialect: dialectOf(agent),
  };
  if (await context.admit?.(conn, claim)) return [];
  return context.selectInputs
    ? await context.selectInputs(conn, claim)
    : inputs;
}

/** Marks the inputs of `ids` handled without delivering them: the run is not to act on them. */
export async function dropInputs(
  conn: DatabaseConnection,
  ids: readonly string[],
  now: string,
): Promise<void> {
  if (ids.length === 0) return;
  await inputsRepo(conn).updateMany({
    filter: (f) =>
      f.and([
        f.or(ids.map((id) => f.string('id').eq(id))),
        f.date('handledAt').empty(),
      ]),
    values: { handledAt: now },
  });
}

/** A working run's unhandled input, split by whether the run may still act on it. */
export interface GatedPending {
  /** What the run was already given, and the new input the subject still admits and selects. */
  readonly kept: readonly InputRecord[];
  /** New input the subject no longer lets the run act on. */
  readonly withheld: readonly InputRecord[];
}

/**
 * Splits `run`'s unhandled input by the subject's policy. Input already delivered stays with the run, whatever
 * happened since; only input not yet delivered is judged.
 */
export async function gatePending(
  conn: DatabaseConnection,
  deps: InputGateDeps,
  run: RunRecord,
): Promise<GatedPending> {
  const pending = await pendingInputs(conn, run.id);
  const fresh = pending.filter((input) => !input.deliveredAt);
  const agent = fresh.length > 0 ? await findAgent(conn, run.agentId) : null;
  if (!agent) return { kept: pending, withheld: [] };
  const admitted = new Set(
    (await gateInputs(conn, deps, run, agent, fresh.map(toInput))).map(
      (input) => input.id,
    ),
  );
  const withheld = fresh.filter((input) => !admitted.has(input.id));
  return {
    kept: pending.filter((input) => !withheld.includes(input)),
    withheld,
  };
}
