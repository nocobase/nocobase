/**
 * Approval requests. A status change whose transition needs an approval does not happen: the issues domain asks for
 * a request here instead (one pending per issue, 400 `APPROVAL_PENDING`). Then:
 *
 * - an approver approves: the issue moves as the request asked, checked again as the requester's move; when it no
 *   longer passes (the issue left the status, a guard refuses, the workflow changed) the request goes stale instead;
 * - an approver rejects, or the requester withdraws: the issue stays;
 * - the issue leaves the status some other way: its pending requests go stale.
 *
 * Only a listed approver decides (403 `NOT_APPROVER`) and only the requester withdraws (403 `NOT_REQUESTER`); a
 * request no longer pending is 400 `APPROVAL_DECIDED`. Each step is an activity (`approval_*`) and an event.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  APPROVAL_COMMENT_MAX,
  RECENT_DECIDED_APPROVALS,
  type ApprovalRequest,
  type DecideApprovalRequest,
} from '../../../shared/approvals.js';
import type { Issue } from '../../../shared/issues.js';
import type { ApproverRole } from '../../../shared/workflows.js';
import type { Viewer } from '../../access/viewer.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import { SYSTEM_ACTOR, type Actor } from '../../kernel/actor.js';
import { conflict, forbidden, invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { UserDirectory } from '../../kernel/users.js';
import { canMove, LifecycleError, move } from '../../lifecycle/index.js';
import './approval.events.js';
import { approvalMachine, approvalRules } from './approval.lifecycle.js';
import {
  allPending,
  decidedOf,
  decideRequest,
  findRequest,
  insertRequest,
  listOf,
  pendingOf,
  pendingOfEach,
  type ApprovalRecord,
} from './approval.store.js';

/** What approving needs from the issues domain: the move the request asked for, or why it cannot happen now. */
export interface ApprovedMoves {
  /** Moves the issue; null when it moved, else why not (the request then goes stale). */
  apply(
    tx: Tx,
    request: ApprovalRecord,
    approver: Actor,
  ): Promise<{ readonly code: string; readonly message: string } | null>;
  /** The issue, deleted or not; undefined when it is gone. */
  find(conn: DatabaseConnection, id: string): Promise<Issue | undefined>;
  /** A status of the issue's workflow by name, as the workflow names it (built-in names untranslated). */
  statusName(
    conn: DatabaseConnection,
    issue: Issue,
    key: string,
  ): Promise<string>;
}

export interface NewApprovalRequest {
  readonly issue: Issue;
  readonly toStatus: string;
  readonly actor: Actor;
  readonly approvers: readonly string[];
  readonly approverIds: readonly string[];
}

export interface ApprovalService {
  /** The requests waiting for the viewer, newest first. */
  mine(viewer: Viewer): Promise<ApprovalRequest[]>;
  approve(
    viewer: Viewer,
    id: string,
    input: DecideApprovalRequest,
  ): Promise<ApprovalRequest>;
  reject(
    viewer: Viewer,
    id: string,
    input: DecideApprovalRequest,
  ): Promise<ApprovalRequest>;
  withdraw(viewer: Viewer, id: string): Promise<ApprovalRequest>;
  /** For the issues domain, in its transaction: holds a status change for approval. */
  request(tx: Tx, input: NewApprovalRequest): Promise<ApprovalRequest>;
  /** For the issues domain: the issue is in `statusKey` now, so requests to leave another status go stale. */
  supersede(
    tx: Tx,
    issueId: string,
    statusKey: string,
    except?: string,
  ): Promise<void>;
  /** The issue's pending request, for the issue page. */
  pendingFor(
    conn: DatabaseConnection,
    issueId: string,
  ): Promise<ApprovalRequest | null>;
  /** The issue's last `RECENT_DECIDED_APPROVALS` decided requests, the most recently decided first. */
  decidedFor(
    conn: DatabaseConnection,
    issueId: string,
  ): Promise<ApprovalRequest[]>;
  /**
   * The pending requests on any of `issueIds`, oldest first, in one read; for a caller that has already limited the
   * issues to what its viewer sees (a board of work, say).
   */
  pendingOn(issueIds: readonly string[]): Promise<ApprovalRequest[]>;
}

const PENDING_LIMIT = 500;

const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

function commentOf(input: DecideApprovalRequest | undefined): string | null {
  const comment = input?.comment;
  if (comment === undefined || comment === null) return null;
  if (typeof comment !== 'string' || comment.length > APPROVAL_COMMENT_MAX)
    throw invalid(
      'INVALID_COMMENT',
      `A comment is at most ${APPROVAL_COMMENT_MAX} characters.`,
    );
  return comment.trim() || null;
}

