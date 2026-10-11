/** Mock data for the Inbox example. Nothing here reaches a server. */

export type ConversationStatus = 'open' | 'pending' | 'closed';

export type ConversationChannel = 'email' | 'chat' | 'phone';

export type ConversationPriority = 'low' | 'medium' | 'high';

export type MessageSide = 'customer' | 'agent';

export type AttachmentKind = 'pdf' | 'image' | 'spreadsheet';

export interface InboxParticipant {
  readonly name: string;
  readonly initials: string;
}

export interface InboxAgent extends InboxParticipant {
  readonly id: string;
  readonly email: string;
}

export interface InboxContact extends InboxParticipant {
  readonly email: string;
  readonly company: string;
}

export interface InboxAttachment {
  readonly name: string;
  readonly size: string;
  readonly kind: AttachmentKind;
}

export interface InboxMessage {
  readonly id: string;
  readonly from: MessageSide;
  readonly author: InboxParticipant;
  readonly body: string;
  readonly sentAt: string;
  readonly attachment?: InboxAttachment;
}

export interface Conversation {
  readonly id: string;
  readonly subject: string;
  readonly contact: InboxContact;
  readonly status: ConversationStatus;
  readonly channel: ConversationChannel;
  readonly priority: ConversationPriority;
  /** Id of the agent working the conversation, or `null` while it waits in the queue. */
  readonly assigneeId: string | null;
  readonly unread: number;
  readonly starred: boolean;
  readonly tags: readonly string[];
  readonly messages: readonly InboxMessage[];
}

