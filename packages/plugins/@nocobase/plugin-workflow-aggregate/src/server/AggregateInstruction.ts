/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import { round } from 'mathjs';

import { parseCollectionName } from '@nocobase/data-source-manager';
import { DataTypes } from '@nocobase/database';
import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

const aggregators = {
  count: 'count',
  sum: 'sum',
  avg: 'avg',
  min: 'min',
  max: 'max',
};

export default class extends Instruction {
  configSchema = Joi.object({
    aggregator: Joi.string()
      .valid(...Object.keys(aggregators))
      .required(),
    collection: Joi.when('associated', {
      is: Joi.exist().invalid(null, false, 0, ''),
      then: Joi.string(),
      otherwise: Joi.string().required().messages({ 'any.required': 'Collection is not configured' }),
    }),
  });

  async run(node: FlowNodeModel, input, processor: Processor) {
    const { aggregator, associated, collection, association = {}, params = {}, precision = 2 } = node.config;
    const options = processor.getParsedValue(params, node.id);
    const [dataSourceName, collectionName] = parseCollectionName(collection);
    const { collectionManager } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
    // @ts-ignore
    if (!collectionManager.db) {
      throw new Error('aggregate instruction can only work with data source of type database');
    }
    const repo = associated
      ? collectionManager.getRepository(
          `${association?.associatedCollection}.${association.name}`,
          processor.getParsedValue(association?.associatedKey, node.id),
        )
      : collectionManager.getRepository(collectionName);

    if (!options.dataType && aggregator === 'avg') {
      options.dataType = DataTypes.DOUBLE;
    }

    const result = await repo.aggregate({
      ...options,
      method: aggregators[aggregator],
      transaction: this.workflow.useDataSourceTransaction(dataSourceName, processor.transaction),
    });

    return {
      result: round(
        (options.dataType === DataTypes.DOUBLE ? Number(result) : result) || 0,
        Math.max(0, Math.min(precision, 14)),
      ),
      status: JOB_STATUS.RESOLVED,
    };
  }
}
