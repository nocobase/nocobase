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
  useCollectionDataSource,
  useCollectionManager_deprecated,
  useCompile,
} from '@nocobase/client';
import {
  Trigger,
  CollectionBlockInitializer,
  getCollectionFieldOptions,
  useWorkflowAnyExecuted,
  CheckboxGroupWithTooltip,
  RadioWithTooltip,
} from '@nocobase/plugin-workflow/client';
import { NAMESPACE, useLang } from '../locale';

const COLLECTION_TRIGGER_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  UPSERT: 'updateOrCreate',
  DESTROY: 'destroy',
};

export default class extends Trigger {
  title = `{{t("Post-action event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('Triggered after the completion of a request initiated through an action button or API, such as after adding, updating, or deleting data. Suitable for data processing, sending notifications, etc., after actions are completed.', { ns: "${NAMESPACE}" })}}`;
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
  scope = {
    useCollectionDataSource,
    useWorkflowAnyExecuted,
  };
  components = {
    RadioWithTooltip,
    CheckboxGroupWithTooltip,
  };
  isActionTriggerable = (config, context) => {
    return !config.global && ['submit', 'customize:save', 'customize:update'].includes(context.buttonAction);
  };
  useVariables(config, options) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const compile = useCompile();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getCollectionFields } = useCollectionManager_deprecated();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langTriggerData = useLang('Trigger data');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langUserSubmittedForm = useLang('User submitted action');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const langRoleSubmittedForm = useLang('Role of user submitted action');
    const rootFields = [
      {
        collectionName: config.collection,
        name: 'data',
        type: 'hasOne',
        target: config.collection,
        uiSchema: {
          title: langTriggerData,
        },
      },
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
    ];
    const result = getCollectionFieldOptions({
      // depth,
      appends: ['data', 'user', ...(config.appends?.map((item) => `data.${item}`) || [])],
      ...options,
      fields: rootFields,
      compile,
      getCollectionFields,
    });
    return result;
  }
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
