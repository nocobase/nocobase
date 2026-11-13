import { createServer, type Socket } from 'node:net';
import { ImapFlow } from 'imapflow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ImapCommandMetrics,
  observeImapCommands,
} from '../../../../server/adapters/imap-smtp/command-metrics.js';

afterEach(() => vi.restoreAllMocks());

describe('IMAP protocol command metrics', () => {
  it('counts command categories, failures and controlled durations without retaining arguments', async () => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const client = {
      exec: vi.fn(async (command: string) => {
        now += 25;
        if (command === 'UID SEARCH') throw new Error('Search failed');
        return { next() {} };
      }),
    };
    const metrics = new ImapCommandMetrics();
    const stop = observeImapCommands(
      client as unknown as ImapFlow,
      metrics.record,
    )!;
    const atom = (value: string) => ({ type: 'ATOM', value });
    await client.exec('LIST');
    for (const query of [
      [atom('BODYSTRUCTURE')],
      [
        {
          ...atom('BODY.PEEK'),
          section: [atom('HEADER.FIELDS'), [atom('MESSAGE-ID')]],
        },
      ],
      [atom('BODY.PEEK')],
      [atom('FLAGS')],
    ]) {
      // Neither query literals nor responses belong in a metric snapshot.
      await (client.exec as (...args: unknown[]) => unknown)('UID FETCH', [
        { type: 'SEQUENCE', value: 'private-message-id' },
        query,
        { type: 'LITERAL', value: Buffer.from('private-body') },
      ]);
    }
    await expect(client.exec('UID SEARCH')).rejects.toThrow('Search failed');
    const snapshot = metrics.snapshot();
    expect(snapshot.total).toBe(6);
    expect(snapshot.byCommand.FETCH).toEqual({
      count: 4,
      durationMs: 100,
      maxDurationMs: 25,
    });
    expect(snapshot.byCommand.SEARCH?.count).toBe(1);
    expect(
      Object.fromEntries(
        Object.entries(snapshot.byFetchKind).map(([name, value]) => [
          name,
          value.count,
        ]),
      ),
    ).toEqual({ metadata: 1, lightweight: 1, bodyOrSource: 1, flags: 1 });
    expect(JSON.stringify(snapshot)).not.toMatch(
      /private-message-id|private-body/,
    );
    stop();
    const next = new ImapCommandMetrics();
    const stopNext = observeImapCommands(
      client as unknown as ImapFlow,
      next.record,
    )!;
    await client.exec('STATUS');
    stopNext();
    expect(metrics.snapshot().total).toBe(6);
    expect(next.snapshot().total).toBe(1);
  });

  it('counts native SDK wire dispatch including implicitly issued commands', async () => {
    const sockets = new Set<Socket>();
    const wireCommands: string[] = [];
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.write('* OK [CAPABILITY IMAP4rev1] Test server\r\n');
      let pending = '';
      socket.on('data', (chunk) => {
        pending += chunk.toString();
        for (let end; (end = pending.indexOf('\r\n')) >= 0;) {
          const line = pending.slice(0, end);
          pending = pending.slice(end + 2);
          const [tag, ...parts] = line.split(' ');
          const command = parts.join(' ').toUpperCase();
          wireCommands.push(
            parts[0].toUpperCase() === 'UID'
              ? parts[1].toUpperCase()
              : parts[0].toUpperCase(),
          );
          if (command.startsWith('CAPABILITY'))
            socket.write('* CAPABILITY IMAP4rev1\r\n');
          if (command.startsWith('LIST'))
            socket.write('* LIST () "/" "INBOX"\r\n');
          if (/^(SELECT|EXAMINE) /.test(command))
            socket.write(
              '* FLAGS (\\Seen)\r\n* OK [UIDVALIDITY 1] Validity\r\n* OK [UIDNEXT 2] Next\r\n* 1 EXISTS\r\n',
            );
          if (command.startsWith('UID SEARCH')) socket.write('* SEARCH 1\r\n');
          if (command.startsWith('UID FETCH'))
            socket.write('* 1 FETCH (UID 1 FLAGS ())\r\n');
          if (command.startsWith('STATUS'))
            socket.write('* STATUS "INBOX" (UIDNEXT 2)\r\n');
          if (command.startsWith('LOGOUT')) {
            socket.end(`* BYE Bye\r\n${tag} OK Done\r\n`);
            return;
          }
          socket.write(`${tag} OK Done\r\n`);
        }
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error('No test server port');
    const client = new ImapFlow({
      host: '127.0.0.1',
      port: address.port,
      secure: false,
      auth: { user: 'synthetic', pass: 'synthetic' },
      logger: false,
      disableAutoIdle: true,
    });
    let stop: (() => void) | undefined;
    try {
      await client.connect();
      wireCommands.length = 0;
      const metrics = new ImapCommandMetrics();
      stop = observeImapCommands(client, metrics.record);
      await client.list();
      await client.mailboxOpen('INBOX', { readOnly: true });
      await client.mailboxOpen('INBOX', { readOnly: true }); // Include any SDK-generated wire commands.
      await client.search({ all: true }, { uid: true });
      await client.fetchAll('1', { uid: true, flags: true }, { uid: true });
      await client.status('INBOX', { uidNext: true });
      expect(metrics.snapshot()).toMatchObject({
        total: wireCommands.length,
        byCommand: {
          LIST: { count: 1 },
          EXAMINE: {
            count: wireCommands.filter((name) => name === 'EXAMINE').length,
          },
          SEARCH: { count: 1 },
          FETCH: { count: 1 },
          STATUS: { count: 1 },
        },
        byFetchKind: { flags: { count: 1 } },
      });
    } finally {
      stop?.();
      client.close();
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
