/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Context, Next } from '@nocobase/actions';
import { syncUserMainDepartment } from '../sync-user-main-department';

const normalizeIds = (values: any[] = []) =>
  values
    .map((value) => (typeof value === 'object' && value ? value.id ?? value : value))
    .filter((value) => value !== null && value !== undefined);

const syncUsersMainDepartment = async (ctx: Context, userIds: any[]) => {
  const uniqUserIds = [...new Set(normalizeIds(userIds))];
  for (const userId of uniqUserIds) {
    await syncUserMainDepartment(ctx.db, userId, ctx.transaction);
  }
};

export const setMainDepartment = async (ctx: Context, next: Next) => {
  const { associatedName, resourceName, associatedIndex, actionName, values, filterByTk } = ctx.action.params;
  let affectedDepartmentMemberUserIds: any[] = [];

  if (associatedName === 'departments' && resourceName === 'members' && actionName === 'set') {
    const throughRepo = ctx.db.getRepository('departmentsUsers');
    const currentMembers = await throughRepo.find({
      fields: ['userId'],
      filter: { departmentId: associatedIndex },
      transaction: ctx.transaction,
    });
    affectedDepartmentMemberUserIds = currentMembers.map((member: any) => member.get?.('userId') ?? member.userId);
  }

  await next();

  // When operating from department side: departments.members
  if (associatedName === 'departments' && resourceName === 'members' && ['add', 'remove', 'set'].includes(actionName)) {
    const affectedUserIds =
      actionName === 'set' ? [...affectedDepartmentMemberUserIds, ...(values || [])] : values || [];
    await syncUsersMainDepartment(ctx, affectedUserIds);
    return;
  }

  // When operating from user side: users.departments
  if (associatedName === 'users' && resourceName === 'departments' && ['add', 'remove', 'set'].includes(actionName)) {
    await syncUsersMainDepartment(ctx, [associatedIndex ?? filterByTk]);
  }
};
