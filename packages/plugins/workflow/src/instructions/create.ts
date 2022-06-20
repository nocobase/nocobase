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
    const result = await repo.create({
      ...options,
      transaction: processor.transaction
    });

    return {
      // NOTE: get() for non-proxied instance (#380)
      result: result.get(),
      status: JOB_STATUS.RESOLVED
    };
  }
}
