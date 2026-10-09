import type { AIWorkContextItem } from '#extensions/nocobase-ai';

export type TicketPriority = 'high' | 'normal' | 'low';
export type TicketStatus = 'open' | 'pending';

export interface SupportTicket {
  readonly id: string;
  readonly title: string;
  readonly status: TicketStatus;
  readonly priority: TicketPriority;
  readonly requester: string;
  readonly createdAt: string;
  readonly description: string;
}

// Sample records owned by this page. In an application they come from its own API; the AI employee reads each
// ticket's internal history from the server through the plugin's `example-ticket-history` tool.
export const SUPPORT_TICKETS: readonly SupportTicket[] = [
  {
    id: 'TK-1042',
    title: 'Payment callback delayed',
    status: 'open',
    priority: 'high',
    requester: 'Northwind Finance',
    createdAt: '2026-07-22T09:42:00Z',
    description:
      'Payment succeeded, but the callback reached the order service twelve minutes late. The customer needs an impact assessment and a response before the next settlement window.',
  },
  {
    id: 'TK-1041',
    title: 'Unable to update profile',
    status: 'pending',
    priority: 'normal',
    requester: 'Contoso Retail',
    createdAt: '2026-07-21T15:10:00Z',
    description:
      'Saving the account profile fails when the phone number contains an extension.',
  },
  {
    id: 'TK-1038',
    title: 'Invoice export formatting',
    status: 'open',
    priority: 'low',
    requester: 'Fabrikam',
    createdAt: '2026-07-19T08:20:00Z',
    description:
      'Exported invoices use a comma as the decimal separator in the English locale.',
  },
];

/** The work context a task hands the AI employee: the server passes `content` to the model as JSON. */
export function ticketWorkContext(ticket: SupportTicket): AIWorkContextItem {
  return {
    type: 'support-ticket',
    id: ticket.id,
    title: `${ticket.id} · ${ticket.title}`,
    content: ticket,
  };
}
