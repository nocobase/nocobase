/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert } from 'antd';
import { useFieldSchema } from '@formily/react';
import { ArrayTable } from '@formily/antd-v5';
import { useTranslation } from 'react-i18next';

import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  ISchema,
  joinCollectionName,
  RemoteSelect,
  RemoveButton,
  SchemaSettings,
  SchemaSettingsActionModalItem,
  SecondConFirm,
  SkipValidation,
  useCollection,
  useDesignable,
  useSchemaToolbar,
  SchemaSettingAccessControl,
  SchemaSettingsLinkageRules,
  useCollection_deprecated,
  RefreshDataBlockRequest,
  useDataBlockRequestGetter,
} from '@nocobase/client';

import { BindWorkflowConfig } from '@nocobase/plugin-workflow/client';
import { CONTEXT_TYPE, NAMESPACE } from '../common/constants';

function BindGlobalWorkflowConfig() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const collection = useCollection();

  const multipleRecords = fieldSchema['x-action'] === 'customize:collectionTriggerWorkflows';

  return (
    <SchemaSettingsActionModalItem
      title={t('Bind workflows', { ns: 'workflow' })}
      width="30%"
      components={{
        Alert,
        ArrayTable,
        RemoteSelect,
      }}
      schema={
        {
          type: 'void',
          title: t('Bind workflows', { ns: 'workflow' }),
          properties: {
            description: {
              type: 'void',
              'x-component': 'Alert',
              'x-component-props': {
                message: multipleRecords
                  ? `{{t('Only support custom action workflow with context type set to "Multiple records".', { ns: "${NAMESPACE}" })}}`
                  : `{{t('Only support custom action workflow with context type set to "None".', { ns: "${NAMESPACE}" })}}`,
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
                  workflowKey: {
                    type: 'void',
                    'x-component': 'ArrayTable.Column',
                    'x-component-props': {
                      title: `{{t('Workflow', { ns: 'workflow' })}}`,
                    },
                    properties: {
                      workflowKey: {
                        type: 'string',
                        'x-decorator': 'FormItem',
                        'x-component': 'RemoteSelect',
                        'x-component-props': {
                          manual: false,
                          placeholder: t('Select workflow', { ns: 'workflow' }),
                          fieldNames: { label: 'title', value: 'key' },
                          dataSource: 'main',
                          service: {
                            resource: 'workflows',
                            action: 'list',
                            params: {
                              filter: {
                                type: 'custom-action',
                                enabled: true,
                                ...(multipleRecords
                                  ? {
                                      'config.type': CONTEXT_TYPE.MULTIPLE_RECORDS,
                                      'config.collection': joinCollectionName(collection.dataSource, collection.name),
                                    }
                                  : {
                                      $or: [{ 'config.type': CONTEXT_TYPE.GLOBAL }, { 'config.type': null }],
                                    }),
                              },
                            },
                          },
                          // optionFilter(item) {
                          //   return multipleRecords || !item.config.type || item.config.type === CONTEXT_TYPE.GLOBAL;
                          // },
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
        if (!fieldSchema['x-action-settings']) {
          fieldSchema['x-action-settings'] = {};
        }
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

export const customizeSubmitToWorkflowActionSettings = new SchemaSettings({
  name: 'actionSettings:submitToWorkflow',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },

    {
      name: 'assignFieldValues',
      Component: AssignedFieldValues,
    },
    {
      name: 'skipRequiredValidation',
      Component: SkipValidation,
    },
    {
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
    },
    {
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
      },
    },
    {
      name: 'bindWorkflow',
      Component: BindWorkflowConfig,
    },
    SchemaSettingAccessControl,
    {
      name: 'delete',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const customizeCollectionTriggerWorkflowActionSettings = new SchemaSettings({
  name: 'actionSettings:collectionTriggerWorkflow',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },
    // {
    //   name: 'assignFieldValues',
    //   Component: AssignedFieldValues,
    // },
    {
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
    },
    {
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
      },
    },
    {
      name: 'bindWorkflow',
      Component: BindGlobalWorkflowConfig,
    },
    SchemaSettingAccessControl,
    {
      name: 'delete',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const customizeGlobalTriggerWorkflowActionSettings = new SchemaSettings({
  name: 'actionSettings:globalTriggerWorkflow',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },
    // {
    //   name: 'assignFieldValues',
    //   Component: AssignedFieldValues,
    // },
    {
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
    },
    {
      name: 'bindWorkflow',
      Component: BindGlobalWorkflowConfig,
    },
    {
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
      },
      useVisible() {
        const { getDataBlockRequest } = useDataBlockRequestGetter();
        return Boolean(getDataBlockRequest());
      },
    },
    SchemaSettingAccessControl,
    {
      name: 'delete',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});
