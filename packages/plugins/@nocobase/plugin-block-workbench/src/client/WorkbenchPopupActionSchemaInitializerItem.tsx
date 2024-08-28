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
  SchemaSettings,
  SchemaSettingOpenModeSchemaItems,
  useSchemaInitializer,
  useSchemaInitializerItem,
  useOpenModeContext,
  usePopupUtils,
  usePopupSettings,
  encodePathValue,
  // ActionContext,
  storePopupContext,
  // useCollectionManager,
  // useNavigateNoUpdate,
  CollectionRecord,
  // getPopupPathFromParams,
  withSearchParams,
  useDataBlockRequest,
  // CollectionRecord,
  useDataSourceKey,
  // useCollectionParentRecord,
  // useCollection,
  // usePopupContextInActionOrAssociationField,
  CONTEXT_SCHEMA_KEY,
} from '@nocobase/client';
import { uid } from '@nocobase/utils';
import { last } from 'lodash';
import { useNavigate } from 'react-router-dom';
import React, { useContext, useCallback } from 'react';
import { useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { ModalActionSchemaInitializerItem } from './ModalActionSchemaInitializerItem';
import { ConsoleSqlOutlined } from '@ant-design/icons';

export const workbenchActionSettingsPopup = new SchemaSettings({
  name: 'workbench:actionSettings:popup',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        return { hasIconColor: true };
      },
    },

    {
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      useComponentProps() {
        const { hideOpenMode } = useOpenModeContext();
        return {
          openMode: !hideOpenMode,
          openSize: !hideOpenMode,
        };
      },
    },
    {
      sort: 800,
      name: 'd1',
      type: 'divider',
    },
    {
      sort: 900,
      type: 'remove',
      name: 'remove',
    },
  ],
});

export function WorkbenchPopupActionSchemaInitializerItem(props) {
  // 调用插入功能
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { getPopupContext } = usePopupUtils();
  const fieldSchema = useFieldSchema();
  const currentPopupUidWithoutOpened = fieldSchema?.['x-uid'];
  const navigate = useNavigate();

  return (
    <ModalActionSchemaInitializerItem
      title={t('Popup', { ns: 'block-workbench' })}
      modalSchema={{
        title: t('Add popup'),
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
          openMode: {
            title: t('openMode'),
            required: false,
            default: 'drawer',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              { label: t('Drawer'), value: 'drawer' },
              { label: t('Dialog'), value: 'modal' },
              { label: t('Page'), value: 'page' },
            ],
          },
        },
      }}
      onSubmit={(values) => {
        insert({
          type: 'void',
          title: values.title,
          'x-toolbar': 'ActionSchemaToolbar',
          'x-settings': 'actionSettings:popup',
          'x-component': 'WorkbenchAction',
          'x-component-props': {
            icon: values.icon,
            iconColor: values.iconColor,
            openMode: values.openMode,
            refreshDataBlockRequest: false,
          },
          properties: {
            drawer: {
              type: 'void',
              title: values.title,
              'x-component': 'Action.Container',
              'x-component-props': {
                className: 'nb-action-popup',
              },
              properties: {
                tabs: {
                  type: 'void',
                  'x-component': 'Tabs',
                  'x-component-props': {},
                  'x-initializer': 'popup:addTab',
                  properties: {
                    tab1: {
                      type: 'void',
                      title: '{{t("Details")}}',
                      'x-component': 'Tabs.TabPane',
                      'x-designer': 'Tabs.Designer',
                      'x-component-props': {},
                      properties: {
                        grid: {
                          type: 'void',
                          'x-component': 'Grid',
                          'x-initializer': 'page:addBlock',
                          properties: {},
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          // [CONTEXT_SCHEMA_KEY]: getPopupContext(),
        });
      }}
    />
  );
}
