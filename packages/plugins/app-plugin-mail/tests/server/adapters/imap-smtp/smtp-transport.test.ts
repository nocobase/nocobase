import { createServer, type Server, type Socket } from 'node:net';
import { simpleParser } from 'mailparser';
import { afterEach, describe, expect, it } from 'vitest';
import { ImapSmtpAdapter } from '../../../../server/adapters/imap-smtp/adapter.js';
import type {
  MailProviderContext,
  MailProviderSendInput,
} from '../../../../server/types.js';

describe('SMTP adapter over a real local TCP connection', () => {
  let server: Server | undefined;
  let adapter: ImapSmtpAdapter | undefined;
  const sockets = new Set<Socket>();
  const commands: string[] = [];
  const messages: string[] = [];

  afterEach(async () => {
    await adapter?.close();
    for (const socket of sockets) socket.destroy();
    sockets.clear();
    if (server?.listening)
      await new Promise<void>((resolve, reject) =>
        server!.close((error) => (error ? reject(error) : resolve())),
      );
    commands.length = 0;
    messages.length = 0;
  });

  async function start(
    recipientCode: number | ((command: string) => number) = 250,
  ): Promise<ImapSmtpAdapter> {
    server = createServer((socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.on('error', () => undefined);
      socket.setEncoding('utf8');
      socket.write('220 localhost Test SMTP\r\n');
      let buffer = '';
      let data: string[] | undefined;
      socket.on('data', (chunk: string) => {
        buffer += chunk;
        let end: number;
        while ((end = buffer.indexOf('\r\n')) !== -1) {
          const line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (data) {
            if (line === '.') {
              messages.push(data.join('\r\n'));
              data = undefined;
              socket.write('250 2.0.0 queued\r\n');
            } else data.push(line.replace(/^\.\./u, '.'));
            continue;
          }
          commands.push(line);
          if (/^(EHLO|HELO) /u.test(line))
            socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
          else if (line.startsWith('AUTH PLAIN'))
            socket.write('235 2.7.0 authenticated\r\n');
          else if (line.startsWith('MAIL FROM:'))
            socket.write('250 2.1.0 sender accepted\r\n');
          else if (line.startsWith('RCPT TO:'))
            socket.write(
              `${typeof recipientCode === 'function' ? recipientCode(line) : recipientCode} recipient response\r\n`,
            );
          else if (line === 'DATA') {
            data = [];
            socket.write('354 End with dot\r\n');
          } else if (line === 'QUIT') socket.end('221 Goodbye\r\n');
          else socket.write('250 OK\r\n');
        }
      });
    });
    await new Promise<void>((resolve, reject) => {
      server!.once('error', reject);
      server!.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('Expected TCP address');
    // The adapter does not use context; credential loading is covered through the resolver.
    adapter = new ImapSmtpAdapter(
      {} as MailProviderContext,
      {
        type: 'imap-smtp',
        name: 'local',
        imap: { host: '127.0.0.1', port: 993, secure: true },
        smtp: { host: '127.0.0.1', port: address.port, secure: false },
      },
      {
        id: 'account',
        userId: 'alice',
        provider: { type: 'imap-smtp', name: 'local' },
        address: 'alice@example.com',
        credentialReference: 'fixture',
        scopes: [],
        status: 'active',
      },
      { username: 'alice', password: 'test-only' },
    );
    return adapter;
  }

  it('submits real MIME with hidden Bcc recipients, reply headers and attachment bytes', async () => {
    const transport = await start();
    const result = await transport.sendMessage(input());
    expect(result).toMatchObject({
      status: 'accepted',
      internetMessageId: '<test-message@example.com>',
    });
    expect(messages).toHaveLength(1);
    expect(commands).toEqual(
      expect.arrayContaining([
        'RCPT TO:<recipient@example.com>',
        'RCPT TO:<hidden@example.com>',
      ]),
    );
    const parsed = await simpleParser(messages[0]);
    expect(parsed.subject).toBe('Protocol test');
    expect(parsed.text?.trim()).toBe('Hello over SMTP');
    expect(parsed.html).toBe('<p>Hello over SMTP</p>');
    expect(parsed.inReplyTo).toBe('<original@example.com>');
    expect(parsed.bcc).toBeUndefined();
    expect(parsed.attachments).toHaveLength(1);
    expect(parsed.attachments[0].filename).toBe('report.txt');
    expect(parsed.attachments[0].content.toString()).toBe('report');
  });

  it('reports partial acceptance over SMTP while keeping rejected Bcc recipients out of MIME', async () => {
    const transport = await start((command) =>
      command.includes('hidden@example.com') ? 550 : 250,
    );
    const result = await transport.sendMessage(input());
    expect(result).toMatchObject({
      status: 'accepted',
      recipientError: {
        code: 'SMTP_RECIPIENTS_REJECTED',
        retryable: false,
        recipients: {
          accepted: ['recipient@example.com'],
          rejected: ['hidden@example.com'],
        },
      },
    });
    expect(messages).toHaveLength(1);
    const parsed = await simpleParser(messages[0]);
    expect(parsed.bcc).toBeUndefined();
  });

  it.each([
    [450, true],
    [550, false],
  ] as const)(
    'handles an actual SMTP %i recipient rejection without submitting DATA',
    async (code, retryable) => {
      const transport = await start(code);
      expect(await transport.sendMessage(input())).toMatchObject({
        status: 'failed',
        error: { category: 'recipient', retryable },
      });
      expect(messages).toEqual([]);
      expect(commands).not.toContain('DATA');
    },
  );
});

function input(): MailProviderSendInput {
  return {
    trackingId: 'protocol-test',
    identity: {
      id: 'identity',
      accountId: 'account',
      address: 'alice@example.com',
      isPrimary: true,
      canSend: true,
    },
    message: {
      to: [{ address: 'recipient@example.com' }],
      cc: [],
      bcc: [{ address: 'hidden@example.com' }],
      subject: 'Protocol test',
      text: 'Hello over SMTP',
      html: '<p>Hello over SMTP</p>',
      internetMessageId: '<test-message@example.com>',
      inReplyTo: '<original@example.com>',
      references: ['<original@example.com>'],
      attachments: [
        {
          fileName: 'report.txt',
          inline: false,
          contentType: 'text/plain',
          size: 6,
          open: async () => new Blob(['report']).stream(),
        },
      ],
    },
  };
}
