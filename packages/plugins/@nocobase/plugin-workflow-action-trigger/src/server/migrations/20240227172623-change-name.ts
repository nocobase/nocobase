import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<0.19.0-alpha.10';
  on = 'beforeSync';
  async up() {
    const { db } = this.context;

    const WorkflowRepo = db.getRepository('workflows');
    const PluginRepo = db.getRepository('applicationPlugins');
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

      await PluginRepo.update({
        filter: {
          packageName: '@nocobase/plugin-workflow-form-trigger',
        },
        values: {
          name: 'workflow-action-trigger',
          packageName: '@nocobase/plugin-workflow-action-trigger',
        },
        transaction,
      });
    });
  }
}
