import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";

export default {
  async run(this: FlowNodeModel, input, execution) {
    const {
      collection,
      multiple = false,
      params = {}
    } = this.config;

    const repo = (<typeof FlowNodeModel>this.constructor).database.getRepository(collection);
    const options = execution.getParsedValue(params);
    const result = await repo.update({
      ...options,
      transaction: execution.tx
    });

    return {
      result: multiple ? result : (result[0] || null),
      status: JOB_STATUS.RESOLVED
    };
  }
}
