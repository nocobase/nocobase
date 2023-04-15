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
    Object.keys(root.properties).forEach(key => {
      result.push(...findSchema(root.properties[key], filter));
    });
  }
  return result;
}

function findParent(root, node) {
  return findSchema(root, item => item.properties && Object.values(item.properties).includes(node))[0];
}

// 1. all form blocks combine into one, at first form block position
// 2. add fields move to the form
// 3. remove all other form blocks except first (should remove ancestors till grid)
// 4. add 'x-interface-options' property to all fields as collection field
// 5. make collection fields decorator as `FormCollectionProvider` for form block
// 6. add form component wrapper for form grid
// 7. move action footer to form block
function migrateConfig({ schema = {}, actions = [] }: { schema: any; actions: number[] }): Object {
  const { blocks, collection } = schema;
  if (!blocks) {
    return {
      forms: {}
    };
  }
  const root = { properties: blocks };
  const formBlocks = findSchema(root, (item) => {
    return item['x-component'] === 'CardItem'
      && item['x-designer'] === 'SimpleDesigner'
      && item.properties.grid['x-initializer'] === 'AddFormField';
  });
  if (!formBlocks.length) {
    return {
      schema: blocks,
      forms: {}
    };
  }

  // 1.
  formBlocks.forEach((formBlock, i) => {
    const formItems = findSchema(formBlock, (item) => {
      return item['x-component'] === 'CollectionField'
        && item['x-decorator'] === 'FormItem';
    }, true);
    // 4.
    formItems.forEach(item => {
      Object.assign(item, {
        'x-interface-options': collection.fields.find(field => field.name === item.name)
      });
    });
    // skip first form block
    if (!i) {
      return;
    }
    // 2.
    Object.assign(formBlocks[0].properties.grid.properties, formBlock.properties.grid.properties);

    // 3.
    const col = findParent(root, formBlock);
    const row = findParent(root, col);
    delete row.properties[col.name];
    if (!Object.keys(row.properties).length) {
      const grid = findParent(root, row);
      delete grid.properties[row.name];
    }
  });

  // 5.
  const [formBlock] = formBlocks;
  Object.assign(formBlock, {
    'x-decorator': 'FormCollectionProvider',
    'x-decorator-props': {
      collection
    }
  });

  const formId = uid();
  // 6.
  const newFormBlock = {
    [formId]: {
      type: 'void',
      'x-component': 'FormV2',
      'x-component-props': {
        useProps: '{{ useFormProps }}'
      },
      properties: {
        grid: Object.assign(formBlock.properties.grid, {
          'x-initializer': 'AddCustomFormField'
        }),
        // 7.
        actions: Object.assign(schema.actions, {
          'x-decorator': 'ActionBarProvider',
          'x-component-props': {
            layout: 'one-column',
            style: {
              marginTop: '1.5em',
            },
          }
        })
      }
    }
  };
  delete formBlock.properties.grid;
  Object.assign(formBlock.properties, newFormBlock);

  return {
    schema: blocks,
    forms: {
      [formId]: {
        type: 'custom',
        actions
      }
    }
  };
}



export default class extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<=0.9.1-alpha.2');
    if (!match) {
      return;
    }
    const { db } = this.context;
    const NodeRepo = db.getRepository('flow_nodes');
    await db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: 'manual'
        },
        transaction
      });
      console.log('%d nodes need to be migrated.', nodes.length);

      await nodes.reduce((promise, node) => promise.then(() => {
        const { schema, actions, ...config } = node.config;
        return node.update({
          config: {
            ...config,
            ...migrateConfig({ schema, actions })
          }
        }, {
          transaction
        });
      }), Promise.resolve());
    });
  }
}


// find fields in nodes which has { "x-initializer": "AddCustomFormField" }
