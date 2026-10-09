/**
 * Run requests: work someone asked of an agent on a subject another person answers for. Work somebody else causes runs
 * only with the consent of the subject's responsible, or on the asker's own account:
 *
 * - `enqueue` with a `responsibleUserId` whose source is someone else, and `execution` `auto`, stores a request here
 *   instead of queueing anything (`run.service.ts`).
 * - Only the responsible confirms (queued as them, the input as it was asked, its actor the asker) or rejects it; not
 *   an administrator, not a manager of agents, not a run acting for anyone. A subject's responsible resolver checks
 *   that they still answer for it; without one, the application must reassign on changes. Confirming rechecks access.
 * - The asker withdraws it, or runs it as themselves on a runner they may use (`runAsRequester`).
 * - When the subject's responsible changes, the application hands the pending requests on (`reassign`).
 * - Nobody settling it within `RUN_REQUEST_TTL_MS` expires it (the sweeper's `expireDue`), and the asker hears they may
 *   run it as themselves.
 *
 * A request leaves `pending` once and never changes status again.
 */
import type {
  ActorKind,
  RunInputType,
  RunStatus,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection, Repository } from '@nocobase/db';
import { isDeepStrictEqual } from 'node:util';

import type { Agent } from '../../../shared/agents.js';
import type {
  RunRequest,
  RunRequestItem,
  RunRequestStatus,
} from '../../../shared/runs.js';
import type { Clock } from '../../kernel/clock.js';
import {
  conflict,
  forbidden,
  notFound,
  precondition,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { People } from '../../kernel/people.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { asJson, cleanList, stringArray } from '../../kernel/values.js';
import { findAgent, lockAgentForClaim } from '../agents/index.js';

/** How long a request waits for its responsible: seven days. */
export const RUN_REQUEST_TTL_MS: number = 7 * 24 * 60 * 60 * 1000;

/** How many requests one sweep expires at most; the next sweep takes the rest. */
const EXPIRE_BATCH = 100;

export interface RunRequestRecord {
  readonly id: string;
  readonly agentId: string;
  readonly subjectKind: string;
  readonly subjectId: string;
  readonly threadScope: string;
  readonly responsibleUserId: string;
  readonly requestedByUserId: string;
  readonly ownerUserId: string | null;
  readonly priority: number;
  readonly requires: readonly unknown[];
  readonly fireAt: string | null;
  readonly maxAttempts: number | null;
  readonly inputType: string;
  readonly inputActorKind: string;
  readonly inputActorId: string;
  readonly inputActorName: string;
  readonly inputText: string;
  readonly inputPayload: unknown;
  readonly status: RunRequestStatus;
  readonly settledById: string | null;
  readonly settledAt: string | null;
  readonly note: string | null;
  readonly expiresAt: string;
  readonly runId: string | null;
  readonly supersededById: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function runRequestsRepo(
  conn: DatabaseConnection,
): Repository<RunRequestRecord> {
  return conn.repository<RunRequestRecord>('agRunRequests');
}

export function toRunRequest(record: RunRequestRecord): RunRequest {
  return {
    id: record.id,
    agentId: record.agentId,
    subject: { kind: record.subjectKind, id: record.subjectId },
    threadScope: record.threadScope,
    responsibleUserId: record.responsibleUserId,
    requestedByUserId: record.requestedByUserId,
    ownerUserId: record.ownerUserId,
    fireAt: record.fireAt,
    maxAttempts:
      record.maxAttempts === null ? null : Number(record.maxAttempts),
    input: {
      type: record.inputType as RunInputType,
      actor: {
        kind: record.inputActorKind as ActorKind,
        id: record.inputActorId,
        name: record.inputActorName,
      },
      text: record.inputText,
      payload: record.inputPayload ?? null,
    },
    status: record.status,
    settledById: record.settledById,
    settledAt: record.settledAt,
    note: record.note,
    expiresAt: record.expiresAt,
    runId: record.runId,
    supersededById: record.supersededById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** What a new request holds: the work as `enqueue` was asked for it. */
export interface NewRunRequest {
  readonly agentId: string;
  readonly subject: { readonly kind: string; readonly id: string };
  readonly threadScope: string;
  readonly responsibleUserId: string;
  readonly requestedByUserId: string;
  readonly ownerUserId: string | null;
  readonly priority: number;
  readonly requires: readonly string[];
  /** Not to be claimed before this moment; null for as soon as it is confirmed. */
  readonly fireAt: string | null;
  /** Attempts the run may take; null for the agent's default. */
  readonly maxAttempts: number | null;
  readonly input: {
    readonly type: RunInputType;
    readonly actor: {
      readonly kind: ActorKind;
      readonly id: string;
      readonly name: string;
    };
    readonly text: string;
    readonly payload?: unknown;
  };
}

/** Stores a pending request in `unit` and announces it; it expires `RUN_REQUEST_TTL_MS` from now. */
export async function insertRunRequest(
  unit: Tx,
  deps: { readonly ids: IdSource; readonly clock: Clock },
  request: NewRunRequest,
): Promise<RunRequest> {
  const now = deps.clock.now();
  // Serializes retries for this agent; duplicate input never creates another inbox entry or renews its expiry.
  await lockAgentForClaim(unit.conn, request.agentId, now.toISOString());
  const pending = await runRequestsRepo(unit.conn).findMany({
    filter: {
      agentId: request.agentId,
      subjectKind: request.subject.kind,
      subjectId: request.subject.id,
      threadScope: request.threadScope,
      responsibleUserId: request.responsibleUserId,
      requestedByUserId: request.requestedByUserId,
      status: 'pending',
    },
  });
  const duplicate = pending.find(
    (record) =>
      Date.parse(record.expiresAt) > now.getTime() &&
      record.ownerUserId === request.ownerUserId &&
      Number(record.priority) === request.priority &&
      isDeepStrictEqual(
        stringArray(record.requires),
        cleanList([...request.requires]),
      ) &&
      record.fireAt === request.fireAt &&
      record.maxAttempts === request.maxAttempts &&
      record.inputType === request.input.type &&
      record.inputActorKind === request.input.actor.kind &&
      record.inputActorId === request.input.actor.id &&
      record.inputActorName === request.input.actor.name &&
      record.inputText === request.input.text &&
      isDeepStrictEqual(
        record.inputPayload ?? null,
        asJson(request.input.payload),
      ),
  );
  if (duplicate) return toRunRequest(duplicate);
  const id = deps.ids.next();
  await runRequestsRepo(unit.conn).createOne({
    values: {
      id,
      agentId: request.agentId,
      subjectKind: request.subject.kind,
      subjectId: request.subject.id,
      threadScope: request.threadScope,
      responsibleUserId: request.responsibleUserId,
      requestedByUserId: request.requestedByUserId,
      ownerUserId: request.ownerUserId,
      priority: request.priority,
      requires: cleanList([...request.requires]),
      fireAt: request.fireAt,
      maxAttempts: request.maxAttempts,
      inputType: request.input.type,
      inputActorKind: request.input.actor.kind,
      inputActorId: request.input.actor.id,
      inputActorName: request.input.actor.name,
      inputText: request.input.text,
      inputPayload: asJson(request.input.payload),
      status: 'pending',
      settledById: null,
      settledAt: null,
      note: null,
      expiresAt: new Date(now.getTime() + RUN_REQUEST_TTL_MS).toISOString(),
      runId: null,
      supersededById: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  });
  const created = toRunRequest(
    (await runRequestsRepo(unit.conn).findOne({ filter: { id } }))!,
  );
  unit.emit({ type: 'runRequest.created', request: created });
  return created;
}

/** A run a request went into, as `enqueue` answers it. */
export interface RequestedRun {
  readonly runId: string;
  readonly outcome: 'created' | 'merged' | 'appended';
  readonly status: RunStatus;
  /** The request's input, as the run received it. */
  readonly inputId: string;
}

/** Work queued straight away, as `runs.enqueue` queues it once nobody needs to confirm it. */
export interface DirectRun {
  readonly agent: Agent;
  readonly subject: { readonly kind: string; readonly id: string };
  readonly threadScope: string;
  readonly actorUserId: string;
  readonly requestedByUserId: string;
  readonly confirmedByUserId: string | null;
  readonly ownerUserId: string | null;
  readonly priority: number;
  readonly requires: readonly string[];
  readonly fireAt: string | null;
  readonly maxAttempts: number | null;
  readonly input: NewRunRequest['input'];
}

export interface RunRequestFilter {
  /** Only the requests this person answers for or asked. */
  readonly userId: string;
  /** `responsible`: the ones they answer for; `requester`: the ones they asked; both when left out. */
  readonly role?: 'responsible' | 'requester';
  readonly status?: RunRequestStatus;
  readonly subject?: { readonly kind: string; readonly id?: string };
  readonly agentId?: string;
  readonly limit?: number;
  /** The newest-first position to read after: the last request of the previous page. */
  readonly cursor?: { readonly createdAt: string; readonly id: string };
}

/** What handing a subject's pending requests to a new responsible did. */
export interface RunRequestReassignment {
  /** The requests handed on, now `superseded`. */
  readonly superseded: readonly RunRequest[];
  /** The requests made for the new responsible in their place. */
  readonly created: readonly RunRequest[];
  /** Work the new responsible had asked for themselves, queued as them at once. */
  readonly queued: readonly RequestedRun[];
  /** Requests past their deadline or without a usable new responsible, expired with a notice instead of handed on. */
  readonly expired: readonly RunRequest[];
}

export interface RunRequestService {
  /** The request with the names its lists show; 404 when there is none. Whoever calls decides who may see it. */
  get(requestId: string): Promise<RunRequestItem>;
  /** The requests a person answers for or asked, newest first. */
  list(filter: RunRequestFilter): Promise<RunRequestItem[]>;
  /** The pending requests on a subject, of one agent or of any, oldest first; read on `conn`. */
  pendingOn(
    conn: DatabaseConnection,
    subject: { readonly kind: string; readonly id: string },
    agentId?: string,
  ): Promise<RunRequest[]>;
  /**
   * The responsible agrees: the work is queued as them with the input as it was asked (its actor the asker), joining
   * their run on the subject when it can still be told. Only `byUserId` equal to the request's responsible, who may
   * still wake the agent. The subject's current responsible resolver is checked when bound; otherwise the
   * application must reassign requests on responsibility changes.
   */
  confirm(
    requestId: string,
    byUserId: string,
  ): Promise<{ readonly request: RunRequest; readonly run: RequestedRun }>;
  /** The responsible declines; only them. */
  reject(
    requestId: string,
    byUserId: string,
    note?: string,
  ): Promise<RunRequest>;
  /** The asker takes it back; only them. */
  withdraw(requestId: string, byUserId: string): Promise<RunRequest>;
  /**
   * The asker runs it as themselves now, on a runner they may use (`NO_RUNNER_AVAILABLE` when none can run it): from a
   * pending request, which is then withdrawn, or from one that expired without going anywhere. Only them.
   */
  runAsRequester(
    requestId: string,
    byUserId: string,
  ): Promise<{ readonly request: RunRequest; readonly run: RequestedRun }>;
  /**
   * The subject's responsible changed (or it has none now, `toUserId` null): its pending requests (of one agent, or of
   * any) are superseded and asked again of the new responsible, who must be able to wake the agent; one the new
   * responsible had asked is queued as them at once. One whose time already ran out expires instead, neither renewed
   * nor queued. In `outer`, joins the caller's transaction.
   */
  reassign(
    request: {
      readonly subject: { readonly kind: string; readonly id: string };
      readonly agentId?: string;
      readonly toUserId: string | null;
      readonly byUserId: string | null;
      readonly note?: string;
    },
    outer?: Tx,
  ): Promise<RunRequestReassignment>;
  /** Expires the pending requests whose time is up, and tells their askers; answers how many. */
  expireDue(): Promise<number>;
}

export interface RunRequestDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
  readonly people: Pick<People, 'names'>;
  /** Undefined when the subject has no resolver; otherwise its current responsible (null when unassigned). */
  readonly currentResponsible?: (
    unit: Tx,
    subject: { readonly kind: string; readonly id: string },
  ) => Promise<string | null> | undefined;
  /** Whether the person may wake the agent. */
  readonly mayInvoke: (agent: Agent, userId: string) => boolean;
  /** The agent, if it can be woken by `userId`; refuses otherwise (`run.service.ts`'s check). */
  readonly requireInvocable: (
    unit: Tx,
    agentId: string,
    userId: string,
  ) => Promise<Agent>;
  /** Refuses with `NO_RUNNER_AVAILABLE` when no runner `userId` may use can run the agent now. */
  readonly requireRunnerFor: (
    unit: Tx,
    agent: Agent,
    userId: string,
    requires: readonly string[],
  ) => Promise<void>;
  /** Queues work at once (`run.service.ts`). */
  readonly direct: (unit: Tx, run: DirectRun) => Promise<RequestedRun>;
}

function settled(record: RunRequestRecord, status = record.status): Error {
  return precondition(
    'RUN_REQUEST_SETTLED',
    status === 'expired'
      ? 'The request expired.'
      : `The request is ${status} already.`,
    { status },
  );
}

export function createRunRequestService(
  deps: RunRequestDeps,
): RunRequestService {
  const { tx, clock } = deps;

  const require = async (
    conn: DatabaseConnection,
    id: string,
  ): Promise<RunRequestRecord> => {
    const record = await runRequestsRepo(conn).findOne({ filter: { id } });
    if (!record) throw notFound('Run request');
    return record;
  };

  /** Whether a pending request's time ran out, whether or not the sweeper has noticed yet. */
  const isDue = (record: RunRequestRecord): boolean =>
    Date.parse(record.expiresAt) <= clock.now().getTime();

  /**
   * Expires a pending request whose time ran out and tells the person who asked; false when something else moved it
   * first. The sweeper's pass and every other path that finds one due go through here.
   */
  async function expire(
    unit: Tx,
    record: RunRequestRecord,
    reason: 'timeout' | 'reassignment' = 'timeout',
  ): Promise<boolean> {
    const result = await runRequestsRepo(unit.conn).updateMany({
      filter: (f) =>
        f.and([f.string('id').eq(record.id), f.string('status').eq('pending')]),
      values: { status: 'expired', updatedAt: clock.now().toISOString() },
    });
    if (result.updatedCount !== 1) return false;
    const request = toRunRequest(await require(unit.conn, record.id));
    unit.emit({ type: 'runRequest.expired', request });
    const agentName =
      (await findAgent(unit.conn, record.agentId))?.name ?? record.agentId;
    unit.emit({
      type: 'notice',
      notice: {
        key: `run_request_expired:${record.id}`,
        type: 'run_request_expired',
        userIds: [record.requestedByUserId],
        subject: { kind: 'runRequest', id: record.id, label: agentName },
        title: `${agentName} did not run your request`,
        body: `${reason === 'timeout' ? 'Nobody confirmed your request in time' : 'The new responsible cannot run your request'}, so your request to ${agentName} on ${record.subjectKind} ${record.subjectId} expired. You can still run it as yourself, on your own runner or a team runner.`,
        params: {
          agentName,
          subjectKind: record.subjectKind,
          subjectId: record.subjectId,
          requestId: record.id,
          responsibleUserId: record.responsibleUserId,
          reason,
        },
      },
    });
    return true;
  }

  const requirePending = (record: RunRequestRecord): void => {
    if (record.status !== 'pending') throw settled(record);
    if (isDue(record)) throw settled(record, 'expired');
  };

  async function requireCurrentResponsible(
    unit: Tx,
    record: RunRequestRecord,
    byUserId: string,
  ): Promise<void> {
    const current = await deps.currentResponsible?.(unit, {
      kind: record.subjectKind,
      id: record.subjectId,
    });
    if (current !== undefined && current !== byUserId)
      throw forbidden('You no longer answer for this subject.');
  }

  /** Moves a pending request on, once: a concurrent change that moved it first wins. */
  async function settle(
    unit: Tx,
    record: RunRequestRecord,
    values: Partial<RunRequestRecord>,
  ): Promise<RunRequestRecord> {
    const result = await runRequestsRepo(unit.conn).updateMany({
      filter: (f) =>
        f.and([f.string('id').eq(record.id), f.string('status').eq('pending')]),
      values: { ...values, updatedAt: clock.now().toISOString() },
    });
    if (result.updatedCount !== 1)
      throw conflict('The request changed; read it again.');
    return require(unit.conn, record.id);
  }

  async function setRun(
    unit: Tx,
    id: string,
    runId: string,
  ): Promise<RunRequestRecord> {
    await runRequestsRepo(unit.conn).updateMany({
      filter: { id },
      values: { runId, updatedAt: clock.now().toISOString() },
    });
    return require(unit.conn, id);
  }

  const inputOf = (record: RunRequestRecord): NewRunRequest['input'] => {
    const view = toRunRequest(record).input;
    return {
      type: view.type,
      actor: view.actor,
      text: view.text,
      ...(view.payload === null ? {} : { payload: view.payload }),
    };
  };

  const workOf = (
    record: RunRequestRecord,
    agent: Agent,
  ): Omit<
    DirectRun,
    'actorUserId' | 'requestedByUserId' | 'confirmedByUserId'
  > => ({
    agent,
    subject: { kind: record.subjectKind, id: record.subjectId },
    threadScope: record.threadScope,
    ownerUserId: record.ownerUserId,
    priority: Number(record.priority),
    requires: stringArray(record.requires),
    fireAt: record.fireAt,
    maxAttempts:
      record.maxAttempts === null ? null : Number(record.maxAttempts),
    input: inputOf(record),
  });

  async function itemsOf(
    records: readonly RunRequestRecord[],
  ): Promise<RunRequestItem[]> {
    const conn = tx.read();
    const names = await deps.people.names(conn, [
      ...new Set(
        records.flatMap((record) => [
          record.responsibleUserId,
          record.requestedByUserId,
        ]),
      ),
    ]);
    const agents = new Map<string, string | null>();
    for (const record of records)
      if (!agents.has(record.agentId))
        agents.set(
          record.agentId,
          (await findAgent(conn, record.agentId))?.name ?? null,
        );
    return records.map((record) => ({
      ...toRunRequest(record),
      agentName: agents.get(record.agentId) ?? null,
      responsibleName: names.get(record.responsibleUserId) ?? null,
      requestedByName: names.get(record.requestedByUserId) ?? null,
    }));
  }

  return {
    async get(requestId) {
      const [item] = await itemsOf([await require(tx.read(), requestId)]);
      return item;
    },

    async list(filter) {
      const records = await runRequestsRepo(tx.read()).findMany({
        filter: (f) =>
          f.and([
            filter.role === 'responsible'
              ? f.string('responsibleUserId').eq(filter.userId)
              : filter.role === 'requester'
                ? f.string('requestedByUserId').eq(filter.userId)
                : f.or([
                    f.string('responsibleUserId').eq(filter.userId),
                    f.string('requestedByUserId').eq(filter.userId),
                  ]),
            ...(filter.status ? [f.string('status').eq(filter.status)] : []),
            ...(filter.subject
              ? [f.string('subjectKind').eq(filter.subject.kind)]
              : []),
            ...(filter.subject?.id
              ? [f.string('subjectId').eq(filter.subject.id)]
              : []),
            ...(filter.agentId ? [f.string('agentId').eq(filter.agentId)] : []),
          ]),
        sort: (sort) => [
          sort.field('createdAt').desc(),
          sort.field('id').desc(),
        ],
        limit: Math.min(Math.max(filter.limit ?? 50, 1), 201),
        ...(filter.cursor ? { cursor: filter.cursor } : {}),
      });
      return itemsOf(records);
    },

    async pendingOn(conn, subject, agentId) {
      const records = await runRequestsRepo(conn).findMany({
        filter: (f) =>
          f.and([
            f.string('subjectKind').eq(subject.kind),
            f.string('subjectId').eq(subject.id),
            f.string('status').eq('pending'),
            ...(agentId ? [f.string('agentId').eq(agentId)] : []),
          ]),
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      });
      return records.map(toRunRequest);
    },

    confirm: (requestId, byUserId) =>
      tx.run(async (unit) => {
        const record = await require(unit.conn, requestId);
        if (record.responsibleUserId !== byUserId)
          throw forbidden(
            'Only the person who answers for the subject may confirm this request.',
          );
        requirePending(record);
        await requireCurrentResponsible(unit, record, byUserId);
        // Confirming runs the work as them: they must still be able to wake the agent.
        const agent = await deps.requireInvocable(
          unit,
          record.agentId,
          byUserId,
        );
        await settle(unit, record, {
          status: 'confirmed',
          settledById: byUserId,
          settledAt: clock.now().toISOString(),
        });
        const run = await deps.direct(unit, {
          ...workOf(record, agent),
          actorUserId: record.responsibleUserId,
          requestedByUserId: record.requestedByUserId,
          confirmedByUserId: byUserId,
        });
        const request = toRunRequest(await setRun(unit, record.id, run.runId));
        unit.emit({ type: 'runRequest.confirmed', request });
        return { request, run };
      }),

    reject: (requestId, byUserId, note) =>
      tx.run(async (unit) => {
        const record = await require(unit.conn, requestId);
        if (record.responsibleUserId !== byUserId)
          throw forbidden(
            'Only the person who answers for the subject may reject this request.',
          );
        requirePending(record);
        await requireCurrentResponsible(unit, record, byUserId);
        const request = toRunRequest(
          await settle(unit, record, {
            status: 'rejected',
            settledById: byUserId,
            settledAt: clock.now().toISOString(),
            note: note ?? null,
          }),
        );
        unit.emit({ type: 'runRequest.rejected', request });
        return request;
      }),

    withdraw: (requestId, byUserId) =>
      tx.run(async (unit) => {
        const record = await require(unit.conn, requestId);
        if (record.requestedByUserId !== byUserId)
          throw forbidden(
            'Only the person who asked may withdraw this request.',
          );
        requirePending(record);
        const request = toRunRequest(
          await settle(unit, record, {
            status: 'withdrawn',
            settledById: byUserId,
            settledAt: clock.now().toISOString(),
          }),
        );
        unit.emit({ type: 'runRequest.withdrawn', request });
        return request;
      }),

    runAsRequester: (requestId, byUserId) =>
      tx.run(async (unit) => {
        const record = await require(unit.conn, requestId);
        if (record.requestedByUserId !== byUserId)
          throw forbidden(
            'Only the person who asked may run this request as themselves.',
          );
        // An expired request that went nowhere may still be run this way: that is what its expiry notice offers.
        const expired =
          record.status === 'expired' ||
          (record.status === 'pending' && isDue(record));
        if (
          !(record.status === 'pending' || record.status === 'expired') ||
          record.runId
        )
          throw settled(record);
        const agent = await deps.requireInvocable(
          unit,
          record.agentId,
          byUserId,
        );
        const work = workOf(record, agent);
        await deps.requireRunnerFor(unit, agent, byUserId, work.requires);
        if (record.status === 'pending')
          await settle(unit, record, {
            status: expired ? 'expired' : 'withdrawn',
            settledById: expired ? null : byUserId,
            settledAt: expired ? null : clock.now().toISOString(),
          });
        else {
          // Only once: a second attempt finds the run set.
          const result = await runRequestsRepo(unit.conn).updateMany({
            filter: (f) =>
              f.and([f.string('id').eq(record.id), f.string('runId').eq(null)]),
            values: { updatedAt: clock.now().toISOString() },
          });
          if (result.updatedCount !== 1)
            throw conflict('The request changed; read it again.');
        }
        const run = await deps.direct(unit, {
          ...work,
          actorUserId: byUserId,
          requestedByUserId: byUserId,
          confirmedByUserId: null,
        });
        const request = toRunRequest(await setRun(unit, record.id, run.runId));
        if (record.status === 'pending')
          unit.emit({
            type: expired ? 'runRequest.expired' : 'runRequest.withdrawn',
            request,
          });
        return { request, run };
      }),

    reassign: (request, outer) =>
      tx.run(async (unit) => {
        const pending = await runRequestsRepo(unit.conn).findMany({
          filter: (f) =>
            f.and([
              f.string('subjectKind').eq(request.subject.kind),
              f.string('subjectId').eq(request.subject.id),
              f.string('status').eq('pending'),
              ...(request.agentId
                ? [f.string('agentId').eq(request.agentId)]
                : []),
            ]),
          sort: (sort) => [
            sort.field('createdAt').asc(),
            sort.field('id').asc(),
          ],
        });
        const superseded: RunRequest[] = [];
        const created: RunRequest[] = [];
        const queued: RequestedRun[] = [];
        const expired: RunRequest[] = [];
        for (const record of pending) {
          // Its time ran out before the sweeper noticed: it expires now, as confirming would find, rather than being
          // handed on with a fresh expiry or queued.
          if (isDue(record)) {
            if (await expire(unit, record))
              expired.push(toRunRequest(await require(unit.conn, record.id)));
            continue;
          }
          if (record.responsibleUserId === request.toUserId) continue;
          const agent = request.toUserId
            ? await findAgent(unit.conn, record.agentId)
            : undefined;
          const usable =
            request.toUserId &&
            agent &&
            !agent.archivedAt &&
            deps.mayInvoke(agent, request.toUserId);
          if (!usable) {
            if (await expire(unit, record, 'reassignment'))
              expired.push(toRunRequest(await require(unit.conn, record.id)));
            continue;
          }
          await settle(unit, record, {
            status: 'superseded',
            settledById: request.byUserId,
            settledAt: clock.now().toISOString(),
            note: request.note ?? null,
          });
          if (usable && record.requestedByUserId === request.toUserId) {
            // The new responsible asked for it: their own work needs nobody's confirmation.
            queued.push(
              await deps.direct(unit, {
                ...workOf(record, agent),
                actorUserId: request.toUserId,
                requestedByUserId: request.toUserId,
                confirmedByUserId: null,
              }),
            );
          } else if (usable) {
            const next = await insertRunRequest(unit, deps, {
              agentId: record.agentId,
              subject: { kind: record.subjectKind, id: record.subjectId },
              threadScope: record.threadScope,
              responsibleUserId: request.toUserId,
              requestedByUserId: record.requestedByUserId,
              ownerUserId: record.ownerUserId,
              priority: Number(record.priority),
              requires: stringArray(record.requires),
              fireAt: record.fireAt,
              maxAttempts:
                record.maxAttempts === null ? null : Number(record.maxAttempts),
              input: inputOf(record),
            });
            created.push(next);
            await runRequestsRepo(unit.conn).updateMany({
              filter: { id: record.id },
              values: { supersededById: next.id },
            });
          }
          const done = toRunRequest(await require(unit.conn, record.id));
          superseded.push(done);
          unit.emit({ type: 'runRequest.superseded', request: done });
        }
        return { superseded, created, queued, expired };
      }, outer),

    async expireDue() {
      const due = await runRequestsRepo(tx.read()).findMany({
        filter: (f) =>
          f.and([
            f.string('status').eq('pending'),
            f.date('expiresAt').notAfter(clock.now()),
          ]),
        sort: (sort) => [sort.field('expiresAt').asc(), sort.field('id').asc()],
        limit: EXPIRE_BATCH,
      });
      let expired = 0;
      for (const record of due)
        if (await tx.run((unit) => expire(unit, record))) expired += 1;
      return expired;
    },
  };
}
