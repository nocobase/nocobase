import { parseCollectionName } from '@nocobase/data-source-manager';

import { JOB_STATUS } from '../constants';
import { toJSON } from '../utils';
import type Processor from '../Processor';
import type { FlowNodeModel } from '../types';
import { Instruction } from '.';

export class CreateInstruction extends Instruction {
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
        stack: Array.from(new Set((processor.execution.context.stack ?? []).concat(processor.execution.id))),
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
