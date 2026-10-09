import type {
  MailAddress,
  MailProviderSendInput,
  NormalizedMailMessage,
} from '@nocobase/app-plugin-mail/server';

export const DEMO_MAIL_INBOX_ID: string = 'demo-inbox';
export const DEMO_MAIL_SENT_ID: string = 'demo-sent';

const DEMO_ATTACHMENT_ID: string = 'demo-project-brief';
const DEMO_ATTACHMENT_CONTENT: string =
  'NocoBase Mail demo attachment\nSynthetic content for local testing only.\n';

export interface DemoMailOutboxEntry {
  readonly providerMessageId: string;
  readonly trackingId: string;
  readonly to: readonly MailAddress[];
  readonly cc: readonly MailAddress[];
  readonly bcc: readonly MailAddress[];
  readonly subject: string;
  readonly text: string;
  readonly acceptedAt: string;
}

interface DemoMailbox {
  readonly messages: Map<string, NormalizedMailMessage>;
  readonly outbox: DemoMailOutboxEntry[];
  nextSentMessage: number;
}

export class DemoMailboxes {
  private readonly mailboxes: Map<string, DemoMailbox> = new Map();

  public constructor(private readonly now: () => Date = () => new Date()) {}

  public ensureAccount(address: string): void {
    const key = normalizeAddress(address);
    if (!this.mailboxes.has(key)) {
      this.mailboxes.set(key, createDemoMailbox(key, this.now()));
    }
  }

  public listMessages(address: string): readonly NormalizedMailMessage[] {
    return [...this.mailbox(address).messages.values()];
  }

  public findMessage(
    address: string,
    providerMessageId: string,
  ): NormalizedMailMessage | undefined {
    return this.mailbox(address).messages.get(providerMessageId);
  }

  public readAttachment(
    address: string,
    providerMessageId: string,
    providerAttachmentId: string,
  ): Uint8Array | undefined {
    const message = this.findMessage(address, providerMessageId);
    const attachment = message?.attachments.find(
      (item) => item.providerAttachmentId === providerAttachmentId,
    );
    if (!attachment || attachment.providerAttachmentId !== DEMO_ATTACHMENT_ID) {
      return undefined;
    }
    return new TextEncoder().encode(DEMO_ATTACHMENT_CONTENT);
  }

  public setRead(
    address: string,
    providerMessageId: string,
    read: boolean,
  ): boolean {
    return this.updateMessage(address, providerMessageId, { read });
  }

  public setStarred(
    address: string,
    providerMessageId: string,
    starred: boolean,
  ): boolean {
    return this.updateMessage(address, providerMessageId, { starred });
  }

  public recordSent(
    address: string,
    input: MailProviderSendInput,
  ): DemoMailOutboxEntry {
    const mailbox = this.mailbox(address);
    const existing = mailbox.outbox.find(
      (entry) => entry.trackingId === input.trackingId,
    );
    if (existing) return existing;

    const providerMessageId =
      'demo-sent-' + String(mailbox.nextSentMessage).padStart(3, '0');
    mailbox.nextSentMessage += 1;
    const entry: DemoMailOutboxEntry = {
      providerMessageId,
      trackingId: input.trackingId,
      to: input.message.to.map(copyAddress),
      cc: input.message.cc.map(copyAddress),
      bcc: input.message.bcc.map(copyAddress),
      subject: input.message.subject,
      text: input.message.text,
      acceptedAt: this.now().toISOString(),
    };
    mailbox.outbox.push(entry);
    return entry;
  }

  public outboxFor(address: string): readonly DemoMailOutboxEntry[] {
    return this.mailbox(address).outbox.map((entry) => ({
      ...entry,
      to: entry.to.map(copyAddress),
      cc: entry.cc.map(copyAddress),
      bcc: entry.bcc.map(copyAddress),
    }));
  }

  private mailbox(address: string): DemoMailbox {
    this.ensureAccount(address);
    return this.mailboxes.get(normalizeAddress(address))!;
  }

  private updateMessage(
    address: string,
    providerMessageId: string,
    patch: Partial<Pick<NormalizedMailMessage, 'read' | 'starred'>>,
  ): boolean {
    const mailbox = this.mailbox(address);
    const message = mailbox.messages.get(providerMessageId);
    if (!message) return false;
    mailbox.messages.set(providerMessageId, { ...message, ...patch });
    return true;
  }
}

function createDemoMailbox(address: string, now: Date): DemoMailbox {
  const messages = createFixtureMessages(address, now);
  return {
    messages: new Map(
      messages.map((message) => [message.providerMessageId, message]),
    ),
    outbox: [],
    nextSentMessage: 1,
  };
}

