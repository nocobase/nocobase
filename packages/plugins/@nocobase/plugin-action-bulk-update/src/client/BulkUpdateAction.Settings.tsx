/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useFieldSchema } from '@formily/react';
import {
  ActionDesigner,
  SchemaSettings,
  SchemaSettingsItemType,
  SchemaSettingsModalItem,
  SchemaSettingsSelectItem,
  AssignedFieldValues,
  useDesignable,
  useSchemaToolbar,
  RefreshDataBlockRequest,
  useAfterSuccessOptions,
  useGlobalVariable,
  BlocksSelector,
  usePlugin,
  SchemaSettingsLinkageRules,
  useCollectionManager_deprecated,
  useDataBlockProps,
  useCollection_deprecated,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import React from 'react';

function UpdateMode() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettingsSelectItem
      title={t('Data will be updated')}
      options={[
        { label: t('Selected'), value: 'selected' },
        { label: t('Entire collection', { ns: 'action-bulk-edit' }), value: 'all' },
      ]}
      value={fieldSchema?.['x-action-settings']?.['updateMode']}
      onChange={(value) => {
        fieldSchema['x-action-settings']['updateMode'] = value;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-action-settings': fieldSchema['x-action-settings'],
          },
        });
        dn.refresh();
      }}
    />
  );
}
const fieldNames = {
  value: 'value',
  label: 'label',
};
const useVariableProps = (environmentVariables) => {
  const scope = useAfterSuccessOptions();
  return {
    scope: [environmentVariables, ...scope].filter(Boolean),
    fieldNames,
  };
};

function AfterSuccess() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const environmentVariables = useGlobalVariable('$env');
  const templatePlugin: any = usePlugin('@nocobase/plugin-block-template');
  const isInBlockTemplateConfigPage = templatePlugin?.isInBlockTemplateConfigPage?.();

  return (
    <SchemaSettingsModalItem
      dialogRootClassName="dialog-after-successful-submission"
      width={700}
      title={t('After successful submission')}
      initialValues={fieldSchema?.['x-action-settings']?.['onSuccess']}
      schema={
        {
          type: 'object',
          title: t('After successful submission'),
          properties: {
            successMessage: {
              title: t('Popup message'),
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              'x-component-props': {},
            },
            manualClose: {
              title: t('Popup close method'),
              enum: [
                { label: t('Automatic close'), value: false },
                { label: t('Manually close'), value: true },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              'x-component-props': {},
            },
            redirecting: {
              title: t('Then'),
              enum: [
                { label: t('Stay on current page'), value: false },
                { label: t('Redirect to'), value: true },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              'x-component-props': {},
              'x-reactions': {
                target: 'redirectTo',
                fulfill: {
                  state: {
                    visible: '{{!!$self.value}}',
                  },
                },
              },
            },
            redirectTo: {
              title: t('Link'),
              'x-decorator': 'FormItem',
              'x-component': 'Variable.TextArea',
              // eslint-disable-next-line react-hooks/rules-of-hooks
              'x-use-component-props': () => useVariableProps(environmentVariables),
            },
            blocksToRefresh: {
              type: 'array',
              title: t('Refresh data blocks'),
              'x-decorator': 'FormItem',
              'x-use-decorator-props': () => {
                return {
                  tooltip: t('After successful submission, the selected data blocks will be automatically refreshed.'),
                };
              },
              'x-component': BlocksSelector,
              'x-hidden': isInBlockTemplateConfigPage, // 模板配置页面暂不支持该配置
            },
          },
        } as ISchema
      }
      onSubmit={(onSuccess) => {
        fieldSchema['x-action-settings']['onSuccess'] = onSuccess;
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

const schemaSettingsItems: SchemaSettingsItemType[] = [
  {
    name: 'editButton',
    Component: ActionDesigner.ButtonEditor,
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
      const { association } = useDataBlockProps() || {};
      const { getCollectionField } = useCollectionManager_deprecated();
      const associationField = getCollectionField(association);
      const { linkageRulesProps } = useSchemaToolbar();
      return {
        ...linkageRulesProps,
        collectionName: associationField?.collectionName || name,
      };
    },
  },
  {
    name: 'updateMode',
    Component: UpdateMode,
    useVisible() {
      const fieldSchema = useFieldSchema();
      const isUpdateModePopupAction = ['customize:bulkUpdate', 'customize:bulkEdit'].includes(fieldSchema['x-action']);
      return isUpdateModePopupAction;
    },
  },
  {
    name: 'assignFieldValues',
    Component: AssignedFieldValues,
  },
  {
    name: 'afterSuccess',
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
    name: 'remove',
    sort: 100,
    Component: ActionDesigner.RemoveButton as any,
    useComponentProps() {
      const { removeButtonProps } = useSchemaToolbar();
      return removeButtonProps;
    },
  },
];

/**
 * @deprecated
 * 用于兼容之前版本的 name
 */
const deprecatedBulkUpdateActionSettings = new SchemaSettings({
  name: 'ActionSettings:customize:bulkUpdate',
  items: schemaSettingsItems,
});

const bulkUpdateActionSettings = new SchemaSettings({
  name: 'actionSettings:bulkUpdate',
  items: schemaSettingsItems,
});

export { bulkUpdateActionSettings, deprecatedBulkUpdateActionSettings };
