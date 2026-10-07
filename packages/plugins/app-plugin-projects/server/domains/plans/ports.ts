/**
 * The plan engine as other plugins and this plugin's routes use it (the contract is `shared/plans.ts`).
 *
 * - The browser goes through `/api/projects/plans` (`plan.routes.ts`), which calls the methods below with the request's
 *   `Viewer`.
 * - The agents plugin's bridge calls them with a `Viewer` it builds for the asker: the asker's own user id and their
 *   permissions narrowed to what the agent is configured with, and an actor `{ type: 'user', id, via: 'agent', trace:
 *   { agentId, runId, conversationId } }`. `rehearse` tells it whether a change may be a direct write (no risk flags,
 *   at most two objects) or needs a plan; `create(…, { execute: true })` makes a direct write undoable like a plan.
 * - A plugin proposing to someone else (a status rule suggesting executors to an issue's owner) uses `propose`: the
 *   plan is rehearsed with the decider's own permissions (`ProjectsAccess.permissionsOfUser`).
 * - `PlanHooks.onPlanDecided` (bound through `projectsPlanHooksToken`) hears every decision, in the transaction that
 *   records it.
 */
import type { Page } from '../../../shared/common.js';
import type {
  CreatePlanRequest,
  EditPlanRequest,
  Plan,
  PlanActionRequest,
  PlanDecided,
  PlanListQuery,
  PlanRehearsal,
  PlanSource,
  PlanUndoPreview,
} from '../../../shared/plans.js';
import type { Context } from 'hono';

import type { Viewer } from '../../access/viewer.js';
import type { Actor } from '../../kernel/actor.js';
import type { Tx } from '../../kernel/tx.js';

export interface PlanHooks {
  /**
   * A plan was executed, failed, went stale, was voided by a person or was undone. Runs in the transaction that records
   * the outcome (for `executed` and `undone`, the one that applied the rows or reverted them): what it writes commits with it. Throwing
   * fails that transaction, so a hook should catch what it can live without.
   */
  onPlanDecided?(tx: Tx, decided: PlanDecided): Promise<void>;
}

/** A plan the person just executed, as a source's own follow-up sees it (`PlanDeps.onExecuted`). */
export interface ExecutedPlan {
  readonly sourceKind: string;
  readonly sourceData: unknown;
  /** Who executed it, as the rows ran. */
  readonly viewer: Viewer;
  /** Each row's ref and what it created, in order. */
  readonly rows: readonly {
    readonly ref: string | null;
    readonly created: {
      readonly type: string;
      readonly id: string | null;
    } | null;
  }[];
}

/**
 * Runs in the transaction that executed a plan, after its rows: what it writes commits with them, and
 * throwing fails the execution.
 */
export type PlanExecutedHook = (tx: Tx, plan: ExecutedPlan) => Promise<void>;

export interface CreatePlanOptions {
  /** Executes the plan right after storing it, as the same viewer (a direct write that stays undoable). */
  readonly execute?: boolean;
}

export interface PlanService {
  /** Rehearses the rows as the viewer and stores nothing. */
  rehearse(viewer: Viewer, input: CreatePlanRequest): Promise<PlanRehearsal>;
  /**
   * Rehearses and stores a plan the viewer decides; 400 `PLAN_INVALID` with every row's check when a row fails. Voids
   * the viewer's open plans with the same `source.key`.
   */
  create(
    viewer: Viewer,
    input: CreatePlanRequest,
    options?: CreatePlanOptions,
  ): Promise<Plan>;
  /** As `create`, for `input.deciderUserId`, rehearsed with that person's permissions; submitted by `by`. */
  propose(
    input: CreatePlanRequest & { readonly deciderUserId: string },
    by?: Actor,
  ): Promise<Plan>;
  get(viewer: Viewer, id: string): Promise<Plan>;
  list(viewer: Viewer, query: PlanListQuery): Promise<Page<Plan>>;
  edit(viewer: Viewer, id: string, input: EditPlanRequest): Promise<Plan>;
  /** Executes it as the viewer; answers the plan `executed`, `stale` or `failed`. */
  execute(viewer: Viewer, id: string, input: PlanActionRequest): Promise<Plan>;
  /** Rehearses a `failed` or `stale` plan again, with fresh baselines; `pending` when every row passes. */
  retry(viewer: Viewer, id: string, input: PlanActionRequest): Promise<Plan>;
  void(viewer: Viewer, id: string, input: PlanActionRequest): Promise<Plan>;
  /** What undoing an executed plan would revert now, and what it would leave alone; changes nothing. */
  previewUndo(viewer: Viewer, id: string): Promise<PlanUndoPreview>;
  /**
   * Undoes an executed plan at once, in one transaction, as the viewer (the person who executed it): the rows the
   * preview lists are reverted, the plan becomes `undone`. 409 `UNDO_STALE` when something changed meanwhile.
   */
  undo(viewer: Viewer, id: string): Promise<Plan>;
  /** Marks open plans past their expiry `expired`; answers how many. Reads expire lazily too. */
  expire(now?: Date): Promise<number>;
}

/**
 * Where the plans a request proposes come from, when the application decides it from the request's credential (the assembling application:
 * an agent's run in a person's conversation proposes as `conversation`, or `intake` from the AI draft tab, keyed
 * `conversation:<id>`, so a newer plan replaces the open one). `null` refuses the request any plan (an agent working on
 * an issue); undefined leaves the source to the request. `POST /plans` stores the plan with it, and `GET /plans` lists
 * that source's plans unless asked for `all`.
 */
export type PlanSourceOf = (
  context: Context,
) => Promise<PlanSource | null | undefined>;
