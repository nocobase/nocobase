import type { Knex } from 'knex';
import { createHash } from 'node:crypto';
import { decodeAuthorizationTitle } from '@nocobase/authorization/core';
import type { PermissionGrant } from '@nocobase/authorization/core';
import type { AppAuthorization } from '@nocobase/app-plugin-authorization';
import type { DatabaseManager } from '@nocobase/db';
import { conflict } from './errors.js';

export interface AccessUpgradeChange {
  id: string;
  version: string;
  batch: string;
  roleId: string;
  roleKey: string;
  beforeGrants: string;
  afterGrants: string;
  beforeHash: string;
  afterHash: string;
  summary: string;
}
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value !== null && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, entry]) => [key, canonical(entry)]),
        )
      : value;
const digest = (value: string) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(JSON.parse(value))))
    .digest('hex');
const grantsOf = (value: unknown): readonly PermissionGrant[] => {
  let decoded: unknown = value;
  // Native rows may contain the JSON string representation used by the Query API.
  while (typeof decoded === 'string') decoded = JSON.parse(decoded) as unknown;
  if (!Array.isArray(decoded))
    throw conflict(
      'STUDIO_ACCESS_RESTORE_CONFLICT',
      'Invalid stored grants require review.',
    );
  return decoded as PermissionGrant[];
};

/** Only call behind role-management authorization and a confirmed maintenance window. */
export async function restoreStudioAccess(
  database: DatabaseManager,
  authz: AppAuthorization,
): Promise<number> {
  return database.transaction(async (connection) => {
    const changes = await connection
      .repository<AccessUpgradeChange>('studioAccessUpgradeChanges')
      .findMany({
        filter: { version: 'pm358-v1' },
        sort: (s) => [s.field('roleKey').asc()],
      });
    if (!changes.length) return 0;
    const physical = await connection.collections.getPhysical(
      'authorizationPermissionSets',
    );
    if (!physical) throw new Error('Permission Set schema is unavailable');
    const client = await connection.client<Knex>();
    if (connection.dialect === 'sqlite') {
      for (const change of changes)
        await connection.query
          .updateTable('authorizationPermissionSets')
          .set({ id: change.roleId })
          .where('id', '=', change.roleId)
          .execute();
    }
    // A locking read also avoids a snapshot established by the journal query on MySQL repeatable-read.
    let query = client(physical.tableName)
      .select('id', 'key', 'title', 'grants')
      .whereIn(
        'key',
        changes.map((change) => change.roleKey),
      )
      .orderBy('key', 'asc');
    if (connection.dialect !== 'sqlite') query = query.forUpdate();
    const rows = (await query) as {
      id: string;
      key: string;
      title: string | null;
      grants: unknown;
    }[];
    const current = new Map(
      rows.map((row) => [
        String(row.key),
        {
          ...row,
          id: String(row.id),
          key: String(row.key),
          grants: grantsOf(row.grants),
        },
      ]),
    );
    for (const change of changes) {
      const role = current.get(change.roleKey);
      const actual = role && digest(JSON.stringify(role.grants));
      if (
        !role ||
        role.id !== change.roleId ||
        (actual !== change.afterHash && actual !== change.beforeHash) ||
        digest(change.beforeGrants) !== change.beforeHash ||
        digest(change.afterGrants) !== change.afterHash
      )
        throw conflict(
          'STUDIO_ACCESS_RESTORE_CONFLICT',
          'A role changed after the upgrade; restoration requires review.',
        );
    }
    let count = 0;
    const api = authz.permissionSets.withTransaction(connection);
    for (const change of changes) {
      const role = current.get(change.roleKey)!;
      if (digest(JSON.stringify(role.grants)) === change.beforeHash) continue;
      await api.update(role.key, {
        key: role.key,
        ...(role.title === null
          ? {}
          : { title: decodeAuthorizationTitle(role.title) }),
        grants: JSON.parse(change.beforeGrants) as PermissionGrant[],
      });
      count++;
    }
    return count;
  });
}
