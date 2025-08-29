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

export const setMainDepartment = async (ctx: Context, next: Next) => {
  await next();

  const { associatedName, resourceName, associatedIndex, actionName, values } = ctx.action.params;

  // When operating from department side: departments.members
  if (associatedName === 'departments' && resourceName === 'members' && values?.length) {
    const userRepo = ctx.db.getRepository('users');
    const throughRepo = ctx.db.getRepository('departmentsUsers');

    if (actionName === 'add' || actionName === 'set') {
      // Set first main if not have one
      for (const userId of values) {
        const user = await userRepo.findOne({ filterByTk: userId, fields: ['id', 'mainDepartmentId'] });
        if (!user?.mainDepartmentId) {
          await userRepo.update({
            filterByTk: userId,
            values: { mainDepartmentId: associatedIndex },
          });
        }
      }
      return;
    }

    if (actionName === 'remove') {
      for (const userId of values) {
        const user = await userRepo.findOne({ filterByTk: userId, fields: ['id', 'mainDepartmentId'] });
        if (user?.mainDepartmentId === associatedIndex) {
          const firstDept = await throughRepo.findOne({
            filter: { userId, departmentId: { $ne: associatedIndex } },
          });
          await userRepo.update({
            filterByTk: userId,
            values: { mainDepartmentId: firstDept ? firstDept.departmentId : null },
          });
        }
      }
    }
  }

  // When operating from user side: users.departments
  if (associatedName === 'users' && resourceName === 'departments' && ['add', 'remove', 'set'].includes(actionName)) {
    const userRepo = ctx.db.getRepository('users');
    const throughRepo = ctx.db.getRepository('departmentsUsers');
    const user = await userRepo.findOne({ filterByTk: associatedIndex, fields: ['id', 'mainDepartmentId'] });

    if (!user?.mainDepartmentId) {
      const firstDept = await throughRepo.findOne({ filter: { userId: associatedIndex } });
      if (firstDept) {
        await userRepo.update({
          filterByTk: associatedIndex,
          values: { mainDepartmentId: firstDept.departmentId },
        });
      }
    }
  }
};
