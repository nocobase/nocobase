import { fileURLToPath } from 'node:url';

import type {
  AdministratedUser,
  UserAdministrationService,
} from '@nocobase/app-plugin-authentication';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import {
  createMigrator,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InvitationEmail } from '../server/invitations/mail.js';
import { hashToken } from '../server/invitations/rules.js';
import { createUserPreferencesService } from '../server/preferences/service.js';
import * as invitationStore from '../server/invitations/store.js';
import {
  createUserManagementService,
  createUserRoleScopeRegistry,
} from '../server/services/users.js';
import type {
  UserInvitationAcceptedContext,
  UserManagementService,
  UserRoleValue,
} from '../server/tokens.js';

const ORIGIN = 'https://example.test';

describe('user invitations', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let service: UserManagementService;
  let mail: InvitationEmail[];
  let failMail: boolean;
  let roles: Map<string, UserRoleValue>;
  let accepted: UserInvitationAcceptedContext[];

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    await migratePackage(
      database,
      '@nocobase/app-plugin-authentication',
      '../../app-plugin-authentication/database/migrations',
    );
    await migratePackage(
      database,
      '@nocobase/app-plugin-users',
      '../database/migrations',
    );
    mail = [];
    failMail = false;
    roles = new Map();
    accepted = [];
    const scopes = createUserRoleScopeRegistry();
    scopes.register({
      key: 'app',
      label: 'Roles',
      selection: 'multiple',
      options: () => Promise.resolve([{ value: 'editor', label: 'Editor' }]),
      get: (userId) => Promise.resolve(roles.get(userId) ?? []),
      findUserIds: () => Promise.resolve([]),
      replace: (userId, value) => {
        roles.set(userId, value);
        return Promise.resolve();
      },
    });
    service = createUserManagementService({
      database,
      users: userAdministration(database.connection()),
      roleScopes: scopes,
      mailer: {
        send: (email) => {
          if (failMail) return Promise.reject(new Error('SMTP refused'));
          mail.push(email);
          return Promise.resolve();
        },
      },
      site: { publicOrigin: ORIGIN, publicBasePath: '/main', appTitle: 'Acme' },
    });
    service.onInvitationAccepted((context) => {
      accepted.push(context);
      return Promise.resolve();
    });
    await insertUser('ann', 'Ann');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    await testDatabase.destroy();
  });

  const tokenOf = (email: InvitationEmail) =>
    /\/main\/invite\/([\w-]+)/u.exec(email.text)?.[1] ?? '';
  it('bounds slow batch delivery and omits queued links that were revoked or rotated', async () => {
    const started = Promise.withResolvers<void>();
    let submissions = 0;
    const send = vi.fn((email: InvitationEmail) => {
      submissions += 1;
      if (submissions === 6) started.resolve();
      return email.to === 'batch-0@example.test'
        ? Promise.resolve()
        : new Promise<void>(() => {});
    });
    const batchService = createUserManagementService({
      database,
      users: userAdministration(database.connection()),
      roleScopes: createUserRoleScopeRegistry(),
      mailer: { send },
      site: {
        publicOrigin: ORIGIN,
        publicBasePath: '/main',
        appTitle: 'Acme',
      },
    });
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    const emails = Array.from(
      { length: 50 },
      (_, i) => `batch-${i}@example.test`,
    );
    const pending = batchService.invite({ emails, invitedBy: 'ann' });
    // One completed send frees a slot; the other five stay in flight until the common deadline.
    await started.promise;
    expect(send).toHaveBeenCalledTimes(6);
    const queued = await batchService.listInvitations();
    const revoked = queued.find((row) => row.email === emails[6]);
    const rotated = queued.find((row) => row.email === emails[7]);
    if (!revoked || !rotated) throw new Error('Missing queued invitations');
    await batchService.revokeInvitation(revoked.id);
    await batchService.resendInvitation(rotated.id, { sendEmail: false });
    await vi.advanceTimersByTimeAsync(30_000);
    const results = await pending;
    expect(results.map((result) => result.email)).toEqual(emails);
    expect(results[0]).toMatchObject({ emailSent: true });
    expect(results.slice(1)).toEqual(
      emails.slice(1).map((email) =>
        email === emails[6] || email === emails[7]
          ? {
              email,
              outcome: 'invited',
              invitationId: expect.any(String),
              emailSent: false,
            }
          : expect.objectContaining({
              email,
              emailSent: false,
              inviteUrl: expect.stringContaining('/invite/'),
            }),
      ),
    );
    expect(send).toHaveBeenCalledTimes(6);
    const rows = await batchService.listInvitations();
    expect(rows).toHaveLength(49);
    const deliveries = await database
      .connection()
      .repository<{ sendError: string | null }>('userInvitations')
      .findMany();
    expect(
      deliveries.filter((row) =>
        row.sendError?.includes('delivery is unknown'),
      ),
    ).toHaveLength(5);
    const last = results.at(-1);
    if (last?.outcome !== 'invited') throw new Error('Missing invitation');
    await expect(
      batchService.lookupInvitation(last.inviteUrl?.split('/').at(-1) ?? ''),
    ).resolves.toMatchObject({ email: emails.at(-1) });
  });

  it.each([true, false])(
    'uses the request origin without publicOrigin and accepts the link when mail succeeds: %s',
    async (emailAvailable) => {
      const local = createUserManagementService({
        database,
        users: userAdministration(database.connection()),
        roleScopes: createUserRoleScopeRegistry(),
        site: { publicBasePath: '/main', appTitle: 'Acme' },
        ...(emailAvailable
          ? {
              mailer: {
                send: async (email: InvitationEmail) => {
                  mail.push(email);
                },
              },
            }
          : {}),
      });
      const [result] = await local.invite({
        emails: ['local@example.test'],
        invitedBy: 'ann',
        origin: ORIGIN,
      });
      if (result.outcome !== 'invited') throw new Error('Expected invitation');
      expect(result.emailSent).toBe(emailAvailable);
      expect(result.inviteUrl).toContain(`${ORIGIN}/main/invite/`);
      if (emailAvailable) expect(mail[0].text).toContain(result.inviteUrl);
      const token = result.inviteUrl?.split('/').at(-1) ?? '';
      const joined = await local.acceptInvitation({
        token,
        name: 'Local',
        password: 'secret-password',
      });
      const account = await database
        .connection()
        .repository('user')
        .findOne({ filter: { id: joined.userId } });
      expect(Boolean(account?.emailVerified)).toBe(false);
    },
  );

  it('prefers the configured origin over the request origin', async () => {
    const [result] = await service.invite({
      emails: ['origin@example.test'],
      invitedBy: 'ann',
      origin: 'https://other.example',
    });
    expect(result).toMatchObject({
      inviteUrl: expect.stringContaining(ORIGIN),
    });
    expect(mail[0].text).toContain(ORIGIN);
    expect(mail[0].text).not.toContain('other.example');
  });

  it('sends a link to a new address and reports an existing account', async () => {
    const results = await service.invite({
      emails: [' New@Example.com ', 'ann@example.com'],
      invitedBy: 'ann',
      summary: ['Apollo'],
      origin: ORIGIN,
    });

    expect(results).toEqual([
      expect.objectContaining({
        email: 'new@example.com',
        outcome: 'invited',
        emailSent: true,
        inviteUrl: expect.stringContaining(`${ORIGIN}/main/invite/`),
      }),
      { email: 'ann@example.com', outcome: 'existingUser', userId: 'ann' },
    ]);
    expect(mail).toHaveLength(1);
    expect(mail[0]).toMatchObject({
      to: 'new@example.com',
      subject: 'Ann invited you to Acme',
    });
    expect(mail[0]?.text).toContain(`${ORIGIN}/main/invite/`);
    expect(mail[0]?.text).toContain('Apollo');
    await expect(service.listInvitations()).resolves.toEqual([
      expect.objectContaining({
        email: 'new@example.com',
        status: 'pending',
        invitedBy: { id: 'ann', name: 'Ann' },
        summary: ['Apollo'],
      }),
    ]);
  });

  it('returns the link once when the email cannot be sent', async () => {
    failMail = true;
    const [result] = await service.invite({
      emails: ['new@example.com'],
      invitedBy: 'ann',
      origin: ORIGIN,
    });

    expect(result).toMatchObject({
      outcome: 'invited',
      emailSent: false,
      emailError: 'Email not sent: email delivery failed',
    });
    expect(result).toHaveProperty(
      'inviteUrl',
      expect.stringContaining(`${ORIGIN}/main/invite/`),
    );
    const [row] = await service.listInvitations();
    expect(row?.sentAt).toBeNull();
    expect(JSON.stringify(row)).not.toContain('invite/');
  });

  it('returns a clear message and the invitation link without a mail channel', async () => {
    const local = createUserManagementService({
      database,
      users: userAdministration(database.connection()),
      roleScopes: createUserRoleScopeRegistry(),
      site: { publicBasePath: '/main', appTitle: 'Acme' },
    });

    const [result] = await local.invite({
      emails: ['new@example.com'],
      invitedBy: 'ann',
      origin: ORIGIN,
    });

    expect(result).toMatchObject({
      outcome: 'invited',
      emailSent: false,
      emailError: 'Email not sent: no email channel configured',
      inviteUrl: expect.stringContaining(`${ORIGIN}/main/invite/`),
    });
  });

  it('shows the invitation to the link and creates the account on acceptance', async () => {
    await service.invite({
      emails: ['new@example.com'],
      invitedBy: 'ann',
      roleScopes: { app: ['editor'] },
      data: { projects: { projectIds: ['p1'] } },
      summary: ['Apollo'],
      origin: ORIGIN,
    });
    const token = tokenOf(mail[0] as InvitationEmail);

    await expect(service.lookupInvitation(token)).resolves.toMatchObject({
      email: 'new@example.com',
      inviterName: 'Ann',
      summary: ['Apollo'],
    });
    const result = await service.acceptInvitation({
      token,
      name: 'Nia',
      password: 'secret-password',
    });

    expect(result).toMatchObject({
      email: 'new@example.com',
      existingAccount: false,
    });
    expect(roles.get(result.userId)).toEqual(['editor']);
    expect(accepted).toEqual([
      expect.objectContaining({
        userId: result.userId,
        createdAccount: true,
        data: { projects: { projectIds: ['p1'] } },
      }),
    ]);
    await expect(
      service.acceptInvitation({ token, name: 'Nia', password: 'x' }),
    ).rejects.toMatchObject({ code: 'INVITATION_ACCEPTED' });
    await expect(service.listInvitations()).resolves.toEqual([]);
  });

  it('accepts only the supplied token and leaves other project invitations pending', async () => {
    for (const projectId of ['private-project', 'lead-project'])
      await service.invite({
        emails: ['new@example.com'],
        invitedBy: 'ann',
        data: { projectId },
        origin: ORIGIN,
      });
    const privateToken = tokenOf(mail[0] as InvitationEmail);
    const leadToken = tokenOf(mail[1] as InvitationEmail);
    const created = await service.acceptInvitation({
      token: leadToken,
      name: 'Nia',
      password: 'secret-password',
    });
    expect(accepted.map((context) => context.data)).toEqual([
      { projectId: 'lead-project' },
    ]);
    await expect(service.lookupInvitation(privateToken)).resolves.toMatchObject(
      { email: 'new@example.com' },
    );
    // Even the real recipient opening the other link must first authenticate to the account it would grant access to.
    for (const authenticatedUserId of [undefined, 'ann']) {
      await expect(
        service.acceptInvitation(
          { token: privateToken, name: 'Nia', password: 'different-password' },
          authenticatedUserId,
        ),
      ).rejects.toMatchObject({ code: 'INVITATION_SIGN_IN_REQUIRED' });
    }
    expect(accepted).toHaveLength(1);
    await expect(service.lookupInvitation(privateToken)).resolves.toMatchObject(
      { email: 'new@example.com' },
    );
    await service.acceptInvitation(
      { token: privateToken, name: 'Nia', password: '' },
      created.userId,
    );
    expect(accepted.map((context) => context.data)).toEqual([
      { projectId: 'lead-project' },
      { projectId: 'private-project' },
    ]);
    await expect(
      service.acceptInvitation(
        { token: privateToken, name: 'Nia', password: '' },
        created.userId,
      ),
    ).rejects.toMatchObject({ code: 'INVITATION_ACCEPTED' });
    expect(accepted).toHaveLength(2);
  });

  it('rolls the whole acceptance back when a handler fails', async () => {
    service.onInvitationAccepted(() => Promise.reject(new Error('boom')));
    await service.invite({
      emails: ['new@example.com'],
      invitedBy: 'ann',
      origin: ORIGIN,
    });
    const token = tokenOf(mail[0] as InvitationEmail);

    await expect(
      service.acceptInvitation({
        token,
        name: 'Nia',
        password: 'secret-password',
      }),
    ).rejects.toThrow('boom');

    await expect(userCount()).resolves.toBe(1);
    await expect(service.lookupInvitation(token)).resolves.toMatchObject({
      email: 'new@example.com',
    });
  });

  it('uses the account the address has by now', async () => {
    await service.invite({
      emails: ['bob@example.com'],
      invitedBy: 'ann',
      roleScopes: { app: ['editor'] },
      origin: ORIGIN,
    });
    await insertUser('bob', 'Bob');

    const result = await service.acceptInvitation(
      {
        token: tokenOf(mail[0] as InvitationEmail),
        name: 'Someone else',
        password: 'secret-password',
      },
      'bob',
    );

    expect(result).toEqual({
      email: 'bob@example.com',
      userId: 'bob',
      existingAccount: true,
    });
    expect(roles.has('bob')).toBe(false);
    expect(accepted[0]).toMatchObject({ userId: 'bob', createdAccount: false });
  });

  it('sends again with a new link and refuses revoked links', async () => {
    await service.invite({
      emails: ['new@example.com'],
      invitedBy: 'ann',
      origin: ORIGIN,
    });
    const [invitation] = await service.listInvitations();
    const id = invitation?.id ?? '';

    const result = await service.resendInvitation(id, { origin: ORIGIN });
    expect(result).toMatchObject({
      emailSent: true,
      inviteUrl: `${ORIGIN}/main/invite/${tokenOf(mail[1] as InvitationEmail)}`,
    });
    await expect(
      service.lookupInvitation(tokenOf(mail[0] as InvitationEmail)),
    ).rejects.toMatchObject({ code: 'INVITATION_NOT_FOUND' });

    await service.revokeInvitation(id);
    await expect(
      service.lookupInvitation(tokenOf(mail[1] as InvitationEmail)),
    ).rejects.toMatchObject({ code: 'INVITATION_REVOKED' });
    await expect(service.revokeInvitation(id)).rejects.toMatchObject({
      code: 'INVITATION_CLOSED',
    });
  });

  it('rotates a link without email, rejects the old token and stores only the hash', async () => {
    await service.invite({
      emails: ['new@example.com'],
      invitedBy: 'ann',
      origin: ORIGIN,
    });
    const [invitation] = await service.listInvitations();
    const id = invitation?.id ?? '';
    const oldToken = tokenOf(mail[0] as InvitationEmail);
    const result = await service.resendInvitation(id, {
      origin: ORIGIN,
      sendEmail: false,
    });
    expect(result.outcome).toBe('invited');
    if (result.outcome !== 'invited') throw new Error('Expected an invitation');
    expect(result.emailSent).toBe(false);
    const token = result.inviteUrl?.split('/').at(-1) ?? '';
    expect(token).not.toBe(oldToken);
    expect(token).not.toBe('');
    expect(mail).toHaveLength(1);
    await expect(service.lookupInvitation(oldToken)).rejects.toMatchObject({
      code: 'INVITATION_NOT_FOUND',
    });
    await expect(service.lookupInvitation(token)).resolves.toMatchObject({
      email: 'new@example.com',
    });
    const row = await invitationStore.findInvitation(database.connection(), {
      id,
    });
    expect(row).toMatchObject({
      tokenHash: hashToken(token),
      sentAt: null,
      sendError: null,
    });
    expect(JSON.stringify(row)).not.toContain(token);
    expect(JSON.stringify(await service.listInvitations())).not.toContain(
      token,
    );
    await service.revokeInvitation(id);
    await expect(
      service.resendInvitation(id, { origin: ORIGIN, sendEmail: false }),
    ).rejects.toMatchObject({ code: 'INVITATION_CLOSED' });
  });

  it('accepts a rotated link with unavailable email without verifying the email address', async () => {
    failMail = true;
    const [invited] = await service.invite({
      emails: ['manual@example.com'],
      invitedBy: 'ann',
      origin: ORIGIN,
    });
    if (invited?.outcome !== 'invited') throw new Error('Expected invitation');
    const oldToken = invited.inviteUrl?.split('/').at(-1) ?? '';
    const result = await service.resendInvitation(invited.invitationId, {
      origin: ORIGIN,
      sendEmail: false,
    });
    if (result.outcome !== 'invited') throw new Error('Expected invitation');
    const token = result.inviteUrl?.split('/').at(-1) ?? '';
    expect(await service.lookupInvitation(token)).toMatchObject({
      email: 'manual@example.com',
    });
    await expect(service.lookupInvitation(oldToken)).rejects.toMatchObject({
      code: 'INVITATION_NOT_FOUND',
    });
    const accepted = await service.acceptInvitation({
      token,
      name: 'Manual recipient',
      password: 'secure-password',
    });
    expect(accepted.existingAccount).toBe(false);
    expect(mail).toHaveLength(0);
    const user = await database
      .connection()
      .query.selectFrom('user')
      .selectAll()
      .where('id', '=', accepted.userId)
      .executeTakeFirst();
    expect(Boolean(user?.['emailVerified'])).toBe(false);
    await expect(
      service.acceptInvitation({
        token,
        name: 'Again',
        password: 'secure-password',
      }),
    ).rejects.toMatchObject({ code: 'INVITATION_ACCEPTED' });
  });

  it('refuses invalid addresses and unknown role scopes', async () => {
    await expect(
      service.invite({ emails: ['nope'], invitedBy: 'ann', origin: ORIGIN }),
    ).rejects.toMatchObject({ code: 'INVALID_INVITATION' });
    await expect(
      service.invite({
        emails: ['new@example.com'],
        invitedBy: 'ann',
        roleScopes: { hub: 'admin' },
        origin: ORIGIN,
      }),
    ).rejects.toMatchObject({ code: 'ROLE_SCOPE_NOT_FOUND' });
    expect(mail).toEqual([]);
  });

  describe('languages', () => {
    let localized: UserManagementService;
    let preferences: ReturnType<typeof createUserPreferencesService>;

    beforeEach(() => {
      preferences = createUserPreferencesService({ database });
      localized = createUserManagementService({
        database,
        users: userAdministration(database.connection()),
        roleScopes: createUserRoleScopeRegistry(),
        mailer: {
          send: (email) => {
            mail.push(email);
            if (failMail) return Promise.reject(new Error('SMTP refused'));
            return Promise.resolve();
          },
        },
        site: {
          publicOrigin: ORIGIN,
          publicBasePath: '/main',
          appTitle: 'Acme',
        },
        i18n: {
          getLocales: () => ['en-US', 'zh-CN', 'ja-JP', 'it-IT'],
          getDefaultLocale: () => 'zh-CN',
        },
        preferences,
      });
    });

    const localeOf = async (id: string) =>
      (await localized.getInvitation(id))?.locale;
    const invite = async (input: {
      locale?: string;
      inviterLocale?: string;
    }) => {
      const [result] = await localized.invite({
        emails: [`lang-${mail.length}@example.test`],
        invitedBy: 'ann',
        ...input,
      });
      if (result?.outcome !== 'invited') throw new Error('Expected invitation');
      return result;
    };

    it("keeps the chosen language, else the inviter's, else the default", async () => {
      const chosen = await invite({ locale: 'ja-JP', inviterLocale: 'en-US' });
      expect(await localeOf(chosen.invitationId)).toBe('ja-JP');
      expect(mail.at(-1)?.subject).toBe('Ann が Acme に招待しました');
      const inviters = await invite({ inviterLocale: 'en-US' });
      expect(await localeOf(inviters.invitationId)).toBe('en-US');
      expect(mail.at(-1)?.subject).toBe('Ann invited you to Acme');
      // An inviter's language the application does not offer is ignored rather than refused.
      const fallback = await invite({ inviterLocale: 'ko-KR' });
      expect(await localeOf(fallback.invitationId)).toBe('zh-CN');
      expect(mail.at(-1)?.subject).toBe('Ann 邀请你加入 Acme');
      await expect(invite({ locale: 'ko-KR' })).rejects.toMatchObject({
        code: 'INVALID_INVITATION',
        status: 400,
      });
      expect(await localized.listInvitations()).toHaveLength(3);
    });

    it('keeps the chosen language and manual link after delivery fails, then resends successfully', async () => {
      failMail = true;
      const result = await invite({ locale: 'ja-JP' });
      expect(result).toMatchObject({
        emailSent: false,
        emailError: 'Email not sent: email delivery failed',
        inviteUrl: `${ORIGIN}/main/invite/${tokenOf(mail.at(-1)!)}`,
      });
      expect(await localeOf(result.invitationId)).toBe('ja-JP');
      expect(mail.at(-1)?.subject).toBe('Ann が Acme に招待しました');

      failMail = false;
      const resent = await localized.resendInvitation(result.invitationId, {
        inviterLocale: 'en-US',
      });
      expect(resent).toMatchObject({
        emailSent: true,
        inviteUrl: `${ORIGIN}/main/invite/${tokenOf(mail.at(-1)!)}`,
      });
      expect(resent.inviteUrl).not.toBe(result.inviteUrl);
      expect(resent.emailError).toBeUndefined();
      expect(mail.at(-1)?.subject).toBe('Ann が Acme に招待しました');
    });

    it('writes an offered language without email text in the default language and English', async () => {
      await invite({ locale: 'it-IT' });
      expect(mail.at(-1)?.subject).toBe('Ann 邀请你加入 Acme');
      expect(mail.at(-1)?.text).toContain('Ann invited you to Acme.');
    });

    it("resends in the invitation's language, and an older one in the resending person's", async () => {
      const result = await invite({ locale: 'ja-JP' });
      await localized.resendInvitation(result.invitationId, {
        inviterLocale: 'en-US',
      });
      expect(mail.at(-1)?.subject).toBe('Ann が Acme に招待しました');
      await database
        .connection()
        .query.updateTable('userInvitations')
        .set({ locale: null })
        .where('id', '=', result.invitationId)
        .execute();
      await localized.resendInvitation(result.invitationId, {
        inviterLocale: 'en-US',
      });
      expect(mail.at(-1)?.subject).toBe('Ann invited you to Acme');
      // Not backfilled.
      expect(await localeOf(result.invitationId)).toBeNull();
    });

    it("shows the language to the link and keeps the page's as the new account's", async () => {
      await invite({ locale: 'ja-JP' });
      const token = tokenOf(mail.at(-1)!);
      await expect(localized.lookupInvitation(token)).resolves.toMatchObject({
        locale: 'ja-JP',
      });
      const joined = await localized.acceptInvitation({
        token,
        name: 'Lang',
        password: 'secret-password',
        locale: 'en-US',
      });
      expect(await preferences.get(joined.userId, 'i18n.locale')).toBe('en-US');
    });

    it("falls back to the invitation's language and leaves an existing account's alone", async () => {
      await invite({ locale: 'ja-JP' });
      const joined = await localized.acceptInvitation({
        token: tokenOf(mail.at(-1)!),
        name: 'Lang',
        password: 'secret-password',
        locale: 'ko-KR',
      });
      expect(await preferences.get(joined.userId, 'i18n.locale')).toBe('ja-JP');
      await localized.invite({
        emails: ['kim@example.com'],
        invitedBy: 'ann',
        locale: 'ja-JP',
      });
      // The address gets an account before the invitation is accepted.
      await insertUser('kim', 'Kim');
      await localized.acceptInvitation(
        {
          token: tokenOf(mail.at(-1)!),
          name: 'Kim',
          password: '',
          locale: 'en-US',
        },
        'kim',
      );
      expect(await preferences.get('kim', 'i18n.locale')).toBeUndefined();
    });
  });

  async function insertUser(id: string, name: string): Promise<void> {
    const now = new Date();
    await database
      .connection()
      .query.insertInto('user')
      .values({
        id,
        name,
        username: id,
        email: `${id}@example.com`,
        emailVerified: true,
        disabledAt: null,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }

  async function userCount(): Promise<number> {
    const rows = await database
      .connection()
      .query.selectFrom('user')
      .select('id')
      .execute();
    return rows.length;
  }
});

