/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Joi from 'joi';
import { parseCollectionName } from '@nocobase/data-source-manager';

import { JOB_STATUS } from '../constants';
import { toJSON, validateCollectionField } from '../utils';
import type Processor from '../Processor';
import type { FlowNodeModel } from '../types';
import { Instruction } from '.';

export class CreateInstruction extends Instruction {
  configSchema = Joi.object({
    collection: Joi.string().required().messages({ 'any.required': 'Collection is not configured' }),
  });

  validateConfig(config: Record<string, any>) {
    const errors = super.validateConfig(config);
    if (errors) {
      return errors;
    }
    return validateCollectionField(config.collection, this.workflow.app.dataSourceManager);
  }

  async run(node: FlowNodeModel, input, processor: Processor) {
    const { collection, params: { appends = [], ...params } = {} } = node.config;
    const [dataSourceName, collectionName] = parseCollectionName(collection);

    const { repository, filterTargetKey } = this.workflow.app.dataSourceManager.dataSources
      .get(dataSourceName)
      .collectionManager.getCollection(collectionName);
    const options = processor.getParsedValue(params, node.id);
    const transaction = this.workflow.useDataSourceTransaction(dataSourceName, processor.transaction);

    const created = await repository.create({
      ...options,
      context: {
        stack: Array.from(new Set((processor.execution.stack ?? []).concat(processor.execution.id))),
      },
      transaction,
    });

    let result = created;
    if (created && appends.length) {
      const includeFields = appends.reduce((set, field) => {
        set.add(field.split('.')[0]);
        set.add(field);
        return set;
      }, new Set());
      result = await repository.findOne({
        filterByTk: created[filterTargetKey],
        appends: Array.from(includeFields),
        transaction,
      });
    }

    return {
      // NOTE: get() for non-proxied instance (#380)
      result: toJSON(result),
      status: JOB_STATUS.RESOLVED,
    };
  }
}

export default CreateInstruction;
