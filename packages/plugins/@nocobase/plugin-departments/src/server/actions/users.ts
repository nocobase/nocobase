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

import { Context, DEFAULT_PAGE, DEFAULT_PER_PAGE, Next } from '@nocobase/actions';

export const listExcludeDept = async (ctx: Context, next: Next) => {
  const { departmentId, page = DEFAULT_PAGE, pageSize = DEFAULT_PER_PAGE } = ctx.action.params;
  const repo = ctx.db.getRepository('users');
  const members = await repo.find({
    fields: ['id'],
    filter: {
      'departments.id': departmentId,
    },
  });
  const memberIds = members.map((member: { id: number }) => member.id);
  if (memberIds.length) {
    ctx.action.mergeParams({
      filter: {
        id: {
          $notIn: memberIds,
        },
      },
    });
  }
  const { filter } = ctx.action.params;
  const [rows, count] = await repo.findAndCount({
    context: ctx,
    offset: (page - 1) * pageSize,
    limit: +pageSize,
    filter,
  });
  ctx.body = {
    count,
    rows,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPage: Math.ceil(count / pageSize),
  };
  await next();
};

export const setDepartments = async (ctx: Context, next: Next) => {
  const { values = {} } = ctx.action.params;
  const { userId, departments = [] } = values;
  const repo = ctx.db.getRepository('users');
  const throughRepo = ctx.db.getRepository('departmentsUsers');
  const user = await repo.findOne({ filterByTk: userId });
  if (!user) {
    ctx.throw(400, ctx.t('User does not exist'));
  }
  const departmentIds = departments.map((department: any) => department.id);
  const main = departments.find((department: any) => department.isMain);
  const owners = departments.filter((department: any) => department.isOwner);

  await ctx.db.sequelize.transaction(async (t) => {
    await user.setDepartments(departmentIds, {
      through: { isOwner: false },
      transaction: t,
    });

    // ensure main department id
    await repo.update({
      filterByTk: userId,
      values: { mainDepartmentId: main ? main.id : null },
      transaction: t,
    });

    // ensure main exists in m2m if provided
    if (main) {
      const existingAssoc = await throughRepo.findOne({
        filter: { userId, departmentId: main.id },
        transaction: t,
      });
      if (!existingAssoc) {
        await throughRepo.create({
          values: {
            userId,
            departmentId: main.id,
            isOwner: main.isOwner || false,
          },
          transaction: t,
        });
      }
    }

    // owner flags
    if (owners.length) {
      await throughRepo.update({
        filter: {
          userId,
          departmentId: { $in: owners.map((o: any) => o.id) },
        },
        values: { isOwner: true },
        transaction: t,
      });
    }
  });
  await next();
};

export const setMainDepartment = async (ctx: Context, next: Next) => {
  const { userId, departmentId } = ctx.action.params.values || {};
  const repo = ctx.db.getRepository('users');
  const throughRepo = ctx.db.getRepository('departmentsUsers');

  await ctx.db.sequelize.transaction(async (t) => {
    await repo.update({
      filterByTk: userId,
      values: { mainDepartmentId: departmentId },
      transaction: t,
    });

    const existingAssoc = await throughRepo.findOne({
      filter: { userId, departmentId },
      transaction: t,
    });
    if (!existingAssoc) {
      await throughRepo.create({
        values: {
          userId,
          departmentId,
          isOwner: false,
        },
        transaction: t,
      });
    }
  });

  await next();
};
