/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { SchemaOptionsContext } from '@formily/react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Router } from 'react-router-dom';
import { SchemaInitializerItem, useSchemaInitializer } from '../../application';
import { useGlobalTheme } from '../../global-theme';
import { FormDialog, SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { useStyles } from '../../schema-component/antd/menu/MenuItemInitializers';
import { useURLAndHTMLSchema } from '../actions/link/useURLAndHTMLSchema';

export const LinkMenuItem = () => {
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { theme } = useGlobalTheme();
  const { styles } = useStyles();
  const { urlSchema, paramsSchema } = useURLAndHTMLSchema();

  const handleClick = useCallback(async () => {
    const values = await FormDialog(
      t('Add link'),
      () => {
        return (
          <Router location={location} navigator={null}>
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
                      href: urlSchema,
                      params: paramsSchema,
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          </Router>
        );
      },
      theme,
    ).open({
      initialValues: {},
    });
    const { title, href, params, icon } = values;
    insert({
      type: 'void',
      title,
      'x-component': 'Menu.URL',
      'x-decorator': 'ACLMenuItemProvider',
      'x-component-props': {
        icon,
        href,
        params,
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
