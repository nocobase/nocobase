import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FormDialog, SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { SchemaInitializerItem, useSchemaInitializer } from '../../application';
import { useGlobalTheme } from '../../global-theme';
import { useStyles } from '../../schema-component/antd/menu/MenuItemInitializers';

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
