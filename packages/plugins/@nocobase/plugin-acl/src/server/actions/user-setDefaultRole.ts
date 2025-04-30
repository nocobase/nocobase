/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';

export async function setDefaultRole(ctx: Context, next: Next) {
  const {
    values: { roleName },
  } = ctx.action.params;

  const {
    db,
    state: { currentUser },
    action: {
      params: { values },
    },
  } = ctx;

  if (values.roleName == 'anonymous') {
    return next();
  }

  const repository = db.getRepository('rolesUsers');

  await db.sequelize.transaction(async (transaction) => {
    const currentUserDefaultRole = await repository.findOne({
      filter: {
        userId: currentUser.id,
        default: true,
      },
      transaction,
    });

    if (currentUserDefaultRole?.roleName === roleName) {
      return;
    }

    if (currentUserDefaultRole) {
      await repository.model.update(
        { default: false },
        { where: { userId: currentUser.id, roleName: currentUserDefaultRole.roleName }, transaction },
      );
    }

    const targetUserRole = await repository.findOne({
      filter: {
        userId: currentUser.id,
        roleName,
      },
      transaction,
    });
    let model;
    if (targetUserRole) {
      await repository.model.update({ default: true }, { where: { userId: currentUser.id, roleName }, transaction });
      model = targetUserRole.set('default', true);
    } else {
      model = await repository.create({
        values: {
          userId: currentUser.id,
          roleName,
          default: true,
        },
        transaction,
      });
    }
    db.emitAsync('rolesUsers.afterSave', model);
  });

  ctx.body = 'ok';

  await next();
}
