import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import lodash from 'lodash';

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

function findParent(root, node) {
  return findSchema(root, (item) => item.properties && Object.values(item.properties).includes(node))[0];
}

// 1. all form blocks combine into one, at first form block position
// 2. add fields move to the form
// 3. remove all other form blocks except first (should remove ancestors till grid)
// 4. add 'x-interface-options' property to all fields as collection field
// 5. make collection fields decorator as `FormCollectionProvider` for form block
// 6. add form component wrapper for form grid
// 7. move action footer to form block
function migrateConfig({ schema = {}, actions = [] }: { schema: any; actions: number[] }): object {
  const { blocks, collection } = schema;
  if (!blocks) {
    return {
      forms: {},
    };
  }
  const root = { properties: blocks };
  const formBlocks = findSchema(root, (item) => {
    return (
      item['x-component'] === 'CardItem' &&
      item['x-designer'] === 'SimpleDesigner' &&
      item.properties.grid['x-initializer'] === 'AddFormField'
    );
  });
  if (!formBlocks.length) {
    return {
      schema: blocks,
      forms: {},
    };
  }

  // 1.
  formBlocks.forEach((formBlock, i) => {
    const formItems = findSchema(
      formBlock,
      (item) => {
        return item['x-component'] === 'CollectionField' && item['x-decorator'] === 'FormItem';
      },
      true,
    );
    // 4.
    formItems.forEach((item) => {
      Object.assign(item, {
        'x-interface-options': collection.fields.find((field) => field.name === item.name),
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
      collection,
    },
    'x-component-props': {
      title: '{{t("Form")}}',
    },
    'x-designer-props': {
      type: 'customForm',
    },
  });

  const formId = uid();
  // 6.
  const newFormBlock = {
    [formId]: {
      type: 'void',
      'x-component': 'FormV2',
      'x-component-props': {
        useProps: '{{ useFormBlockProps }}',
      },
      properties: {
        grid: Object.assign(formBlock.properties.grid, {
          'x-initializer': 'workflowManual:customForm:configureFields',
        }),
        // 7.
        actions: {
          type: 'void',
          'x-decorator': 'ActionBarProvider',
          'x-component': 'ActionBar',
          'x-component-props': {
            layout: 'one-column',
            style: {
              marginTop: '1.5em',
            },
          },
          'x-initializer': 'workflowManual:form:configureActions',
          properties: schema.actions,
        },
      },
    },
  };
  delete formBlock.properties.grid;
  Object.assign(formBlock.properties, newFormBlock);

  return {
    schema: blocks,
    forms: {
      [formId]: {
        type: 'custom',
        title: '{{t("Form")}}',
        actions,
        collection,
      },
    },
  };
}

function migrateUsedConfig(config, manualForms) {
  Object.keys(config).forEach((key) => {
    const valueType = typeof config[key];
    if (valueType === 'string') {
      config[key] = config[key].replace(/{{\s*\$jobsMapByNodeId\.(\d+)(\.[^}]+)?\s*}}/g, (matched, id, path) => {
        if (!manualForms[id]) {
          return matched;
        }
        return `{{$jobsMapByNodeId.${id}.${manualForms[id]}${path || ''}}}`;
      });
    } else if (valueType === 'object' && config[key]) {
      migrateUsedConfig(config[key], manualForms);
    }
  });
  return config;
}

export default class extends Migration {
  appVersion = '<0.9.1-alpha.3';
  async up() {
    const match = await this.app.version.satisfies('<0.9.1-alpha.3');
    if (!match) {
      return;
    }
    const { db } = this.context;
    const NodeRepo = db.getRepository('flow_nodes');
    const UserJobRepo = db.getRepository('users_jobs');
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
            const { forms, schema, actions, ...config } = node.config;
            if (forms) {
              return;
            }
            return node.update(
              {
                config: {
                  ...config,
                  ...migrateConfig({ schema, actions }),
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

      const usersJobs = await UserJobRepo.find({
        filter: {
          nodeId: nodes.map((item) => item.id),
        },
        appends: ['job', 'node'],
        transaction,
      });
      // update all results
      await usersJobs.reduce(
        (promise, userJob) =>
          promise.then(async () => {
            const { result, job, node } = userJob;
            const { forms } = node.config;
            const [formId] = Object.keys(forms);
            if (result) {
              await userJob.update(
                {
                  result: { [formId]: result },
                },
                {
                  silent: true,
                  transaction,
                },
              );
            }
            if (job.result) {
              await job.update(
                {
                  result: { [formId]: result },
                },
                {
                  silent: true,
                  transaction,
                },
              );
            }
          }),
        Promise.resolve(),
      );

      const usedNodes = await NodeRepo.find({
        filter: {
          type: {
            $notIn: ['delay', 'parallel'],
          },
        },
        transaction,
      });

      const nodeForms = {};
      nodes.forEach((node) => {
        const [form] = Object.keys(node.config.forms);
        if (form) {
          nodeForms[node.id] = form;
        }
      });

      await usedNodes.reduce(
        (promise, node) =>
          promise.then(async () => {
            await node.update(
              {
                config: migrateUsedConfig(lodash.cloneDeep(node.config ?? {}), nodeForms),
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
