import { Processor, Instruction, JOB_STATUS, FlowNodeModel } from '@nocobase/plugin-workflow';

export default class extends Instruction {
  async run(node: FlowNodeModel, input, processor: Processor) {
    // @ts-ignore
    const { db } = this.workflow.app.dataSourceManager.dataSources.get(
      node.config.dataSource || 'main',
    ).collectionManager;
    if (!db) {
      console.error('--------------- data source is not a database');
      throw new Error(`type of data source "${node.config.dataSource}" is not database`);
    }
    const sql = processor.getParsedValue(node.config.sql || '', node.id).trim();
    if (!sql) {
      return {
        status: JOB_STATUS.RESOLVED,
      };
    }

    try {
      // @ts-ignore
      const result = await db.sequelize.query(sql, {
        transaction: processor.transaction,
        // plain: true,
        // model: db.getCollection(node.config.collection).model
      });
      console.log('----------', result);

      return {
        result,
        status: JOB_STATUS.RESOLVED,
      };
    } catch (ex) {
      console.error('--------------- sql error', ex);
      throw ex;
    }
  }
}
