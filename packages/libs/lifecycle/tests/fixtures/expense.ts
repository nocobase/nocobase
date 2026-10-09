import {
  defineEffect,
  defineLifecycle,
  type Lifecycle,
  type LifecycleRecord,
  type TransitionContext,
} from '../../src/index.js';

export interface Expense extends LifecycleRecord {
  readonly applicantId: string;
  readonly amount: number;
  readonly approverId: string | null;
  readonly status: ExpenseState;
}

export type ExpenseState =
  | 'draft'
  | 'awaitingManager'
  | 'awaitingFinance'
  | 'needsInfo'
  | 'approved'
  | 'rejected'
  | 'paid';

export interface ExpenseServices {
  readonly org: {
    managerOf(userId: string): string;
    financeDirector(): string;
  };
  readonly notify: (to: string, message: string) => void;
  readonly pay: (payee: string, amount: number, key: string) => void;
}

export interface ExpenseTypes {
  record: Expense;
  state: ExpenseState;
  parameters: {
    autoApproveLimit: number;
    financeLimit: number;
    escalateAfterDays: number;
  };
  services: ExpenseServices;
}

type Context = TransitionContext<ExpenseTypes>;

const routeByAmount = ({ record, parameters }: Context): ExpenseState =>
  record.amount <= parameters.autoApproveLimit ? 'approved' : 'awaitingManager';
const isApplicant = ({ record, actor }: Context): boolean =>
  actor.id === record.applicantId;
const isApprover = ({ record, actor }: Context): boolean =>
  actor.id === record.approverId;

export const notifyApprover = defineEffect<ExpenseTypes>({
  name: 'expenses.notifyApprover',
  run: ({ record, services }) =>
    services.notify(String(record.approverId), 'expense-pending'),
});

export const notifyApplicant = defineEffect<ExpenseTypes>({
  name: 'expenses.notifyApplicant',
  run: ({ record, to, services }) => services.notify(record.applicantId, to),
});

export const requestPayment = defineEffect<ExpenseTypes>({
  name: 'expenses.requestPayment',
  retry: { attempts: 3 },
  onSuccess: 'paid',
  run: ({ record, idempotencyKey, services }) => {
    services.pay(record.applicantId, record.amount, idempotencyKey);
    return { paymentRef: `PAY-${String(record.id)}` };
  },
});

export const expenseLifecycle: Lifecycle<ExpenseTypes> =
  defineLifecycle<ExpenseTypes>({
    name: 'expenses',
    initial: 'draft',
    states: [
      'draft',
      'awaitingManager',
      'awaitingFinance',
      'needsInfo',
      'approved',
      { name: 'rejected', final: true },
      { name: 'paid', final: true },
    ],
    parameters: {
      autoApproveLimit: 5000,
      financeLimit: 50000,
      escalateAfterDays: 3,
    },
    transitions: {
      submit: {
        from: 'draft',
        to: ['approved', 'awaitingManager'],
        route: routeByAmount,
        guard: isApplicant,
        set: ({ record, services }) => ({
          approverId: services.org.managerOf(record.applicantId),
        }),
      },
      approve: {
        from: ['awaitingManager', 'awaitingFinance'],
        to: ['approved', 'awaitingFinance'],
        route: ({ record, parameters }) =>
          record.status === 'awaitingManager' &&
          record.amount > parameters.financeLimit
            ? 'awaitingFinance'
            : 'approved',
        guard: isApprover,
        set: ({ to, services }) => ({
          approverId:
            to === 'awaitingFinance' ? services.org.financeDirector() : null,
        }),
      },
      reject: {
        from: ['awaitingManager', 'awaitingFinance'],
        to: 'rejected',
        guard: isApprover,
        validate: (input) =>
          typeof input.reason === 'string' && input.reason
            ? null
            : 'A rejection needs a reason.',
        effects: [notifyApplicant],
      },
      requestInfo: {
        from: 'awaitingManager',
        to: 'needsInfo',
        guard: isApprover,
        effects: [notifyApplicant],
      },
      resubmit: {
        from: 'needsInfo',
        to: ['approved', 'awaitingManager'],
        route: routeByAmount,
        guard: isApplicant,
      },
      escalate: {
        from: 'awaitingManager',
        to: 'awaitingManager',
        guard: ({ actor }) => actor.system === true,
        set: ({ record, services }) => ({
          approverId: services.org.managerOf(String(record.approverId)),
        }),
      },
      paid: {
        from: 'approved',
        to: 'paid',
        set: ({ input }) => ({ paymentRef: input.paymentRef ?? null }),
      },
    },
    onEnter: {
      awaitingManager: [notifyApprover],
      awaitingFinance: [notifyApprover],
      approved: [notifyApplicant, requestPayment],
    },
    triggers: {
      escalateStale: {
        transition: 'escalate',
        when: 'awaitingManager',
        after: ({ escalateAfterDays }) => escalateAfterDays * 86_400_000,
      },
    },
  });

export function fakeExpenseServices(): ExpenseServices & {
  readonly notifications: string[];
  readonly payments: string[];
} {
  const managers: Record<string, string> = { alice: 'bob', bob: 'carol' };
  const notifications: string[] = [];
  const payments: string[] = [];
  return {
    notifications,
    payments,
    org: {
      managerOf: (userId) => managers[userId] ?? 'ceo',
      financeDirector: () => 'dora',
    },
    notify: (to, message) => {
      notifications.push(`${to}:${message}`);
    },
    pay: (payee, amount, key) => {
      payments.push(`${payee}:${amount}:${key}`);
    },
  };
}
