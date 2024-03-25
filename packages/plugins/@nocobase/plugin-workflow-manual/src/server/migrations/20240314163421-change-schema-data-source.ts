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

function migrateSchema(schema) {
  const root = { properties: schema };

  const [node] = findSchema(root, (item) => {
    return (
      item['x-decorator'] === 'DetailsBlockProvider' &&
      item['x-component'] === 'CardItem' &&
      item['x-designer'] === 'SimpleDesigner'
    );
  });

  if (node && node['x-decorator-props']?.dataSource) {
    node['x-decorator-props'].dataPath = node['x-decorator-props'].dataSource.replace(/^{{|}}$/g, '');
    delete node['x-decorator-props'].dataSource;
  }

  return schema;
}

export default class extends Migration {
  async up() {
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
            const { schema, ...config } = node.config;
            return node.update(
              {
                config: {
                  ...config,
                  ...migrateSchema(schema),
                },
              },
              {
                silent: true,
                transaction,
              },
            );
          }),
        Promise.resolve(),
      );
    });
  }
}
