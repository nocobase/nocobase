import type { Knex } from 'knex';
import type {
  DatabaseConnection,
  FilterBuilder,
  FilterNode,
} from '@nocobase/db';
import type { RealtimeService } from '@nocobase/app-server/realtime';

import type { Auth } from './auth.js';

export interface AdministratedUser {
  readonly id: string;
  readonly name: string;
  readonly username?: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly disabledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ListAdministratedUsersInput {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: 'enabled' | 'disabled';
  readonly userIds?: readonly string[];
}

export interface AdministratedUserPage {
  readonly items: readonly AdministratedUser[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface CreateAdministratedUserInput {
  readonly name: string;
  readonly username?: string;
  readonly email: string;
  readonly password: string;
}

export interface UpdateAdministratedUserInput {
  readonly name?: string;
  readonly username?: string | null;
  readonly email?: string;
}

export interface UserAdministrationService {
  withConnection(connection: DatabaseConnection): UserAdministrationService;
  list(input?: ListAdministratedUsersInput): Promise<AdministratedUserPage>;
  get(userId: string): Promise<AdministratedUser | undefined>;
  create(input: CreateAdministratedUserInput): Promise<AdministratedUser>;
  update(
    userId: string,
    input: UpdateAdministratedUserInput,
  ): Promise<AdministratedUser>;
  disable(userId: string): Promise<AdministratedUser>;
  enable(userId: string): Promise<AdministratedUser>;
  resetPassword(userId: string, password: string): Promise<void>;
  revokeSessions(userId: string): Promise<void>;
  remove(userId: string, actorId: string): Promise<void>;
}

export class UserAdministrationError extends Error {
  constructor(
    readonly code:
      | 'USER_NOT_FOUND'
      | 'USER_EMAIL_CONFLICT'
      | 'USER_USERNAME_CONFLICT'
      | 'USER_IDENTITY_CONFLICT'
      | 'PASSWORD_TOO_SHORT'
      | 'PASSWORD_TOO_LONG',
    message: string,
  ) {
    super(message);
    this.name = 'UserAdministrationError';
  }
}

export interface CreateUserAdministrationServiceOptions {
  readonly auth: Auth;
  readonly connection: DatabaseConnection;
  readonly realtime?: RealtimeService;
}

export function createUserAdministrationService(
  options: CreateUserAdministrationServiceOptions,
): UserAdministrationService {
  return new DefaultUserAdministrationService(options);
}

class DefaultUserAdministrationService implements UserAdministrationService {
  constructor(
    private readonly options: CreateUserAdministrationServiceOptions,
  ) {}

  withConnection(connection: DatabaseConnection): UserAdministrationService {
    return new DefaultUserAdministrationService({
      ...this.options,
      connection,
      auth: this.options.auth.forConnection(connection),
    });
  }

  async list(
    input: ListAdministratedUsersInput = {},
  ): Promise<AdministratedUserPage> {
    const page = positiveInteger(input.page, 1);
    const pageSize = Math.min(positiveInteger(input.pageSize, 20), 100);
    if (input.userIds && input.userIds.length === 0) {
      return { items: [], total: 0, page, pageSize };
    }
    const userIds = input.userIds;
    const search = input.search?.trim();
    // Read through the Repository rather than the Query API: its `includes`
    // matches the search term as literal text, so `%` and `_` typed into the
    // search box mean themselves instead of acting as SQL wildcards.
    const users = this.options.connection.repository('user');
    const condition = (builder: FilterBuilder): FilterNode =>
      builder.and([
        builder.date('deletedAt').empty(),
        ...(input.status === 'enabled'
          ? [builder.date('disabledAt').empty()]
          : []),
        ...(input.status === 'disabled'
          ? [builder.date('disabledAt').notEmpty()]
          : []),
        ...(userIds
          ? [builder.or(userIds.map((id) => builder.string('id').eq(id)))]
          : []),
        ...(search
          ? [
              builder.or([
                // Explicitly case-insensitive: the default mode follows the database's own comparison, which is
                // case-sensitive on PostgreSQL and not on SQLite or MySQL.
                builder
                  .string('name')
                  .includes(search, { mode: 'insensitive' }),
                builder
                  .string('username')
                  .includes(search, { mode: 'insensitive' }),
                builder
                  .string('email')
                  .includes(search, { mode: 'insensitive' }),
              ]),
            ]
          : []),
      ]);
    const total = await users.count({ filter: condition });
    const rows = await users.findMany({
      filter: condition,
      select: (select) => select.fields(...userColumns),
      // `createdAt` alone is not a total order, so a shared timestamp could
      // drop or repeat a row across pages; `id` breaks the tie.
      sort: (sort) => [sort.field('createdAt').desc(), sort.field('id').asc()],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return {
      items: rows.map((row) => toAdministratedUser(row)),
      total,
      page,
      pageSize,
    };
  }

  async get(userId: string): Promise<AdministratedUser | undefined> {
    const row = await this.options.connection.query
      .selectFrom('user')
      .select(userColumns)
      .where('id', '=', userId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
    return row ? toAdministratedUser(row) : undefined;
  }

  async create(
    input: CreateAdministratedUserInput,
  ): Promise<AdministratedUser> {
    const context = await this.options.auth.administrationContext();
    validatePassword(input.password, context.password.config);
    const username = optionalUsername(input.username);
    const email = normalizedEmail(input.email);
    await this.assertIdentityAvailable({ email, username });
    const user = await context.internalAdapter
      .createUser(
        {
          name: requiredText(input.name, 'User name'),
          username,
          email,
          emailVerified: false,
          disabledAt: null,
        },
        { method: 'admin' },
      )
      .catch(throwIdentityConflict);
    await context.internalAdapter.createAccount({
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: await context.password.hash(input.password),
    });
    return (await this.get(user.id))!;
  }

  async update(
    userId: string,
    input: UpdateAdministratedUserInput,
  ): Promise<AdministratedUser> {
    const currentUser = await this.requireUser(userId);
    const context = await this.options.auth.administrationContext();
    const requestedUsername =
      input.username === undefined
        ? undefined
        : (optionalUsername(input.username ?? undefined) ?? null);
    const username =
      requestedUsername === currentUser.username
        ? undefined
        : requestedUsername;
    const email =
      input.email === undefined ? undefined : normalizedEmail(input.email);
    await this.assertIdentityAvailable(
      {
        ...(email === undefined ? {} : { email }),
        ...(username == null ? {} : { username }),
      },
      userId,
    );
    try {
      await context.internalAdapter.updateUser(userId, {
        ...(input.name === undefined
          ? {}
          : { name: requiredText(input.name, 'User name') }),
        ...(input.username === undefined ? {} : { username }),
        ...(email === undefined ? {} : { email }),
      });
    } catch (error) {
      throwIdentityConflict(error);
    }
    return (await this.get(userId))!;
  }

  async disable(userId: string): Promise<AdministratedUser> {
    await this.requireUser(userId);
    const context = await this.options.auth.administrationContext();
    await context.internalAdapter.updateUser(userId, {
      disabledAt: new Date(),
    });
    await this.revokeSessions(userId);
    return (await this.get(userId))!;
  }

  async enable(userId: string): Promise<AdministratedUser> {
    await this.requireUser(userId);
    const context = await this.options.auth.administrationContext();
    await context.internalAdapter.updateUser(userId, { disabledAt: null });
    return (await this.get(userId))!;
  }

  async resetPassword(userId: string, password: string): Promise<void> {
    await this.requireUser(userId);
    const context = await this.options.auth.administrationContext();
    validatePassword(password, context.password.config);
    const hash = await context.password.hash(password);
    const account = await context.internalAdapter.findCredentialAccount(userId);
    if (account) {
      await context.internalAdapter.updatePassword(userId, hash);
    } else {
      await context.internalAdapter.linkAccount({
        accountId: userId,
        providerId: 'credential',
        userId,
        password: hash,
      });
    }
    await this.revokeSessions(userId);
  }

  async revokeSessions(userId: string): Promise<void> {
    await this.requireUser(userId);
    const context = await this.options.auth.administrationContext();
    await context.internalAdapter.deleteUserSessions(userId);
    this.options.realtime?.disconnectUser(userId);
  }

  async remove(userId: string, actorId: string): Promise<void> {
    if (userId === actorId)
      throw new TypeError('You cannot delete your own account.');
    await lockUserForAdministration(this.options.connection, userId);
    if (!(await this.get(userId))) return;
    const context = await this.options.auth.administrationContext();
    await context.internalAdapter.updateUser(userId, {
      disabledAt: new Date(),
      deletedAt: new Date(),
      deletedBy: actorId,
    });
    await context.internalAdapter.deleteUserSessions(userId);
    await this.options.connection.query
      .deleteFrom('account')
      .where('userId', '=', userId)
      .execute();
    this.options.realtime?.disconnectUser(userId);
  }

  private async requireUser(userId: string): Promise<AdministratedUser> {
    const user = await this.get(userId);
    if (!user) {
      throw new UserAdministrationError(
        'USER_NOT_FOUND',
        `Unknown user: ${userId}`,
      );
    }
    return user;
  }

  private async assertIdentityAvailable(
    identity: { readonly email?: string; readonly username?: string },
    excludeUserId?: string,
  ): Promise<void> {
    for (const [field, value, code, message] of [
      [
        'email',
        identity.email,
        'USER_EMAIL_CONFLICT',
        'A user with this email already exists',
      ],
      [
        'username',
        identity.username,
        'USER_USERNAME_CONFLICT',
        'A user with this username already exists',
      ],
    ] as const) {
      if (value === undefined) continue;
      let query = this.options.connection.query
        .selectFrom('user')
        .select('id')
        .where(field, '=', value);
      if (excludeUserId !== undefined) {
        query = query.where('id', '<>', excludeUserId);
      }
      if (await query.executeTakeFirst()) {
        throw new UserAdministrationError(code, message);
      }
    }
  }
}

const userColumns = [
  'id',
  'name',
  'username',
  'email',
  'emailVerified',
  'disabledAt',
  'createdAt',
  'updatedAt',
] as const;

function toAdministratedUser(row: Record<string, unknown>): AdministratedUser {
  return {
    id: scalarString(row.id, 'user ID'),
    name: scalarString(row.name, 'user name'),
    ...(row.username == null
      ? {}
      : { username: scalarString(row.username, 'username') }),
    email: scalarString(row.email, 'user email'),
    emailVerified: Boolean(row.emailVerified),
    disabledAt:
      row.disabledAt == null ? null : dateValue(row.disabledAt, 'disabledAt'),
    createdAt: dateValue(row.createdAt, 'createdAt'),
    updatedAt: dateValue(row.updatedAt, 'updatedAt'),
  };
}

function scalarString(value: unknown, label: string): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  throw new Error(`Invalid ${label}`);
}

function dateValue(value: unknown, label: string): Date {
  if (value instanceof Date) return value;
  const numericString =
    typeof value === 'string' && /^-?\d+(?:\.\d+)?$/u.test(value.trim())
      ? Number(value)
      : undefined;
  const date =
    typeof value === 'number'
      ? new Date(value)
      : typeof value === 'bigint'
        ? new Date(Number(value))
        : typeof value === 'string'
          ? new Date(numericString ?? value)
          : undefined;
  if (!date) throw new Error(`Invalid ${label}`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${label}`);
  return date;
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && (value ?? 0) > 0 ? value! : fallback;
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} must not be empty`);
  return normalized;
}

function optionalUsername(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function normalizedEmail(value: string): string {
  return requiredText(value, 'User email').toLowerCase();
}

function throwIdentityConflict(error: unknown): never {
  if (isUniqueConstraintViolation(error)) {
    throw new UserAdministrationError(
      'USER_IDENTITY_CONFLICT',
      'A user with this email or username already exists',
    );
  }
  throw error;
}

function isUniqueConstraintViolation(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    const number = record.errno ?? record.number ?? record.errorNum;
    if (
      record.code === '23505' ||
      record.code === 'ER_DUP_ENTRY' ||
      record.code === 'SQLITE_CONSTRAINT' ||
      record.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      record.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
      number === 1 ||
      number === 1062 ||
      number === 2601 ||
      number === 2627
    ) {
      return true;
    }
    current = record.cause ?? record.originalError;
  }
  return false;
}

function validatePassword(
  password: string,
  config: { minPasswordLength: number; maxPasswordLength: number },
): void {
  if (password.length < config.minPasswordLength) {
    throw new UserAdministrationError(
      'PASSWORD_TOO_SHORT',
      `Password must be at least ${config.minPasswordLength} characters`,
    );
  }
  if (password.length > config.maxPasswordLength) {
    throw new UserAdministrationError(
      'PASSWORD_TOO_LONG',
      `Password must be at most ${config.maxPasswordLength} characters`,
    );
  }
}

/** Serialize account deletion with creation of resources owned by that account. Use inside a transaction. */
export async function lockUserForAdministration(
  connection: DatabaseConnection,
  userId: string,
): Promise<void> {
  if (connection.dialect === 'sqlite') {
    await connection.query
      .updateTable('user')
      .set({ id: userId })
      .where('id', '=', userId)
      .execute();
    return;
  }
  const physical = await connection.collections.getPhysical('user');
  if (!physical) throw new Error('User schema is unavailable');
  const knex = await connection.client<Knex>();
  await knex(physical.tableName).where({ id: userId }).select('id').forUpdate();
}
