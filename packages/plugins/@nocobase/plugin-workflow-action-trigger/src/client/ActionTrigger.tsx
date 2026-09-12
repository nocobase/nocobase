/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { RemoteSelect, useCollectionDataSource } from '@nocobase/client';
import type { SchemaInitializerItemType } from '@nocobase/client';
import {
  CheckboxGroupWithTooltip,
  CollectionBlockInitializer,
  RadioWithTooltip,
  TriggerCollectionRecordSelect,
  useWorkflowAnyExecuted,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client';
import React from 'react';

import V2ActionTrigger, { COLLECTION_TRIGGER_ACTION } from '../client-v2/ActionTrigger';
import { NAMESPACE } from '../locale';

type WorkflowField = {
  isForeignKey?: boolean;
  type?: string;
  target?: string;
  collectionName?: string;
  name?: string;
};

type LegacyActionTriggerConfig = {
  collection?: string;
};

export default class ActionTrigger extends V2ActionTrigger {
  presetFieldset = {
    collection: {
      type: 'string',
      title: `{{t("Collection", { ns: "${NAMESPACE}" })}}`,
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceCollectionCascader',
    },
  };
  fieldset = {
    collection: {
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-decorator-props': {
        tooltip: `{{t("The collection to which the triggered data belongs.", { ns: "${NAMESPACE}" })}}`,
      },
      'x-component': 'DataSourceCollectionCascader',
      'x-disabled': true,
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
            (field: WorkflowField) => {
              if (field.isForeignKey || field.type === 'context') {
                return field.target === 'users';
              }
              return field.collectionName === 'users' && field.name === 'id';
            },
          ],
        },
        render(props: Record<string, unknown>) {
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
            (field: WorkflowField) => {
              if (field.isForeignKey) {
                return field.target === 'roles';
              }
              return field.collectionName === 'roles' && field.name === 'name';
            },
          ],
        },
        render(props: Record<string, unknown>) {
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

  useInitializers(config: LegacyActionTriggerConfig): SchemaInitializerItemType | null {
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
