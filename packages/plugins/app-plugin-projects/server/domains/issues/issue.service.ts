/**
 * Issue writes: create, update, and an administrator's delete and restore. Each write records its activities and emits
 * `issue.changed` plus an event saying what happened, and hands the change to the triggers in the same transaction.
 */
import type { ApprovalRequest } from '../../../shared/approvals.js';
import {
  isBuiltInEvent,
  type WorkflowEvent,
} from '../../../shared/workflows.js';
import type {
  CreateIssueRequest,
  Executor,
  Issue,
  UpdateIssueRequest,
} from '../../../shared/issues.js';
import { scopeOf, type Viewer } from '../../access/viewer.js';
import type { ActivityRecorder } from '../../kernel/activity.js';
import { SYSTEM_ACTOR, type Actor } from '../../kernel/actor.js';
import {
  DomainError,
  forbidden,
  invalid,
  notFound,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import { mentions, newMentions } from '../../kernel/mentions.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import type { SettingsService } from '../settings/index.js';
import { updateProject } from '../projects/index.js';
import {
  requireDeleter,
  requireCreator,
  requireEditor,
  requireVisible,
} from './issue.access.js';
import './issue.events.js';
import type { EventActor, IssueChangeSet } from './issue.events.js';
import {
  resolveCreate,
  resolveUpdate,
  type FieldDeps,
} from './issue.fields.js';
import {
  findIssue,
  insertIssue,
  issuesExecutedBy,
  setIssueLabels,
  updateIssue,
} from './issue.store.js';
import { moveIssue } from './issue.status.js';
import {
  isTerminal,
  type IssueApprovals,
  type IssueRelations,
  type IssueTriggers,
} from './ports.js';

/** Whether a change may start work now; the client asks when it would. */
interface StartOption {
  readonly start?: boolean;
}

/**
 * The issue after an update. When the status change waits for approval, the issue is unchanged (nothing in the
 * request was applied) and `pendingApproval` is the request that holds it.
 */
export type IssueUpdateOutcome = Issue & {
  readonly pendingApproval?: ApprovalRequest;
};

export interface IssueService {
  create(
    viewer: Viewer,
    input: CreateIssueRequest & StartOption,
  ): Promise<Issue>;
  update(
    viewer: Viewer,
    idOrKey: string,
    patch: UpdateIssueRequest & StartOption,
  ): Promise<IssueUpdateOutcome>;
  remove(viewer: Viewer, idOrKey: string): Promise<void>;
  /**
   * For the plugin whose principal can no longer take work (an agent archived or deleted): clears `executor` from every
   * live issue it executes that has not finished (a status outside the done and closed categories), in one
   * transaction, as `cause.actor`. Each is recorded as `executor_changed` to nobody with `reason: 'executorRemoved'` and
   * the executor's `name`, and goes to the triggers like any change of executor. Answers the issues it changed.
   */
  releaseExecutor(
    executor: Executor,
    cause: { readonly actor: Actor; readonly name: string },
  ): Promise<string[]>;
  /**
   * For undoing a plan: soft-deletes an issue the viewer created (or any, for one who may delete issues), as `remove`
   * does, recorded as retracted. Not offered over HTTP; the plans domain checks that its plan created the issue.
   */
  retract(viewer: Viewer, idOrKey: string): Promise<void>;
  restore(viewer: Viewer, idOrKey: string): Promise<Issue>;
  /**
   * For the approvals domain, in its transaction: the move an approver accepted, checked again as the requester's
   * (who may, and the guards) and recorded as the system's with the approver named. Null when it moved, else why not.
   */
  applyApproved(
    tx: Tx,
    request: {
      readonly id: string;
      readonly issueId: string;
      readonly fromStatus: string;
      readonly toStatus: string;
      readonly requestedByType: string;
      readonly requestedById: string;
    },
    approver: Actor,
  ): Promise<{ readonly code: string; readonly message: string } | null>;
  /**
   * In the caller's transaction (the subtasks domain's, or a contributed event's through `workflowEvents.fire`): moves
   * the issue where a workflow event takes it, as the system. The activity names the event and its cause, and is
   * recorded as `cause.actor` when given (the person whose action the event reports). A guard's refusal is recorded
   * as `auto_move_skipped` and nothing moves; without an event transition from its status nothing happens. A finished
   * issue ignores the built-in events.
   */
  fireEvent(
    tx: Tx,
    issueId: string,
    event: WorkflowEvent,
    cause: EventCause,
  ): Promise<EventMove>;
  /**
   * Where `fireEvent` would take the issue, without moving it: the status its workflow's transition on the event
   * enters, or why there is none. Entry conditions are not checked, so a move this answers may still be refused.
   */
  eventTarget(
    conn: Tx['conn'],
    issueId: string,
    event: WorkflowEvent,
  ): Promise<EventTarget>;
}

/** Where a workflow event would take an issue (`eventTarget`). */
export type EventTarget =
  | {
      readonly issueId: string;
      readonly from: string;
      readonly to: string;
    }
  | {
      readonly issueId: string;
      readonly to: null;
      /** As `EventMove`'s `ignored`: no such live issue, no transition on the event, or finished and built in. */
      readonly reason: 'notFound' | 'noTransition' | 'finished';
    };

/** What made a workflow event happen, as the activity records it. */
export interface EventCause {
  /** The issue whose change caused it (the last sub-issue finished). */
  readonly issueId?: string;
  /** Who the activity names; the system when left out. The move itself is always the system's. */
  readonly actor?: Actor;
  /** A short phrase shown with the move, as it is (`#12 merged`). */
  readonly note?: string;
  /** Kept with the activity, opaque to this plugin. */
  readonly details?: Readonly<Record<string, unknown>>;
}

/** What a workflow event did to one issue. */
export type EventMove =
  | {
      readonly issueId: string;
      readonly outcome: 'moved';
      readonly from: string;
      readonly to: string;
    }
  | {
      readonly issueId: string;
      readonly outcome: 'ignored';
      /** No such live issue, no transition on the event from its status, or a finished issue and a built-in event. */
      readonly reason: 'notFound' | 'noTransition' | 'finished';
    }
  | {
      readonly issueId: string;
      readonly outcome: 'refused';
      readonly from: string;
      readonly to: string;
      /** The guard's code, such as `CHECKLIST_INCOMPLETE`, and its message. */
      readonly code: string;
      readonly message: string;
    };

export interface IssueDeps extends FieldDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly activity: ActivityRecorder;
  readonly settings: Pick<SettingsService, 'allocateIssueNumber'>;
  readonly triggers: () => IssueTriggers;
  readonly approvals: () => IssueApprovals;
  readonly relations: () => IssueRelations;
}

