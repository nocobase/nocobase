import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useDesignable } from '../..';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const ActionDesigner = (props) => {
  const initialValue = {};
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
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
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
            },
          } as ISchema
        }
        initialValues={{ title: field.title }}
        onSubmit={({ title }) => {
          if (title) {
            fieldSchema.title = title;
            field.title = title;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
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
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'] === 'ActionBar';
        }}
      />
    </GeneralSchemaDesigner>
  );
};
