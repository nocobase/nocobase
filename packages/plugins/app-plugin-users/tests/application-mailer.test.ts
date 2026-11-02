import * as transports from '@nocobase/mailer';
import { createServer } from 'node:http';
import { afterEach, expect, it, vi } from 'vitest';
import { createTestApp } from '@nocobase/app-testing/server';
import { mailSenderFactoryToken } from '@nocobase/app-server/mailers';
import { userManagementServiceToken } from '../server/tokens.js';
import { createStandaloneServer } from './fixtures/mail-app/server/standalone.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('submits and accepts an invitation with the default mailer and no Notification or mailbox plugin', async () => {
  const createTransport = vi.spyOn(transports, 'createMailTransport');
  const requests: { body: { text: string }; key?: string }[] = [];
  const receiver = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({
      body: JSON.parse(Buffer.concat(chunks).toString()),
      key: request.headers['idempotency-key'] as string | undefined,
    });
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ id: 'synthetic-submission' }));
  });
  await new Promise<void>((resolve) =>
    receiver.listen(0, '127.0.0.1', resolve),
  );
  const address = receiver.address();
  if (!address || typeof address === 'string')
    throw new Error('No fixture port.');
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch', (url: string, options: RequestInit) => {
    expect(url).toBe('https://api.resend.com/emails');
    return nativeFetch(`http://127.0.0.1:${address.port}/emails`, options);
  });
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: {
      mailers: {
        default: 'system',
        system: {
          provider: 'resend',
          apiKey: 'synthetic-key',
          from: 'sender@example.test',
        },
      },
    },
  });
  try {
    expect(
      app.application.registeredServerPlugins.map(
        (plugin) => plugin.packageName,
      ),
    ).toEqual([
      '@nocobase/app-plugin-authentication',
      '@nocobase/app-plugin-users',
    ]);
    const signedUp = await app.request('/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Inviter',
        email: 'inviter@example.test',
        password: 'synthetic-password',
      }),
    });
    expect(signedUp.status).toBe(200);
    const { user } = (await signedUp.json()) as { user: { id: string } };
    const users = app.application.container.resolve(userManagementServiceToken);
    const [invitation] = await users.invite({
      emails: ['invitee@example.test'],
      invitedBy: user.id,
    });
    expect(invitation.emailSent).toBe(true);
    expect(requests).toHaveLength(1);
    const token = requests[0].body.text.match(/\/main\/invite\/([\w-]+)/u)?.[1];
    expect(token).toBeTruthy();
    const accepted = await users.acceptInvitation({
      token: token!,
      name: 'Invitee',
      password: 'synthetic-invitee-password',
    });
    expect(accepted.email).toBe('invitee@example.test');
    await expect(
      users.acceptInvitation({
        token: token!,
        name: 'Again',
        password: 'synthetic-invitee-password',
      }),
    ).rejects.toThrow();
    const reset = await app.request('/auth/request-password-reset', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({
        email: 'inviter@example.test',
        redirectTo: 'http://localhost/main/reset-password',
      }),
    });
    expect(reset.status).toBe(200);
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    expect(requests[1].body.text).toContain('/api/auth/reset-password/');
    // Another consumer creates its own sender from the same factory; it shares configuration, not transports.
    const sender = app.application.container
      .resolve(mailSenderFactoryToken)
      .create();
    expect(
      await sender.send({
        to: 'other@example.test',
        subject: 'Notice',
        text: 'Synthetic',
      }),
    ).toMatchObject({ status: 'accepted' });
    await sender.close();
    expect(requests).toHaveLength(3);
    // Users and Auth each allocated one transport for their own sender, plus the extra consumer.
    expect(createTransport).toHaveBeenCalledTimes(3);
  } finally {
    await app.close();
    await new Promise<void>((resolve) => receiver.close(() => resolve()));
  }
});
