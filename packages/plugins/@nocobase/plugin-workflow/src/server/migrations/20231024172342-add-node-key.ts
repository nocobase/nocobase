import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import { DataTypes } from 'sequelize';

function migrateNodeConfig(config = {}, nodesMap) {
  Object.keys(config).forEach((key) => {
    const valueType = typeof config[key];
    if (valueType === 'string') {
      config[key] = config[key]
        .replace(/{{\s*\$jobsMapByNodeId\.(\d+)(\.[^}]+)?\s*}}/g, (matched, id, path) => {
          return `{{$jobsMapByNodeKey.${nodesMap[id].key}${path || ''}}}`;
        })
        .replace(/{{\s*\$scopes\.(\d+)(\.[^}]+)?\s*}}/g, (matched, id, path) => {
          return `{{$scopes.${nodesMap[id].key}${path || ''}}}`;
        });
    } else if (valueType === 'object' && config[key]) {
      migrateNodeConfig(config[key], nodesMap);
    }
  });
  return config;
}

export default class extends Migration {
  appVersion = '<0.14.0-alpha.8';
  async up() {
    const match = await this.app.version.satisfies('<0.14.0-alpha.8');
    if (!match) {
      return;
    }
    const { db } = this.context;

    const NodeCollection = db.getCollection('flow_nodes');
    const NodeRepo = NodeCollection.repository;
    const tableName = NodeCollection.getTableNameWithSchema();
    await db.sequelize.transaction(async (transaction) => {
      if (!(await NodeCollection.getField('key').existsInDb())) {
        await this.queryInterface.addColumn(tableName, 'key', DataTypes.STRING, {
          transaction,
        });
      }
      const nodes = await NodeRepo.find({
        transaction,
      });

      const nodesMap = nodes.reduce((map, node) => {
        map[node.id] = node;
        if (!node.get('key')) {
          node.set('key', uid());
        }
        return map;
      }, {});

      await nodes.reduce(
        (promise, node) =>
          promise.then(() => {
            node.set('config', migrateNodeConfig(node.config, nodesMap));
            node.changed('config', true);
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