export function createApprovalService(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly users: UserDirectory;
  readonly kinds: KindRegistry;
  readonly activity: ActivityRecorder;
  readonly moves: () => ApprovedMoves;
}): ApprovalService {
  const machine = () =>
    approvalMachine(deps.kinds.list().map((kind) => kind.key));
  async function view(
    conn: DatabaseConnection,
    rows: readonly ApprovalRecord[],
  ): Promise<ApprovalRequest[]> {
    const people = await deps.users.names(conn, [
      ...rows.flatMap((row) => listOf(row.approverUserIds)),
      ...rows.map((row) => row.decidedById),
    ]);
    const requester = await deps.kinds.nameAll(
      conn,
      rows.map((row) => ({ type: row.requestedByType, id: row.requestedById })),
    );
    const issues = new Map<string, Issue | undefined>();
    for (const row of rows)
      if (!issues.has(row.issueId))
        issues.set(row.issueId, await deps.moves().find(conn, row.issueId));
    return rows.map((row) => {
      const issue = issues.get(row.issueId);
      const approverUserIds = listOf(row.approverUserIds);
      return {
        id: row.id,
        issueId: row.issueId,
        issueIdentifier: issue?.identifier ?? null,
        issueTitle: issue?.title ?? null,
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        requestedByType: row.requestedByType,
        requestedById: row.requestedById,
        requestedByName: requester(row.requestedByType, row.requestedById),
        approvers: [...listOf<ApproverRole>(row.approvers)],
        approverUserIds: [...approverUserIds],
        approverNames: approverUserIds.map((id) => people.get(id) ?? id),
        status: row.status,
        decidedById: row.decidedById,
        decidedByName: row.decidedById
          ? (people.get(row.decidedById) ?? null)
          : null,
        decidedAt: row.decidedAt === null ? null : iso(row.decidedAt),
        comment: row.comment,
        createdAt: iso(row.createdAt),
        updatedAt: iso(row.updatedAt),
      };
    });
  }

  async function viewOne(
    conn: DatabaseConnection,
    id: string,
  ): Promise<ApprovalRequest> {
    const row = await findRequest(conn, id);
    if (!row) throw notFound('Approval request');
    const [request] = await view(conn, [row]);
    return request;
  }

  /** Takes a pending request to `status` through its lifecycle, with its activity and event. */
  async function close(
    tx: Tx,
    row: ApprovalRecord,
    status: 'approved' | 'rejected' | 'withdrawn' | 'stale',
    actor: Actor,
    details: Readonly<Record<string, unknown>> = {},
  ): Promise<void> {
    try {
      await move(
        machine(),
        approvalRules,
        {
          from: row.status,
          to: status,
          actor: { type: actor.type, id: actor.id },
          subject: row,
          context: tx,
        },
        async () => {
          const decided = await decideRequest(tx.conn, row.id, {
            status,
            decidedById: status === 'stale' ? null : actor.id,
            ...(details.comment === undefined
              ? {}
              : { comment: details.comment as string | null }),
          });
          if (!decided)
            throw conflict(
              'APPROVAL_DECIDED',
              'This request was decided meanwhile.',
            );
        },
      );
    } catch (error) {
      if (
        error instanceof LifecycleError &&
        error.code === 'TRANSITION_NOT_ALLOWED'
      )
        throw status === 'withdrawn'
          ? forbidden(
              'Only whoever asked may withdraw this request.',
              'NOT_REQUESTER',
            )
          : forbidden(
              'Only an approver of this request may decide it.',
              'NOT_APPROVER',
            );
      throw error;
    }
    await deps.activity.record(tx.conn, {
      issueId: row.issueId,
      actor,
      action: `approval_${status}`,
      details: {
        requestId: row.id,
        from: row.fromStatus,
        to: row.toStatus,
        ...details,
      },
    });
    const issue = await deps.moves().find(tx.conn, row.issueId);
    tx.emit({
      type: 'approval.decided',
      requestId: row.id,
      issueId: row.issueId,
      identifier: issue?.identifier ?? '',
      title: issue?.title ?? '',
      status,
      toStatus: row.toStatus,
      toStatusName: issue
        ? await deps.moves().statusName(tx.conn, issue, row.toStatus)
        : row.toStatus,
      requestedBy: { type: row.requestedByType, id: row.requestedById },
      ownerUserId: issue?.ownerUserId ?? null,
      approverUserIds: listOf(row.approverUserIds),
      decidedById: status === 'stale' ? null : actor.id,
      staleReason:
        status === 'stale' && typeof details.code === 'string'
          ? {
              code: details.code,
              message:
                typeof details.message === 'string' ? details.message : null,
              attemptedById:
                typeof details.attemptedById === 'string'
                  ? details.attemptedById
                  : null,
            }
          : null,
      comment:
        typeof details.comment === 'string' && details.comment
          ? details.comment
          : null,
    });
    tx.emit({ type: 'issue.changed', issueId: row.issueId });
  }

  async function pending(tx: Tx, id: string): Promise<ApprovalRecord> {
    const row = await findRequest(tx.conn, id);
    if (!row) throw notFound('Approval request');
    if (row.status !== 'pending')
      throw conflict('APPROVAL_DECIDED', `This request is ${row.status}.`);
    return row;
  }

  return {
    async mine(viewer) {
      const conn = deps.tx.read();
      const rows = (await allPending(conn, PENDING_LIMIT)).filter((row) =>
        listOf(row.approverUserIds).includes(viewer.userId),
      );
      return view(conn, rows);
    },

    approve(viewer, id, input) {
      const comment = commentOf(input);
      return deps.tx.run(async (tx) => {
        const row = await pending(tx, id);
        const allowed = await canMove(machine(), approvalRules, {
          from: 'pending',
          to: 'approved',
          actor: { type: viewer.actor.type, id: viewer.actor.id },
          subject: row,
          context: tx,
        });
        if (!allowed.ok)
          throw forbidden(
            'Only an approver of this request may decide it.',
            'NOT_APPROVER',
          );
        const failure = await deps.moves().apply(tx, row, viewer.actor);
        if (failure)
          await close(tx, row, 'stale', SYSTEM_ACTOR, {
            code: failure.code,
            message: failure.message,
            attemptedById: viewer.actor.id,
          });
        else await close(tx, row, 'approved', viewer.actor, { comment });
        return viewOne(tx.conn, id);
      });
    },

    reject(viewer, id, input) {
      const comment = commentOf(input);
      return deps.tx.run(async (tx) => {
        await close(tx, await pending(tx, id), 'rejected', viewer.actor, {
          comment,
        });
        return viewOne(tx.conn, id);
      });
    },

    withdraw(viewer, id) {
      return deps.tx.run(async (tx) => {
        await close(tx, await pending(tx, id), 'withdrawn', viewer.actor);
        return viewOne(tx.conn, id);
      });
    },

    async request(tx, input) {
      const { issue, actor } = input;
      if ((await pendingOf(tx.conn, issue.id)).length > 0)
        throw conflict(
          'APPROVAL_PENDING',
          `A status change of ${issue.identifier} is already waiting for approval.`,
        );
      if (actor.type === 'system' || actor.id === null)
        throw invalid(
          'APPROVAL_REQUESTER',
          'Only a person or another registered kind asks for an approval.',
        );
      const id = deps.ids.next();
      await insertRequest(tx.conn, {
        id,
        issueId: issue.id,
        fromStatus: issue.statusKey,
        toStatus: input.toStatus,
        requestedByType: actor.type,
        requestedById: actor.id,
        approvers: input.approvers as ApproverRole[],
        approverUserIds: input.approverIds,
        status: 'pending',
        decidedById: null,
        decidedAt: null,
        comment: null,
      });
      await deps.activity.record(tx.conn, {
        issueId: issue.id,
        actor,
        action: 'approval_requested',
        details: {
          requestId: id,
          from: issue.statusKey,
          to: input.toStatus,
          approverUserIds: input.approverIds,
        },
      });
      tx.emit({
        type: 'approval.requested',
        requestId: id,
        issueId: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        fromStatus: issue.statusKey,
        toStatus: input.toStatus,
        toStatusName: await deps
          .moves()
          .statusName(tx.conn, issue, input.toStatus),
        approverUserIds: input.approverIds,
      });
      tx.emit({ type: 'issue.changed', issueId: issue.id });
      return viewOne(tx.conn, id);
    },

    async supersede(tx, issueId, statusKey, except) {
      for (const row of await pendingOf(tx.conn, issueId))
        if (row.fromStatus !== statusKey && row.id !== except)
          await close(tx, row, 'stale', SYSTEM_ACTOR, {
            code: 'STATUS_CHANGED',
          });
    },

    async pendingOn(issueIds) {
      const conn = deps.tx.read();
      return view(conn, await pendingOfEach(conn, [...new Set(issueIds)]));
    },

    async decidedFor(conn, issueId) {
      return view(
        conn,
        await decidedOf(conn, issueId, RECENT_DECIDED_APPROVALS),
      );
    },

    async pendingFor(conn, issueId) {
      const [row] = await pendingOf(conn, issueId);
      if (!row) return null;
      const [request] = await view(conn, [row]);
      return request ?? null;
    },
  };
}
