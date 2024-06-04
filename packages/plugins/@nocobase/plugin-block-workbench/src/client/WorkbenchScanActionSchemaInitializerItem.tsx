/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ModalActionSchemaInitializerItem } from './ModalActionSchemaInitializerItem';

export const workbenchActionSettingsScanQrCode = new SchemaSettings({
  name: 'workbench:actionSettings:scanQrCode',
  items: [
    {
      type: 'remove',
      name: 'remove',
    },
  ],
});

export function WorkbenchScanActionSchemaInitializerItem(props) {
  const itemConfig = useSchemaInitializerItem();
  // 调用插入功能
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  return (
    <ModalActionSchemaInitializerItem
      title={itemConfig.title}
      modalSchema={{
        title: 'Add Scan Qr code',
        properties: {
          title: {
            title: t('Title'),
            required: true,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          icon: {
            title: t('Icon'),
            required: true,
            'x-component': 'IconPicker',
            'x-decorator': 'FormItem',
          },
          color: {
            title: t('Color'),
            required: true,
            default: '#1677FF',
            'x-component': 'ColorPicker',
            'x-decorator': 'FormItem',
          },
        },
      }}
      onSubmit={(values) => {
        console.log('values', values);
        insert({
          type: 'void',
          title: values.title,
          'x-component': 'Action',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-settings': 'workbench:actionSettings:scanQrCode',
          'x-component-props': {
            icon: values.icon,
            iconStyle: {
              background: values.color || '#1677FF',
            },
          },
        });
      }}
    />
  );
}
