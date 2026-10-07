import type { DatabaseConnection } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type {
  AdministratedUser,
  CreateAdministratedUserInput,
  UpdateAdministratedUserInput,
} from '@nocobase/app-plugin-authentication';

import type { UserPreferencesService } from './preferences/service.js';

export type UserRoleSelection = 'single' | 'multiple';
export type UserRoleValue = string | readonly string[];

export interface UserRoleOption {
  readonly value: string;
  readonly label: string;
  readonly labelI18nKey?: string;
  readonly labelI18nNs?: string;
  readonly description?: string;
  /** Defaults to true. Set to false for assignments that this scope may show but not add. */
  readonly assignable?: boolean;
  /** Defaults to true. Set to false for protected assignments that this scope may not revoke. */
  readonly removable?: boolean;
}

export interface UserRoleScope {
  readonly key: string;
  readonly label: string;
  readonly labelI18nKey?: string;
  readonly labelI18nNs?: string;
  readonly selection: UserRoleSelection;
  readonly requiredOnCreate?: boolean;
  /** The scope shows direct roles while authenticated-subject permissions apply separately. */
  readonly hasAuthenticatedDefaultAccess?: boolean;
  options(): Promise<readonly UserRoleOption[]>;
  get(userId: string, connection: DatabaseConnection): Promise<UserRoleValue>;
  getMany?(
    userIds: readonly string[],
    connection: DatabaseConnection,
  ): Promise<Readonly<Record<string, UserRoleValue>>>;
  findUserIds(
    role: string,
    connection: DatabaseConnection,
  ): Promise<readonly string[]>;
  replace(
    userId: string,
    value: UserRoleValue,
    connection: DatabaseConnection,
  ): Promise<void>;
  assertCanDelete?(
    userId: string,
    actorId: string,
    connection: DatabaseConnection,
  ): Promise<void>;
  onDelete?(userId: string, connection: DatabaseConnection): Promise<void>;
  assertCanDisable?(
    userId: string,
    connection: DatabaseConnection,
  ): Promise<void>;
}

export interface UserRoleScopeRegistry {
  register(scope: UserRoleScope): () => void;
  get(key: string): UserRoleScope | undefined;
  list(): readonly UserRoleScope[];
}

export interface ManagedUser extends AdministratedUser {
  readonly roleScopes: Readonly<Record<string, UserRoleValue>>;
}