function eventActor(actor: Actor): EventActor {
  return { type: actor.type, id: actor.id };
}

function changeSet(before: Issue, after: Issue): IssueChangeSet {
  const mentioned = newMentions(before.description, after.description);
  return {
    ...(before.statusKey === after.statusKey
      ? {}
      : { status: { from: before.statusKey, to: after.statusKey } }),
    ...(before.ownerUserId === after.ownerUserId
      ? {}
      : { owner: { from: before.ownerUserId, to: after.ownerUserId } }),
    ...(before.executor?.type === after.executor?.type &&
    before.executor?.id === after.executor?.id
      ? {}
      : { executor: { from: before.executor, to: after.executor } }),
    ...(mentioned.length > 0 ? { mentions: mentioned } : {}),
  };
}

async function reload(tx: Tx, id: string): Promise<Issue> {
  return (await findIssue(tx.conn, id)) as Issue;
}

export function createIssueService(deps: IssueDeps): IssueService {
  const record = (
    tx: Tx,
    issueId: string,
    actor: Actor,
    action: string,
    details = {},
  ) => deps.activity.record(tx.conn, { issueId, actor, action, details });

  /** After an update is written: the triggers, the stale approvals, and what changed. */
  async function announce(
    tx: Tx,
    before: Issue,
    after: Issue,
    actor: Actor,
    start: boolean,
    approvedRequest?: string,
  ): Promise<void> {
    await deps.triggers().onIssueChanged(tx, { before, after, actor, start });
    if (before.statusKey !== after.statusKey)
      await deps
        .approvals()
        .supersede(tx, after.id, after.statusKey, approvedRequest);
    await deps.relations().changed(tx, { before, after, actor });
    tx.emit({ type: 'issue.changed', issueId: after.id });
    for (const parentId of new Set([before.parentIssueId, after.parentIssueId]))
      if (parentId) tx.emit({ type: 'issue.changed', issueId: parentId });
    const changes = changeSet(before, after);
    if (Object.keys(changes).length > 0)
      tx.emit({
        type: 'issue.updated',
        issueId: after.id,
        actor: eventActor(actor),
        changes,
        revision: after.revision,
      });
  }

  const service: IssueService = {
    async create(viewer, input) {
      requireCreator(viewer);
      return deps.tx.run(async (tx) => {
        const values = await resolveCreate(
          { ...deps, conn: tx.conn, viewer },
          input,
        );
        const { number, identifier } =
          await deps.settings.allocateIssueNumber(tx);
        const id = deps.ids.next();
        const now = new Date().toISOString();
        await insertIssue(tx.conn, {
          id,
          number,
          identifier,
          title: values.title,
          description: values.description,
          statusKey: values.statusKey,
          priority: values.priority,
          ownerUserId: values.ownerUserId,
          executorType: values.executor?.type ?? null,
          executorId: values.executor?.id ?? null,
          parentIssueId: values.parentIssueId,
          stage: values.stage,
          projectId: values.projectId,
          startDate: values.startDate,
          dueDate: values.dueDate,
          createdById: viewer.userId,
          lastActivityAt: now,
          createdAt: now,
          updatedAt: now,
        });
        if (values.labelIds.length > 0)
          await setIssueLabels(
            tx.conn,
            () => deps.ids.next(),
            id,
            values.labelIds,
          );
        await record(tx, id, viewer.actor, 'issue_created', { identifier });
        // Every issue created in the project from now on waits for this one until it is finished.
        if (values.projectSetup && values.projectId)
          await updateProject(tx.conn, values.projectId, { setupIssueId: id });
        if (values.parentIssueId) {
          await record(
            tx,
            values.parentIssueId,
            viewer.actor,
            'subtask_added',
            {
              issueId: id,
              identifier,
            },
          );
          tx.emit({ type: 'issue.changed', issueId: values.parentIssueId });
        }
        const issue = await reload(tx, id);
        await deps.relations().created(tx, issue, values.blockedBy, viewer);
        await deps.triggers().onIssueChanged(tx, {
          before: null,
          after: issue,
          actor: viewer.actor,
          start: input.start !== false,
        });
        tx.emit({ type: 'issue.changed', issueId: id });
        tx.emit({
          type: 'issue.created',
          issueId: id,
          actor: eventActor(viewer.actor),
          mentions: mentions(values.description),
        });
        return issue;
      });
    },

    async update(viewer, idOrKey, patch) {
      if (!Number.isInteger(patch?.revision))
        throw invalid('REVISION_REQUIRED', 'revision is required.');
      return deps.tx.run(async (tx) => {
        const before = await requireVisible(tx.conn, viewer, idOrKey);
        requireEditor(viewer);
        const { values, activities, labelIds, status, placed } =
          await resolveUpdate(
            { ...deps, conn: tx.conn, viewer },
            before,
            patch,
          );
        let written = false;
        const write = async () => {
          const labels = labelIds
            ? await setIssueLabels(
                tx.conn,
                () => deps.ids.next(),
                before.id,
                labelIds,
              )
            : { added: [], removed: [] };
          if (labels.added.length > 0 || labels.removed.length > 0)
            activities.push({ action: 'labels_changed', details: labels });
          if (activities.length === 0) return;
          const now = new Date().toISOString();
          await updateIssue(
            tx.conn,
            before.id,
            { ...values, updatedAt: now, lastActivityAt: now },
            patch.revision,
          );
          for (const { action, details } of activities)
            await record(tx, before.id, viewer.actor, action, details);
          written = true;
        };
        if (status) {
          const moved = await moveIssue(deps, tx, {
            issue: before,
            catalog: status.catalog,
            to: status.to,
            actor: viewer.actor,
            write,
          });
          if (moved.outcome === 'pending') {
            const pendingApproval = await deps.approvals().request(tx, {
              issue: before,
              toStatus: status.to,
              actor: viewer.actor,
              approvers: moved.approvers,
              approverIds: moved.approverIds,
            });
            return { ...before, pendingApproval };
          }
          if (moved.outcome === 'moved' && moved.approval !== 'none')
            await record(
              tx,
              before.id,
              viewer.actor,
              moved.approval === 'self'
                ? 'approval_self'
                : 'approval_no_approver',
              { from: before.statusKey, to: status.to },
            );
        } else await write();
        if (!written) return before;
        const after = await reload(tx, before.id);
        if (placed) await deps.relations().placed(tx, after);
        await announce(tx, before, after, viewer.actor, patch.start !== false);
        return after;
      });
    },

    async applyApproved(tx, request, approver) {
      const issue = await findIssue(tx.conn, request.issueId);
      if (!issue || issue.deletedAt)
        return { code: 'ISSUE_GONE', message: 'The issue was deleted.' };
      if (issue.statusKey !== request.fromStatus)
        return {
          code: 'STATUS_CHANGED',
          message: `The issue left ${request.fromStatus} meanwhile.`,
        };
      const catalog = await deps.statuses.forProject(tx.conn, issue.projectId);
      try {
        await moveIssue(deps, tx, {
          issue,
          catalog,
          to: request.toStatus,
          actor: { type: request.requestedByType, id: request.requestedById },
          approved: true,
          write: async () => {
            const now = new Date().toISOString();
            await updateIssue(tx.conn, issue.id, {
              statusKey: request.toStatus,
              updatedAt: now,
              lastActivityAt: now,
            });
            await record(tx, issue.id, SYSTEM_ACTOR, 'status_changed', {
              from: issue.statusKey,
              to: request.toStatus,
              requestId: request.id,
              approvedById: approver.id,
            });
          },
        });
      } catch (error) {
        if (error instanceof DomainError)
          return { code: error.code, message: error.message };
        throw error;
      }
      await announce(
        tx,
        issue,
        await reload(tx, issue.id),
        SYSTEM_ACTOR,
        true,
        request.id,
      );
      return null;
    },

    async eventTarget(conn, issueId, event) {
      const issue = await findIssue(conn, issueId);
      if (!issue || issue.deletedAt)
        return { issueId, to: null, reason: 'notFound' };
      const catalog = await deps.statuses.forProject(conn, issue.projectId);
      if (isBuiltInEvent(event) && isTerminal(catalog, issue.statusKey))
        return { issueId: issue.id, to: null, reason: 'finished' };
      const to = catalog.machine.eventTarget(issue.statusKey, event);
      return to === null
        ? { issueId: issue.id, to: null, reason: 'noTransition' }
        : { issueId: issue.id, from: issue.statusKey, to };
    },

    async fireEvent(tx, issueId, event, cause) {
      const issue = await findIssue(tx.conn, issueId);
      if (!issue || issue.deletedAt)
        return { issueId, outcome: 'ignored', reason: 'notFound' };
      const catalog = await deps.statuses.forProject(tx.conn, issue.projectId);
      if (isBuiltInEvent(event) && isTerminal(catalog, issue.statusKey))
        return { issueId: issue.id, outcome: 'ignored', reason: 'finished' };
      const to = catalog.machine.eventTarget(issue.statusKey, event);
      if (to === null)
        return {
          issueId: issue.id,
          outcome: 'ignored',
          reason: 'noTransition',
        };
      const recorded = cause.actor ?? SYSTEM_ACTOR;
      try {
        await moveIssue(deps, tx, {
          issue,
          catalog,
          to,
          actor: SYSTEM_ACTOR,
          approved: true,
          event,
          write: async () => {
            const now = new Date().toISOString();
            await updateIssue(tx.conn, issue.id, {
              statusKey: to,
              updatedAt: now,
              lastActivityAt: now,
            });
            await record(tx, issue.id, recorded, 'status_changed', {
              from: issue.statusKey,
              to,
              event,
              ...(cause.issueId ? { causeIssueId: cause.issueId } : {}),
              ...(cause.note ? { note: cause.note } : {}),
              ...(cause.details ? { cause: cause.details } : {}),
            });
          },
        });
      } catch (error) {
        if (!(error instanceof DomainError)) throw error;
        await record(tx, issue.id, recorded, 'auto_move_skipped', {
          event,
          to,
          code: error.code,
          message: error.message,
          ...(cause.note ? { note: cause.note } : {}),
        });
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        return {
          issueId: issue.id,
          outcome: 'refused',
          from: issue.statusKey,
          to,
          code: error.code,
          message: error.message,
        };
      }
      await announce(tx, issue, await reload(tx, issue.id), SYSTEM_ACTOR, true);
      return { issueId: issue.id, outcome: 'moved', from: issue.statusKey, to };
    },

    async remove(viewer, idOrKey) {
      requireDeleter(viewer);
      await softDelete(viewer, idOrKey, false);
    },

    releaseExecutor: (executor, cause) =>
      deps.tx.run(async (tx) => {
        const released: string[] = [];
        for (const before of await issuesExecutedBy(tx.conn, executor)) {
          const catalog = await deps.statuses.forProject(
            tx.conn,
            before.projectId,
          );
          if (isTerminal(catalog, before.statusKey)) continue;
          const now = new Date().toISOString();
          await updateIssue(tx.conn, before.id, {
            executorType: null,
            executorId: null,
            updatedAt: now,
            lastActivityAt: now,
          });
          await record(tx, before.id, cause.actor, 'executor_changed', {
            from: before.executor,
            to: null,
            reason: 'executorRemoved',
            name: cause.name,
          });
          await announce(
            tx,
            before,
            await reload(tx, before.id),
            cause.actor,
            false,
          );
          released.push(before.id);
        }
        return released;
      }),

    async retract(viewer, idOrKey) {
      await softDelete(viewer, idOrKey, true);
    },

    async restore(viewer, idOrKey) {
      requireDeleter(viewer);
      return deps.tx.run(async (tx) => {
        const issue = await findIssue(tx.conn, idOrKey);
        if (!issue?.deletedAt) throw notFound('Deleted issue');
        const now = new Date().toISOString();
        await updateIssue(tx.conn, issue.id, {
          deletedAt: null,
          deletedById: null,
          updatedAt: now,
        });
        await record(tx, issue.id, viewer.actor, 'issue_restored');
        tx.emit({ type: 'issue.changed', issueId: issue.id });
        tx.emit({
          type: 'issue.restored',
          issueId: issue.id,
          actor: eventActor(viewer.actor),
        });
        return reload(tx, issue.id);
      });
    },
  };
  return service;

  /** `remove`, or with `retracted` the creator's own removal of what a plan created. */
  async function softDelete(
    viewer: Viewer,
    idOrKey: string,
    retracted: boolean,
  ): Promise<void> {
    await deps.tx.run(async (tx) => {
      const issue = await requireVisible(tx.conn, viewer, idOrKey);
      if (
        retracted &&
        issue.createdById !== viewer.userId &&
        scopeOf(viewer, 'pm.issues', 'delete') !== 'all'
      )
        throw forbidden('Only its creator may take an issue back.');
      const now = new Date().toISOString();
      await updateIssue(tx.conn, issue.id, {
        deletedAt: now,
        deletedById: viewer.userId,
        updatedAt: now,
      });
      await record(
        tx,
        issue.id,
        viewer.actor,
        'issue_deleted',
        retracted ? { retracted: true } : {},
      );
      await deps
        .relations()
        .removed(tx, { ...issue, deletedAt: now }, viewer.actor);
      tx.emit({ type: 'issue.changed', issueId: issue.id });
      tx.emit({
        type: 'issue.deleted',
        issueId: issue.id,
        actor: eventActor(viewer.actor),
      });
    });
  }
}
