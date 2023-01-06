import { BlockInitializers } from '@nocobase/client';

import { VariableComponent } from '../../calculators';
import { NAMESPACE } from '../../locale';
import { ValueGetter } from './ValueGetter';
import { SchemaConfig } from './SchemaConfig';
import { NullRender } from '../../components/NullRender';
import { ModeConfig } from './ModeConfig';



// TODO(optimize): change to register way
const initializerGroup = BlockInitializers.items.find(group => group.key ==='media');
if (!initializerGroup.children.find(item => item.key === 'workflowTodos')) {
  initializerGroup.children.push({
    key: 'workflowTodos',
    type: 'item',
    title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
    component: 'WorkflowTodoBlockInitializer'
  });
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
      'x-component': 'RemoteSelect',
      'x-component-props': {
        multiple: true,
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
        service: {
          resource: 'users'
        },
      },
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
      title: `{{t("Operation user interface", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        title: `{{t("Configure user interface", { ns: "${NAMESPACE}" })}}`,
      },
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
    VariableComponent,
    SchemaConfig,
    ModeConfig
  },
  useValueGetter({ config }) {
    if (!config.form?.collection?.fields?.length) {
      return NullRender;
    }
    return ValueGetter;
  }
};
