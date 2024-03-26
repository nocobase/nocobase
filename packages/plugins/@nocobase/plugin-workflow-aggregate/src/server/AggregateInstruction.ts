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
  async run(node: FlowNodeModel, input, processor: Processor) {
    const { aggregator, associated, collection, association = {}, params = {} } = node.config;
    const options = processor.getParsedValue(params, node.id);
    const [dataSourceName, collectionName] = parseCollectionName(collection);
    const { collectionManager } = this.workflow.app.dataSourceManager.dataSources.get(dataSourceName);
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
      // transaction: processor.transaction,
    });

    return {
      result: options.dataType === DataTypes.DOUBLE ? Number(result) : result,
      status: JOB_STATUS.RESOLVED,
    };
  }
}
