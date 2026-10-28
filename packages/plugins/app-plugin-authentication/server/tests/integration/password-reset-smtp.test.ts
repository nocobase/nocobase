// @vitest-environment node

import { createServer, type Socket } from 'node:net';
import { expect, it, vi } from 'vitest';
import { createTestApp } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../fixtures/reset-app/server/standalone.js';
import { authenticationToken } from '../../tokens.js';

async function receiver(stall = false) {
  const sockets = new Set<Socket>();
  const messages: string[] = [];
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.write('220 local.test ESMTP\r\n');
    let input = '';
    let data = false;
    let message = '';
    socket.on('data', (chunk) => {
      input += chunk.toString();
      while (input.includes('\r\n')) {
        const end = input.indexOf('\r\n');
        const line = input.slice(0, end);
        input = input.slice(end + 2);
        if (data && line !== '.') {
          message += `${line}\r\n`;
          continue;
        }
        if (data) {
          data = false;
          messages.push(message);
          if (!stall) socket.write('250 queued\r\n');
        } else if (line.startsWith('EHLO'))
          socket.write('250-local.test\r\n250 PIPELINING\r\n');
        else if (line === 'DATA') {
          data = true;
          message = '';
          socket.write('354 send data\r\n');
        } else if (line === 'QUIT') socket.end('221 bye\r\n');
        else socket.write('250 ok\r\n');
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No SMTP port.');
  const close = async (): Promise<void> => {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
  return { port: address.port, messages, sockets, close };
}

it.each([
  ['http://localhost', false],
  ['https://public.example.test', false],
  ['https://public.example.test', true],
] as const)(
  'resets through real SMTP without notification or authorization using public origin %s (independent %s)',
  async (publicOrigin, independent) => {
    const json = (body: unknown) => ({
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: publicOrigin },
      body: JSON.stringify(body),
    });
    const smtp = await receiver();
    const app = await createTestApp({
      createServer: createStandaloneServer,
      config: {
        app: { publicOrigin },
        ...(independent
          ? {
              auth: {
                email: {
                  provider: 'smtp',
                  host: '127.0.0.1',
                  port: smtp.port,
                  from: 'sender@example.test',
                },
              },
            }
          : {
              notification: {
                channels: {
                  'system-email': {
                    provider: 'smtp',
                    host: '127.0.0.1',
                    port: smtp.port,
                    from: 'sender@example.test',
                  },
                },
              },
            }),
      },
    });
    try {
      const capabilities = await app.request('/authentication/capabilities');
      expect(await capabilities.json()).toEqual({
        data: { passwordResetAvailable: true },
      });
      const signedUp = await app.request(
        '/auth/sign-up/email',
        json({
          email: 'synthetic@example.test',
          username: 'synthetic',
          name: 'Synthetic',
          password: 'original-password',
        }),
      );
      expect(signedUp.status).toBe(200);
      const cookie = signedUp.headers.get('set-cookie')!;
      const response = await app.request(
        '/auth/request-password-reset',
        json({
          email: 'synthetic@example.test',
          redirectTo: `${publicOrigin}/main/reset-password`,
        }),
      );
      expect(response.status).toBe(200);
      await vi.waitFor(() => expect(smtp.messages).toHaveLength(1));
      const decoded = smtp.messages[0]!.replace(/=\r\n/gu, '').replace(
        /=([0-9A-F]{2})/gu,
        (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)),
      );
      const token = decoded.match(
        /\/main\/api\/auth\/reset-password\/([A-Za-z0-9_-]+)/u,
      )?.[1];
      expect(token).toBeTruthy();
      const link = await app.request(
        `/auth/reset-password/${token}?callbackURL=${encodeURIComponent(`${publicOrigin}/main/reset-password`)}`,
      );
      expect(link.status).toBe(302);
      expect(link.headers.get('location')).toBe(
        `${publicOrigin}/main/reset-password?token=${token}`,
      );
      const reset = await app.request(
        '/auth/reset-password',
        json({ token, newPassword: 'replacement-password' }),
      );
      expect(reset.status).toBe(200);
      const duplicate = await app.request(
        '/auth/reset-password',
        json({ token, newPassword: 'another-password' }),
      );
      expect(duplicate.status).toBe(400);
      expect(
        (
          await app.request(
            '/auth/sign-in/email',
            json({
              email: 'synthetic@example.test',
              password: 'original-password',
            }),
          )
        ).status,
      ).toBe(401);
      expect(
        (
          await app.request(
            '/auth/sign-in/email',
            json({
              email: 'synthetic@example.test',
              password: 'replacement-password',
            }),
          )
        ).status,
      ).toBe(200);
      const auth = app.application.container.resolve(authenticationToken);
      expect(await auth.getSession(new Headers({ cookie }))).toBeNull();
      expect(
        await app.connection.collections.get('notifications'),
      ).toBeUndefined();
    } finally {
      await app.close();
      await smtp.close();
    }
  },
);