function createFixtureMessages(
  address: string,
  now: Date,
): readonly NormalizedMailMessage[] {
  const hoursAgo = (hours: number): string =>
    new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  return [
    {
      providerMessageId: 'demo-welcome',
      internetMessageId: '<demo-welcome@example.test>',
      providerConversationId: 'demo-conversation-welcome',
      providerFolderIds: [DEMO_MAIL_INBOX_ID],
      from: { address: 'hello@example.test', name: 'NocoBase Demo' },
      to: [{ address }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Welcome to the demo mailbox',
      preview: 'This mailbox contains synthetic messages for trying Mail.',
      text: 'Welcome. These messages are synthetic and stay in this local demo application.',
      html: '<p>Welcome. These messages are synthetic and stay in this local demo application.</p>',
      receivedAt: hoursAgo(1),
      read: false,
      starred: false,
      draft: false,
      attachments: [],
    },
    {
      providerMessageId: 'demo-project-update',
      internetMessageId: '<demo-project-update@example.test>',
      providerConversationId: 'demo-conversation-project',
      providerFolderIds: [DEMO_MAIL_INBOX_ID],
      from: { address: 'alex@example.test', name: 'Alex Example' },
      to: [{ address }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Project update and brief',
      preview: 'The sample project brief is attached.',
      text: 'Here is the project update. The attached brief is a synthetic text file.',
      receivedAt: hoursAgo(8),
      read: true,
      starred: true,
      draft: false,
      attachments: [
        {
          providerAttachmentId: DEMO_ATTACHMENT_ID,
          fileName: 'project-brief.txt',
          contentType: 'text/plain',
          size: new TextEncoder().encode(DEMO_ATTACHMENT_CONTENT).byteLength,
          inline: false,
        },
      ],
    },
    {
      providerMessageId: 'demo-meeting-invite',
      internetMessageId: '<demo-meeting-invite@example.test>',
      providerConversationId: 'demo-conversation-meeting',
      providerFolderIds: [DEMO_MAIL_INBOX_ID],
      from: { address: 'jordan@example.test', name: 'Jordan Example' },
      to: [{ address }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Planning session: Mail examples',
      preview: 'A sample invitation for the next product planning session.',
      text: 'Let us review the inbox, reply, and delivery log examples together.',
      receivedAt: hoursAgo(18),
      read: false,
      starred: false,
      draft: false,
      attachments: [],
    },
    {
      providerMessageId: 'demo-release-notes',
      internetMessageId: '<demo-release-notes@example.test>',
      providerConversationId: 'demo-conversation-release',
      providerFolderIds: [DEMO_MAIL_INBOX_ID],
      from: { address: 'updates@example.test', name: 'Product Updates' },
      to: [{ address }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'What is new in the Mail demo',
      preview:
        'Try search, stars, attachments, replies, and simulated delivery.',
      text: 'The demo mailbox is local-only. Messages and accounts are synthetic; sending never contacts an external mail service.',
      receivedAt: hoursAgo(36),
      read: true,
      starred: false,
      draft: false,
      attachments: [],
    },
    {
      providerMessageId: 'demo-sent-welcome',
      internetMessageId: '<demo-sent-welcome@example.test>',
      providerConversationId: 'demo-conversation-sent',
      providerFolderIds: [DEMO_MAIL_SENT_ID],
      from: { address, name: 'Demo Mailbox' },
      to: [{ address: 'team@example.test', name: 'Demo Team' }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'A sample sent message',
      preview: 'This message shows the local Sent folder.',
      text: 'This synthetic message demonstrates the Sent folder.',
      sentAt: hoursAgo(2),
      read: true,
      starred: false,
      draft: false,
      attachments: [],
    },
    {
      providerMessageId: 'demo-sent-follow-up',
      internetMessageId: '<demo-sent-follow-up@example.test>',
      providerConversationId: 'demo-conversation-follow-up',
      providerFolderIds: [DEMO_MAIL_SENT_ID],
      from: { address, name: 'Sam Demo' },
      to: [{ address: 'jordan@example.test', name: 'Jordan Example' }],
      cc: [],
      bcc: [],
      replyTo: [],
      references: [],
      subject: 'Re: Planning session: Mail examples',
      preview: 'A second sample in the Sent folder.',
      text: 'Thanks, I will bring the demo inbox and send log.',
      sentAt: hoursAgo(12),
      read: true,
      starred: false,
      draft: false,
      attachments: [],
    },
  ];
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

function copyAddress(address: MailAddress): MailAddress {
  return { ...address };
}