export interface ManagedUserPage {
  readonly items: readonly ManagedUser[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface UserManagementOptions {
  readonly roleScopes: readonly {
    key: string;
    label: string;
    labelI18nKey?: string;
    labelI18nNs?: string;
    selection: UserRoleSelection;
    requiredOnCreate: boolean;
    hasAuthenticatedDefaultAccess: boolean;
    options: readonly UserRoleOption[];
  }[];
}

export interface ListManagedUsersInput {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: 'enabled' | 'disabled';
  readonly roleScope?: string;
  readonly role?: string;
}

export interface CreateManagedUserInput extends CreateAdministratedUserInput {
  readonly roleScopes?: Readonly<Record<string, UserRoleValue>>;
}

export type UserInvitationStatus =
  'pending' | 'expired' | 'accepted' | 'revoked';

/** An invitation as its inviter and the management page see it; never its token. */
export interface UserInvitation {
  readonly id: string;
  readonly email: string;
  /** `expired` is derived from `expiresAt`. */
  readonly status: UserInvitationStatus;
  readonly invitedBy: { readonly id: string; readonly name: string };
  /** Roles the account gets when it is created on acceptance. */
  readonly roleScopes: Readonly<Record<string, UserRoleValue>>;
  /** What the inviter attached for `onInvitationAccepted` handlers. */
  readonly data: Readonly<Record<string, unknown>>;
  /** Shown to the invitee, for example the names of the projects they join. */
  readonly summary: readonly string[];
  readonly expiresAt: string;
  /** The last successful send; null when sending failed. */
  readonly sentAt: string | null;
  readonly createdAt: string;
}

export interface InviteUsersInput {
  readonly emails: readonly string[];
  readonly invitedBy: string;
  readonly roleScopes?: Readonly<Record<string, UserRoleValue>>;
  /**
   * Handed to every `onInvitationAccepted` handler; key it by the package that
   * reads it, since every handler sees all of it.
   */
  readonly data?: Readonly<Record<string, unknown>>;
  readonly summary?: readonly string[];
  /** The origin links start with when the application config has no `app.publicOrigin`. */
  readonly origin?: string;
}

/**
 * - `invited`: a link went out; when sending failed, the link is returned once
 *   for the inviter to forward.
 * - `existingUser`: the address already has an account and nothing was sent;
 *   the caller decides what that account gets.
 */
export type UserInvitationResult =
  | {
      readonly email: string;
      readonly outcome: 'invited';
      readonly invitationId: string;
      readonly emailSent: boolean;
      readonly inviteUrl?: string;
    }
  | {
      readonly email: string;
      readonly outcome: 'existingUser';
      readonly userId: string;
    };

/** What the accept page shows to whoever holds the link. */
export interface PublicUserInvitation {
  readonly email: string;
  readonly inviterName: string;
  readonly summary: readonly string[];
  readonly expiresAt: string;
}

export interface AcceptUserInvitationInput {
  readonly token: string;
  readonly name: string;
  readonly password: string;
}

export interface AcceptedUserInvitation {
  readonly email: string;
  readonly userId: string;
  /** The address had an account already: nothing was created, and it signs in with its own password. */
  readonly existingAccount: boolean;
}

export interface UserInvitationAcceptedContext {
  /** The acceptance's transaction: a handler that throws rolls the whole acceptance back. */
  readonly connection: DatabaseConnection;
  readonly invitationId: string;
  readonly userId: string;
  readonly email: string;
  readonly createdAccount: boolean;
  readonly data: Readonly<Record<string, unknown>>;
}

export type UserInvitationAcceptedHandler = (
  context: UserInvitationAcceptedContext,
) => Promise<void>;

export interface UserManagementService {
  options(): Promise<UserManagementOptions>;
  list(input?: ListManagedUsersInput): Promise<ManagedUserPage>;
  create(input: CreateManagedUserInput): Promise<ManagedUser>;
  update(
    userId: string,
    input: UpdateAdministratedUserInput,
  ): Promise<ManagedUser>;
  disable(userId: string): Promise<ManagedUser>;
  enable(userId: string): Promise<ManagedUser>;
  replaceRoleScope(
    userId: string,
    scope: string,
    value: UserRoleValue,
  ): Promise<ManagedUser>;
  resetPassword(userId: string, password: string): Promise<void>;
  revokeSessions(userId: string): Promise<void>;
  remove(userId: string, actorId: string): Promise<void>;
  /** Invites each address; one without an account gets a link by email. */
  invite(input: InviteUsersInput): Promise<UserInvitationResult[]>;
  /** Pending and expired invitations, newest first; only `invitedBy`'s when given. */
  listInvitations(input?: {
    readonly invitedBy?: string;
  }): Promise<UserInvitation[]>;
  getInvitation(id: string): Promise<UserInvitation | undefined>;
  /** Sends a pending invitation again with a new link and a new period. */
  resendInvitation(
    id: string,
    input?: { readonly origin?: string },
  ): Promise<UserInvitationResult>;
  revokeInvitation(id: string): Promise<void>;
  lookupInvitation(token: string): Promise<PublicUserInvitation>;
  /**
   * Creates the account, or uses the one the address has by now, and accepts
   * every pending invitation of the address in one transaction, running the
   * handlers for each.
   */
  acceptInvitation(
    input: AcceptUserInvitationInput,
  ): Promise<AcceptedUserInvitation>;
  /** Registers what accepting an invitation also does; returns what removes it. */
  onInvitationAccepted(handler: UserInvitationAcceptedHandler): () => void;
}

export class UserManagementError extends Error {
  constructor(
    readonly code:
      | 'USER_DELETION_NOT_CONFIGURED'
      | 'SELF_DELETE_NOT_ALLOWED'
      | 'USER_NOT_FOUND'
      | 'ROLE_SCOPE_NOT_FOUND'
      | 'ROLE_SCOPE_REQUIRED'
      | 'INVALID_ROLE_SCOPE_VALUE'
      | 'INVALID_INVITATION'
      | 'INVITATION_NOT_FOUND'
      | 'INVITATION_EXPIRED'
      | 'INVITATION_ACCEPTED'
      | 'INVITATION_REVOKED'
      | 'INVITATION_CLOSED',
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

/** An application-defined role scope can reject a user-management operation. */
export class UserRoleScopeError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: 400 | 404 | 409 = 400,
  ) {
    super(message);
    this.name = 'UserRoleScopeError';
  }
}

export const userRoleScopeRegistryToken: ServiceToken<UserRoleScopeRegistry> =
  createServiceToken<UserRoleScopeRegistry>(
    '@nocobase/app-plugin-users/role-scopes',
  );

export const userManagementServiceToken: ServiceToken<UserManagementService> =
  createServiceToken<UserManagementService>(
    '@nocobase/app-plugin-users/service',
  );

/** The first administrator, created only while the user table is empty. */
export interface InitialAdminConfig {
  readonly username?: string;
  readonly email?: string;
  readonly password?: string;
}

export interface UsersConfig {
  /**
   * Read by the authentication plugin's default-administrator seed. Left out entirely, the seed creates
   * `nocobase` / `admin@nocobase.com` / `admin123`; set at all, it needs a password.
   */
  readonly initialAdmin?: InitialAdminConfig;
  /** Disable when an application provides its own assignment scope, such as Hub. */
  readonly permissionSets?: boolean;
  readonly invitations?: {
    /** The notification Channel invitation emails go through; `system-email` by default. */
    readonly emailChannel?: string;
  };
}

export const userPreferencesServiceToken: ServiceToken<UserPreferencesService> =
  createServiceToken<UserPreferencesService>(
    '@nocobase/app-plugin-users/preferences',
  );
