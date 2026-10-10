import { createHash } from 'node:crypto';

import type { IdGeneratorService } from '@nocobase/snowflake';
import type { DatabaseManager, Row } from '@nocobase/db';

import {
  workflowStore,
  workflowStoreOf,
  type WorkflowStore,
} from '../collections/store.js';
import { NODE_RUN_STATUS } from './constants.js';
import type {
  WorkflowId,
  WorkflowLogger,
  WorkflowQueueTask,
  WorkflowResumeRequest,
} from './types.js';
import {
  asId,
  asIdFilter,
  asNullableString,
  noopWorkflowLogger,
  nowInstant,
  serializeJson,
} from './utils.js';

/**
 * `executing` is the one state a request starts in without a payload to
 * apply: the engine wrote it with the checkpoint that suspended a node whose
 * own background work — a Run node's script — produces the result. Whoever
 * runs that work claims the row, and on completion fills in the payload and
 * moves it to `queued`, from where it is applied like any other request.
 */
export const RESUME_REQUEST_STATE = {
  executing: 'executing',
  queued: 'queued',
  processing: 'processing',
  consumed: 'consumed',
  rejected: 'rejected',
} as const;

export type ResumeRequestState =
  (typeof RESUME_REQUEST_STATE)[keyof typeof RESUME_REQUEST_STATE];

/**
 * Why a request was rejected rather than applied: the node run had stopped
 * waiting or was waiting for another execution (`stale`), the run was over
 * (`run-ended`), the node run no longer exists (`target-missing`), or every
 * segment that applied it failed to commit (`commit-failed`).
 */
export type ResumeRequestRejection =
  'stale' | 'run-ended' | 'target-missing' | 'commit-failed';

export const DEFAULT_RESUME_PAYLOAD_BYTES = 65_536;

/**
 * How many segments may apply a request and fail to commit before it is
 * rejected. A failure that repeats this often is taken to be deterministic — a
 * value the database refuses — rather than a passing outage.
 */
export const MAX_RESUME_ATTEMPTS = 5;

/** Where a request stands, for a caller holding its `requestId`. */
export type ResumeRequestStatus =
  | {
      status: 'executing' | 'queued' | 'processing' | 'consumed';
      reason: null;
    }
  | { status: 'rejected'; reason: ResumeRequestRejection }
  | { status: 'not-found' };

export interface SubmitResumeInput {
  readonly runId: WorkflowId;
  readonly nodeRunId: WorkflowId;
  readonly nodeKey: string;
  /** Type of the instruction that interprets the payload. */
  readonly instructionType: string;
  /** Stable key chosen by the caller; repeating it with the same payload is a no-op. */
  readonly idempotencyKey: string;
  /** Instruction-defined JSON. */
  readonly payload: unknown;
  /** Upper bound on the encoded payload; `Infinity` leaves it unbounded. */
  readonly maxPayloadBytes?: number;
}

export type SubmitResumeResult =
  | { status: 'accepted' | 'duplicate'; requestId: string }
  /** The node run is no longer pending, so there is nothing to resume. */
  | { status: 'stale' }
  /** Another request for this node run is still live. */
  | { status: 'busy' };

export interface ResumeRequestServiceOptions {
  database: DatabaseManager;
  connectionName?: string;
  idGenerator: IdGeneratorService;
  /** Publishes the task that makes the Dispatcher apply the request. */
  enqueue: (task: WorkflowQueueTask) => Promise<void>;
  logger?: WorkflowLogger;
}

/**
 * Throws unless `value` is plain JSON, and returns a detached copy of it.
 *
 * What is stored has to survive a round trip through the database unchanged,
 * and a payload is read back by a different process than the one that wrote it,
 * so anything JSON would silently reshape — a class instance, `undefined`, a
 * cycle — is refused up front.
 */
