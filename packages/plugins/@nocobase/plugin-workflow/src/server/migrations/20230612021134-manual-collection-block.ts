import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';

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

function migrateSchema(schema = {}): object {
  const root = { properties: schema };
  const collectionBlocks = findSchema(root, (item) => {
    return (
      item['x-component'] === 'CardItem' &&
      item['x-designer'] === 'SimpleDesigner' &&
      item['x-decorator'] === 'CollectionProvider_deprecated'
    );
  });

  collectionBlocks.forEach((block) => {
    const id = uid();
    const { grid } = block.properties;
    delete block.properties.grid;
    const fields = findSchema(grid, (item) => {
      return item['x-decorator'] === 'FormItem';
    });
    fields.forEach((field) => {
      Object.assign(field, {
        'x-component': 'CollectionField',
        'x-collection-field': `${block['x-decorator-props'].collection}.${field['x-collection-field']}`,
      });
    });

    Object.assign(block, {
      'x-decorator': 'DetailsBlockProvider',
      'x-decorator-props': {
        ...block['x-decorator-props'],
        dataSource: grid['x-context-datasource'],
      },
      properties: {
        [id]: {
          type: 'void',
          name: id,
          'x-component': 'FormV2',
          'x-use-component-props': 'useDetailsBlockProps',
          properties: {
            grid: {
              type: 'void',
              name: 'grid',
              'x-component': 'Grid',
              'x-initializer': 'details:configureFields',
              properties: grid.properties,
            },
          },
        },
      },
    });
  });

  const customForms = findSchema(root, (item) => {
    return item['x-decorator'] === 'FormCollectionProvider';
  });
  customForms.forEach((item) => {
    Object.assign(item, {
      'x-decorator': 'CustomFormBlockProvider',
    });
  });

  const customFormFields = findSchema(root, (item) => {
    return item['x-interface-options'];
  });
  customFormFields.forEach((field) => {
    const options = field['x-interface-options'];
    delete field['x-interface-options'];
    Object.assign(field, {
      'x-component-props': {
        field: options,
      },
    });
  });

  return schema;
}

export default class extends Migration {
  appVersion = '<0.9.4-alpha.3';
  async up() {
    const match = await this.app.version.satisfies('<0.9.4-alpha.3');
    if (!match) {
      return;
    }
    const { db } = this.context;
    const NodeRepo = db.getRepository('flow_nodes');
    await NodeRepo.collection.sync();
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
            node.set('config', {
              ...config,
              schema: {
                ...migrateSchema(schema),
              },
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
