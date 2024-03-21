import { Migration } from '@nocobase/server';

function findSchema(root, filter, onlyLeaf = false) {
  const result = [];

  if (!root) {
    return result;
  }

  if (filter(root) && (!onlyLeaf || !root.properties)) {
    result.push(root);
    return result;
  }

  if (root.properties) {
    Object.keys(root.properties).forEach((key) => {
      result.push(...findSchema(root.properties[key], filter));
    });
  }
  return result;
}

function migrateConfig(config): object {
  const { forms = {}, schema = {} } = config;
  const root = { properties: schema };
  Object.keys(forms).forEach((key) => {
    const form = forms[key];
    const formSchema = findSchema(root, (item) => item.name === key);
    const actions = findSchema(formSchema[0], (item) => item['x-component'] === 'Action');
    form.actions = actions.map((action) => {
      action['x-designer'] = 'ManualActionDesigner';
      action['x-action-settings'] = {};
      delete action['x-action'];
      return {
        status: action['x-decorator-props'].value,
        values: {},
        key: action.name,
      };
    });
  });

  return config;
}

export default class extends Migration {
  appVersion = '<0.11.0-alpha.2';
  async up() {
    const match = await this.app.version.satisfies('<0.11.0-alpha.2');
    if (!match) {
      return;
    }
    const { db } = this.context;
    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: 'manual',
        },
        transaction,
      });
      console.log('%d nodes need to be migrated.', nodes.length);

      await nodes.reduce(
        (promise, node) =>
          promise.then(() => {
            node.set('config', {
              ...migrateConfig(node.config),
            });
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
