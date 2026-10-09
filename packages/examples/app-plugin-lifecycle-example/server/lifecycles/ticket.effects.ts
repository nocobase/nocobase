import { defineEffect, type EffectDefinition } from '@nocobase/lifecycle';

import { person } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import type { TicketTypes } from './ticket.js';

/** Emails the customer the agent's reply. Retried with backoff; the reply stands either way. */
export const notifyCustomer: EffectDefinition<TicketTypes> =
  defineEffect<TicketTypes>({
    name: 'tickets.notifyCustomer',
    retry: { attempts: 3, backoffMs: 2_000, factor: 2, maxMs: 10_000 },
    timeoutMs: 10_000,
    run({ record, input, idempotencyKey, services }) {
      // The example's failure switch: the first N calls fail, so the page
      // can show a retry, and a failure that outlasts every attempt.
      if (services.shouldFail(idempotencyKey, record.failNotifications))
        throw new Error('The mail service is unavailable (simulated).');
      const to = person(record.requesterId)?.email ?? record.requesterId;
      services.deliver(
        to,
        `Re: ${record.subject}`,
        text(input.message),
        idempotencyKey,
      );
      return { to };
    },
  });

/** Tells the assigned agent that the customer wrote back. */
export const notifyAssignee: EffectDefinition<TicketTypes> =
  defineEffect<TicketTypes>({
    name: 'tickets.notifyAssignee',
    run({ record, input, idempotencyKey, services }) {
      if (!record.assigneeId) return { skipped: true };
      const to = person(record.assigneeId)?.email ?? record.assigneeId;
      services.deliver(
        to,
        `客户回复：${record.subject}`,
        text(input.message),
        idempotencyKey,
      );
      return { to };
    },
  });
