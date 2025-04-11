/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ButtonEditor,
  ISchema,
  SchemaSettings,
  useSchemaInitializer,
  useSchemaInitializerItem,
  ModalActionSchemaInitializerItem,
  SchemaSettingAccessControl,
  SchemaSettingsLinkageRules,
  useSchemaToolbar,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const workbenchActionSettingsScanQrCode = new SchemaSettings({
  name: 'workbench:actionSettings:scanQrCode',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        return { hasIconColor: true };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      ...SchemaSettingAccessControl,
      useVisible() {
        return true;
      },
    },
    {
      name: 'd1',
      type: 'divider',
    },
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
      title={t('Scan QR code', { ns: 'block-workbench' })}
      modalSchema={{
        title: t('Scan QR code', { ns: 'block-workbench' }),
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
          iconColor: {
            title: t('Color'),
            required: true,
            default: '#1677FF',
            'x-component': 'ColorPicker',
            'x-decorator': 'FormItem',
          },
        },
      }}
      onSubmit={(values) => {
        insert({
          type: 'void',
          title: values.title,
          'x-component': 'WorkbenchAction',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-settings': 'workbench:actionSettings:scanQrCode',
          'x-component-props': {
            icon: values.icon,
            iconColor: values.iconColor,
            openMode: 'modal',
          },
          properties: {
            modal: {
              type: 'void',
              'x-component': 'QRCodeScanner',
              title: t('Scan QR code', { ns: 'block-workbench' }),
            },
          },
        } as ISchema);
      }}
    />
  );
}
