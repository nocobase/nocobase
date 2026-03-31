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
import { Repository } from '@nocobase/database';

const updateIsLeafWhenAddChild = async (repo: Repository, parent: any) => {
  if (parent && parent.isLeaf !== false) {
    await repo.update({
      filter: {
        id: parent.id,
      },
      values: {
        isLeaf: false,
      },
    });
  }
};

const updateIsLeafWhenChangeChild = async (
  repo: Repository,
  oldParentId: number | null,
  newParentId: number | null,
) => {
  if (oldParentId && oldParentId !== newParentId) {
    const hasChild = await repo.count({
      filter: {
        parentId: oldParentId,
      },
    });
    if (!hasChild) {
      await repo.update({
        filter: {
          id: oldParentId,
        },
        values: {
          isLeaf: true,
        },
      });
    }
  }
};

export const updateDepartmentIsLeaf = async (ctx: Context, next: Next) => {
  const { filterByTk, values = {}, resourceName, actionName } = ctx.action.params;
  const repo = ctx.db.getRepository('departments');
  const { parent } = values;
  if (resourceName === 'departments' && actionName === 'create') {
    ctx.action.params.values = { ...values, isLeaf: true };
    await next();
    await updateIsLeafWhenAddChild(repo, parent);
    return;
  }

  if (resourceName === 'departments' && actionName === 'update') {
    const department = await repo.findOne({ filterByTk });
    await next();
    await Promise.all([
      updateIsLeafWhenChangeChild(repo, department.parentId, parent?.id),
      updateIsLeafWhenAddChild(repo, parent),
    ]);
    return;
  }

  if (resourceName === 'departments' && actionName === 'destroy') {
    const department = await repo.findOne({ filterByTk });
    await next();
    await updateIsLeafWhenChangeChild(repo, department.parentId, null);
    return;
  }

  return next();
};
