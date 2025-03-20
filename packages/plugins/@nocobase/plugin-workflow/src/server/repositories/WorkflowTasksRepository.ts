/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';

export default class WorkflowTasksRepository extends Repository {
  async countAll(options) {
    const db = this.database;
    return this.collection.model.findAll({
      ...options,
      attributes: ['type', [db.sequelize.fn('COUNT', db.sequelize.col('type')), 'count']],
      group: ['type'],
    });
  }
}
