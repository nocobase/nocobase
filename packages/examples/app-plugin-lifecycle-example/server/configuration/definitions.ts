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
      bindings: [{ transition: 'submit' }, { transition: 'resubmit' }],
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
      bindings: [{ transition: 'reopen' }],
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
      bindings: [{ transition: 'reply' }],
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
export const defaultReviewerRule: readonly {
  readonly group: number;
  readonly type: string;
  readonly referenceId: string;
}[] = [
  { group: 1, type: 'department', referenceId: 'finance-one' },
  { group: 1, type: 'role', referenceId: 'reviewer' },
];
