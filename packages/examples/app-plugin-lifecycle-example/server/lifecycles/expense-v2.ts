import {
  defineLifecycle,
  type Lifecycle,
  type TransitionContext,
} from '@nocobase/lifecycle';

import { FINANCE_DIRECTOR } from '../../shared/people.js';
import {
  expenseAuditGroup,
  expenseParameterGroup,
  expenseTimingGroup,
} from '../configuration/definitions.js';
import {
  expenseLifecycle,
  isApplicant,
  isApprover,
  readyToSubmit,
  reasonRequired,
  routeByAmount,
  type Expense,
  type ExpenseTypes,
} from './expense.js';
import {
  notifyApplicant,
  notifyApprover,
  requestPayment,
} from './expense.effects.js';
import type { ExampleServices } from './services.js';

export type ExpenseV2State =
  | 'draft'
  | 'awaitingManager'
  | 'awaitingFinance'
  | 'awaitingAudit'
  | 'needsInfo'
  | 'approved'
  | 'rejected'
  | 'paid';

export interface ExpenseV2Types {
  record: Expense;
  state: ExpenseV2State;
  parameters: ExpenseTypes['parameters'] & {
    /** Above it, in yuan, the finance director audits an approved report. */
    auditLimit: number;
  };
  services: ExampleServices;
}

type Context = TransitionContext<ExpenseV2Types>;
// The first version's rules, unchanged: both versions run them, so they
// stay as they are for as long as either version has records.
const asV1 = <R>(rule: (context: TransitionContext<ExpenseTypes>) => R) =>
  rule as unknown as (context: Context) => R;
const applicant = asV1(isApplicant);
const approver = asV1(isApprover);
const ready = asV1(readyToSubmit);
const submitted = asV1(routeByAmount) as (context: Context) => ExpenseV2State;

/**
 * The second version of the expense report. It runs as the first, except
 * that a report a manager approves above the audit limit, and below the
 * finance limit, waits for the finance director's audit before it is paid.
 * It shares the first version's table and parameter groups; the audit limit
 * is a group of its own. New reports are drafted with this version, and
 * reports drafted before keep running the first.
 */
export const expenseV2Lifecycle: Lifecycle<ExpenseV2Types> =
  defineLifecycle<ExpenseV2Types>({
    name: 'expenses-v2',
    key: 'expenses',
    version: 2,
    definitionField: expenseLifecycle.definitionField,
    collection: expenseLifecycle.collection,
    initial: 'draft',
    create: expenseLifecycle.create as never,
    states: [
      'draft',
      'awaitingManager',
      'awaitingFinance',
      'awaitingAudit',
      'needsInfo',
      'approved',
      { name: 'rejected', final: true },
      { name: 'paid', final: true },
    ],
    dueAtField: 'lifecycleDueAt',
    parameterConfiguration: {
      startTransition: 'submit',
      groups: [expenseParameterGroup, expenseTimingGroup, expenseAuditGroup],
    },
    parameters: {
      autoApproveLimit: 5000,
      financeLimit: 50000,
      escalateAfterMinutes: 3,
      auditLimit: 20000,
    },
    transitions: {
      submit: {
        title: '提交',
        from: 'draft',
        to: ['approved', 'awaitingManager'],
        route: submitted,
        guard: applicant,
        set: ready,
      },
      approve: {
        title: '通过',
        from: ['awaitingManager', 'awaitingFinance'],
        to: ['approved', 'awaitingFinance', 'awaitingAudit'],
        route: ({ record, parameters }) => {
          if (record.status !== 'awaitingManager') return 'approved';
          if (record.amountCents > parameters.financeLimit * 100)
            return 'awaitingFinance';
          return record.amountCents > parameters.auditLimit * 100
            ? 'awaitingAudit'
            : 'approved';
        },
        guard: approver,
        set: ({ to }) => ({
          approverId:
            to === 'awaitingFinance' || to === 'awaitingAudit'
              ? FINANCE_DIRECTOR
              : null,
        }),
      },
      audit: {
        title: '审计通过',
        from: 'awaitingAudit',
        to: 'approved',
        guard: approver,
        set: () => ({ approverId: null }),
      },
      reject: {
        title: '驳回',
        from: ['awaitingManager', 'awaitingFinance', 'awaitingAudit'],
        to: 'rejected',
        guard: approver,
        validate: reasonRequired,
        set: () => ({ approverId: null }),
        effects: [notifyApplicant as never],
      },
      requestInfo: {
        title: '退回补充',
        from: ['awaitingManager', 'awaitingFinance', 'awaitingAudit'],
        to: 'needsInfo',
        guard: approver,
        validate: reasonRequired,
        set: () => ({ approverId: null }),
        effects: [notifyApplicant as never],
      },
      resubmit: {
        title: '重新提交',
        from: 'needsInfo',
        to: ['approved', 'awaitingManager'],
        route: submitted,
        guard: applicant,
        set: ready,
      },
      withdraw: {
        title: '撤回',
        from: { except: ['draft', 'approved'] },
        to: 'draft',
        guard: applicant,
        set: () => ({ approverId: null }),
      },
      escalate: expenseLifecycle.transitions.get('escalate')!
        .definition as never,
      paid: expenseLifecycle.transitions.get('paid')!.definition as never,
    },
    onEnter: {
      awaitingManager: [notifyApprover as never],
      awaitingFinance: [notifyApprover as never],
      awaitingAudit: [notifyApprover as never],
      approved: [notifyApplicant as never, requestPayment as never],
    },
    triggers: {
      escalateStale: {
        transition: 'escalate',
        when: 'awaitingManager',
        after: ({ escalateAfterMinutes }) => escalateAfterMinutes * 60_000,
      },
    },
  });
