import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FormDialog, SchemaComponent, SchemaComponentOptions } from '../../..';
import { useGlobalTheme } from '../../../../global-theme';
import { SchemaInitializer } from '../../../../schema-initializer';

export const MenuItemInitializers = (props: any) => {
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      role="button"
      insertPosition={'beforeEnd'}
      icon={'PlusOutlined'}
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
};

const itemWrap = SchemaInitializer.itemWrap;

export const GroupItem = itemWrap((props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add group'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
                  properties: {
                    title: {
                      title: t('Menu item title'),
                      'x-component': 'Input',
                      'x-decorator': 'FormItem',
                      required: true,
                    },
                    icon: {
                      title: t('Icon'),
                      'x-component': 'IconPicker',
                      'x-decorator': 'FormItem',
                    },
                  },
                }}
              />
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const { title, icon } = values;
    insert({
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
        {
          type: 'onSelfSave',
          method: 'extractTextToLocale',
        },
      ],
    });
  }, [theme]);

  return <SchemaInitializer.Item {...props} onClick={handleClick} />;
});

export const PageMenuItem = itemWrap((props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add page'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
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
                  },
                }}
              />
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const { title, icon } = values;
    insert({
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
        {
          type: 'onSelfSave',
          method: 'extractTextToLocale',
        },
      ],
      properties: {
        page: {
          type: 'void',
          'x-component': 'Page',
          'x-async': true,
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'BlockInitializers',
              properties: {},
            },
          },
        },
      },
    });
  }, [theme]);

  return <SchemaInitializer.Item {...props} onClick={handleClick} />;
});

export const LinkMenuItem = itemWrap((props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add link'),
      () => {
        return (
          <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
            <FormLayout layout={'vertical'}>
              <SchemaComponent
                schema={{
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
                }}
              />
            </FormLayout>
          </SchemaComponentOptions>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const { title, href, icon } = values;
    insert({
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
        {
          type: 'onSelfSave',
          method: 'extractTextToLocale',
        },
      ],
    });
  }, [theme]);

  return <SchemaInitializer.Item {...props} onClick={handleClick} />;
});
