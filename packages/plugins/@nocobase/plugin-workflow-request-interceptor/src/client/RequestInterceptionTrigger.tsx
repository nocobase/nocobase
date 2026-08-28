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

import { useForm } from '@formily/react';
import { RemoteSelect, useCollectionDataSource } from '@nocobase/client';
import type { SchemaInitializerItemType } from '@nocobase/client';
import {
  CheckboxGroupWithTooltip,
  CollectionBlockInitializer,
  FieldsSelect,
  RadioWithTooltip,
  TriggerCollectionRecordSelect,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client';
import React from 'react';

import { INTERCEPTABLE_ACTIONS } from '../common/constants';
import V2RequestInterceptionTrigger from '../client-v2/RequestInterceptionTrigger';
import { NAMESPACE } from '../locale';

type WorkflowField = {
  isForeignKey?: boolean;
  type?: string;
  target?: string;
  collectionName?: string;
  name?: string;
};

const COLLECTION_TRIGGER_ACTION_OPTIONS = [
  { label: `{{t('Create record', { ns: '${NAMESPACE}' })}}`, value: INTERCEPTABLE_ACTIONS.CREATE },
  { label: `{{t('Update record', { ns: '${NAMESPACE}' })}}`, value: INTERCEPTABLE_ACTIONS.UPDATE },
  { label: `{{t('Delete record', { ns: '${NAMESPACE}' })}}`, value: INTERCEPTABLE_ACTIONS.DESTROY },
];

export default class RequestInterceptionTrigger extends V2RequestInterceptionTrigger {
  presetFieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceCollectionCascader',
    },
  };
  fieldset = {
    collection: {
      type: 'string',
      title: '{{t("Collection")}}',
      required: true,
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'DataSourceCollectionCascader',
      ['x-reactions']: [
        {
          target: 'changed',
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
            label: `{{t("Local mode, triggered before executing the actions bound to this workflow", { ns: "${NAMESPACE}" })}}`,
            value: false,
          },
          {
            label: `{{t("Global mode, triggered before executing the following actions", { ns: "${NAMESPACE}" })}}`,
            value: true,
          },
        ],
      },
      default: false,
    },
    actions: {
      type: 'number',
      title: `{{t("Select actions", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'CheckboxGroupWithTooltip',
      'x-component-props': {
        direction: 'vertical',
        options: COLLECTION_TRIGGER_ACTION_OPTIONS,
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
  };
  triggerFieldset = {
    action: {
      type: 'string',
      title: '{{t("Action type")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        allowClear: false,
      },
      enum: COLLECTION_TRIGGER_ACTION_OPTIONS,
      default: 'create',
      required: true,
    },
    target: {
      type: 'string',
      title: `{{t("Record to submit", { ns: "${NAMESPACE}" })}}`,
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
    useValueObject() {
      const { values } = useForm();
      return values.action !== INTERCEPTABLE_ACTIONS.DESTROY;
    },
  };
  components = {
    FieldsSelect,
    RadioWithTooltip,
    CheckboxGroupWithTooltip,
    WorkflowVariableWrapper,
    TriggerCollectionRecordSelect,
  };

  useInitializers(config): SchemaInitializerItemType | null {
    if (!config.collection) {
      return null;
    }

    return {
      name: 'triggerData',
      type: 'item',
      key: 'triggerData',
      title: '{{t("Trigger data", { ns: "workflow" })}}',
      Component: CollectionBlockInitializer,
      collection: config.collection,
      dataPath: '$context.params.values',
    };
  }
}
