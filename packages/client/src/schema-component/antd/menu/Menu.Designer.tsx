import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '../../../';

export const MenuDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn, refresh } = useDesignable();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={'编辑'}
        schema={
          {
            type: 'object',
            title: '编辑菜单项',
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: '菜单项名称',
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
              icon: {
                title: '图标',
                'x-component': 'IconPicker',
                'x-decorator': 'FormItem',
              },
            },
          } as ISchema
        }
        initialValues={{
          title: field.title,
          icon: field.componentProps.icon,
        }}
        onSubmit={({ title, icon }) => {
          const schema = {
            ['x-uid']: fieldSchema['x-uid'],
          };
          if (title) {
            fieldSchema.title = title;
            field.title = title;
            schema['title'] = title;
            refresh();
          }
          field.componentProps.icon = icon;
          schema['x-component-props'] = { icon };
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props']['icon'] = icon;
          dn.emit('patch', {
            schema,
          });
        }}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
