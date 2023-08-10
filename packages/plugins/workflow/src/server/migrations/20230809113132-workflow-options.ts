import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<0.11.0-alpha.2');
    if (!match) {
      return;
    }
    const { db } = this.context;
    const WorkflowRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      const workflows = await WorkflowRepo.find({
        transaction,
      });

      await workflows.reduce(
        (promise, workflow) =>
          promise.then(() => {
            workflow.set('options', {
              useTransaction: workflow.get('useTransaction'),
            });
            workflow.changed('options', true);
            return workflow.save({
              silent: true,
              transaction,
            });
          }),
        Promise.resolve(),
      );
    });
  }
}
