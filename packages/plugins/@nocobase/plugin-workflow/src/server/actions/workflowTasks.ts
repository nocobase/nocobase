/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';
import { Context, utils } from '@nocobase/actions';

import WorkflowTasksRepository from '../repositories/WorkflowTasksRepository';

export async function countMine(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context) as WorkflowTasksRepository;
  context.body =
    (await repository.countAll({
      where: {
        userId: context.state.currentUser.id,
        workflowId: { [Op.ne]: null },
      },
    })) || [];

  await next();
}
