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

import type { Database } from '@nocobase/database';
import type { Transaction } from 'sequelize';

export const syncUserMainDepartment = async (db: Database, userId: number | string, transaction?: Transaction) => {
  if (!userId) {
    return;
  }

  const userRepo = db.getRepository('users');
  const throughRepo = db.getRepository('departmentsUsers');
  const user = await userRepo.findOne({
    filterByTk: userId,
    fields: ['id', 'mainDepartmentId'],
    transaction,
  });

  if (!user) {
    return;
  }

  const currentMainDepartmentId = user.get('mainDepartmentId');
  const currentMainDepartment =
    currentMainDepartmentId &&
    (await throughRepo.findOne({
      filter: {
        userId,
        departmentId: currentMainDepartmentId,
      },
      transaction,
    }));

  if (currentMainDepartment) {
    return;
  }

  const firstDepartment = await throughRepo.findOne({
    filter: { userId },
    transaction,
  });
  const nextMainDepartmentId = firstDepartment ? firstDepartment.get('departmentId') : null;

  if (currentMainDepartmentId === nextMainDepartmentId) {
    return;
  }

  await userRepo.update({
    filterByTk: userId,
    values: { mainDepartmentId: nextMainDepartmentId },
    transaction,
  });
};
