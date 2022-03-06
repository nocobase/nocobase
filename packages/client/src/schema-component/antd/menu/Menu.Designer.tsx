import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '../../../';

const InsertMenuItems = (props) => {
  const { dn, refresh } = useDesignable();
  const { eventKey, title, insertPosition } = props;
  const fieldSchema = useFieldSchema();
  const isSubMenu = fieldSchema['x-component'] === 'Menu.SubMenu';
  if (!isSubMenu && insertPosition === 'beforeEnd') {
    return null;
  }
  return (
    <SchemaSettings.SubMenu eventKey={eventKey} title={title}>
      <SchemaSettings.ModalItem
        eventKey={`${insertPosition}group`}
        title={'分组'}
        schema={
          {
            type: 'object',
            title: `${title}分组`,
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: '分组名称',
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
        onSubmit={({ title, icon }) => {
          dn.insertAdjacent(insertPosition, {
            type: 'void',
            title,
            'x-component': 'Menu.SubMenu',
            'x-component-props': {
              icon,
            },
          });
        }}
      />
      <SchemaSettings.ModalItem
        eventKey={`${insertPosition}page`}
        title={'页面'}
        schema={
          {
            type: 'object',
            title: `${title}页面`,
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
        onSubmit={({ title, icon }) => {
          dn.insertAdjacent(insertPosition, {
            type: 'void',
            title,
            'x-component': 'Menu.Item',
            'x-component-props': {
              icon,
            },
            properties: {
              page: {
                type: 'void',
                'x-component': 'Page',
                'x-async': true,
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'BlockInitializers',
                    properties: {},
                  },
                },
              },
            },
          });
        }}
      />
      <SchemaSettings.ModalItem
        eventKey={`${insertPosition}link`}
        title={'链接'}
        schema={
          {
            type: 'object',
            title: `${title}链接`,
            properties: {
              title: {
                title: '链接文字',
                'x-component': 'Input',
                'x-decorator': 'FormItem',
              },
              href: {
                title: '链接',
                'x-component': 'Input',
                'x-decorator': 'FormItem',
              },
              icon: {
                title: '图标',
                'x-component': 'IconPicker',
                'x-decorator': 'FormItem',
              },
            },
          } as ISchema
        }
        onSubmit={({ title, icon, href }) => {
          dn.insertAdjacent(insertPosition, {
            type: 'void',
            title,
            'x-component': 'Menu.URL',
            'x-component-props': {
              icon,
              href,
            },
          });
        }}
      />
    </SchemaSettings.SubMenu>
  );
};

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
      <InsertMenuItems eventKey={'insertbeforeBegin'} title={'在前面插入'} insertPosition={'beforeBegin'} />
      <InsertMenuItems eventKey={'insertafterEnd'} title={'在后面插入'} insertPosition={'afterEnd'} />
      <InsertMenuItems eventKey={'insertbeforeEnd'} title={'在里面插入'} insertPosition={'beforeEnd'} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
