import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../..';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const ActionDesigner = (props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const isPopupAction = ['create', 'update', 'view'].includes(fieldSchema['x-action'] || '');
  return (
    <GeneralSchemaDesigner {...props}>
      <SchemaSettings.ModalItem
        title={'编辑'}
        schema={
          {
            type: 'object',
            title: '编辑按钮',
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: '按钮标题',
                default: fieldSchema.title,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
              icon: {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: '按钮图标',
                default: fieldSchema?.['x-component-props']?.icon,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
            },
          } as ISchema
        }
        onSubmit={({ title, icon }) => {
          if (title) {
            fieldSchema.title = title;
            field.title = title;
            field.componentProps.icon = icon;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].icon = icon;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          }
        }}
      />
      {isPopupAction && (
        <SchemaSettings.SelectItem
          title={'打开方式'}
          options={[
            { label: '抽屉', value: 'drawer' },
            { label: '对话框', value: 'modal' },
          ]}
          value={field.componentProps.openMode}
          onChange={(value) => {
            field.componentProps.openMode = value;
            fieldSchema['x-component-props']['openMode'] = value;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': fieldSchema['x-component-props'],
              },
            });
            dn.refresh();
          }}
        />
      )}
      {fieldSchema?.['x-action-settings'] && (
        <SchemaSettings.SwitchItem
          title={'跳过必填校验'}
          checked={!!fieldSchema?.['x-action-settings']?.skipValidator}
          onChange={(value) => {
            fieldSchema['x-action-settings'].skipValidator = value;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                'x-action-settings': {
                  ...fieldSchema['x-action-settings'],
                },
              },
            });
          }}
        />
      )}
      {fieldSchema?.['x-action-settings'] && (
        <SchemaSettings.ModalItem
          title={'表单值'}
          schema={
            {
              type: 'object',
              properties: {
                overwriteValues: {
                  title: '以下字段提交时，保存值为',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  default: JSON.stringify(fieldSchema?.['x-action-settings']?.overwriteValues),
                },
              },
            } as ISchema
          }
          onSubmit={({ overwriteValues }) => {
            try {
              const values = JSON.parse(overwriteValues);
              fieldSchema['x-action-settings'].overwriteValues = values;
              dn.emit('patch', {
                schema: {
                  ['x-uid']: fieldSchema['x-uid'],
                  'x-action-settings': {
                    ...fieldSchema['x-action-settings'],
                  },
                },
              });
              dn.refresh();
            } catch (e) {}
          }}
        />
      )}
      {fieldSchema?.['x-action-settings'] && (
        <SchemaSettings.ModalItem
          title={t('After successful submission')}
          initialValues={fieldSchema?.['x-action-settings']?.['onSuccess']}
          schema={
            {
              type: 'object',
              title: t('After successful submission'),
              properties: {
                successMessage: {
                  // default: t('Submitted successfully!'),
                  title: 'Pop-up message',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  'x-component-props': {},
                },
                redirecting: {
                  title: t('Then'),
                  default: false,
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
      )}
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
        }}
      />
    </GeneralSchemaDesigner>
  );
};
