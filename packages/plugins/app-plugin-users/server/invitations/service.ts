/**
 * Email invitations: an address without an account gets a link to create one.
 *
 * - An address that already has an account is reported back (`existingUser`) and nothing is sent; the caller decides
 *   what that account gets.
 * - Each invitation's token authorizes only that invitation's roles and data. Other invitations for the same address
 *   need their own tokens; an existing account must also authenticate before accepting an invitation.
 * - Only token hashes are stored. The shareable link does not prove mailbox ownership; account creation requires
 *   a separate proof delivered only to the invited email address after the transaction commits, unless an account
 *   administrator explicitly authorizes manual delivery. Manual delivery does not verify the email address.
 */
import { randomUUID } from 'node:crypto';

import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import {
  UserManagementError,
  type AcceptedUserInvitation,
  type UserInvitation,
  type UserInvitationAcceptedHandler,
  type UserInvitationResult,
  type UserManagementService,
  type UserRoleScope,
  type UserRoleValue,
} from '../tokens.js';
import { buildInvitationEmail, type InvitationMailer } from './mail.js';
import {
  INVITATION_TTL_MS,
  hashToken,
  mintToken,
  normalizeEmails,
  requireOpen,
  statusOf,
} from './rules.js';
import {
  claimInvitation,
  claimVerificationSend,
  recordInvitationDelivery,
  findInvitation,
  insertInvitation,
  listPending,
  updateInvitation,
  verifications,
  type InvitationRecord,
} from './store.js';

/** Where links point and what the email calls the application. */
export interface InvitationSite {
  /** `app.publicOrigin`; without it, the origin the caller passes. */
  readonly publicOrigin?: string;
  readonly publicBasePath: string;
  readonly appTitle: string;
}

export interface InvitationManagerOptions {
  readonly database: DatabaseManager;
  readonly users: UserAdministrationService;
  readonly requireScope: (key: string) => UserRoleScope;
  /** The checks account creation applies: known scopes, valid values, required scopes present. */
  readonly validateRoleScopes: (
    roleScopes: Readonly<Record<string, UserRoleValue>>,
  ) => void;
  readonly mailer: InvitationMailer;
  readonly site: InvitationSite;
  readonly onRoleScopesChanged?: (userId: string) => void | Promise<void>;
}

export type InvitationManager = Pick<
  UserManagementService,
  | 'invite'
  | 'listInvitations'
  | 'getInvitation'
  | 'resendInvitation'
  | 'revokeInvitation'
  | 'lookupInvitation'
  | 'verifyInvitationEmail'
  | 'acceptInvitation'
  | 'onInvitationAccepted'
>;

const DELIVERY_CONCURRENCY = 5;
const DELIVERY_BUDGET_MS = 30_000;

/** A link to deliver once the rows have committed. */
interface Outgoing {
  readonly row: InvitationRecord;
  readonly token: string;
}

function notFound(): UserManagementError {
  return new UserManagementError(
    'INVITATION_NOT_FOUND',
    'This invitation does not exist.',
    404,
  );
}

