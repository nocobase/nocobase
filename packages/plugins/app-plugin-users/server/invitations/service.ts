/**
 * Email invitations: an address without an account gets a link to create one.
 *
 * - An address that already has an account is reported back (`existingUser`) and nothing is sent; the caller decides
 *   what that account gets.
 * - An address may hold several pending invitations, each with its own link, roles and data. Accepting any one of them
 *   accepts them all, in one transaction: the account is created with the accepted invitation's roles, and the
 *   `onInvitationAccepted` handlers run once per invitation, so what each inviter attached takes effect.
 * - Only the token's hash is stored. Emails are submitted after the rows commit; when submitting fails, the inviter
 *   gets the link once, to forward by hand, and the row keeps the error.
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
  findInvitation,
  insertInvitation,
  listPending,
  updateInvitation,
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
  | 'acceptInvitation'
  | 'onInvitationAccepted'
>;

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

  /** Submits each email after the rows committed and records the outcome on the row. */
  async function deliver(
    outgoing: readonly Outgoing[],
    origin: string | undefined,
  ): Promise<UserInvitationResult[]> {
    const base = linkBase(origin);
    const connection = database.connection();
    const results: UserInvitationResult[] = [];
    for (const { row, token } of outgoing) {
      const url = `${base}/invite/${token}`;
      let error: string | null = null;
      try {
        await options.mailer.send(
          buildInvitationEmail({
            to: row.email,
            appTitle: options.site.appTitle,
            inviterName: await nameOf(row.invitedById),
            summary: row.summary,
            url,
            expiresAt: new Date(row.expiresAt),
            idempotencyKey: `user-invitation:${hashToken(token)}`,
          }),
        );
      } catch (cause) {
        error = cause instanceof Error ? cause.message : String(cause);
      }
      await updateInvitation(connection, row.id, {
        sentAt: error ? null : new Date().toISOString(),
        sendError: error ? error.slice(0, 1000) : null,
      });
      results.push({
        email: row.email,
        outcome: 'invited',
        invitationId: row.id,
        emailSent: !error,
        ...(error ? { inviteUrl: url } : {}),
      });
    }
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
        await updateInvitation(connection, id, { tokenHash: hash, expiresAt });
        return { row: { ...row, tokenHash: hash, expiresAt }, token };
      });
      const [result] = await deliver([outgoing], input.origin);
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
      });
    },

    async lookupInvitation(token) {
      const row = requireOpen(
        await findInvitation(database.connection(), {
          tokenHash: hashToken(token),
        }),
      );
      return {
        email: row.email,
        inviterName: await nameOf(row.invitedById),
        summary: row.summary,
        expiresAt: row.expiresAt,
      };
    },

    async acceptInvitation(input): Promise<AcceptedUserInvitation> {
      const accepted = await database.transaction(async (connection) => {
        const row = requireOpen(
          await findInvitation(connection, {
            tokenHash: hashToken(input.token),
          }),
        );
        const existing = await userIdByEmail(row.email, connection);
        let userId = existing;
        if (!userId) {
          const created = await users.withConnection(connection).create({
            name: input.name,
            email: row.email,
            password: input.password,
          });
          userId = created.id;
          for (const [key, value] of Object.entries(row.roleScopes))
            await options.requireScope(key).replace(userId, value, connection);
        }
        const others = (
          await listPending(connection, { email: row.email })
        ).filter(
          (other) => other.id !== row.id && statusOf(other) === 'pending',
        );
        for (const invitation of [row, ...others]) {
          if (!(await claimInvitation(connection, invitation.id, userId)))
            throw new UserManagementError(
              'INVITATION_ACCEPTED',
              'This invitation has already been accepted.',
              409,
            );
          for (const handler of handlers)
            await handler({
              connection,
              invitationId: invitation.id,
              userId,
              email: row.email,
              createdAccount: !existing,
              data: invitation.data,
            });
        }
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
