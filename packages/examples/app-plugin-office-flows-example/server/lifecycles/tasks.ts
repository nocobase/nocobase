import {
  defineEffect,
  defineLifecycle,
  LifecycleError,
  type EffectDefinition,
  type Lifecycle,
  type LifecycleRecord,
  type TransitionContext,
} from '@nocobase/lifecycle';

import { INCOMING_ROLES } from '../../shared/people.js';
import { COLLECTIONS } from '../scope.js';
import { idOf, people } from '../services/store.js';
import type { OfficeServices } from './data-request.js';
import { text } from '../../shared/text.js';

/** The fields every incoming-document task carries. */
export interface Task extends LifecycleRecord {
  readonly number: string;
  readonly rootId: number | string;
  readonly parentId: number | string;
  readonly departmentName: string;
  readonly assignees: unknown;
  readonly signedBy: unknown;
}

export type ClerkState =
  'signing' | 'reviewing' | 'accepted' | 'objected' | 'done';
export type TeamState = 'processing' | 'done';
export type ExecutorState = 'processing' | 'done';

export interface ClerkTypes {
  record: Task & { readonly status: ClerkState };
  state: ClerkState;
  services: OfficeServices;
}
export interface TeamTypes {
  record: Task & { readonly status: TeamState };
  state: TeamState;
  services: OfficeServices;
}
export interface ExecutorTypes {
  record: Task & { readonly status: ExecutorState };
  state: ExecutorState;
  services: OfficeServices;
}

type AnyTaskContext =
  | TransitionContext<ClerkTypes>
  | TransitionContext<TeamTypes>
  | TransitionContext<ExecutorTypes>;

function isAssignee({ record, actor }: AnyTaskContext): boolean {
  return people(record.assignees).includes(actor.id);
}

function rowIds(input: Record<string, unknown>): number[] {
  return Array.isArray(input.rowIds) ? input.rowIds.map(idOf) : [];
}

function rowsRequired(input: Record<string, unknown>): string | null {
  return rowIds(input).length ? null : 'There are no rows to dispatch.';
}

/** What a task needs before its feedback can be submitted. */
function feedbackSet(
  record: LifecycleRecord,
  options: { readonly opinion: boolean; readonly outgoingRef: boolean },
): Record<string, unknown> {
  const missing: string[] = [];
  if (options.opinion && !record.opinion) missing.push('opinion');
  if (record.redHeadFeedback === null || record.redHeadFeedback === undefined)
    missing.push('whether an official document is fed back');
  if (
    options.outgoingRef &&
    record.redHeadFeedback === true &&
    !record.outgoingRef
  )
    missing.push('outgoing document number');
  if (!record.feedback) missing.push('feedback');
  // Unfilled fields are the task's state: 400 FAILED_PRECONDITION.
  if (missing.length)
    throw new LifecycleError(
      'INVALID_STATE',
      `Fill in before submitting: ${missing.join(', ')}.`,
    );
  return {};
}

/**
 * A clerk task sends execution-team rows down a level. The root document
 * keeps a trace of it — which departments the coordinating department
 * handed the work to, and who was reminded — as the distribution record
 * requires; the team tasks' own feedback stays out of the root.
 */
export const dispatchTeams: EffectDefinition<ClerkTypes> =
  defineEffect<ClerkTypes>({
    name: 'clerkTasks.dispatchTeams',
    retry: { attempts: 3, backoffMs: 1_000 },
    async run({ record, input, services, idempotencyKey }) {
      const result = await services.store.dispatch(2, rowIds(input));
      if (result.created.length) {
        const detail = {
          from: record.departmentName,
          departments: result.created.map((item) => item.departmentName),
          numbers: result.created.map((item) => item.number),
          notified: result.notified,
          skipped: result.skipped,
        };
        await services.store.trace({
          key: `${idempotencyKey}:root`,
          docKind: 'incoming',
          docId: idOf(record.rootId),
          actorId: people(record.assignees)[0] ?? '',
          action: `${record.departmentName}派发执行团队`,
          detail,
        });
        await services.store.trace({
          key: `${idempotencyKey}:clerk`,
          docKind: 'clerk',
          docId: idOf(record.id),
          actorId: people(record.assignees)[0] ?? '',
          action: '派发执行团队',
          detail,
        });
      }
      return { created: result.created.length, notified: result.notified };
    },
  });

/**
 * "派发其他部门协助": the new row becomes a clerk task at the same level as
 * this one, under the root document, and the root records who asked.
 */
export const dispatchAssist: EffectDefinition<ClerkTypes> =
  defineEffect<ClerkTypes>({
    name: 'clerkTasks.dispatchAssist',
    retry: { attempts: 3, backoffMs: 1_000 },
    async run({ record, input, services, idempotencyKey }) {
      const result = await services.store.dispatch(1, rowIds(input));
      if (result.created.length)
        await services.store.trace({
          key: idempotencyKey,
          docKind: 'incoming',
          docId: idOf(record.rootId),
          actorId: people(record.assignees)[0] ?? '',
          action: `${record.departmentName}派发其他部门协助`,
          detail: {
            from: record.departmentName,
            departments: result.created.map((item) => item.departmentName),
            numbers: result.created.map((item) => item.number),
            notified: result.notified,
            skipped: result.skipped,
          },
        });
      return { created: result.created.length, notified: result.notified };
    },
  });

