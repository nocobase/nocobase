import {
  defineEffect,
  defineLifecycle,
  type Lifecycle,
  type LifecycleDefinition,
  type LifecycleRecord,
} from '../../src/index.js';

export interface Ticket extends LifecycleRecord {
  readonly customerEmail: string;
  readonly status: TicketState;
}

export type TicketState = 'open' | 'awaitingCustomer' | 'closed';

export interface TicketTypes {
  record: Ticket;
  state: TicketState;
  parameters: { waitHours: number };
  services: { mail: { send(to: string, body: string, key: string): void } };
}

export const notifyCustomer = defineEffect<TicketTypes>({
  name: 'tickets.notifyCustomer',
  retry: { attempts: 3 },
  run({ record, input, idempotencyKey, services }) {
    services.mail.send(
      record.customerEmail,
      String(input.message),
      idempotencyKey,
    );
    return { sentTo: record.customerEmail };
  },
});

export const ticketDefinition: LifecycleDefinition<TicketTypes> = {
  name: 'tickets',
  initial: 'open',
  states: ['open', 'awaitingCustomer', { name: 'closed', final: true }],
  parameters: { waitHours: 72 },
  transitions: {
    replyToCustomer: {
      from: 'open',
      to: 'awaitingCustomer',
      validate: (input) =>
        typeof input.message === 'string' && input.message
          ? null
          : 'A reply needs a message.',
      effects: [notifyCustomer],
    },
    customerReplied: { from: 'awaitingCustomer', to: 'open' },
    close: {
      from: ['open', 'awaitingCustomer'],
      to: 'closed',
      guard: ({ actor }) => actor.system === true || actor.id === 'agent',
    },
  },
  triggers: {
    autoClose: {
      transition: 'close',
      when: 'awaitingCustomer',
      after: ({ waitHours }) => waitHours * 3_600_000,
    },
  },
};

export const ticketLifecycle: Lifecycle<TicketTypes> =
  defineLifecycle<TicketTypes>(ticketDefinition);
