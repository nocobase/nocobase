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
