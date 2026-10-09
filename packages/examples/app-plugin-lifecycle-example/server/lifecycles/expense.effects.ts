import { defineEffect, type EffectDefinition } from '@nocobase/lifecycle';

import { yuan } from '../../shared/expense.js';
import { person } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import type { ExpenseTypes } from './expense.js';

function email(id: unknown): string {
  return person(id)?.email ?? text(id);
}

export const notifyApprover: EffectDefinition<ExpenseTypes> =
  defineEffect<ExpenseTypes>({
    name: 'expenses.notifyApprover',
    run({ record, idempotencyKey, services }) {
      services.deliver(
        email(record.approverId),
        `待审批：${record.title}`,
        `${person(record.applicantId)?.name ?? ''}提交了 ${yuan(record.amountCents)} 的报销`,
        idempotencyKey,
      );
      return { to: email(record.approverId) };
    },
  });

export const notifyApplicant: EffectDefinition<ExpenseTypes> =
  defineEffect<ExpenseTypes>({
    name: 'expenses.notifyApplicant',
    run({ record, to, input, idempotencyKey, services }) {
      const reason =
        typeof input.reason === 'string' ? `：${input.reason}` : '';
      services.deliver(
        email(record.applicantId),
        `报销进度：${record.title}`,
        `${to}${reason}`,
        idempotencyKey,
      );
      return { to: email(record.applicantId) };
    },
  });

export const requestPayment: EffectDefinition<ExpenseTypes> =
  defineEffect<ExpenseTypes>({
    name: 'expenses.requestPayment',
    // 2 s, then 4 s; a payment taking longer than 10 s counts as failed.
    retry: { attempts: 3, backoffMs: 2_000, factor: 2, maxMs: 10_000 },
    timeoutMs: 10_000,
    // Marks the expense paid with the reference the payment returned.
    onSuccess: 'paid',
    run({ record, idempotencyKey, services }) {
      if (services.shouldFail(idempotencyKey, record.failPayments))
        throw new Error('The payment gateway is unavailable (simulated).');
      return {
        paymentRef: services.pay(
          record.applicantId,
          record.amountCents,
          idempotencyKey,
        ),
      };
    },
  });
