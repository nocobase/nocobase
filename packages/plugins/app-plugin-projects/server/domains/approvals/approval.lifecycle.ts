/**
 * An approval request's own lifecycle, fixed in code: pending until one of its approvers approves or rejects it, the
 * requester withdraws it, or the system marks it stale (the issue left the status, or the move no longer passes its
 * checks when approved). Every decision goes through `move`, so who may decide is one rule each. Any kind but the
 * system may withdraw a request it made (`kernel/kinds.ts`), so the machine is compiled for the registered kinds.
 */
import type { ApprovalStatus } from '../../../shared/approvals.js';
import { SYSTEM_KIND } from '../../../shared/kinds.js';
import type { Tx } from '../../kernel/tx.js';
import {
  compile,
  createLifecycleRegistry,
  type LifecycleDefinition,
  type LifecycleMachine,
  type LifecycleRegistry,
} from '../../lifecycle/index.js';
import { listOf, type ApprovalRecord } from './approval.store.js';

const state = (key: ApprovalStatus, category: 'open' | 'closed') => ({
  key,
  name: key,
  category,
});

/** The lifecycle for the registered `kinds` (their keys). */
export function approvalLifecycle(
  kinds: readonly string[],
): LifecycleDefinition {
  return {
    states: [
      state('pending', 'open'),
      state('approved', 'closed'),
      state('rejected', 'closed'),
      state('withdrawn', 'closed'),
      state('stale', 'closed'),
    ],
    transitions: [
      {
        from: 'pending',
        to: 'approved',
        actors: ['user'],
        who: { type: 'approver' },
      },
      {
        from: 'pending',
        to: 'rejected',
        actors: ['user'],
        who: { type: 'approver' },
      },
      {
        from: 'pending',
        to: 'withdrawn',
        actors: kinds.filter((kind) => kind !== SYSTEM_KIND),
        who: { type: 'requester' },
      },
      { from: 'pending', to: 'stale', actors: [SYSTEM_KIND] },
    ],
  };
}

export function approvalMachine(kinds: readonly string[]): LifecycleMachine {
  return compile(approvalLifecycle(kinds));
}

export const approvalRules: LifecycleRegistry<ApprovalRecord, Tx> =
  createLifecycleRegistry<ApprovalRecord, Tx>()
    .whoRule('approver', {
      allows: (ctx) =>
        Promise.resolve(
          ctx.actor.id !== null &&
            listOf(ctx.subject.approverUserIds).includes(ctx.actor.id),
        ),
    })
    .whoRule('requester', {
      allows: (ctx) =>
        Promise.resolve(
          ctx.actor.type === ctx.subject.requestedByType &&
            ctx.actor.id === ctx.subject.requestedById,
        ),
    });
