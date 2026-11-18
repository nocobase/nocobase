import { describe, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import {
  formatMailboxList,
  mailboxError,
  parseMailboxList,
} from '../../shared/addresses.js';
import { SendMailOperation } from '../../server/operations/send-mail.js';
import { MailSubmissionsService } from '../../server/services/submissions.js';
import {
  SendMessageInput,
  SendBulkInput,
  SaveDraftInput,
} from '../../server/routes/schemas.js';
import type { MailStore, MailComposeInput } from '../../server/types.js';
import {
  buildDraftComposerInput,
  EMPTY_COMPOSER,
} from '../../client/lib/mail-composer-state.js';

const input: MailComposeInput = {
  accountId: 'account',
  identityId: 'identity',
  idempotencyKey: 'key',
  to: [{ address: 'reader@example.com' }],
  text: 'Body',
};

describe('recipient parsing and sending boundary', () => {
  it('only replays an invalid legacy batch after checking every existing terminal child', async () => {
    const replayTerminalSubmission = vi.fn(
      async (_context, child: MailComposeInput) => ({
        id: child.idempotencyKey,
        accountId: child.accountId,
        status: 'accepted' as const,
      }),
    );
    const execute = vi.fn();
    const store = {
      getSubmissionByIdempotencyKey: vi.fn(async () => ({
        id: 'old',
        scheduledAt: '2099-01-01T00:00:00Z',
      })),
      getScheduledSubmission: vi.fn(async () => undefined),
    };
    const service = new MailSubmissionsService(
      { store } as never,
      { execute, replayTerminalSubmission } as unknown as SendMailOperation,
    );
    await expect(
      service.sendBulk(
        { actorId: 'user' },
        {
          ...input,
          recipients: [
            { address: 'good@example.com' },
            { address: 'Old Name <old@example.com>' },
          ],
        },
      ),
    ).resolves.toHaveLength(2);
    expect(replayTerminalSubmission).toHaveBeenCalledTimes(2);
    expect(execute).not.toHaveBeenCalled();
    replayTerminalSubmission.mockRejectedValueOnce(
      new Error('Idempotency conflict'),
    );
    await expect(
      service.sendBulk(
        { actorId: 'user' },
        { ...input, recipients: [{ address: 'bad' }] },
      ),
    ).rejects.toThrow('Idempotency conflict');
    expect(execute).not.toHaveBeenCalled();
  });
  it.each(['accepted', 'unknown', 'failed'] as const)(
    'never replays a terminal %s persisted delivery even when its input is invalid',
    async (status) => {
      const existing = { id: 'existing', status, requestFingerprint: 'old' };
      const store = {
        getAccount: vi.fn(async () => ({
          id: 'account',
          userId: 'user',
          status: 'active',
        })),
        getSubmissionByIdempotencyKey: vi.fn(async () => existing),
        closeDraft: vi.fn(),
        getScheduledSubmission: vi.fn(),
        recoverExpiredSubmissions: vi.fn(),
      };
      const resolve = vi.fn();
      const operation = new SendMailOperation({
        store: store as unknown as MailStore,
        adapters: { resolve },
      });
      await expect(
        operation.execute(
          { actorId: 'user' },
          { ...input, to: [{ address: 'bad' }] },
          { scheduledDelivery: true },
        ),
      ).resolves.toBe(existing);
      expect(resolve).not.toHaveBeenCalled();
      await expect(
        operation.execute(
          { actorId: 'user' },
          { ...input, to: [{ address: 'bad' }] },
        ),
      ).rejects.toThrow(
        'The idempotency key is already associated with another request.',
      );
      expect(store.recoverExpiredSubmissions).not.toHaveBeenCalled();
    },
  );
  it('parses quoted names, escaping, Unicode and mixed separators without changing local case', () => {
    const parsed = parseMailboxList(
      '周晓 <Some.One+tag@example.com>; "Doe, Jane" <jane@example.com>\n"A \\"friend\\"" <friend@example.com>, bare@example.com',
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.mailboxes).toEqual([
      { name: '周晓', address: 'Some.One+tag@example.com' },
      { name: 'Doe, Jane', address: 'jane@example.com' },
      { name: 'A "friend"', address: 'friend@example.com' },
      { address: 'bare@example.com' },
    ]);
    expect(parseMailboxList(formatMailboxList(parsed.mailboxes))).toEqual(
      parsed,
    );
  });
  it.each([
    'incomplete <',
    '"Doe, Jane',
    'not-an-email',
    'Group: a@example.com;',
  ])('retains invalid text in drafts: %s', (value) => {
    expect(parseMailboxList(value).issues.length).toBeGreaterThan(0);
    const draft = buildDraftComposerInput(
      'account',
      'identity',
      '',
      { ...EMPTY_COMPOSER, to: value },
      [],
      [],
    );
    expect(formatMailboxList(draft.to)).toBe(value);
    expect(
      SaveDraftInput.safeParse(JSON.parse(JSON.stringify(draft))).success,
    ).toBe(true);
  });
  it.each([
    'Case+tag@example.com',
    '"two words"@example.com',
    '"a@b"@example.com',
    '用户@例子.中国',
    'a@localhost',
    'a@[127.0.0.1]',
    'a@[IPv6:2001:db8::1]',
  ])('preserves supported mailbox syntax: %s', (address) => {
    expect(mailboxError(address)).toBeUndefined();
  });
  it.each([
    'a..b@example.com',
    'a..b@[127.0.0.1]',
    'a@-example.com',
    'a@example..com',
    'Name <a@example.com>',
    'a@example.com,b@example.com',
    'g:a@example.com;',
    'a@example.com\r\nBcc:b@example.com',
    `${'a'.repeat(321)}@example.com`,
  ])('rejects invalid structured mailboxes: %s', (address) => {
    expect(mailboxError(address)).toBeDefined();
  });
  it.each(['to', 'cc', 'bcc'] as const)(
    'reports the exact schema field for %s, while drafts stay editable',
    (field) => {
      const invalid = { ...input, [field]: [{ address: 'bad' }] };
      const result = SendMessageInput.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0]?.path).toEqual([field, 0, 'address']);
      expect(SaveDraftInput.safeParse(invalid).success).toBe(true);
      expect(
        SendMessageInput.safeParse({
          ...input,
          [field]: [{ name: '周晓', address: 'someone@example.com' }],
        }).success,
      ).toBe(true);
    },
  );
  it('checks names and all bulk recipients and limits', () => {
    expect(
      SaveDraftInput.safeParse({
        ...input,
        to: [{ address: 'unfinished <\naddress' }],
      }).success,
    ).toBe(true);
    expect(
      SaveDraftInput.safeParse({ ...input, to: [{ address: 'bad\u0000' }] })
        .success,
    ).toBe(false);
    expect(
      SaveDraftInput.safeParse({
        ...input,
        to: [{ address: 'a@example.com', name: 'Bad\nname' }],
      }).success,
    ).toBe(false);
    expect(
      SendMessageInput.safeParse({
        ...input,
        to: [{ address: 'a@example.com', name: 'Bad\nname' }],
      }).success,
    ).toBe(false);
    const result = SendBulkInput.safeParse({
      ...input,
      to: undefined,
      recipients: [{ address: 'a@example.com' }, { address: 'bad' }],
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.error.issues.some(
          (issue) => issue.path.join('.') === 'recipients.1.address',
        ),
      ).toBe(true);
    expect(
      parseMailboxList(
        Array.from({ length: 101 }, () => 'a@example.com').join(','),
      ).issues.length,
    ).toBeGreaterThan(0);
  });
  it.each(['to', 'cc', 'bcc', 'empty'] as const)(
    'rejects new invalid %s before writes, snapshots or adapter resolution',
    async (field) => {
      const store = {
        getAccount: vi.fn(async () => ({
          id: 'account',
          userId: 'user',
          status: 'active',
        })),
        getSubmissionByIdempotencyKey: vi.fn(async () => undefined),
        recoverExpiredSubmissions: vi.fn(),
        createSubmission: vi.fn(),
        claimSubmission: vi.fn(),
        closeDraft: vi.fn(),
        getMessage: vi.fn(),
        extendOutboundAttachmentExpiry: vi.fn(),
      };
      const resolve = vi.fn();
      const operation = new SendMailOperation({
        store: store as unknown as MailStore,
        adapters: { resolve },
      });
      const invalid =
        field === 'empty'
          ? { ...input, to: [] }
          : { ...input, [field]: [{ address: 'bad' }] };
      await expect(
        operation.execute({ actorId: 'user' }, invalid),
      ).rejects.toMatchObject({
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_MAIL_REQUEST',
        field: field === 'empty' ? 'to' : `${field}.0.address`,
      });
      for (const [name, method] of Object.entries(store))
        if (!name.startsWith('getAccount') && !name.startsWith('getSubmission'))
          expect(method).not.toHaveBeenCalled();
      expect(resolve).not.toHaveBeenCalled();
    },
  );
  it.each([1, 2])(
    'preflights bulk before any child at invalid index %s',
    async (index) => {
      const execute = vi.fn();
      const service = new MailSubmissionsService(
        {
          store: {
            getSubmissionByIdempotencyKey: vi.fn(async () => undefined),
          },
        } as never,
        { execute } as unknown as SendMailOperation,
      );
      const recipients = [
        'a@example.com',
        'b@example.com',
        'c@example.com',
      ].map((address, i) => ({ address: i === index ? 'bad' : address }));
      await expect(
        service.sendBulk({ actorId: 'user' }, { ...input, recipients }),
      ).rejects.toMatchObject({ field: `recipients.${index}.address` });
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it('compiles a pure SMTP envelope from parsed display names', async () => {
    const transport = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
    });
    const result = await transport.sendMail({
      from: 'sender@example.com',
      to: parseMailboxList('周晓 <someone@example.com>').mailboxes,
      text: 'Body',
    });
    expect(result.envelope.to).toEqual(['someone@example.com']);
  });
});
