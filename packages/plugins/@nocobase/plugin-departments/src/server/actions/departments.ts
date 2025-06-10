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
import { DepartmentModel } from '../models/department';

export const getAppendsOwners = async (ctx: Context, next: Next) => {
  const { filterByTk, appends } = ctx.action.params;
  const repo = ctx.db.getRepository('departments');
  const department: DepartmentModel = await repo.findOne({
    filterByTk,
    appends,
  });
  const owners = await department.getOwners();
  department.setDataValue('owners', owners);
  ctx.body = department;
  await next();
};

export const aggregateSearch = async (ctx: Context, next: Next) => {
  const { keyword, type, last = 0, limit = 10 } = ctx.action.params.values || {};
  let users = [];
  let departments = [];
  if (!type || type === 'user') {
    const repo = ctx.db.getRepository('users');
    users = await repo.find({
      filter: {
        id: { $gt: last },
        $or: [
          { username: { $includes: keyword } },
          { nickname: { $includes: keyword } },
          { phone: { $includes: keyword } },
          { email: { $includes: keyword } },
        ],
      },
      limit,
    });
  }
  if (!type || type === 'department') {
    const repo = ctx.db.getRepository('departments');
    departments = await repo.find({
      filter: {
        id: { $gt: last },
        title: { $includes: keyword },
      },
      appends: ['parent(recursively=true)'],
      limit,
    });
  }
  ctx.body = { users, departments };
  await next();
};

export const setOwner = async (ctx: Context, next: Next) => {
  const { userId, departmentId } = ctx.action.params.values || {};
  const throughRepo = ctx.db.getRepository('departmentsUsers');
  await throughRepo.update({
    filter: {
      userId,
      departmentId,
    },
    values: {
      isOwner: true,
    },
  });
  await next();
};

export const removeOwner = async (ctx: Context, next: Next) => {
  const { userId, departmentId } = ctx.action.params.values || {};
  const throughRepo = ctx.db.getRepository('departmentsUsers');
  await throughRepo.update({
    filter: {
      userId,
      departmentId,
    },
    values: {
      isOwner: false,
    },
  });
  await next();
};
