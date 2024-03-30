import { parseCollectionName } from '@nocobase/data-source-manager';

import { Instruction } from '.';
import type Processor from '../Processor';
import { JOB_STATUS } from '../constants';
import type { FlowNodeModel } from '../types';

export class DestroyInstruction extends Instruction {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const { collection, params = {} } = node.config;

    const [dataSourceName, collectionName] = parseCollectionName(collection);

    const { repository } = this.workflow.app.dataSourceManager.dataSources
      .get(dataSourceName)
      .collectionManager.getCollection(collectionName);
    const options = processor.getParsedValue(params, node.id);
    const result = await repository.destroy({
      ...options,
      context: {
        stack: Array.from(new Set((processor.execution.context.stack ?? []).concat(processor.execution.id))),
      },
      transaction: this.workflow.useDataSourceTransaction(dataSourceName, processor.transaction),
    });

    return {
      result,
      status: JOB_STATUS.RESOLVED,
    };
  }
}

export default DestroyInstruction;
