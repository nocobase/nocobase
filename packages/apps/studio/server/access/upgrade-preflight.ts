import { createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import {
  convertStudioAccessGrants,
  reviewStudioAccessKeys,
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
  keyInventory: ReturnType<typeof reviewStudioAccessKeys>;
  unknownAccountKindCount: number;
}
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** A credentials-free preview. This function performs no writes or locks. */
export async function prepareStudioAccessUpgrade(
  connection: DatabaseConnection,
  access: Pick<StudioAccess, 'isRole'>,
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
    .execute();
  const defaults = await connection.query
    .selectFrom('studioSettings')
    .select(['key', 'value'])
    .orderBy('key', 'asc')
    .execute();
  const keys = await connection.query
    .selectFrom('apikey')
    .select(['id', 'referenceId', 'permissions'])
    .execute<{ id: string; referenceId: string; permissions: unknown }>();
  const keyInventory = reviewStudioAccessKeys(keys);
  const kinds = await connection.query
    .selectFrom('user')
    .select('kind')
    .execute();
  return {
    version: 'pm358-v1',
    roles,
    assignmentHash: hash(assignments),
    defaultRoleHash: hash(defaults),
    keyReviewRequired: keyInventory.filter(
      (key) => key.status === 'review-required',
    ).length,
    keyInventory,
    unknownAccountKindCount: kinds.filter(
      (user) => user.kind !== 'person' && user.kind !== 'service',
    ).length,
  };
}
