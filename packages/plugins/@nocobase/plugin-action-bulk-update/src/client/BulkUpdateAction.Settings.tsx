import { ISchema, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import {
  ActionDesigner,
  SchemaSettings,
  SchemaSettingsItemType,
  SchemaSettingsModalItem,
  SchemaSettingsSelectItem,
  AssignedFieldValues,
  useDesignable,
  useSchemaToolbar,
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
        { label: t('All'), value: 'all' },
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

function AfterSuccess() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  return (
    <SchemaSettingsModalItem
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
              'x-component': 'Input',
              'x-component-props': {},
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
    useVisible() {
      const fieldSchema = useFieldSchema();
      return isValid(fieldSchema?.['x-action-settings']?.onSuccess);
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
