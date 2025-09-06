/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ArrayTable } from '@formily/antd-v5';
import { onFieldValueChange } from '@formily/core';
import { ISchema, useFieldSchema, useForm, useFormEffects } from '@formily/react';
import {
  DataSourceProvider,
  joinCollectionName,
  RemoteSelect,
  SchemaSettingsActionModalItem,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useCompile,
  useDataSourceKey,
  useDesignable,
  useFormBlockContext,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { usePlugin } from '@nocobase/client';
import { Alert, Flex, Tag } from 'antd';

function WorkflowSelect({ formAction, buttonAction, actionType, ...props }) {
  const { t } = useTranslation();
  const index = ArrayTable.useIndex();
  const { setValuesIn } = useForm();
  const baseCollection = useCollection_deprecated();
  const { getCollection } = useCollectionManager_deprecated();
  const dataSourceKey = useDataSourceKey();
  const [workflowCollection, setWorkflowCollection] = useState(joinCollectionName(dataSourceKey, baseCollection.name));
  const compile = useCompile();

  const workflowPlugin = usePlugin('workflow') as any;
  const triggerOptions = workflowPlugin.useTriggersOptions();
  const workflowTypes = useMemo(
    () =>
      triggerOptions
        .filter((item) => {
          return (
            typeof item.options.isActionTriggerable_deprecated === 'function' ||
            item.options.isActionTriggerable_deprecated === true
          );
        })
        .map((item) => item.value),
    [triggerOptions],
  );

  useFormEffects(() => {
    onFieldValueChange(`group[${index}].context`, (field) => {
      let collection: any = baseCollection;
      if (field.value) {
        const paths = field.value.split('.');
        for (let i = 0; i < paths.length && collection; i++) {
          const path = paths[i];
          const associationField = collection.fields.find((f) => f.name === path);
          if (associationField) {
            collection = getCollection(associationField.target, dataSourceKey);
          }
        }
      }
      setWorkflowCollection(joinCollectionName(dataSourceKey, collection.name));
      setValuesIn(`group[${index}].workflowKey`, null);
    });
  });

  const optionFilter = useCallback(
    ({ key, type, config }) => {
      if (key === props.value) {
        return true;
      }
      const trigger = workflowPlugin.triggers.get(type);
      if (trigger.isActionTriggerable_deprecated === true) {
        return true;
      }
      if (typeof trigger.isActionTriggerable_deprecated === 'function') {
        return trigger.isActionTriggerable_deprecated(config, {
          action: actionType,
          formAction,
          buttonAction,
          /**
           * @deprecated
           */
          direct: buttonAction === 'customize:triggerWorkflows',
        });
      }
      return false;
    },
    [props.value, workflowPlugin.triggers, formAction, buttonAction, actionType],
  );

  return (
    <DataSourceProvider dataSource="main">
      <RemoteSelect
        manual={false}
        placeholder={t('Select workflow', { ns: 'workflow' })}
        fieldNames={{
          label: 'title',
          value: 'key',
        }}
        service={{
          resource: 'workflows',
          action: 'list',
          params: {
            filter: {
              type: workflowTypes,
              enabled: true,
              'config.collection': workflowCollection,
            },
          },
        }}
        optionFilter={optionFilter}
        optionRender={({ label, data }) => {
          const typeOption = triggerOptions.find((item) => item.value === data.type);
          return typeOption ? (
            <Flex justify="space-between">
              <span>{label}</span>
              <Tag color={typeOption.color}>{compile(typeOption.label)}</Tag>
            </Flex>
          ) : (
            label
          );
        }}
        {...props}
      />
    </DataSourceProvider>
  );
}

export function BindWorkflowConfig() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const collection = useCollection_deprecated();
  // TODO(refactor): should refactor for getting certain action type, better from 'x-action'.
  const formBlock = useFormBlockContext();
  /**
   * @deprecated
   */
  const actionType = formBlock?.type || fieldSchema['x-action'];
  const formAction = formBlock?.type;
  const buttonAction = fieldSchema['x-action'];

  const description = {
    submit: t('Support pre-action event (local mode), post-action event (local mode), and approval event here.', {
      ns: 'workflow',
    }),
    'customize:save': t(
      'Support pre-action event (local mode), post-action event (local mode), and approval event here.',
      {
        ns: 'workflow',
      },
    ),
    'customize:update': t(
      'Support pre-action event (local mode), post-action event (local mode), and approval event here.',
      { ns: 'workflow' },
    ),
    'customize:triggerWorkflows': t(
      'Workflow will be triggered directly once the button clicked, without data saving. Only supports to be bound with "Custom action event".',
      { ns: '@nocobase/plugin-workflow-custom-action-trigger' },
    ),
    'customize:triggerWorkflows_deprecated': t(
      '"Submit to workflow" to "Post-action event" is deprecated, please use "Custom action event" instead.',
      { ns: 'workflow' },
    ),
    destroy: t('Workflow will be triggered before deleting succeeded (only supports pre-action event in local mode).', {
      ns: 'workflow',
    }),
  }[fieldSchema?.['x-action']];

  // NOTE(refactor): hard code
  if (fieldSchema['x-use-component-props'] === 'usePickActionProps') {
    return null;
  }

  return (
    <SchemaSettingsActionModalItem
      title={t('Bind workflows', { ns: 'workflow' })}
      scope={{
        fieldFilter(field) {
          return ['belongsTo', 'hasOne'].includes(field.type);
        },
      }}
      components={{
        Alert,
        ArrayTable,
        WorkflowSelect,
      }}
      schema={
        {
          type: 'void',
          title: t('Bind workflows', { ns: 'workflow' }),
          properties: {
            description: description && {
              type: 'void',
              'x-component': 'Alert',
              'x-component-props': {
                message: description,
                style: {
                  marginBottom: '1em',
                },
              },
            },
            group: {
              type: 'array',
              'x-component': 'ArrayTable',
              'x-decorator': 'FormItem',
              items: {
                type: 'object',
                properties: {
                  sort: {
                    type: 'void',
                    'x-component': 'ArrayTable.Column',
                    'x-component-props': { width: 50, title: '', align: 'center' },
                    properties: {
                      sort: {
                        type: 'void',
                        'x-component': 'ArrayTable.SortHandle',
                      },
                    },
                  },
                  context: {
                    type: 'void',
                    'x-component': 'ArrayTable.Column',
                    'x-component-props': {
                      title: t('Trigger data context', { ns: 'workflow' }),
                      width: 200,
                    },
                    properties: {
                      context: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'AppendsTreeSelect',
                        'x-component-props': {
                          placeholder: t('Select context', { ns: 'workflow' }),
                          popupMatchSelectWidth: false,
                          collection: `${
                            collection.dataSource && collection.dataSource !== 'main' ? `${collection.dataSource}:` : ''
                          }${collection.name}`,
                          filter: '{{ fieldFilter }}',
                          rootOption: {
                            label: t('Full form data', { ns: 'workflow' }),
                            value: '',
                          },
                          allowClear: false,
                          loadData: buttonAction === 'destroy' ? null : undefined,
                        },
                        default: '',
                      },
                    },
                  },
                  workflowKey: {
                    type: 'void',
                    'x-component': 'ArrayTable.Column',
                    'x-component-props': {
                      title: t('Workflow', { ns: 'workflow' }),
                    },
                    properties: {
                      workflowKey: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'WorkflowSelect',
                        'x-component-props': {
                          placeholder: t('Select workflow', { ns: 'workflow' }),
                          actionType,
                          formAction,
                          buttonAction,
                        },
                        required: true,
                      },
                    },
                  },
                  operations: {
                    type: 'void',
                    'x-component': 'ArrayTable.Column',
                    'x-component-props': {
                      width: 32,
                    },
                    properties: {
                      remove: {
                        type: 'void',
                        'x-component': 'ArrayTable.Remove',
                      },
                    },
                  },
                },
              },
              properties: {
                add: {
                  type: 'void',
                  title: t('Add workflow', { ns: 'workflow' }),
                  'x-component': 'ArrayTable.Addition',
                },
              },
            },
          },
        } as ISchema
      }
      initialValues={{ group: fieldSchema?.['x-action-settings']?.triggerWorkflows }}
      onSubmit={({ group }) => {
        fieldSchema['x-action-settings']['triggerWorkflows'] = group;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-action-settings': fieldSchema['x-action-settings'],
          },
        });
      }}
    />
  );
}
