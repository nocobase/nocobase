import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";

export default {
  async run(this: FlowNodeModel, input, execution) {
    const {
      collection,
      params = {}
    } = this.config;

    const repo = (<typeof FlowNodeModel>this.constructor).database.getRepository(collection);
    const result = await repo.create(execution.getParsedValue(params));

    return {
      result,
      status: JOB_STATUS.RESOLVED
    };
  }
}
