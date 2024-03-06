import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.19.0-alpha.10';
  on = 'afterSync';
  async up() {
    const { db } = this.context;

    const WorkflowRepo = db.getRepository('workflows');
    await db.sequelize.transaction(async (transaction) => {
      await WorkflowRepo.update({
        filter: {
          type: 'form',
        },
        values: {
          type: 'action',
        },
        transaction,
      });
    });
  }
}
