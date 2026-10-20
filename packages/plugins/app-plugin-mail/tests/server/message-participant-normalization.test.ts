import { describe, expect, it } from 'vitest';
import { collectMessageParticipants } from '../../server/store/message-participants.js';
import { normalizeMailParticipantAddress } from '../../shared/participant.js';

const source = { id: 'message', accountId: 'account' };

describe('persisted Mail participant collection', () => {
  it.each([false, true])(
    'accepts object or JSON-string storage (%s)',
    (serialized) => {
      const sender = { address: ' Sender@Example.COM ', name: 'Not indexed' };
      const recipients = {
        to: [
          { address: 'Target+tag@Example.com' },
          { address: ' target+TAG@example.com ' },
        ],
        cc: [{ address: 'TARGET+tag@example.com' }],
        bcc: [{ address: 'hidden@example.com' }],
        replyTo: [{ address: 'reply@example.com' }],
      };
      const collected = collectMessageParticipants({
        ...source,
        sender: serialized ? JSON.stringify(sender) : sender,
        recipients: serialized ? JSON.stringify(recipients) : recipients,
      });
      expect(collected).toEqual({
        malformedValues: 0,
        invalidAddresses: 0,
        rows: [
          {
            messageId: 'message',
            accountId: 'account',
            role: 'from',
            address: 'sender@example.com',
            domain: 'example.com',
          },
          {
            messageId: 'message',
            accountId: 'account',
            role: 'to',
            address: 'target+tag@example.com',
            domain: 'example.com',
          },
          {
            messageId: 'message',
            accountId: 'account',
            role: 'cc',
            address: 'target+tag@example.com',
            domain: 'example.com',
          },
        ],
      });
    },
  );

  it('counts malformed containers and invalid addresses without rejecting other roles', () => {
    expect(
      collectMessageParticipants({
        ...source,
        sender: '{secret',
        recipients: {
          to: 'secret',
          cc: [
            null,
            42,
            {},
            { address: 'bad@@example.com' },
            { address: 'good@example.com' },
          ],
        },
      }),
    ).toEqual({
      malformedValues: 2,
      invalidAddresses: 4,
      rows: [
        {
          messageId: 'message',
          accountId: 'account',
          role: 'cc',
          address: 'good@example.com',
          domain: 'example.com',
        },
      ],
    });
    expect(
      collectMessageParticipants({ ...source, sender: [], recipients: '{' }),
    ).toMatchObject({ malformedValues: 2, rows: [] });
    expect(
      collectMessageParticipants({ ...source, sender: null, recipients: '{}' }),
    ).toEqual({ malformedValues: 0, invalidAddresses: 0, rows: [] });
  });

  it.each([
    undefined,
    null,
    123,
    '',
    'a@@example.com',
    'Alice <a@example.com>',
    'a..b@example.com',
    '.a@example.com',
    'a@example',
    'a@-example.com',
    'a@example.com.',
    'a@例子.com',
    'K@example.com',
    `${'a'.repeat(65)}@example.com`,
    `a@${'b'.repeat(64)}.com`,
    '"a"@example.com',
  ])(
    'skips invalid mailbox %s rather than truncating or parsing it',
    (address) => {
      expect(normalizeMailParticipantAddress(address)).toBeUndefined();
      expect(
        collectMessageParticipants({
          ...source,
          sender: { address },
          recipients: {},
        }),
      ).toMatchObject({ invalidAddresses: 1, rows: [] });
    },
  );

  it('retains exact domain and plus aliases after trim/lowercase normalization', () => {
    expect(
      normalizeMailParticipantAddress(' Alice+TAG@Sub.Example.COM '),
    ).toEqual({
      address: 'alice+tag@sub.example.com',
      domain: 'sub.example.com',
    });
  });
});