/** "[B] 有异议与办公室联系": the office is told who objects. */
export const notifyObjection: EffectDefinition<ClerkTypes> =
  defineEffect<ClerkTypes>({
    name: 'clerkTasks.notifyObjection',
    async run({ record, services }) {
      const root = await services.store.find(
        COLLECTIONS.incoming,
        record.rootId,
      );
      const notified = await services.store.notify({
        rootKind: 'incoming',
        rootId: idOf(record.rootId),
        level: `objection-${text(record.id)}`,
        recipients: [text(root?.registrarId ?? INCOMING_ROLES.registrar)],
        message: `${record.departmentName}对收文《${text(root?.title ?? '')}》有异议，请联系`,
        sourceKind: 'clerk',
        sourceId: idOf(record.id),
      });
      return { notified };
    },
  });

/** Execution-team tasks send executor rows down the last level. */
export const dispatchExecutors: EffectDefinition<TeamTypes> =
  defineEffect<TeamTypes>({
    name: 'teamTasks.dispatchExecutors',
    retry: { attempts: 3, backoffMs: 1_000 },
    async run({ record, input, services, idempotencyKey }) {
      const result = await services.store.dispatch(3, rowIds(input));
      if (result.created.length)
        await services.store.trace({
          key: idempotencyKey,
          docKind: 'team',
          docId: idOf(record.id),
          actorId: people(record.assignees)[0] ?? '',
          action: '派发执行人',
          detail: {
            departments: result.created.map((item) => item.departmentName),
            numbers: result.created.map((item) => item.number),
            notified: result.notified,
            skipped: result.skipped,
          },
        });
      return { created: result.created.length, notified: result.notified };
    },
  });

export const SIGN_DECISIONS: Readonly<Record<string, string>> = {
  Y: '[Y] 已接收',
  B: '[B] 有异议与办公室联系',
  C: '[C] 已接收，待反馈',
};

/**
 * 办事人员子流程: 开始 → 办事人员会签 → 办事人员审批 → 结束. In the
 * countersign every clerk of the department answers; [Y] and [B] end the
 * task at once, and [C] moves it on once every clerk has answered [C].
 */
export const clerkTaskLifecycle: Lifecycle<ClerkTypes> =
  defineLifecycle<ClerkTypes>({
    name: 'clerkTasks',
    collection: COLLECTIONS.clerkTasks,
    initial: 'signing',
    states: [
      'signing',
      'reviewing',
      { name: 'accepted', final: true },
      { name: 'objected', final: true },
      { name: 'done', final: true },
    ],
    transitions: {
      sign: {
        title: '会签',
        from: 'signing',
        to: ['signing', 'reviewing', 'accepted', 'objected'],
        // An assignee may countersign, once. Having signed already refuses
        // this person only — the other clerks can still sign — so it is a
        // permission (403), not a precondition nobody could get past.
        guard: (context) =>
          !isAssignee(context)
            ? false
            : !people(context.record.signedBy).includes(context.actor.id) || {
                code: 'alreadySigned',
                message: 'You have already countersigned this task.',
                kind: 'permission',
              },
        validate: (input) =>
          typeof input.decision === 'string' && input.decision in SIGN_DECISIONS
            ? null
            : 'Choose a countersign decision.',
        route: ({ record, actor, input }) => {
          if (input.decision === 'Y') return 'accepted';
          if (input.decision === 'B') return 'objected';
          const signed = new Set([...people(record.signedBy), actor.id]);
          return people(record.assignees).every((person) => signed.has(person))
            ? 'reviewing'
            : 'signing';
        },
        set: ({ record, actor, input }) => ({
          signedBy: [...people(record.signedBy), actor.id],
          decision: text(input.decision),
        }),
      },
      dispatchTeams: {
        title: '派发执行团队信息',
        from: 'reviewing',
        to: 'reviewing',
        guard: isAssignee,
        validate: rowsRequired,
        effects: [dispatchTeams],
      },
      requestAssist: {
        title: '派发其他部门协助',
        from: 'reviewing',
        to: 'reviewing',
        guard: isAssignee,
        validate: rowsRequired,
        effects: [dispatchAssist],
      },
      submitFeedback: {
        title: '提交反馈',
        from: 'reviewing',
        to: 'done',
        guard: isAssignee,
        set: ({ record }) =>
          feedbackSet(record, { opinion: true, outgoingRef: true }),
      },
    },
    onEnter: { objected: [notifyObjection] },
  });

/** 执行团队处理流程: 开始 → 执行团队处理 → 结束. */
export const teamTaskLifecycle: Lifecycle<TeamTypes> =
  defineLifecycle<TeamTypes>({
    name: 'teamTasks',
    collection: COLLECTIONS.teamTasks,
    initial: 'processing',
    states: ['processing', { name: 'done', final: true }],
    transitions: {
      dispatchExecutors: {
        title: '派发执行人',
        from: 'processing',
        to: 'processing',
        guard: isAssignee,
        validate: rowsRequired,
        effects: [dispatchExecutors],
      },
      submitFeedback: {
        title: '提交反馈',
        from: 'processing',
        to: 'done',
        guard: isAssignee,
        set: ({ record }) =>
          feedbackSet(record, { opinion: true, outgoingRef: false }),
      },
    },
  });

/** 执行人处理流程: 开始 → 执行人处理 → 结束. */
export const executorTaskLifecycle: Lifecycle<ExecutorTypes> =
  defineLifecycle<ExecutorTypes>({
    name: 'executorTasks',
    collection: COLLECTIONS.executorTasks,
    initial: 'processing',
    states: ['processing', { name: 'done', final: true }],
    transitions: {
      submitFeedback: {
        title: '提交反馈',
        from: 'processing',
        to: 'done',
        guard: isAssignee,
        set: ({ record }) =>
          feedbackSet(record, { opinion: false, outgoingRef: false }),
      },
    },
  });
