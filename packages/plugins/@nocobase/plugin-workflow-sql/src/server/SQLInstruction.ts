/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

export type SQLInstructionConfig = {
  dataSource?: string;
  sql?: string;
  withMeta?: boolean;
};

export default class extends Instruction {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const dataSourceName = node.config.dataSource || 'main';
    const { collectionManager } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    if (!(collectionManager instanceof SequelizeCollectionManager)) {
      throw new Error(`type of data source "${node.config.dataSource}" is not database`);
    }
    const sql = processor.getParsedValue(node.config.sql || '', node.id).trim();
    if (!sql) {
      return {
        status: JOB_STATUS.RESOLVED,
      };
    }

    const [result = null, meta = null] =
      (await collectionManager.db.sequelize.query(sql, {
        transaction: this.workflow.useDataSourceTransaction(dataSourceName, processor.transaction),
        // plain: true,
        // model: db.getCollection(node.config.collection).model
      })) ?? [];

    return {
      result: node.config.withMeta ? [result, meta] : result,
      status: JOB_STATUS.RESOLVED,
    };
  }

  async test({ dataSource, sql, withMeta }: SQLInstructionConfig = {}) {
    if (!sql) {
      return {
        result: null,
        status: JOB_STATUS.RESOLVED,
      };
    }

    const dataSourceName = dataSource || 'main';
    const { collectionManager } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    if (!(collectionManager instanceof SequelizeCollectionManager)) {
      throw new Error(`type of data source "${dataSource}" is not database`);
    }

    try {
      const [result = null, meta = null] = (await collectionManager.db.sequelize.query(sql)) ?? [];

      return {
        result: withMeta ? [result, meta] : result,
        status: JOB_STATUS.RESOLVED,
      };
    } catch (error) {
      return {
        result: error.message,
        status: JOB_STATUS.ERROR,
      };
    }
  }
}
