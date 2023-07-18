import { Processor, FlowNodeModel, JOB_STATUS } from '@nocobase/plugin-workflow/server';

export default {
  async run(node: FlowNodeModel, input, processor: Processor) {
    const { sequelize } = (<typeof FlowNodeModel>node.constructor).database;
    const sql = processor.getParsedValue(node.config.sql ?? '', node);
    const result = await sequelize.query(sql, {
      transaction: processor.transaction,
      plain: true,
    });

    return {
      result,
      status: JOB_STATUS.RESOLVED,
    };
  },
};
