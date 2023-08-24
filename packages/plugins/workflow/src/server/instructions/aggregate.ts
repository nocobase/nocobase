import { BelongsToManyRepository, DataTypes, HasManyRepository } from '@nocobase/database';

import Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import type { FlowNodeModel } from '../types';

const aggregators = {
  count: 'count',
  sum: 'sum',
  avg: 'avg',
  min: 'min',
  max: 'max',
};

export default {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const { aggregator, associated, collection, association = {}, params = {} } = node.config;
    const options = processor.getParsedValue(params, node.id);
    const { database } = <typeof FlowNodeModel>node.constructor;
    const repo = associated
      ? database.getRepository<HasManyRepository | BelongsToManyRepository>(
          `${association?.associatedCollection}.${association.name}`,
          processor.getParsedValue(association?.associatedKey, node.id),
        )
      : database.getRepository(collection);

    if (!options.dataType && aggregator === 'avg') {
      options.dataType = DataTypes.DOUBLE;
    }

    const result = await repo.aggregate({
      ...options,
      method: aggregators[aggregator],
      transaction: processor.transaction,
    });

    return {
      result: options.dataType === DataTypes.DOUBLE ? Number(result) : result,
      status: JOB_STATUS.RESOLVED,
    };
  },
};
