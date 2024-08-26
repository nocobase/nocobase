/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useSchemaInitializerItem } from '../../../application';
import { usePopupUtils } from '../../../schema-component/antd/page/pagePopupUtils';
import { CONTEXT_SCHEMA_KEY } from '../../../schema-component/antd/page/usePopupContextInActionOrAssociationField';
import { ActionInitializerItem } from '../../../schema-initializer/items/ActionInitializerItem';
import { useOpenModeContext } from '../../popup/OpenModeProvider';

export const CreateActionInitializer = () => {
  const { defaultOpenMode } = useOpenModeContext();
  const { getPopupContext } = usePopupUtils();
  const schema = {
    type: 'void',
    'x-action': 'create',
    'x-acl-action': 'create',
    title: "{{t('Add new')}}",
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:addNew',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      openMode: defaultOpenMode,
      type: 'primary',
      component: 'CreateRecordAction',
      icon: 'PlusOutlined',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Add record") }}',
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
            'x-initializer-props': {
              gridInitializer: 'popup:addNew:addBlock',
            },
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Add new")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'popup:addNew:addBlock',
                    properties: {},
                  },
                },
              },
            },
          },
        },
      },
    },
    [CONTEXT_SCHEMA_KEY]: getPopupContext(),
  };
  const itemConfig = useSchemaInitializerItem();
  return <ActionInitializerItem {...itemConfig} item={itemConfig} schema={schema} />;
};