/** Reads and creates accounts in the real `user` table, through whichever connection it is given. */
function userAdministration(
  initialConnection: DatabaseConnection,
): UserAdministrationService {
  const toUser = (row: Record<string, unknown>): AdministratedUser => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    emailVerified: true,
    disabledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const create = (
    connection: DatabaseConnection,
  ): UserAdministrationService => ({
    withConnection: (next) => create(next),
    async list(input = {}) {
      const rows = await connection.query
        .selectFrom('user')
        .selectAll()
        .execute();
      const items = rows
        .map(toUser)
        .filter((user) => !input.search || user.email.includes(input.search));
      return { items, total: items.length, page: 1, pageSize: 100 };
    },
    async get(userId) {
      const row = await connection.query
        .selectFrom('user')
        .selectAll()
        .where('id', '=', userId)
        .executeTakeFirst();
      return row ? toUser(row) : undefined;
    },
    async create(input) {
      const id = `user-${input.email.split('@')[0] ?? ''}`;
      const now = new Date();
      await connection.query
        .insertInto('user')
        .values({
          id,
          name: input.name,
          email: input.email,
          emailVerified: false,
          disabledAt: null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      return toUser({ id, name: input.name, email: input.email });
    },
    update: () => Promise.reject(new Error('not used')),
    disable: () => Promise.reject(new Error('not used')),
    enable: () => Promise.reject(new Error('not used')),
    resetPassword: () => Promise.reject(new Error('not used')),
    revokeSessions: () => Promise.reject(new Error('not used')),
  });
  return create(initialConnection);
}

async function migratePackage(
  database: DatabaseManager,
  packageName: string,
  directory: string,
): Promise<void> {
  await createMigrator({
    database,
    packageName,
    directory: fileURLToPath(new URL(directory, import.meta.url)),
  }).latest();
}
