import { TreeSelect } from '@formily/antd';
import { Field, onFieldChange } from '@formily/core';
import { ISchema, Schema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { findByUid } from '.';
import { createDesignable } from '../..';
import { GeneralSchemaDesigner, SchemaSettings, useAPIClient, useDesignable } from '../../../';

const toItems = (properties = {}) => {
  const items = [];
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const element = properties[key];
      const item = {
        label: element.title,
        value: `${element['x-uid']}||${element['x-component']}`,
      };
      if (element.properties) {
        const children = toItems(element.properties);
        if (children?.length) {
          item['children'] = children;
        }
      }
      items.push(item);
    }
  }
  return items;
};

const findMenuSchema = (fieldSchema: Schema) => {
  let parent = fieldSchema.parent;
  while (parent) {
    if (parent['x-component'] === 'Menu') {
      return parent;
    }
    parent = parent.parent;
  }
};

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
                required: true,
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
            'x-decorator': 'ACLMenuItemProvider',
            'x-component-props': {
              icon,
            },
            'x-server-hooks': [
              {
                type: 'onSelfCreate',
                method: 'bindMenuToRole',
              },
            ],
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
                required: true,
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
            'x-decorator': 'ACLMenuItemProvider',
            'x-component-props': {
              icon,
            },
            'x-server-hooks': [
              {
                type: 'onSelfCreate',
                method: 'bindMenuToRole',
              },
            ],
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
                required: true,
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
            'x-decorator': 'ACLMenuItemProvider',
            'x-component-props': {
              icon,
              href,
            },
            'x-server-hooks': [
              {
                type: 'onSelfCreate',
                method: 'bindMenuToRole',
              },
            ],
          });
        }}
      />
    </SchemaSettings.SubMenu>
  );
};

export const MenuDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { dn, refresh } = useDesignable();
  const { t } = useTranslation();
  const menuSchema = findMenuSchema(fieldSchema);
  const items = toItems(menuSchema?.properties);
  const effects = (form) => {
    onFieldChange('target', (field: Field) => {
      const [, component] = field?.value?.split?.('||') || [];
      field.query('position').take((f: Field) => {
        f.dataSource =
          component === 'Menu.SubMenu'
            ? [
                { label: t('Before'), value: 'beforeBegin' },
                { label: t('After'), value: 'afterEnd' },
                { label: t('Inner'), value: 'beforeEnd' },
              ]
            : [
                { label: t('Before'), value: 'beforeBegin' },
                { label: t('After'), value: 'afterEnd' },
              ];
      });
    });
  };
  const schema = {
    type: 'object',
    title: t('Edit menu item'),
    properties: {
      title: {
        title: t('Menu item title'),
        required: true,
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
  };
  const initialValues = {
    title: field.title,
    icon: field.componentProps.icon,
  };
  if (fieldSchema['x-component'] === 'Menu.URL') {
    schema.properties['href'] = {
      title: t('Link'),
      'x-component': 'Input',
      'x-decorator': 'FormItem',
    };
    initialValues['href'] = field.componentProps.href;
  }
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={t('Edit')}
        eventKey="edit"
        schema={schema as ISchema}
        initialValues={initialValues}
        onSubmit={({ title, icon, href }) => {
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
          field.componentProps.href = href;
          schema['x-component-props'] = { icon, href };
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props']['icon'] = icon;
          fieldSchema['x-component-props']['href'] = href;
          dn.emit('patch', {
            schema,
          });
        }}
      />
      <SchemaSettings.ModalItem
        title={t('Move to')}
        eventKey="move-to"
        components={{ TreeSelect }}
        effects={effects}
        schema={
          {
            type: 'object',
            title: t('Move to'),
            properties: {
              target: {
                title: t('Target'),
                enum: items,
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'TreeSelect',
                'x-component-props': {},
              },
              position: {
                title: t('Position'),
                required: true,
                enum: [
                  { label: t('Before'), value: 'beforeBegin' },
                  { label: t('After'), value: 'afterEnd' },
                ],
                default: 'afterEnd',
                'x-component': 'Radio.Group',
                'x-decorator': 'FormItem',
              },
            },
          } as ISchema
        }
        onSubmit={({ target, position }) => {
          const [uid] = target?.split?.('||') || [];
          if (!uid) {
            return;
          }
          const current = findByUid(menuSchema, uid);
          const dn = createDesignable({
            t,
            api,
            refresh,
            current,
          });
          dn.loadAPIClientEvents();
          dn.insertAdjacent(position, fieldSchema);
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
