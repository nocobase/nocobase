import FlowNodeModel from "../models/FlowNode";
import Processor from "../Processor";
import { JOB_STATUS } from "../constants";

export default {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const {
      collection,
      multiple = false,
      params = {}
    } = node.config;

    const repo = (<typeof FlowNodeModel>node.constructor).database.getRepository(collection);
    const options = processor.getParsedValue(params);
    const result = await repo.update({
      ...options,
      transaction: processor.transaction
    });

    return {
      result: multiple ? result : (result[0] || null),
      status: JOB_STATUS.RESOLVED
    };
  }
}
