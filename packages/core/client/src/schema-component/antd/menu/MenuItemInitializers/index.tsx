import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import { uid } from '@formily/shared';
import { createStyles } from 'antd-style';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FormDialog, SchemaComponent, SchemaComponentOptions } from '../../..';
import { SchemaInitializerItem, useSchemaInitializer } from '../../../../application';
import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';
import { useGlobalTheme } from '../../../../global-theme';

const useStyles = createStyles(({ token }) => ({
  menuItem: {
    paddingLeft: `${token.padding}px !important`,
    paddingRight: `${token.padding}px !important`,
  },
}));

export const GroupItem = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { styles } = useStyles();

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
  }, [insert, options.components, options.scope, t, theme]);
  return <SchemaInitializerItem title={t('Group')} onClick={handleClick} className={styles.menuItem} />;
};

export const PageMenuItem = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { styles } = useStyles();

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
  }, [insert, options.components, options.scope, t, theme]);
  return <SchemaInitializerItem title={t('Page')} onClick={handleClick} className={styles.menuItem} />;
};

export const LinkMenuItem = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { styles } = useStyles();

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
  }, [insert, options.components, options.scope, t, theme]);

  return <SchemaInitializerItem title={t('Link')} onClick={handleClick} className={styles.menuItem} />;
};

export const menuItemInitializer = new SchemaInitializer({
  name: 'MenuItemInitializers',
  insertPosition: 'beforeEnd',
  icon: 'PlusOutlined',
  title: '{{t("Add menu item")}}',
  items: [
    {
      name: 'group',
      Component: GroupItem,
    },
    {
      name: 'page',
      Component: PageMenuItem,
    },
    {
      name: 'link',
      Component: LinkMenuItem,
    },
  ],
});