export function createInvitationManager(
  options: InvitationManagerOptions,
): InvitationManager {
  const { database, users } = options;
  const handlers = new Set<UserInvitationAcceptedHandler>();

  async function userIdByEmail(
    email: string,
    connection?: DatabaseConnection,
  ): Promise<string | undefined> {
    const service = connection ? users.withConnection(connection) : users;
    const page = await service.list({ search: email, pageSize: 100 });
    return page.items.find((user) => user.email.toLowerCase() === email)?.id;
  }

  async function nameOf(userId: string): Promise<string> {
    return (await users.get(userId))?.name ?? userId;
  }

  function linkBase(origin: string | undefined): string {
    const start = options.site.publicOrigin || origin;
    if (!start)
      throw new Error(
        'Invitation links need app.publicOrigin in the application config, or the request origin.',
      );
    return `${start.replace(/\/+$/u, '')}${options.site.publicBasePath.replace(/\/+$/u, '')}`;
  }

  /** The public link is shareable; only the mailbox receives the separate account-creation proof. */
  async function sendVerification(
    token: string,
    deadline = Date.now() + DELIVERY_BUDGET_MS,
  ): Promise<boolean> {
    const proof = await database.transaction(async (connection) => {
      const row = requireOpen(
        await findInvitation(connection, { tokenHash: hashToken(token) }),
      );
      const now = new Date();
      if (!(await claimVerificationSend(connection, row, now)))
        throw new UserManagementError(
          'INVITATION_VERIFICATION_RATE_LIMITED',
          'Wait one minute before requesting another verification email.',
          409,
        );
      const verification = mintToken();
      const expiresAt = new Date(
        Math.min(
          now.getTime() + 15 * 60_000,
          new Date(row.expiresAt).getTime(),
        ),
      );
      await verifications(connection).deleteMany({
        filter: (f) =>
          f.and([
            f.string('invitationId').eq(row.id),
            f.date('expiresAt').notAfter(now),
          ]),
      });
      await verifications(connection).createOne({
        values: {
          id: randomUUID(),
          invitationId: row.id,
          invitationTokenHash: row.tokenHash,
          tokenHash: verification.hash,
          expiresAt: expiresAt.toISOString(),
        },
      });
      return { row, verification, expiresAt };
    });
    let error: string | null = null;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      // A caller-controlled Host must never choose where mailbox credentials are delivered.
      if (!options.site.publicOrigin)
        throw new Error(
          'Invitation verification emails require app.publicOrigin in the application config.',
        );
      const base = linkBase(undefined);
      const inviterName = await nameOf(proof.row.invitedById);
      const remaining = deadline - Date.now();
      if (remaining <= 0)
        throw new Error('Invitation email delivery budget exhausted.');
      await Promise.race([
        options.mailer.send(
          buildInvitationEmail({
            to: proof.row.email,
            appTitle: options.site.appTitle,
            inviterName,
            summary: proof.row.summary,
            // A fragment is not sent to the HTTP server or in the Referer header.
            url: `${base}/invite/${token}#verification=${proof.verification.token}`,
            expiresAt: proof.expiresAt,
          }),
        ),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () =>
              reject(
                new Error(
                  'Invitation email delivery timed out; delivery is unknown.',
                ),
              ),
            remaining,
          );
        }),
      ]);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    await recordInvitationDelivery(database.connection(), proof.row, error);
    return error === null;
  }

  /** Submits each email after the rows committed and records the outcome on the row. */
  async function deliver(
    outgoing: readonly Outgoing[],
    origin: string | undefined,
    sendEmail: boolean = true,
  ): Promise<UserInvitationResult[]> {
    const base = linkBase(origin);
    const deadline = Date.now() + DELIVERY_BUDGET_MS;
    const results = new Array<UserInvitationResult>(outgoing.length);
    const pending = outgoing.entries();
    async function sendNext(): Promise<void> {
      for (const [index, { row, token }] of pending) {
        const emailSent =
          sendEmail && Date.now() < deadline
            ? await sendVerification(token, deadline)
            : false;
        results[index] = {
          email: row.email,
          outcome: 'invited',
          invitationId: row.id,
          emailSent,
          inviteUrl: `${base}/invite/${token}`,
        };
      }
    }
    // Share a deadline across workers so slow delivery cannot consume the CLI's request timeout.
    await Promise.all(
      Array.from(
        { length: Math.min(DELIVERY_CONCURRENCY, outgoing.length) },
        sendNext,
      ),
    );
    return results;
  }

  async function view(
    rows: readonly InvitationRecord[],
  ): Promise<UserInvitation[]> {
    const names = new Map<string, string>();
    for (const id of new Set(rows.map((row) => row.invitedById)))
      names.set(id, await nameOf(id));
    const now = new Date();
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      status: statusOf(row, now),
      invitedBy: {
        id: row.invitedById,
        name: names.get(row.invitedById) ?? row.invitedById,
      },
      roleScopes: row.roleScopes,
      data: row.data,
      summary: row.summary,
      expiresAt: row.expiresAt,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
    }));
  }

  return {
    async invite(input) {
      const emails = normalizeEmails(input.emails);
      // Checked now, so an invitation never fails on acceptance for roles its inviter chose.
      options.validateRoleScopes(input.roleScopes ?? {});
      const direct: UserInvitationResult[] = [];
      const outgoing = await database.transaction(async (connection) => {
        const links: Outgoing[] = [];
        for (const email of emails) {
          const userId = await userIdByEmail(email, connection);
          if (userId) {
            direct.push({ email, outcome: 'existingUser', userId });
            continue;
          }
          const { token, hash } = mintToken();
          const now = new Date();
          const row: InvitationRecord = {
            id: randomUUID(),
            email,
            tokenHash: hash,
            roleScopes: input.roleScopes ?? {},
            data: input.data ?? {},
            summary: [...(input.summary ?? [])],
            status: 'pending',
            invitedById: input.invitedBy,
            expiresAt: new Date(
              now.getTime() + INVITATION_TTL_MS,
            ).toISOString(),
            sentAt: null,
            manualDelivery: false,
            verificationSentAt: null,
            sendError: null,
            acceptedUserId: null,
            acceptedAt: null,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };
          await insertInvitation(connection, row);
          links.push({ row, token });
        }
        return links;
      });
      const sent = await deliver(outgoing, input.origin);
      const byEmail = new Map(
        [...direct, ...sent].map((result) => [result.email, result]),
      );
      return emails.flatMap((email) => byEmail.get(email) ?? []);
    },

    async listInvitations(input = {}) {
      return view(
        await listPending(
          database.connection(),
          input.invitedBy ? { invitedById: input.invitedBy } : {},
        ),
      );
    },

    async getInvitation(id) {
      const row = await findInvitation(database.connection(), { id });
      return row ? (await view([row]))[0] : undefined;
    },

    async resendInvitation(id, input = {}) {
      if (input.manualDelivery && input.sendEmail !== false)
        throw new UserManagementError(
          'INVALID_INVITATION',
          'Manual delivery requires sendEmail=false.',
          400,
        );
      linkBase(input.origin);
      const outgoing = await database.transaction(async (connection) => {
        const row = await findInvitation(connection, { id });
        if (!row) throw notFound();
        if (row.status !== 'pending')
          throw new UserManagementError(
            'INVITATION_CLOSED',
            'Only a pending invitation can be sent again.',
            409,
          );
        const { token, hash } = mintToken();
        const expiresAt = new Date(
          Date.now() + INVITATION_TTL_MS,
        ).toISOString();
        await updateInvitation(connection, id, {
          tokenHash: hash,
          manualDelivery: input.manualDelivery === true,
          expiresAt,
          verificationSentAt: null,
          sentAt: null,
          sendError: null,
        });
        await verifications(connection).deleteMany({
          filter: { invitationId: id },
        });
        return { row: { ...row, tokenHash: hash, expiresAt }, token };
      });
      const [result] = await deliver([outgoing], input.origin, input.sendEmail);
      return result;
    },

    async revokeInvitation(id) {
      await database.transaction(async (connection) => {
        const row = await findInvitation(connection, { id });
        if (!row) throw notFound();
        if (row.status !== 'pending')
          throw new UserManagementError(
            'INVITATION_CLOSED',
            'Only a pending invitation can be revoked.',
            409,
          );
        await updateInvitation(connection, id, { status: 'revoked' });
        await verifications(connection).deleteMany({
          filter: { invitationId: id },
        });
      });
    },

    async verifyInvitationEmail(token) {
      return { emailSent: await sendVerification(token) };
    },

    async lookupInvitation(token) {
      const row = requireOpen(
        await findInvitation(database.connection(), {
          tokenHash: hashToken(token),
        }),
      );
      return {
        emailVerificationRequired: !row.manualDelivery,
        email: row.email,
        inviterName: await nameOf(row.invitedById),
        summary: row.summary,
        expiresAt: row.expiresAt,
      };
    },

    async acceptInvitation(
      input,
      authenticatedUserId,
    ): Promise<AcceptedUserInvitation> {
      const accepted = await database.transaction(async (connection) => {
        const row = requireOpen(
          await findInvitation(connection, {
            tokenHash: hashToken(input.token),
          }),
        );
        const existing = await userIdByEmail(row.email, connection);
        if (existing && existing !== authenticatedUserId)
          throw new UserManagementError(
            'INVITATION_SIGN_IN_REQUIRED',
            'Sign in with the invited account before accepting this invitation.',
            409,
          );
        let userId = existing;
        if (!userId) {
          const verification = input.emailVerificationToken
            ? await verifications(connection).findOne({
                filter: {
                  invitationId: row.id,
                  invitationTokenHash: row.tokenHash,
                  tokenHash: hashToken(input.emailVerificationToken),
                },
              })
            : undefined;
          if (
            !row.manualDelivery &&
            (!verification ||
              new Date(verification.expiresAt).getTime() <= Date.now())
          )
            throw new UserManagementError(
              'INVITATION_EMAIL_VERIFICATION_REQUIRED',
              'Open the verification link sent to the invited email address before creating an account.',
              409,
            );
          const created = await users.withConnection(connection).create({
            name: input.name,
            email: row.email,
            emailVerified: !row.manualDelivery,
            password: input.password,
          });
          userId = created.id;
          for (const [key, value] of Object.entries(row.roleScopes))
            await options.requireScope(key).replace(userId, value, connection);
        }
        if (!(await claimInvitation(connection, row.id, userId, row.tokenHash)))
          throw new UserManagementError(
            'INVITATION_ACCEPTED',
            'This invitation has already been accepted.',
            409,
          );
        await verifications(connection).deleteMany({
          filter: { invitationId: row.id },
        });
        for (const handler of handlers)
          await handler({
            connection,
            invitationId: row.id,
            userId,
            email: row.email,
            createdAccount: !existing,
            data: row.data,
          });
        return { email: row.email, userId, existingAccount: !!existing };
      });
      await options.onRoleScopesChanged?.(accepted.userId);
      return accepted;
    },

    onInvitationAccepted(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}
