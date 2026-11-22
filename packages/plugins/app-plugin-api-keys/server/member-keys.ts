/**
 * Members' personal keys, as an administrator sees them in System settings › API keys: who holds which key, what it
 * can do in outline, and when it was last used, to revoke the risky or forgotten ones. Never a key's secret, and never a
 * way to change what a key may do.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { ApiKeyView } from '../shared/scopes.js';
import { ApiKeyRequestError, type ScopedApiKeys } from './scoped-keys.js';

const DAY = 86_400_000;

/** One member's key in the list. */
export interface MemberKeyView extends ApiKeyView {
  readonly member: {
    readonly id: string;
    readonly name: string;
    /** The member is disabled, so the key no longer works. */
    readonly disabled: boolean;
  };
}

export interface MemberKeysFilter {
  /** Name of the key or the member. */
  readonly search?: string;
  /** Only keys that act as their member in full. */
  readonly sameAsMember?: boolean;
  /** Only keys unused (or never used) for at least this many days. */
  readonly idleDays?: number;
  /** Only this key. */
  readonly keyId?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

export class MemberKeys {
  constructor(
    private readonly options: {
      readonly connection: () => DatabaseConnection;
      readonly keys: ScopedApiKeys;
    },
  ) {}

  /**
   * The members' keys (people, never service accounts), newest first, paged: filtered, joined to their members and
   * counted by the database, so a page reads one page of keys.
   */
  async list(
    filter: MemberKeysFilter = {},
    now: Date = new Date(),
  ): Promise<{ data: MemberKeyView[]; total: number }> {
    const db = this.options.connection();
    const search = filter.search?.trim().toLocaleLowerCase();
    const pattern = search ? `%${search.replace(/[%_\\]/gu, '')}%` : undefined;
    const cutoff =
      filter.idleDays === undefined
        ? undefined
        : new Date(now.getTime() - filter.idleDays * DAY);
    const filtered = () => {
      let query = db.query
        .selectFrom('apikey')
        .innerJoin('user', 'user.id', 'apikey.referenceId')
        .where('apikey.configId', '=', 'default')
        .where('user.kind', '!=', 'service')
        .where('user.deletedAt', 'is', null);
      if (filter.sameAsMember)
        query = query.where('apikey.permissions', 'is', null);
      if (filter.keyId) query = query.where('apikey.id', '=', filter.keyId);
      if (cutoff)
        query = query.where((eb) =>
          eb.or([
            eb('apikey.lastRequest', '<', cutoff),
            eb.and([
              eb('apikey.lastRequest', 'is', null),
              eb('apikey.createdAt', '<', cutoff),
            ]),
          ]),
        );
      if (pattern)
        query = query.where((eb) =>
          eb.or([
            eb(eb.fn.lower('apikey.name'), 'like', pattern),
            eb(eb.fn.lower('user.name'), 'like', pattern),
          ]),
        );
      return query;
    };
    const pageSize = Math.min(Math.max(filter.pageSize ?? 20, 1), 100);
    const page = Math.max(filter.page ?? 1, 1);
    const [counted, rows] = await Promise.all([
      filtered()
        .select((eb) => [eb.fn.countAll().as('total')])
        .executeTakeFirst<{ total: unknown }>(),
      filtered()
        .selectAll('apikey')
        .select([
          'user.name as memberName',
          'user.disabledAt as memberDisabledAt',
        ])
        .orderBy('apikey.createdAt', 'desc')
        .orderBy('apikey.id', 'desc')
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute(),
    ]);
    return {
      data: (rows as unknown as Record<string, unknown>[]).map((row) => {
        const view = this.options.keys.viewOfRow(row);
        return {
          ...view,
          member: {
            id: String(row.referenceId),
            name: typeof row.memberName === 'string' ? row.memberName : '',
            disabled:
              row.memberDisabledAt !== null &&
              row.memberDisabledAt !== undefined,
          },
        };
      }),
      total: Number(counted?.total ?? 0),
    };
  }

  /** Revokes a member's personal key; a system key or another service account's key is not one. */
  async revoke(keyId: string): Promise<void> {
    const db = this.options.connection();
    const row = await db.query
      .selectFrom('apikey')
      .select(['referenceId'])
      .where('id', '=', keyId)
      .where('configId', '=', 'default')
      .executeTakeFirst<{ referenceId: string }>();
    const member = row
      ? await db.query
          .selectFrom('user')
          .select(['kind'])
          .where('id', '=', row.referenceId)
          .executeTakeFirst<{ kind: unknown }>()
      : undefined;
    if (!row || !member || member.kind === 'service')
      throw new ApiKeyRequestError(404, 'KEY_NOT_FOUND', 'API key not found.');
    await this.options.keys.revoke(row.referenceId, keyId);
  }
}
