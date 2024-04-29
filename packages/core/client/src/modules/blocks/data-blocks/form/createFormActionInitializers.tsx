/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';

/**
 * @deprecated
 * use `createFormActionInitializers` instead
 */
export const createFormActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CreateFormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
      children: [
        {
          name: 'submit',
          title: '{{t("Submit")}}',
          Component: 'CreateSubmitActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
      children: [
        {
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'SaveRecordActionInitializer',
        },
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});

export const createFormActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'createForm:configureActions',
    title: '{{t("Configure actions")}}',
    icon: 'SettingOutlined',
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Enable actions")}}',
        name: 'enableActions',
        children: [
          {
            name: 'submit',
            title: '{{t("Submit")}}',
            Component: 'CreateSubmitActionInitializer',
            schema: {
              'x-action-settings': {},
            },
          },
        ],
      },
      {
        name: 'divider',
        type: 'divider',
      },
      {
        type: 'subMenu',
        title: '{{t("Customize")}}',
        name: 'customize',
        children: [
          {
            name: 'saveRecord',
            title: '{{t("Save record")}}',
            Component: 'SaveRecordActionInitializer',
          },
          {
            name: 'customRequest',
            title: '{{t("Custom request")}}',
            Component: 'CustomRequestInitializer',
          },
        ],
      },
    ],
  },
  createFormActionInitializers_deprecated,
);
