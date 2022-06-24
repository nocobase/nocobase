import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";

export default {
  async run(node: FlowNodeModel, input, processor) {
    const {
      collection,
      params = {}
    } = node.config;

    const repo = (<typeof FlowNodeModel>node.constructor).database.getRepository(collection);
    const options = processor.getParsedValue(params);
    const result = await repo.destroy({
      ...options,
      transaction: processor.transaction
    });

    return {
      result,
      status: JOB_STATUS.RESOLVED
    };
  }
}
