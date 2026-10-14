import { createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import {
  convertStudioAccessGrants,
  reviewStudioAccessKeys,
  studioKeyInventoryHash,
  type KeyUpgradeSources,
} from '../../database/main/seeds/202610250020_studio_access_v2.js';
import type { StudioAccess } from './service.js';

export interface StudioUpgradePlan {
  version: string;
  roles: {
    roleId: string;
    roleKey: string;
    beforeGrants: string;
    afterGrants: string | null;
    blocked: string | null;
  }[];
  assignmentHash: string;
  defaultRoleHash: string;
  keyReviewRequired: number;
  keyInventoryHash: string;
  keyInventory: ReturnType<typeof reviewStudioAccessKeys>;
  unknownAccountKindCount: number;
}
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** A credentials-free preview. This function performs no writes or locks. */
export async function prepareStudioAccessUpgrade(
  connection: DatabaseConnection,
  access: Pick<StudioAccess, 'isRole'>,
  rootSet = 'root',
  defaultSet = 'member',
): Promise<StudioUpgradePlan> {
  const sets = await connection
    .repository<{ id: string; key: string; grants: unknown }>(
      'authorizationPermissionSets',
    )
    .findMany({ select: (s) => s.fields('id', 'key', 'grants') });
  const roles = sets
    .filter((set) => access.isRole(set.key))
    .map((set) => {
      const beforeGrants =
        typeof set.grants === 'string'
          ? set.grants
          : JSON.stringify(set.grants);
      try {
        const converted = convertStudioAccessGrants(
          JSON.parse(beforeGrants) as Parameters<
            typeof convertStudioAccessGrants
          >[0],
        );
        return {
          roleId: set.id,
          roleKey: set.key,
          beforeGrants,
          afterGrants: JSON.stringify(converted),
          blocked: null,
        };
      } catch {
        return {
          roleId: set.id,
          roleKey: set.key,
          beforeGrants,
          afterGrants: null,
          blocked: 'STUDIO_ACCESS_UNMAPPABLE',
        };
      }
    });
  const assignments = await connection.query
    .selectFrom('authorizationPermissionSetAssignments')
    .select(['id', 'subjectType', 'subjectId', 'permissionSetKey'])
    .orderBy('id', 'asc')
    .execute<KeyUpgradeSources['assignments'][number]>();
  const defaults = await connection.query
    .selectFrom('studioSettings')
    .select(['key', 'value'])
    .orderBy('key', 'asc')
    .execute();
  const keys = await connection.query
    .selectFrom('apikey')
    .select(['id', 'referenceId', 'permissions'])
    .execute<{ id: string; referenceId: string; permissions: unknown }>();
  const kinds = await connection.query
    .selectFrom('user')
    .select(['id', 'kind', 'disabledAt', 'deletedAt'])
    .execute<{
      id: string;
      kind: string;
      disabledAt: unknown;
      deletedAt: unknown;
    }>();
  const keyInventory = reviewStudioAccessKeys(keys, {
    sets,
    assignments,
    users: kinds,
    rootSet,
    defaultSet,
  });
  return {
    version: 'pm358-v1',
    roles,
    assignmentHash: hash(assignments),
    defaultRoleHash: hash(defaults),
    keyReviewRequired: keyInventory.filter(
      (key) => key.status === 'review-required',
    ).length,
    keyInventory,
    keyInventoryHash: studioKeyInventoryHash(keyInventory),
    unknownAccountKindCount: kinds.filter(
      (user) => user.kind !== 'person' && user.kind !== 'service',
    ).length,
  };
}
