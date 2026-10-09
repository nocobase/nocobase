import {
  defineLifecycle,
  type Lifecycle,
  type LifecycleRecord,
  type TransitionContext,
  type GuardVerdict,
  type InputProblem,
} from '@nocobase/lifecycle';

import { person } from '../../shared/people.js';
import {
  PRIORITIES,
  TICKET_CATEGORIES,
  type Priority,
} from '../../shared/ticket.js';
import { LIFECYCLE_EXAMPLE_COLLECTIONS } from '../scope.js';
import type { ExampleServices } from './services.js';
import { notifyAssignee, notifyCustomer } from './ticket.effects.js';

export type TicketState = 'new' | 'open' | 'awaitingCustomer' | 'closed';

export interface Ticket extends LifecycleRecord {
  readonly subject: string;
  readonly requesterId: string;
  readonly assigneeId: string | null;
  readonly status: TicketState;
  readonly statusChangedAt: string;
  /** How many notification attempts fail on purpose. */
  readonly failNotifications: number;
}

export interface TicketTypes {
  record: Ticket;
  state: TicketState;
  parameters: { waitMinutes: number; reopenDays: number };
  services: ExampleServices;
}

type Context = TransitionContext<TicketTypes>;

// A guard's verdict is what the page shows beside a button it greys out:
// the code is stable for the page to translate, the message says it in English.
function isAgent({ actor }: Context): GuardVerdict {
  return (
    person(actor.id)?.role === 'agent' || {
      code: 'agentOnly',
      message: 'Only a support agent can work on tickets.',
    }
  );
}

function isRequester({ record, actor }: Context): GuardVerdict {
  return (
    actor.id === record.requesterId || {
      code: 'requesterOnly',
      message: 'Only the customer who filed the ticket can do this.',
    }
  );
}

/** A new ticket names what it is about, in one of the desk's categories and priorities. */
function ticketProblems(
  values: Readonly<Record<string, unknown>>,
): InputProblem[] {
  const filled = (field: string): boolean =>
    typeof values[field] === 'string' && values[field].trim() !== '';
  return [
    ...(filled('subject')
      ? []
      : [{ field: 'subject', message: 'Give the ticket a subject.' }]),
    ...(filled('description')
      ? []
      : [{ field: 'description', message: 'Describe the problem.' }]),
    ...(TICKET_CATEGORIES.includes(String(values.category))
      ? []
      : [{ field: 'category', message: 'Choose a category.' }]),
    ...(PRIORITIES.includes(String(values.priority) as Priority)
      ? []
      : [{ field: 'priority', message: 'Choose a priority.' }]),
  ];
}

function messageRequired(input: Record<string, unknown>): InputProblem[] {
  return typeof input.message === 'string' && input.message.trim()
    ? []
    : [{ field: 'message', message: 'Write a message.' }];
}

/**
 * A support ticket. An agent takes it and replies; the ticket then waits for
 * the customer, and closes itself when the customer stays silent. A customer
 * reply brings it back to the agent, and a closed ticket can be reopened for
 * a while. The conversation is the transition log: every reply is the input
 * of the transition it caused.
 */
export const ticketLifecycle: Lifecycle<TicketTypes> =
  defineLifecycle<TicketTypes>({
    name: 'tickets',
    collection: LIFECYCLE_EXAMPLE_COLLECTIONS.tickets,
    initial: 'new',
    // Every way a ticket is filed meets the same rule: a customer, for themselves.
    create: {
      validate: ticketProblems,
      guard: ({ values, actor }) =>
        (person(actor.id)?.role === 'customer' &&
          values.requesterId === actor.id) || {
          code: 'customersOnly',
          message: 'Only a customer can file a ticket, for themselves.',
        },
    },
    states: ['new', 'open', 'awaitingCustomer', 'closed'],
    // A real help desk waits days; the example waits minutes so you can watch it.
    parameters: { waitMinutes: 2, reopenDays: 7 },
    transitions: {
      accept: {
        title: '受理',
        from: 'new',
        to: 'open',
        guard: isAgent,
        set: ({ actor }) => ({ assigneeId: actor.id }),
      },
      reply: {
        title: '回复客户',
        // A follow-up while waiting restarts the wait.
        from: ['new', 'open', 'awaitingCustomer'],
        to: 'awaitingCustomer',
        guard: isAgent,
        validate: messageRequired,
        // Replying to a new ticket takes it.
        set: ({ record, actor }) =>
          record.assigneeId ? {} : { assigneeId: actor.id },
        effects: [notifyCustomer],
      },
      customerReply: {
        title: '客户回复',
        from: ['new', 'open', 'awaitingCustomer'],
        to: ['new', 'open'],
        route: ({ record }) => (record.status === 'new' ? 'new' : 'open'),
        guard: isRequester,
        validate: messageRequired,
        effects: [notifyAssignee],
      },
      resolve: {
        title: '标记已解决',
        from: ['open', 'awaitingCustomer'],
        to: 'closed',
        guard: isAgent,
        set: () => ({ closedReason: 'resolved' }),
      },
      autoClose: {
        title: '超时自动关闭',
        from: 'awaitingCustomer',
        to: 'closed',
        guard: ({ actor }) =>
          actor.system === true || {
            code: 'systemOnly',
            message: 'The system closes a ticket once the wait has passed.',
          },
        set: () => ({ closedReason: 'timeout' }),
      },
      reopen: {
        title: '重新打开',
        from: 'closed',
        to: 'open',
        // Only the customer, and only for a while after it closed. Who may is
        // a permission; how long ago it closed is a precondition, which the
        // route answers as 400 FAILED_PRECONDITION rather than 403.
        guard: (context) => {
          const requester = isRequester(context);
          if (requester !== true) return requester;
          return (
            context.now.getTime() - Date.parse(context.record.statusChangedAt) <
              context.parameters.reopenDays * 86_400_000 || {
              code: 'reopenExpired',
              message: `Closed more than ${context.parameters.reopenDays} days ago; file a new ticket instead.`,
              kind: 'precondition',
            }
          );
        },
        validate: messageRequired,
        set: () => ({ closedReason: null }),
        effects: [notifyAssignee],
      },
    },
    triggers: {
      closeSilent: {
        transition: 'autoClose',
        when: 'awaitingCustomer',
        after: ({ waitMinutes }) => waitMinutes * 60_000,
      },
    },
  });
