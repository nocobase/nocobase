import {
  normalizeReviewerSelections,
  type ParameterGroup,
} from '@nocobase/lifecycle';
import { z } from 'zod';

export const expenseParameterGroup: ParameterGroup = {
  key: 'expenseThresholds',
  title: 'Expense thresholds',
  schemaVersion: 1,
  fields: {
    autoApproveLimit: {
      type: 'number',
      title: 'Automatic approval limit (yuan)',
      minimum: 0,
      parse: (value) => z.number().finite().min(0).parse(value),
      bindings: [
        { state: 'draft' },
        { transition: 'submit' },
        { transition: 'resubmit' },
      ],
    },
    financeLimit: {
      type: 'number',
      title: 'Finance review limit (yuan)',
      minimum: 0,
      parse: (value) => z.number().finite().min(0).parse(value),
      bindings: [{ state: 'awaitingManager' }],
    },
  },
  sameReadMode: [['autoApproveLimit', 'financeLimit']],
  validate: (values) => {
    if (Number(values.autoApproveLimit) > Number(values.financeLimit))
      throw new Error(
        'The automatic approval limit cannot exceed the finance limit.',
      );
  },
};
export const ticketParameterGroup: ParameterGroup = {
  key: 'ticketPolicy',
  title: 'Ticket reopening',
  schemaVersion: 1,
  fields: {
    reopenDays: {
      type: 'number',
      title: 'Reopen window (days)',
      readMode: 'live',
      minimum: 0,
      maximum: 365,
      parse: (value) => z.number().finite().min(0).max(365).parse(value),
      bindings: [{ state: 'closed' }, { transition: 'reopen' }],
    },
  },
};
export const notificationParameterGroup: ParameterGroup = {
  key: 'notificationCopy',
  title: 'Simulated notification copy',
  schemaVersion: 1,
  fields: {
    notificationPrefix: {
      type: 'string',
      title: 'Notification prefix',
      readMode: 'live',
      parse: (value) => z.string().max(200).parse(value),
      bindings: [{ state: 'awaitingCustomer' }, { transition: 'reply' }],
    },
  },
};
export const reviewerParameterGroup: ParameterGroup = {
  key: 'financeReviewers',
  title: 'Finance reviewer selection',
  schemaVersion: 1,
  fields: {
    reviewerRule: {
      type: 'reviewers',
      title: 'Reviewers',
      parse: (value) =>
        normalizeReviewerSelections(value, ['department', 'role', 'user']),
      bindings: [{ state: 'review' }, { transition: 'submit' }],
    },
  },
};
function timingGroup(
  key: string,
  title: string,
  fields: Record<string, string>,
  states: Record<string, string>,
): ParameterGroup {
  return {
    key,
    title,
    schemaVersion: 1,
    fields: Object.fromEntries(
      Object.entries(fields).map(([name, label]) => [
        name,
        {
          type: 'number',
          title: label,
          readMode: 'live',
          bindings: [{ state: states[name] }],
          minimum: 1,
          parse: (value: unknown) =>
            z.number().int().min(1).max(525600).parse(value),
        },
      ]),
    ),
  };
}
export const expenseTimingGroup: ParameterGroup = timingGroup(
  'expenseTiming',
  'Approval timing',
  { escalateAfterMinutes: 'Escalation delay (minutes)' },
  { escalateAfterMinutes: 'awaitingManager' },
);
export const ticketTimingGroup: ParameterGroup = timingGroup(
  'ticketTiming',
  'Ticket timing',
  {
    waitMinutes: 'Customer reply timeout (minutes)',
  },
  { waitMinutes: 'awaitingCustomer' },
);
export const orderTimingGroup: ParameterGroup = timingGroup(
  'orderTiming',
  'Payment timing',
  {
    paymentWindowMinutes: 'Payment window (minutes)',
  },
  { paymentWindowMinutes: 'awaitingPayment' },
);
export const invoiceTimingGroup: ParameterGroup = timingGroup(
  'invoiceTiming',
  'Invoice timing',
  { querySeconds: 'Query interval (seconds)' },
  { querySeconds: 'awaitingIssue' },
);
export const exportTimingGroup: ParameterGroup = timingGroup(
  'exportTiming',
  'Export timing',
  {
    pollSeconds: 'Polling interval (seconds)',
    maxMinutes: 'Maximum wait (minutes)',
  },
  { pollSeconds: 'processing', maxMinutes: 'processing' },
);
export const subscriptionTimingGroup: ParameterGroup = timingGroup(
  'subscriptionTiming',
  'Subscription timing',
  {
    periodMinutes: 'Billing period (minutes)',
    dunningMinutes: 'Retry interval (minutes)',
    maxDunning: 'Maximum payment retries',
  },
  { periodMinutes: 'active', dunningMinutes: 'pastDue', maxDunning: 'pastDue' },
);