export function assertJsonPayload(
  value: unknown,
  maxBytes: number = DEFAULT_RESUME_PAYLOAD_BYTES,
): unknown {
  const visit = (item: unknown, ancestors: Set<object>): void => {
    if (item === null || typeof item === 'string' || typeof item === 'boolean')
      return;
    if (typeof item === 'number' && Number.isFinite(item)) return;
    if (typeof item !== 'object' || ancestors.has(item))
      throw new TypeError('Resume payload must be JSON');
    if (
      !Array.isArray(item) &&
      Object.getPrototypeOf(item) !== Object.prototype &&
      Object.getPrototypeOf(item) !== null
    )
      throw new TypeError('Resume payload must be plain JSON');
    ancestors.add(item);
    for (const entry of Object.values(item)) visit(entry, ancestors);
    ancestors.delete(item);
  };
  visit(value, new Set());
  const encoded = JSON.stringify(value);
  if (encoded === undefined || Buffer.byteLength(encoded, 'utf8') > maxBytes)
    throw new TypeError(
      `Resume payload must be JSON within ${maxBytes} UTF-8 bytes`,
    );
  return JSON.parse(encoded) as unknown;
}

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, item]) => [key, canonicalJson(item)]),
    );
  }
  return value;
}

/** Hash of a payload that ignores the order of object keys. */
export function hashResumePayload(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalJson(payload)))
    .digest('hex');
}

export function hydrateResumeRequest(row: Row): WorkflowResumeRequest {
  return {
    id: asId(row.id),
    workflowRunId: asId(row.workflowRunId, 'workflowRunId'),
    nodeRunId: asId(row.nodeRunId, 'nodeRunId'),
    nodeKey: String(row.nodeKey),
    instructionType: String(row.instructionType),
    idempotencyKey: String(row.idempotencyKey),
    payload: row.payload ?? null,
    payloadHash: String(row.payloadHash),
    state: String(row.state) as ResumeRequestState,
    reason: asNullableString(row.reason),
    attempts: Number(row.attempts ?? 0),
    createdAt: asNullableString(row.createdAt) ?? new Date(0).toISOString(),
    claimToken: asNullableString(row.claimToken),
    claimedAt: asNullableString(row.claimedAt),
  };
}

/**
 * The one durable way into a suspended node from outside its Processor.
 *
 * A node that suspends and is resumed by something else — a wait receiving an
 * event, a run node reporting what its background code returned — describes the
 * resumption as a request instead of reaching into the run. The request is
 * written before anything is published, so a lost message, a crashed worker or
 * a busy run costs a delay and not the resumption.
 */
export class ResumeRequestService {
  private readonly options: ResumeRequestServiceOptions;

  constructor(options: ResumeRequestServiceOptions) {
    this.options = options;
  }

  private get logger(): WorkflowLogger {
    return this.options.logger ?? noopWorkflowLogger;
  }

  private get store(): WorkflowStore {
    return workflowStore(this.options.database, this.options.connectionName);
  }

  /**
   * The request already recorded for `idempotencyKey`, as a `duplicate`
   * receipt, or `null` when there is none. Throws when the key was used for a
   * different payload, because replaying it would silently drop one of them.
   */
  async findDuplicate(
    input: Pick<
      SubmitResumeInput,
      'runId' | 'nodeKey' | 'idempotencyKey' | 'payload' | 'maxPayloadBytes'
    >,
  ): Promise<{ status: 'duplicate'; requestId: string } | null> {
    const payload = assertJsonPayload(input.payload, input.maxPayloadBytes);
    return this.duplicateOf(input, hashResumePayload(payload));
  }

  private async duplicateOf(
    input: Pick<SubmitResumeInput, 'runId' | 'nodeKey' | 'idempotencyKey'>,
    hash: string,
  ): Promise<{ status: 'duplicate'; requestId: string } | null> {
    const existing = await this.store.resumeRequests.findOne({
      filter: {
        workflowRunId: asIdFilter(input.runId),
        nodeKey: input.nodeKey,
        idempotencyKey: input.idempotencyKey,
      },
    });
    if (!existing) return null;
    if (existing.payloadHash !== hash)
      throw new Error(
        'Resume idempotency key conflicts with a different payload',
      );
    return { status: 'duplicate', requestId: String(asId(existing.id)) };
  }

