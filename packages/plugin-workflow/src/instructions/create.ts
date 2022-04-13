import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";

export default {
  async run(this: FlowNodeModel, input, execution) {
    const {
      collection,
      params = {}
    } = this.config;

    const repo = (<typeof FlowNodeModel>this.constructor).database.getRepository(collection);
    const options = execution.getParsedValue(params);
    const result = await repo.create({
      ...options,
      transaction: execution.transaction
    });

    return {
      result,
      status: JOB_STATUS.RESOLVED
    };
  }
}
