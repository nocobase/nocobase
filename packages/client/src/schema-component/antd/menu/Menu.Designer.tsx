import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '../../../';

const InsertMenuItems = (props) => {
  const { eventKey, title, insertPosition } = props;
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const isSubMenu = fieldSchema['x-component'] === 'Menu.SubMenu';
  if (!isSubMenu && insertPosition === 'beforeEnd') {
    return null;
  }
  return (
    <SchemaSettings.SubMenu eventKey={eventKey} title={title}>
      <SchemaSettings.ModalItem
        eventKey={`${insertPosition}group`}
        title={t('Group')}
        schema={
          {
            type: 'object',
            title: t('Add group'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Menu item title'),
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
              icon: {
                title: t('Icon'),
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
        title={t('Page')}
        schema={
          {
            type: 'object',
            title: t('Add page'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Menu item title'),
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
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
        title={t('Link')}
        schema={
          {
            type: 'object',
            title: t('Add link'),
            properties: {
              title: {
                title: t('Menu item title'),
                'x-component': 'Input',
                'x-decorator': 'FormItem',
              },
              icon: {
                title: t('Icon'),
                'x-component': 'IconPicker',
                'x-decorator': 'FormItem',
              },
              href: {
                title: t('Link'),
                'x-component': 'Input',
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
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={t('Edit')}
        schema={
          {
            type: 'object',
            title: t('Edit menu item'),
            properties: {
              title: {
                title: t('Menu item title'),
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
              icon: {
                title: t('Menu item icon'),
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
      <InsertMenuItems eventKey={'insertbeforeBegin'} title={t('Insert before')} insertPosition={'beforeBegin'} />
      <InsertMenuItems eventKey={'insertafterEnd'} title={t('Insert after')} insertPosition={'afterEnd'} />
      <InsertMenuItems eventKey={'insertbeforeEnd'} title={t('Insert inner')} insertPosition={'beforeEnd'} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        confirm={{
          title: t('Delete menu item'),
        }}
      />
    </GeneralSchemaDesigner>
  );
};
