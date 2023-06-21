import FlowNodeModel from '../models/FlowNode';
import Processor from '../Processor';
import { JOB_STATUS } from '../constants';

export default {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const { collection, params = {} } = node.config;

    const repo = (<typeof FlowNodeModel>node.constructor).database.getRepository(collection);
    const options = processor.getParsedValue(params, node);
    const result = await repo.update({
      ...options,
      context: {
        executionId: processor.execution.id,
      },
      transaction: processor.transaction,
    });

    return {
      result: result.length ?? result,
      status: JOB_STATUS.RESOLVED,
    };
  },
};
