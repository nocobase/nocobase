import { FormDialog, FormLayout } from '@formily/antd';
import { observer, SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaComponent, SchemaComponentOptions } from '../../..';
import { SchemaInitializer } from '../../../../schema-initializer';

export const MenuItemInitializer = observer((props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      insert={props.insert}
      style={props.style}
      {...props}
      items={[
        {
          type: 'item',
          title: t('Group'),
          component: GroupItem,
        },
        {
          type: 'item',
          title: t('Page'),
          component: PageMenuItem,
        },
        {
          type: 'item',
          title: t('Link'),
          component: LinkMenuItem,
        },
      ]}
    >
      {t('Add menu item')}
    </SchemaInitializer.Button>
  );
});

const itemWrap = SchemaInitializer.itemWrap;

export const GroupItem = itemWrap((props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={async () => {
        const values = await FormDialog('添加分组', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: '分组标题',
                        'x-component': 'Input',
                        'x-decorator': 'FormItem',
                      },
                      icon: {
                        title: '图标',
                        'x-component': 'IconPicker',
                        'x-decorator': 'FormItem',
                      },
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        const { title, icon } = values;
        insert({
          type: 'void',
          title,
          'x-component': 'Menu.SubMenu',
          'x-component-props': {
            icon,
          },
        });
      }}
    />
  );
});

export const PageMenuItem = itemWrap((props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={async () => {
        const values = await FormDialog('添加页面', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: '页面标题',
                        'x-component': 'Input',
                        'x-decorator': 'FormItem',
                      },
                      icon: {
                        title: '图标',
                        'x-component': 'IconPicker',
                        'x-decorator': 'FormItem',
                      },
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        const { title, icon } = values;
        insert({
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
                  'x-item-initializer': 'BlockInitializer',
                  properties: {},
                },
              },
            },
          },
        });
      }}
    />
  );
});

export const LinkMenuItem = itemWrap((props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={async () => {
        const values = await FormDialog('添加链接', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
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
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        const { title, href, icon } = values;
        insert({
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
  );
});
