/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';

import { JsTemplateError } from '../shared/errors';
import type { JsTemplateCreateJob } from '../shared/types';

interface CreateJobAuthorizationDependencies {
  db: Database;
  acl: {
    can(input: { roles: string[]; resource: string; action: string }): unknown;
  };
}

export async function authorizeJsTemplateCreateJob(
  dependencies: CreateJobAuthorizationDependencies,
  job: JsTemplateCreateJob,
  transaction?: Transaction,
): Promise<void> {
  const { db, acl } = dependencies;
  if (!job.actorUserId) {
    throw permissionDenied('Creation job actor is no longer available');
  }
  if (!db.hasCollection('users') || !db.hasCollection('rolesUsers')) {
    throw permissionDenied('Creation job authorization services are unavailable');
  }
  const actor = await db.getRepository('users').findOne({
    filterByTk: job.actorUserId,
    transaction,
    fields: ['id'],
    raw: true,
  });
  if (!actor) {
    throw permissionDenied('Creation job actor is no longer available');
  }
  const roles = await db.getRepository('rolesUsers').find({
    filter: { userId: job.actorUserId },
    transaction,
    raw: true,
  });
  const activeRoleNames = new Set(
    roles
      .map((role) => (role as { roleName?: unknown }).roleName)
      .filter((roleName): roleName is string => typeof roleName === 'string'),
  );
  for (const roleName of await findDepartmentRoleNames(db, job.actorUserId, transaction)) {
    activeRoleNames.add(roleName);
  }
  const authorizationRoles = normalizeAuthorizationRoles(job);
  if (!authorizationRoles.length || authorizationRoles.some((roleName) => !activeRoleNames.has(roleName))) {
    throw permissionDenied('Creation job actor has no active roles');
  }
  const roleMode = await getRoleMode(db, transaction);
  if (
    (job.authorizationRole === '__union__' && roleMode === 'default') ||
    (job.authorizationRole !== '__union__' && roleMode === 'only-use-union')
  ) {
    throw permissionDenied('Creation job selected role is no longer active');
  }
  for (const action of requiredAclActions(job.sourceType)) {
    if (!acl.can({ roles: authorizationRoles, resource: 'jsTemplate', action })) {
      throw permissionDenied(`JS Template ${action} permission is required`);
    }
  }
}

async function findDepartmentRoleNames(
  db: Database,
  actorUserId: string,
  transaction?: Transaction,
): Promise<string[]> {
  if (!db.hasCollection('departmentsUsers') || !db.hasCollection('departmentsRoles')) {
    return [];
  }
  const memberships = await db.getRepository('departmentsUsers').find({
    filter: { userId: actorUserId },
    fields: ['departmentId'],
    transaction,
    raw: true,
  });
  const departmentIds = memberships
    .map((membership) => (membership as { departmentId?: unknown }).departmentId)
    .filter((departmentId): departmentId is string | number => ['string', 'number'].includes(typeof departmentId));
  if (!departmentIds.length) {
    return [];
  }
  const departmentRoles = await db.getRepository('departmentsRoles').find({
    filter: { departmentId: { $in: departmentIds } },
    fields: ['roleName'],
    transaction,
    raw: true,
  });
  return departmentRoles
    .map((role) => (role as { roleName?: unknown }).roleName)
    .filter((roleName): roleName is string => typeof roleName === 'string' && Boolean(roleName.trim()));
}

async function getRoleMode(db: Database, transaction?: Transaction): Promise<string> {
  if (!db.hasCollection('systemSettings')) {
    throw permissionDenied('Creation job role policy is unavailable');
  }
  const settings = await db.getRepository('systemSettings').findOne({ transaction, raw: true });
  if (!settings || typeof (settings as { roleMode?: unknown }).roleMode !== 'string') {
    return 'default';
  }
  return String((settings as { roleMode: string }).roleMode);
}

function permissionDenied(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', message);
}

function normalizeAuthorizationRoles(job: JsTemplateCreateJob): string[] {
  const roles = [
    ...new Set(job.authorizationRoles.filter((role) => typeof role === 'string' && Boolean(role.trim()))),
  ].sort((left, right) => left.localeCompare(right));
  if (job.authorizationRole === '__union__') {
    return roles;
  }
  return roles.length === 1 && roles[0] === job.authorizationRole ? roles : [];
}

function requiredAclActions(sourceType: JsTemplateCreateJob['sourceType']) {
  return sourceType === 'git' ? (['create', 'manageSyncSource', 'pullFromSyncSource'] as const) : (['create'] as const);
}
