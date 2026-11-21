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
  readonly page?: number;
  readonly pageSize?: number;
}

interface MemberRow {
  readonly id: string;
  readonly name: string | null;
  readonly disabledAt: unknown;
}

export class MemberKeys {
  constructor(
    private readonly options: {
      readonly connection: () => DatabaseConnection;
      readonly keys: ScopedApiKeys;
    },
  ) {}

  /** The members (people, never service accounts) and their keys, newest first, paged. */
  async list(
    filter: MemberKeysFilter = {},
    now: Date = new Date(),
  ): Promise<{ data: MemberKeyView[]; total: number }> {
    const db = this.options.connection();
    const people = new Map(
      (
        (await db.query
          .selectFrom('user')
          .select(['id', 'name', 'disabledAt'])
          .where('kind', '!=', 'service')
          .where('deletedAt', 'is', null)
          .execute()) as unknown as MemberRow[]
      ).map((row) => [String(row.id), row]),
    );
    const rows = await db.query
      .selectFrom('apikey')
      .selectAll()
      .where('configId', '=', 'default')
      .orderBy('createdAt', 'desc')
      .execute();
    const search = filter.search?.trim().toLocaleLowerCase();
    const cutoff =
      filter.idleDays === undefined
        ? null
        : now.getTime() - filter.idleDays * DAY;
    const matching = rows.flatMap((row): MemberKeyView[] => {
      const member = people.get(String(row.referenceId));
      if (!member) return [];
      const view = this.options.keys.viewOfRow(row);
      if (filter.sameAsMember && view.permissions !== null) return [];
      if (cutoff !== null) {
        const used = new Date(view.lastUsedAt ?? view.createdAt).getTime();
        if (used > cutoff) return [];
      }
      if (
        search &&
        !(view.name ?? '').toLocaleLowerCase().includes(search) &&
        !(member.name ?? '').toLocaleLowerCase().includes(search)
      )
        return [];
      return [
        {
          ...view,
          member: {
            id: member.id,
            name: member.name ?? '',
            disabled:
              member.disabledAt !== null && member.disabledAt !== undefined,
          },
        },
      ];
    });
    const pageSize = Math.min(Math.max(filter.pageSize ?? 20, 1), 100);
    const page = Math.max(filter.page ?? 1, 1);
    return {
      data: matching.slice((page - 1) * pageSize, page * pageSize),
      total: matching.length,
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