export interface ReplyTemplate {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

export const CONVERSATION_STATUSES: readonly ConversationStatus[] = [
  'open',
  'pending',
  'closed',
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function agent(id: string, name: string, email: string): InboxAgent {
  return { id, name, email, initials: initials(name) };
}

function contact(name: string, email: string, company: string): InboxContact {
  return { name, email, company, initials: initials(name) };
}

/** The signed-in support agent. Replies from the composer are sent as this person. */
export const CURRENT_AGENT: InboxAgent = agent(
  'ag_priya',
  'Priya Natarajan',
  'priya@acme-support.com',
);

export const AGENTS: readonly InboxAgent[] = [
  CURRENT_AGENT,
  agent('ag_marcus', 'Marcus Reed', 'marcus@acme-support.com'),
  agent('ag_lena', 'Lena Hoffmann', 'lena@acme-support.com'),
  agent('ag_tomas', 'Tomás Alvarez', 'tomas@acme-support.com'),
];

export function agentById(id: string | null): InboxAgent | undefined {
  return AGENTS.find((candidate) => candidate.id === id);
}

export const REPLY_TEMPLATES: readonly ReplyTemplate[] = [
  {
    id: 'tpl_ack',
    title: 'Acknowledge',
    body: 'Thanks for reaching out — I am looking into this now and will get back to you shortly.',
  },
  {
    id: 'tpl_more_info',
    title: 'Ask for details',
    body: 'Could you share the exact steps you took and, if possible, a screenshot? That will help us pin this down faster.',
  },
  {
    id: 'tpl_resolved',
    title: 'Resolved',
    body: 'This should be fixed on your account now. Please let us know if anything else comes up — happy to help.',
  },
];

const AVA = contact('Ava Thompson', 'ava.thompson@northwind.io', 'Northwind');
const LIAM = contact('Liam Chen', 'liam.chen@fabrikam.com', 'Fabrikam');
const SOFIA = contact('Sofia Rossi', 'sofia.rossi@contoso.com', 'Contoso');
const NOAH = contact('Noah Patel', 'noah.patel@tailspin.co', 'Tailspin Toys');
const EMMA = contact('Emma Fischer', 'emma.fischer@adatum.de', 'Adatum');
const MATEO = contact(
  'Mateo García',
  'mateo.garcia@alpineski.es',
  'Alpine Ski',
);
const YUKI = contact(
  'Yuki Tanaka',
  'yuki.tanaka@woodgrove.jp',
  'Woodgrove Bank',
);
const OLIVIA = contact('Olivia Brown', 'olivia.brown@litware.com', 'Litware');
const AHMED = contact(
  'Ahmed Hassan',
  'ahmed.hassan@proseware.com',
  'Proseware',
);
const CHLOE = contact(
  'Chloé Martin',
  'chloe.martin@margiestravel.fr',
  "Margie's Travel",
);
const DANIEL = contact(
  'Daniel Kim',
  'daniel.kim@wideworldimporters.kr',
  'Wide World Importers',
);
const ISABELLA = contact(
  'Isabella Silva',
  'isabella.silva@bellowscollege.br',
  'Bellows College',
);

const MARCUS = agentById('ag_marcus') ?? CURRENT_AGENT;
const LENA = agentById('ag_lena') ?? CURRENT_AGENT;

let sequence = 0;

function message(
  from: MessageSide,
  author: InboxParticipant,
  sentAt: string,
  body: string,
  attachment?: InboxAttachment,
): InboxMessage {
  sequence += 1;
  return attachment
    ? { id: `msg_${sequence}`, from, author, body, sentAt, attachment }
    : { id: `msg_${sequence}`, from, author, body, sentAt };
}

export const CONVERSATIONS: readonly Conversation[] = [
  {
    id: 'cnv_1001',
    subject: 'Invoice #4821 shows the wrong billing address',
    contact: AVA,
    status: 'open',
    channel: 'email',
    priority: 'high',
    assigneeId: 'ag_priya',
    unread: 2,
    starred: true,
    tags: ['billing', 'enterprise'],
    messages: [
      message(
        'customer',
        AVA,
        '2026-09-20T15:42:00Z',
        'Hi — our September invoice still lists the old Portland office. We moved to Seattle in July and updated the address in the workspace settings. Can you reissue it?',
        { name: 'invoice-4821.pdf', size: '184 KB', kind: 'pdf' },
      ),
      message(
        'agent',
        CURRENT_AGENT,
        '2026-09-20T16:05:00Z',
        'Thanks Ava, I can see the address change on your account. Invoices are generated from the billing profile rather than the workspace profile, which is why it did not carry over. I will update it and reissue #4821 today.',
      ),
      message(
        'customer',
        AVA,
        '2026-09-21T08:12:00Z',
        'Great, thank you. Finance needs the corrected copy before Wednesday to close the month.',
      ),
      message(
        'customer',
        AVA,
        '2026-09-21T08:14:00Z',
        'Also — is there a way to make the billing profile follow the workspace address automatically?',
      ),
    ],
  },
  {
    id: 'cnv_1002',
    subject: 'Cannot export the orders report as CSV',
    contact: LIAM,
    status: 'open',
    channel: 'chat',
    priority: 'medium',
    assigneeId: null,
    unread: 1,
    starred: false,
    tags: ['reports', 'bug'],
    messages: [
      message(
        'customer',
        LIAM,
        '2026-09-21T09:03:00Z',
        'The Export button on the orders report spins for a while and then nothing downloads. It worked last week. Chrome on macOS, about 14k rows.',
      ),
    ],
  },
  {
    id: 'cnv_1003',
    subject: 'Add two more seats to our plan',
    contact: SOFIA,
    status: 'pending',
    channel: 'email',
    priority: 'low',
    assigneeId: 'ag_marcus',
    unread: 0,
    starred: false,
    tags: ['billing'],
    messages: [
      message(
        'customer',
        SOFIA,
        '2026-09-19T10:20:00Z',
        'We are onboarding two new account managers next month. How do we add seats, and will the price be prorated?',
      ),
      message(
        'agent',
        MARCUS,
        '2026-09-19T11:02:00Z',
        'Hi Sofia — you can add seats under Settings → Billing at any time and the charge is prorated to your renewal date. I have attached a quick estimate for two additional seats through the end of your term.',
        { name: 'seat-estimate.xlsx', size: '32 KB', kind: 'spreadsheet' },
      ),
      message(
        'customer',
        SOFIA,
        '2026-09-19T14:47:00Z',
        'Perfect, I will confirm with procurement and come back to you.',
      ),
    ],
  },
  {
    id: 'cnv_1004',
    subject: 'Webhook deliveries failing since the weekend',
    contact: NOAH,
    status: 'open',
    channel: 'email',
    priority: 'high',
    assigneeId: 'ag_lena',
    unread: 3,
    starred: true,
    tags: ['integrations', 'bug'],
    messages: [
      message(
        'customer',
        NOAH,
        '2026-09-21T06:55:00Z',
        'Our order.created webhooks have been returning 502 since Saturday night. Our endpoint is healthy — we see nothing arriving. Retries seem to have stopped as well.',
      ),
      message(
        'agent',
        LENA,
        '2026-09-21T07:30:00Z',
        'Thanks Noah, escalating this to the integrations team now. Could you confirm the endpoint URL and whether you rotated the signing secret recently?',
      ),
      message(
        'customer',
        NOAH,
        '2026-09-21T07:41:00Z',
        'URL is unchanged: https://hooks.tailspin.co/nocobase. No secret rotation on our side.',
      ),
      message(
        'customer',
        NOAH,
        '2026-09-21T09:20:00Z',
        'Any update? We are manually reconciling orders in the meantime.',
        { name: 'delivery-log.png', size: '612 KB', kind: 'image' },
      ),
    ],
  },
  {
    id: 'cnv_1005',
    subject: 'Feature request: dark mode for the customer portal',
    contact: EMMA,
    status: 'closed',
    channel: 'chat',
    priority: 'low',
    assigneeId: 'ag_priya',
    unread: 0,
    starred: false,
    tags: ['feedback'],
    messages: [
      message(
        'customer',
        EMMA,
        '2026-09-17T13:10:00Z',
        'Would love a dark theme on the portal our customers use — several of them have asked.',
      ),
      message(
        'agent',
        CURRENT_AGENT,
        '2026-09-17T13:25:00Z',
        'Noted and passed on to the product team, Emma. It is on the roadmap for Q4; I will keep this thread updated.',
      ),
      message('customer', EMMA, '2026-09-17T13:31:00Z', 'Wonderful, thanks!'),
    ],
  },
  {
    id: 'cnv_1006',
    subject: 'Password reset email never arrives',
    contact: MATEO,
    status: 'open',
    channel: 'phone',
    priority: 'medium',
    assigneeId: null,
    unread: 1,
    starred: false,
    tags: ['account'],
    messages: [
      message(
        'customer',
        MATEO,
        '2026-09-21T09:48:00Z',
        'Called in: requested a reset three times, nothing in inbox or spam. Domain is alpineski.es. Callback requested after 2pm CET.',
      ),
    ],
  },
  {
    id: 'cnv_1007',
    subject: 'Question about data residency',
    contact: YUKI,
    status: 'pending',
    channel: 'email',
    priority: 'medium',
    assigneeId: 'ag_priya',
    unread: 0,
    starred: false,
    tags: ['security', 'enterprise'],
    messages: [
      message(
        'customer',
        YUKI,
        '2026-09-18T02:15:00Z',
        'Our compliance team needs written confirmation that customer data stays within the Tokyo region. Do you have a document we can attach to our vendor review?',
      ),
      message(
        'agent',
        CURRENT_AGENT,
        '2026-09-18T08:40:00Z',
        'Hello Yuki — yes, workspaces created in the APAC region are stored and processed in Tokyo only. I have requested the signed residency statement from our legal team and will send it as soon as it is ready.',
      ),
    ],
  },
  {
    id: 'cnv_1008',
    subject: 'Duplicate charge on the corporate card',
    contact: OLIVIA,
    status: 'open',
    channel: 'email',
    priority: 'high',
    assigneeId: 'ag_marcus',
    unread: 0,
    starred: false,
    tags: ['billing'],
    messages: [
      message(
        'customer',
        OLIVIA,
        '2026-09-20T11:05:00Z',
        'We were charged twice on 18 September — two identical entries for $1,298. Please refund one of them.',
      ),
      message(
        'agent',
        MARCUS,
        '2026-09-20T11:32:00Z',
        'Sorry about that Olivia. I can confirm the duplicate on our side; the refund has been issued and should appear within 5 business days.',
      ),
    ],
  },
  {
    id: 'cnv_1009',
    subject: 'How do I bulk import contacts?',
    contact: AHMED,
    status: 'closed',
    channel: 'chat',
    priority: 'low',
    assigneeId: 'ag_lena',
    unread: 0,
    starred: false,
    tags: ['how-to'],
    messages: [
      message(
        'customer',
        AHMED,
        '2026-09-16T09:00:00Z',
        'Is there a way to import about 3,000 contacts from a spreadsheet?',
      ),
      message(
        'agent',
        LENA,
        '2026-09-16T09:06:00Z',
        'Yes — open Contacts, choose Import and upload a CSV or XLSX. Column mapping is suggested automatically. Here is a template with the expected headers.',
        { name: 'contacts-template.xlsx', size: '18 KB', kind: 'spreadsheet' },
      ),
      message(
        'customer',
        AHMED,
        '2026-09-16T09:40:00Z',
        'That worked, all imported. Thanks a lot.',
      ),
    ],
  },
  {
    id: 'cnv_1010',
    subject: 'SSO login loops back to the sign-in page',
    contact: CHLOE,
    status: 'open',
    channel: 'email',
    priority: 'high',
    assigneeId: null,
    unread: 2,
    starred: false,
    tags: ['account', 'security'],
    messages: [
      message(
        'customer',
        CHLOE,
        '2026-09-21T07:58:00Z',
        'Since this morning our Okta SSO redirects back to the sign-in page after authenticating. Affects the whole company (about 60 users).',
      ),
      message(
        'customer',
        CHLOE,
        '2026-09-21T08:31:00Z',
        'Update: it works in an incognito window, so it might be a cookie issue on your side?',
      ),
    ],
  },
  {
    id: 'cnv_1011',
    subject: 'Renewal quote for 2027',
    contact: DANIEL,
    status: 'pending',
    channel: 'email',
    priority: 'medium',
    assigneeId: 'ag_marcus',
    unread: 0,
    starred: true,
    tags: ['sales', 'enterprise'],
    messages: [
      message(
        'customer',
        DANIEL,
        '2026-09-15T05:30:00Z',
        'Our contract renews in January. Could you prepare a quote for 120 seats with the analytics add-on?',
      ),
      message(
        'agent',
        MARCUS,
        '2026-09-15T09:12:00Z',
        'Certainly Daniel. Quote attached; it includes the multi-year discount we discussed. Let me know if you would like a call to walk through it.',
        { name: 'renewal-quote-2027.pdf', size: '246 KB', kind: 'pdf' },
      ),
    ],
  },
  {
    id: 'cnv_1012',
    subject: 'Student accounts show as inactive',
    contact: ISABELLA,
    status: 'open',
    channel: 'chat',
    priority: 'medium',
    assigneeId: 'ag_priya',
    unread: 0,
    starred: false,
    tags: ['account', 'education'],
    messages: [
      message(
        'customer',
        ISABELLA,
        '2026-09-20T18:20:00Z',
        'About 40 student accounts were switched to inactive overnight. We did not change anything. Is there an automatic clean-up we should know about?',
      ),
      message(
        'agent',
        CURRENT_AGENT,
        '2026-09-20T18:45:00Z',
        'Hi Isabella — there is an inactivity policy that can be enabled per workspace. Let me check whether it was turned on for yours and reactivate the affected accounts.',
      ),
    ],
  },
];

export function lastMessage(conversation: Conversation): InboxMessage {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last) {
    throw new Error(`Conversation ${conversation.id} has no messages.`);
  }
  return last;
}

export function conversationsByStatus(
  conversations: readonly Conversation[],
): Record<ConversationStatus, number> {
  const counts: Record<ConversationStatus, number> = {
    open: 0,
    pending: 0,
    closed: 0,
  };
  for (const conversation of conversations) counts[conversation.status] += 1;
  return counts;
}

export function totalUnread(conversations: readonly Conversation[]): number {
  return conversations.reduce(
    (sum, conversation) => sum + conversation.unread,
    0,
  );
}
