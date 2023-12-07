import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<0.17.0-alpha.4');
    if (!match) {
      return;
    }
    const { db } = this.context;

    const PluginModel = db.getModel('applicationPlugins');
    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      await [
        '@nocobase/plugin-workflow-aggregate',
        '@nocobase/plugin-workflow-delay',
        '@nocobase/plugin-workflow-dynamic-calculation',
        '@nocobase/plugin-workflow-loop',
        '@nocobase/plugin-workflow-manual',
        '@nocobase/plugin-workflow-parallel',
        '@nocobase/plugin-workflow-request',
        '@nocobase/plugin-workflow-sql',
        '@nocobase/plugin-workflow-form-trigger',
      ].reduce(
        (promise, packageName) =>
          promise.then(async () => {
            const existed = await PluginModel.findOne({ where: { packageName }, transaction });
            if (!existed) {
              await PluginModel.create(
                {
                  name: packageName,
                  packageName,
                  version: '0.17.0-alpha.1',
                  enabled: true,
                  installed: true,
                  builtin: true,
                },
                { transaction },
              );
            }
          }),
        Promise.resolve(),
      );

      const nodes = await NodeRepo.find({
        transaction,
      });

      await nodes.reduce(
        (promise, node) =>
          promise.then(() => {
            if (node.type === 'calculation' && node.config.dynamic) {
              node.set({
                type: 'dynamic-calculation',
                config: {
                  expression: node.config.dynamic,
                  scope: node.config.scope,
                },
              });
              node.changed('config', true);
            }

            return node.save({
              silent: true,
              transaction,
            });
          }),
        Promise.resolve(),
      );
    });
  }
}
