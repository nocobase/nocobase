import { Processor, JOB_STATUS } from '..';
import type { FlowNodeModel } from '../types';

export default {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const { sequelize } = (<typeof FlowNodeModel>node.constructor).database;
    const sql = processor.getParsedValue(node.config.sql ?? '', node.id).trim();
    if (!sql) {
      return {
        status: JOB_STATUS.RESOLVED,
      };
    }

    const result = await sequelize.query(sql, {
      transaction: processor.transaction,
      // plain: true,
      // model: db.getCollection(node.config.collection).model
    });

    return {
      result,
      status: JOB_STATUS.RESOLVED,
    };
  },
};
