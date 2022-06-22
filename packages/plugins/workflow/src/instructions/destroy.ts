import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";

export default {
  async run(this: FlowNodeModel, input, processor) {
    const {
      collection,
      params = {}
    } = this.config;

    const repo = (<typeof FlowNodeModel>this.constructor).database.getRepository(collection);
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
