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
    const result = await repo.update(execution.getParsedValue(params));

    return {
      result: multiple ? result : (result[0] || null),
      status: JOB_STATUS.RESOLVED
    };
  }
}
