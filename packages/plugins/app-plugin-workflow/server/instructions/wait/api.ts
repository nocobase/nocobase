import type { DatabaseManager } from '@nocobase/db';
import { workflowStore, type WorkflowStore } from '../../collections/store.js';
import { EXECUTION_STATUS, NODE_RUN_STATUS } from '../../engine/constants.js';
import {
  assertJsonPayload,
  type ResumeRequestService,
  type ResumeRequestStatus,
} from '../../engine/resume-requests.js';
import type { WorkflowId, WorkflowQueueTask } from '../../engine/types.js';
import { asIdFilter, loadRun, loadWorkflow } from '../../engine/utils.js';

export interface WaitTarget {
  runId: WorkflowId;
  nodeKey: string;
}

export interface WaitDecision extends WaitTarget {
  status:
    | typeof NODE_RUN_STATUS.RESOLVED
    | typeof NODE_RUN_STATUS.FAILED
    | typeof NODE_RUN_STATUS.ERROR
    | typeof NODE_RUN_STATUS.PENDING;
  result?: unknown;
  error?: string;
  idempotencyKey: string;
}

export type WaitLookup =
  | { status: 'pending'; correlation: unknown }
  | {
      status:
        | 'not-ready'
        | 'finished'
        | 'run-ended'
        | 'run-not-found'
        | 'node-not-found'
        | 'ambiguous';
    };

/** What a wait's resume request carries, and what its `resume()` turns back into a node result. */
export interface WaitResumePayload {
  status: WaitDecision['status'];
  result: unknown;
  error: string | null;
}

export type WaitResumeReceipt =
  | { status: 'accepted' | 'duplicate'; requestId: string }
  | {
      status:
        | 'not-ready'
        | 'finished'
        | 'run-ended'
        | 'run-not-found'
        | 'node-not-found'
        | 'ambiguous'
        | 'busy';
    };

type LocatedWait =
  | Exclude<WaitLookup, { status: 'pending' }>
  | { status: 'pending'; nodeRunId: WorkflowId; correlation: unknown };

export class WaitInstructionApi {
  private readonly store: WorkflowStore;

  constructor(
    private readonly context: {
      database: DatabaseManager;
      connectionName?: string;
      enqueue: (task: WorkflowQueueTask) => Promise<void>;
      resumeRequests: ResumeRequestService;
    },
  ) {
    this.store = workflowStore(context.database, context.connectionName);
  }

  async getPending(target: WaitTarget): Promise<WaitLookup> {
    const located = await this.locate(target);
    return located.status === 'pending'
      ? { status: 'pending', correlation: located.correlation }
      : located;
  }

  private async locate(target: WaitTarget): Promise<LocatedWait> {
    const run = await loadRun(this.store, target.runId);
    if (!run) return { status: 'run-not-found' };
    if (run.status === EXECUTION_STATUS.QUEUEING)
      return { status: 'not-ready' };
    if (
      run.status !== EXECUTION_STATUS.STARTED ||
      (run.expiresAt && Date.parse(run.expiresAt) <= Date.now())
    )
      return { status: 'run-ended' };
    const workflow = await loadWorkflow(this.store, run.workflowId);
    if (
      !workflow?.nodes.some(
        (node) => node.key === target.nodeKey && node.type === 'wait',
      )
    )
      return { status: 'node-not-found' };
    const rows = await this.store.nodeRuns.findMany({
      filter: {
        workflowRunId: asIdFilter(target.runId),
        nodeKey: target.nodeKey,
      },
      sort: (sort) => sort.field('id').desc(),
    });
    const pending = rows.filter(
      (row) => Number(row.status) === NODE_RUN_STATUS.PENDING,
    );
    if (pending.length > 1) return { status: 'ambiguous' };
    if (!pending.length)
      return { status: rows.length ? 'finished' : 'not-ready' };
    const nodeRun = pending[0];
    const meta = nodeRun.meta as { wait?: { correlation?: unknown } } | null;
    return {
      status: 'pending',
      nodeRunId: nodeRun.id as WorkflowId,
      correlation: meta?.wait?.correlation ?? null,
    };
  }

  /**
   * Where a decision `resume()` accepted stands now. `accepted` means the
   * decision was recorded, not applied: it is `consumed` once the wait has taken
   * it, and `rejected` with a `reason` when it never will — the run ended, the
   * wait finished or was rerun first, or applying it kept failing.
   */
  async getRequest(requestId: string): Promise<ResumeRequestStatus> {
    return this.context.resumeRequests.get(requestId, 'wait');
  }

  async resume(decision: WaitDecision): Promise<WaitResumeReceipt> {
    if (
      !decision.idempotencyKey ||
      !decision.nodeKey ||
      decision.idempotencyKey.length > 255 ||
      decision.nodeKey.length > 255
    )
      throw new TypeError(
        'Wait nodeKey and idempotencyKey must contain 1 to 255 characters',
      );
    if (
      ![
        NODE_RUN_STATUS.RESOLVED,
        NODE_RUN_STATUS.FAILED,
        NODE_RUN_STATUS.ERROR,
        NODE_RUN_STATUS.PENDING,
      ].includes(decision.status)
    )
      throw new TypeError('Unsupported wait decision status');
    if (decision.error !== undefined && typeof decision.error !== 'string')
      throw new TypeError('Wait error must be a string');
    const payload: WaitResumePayload = {
      status: decision.status,
      result: assertJsonPayload(decision.result ?? null),
      error: decision.error ?? null,
    };
    const requests = this.context.resumeRequests;
    // A repeated event is answered from what was recorded for it, even once the
    // wait it resumed has finished.
    const duplicate = await requests.findDuplicate({
      runId: decision.runId,
      nodeKey: decision.nodeKey,
      idempotencyKey: decision.idempotencyKey,
      payload,
    });
    if (duplicate) return duplicate;
    const lookup = await this.locate(decision);
    if (lookup.status !== 'pending') return lookup;
    const receipt = await requests.submit({
      runId: decision.runId,
      nodeRunId: lookup.nodeRunId,
      nodeKey: decision.nodeKey,
      instructionType: 'wait',
      idempotencyKey: decision.idempotencyKey,
      payload,
    });
    // The node run stopped waiting between locating it and recording the
    // request, which is what an already finished wait looks like.
    return receipt.status === 'stale' ? { status: 'finished' } : receipt;
  }
}
