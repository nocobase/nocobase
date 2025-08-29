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
import { Cache } from '@nocobase/cache';
import { Model, Repository } from '@nocobase/database';

export const setDepartmentsInfo = async (ctx: Context, next: Next) => {
  const currentUser = ctx.state.currentUser;
  if (!currentUser) {
    return next();
  }

  const cache = ctx.cache as Cache;
  const repo = ctx.db.getRepository('users.departments', currentUser.id) as unknown as Repository;
  const departments = (await cache.wrap(`departments:${currentUser.id}`, () =>
    repo.find({
      appends: ['owners', 'roles', 'parent(recursively=true)'],
      raw: true,
    }),
  )) as Model[];
  if (!departments.length) {
    return next();
  }
  ctx.state.currentUser.departments = departments;

  // Use mainDepartmentId instead of isMain
  ctx.state.currentUser.mainDeparmtent = departments.find((dept) => dept.id === currentUser.mainDepartmentId);

  const departmentIds = departments.map((dept) => dept.id);
  const roleRepo = ctx.db.getRepository('roles');
  const roles = await roleRepo.find({
    filter: {
      'departments.id': {
        $in: departmentIds,
      },
    },
  });
  if (!roles.length) {
    return next();
  }
  const rolesMap = new Map();
  roles.forEach((role: any) => rolesMap.set(role.name, role));
  ctx.state.attachRoles = Array.from(rolesMap.values());

  await next();
};
