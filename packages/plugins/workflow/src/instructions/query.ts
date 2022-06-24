import FlowNodeModel from "../models/FlowNode";
import Processor from "../Processor";
import { JOB_STATUS } from "../constants";

export default {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const {
      collection,
      multiple,
      params = {}
    } = node.config;

    const repo = (<typeof FlowNodeModel>node.constructor).database.getRepository(collection);
    const options = processor.getParsedValue(params);
    const result = await (multiple ? repo.find : repo.findOne).call(repo, {
      ...options,
      transaction: processor.transaction
    });

    // NOTE: `toJSON()` to avoid getting undefined value from Proxied model instance (#380)
    // e.g. Object.prototype.hasOwnProperty.call(result, 'id') // false
    // so the properties can not be get by json-templates(object-path)
    return {
      result: multiple ? result.map(item => item.toJSON()) : result?.toJSON(),
      status: JOB_STATUS.RESOLVED
    };
  }
};
