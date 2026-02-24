/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import React from 'react';
import { useForm } from '@formily/react';
import {
  parseCollectionName,
  RemoteSelect,
  SchemaInitializerItemType,
  useCollectionDataSource,
  useCompile,
} from '@nocobase/client';
import {
  Trigger,
  CollectionBlockInitializer,
  getCollectionFieldOptions,
  useGetDataSourceCollectionManager,
  TriggerCollectionRecordSelect,
  WorkflowVariableWrapper,
  RadioWithTooltip,
  useWorkflowAnyExecuted,
} from '@nocobase/plugin-workflow/client';

import { NAMESPACE, lang } from './locale';
import { TriggerScopeProvider } from './components';
import { CONTEXT_TYPE, CONTEXT_TYPE_OPTIONS } from '../common/constants';
import { SubModelItem } from '@nocobase/flow-engine';

function useVariables(config, options) {
  const [dataSourceName] = parseCollectionName(config.collection);
  const compile = useCompile();
  const collectionManager = useGetDataSourceCollectionManager(dataSourceName);
  const mainCollectionManager = useGetDataSourceCollectionManager();
  if (config.global) {
    return null;
  }
  const userFields = getCollectionFieldOptions({
    // depth,
    appends: ['user'],
    ...options,
    fields: [
      {
        collectionName: 'users',
        name: 'user',
        type: 'hasOne',
        target: 'users',
        uiSchema: {
          title: lang('User acted'),
        },
      },
    ],
    compile,
    collectionManager: mainCollectionManager,
  });
  return [
    ...getCollectionFieldOptions({
      appends: ['data', ...(config.appends?.map((item) => `data.${item}`) || [])],
      ...options,
      fields: [
        {
          collectionName: config.collection,
          name: 'data',
          type: 'hasOne',
          target: config.collection,
          uiSchema: {
            title: lang('Trigger data'),
          },
        },
      ],
      compile,
      collectionManager,
    }),
    ...userFields,
    {
      label: lang('Role of user acted'),
      value: 'roleName',
    },
  ];
}

export default class extends Trigger {
  title = `{{t("Custom action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('When the "Trigger Workflow" button is clicked, the event is triggered based on different context where the button is located. For complex data processing that cannot be handled simply by built-in operations (CRUD) of NocoBase, you can define a series of operations through a workflow and trigger it with the "Trigger Workflow" button.', { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    type: {
      type: 'number',
      title: `{{t("Context type", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: CONTEXT_TYPE_OPTIONS,
      },
      default: CONTEXT_TYPE.GLOBAL,
      'x-disabled': '{{ useWorkflowAnyExecuted() }}',
    },
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceCollectionCascader',
      'x-disabled': '{{ useWorkflowAnyExecuted() }}',
      ['x-reactions']: [
        {
          target: 'appends',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: [],
            },
          },
        },
        {
          dependencies: ['type'],
          fulfill: {
            state: {
              visible: '{{Boolean($deps[0])}}',
            },
          },
        },
      ],
    },
    appends: {
      type: 'array',
      title: `{{t("Associations to use", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.", { ns: "workflow" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'AppendsTreeSelect',
      'x-component-props': {
        multiple: true,
        useCollection() {
          const { values } = useForm();
          return values?.collection;
        },
      },
      'x-reactions': [
        {
          dependencies: ['collection'],
          fulfill: {
            state: {
              visible: '{{!!$deps[0]}}',
            },
          },
        },
      ],
    },
  };
  triggerFieldset = {
    data: {
      type: 'void',
      'x-component': 'TriggerScopeProvider',
      'x-component-props': {
        types: [CONTEXT_TYPE.SINGLE_RECORD],
      },
      properties: {
        data: {
          type: 'object',
          title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
          description: `{{t("Choose a record or primary key of a record in the collection to trigger.", { ns: "workflow" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'TriggerCollectionRecordSelect',
          default: null,
          required: true,
        },
      },
    },
    filterByTk: {
      type: 'void',
      'x-component': 'TriggerScopeProvider',
      'x-component-props': {
        types: [CONTEXT_TYPE.MULTIPLE_RECORDS],
      },
      properties: {
        filterByTk: {
          type: 'array',
          title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
          description: `{{t("Choose a record or primary key of a record in the collection to trigger.", { ns: "workflow" })}}`,
          'x-decorator': 'FormItem',
          'x-component': 'TriggerCollectionRecordSelect',
          'x-component-props': {
            multiple: true,
            objectValue: false,
          },
          default: [],
          required: true,
        },
      },
    },
    userId: {
      type: 'number',
      title: `{{t("User acted", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableWrapper',
      'x-component-props': {
        nullable: false,
        changeOnSelect: true,
        variableOptions: {
          types: [
            (field) => {
              if (field.isForeignKey || field.type === 'context') {
                return field.target === 'users';
              }
              return field.collectionName === 'users' && field.name === 'id';
            },
          ],
        },
        render(props) {
          return (
            <RemoteSelect
              fieldNames={{ label: 'nickname', value: 'id' }}
              service={{ resource: 'users' }}
              manual={false}
              {...props}
            />
          );
        },
      },
      default: null,
      required: true,
    },
    roleName: {
      type: 'string',
      title: `{{t("Role of user acted", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'WorkflowVariableWrapper',
      'x-component-props': {
        nullable: false,
        changeOnSelect: true,
        variableOptions: {
          types: [
            (field) => {
              if (field.isForeignKey) {
                return field.target === 'roles';
              }
              return field.collectionName === 'roles' && field.name === 'name';
            },
          ],
        },
        render(props) {
          return (
            <RemoteSelect
              fieldNames={{ label: 'title', value: 'name' }}
              service={{ resource: 'roles' }}
              manual={false}
              {...props}
            />
          );
        },
      },
      default: null,
    },
  };
  validate(values) {
    return (
      !values.type ||
      values.type === CONTEXT_TYPE.GLOBAL ||
      ([CONTEXT_TYPE.SINGLE_RECORD, CONTEXT_TYPE.MULTIPLE_RECORDS].includes(values.type) && values.collection)
    );
  }
  scope = {
    useWorkflowAnyExecuted,
    useCollectionDataSource,
  };
  components = {
    TriggerScopeProvider,
    TriggerCollectionRecordSelect,
    WorkflowVariableWrapper,
    RadioWithTooltip,
  };
  isActionTriggerable_deprecated = (config, context) => {
    return context.buttonAction === 'customize:triggerWorkflows' && config.type === CONTEXT_TYPE.SINGLE_RECORD;
  };
  useVariables = useVariables;
  useInitializers(config): SchemaInitializerItemType | null {
    if (config.global || !config.collection) {
      return null;
    }

    return {
      name: 'triggerData',
      type: 'item',
      key: 'triggerData',
      title: `{{t("Trigger data", { ns: "workflow" })}}`,
      Component: CollectionBlockInitializer,
      collection: config.collection,
      dataPath: '$context.data',
    };
  }

  /**
   * 2.0
   */
  getCreateModelMenuItem({ config }): SubModelItem {
    if (!config.collection) {
      return null;
    }

    return {
      key: 'triggerData',
      label: `{{t("Trigger data", { ns: "workflow" })}}`,
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        use: 'NodeDetailsModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: config.collection,
              dataPath: '$context.data',
            },
          },
          cardSettings: {
            titleDescription: {
              title: `{{t("Trigger data", { ns: "workflow" })}}`,
            },
          },
        },
        subModels: {
          grid: {
            use: 'NodeDetailsGridModel',
            subType: 'object',
          },
        },
      },
    };
  }
}
