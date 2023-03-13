import { JOB_STATUS } from "../constants";
import FlowNodeModel from "../models/FlowNode";

export default {
  async run(node: FlowNodeModel, input, processor) {
    const {
      collection,
      params: { appends = [], ...params } = {}
    } = node.config;

    const { repository, model } = (<typeof FlowNodeModel>node.constructor).database.getCollection(collection);
    const options = processor.getParsedValue(params);
    const result = await repository.create({
      ...options,
      context: {
        executionId: processor.execution.id
      },
      transaction: processor.transaction
    });

    if (appends.length) {
      const includeFields = appends.filter(field => !result.get(field) || !result[field]);
      const included = await model.findByPk(result[model.primaryKeyAttribute], {
        attributes: [model.primaryKeyAttribute],
        include: includeFields,
        transaction: processor.transaction
      });
      includeFields.forEach(field => {
        result.set(field, included!.get(field), { raw: true });
      });
    }

    return {
      // NOTE: get() for non-proxied instance (#380)
      result: result.get(),
      status: JOB_STATUS.RESOLVED
    };
  }
}
