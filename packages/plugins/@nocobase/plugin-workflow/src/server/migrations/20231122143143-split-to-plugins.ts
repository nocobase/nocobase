import { Migration } from '@nocobase/server';

export default class extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<0.16.0-alpha.4');
    if (!match) {
      return;
    }
    const { db } = this.context;

    const PluginRepo = db.getRepository('applicationPlugins');
    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      await PluginRepo.createMany({
        records: [
          {
            name: '@nocobase/plugin-workflow-dynamic-calculation',
            packageName: '@nocobase/plugin-workflow-dynamic-calculation',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
          {
            name: '@nocobase/plugin-workflow-manual',
            packageName: '@nocobase/plugin-workflow-manual',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
          {
            name: '@nocobase/plugin-workflow-loop',
            packageName: '@nocobase/plugin-workflow-loop',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
          {
            name: '@nocobase/plugin-workflow-parallel',
            packageName: '@nocobase/plugin-workflow-parallel',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
          {
            name: '@nocobase/plugin-workflow-delay',
            packageName: '@nocobase/plugin-workflow-delay',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
          {
            name: '@nocobase/plugin-workflow-aggregate',
            packageName: '@nocobase/plugin-workflow-aggregate',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
          {
            name: '@nocobase/plugin-workflow-sql',
            packageName: '@nocobase/plugin-workflow-sql',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
          {
            name: '@nocobase/plugin-workflow-request',
            packageName: '@nocobase/plugin-workflow-request',
            version: '0.16.0-alpha.3',
            enabled: true,
            installed: true,
          },
        ],
        transaction,
      });
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
