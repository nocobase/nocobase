import type { ApiClient } from '@nocobase/app-client';

export type UserRoleValue = string | readonly string[];

export interface UserRoleOption {
  readonly value: string;
  readonly label: string;
  readonly labelI18nKey?: string;
  readonly labelI18nNs?: string;
  readonly description?: string;
  readonly assignable?: boolean;
  readonly removable?: boolean;
}

export interface UserRoleScopeOption {
  readonly key: string;
  readonly label: string;
  readonly labelI18nKey?: string;
  readonly labelI18nNs?: string;
  readonly selection: 'single' | 'multiple';
  readonly requiredOnCreate: boolean;
  readonly hasAuthenticatedDefaultAccess?: boolean;
  readonly options: readonly UserRoleOption[];
}

export interface UsersOptions {
  readonly roleScopes: readonly UserRoleScopeOption[];
}

export interface ManagedUser {
  readonly id: string;
  readonly name: string;
  readonly username?: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly disabledAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly roleScopes: Readonly<Record<string, UserRoleValue>>;
}

export interface ManagedUserPage {
  readonly items: readonly ManagedUser[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface ListUsersInput {
  readonly page?: number;
  readonly pageSize?: number;
  /** Matches name, username and email. */
  readonly q?: string;
  readonly status?: 'enabled' | 'disabled';
  readonly roleScope?: string;
  readonly role?: string;
}

export interface CreateUserInput {
  readonly name: string;
  readonly username?: string;
  readonly email: string;
  readonly password: string;
  readonly roleScopes?: Readonly<Record<string, UserRoleValue>>;
}

export interface UpdateUserInput {
  readonly name?: string;
  readonly username?: string | null;
  readonly email?: string;
}

export interface UserInvitation {
  readonly id: string;
  readonly email: string;
  readonly status: 'pending' | 'expired' | 'accepted' | 'revoked';
  readonly invitedBy: { readonly id: string; readonly name: string };
  readonly roleScopes: Readonly<Record<string, UserRoleValue>>;
  readonly summary: readonly string[];
  readonly expiresAt: string;
  readonly sentAt: string | null;
  readonly createdAt: string;
}

export interface InviteUsersInput {
  readonly emails: readonly string[];
  readonly roleScopes?: Readonly<Record<string, UserRoleValue>>;
}

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
  readonly existingAccount: boolean;
}

/** Addresses as people type them: one per line, or separated by commas, semicolons or spaces. */
export function parseEmailList(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.split(/[\s,;，；]+/u)) {
    const email = part.trim().toLowerCase();
    if (email) seen.add(email);
  }
  return [...seen];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function isEmailAddress(value: string): boolean {
  return EMAIL.test(value);
}

interface DataResponse<T> {
  readonly data: T;
}

interface ListResponse<T> {
  readonly data: readonly T[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
  };
}

export class UsersClient {
  constructor(private readonly api: ApiClient) {}

  options(): Promise<UsersOptions> {
    return this.get<UsersOptions>('users/options');
  }

  list(input: ListUsersInput = {}): Promise<ManagedUserPage> {
    return this.api
      .request<ListResponse<ManagedUser>>({
        path: 'users',
        query: Object.fromEntries(
          Object.entries(input).filter(([, value]) => value !== undefined),
        ),
      })
      .then(({ data, meta }) => ({ items: data, ...meta }));
  }

  create(input: CreateUserInput): Promise<ManagedUser> {
    return this.send<ManagedUser>('users', 'POST', input);
  }

  update(userId: string, input: UpdateUserInput): Promise<ManagedUser> {
    return this.send<ManagedUser>(
      `users/${encodeURIComponent(userId)}`,
      'PATCH',
      input,
    );
  }

  disable(userId: string): Promise<ManagedUser> {
    return this.send<ManagedUser>(
      `users/${encodeURIComponent(userId)}/disable`,
      'POST',
    );
  }

  enable(userId: string): Promise<ManagedUser> {
    return this.send<ManagedUser>(
      `users/${encodeURIComponent(userId)}/enable`,
      'POST',
    );
  }

  replaceRoleScope(
    userId: string,
    scope: string,
    value: UserRoleValue,
  ): Promise<ManagedUser> {
    return this.send<ManagedUser>(
      `users/${encodeURIComponent(userId)}/roleScopes/${encodeURIComponent(scope)}`,
      'PUT',
      { value },
    );
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    await this.api.request({
      path: `users/${encodeURIComponent(userId)}/resetPassword`,
      method: 'POST',
      json: { password },
    });
  }

  async remove(userId: string): Promise<void> {
    await this.api.request({
      path: `users/${encodeURIComponent(userId)}`,
      method: 'DELETE',
      query: { confirm: true },
    });
  }

  async revokeSessions(userId: string): Promise<void> {
    await this.api.request({
      path: `users/${encodeURIComponent(userId)}/revokeSessions`,
      method: 'POST',
    });
  }

  listInvitations(): Promise<UserInvitation[]> {
    return this.get<UserInvitation[]>('users/invitations');
  }

  invite(input: InviteUsersInput): Promise<UserInvitationResult[]> {
    return this.send<UserInvitationResult[]>(
      'users/invitations',
      'POST',
      input,
    );
  }

  resendInvitation(invitationId: string): Promise<UserInvitationResult> {
    return this.send<UserInvitationResult>(
      `users/invitations/${encodeURIComponent(invitationId)}/resend`,
      'POST',
    );
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    await this.api.request({
      path: `users/invitations/${encodeURIComponent(invitationId)}`,
      method: 'DELETE',
    });
  }

  /** Public: what the accept page shows to whoever holds the link. */
  lookupInvitation(token: string): Promise<PublicUserInvitation> {
    return this.send<PublicUserInvitation>('users/invitations/lookup', 'POST', {
      token,
    });
  }

  /** Public: creates the account and accepts the invitation. */
  acceptInvitation(
    input: AcceptUserInvitationInput,
  ): Promise<AcceptedUserInvitation> {
    return this.send<AcceptedUserInvitation>(
      'users/invitations/accept',
      'POST',
      input,
    );
  }

  private get<T>(path: string): Promise<T> {
    return this.api.request<DataResponse<T>>({ path }).then(({ data }) => data);
  }

  private send<T>(
    path: string,
    method: 'POST' | 'PATCH' | 'PUT',
    json?: unknown,
  ): Promise<T> {
    return this.api
      .request<DataResponse<T>>({
        path,
        method,
        ...(json === undefined ? {} : { json }),
      })
      .then(({ data }) => data);
  }
}
