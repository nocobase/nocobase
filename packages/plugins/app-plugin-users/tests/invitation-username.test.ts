import { fileURLToPath } from 'node:url';

import {
  Auth,
  createUserAdministrationService,
  type UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createMigrator } from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AcceptInvitationInput } from '../server/routes/schemas.js';
import {
  createUserManagementService,
  createUserRoleScopeRegistry,
} from '../server/services/users.js';
import type { UserManagementService } from '../server/tokens.js';

describe('invitation usernames with real account creation', () => {
  let fixture: TestDatabase;
  let auth: Auth;
  let users: UserAdministrationService;
  let invitations: UserManagementService;
  let inviterId: string;

  beforeEach(async () => {
    fixture = await createTestDatabase();
    for (const [packageName, directory] of [
      [
        '@nocobase/app-plugin-authentication',
        '../../app-plugin-authentication/database/migrations',
      ],
      ['@nocobase/app-plugin-users', '../database/migrations'],
    ] as const)
      await createMigrator({
        database: fixture.database,
        packageName,
        directory: fileURLToPath(new URL(directory, import.meta.url)),
      }).latest();
    auth = new Auth({
      connection: fixture.database.connection(),
      baseURL: 'http://localhost/api/auth',
      secret: 'invitation-test-secret-at-least-32-characters',
      session: { storeSessionInDatabase: true },
    });
    users = createUserAdministrationService({
      auth,
      connection: fixture.database.connection(),
    });
    inviterId = (
      await users.create({
        name: 'Inviter',
        username: 'inviter',
        email: 'inviter@example.test',
        password: 'secret-password',
      })
    ).id;
    invitations = createUserManagementService({
      database: fixture.database,
      users,
      roleScopes: createUserRoleScopeRegistry(),
      site: {
        publicOrigin: 'http://localhost',
        publicBasePath: '',
        appTitle: 'Test',
      },
    });
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  async function invite(email = 'recipient@example.test'): Promise<string> {
    const [result] = await invitations.invite({
      emails: [email],
      invitedBy: inviterId,
    });
    if (result.outcome !== 'invited' || !result.inviteUrl)
      throw new Error('Expected invitation');
    return result.inviteUrl.split('/').at(-1)!;
  }

  it.each([undefined, '  Nia.Admin  '])(
    'creates an account with optional username %s and supports sign-in',
    async (username) => {
      const token = await invite();
      const result = await invitations.acceptInvitation({
        token,
        name: 'Nia',
        password: 'secret-password',
        username,
      });
      const account = await users.get(result.userId);
      expect(account?.email).toBe('recipient@example.test');
      expect(account?.username).toBe(username ? 'nia.admin' : undefined);
      const response = await auth.handler(
        new Request(
          `http://localhost/api/auth/sign-in/${username ? 'username' : 'email'}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              ...(username
                ? { username: 'nia.admin' }
                : { email: result.email }),
              password: 'secret-password',
            }),
          },
        ),
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        user: { id: result.userId },
      });
    },
  );

  it.each([' INVITER ', ' INVITER@EXAMPLE.TEST '])(
    'rejects username/email collision %s without consuming the link',
    async (username) => {
      const token = await invite();
      await expect(
        invitations.acceptInvitation({
          token,
          name: 'Nia',
          password: 'secret-password',
          username,
        }),
      ).rejects.toMatchObject({ code: 'USER_IDENTITY_CONFLICT' });
      expect(await invitations.lookupInvitation(token)).toMatchObject({
        email: 'recipient@example.test',
      });
      expect((await users.list()).total).toBe(1);
      const result = await invitations.acceptInvitation({
        token,
        name: 'Nia',
        password: 'secret-password',
        username: 'available',
      });
      expect(await users.get(result.userId)).toMatchObject({
        username: 'available',
      });
    },
  );

  it('ignores supplied account details for an authenticated existing account', async () => {
    const token = await invite();
    const existing = await users.create({
      name: 'Original',
      username: 'original',
      email: 'recipient@example.test',
      password: 'original-password',
    });
    await invitations.acceptInvitation(
      {
        token,
        name: 'Changed',
        username: 'inviter',
        password: 'changed-password',
      },
      existing.id,
    );
    expect(await users.get(existing.id)).toMatchObject({
      name: 'Original',
      username: 'original',
    });
    const response = await auth.handler(
      new Request('http://localhost/api/auth/sign-in/username', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: 'original',
          password: 'original-password',
        }),
      }),
    );
    expect(response.status).toBe(200);
  });

  it('normalizes administrator-created and edited usernames like invitation usernames', async () => {
    const created = await invitations.create({
      name: 'Managed',
      email: 'managed@example.test',
      username: '  Managed.User  ',
      password: 'secret-password',
    });
    expect(created.username).toBe('managed.user');
    expect((await users.get(created.id))?.username).toBe('managed.user');
    await invitations.update(created.id, { username: '  Renamed.User  ' });
    expect((await users.get(created.id))?.username).toBe('renamed.user');
  });

  it('uses the create-user optional nonempty username schema', () => {
    const input = { token: 'token', name: 'Nia', password: 'secret-password' };
    expect(AcceptInvitationInput.parse(input)).toEqual(input);
    expect(
      AcceptInvitationInput.parse({ ...input, username: ' Nia ' }).username,
    ).toBe('Nia');
    for (const username of ['', '   ', null, 12])
      expect(
        AcceptInvitationInput.safeParse({ ...input, username }).success,
      ).toBe(false);
  });
});
