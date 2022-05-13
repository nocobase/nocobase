import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";

export default {
  async run(this: FlowNodeModel, input, execution) {
    const {
      collection,
      multiple,
      params = {}
    } = this.config;

    const repo = (<typeof FlowNodeModel>this.constructor).database.getRepository(collection);
    const options = execution.getParsedValue(params);
    const result = await (multiple ? repo.find : repo.findOne).call(repo, {
      ...options,
      // NOTE: `raw` to avoid getting undefined value from Proxied model instance (#380)
      // e.g. Object.prototype.hasOwnProperty.call(result, 'id') // false
      // so the properties can not be get by json-templates(object-path)
      raw: true,
      transaction: execution.tx
    });

    return {
      result,
      status: JOB_STATUS.RESOLVED
    };
  }
};
