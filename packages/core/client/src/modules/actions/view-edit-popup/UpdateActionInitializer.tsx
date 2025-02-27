/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { usePopupUtils } from '../../../schema-component/antd/page/pagePopupUtils';
import { CONTEXT_SCHEMA_KEY } from '../../../schema-component/antd/page/usePopupContextInActionOrAssociationField';
import { ActionInitializerItem } from '../../../schema-initializer/items/ActionInitializerItem';
import { useOpenModeContext } from '../../popup/OpenModeProvider';

export const UpdateActionInitializer = (props) => {
  const { defaultOpenMode } = useOpenModeContext();
  const { getPopupContext } = usePopupUtils();
  const schema = {
    type: 'void',
    title: '{{ t("Edit") }}',
    'x-action': 'update',
    'x-acl-action': 'update',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:edit',
    'x-component': 'Action',
    'x-component-props': {
      openMode: defaultOpenMode,
      icon: 'EditOutlined',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Edit record") }}',
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
                title: '{{t("Edit")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'popup:common:addBlock',
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
  return <ActionInitializerItem {...props} schema={schema} />;
};
