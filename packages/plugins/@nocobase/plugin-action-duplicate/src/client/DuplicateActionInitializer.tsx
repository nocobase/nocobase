/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionInitializerItem, useOpenModeContext } from '@nocobase/client';
import React from 'react';

export const DuplicateActionInitializer = (props) => {
  const { defaultOpenMode } = useOpenModeContext();

  const schema = {
    type: 'void',
    'x-action': 'duplicate',
    'x-acl-action': 'create',
    title: '{{ t("Duplicate") }}',
    'x-component': 'Action.Link',
    'x-decorator': 'DuplicateActionDecorator',
    'x-component-props': {
      openMode: defaultOpenMode,
      component: 'DuplicateAction',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Duplicate") }}',
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
                title: '{{t("Duplicate")}}',
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
  };
  return <ActionInitializerItem {...props} schema={schema} />;
};
