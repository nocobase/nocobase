/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, SchemaInitializerItemActionModalType, SchemaSettings, useSchemaInitializer } from '@nocobase/client';
import { useNavigate } from 'react-router-dom';
import { generatePluginTranslationTemplate, usePluginTranslation } from '../../../../../locale';
import { editAction } from '../actionCommonSettings';

export const mobileNavigationBarLinkSettings = new SchemaSettings({
  name: `mobile:navigation-bar:link`,
  items: [
    editAction((values) => {
      return {
        link: {
          type: 'string',
          default: values.link,
          title: generatePluginTranslationTemplate('Link'),
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input.URL',
        },
      };
    }),
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});

export const useMobileNavigationBarLink = (props) => {
  const { link } = props;
  const navigate = useNavigate();
  return {
    onClick() {
      if (link.startsWith('http') || link.startsWith('//')) {
        window.open(link);
      } else {
        navigate(link);
      }
    },
  };
};

export const getMobileNavigationBarLinkSchema = (values: any): ISchema => ({
  type: 'void',
  'x-component': 'Action',
  'x-toolbar': 'ActionSchemaToolbar',
  'x-settings': mobileNavigationBarLinkSettings.name,
  'x-use-component-props': 'useMobileNavigationBarLink',
  'x-component-props': {
    ...values,
    component: 'MobileNavigationBarAction',
  },
});

export const mobileNavigationBarLinkInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'link',
  type: 'actionModal',
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const { t } = usePluginTranslation();
    return {
      title: t('Add Link'),
      buttonText: t('Link'),
      schema: {
        link: {
          type: 'string',
          title: t('Link'),
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input.URL',
        },
        title: {
          type: 'string',
          title: t('Title'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        icon: {
          type: 'string',
          title: t('Icon'),
          'x-decorator': 'FormItem',
          'x-component': 'IconPicker',
        },
      },
      isItem: true,
      onSubmit(values) {
        insert(getMobileNavigationBarLinkSchema(values));
      },
    };
  },
};
