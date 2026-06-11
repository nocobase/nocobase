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
import Joi from 'joi';

export type SQLInstructionConfig = {
  dataSource?: string;
  sql?: string;
  withMeta?: boolean;
  unsafeInjection?: boolean;
  variables?: Array<{ name: string; value: any }>;
};

export default class extends Instruction {
  configSchema = Joi.object({
    dataSource: Joi.string(),
    sql: Joi.string(),
    withMeta: Joi.boolean().default(false),
    unsafeInjection: Joi.boolean().default(false),
    variables: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        value: Joi.any(),
      }),
    ),
  });

  async run(node: FlowNodeModel, input, processor: Processor) {
    const dataSourceName = node.config.dataSource || 'main';
    const { collectionManager } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    if (!(collectionManager instanceof SequelizeCollectionManager)) {
      throw new Error(`type of data source "${node.config.dataSource}" is not database`);
    }

    const { unsafeInjection = false, variables = [] } = node.config;

    let sql = '';
    let replacements = null;
    if (unsafeInjection) {
      sql = processor.getParsedValue(node.config.sql || '', node.id).trim();
    } else {
      sql = (node.config.sql || '').trim();
      const parameters = processor.getParsedValue(variables, node.id);
      replacements = {};
      for (const { name, value } of parameters) {
        if (name) {
          replacements[name] = value;
        }
      }
    }

    if (!sql) {
      return {
        status: JOB_STATUS.RESOLVED,
      };
    }

    const [result = null, meta = null] =
      (await collectionManager.db.sequelize.query(sql, {
        transaction: this.workflow.useDataSourceTransaction(dataSourceName, processor.transaction),
        replacements,
        // plain: true,
        // model: db.getCollection(node.config.collection).model
      })) ?? [];

    return {
      result: node.config.withMeta ? [result, meta] : result,
      status: JOB_STATUS.RESOLVED,
    };
  }

  async test({
    dataSource,
    sql: sqlConfig,
    withMeta,
    unsafeInjection = false,
    variables = [],
  }: SQLInstructionConfig = {}) {
    if (!sqlConfig) {
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
      let sql = '';
      let replacements = null;
      if (unsafeInjection) {
        sql = sqlConfig.trim();
      } else {
        sql = sqlConfig.trim();
        replacements = {};
        for (const { name, value } of variables) {
          if (name) {
            replacements[name] = value;
          }
        }
      }

      const [result = null, meta = null] = (await collectionManager.db.sequelize.query(sql, { replacements })) ?? [];

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
