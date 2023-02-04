import { BlockInitializers, SchemaInitializerItemOptions } from '@nocobase/client';

import { CollectionBlockInitializer } from '../../components/CollectionBlockInitializer';
import { CollectionFieldInitializers } from '../../components/CollectionFieldInitializers';
import { filterTypedFields } from '../../variable';
import { NAMESPACE } from '../../locale';
import { SchemaConfig, SchemaConfigButton } from './SchemaConfig';
import { ModeConfig } from './ModeConfig';
import { AssigneesSelect } from './AssigneesSelect';


const MULTIPLE_ASSIGNED_MODE = {
  SINGLE: Symbol('single'),
  ALL: Symbol('all'),
  ANY: Symbol('any'),
  ALL_PERCENTAGE: Symbol('all percentage'),
  ANY_PERCENTAGE: Symbol('any percentage')
};

// TODO(optimize): change to register way
const initializerGroup = BlockInitializers.items.find(group => group.key ==='media');
if (!initializerGroup.children.find(item => item.key === 'workflowTodos')) {
  initializerGroup.children.push({
    key: 'workflowTodos',
    type: 'item',
    title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
    component: 'WorkflowTodoBlockInitializer',
    icon: 'CheckSquareOutlined',
  } as any);
}

export default {
  title: `{{t("Manual", { ns: "${NAMESPACE}" })}}`,
  type: 'manual',
  group: 'manual',
  fieldset: {
    'config.assignees': {
      type: 'array',
      name: 'config.assignees',
      title: `{{t("Assignees", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'AssigneesSelect',
      'x-component-props': {
        // multiple: true,
        // fieldNames: {
        //   label: 'nickname',
        //   value: 'id',
        // },
        // service: {
        //   resource: 'users'
        // },
      },
      required: true,
      default: [],
    },
    'config.mode': {
      type: 'number',
      name: 'config.mode',
      title: `{{t("Mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'ModeConfig',
      default: 1,
      'x-reactions': {
        dependencies: ['config.assignees'],
        fulfill: {
          state: {
            visible: '{{$deps[0].length > 1}}',
          },
        },
      }
    },
    'config.schema': {
      type: 'void',
      title: `{{t("User interface", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'SchemaConfigButton',
      properties: {
        schema: {
          type: 'object',
          'x-component': 'SchemaConfig',
        },
      }
    },
  },
  view: {

  },
  scope: {
  },
  components: {
    SchemaConfigButton,
    SchemaConfig,
    ModeConfig,
    AssigneesSelect
  },
  getOptions(config, types) {
    const fields = filterTypedFields(config.schema?.collection?.fields ?? [], types);
    return fields.length ? fields : null;
  },
  useInitializers(node): SchemaInitializerItemOptions | null {
    if (!node.config.schema?.collection?.fields?.length
      || node.config.mode
    ) {
      return null;
    }

    return {
      type: 'item',
      title: node.title ?? `#${node.id}`,
      component: CollectionBlockInitializer,
      collection: node.config.schema.collection,
      dataSource: `{{$jobsMapByNodeId.${node.id}}}`
    }
  },
  initializers: {
    CollectionFieldInitializers
  }
};
