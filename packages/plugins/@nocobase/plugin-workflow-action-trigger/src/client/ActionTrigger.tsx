/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';

import {
  SchemaInitializerItemType,
  parseCollectionName,
  useCollectionDataSource,
  useCompile,
  RemoteSelect,
} from '@nocobase/client';
import {
  Trigger,
  CollectionBlockInitializer,
  getCollectionFieldOptions,
  useWorkflowAnyExecuted,
  CheckboxGroupWithTooltip,
  RadioWithTooltip,
  useGetDataSourceCollectionManager,
  TriggerCollectionRecordSelect,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client';
import { NAMESPACE, useLang } from '../locale';
import React from 'react';

const COLLECTION_TRIGGER_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  UPSERT: 'updateOrCreate',
  DESTROY: 'destroy',
};

function useVariables(config, options) {
  const [dataSourceName, collection] = parseCollectionName(config.collection);
  const compile = useCompile();
  const collectionManager = useGetDataSourceCollectionManager(dataSourceName);
  const mainCollectionManager = useGetDataSourceCollectionManager();

  const langTriggerData = useLang('Trigger data');
  const langUserSubmittedForm = useLang('User acted');
  const langRoleSubmittedForm = useLang('Role of user acted');
  const result = [
    ...getCollectionFieldOptions({
      // depth,
      appends: ['data', ...(config.appends?.map((item) => `data.${item}`) || [])],
      ...options,
      fields: [
        {
          collectionName: collection,
          name: 'data',
          type: 'hasOne',
          target: collection,
          uiSchema: {
            title: langTriggerData,
          },
        },
      ],
      compile,
      collectionManager,
    }),
    ...getCollectionFieldOptions({
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
            title: langUserSubmittedForm,
          },
        },
        {
          name: 'roleName',
          uiSchema: {
            title: langRoleSubmittedForm,
          },
        },
      ],
      compile,
      collectionManager: mainCollectionManager,
    }),
  ];
  return result;
}

export default class extends Trigger {
  title = `{{t("Post-action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('Triggered after the completion of a request initiated through an action button or API, such as after adding or updating data. Suitable for data processing, sending notifications, etc., after actions are completed.', { ns: "${NAMESPACE}" })}}`;
  fieldset = {
    collection: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        tooltip: `{{t("The collection to which the triggered data belongs.", { ns: "${NAMESPACE}" })}}`,
      },
      'x-component': 'DataSourceCollectionCascader',
      'x-disabled': '{{ useWorkflowAnyExecuted() }}',
      title: `{{t("Collection", { ns: "${NAMESPACE}" })}}`,
      'x-reactions': [
        {
          target: 'appends',
          effects: ['onFieldValueChange'],
          fulfill: {
            state: {
              value: [],
            },
          },
        },
      ],
    },
    global: {
      type: 'boolean',
      title: `{{t("Trigger mode", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        direction: 'vertical',
        options: [
          {
            label: `{{t("Local mode, triggered after the completion of actions bound to this workflow", { ns: "${NAMESPACE}" })}}`,
            value: false,
          },
          {
            label: `{{t("Global mode, triggered after the completion of the following actions", { ns: "${NAMESPACE}" })}}`,
            value: true,
          },
        ],
      },
      default: false,
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
    actions: {
      type: 'number',
      title: `{{t("Select actions", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'CheckboxGroupWithTooltip',
      'x-component-props': {
        direction: 'vertical',
        options: [
          { label: `{{t("Create record action", { ns: "${NAMESPACE}" })}}`, value: COLLECTION_TRIGGER_ACTION.CREATE },
          { label: `{{t("Update record action", { ns: "${NAMESPACE}" })}}`, value: COLLECTION_TRIGGER_ACTION.UPDATE },
          // { label: `{{t("upsert", { ns: "${NAMESPACE}" })}}`, value: COLLECTION_TRIGGER_ACTION.UPSERT },
          // {
          //   label: `{{t("Delete single or many records", { ns: "${NAMESPACE}" })}}`,
          //   value: COLLECTION_TRIGGER_ACTION.DESTROY,
          // },
        ],
      },
      required: true,
      'x-reactions': [
        {
          dependencies: ['collection', 'global'],
          fulfill: {
            state: {
              visible: '{{!!$deps[0] && !!$deps[1]}}',
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
      type: 'object',
      title: `{{t("Trigger data", { ns: "workflow" })}}`,
      description: `{{t("Choose a record or primary key of a record in the collection to trigger.", { ns: "workflow" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'TriggerCollectionRecordSelect',
      default: null,
      required: true,
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
      // properties: {
      //   remoteSelect: {
      //     'x-component': 'RemoteSelect',
      //     'x-component-props': {
      //       fieldNames: {
      //         label: 'nickname',
      //         value: 'id',
      //       },
      //       service: {
      //         resource: 'users',
      //       },
      //       manual: false,
      //     },
      //   },
      // },
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
      // 'x-component-props': {
      //   fieldNames: {
      //     label: 'title',
      //     value: 'name',
      //   },
      //   service: {
      //     resource: 'roles',
      //   },
      //   manual: false,
      // },
      default: null,
    },
  };
  validate(values) {
    return values.collection;
  }
  scope = {
    useCollectionDataSource,
    useWorkflowAnyExecuted,
  };
  components = {
    RadioWithTooltip,
    CheckboxGroupWithTooltip,
    TriggerCollectionRecordSelect,
    WorkflowVariableWrapper,
  };
  isActionTriggerable = (config, context) => {
    return !config.global && ['submit', 'customize:save', 'customize:update'].includes(context.buttonAction);
  };
  useVariables = useVariables;
  useInitializers(config): SchemaInitializerItemType | null {
    if (!config.collection) {
      return null;
    }

    return {
      name: 'triggerData',
      type: 'item',
      key: 'triggerData',
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      Component: CollectionBlockInitializer,
      collection: config.collection,
      dataPath: '$context.data',
    };
  }
}
