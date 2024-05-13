/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

export default class extends Instruction {
  async run(node: FlowNodeModel, input, processor: Processor) {
    // @ts-ignore
    const { db } = this.workflow.app.dataSourceManager.dataSources.get(
      node.config.dataSource || 'main',
    ).collectionManager;
    if (!db) {
      throw new Error(`type of data source "${node.config.dataSource}" is not database`);
    }
    const sql = processor.getParsedValue(node.config.sql || '', node.id).trim();
    if (!sql) {
      return {
        status: JOB_STATUS.RESOLVED,
      };
    }

    // @ts-ignore
    const result = await db.sequelize.query(sql, {
      transaction: processor.transaction,
      // plain: true,
      // model: db.getCollection(node.config.collection).model
    });

    return {
      result,
      status: JOB_STATUS.RESOLVED,
    };
  }
}