  /**
   * Where the request stands. `accepted` only means it was recorded: it can
   * still be rejected when it is applied — the run ended, the node was rerun or
   * finished meanwhile, or its checkpoint kept failing — and this is how the
   * caller finds out. `instructionType` narrows the lookup to the requests of
   * one instruction, so an API handing out ids of its own requests cannot be
   * used to read another's.
   */
  async get(
    requestId: WorkflowId,
    instructionType?: string,
  ): Promise<ResumeRequestStatus> {
    // Ids come back from callers, so one that could not have been issued is
    // answered as unknown rather than thrown on.
    if (
      !/^\d+$/.test(String(requestId)) ||
      !Number.isSafeInteger(Number(requestId))
    )
      return { status: 'not-found' };
    const row = await this.store.resumeRequests.findOne({
      filter: {
        id: asIdFilter(requestId),
        ...(instructionType === undefined ? {} : { instructionType }),
      },
      select: (select) => select.fields('state', 'reason'),
    });
    if (!row) return { status: 'not-found' };
    const state = asNullableString(row.state) as ResumeRequestState;
    return state === RESUME_REQUEST_STATE.rejected
      ? {
          status: 'rejected',
          reason: (asNullableString(row.reason) ??
            'stale') as ResumeRequestRejection,
        }
      : { status: state, reason: null };
  }

  async submit(input: SubmitResumeInput): Promise<SubmitResumeResult> {
    if (
      !input.idempotencyKey ||
      !input.nodeKey ||
      input.idempotencyKey.length > 255 ||
      input.nodeKey.length > 255
    )
      throw new TypeError(
        'Resume nodeKey and idempotencyKey must contain 1 to 255 characters',
      );
    const payload = assertJsonPayload(input.payload, input.maxPayloadBytes);
    const hash = hashResumePayload(payload);
    const duplicate = await this.duplicateOf(input, hash);
    if (duplicate) return duplicate;

    const requestId = this.options.idGenerator.generate();
    try {
      // The target is checked in the transaction that takes its slot, and with
      // a write rather than a read: a plain read sees the node run as pending
      // while a checkpoint completing it is about to commit, whereas a no-op
      // update takes the row lock that checkpoint also needs. Whichever comes
      // second waits for the first and then sees what it wrote, so a request is
      // never accepted for a node run that has just stopped waiting. (Counting
      // matched rather than changed rows on MySQL relies on mysql2's default
      // FOUND_ROWS flag.)
      const accepted = await this.options.database.transaction(
        async (connection) => {
          const store = workflowStoreOf(connection);
          const locked = await store.nodeRuns.updateMany({
            filter: {
              id: asIdFilter(input.nodeRunId),
              status: NODE_RUN_STATUS.PENDING,
            },
            values: { status: NODE_RUN_STATUS.PENDING },
          });
          if (!locked.updatedCount) return false;
          await store.resumeRequests.createOne({
            values: {
              id: requestId,
              workflowRunId: asIdFilter(input.runId),
              nodeRunId: asIdFilter(input.nodeRunId),
              nodeKey: input.nodeKey,
              instructionType: input.instructionType,
              idempotencyKey: input.idempotencyKey,
              payload: serializeJson(payload),
              payloadHash: hash,
              state: RESUME_REQUEST_STATE.queued,
              attempts: 0,
              slot: 'active',
              createdAt: nowInstant(),
              claimToken: null,
              claimedAt: null,
            },
          });
          return true;
        },
        this.options.connectionName,
      );
      if (!accepted) return { status: 'stale' };
    } catch (error) {
      const raced = await this.duplicateOf(input, hash);
      if (raced) return raced;
      const active = await this.store.resumeRequests.findOne({
        filter: { nodeRunId: asIdFilter(input.nodeRunId), slot: 'active' },
      });
      if (active) return { status: 'busy' };
      throw error;
    }
    await this.publish({
      executionId: input.runId,
      nodeRunId: input.nodeRunId,
      resumeRequestId: requestId,
    });
    return { status: 'accepted', requestId: String(requestId) };
  }

  /**
   * The durable request is authoritative, so a failed publication only delays
   * it: recovery republishes whatever is still queued once the grace period has
   * passed.
   */
  async publish(task: WorkflowQueueTask): Promise<void> {
    try {
      await this.options.enqueue(task);
    } catch (error) {
      this.logger.error('Workflow resume request could not be published', {
        executionId: task.executionId,
        resumeRequestId: task.resumeRequestId,
        error,
      });
    }
  }
}
