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
import { BlockInitializer } from '../../../schema-initializer/items';
import { useOpenModeContext } from '../../popup/OpenModeProvider';

export const AssociateActionInitializer = (props) => {
  const { defaultOpenMode } = useOpenModeContext();
  const { getPopupContext } = usePopupUtils();
  const schema = {
    type: 'void',
    title: '{{ t("Associate") }}',
    'x-action': 'associate',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:popup',
    'x-component': 'Action',
    'x-component-props': {
      openMode: defaultOpenMode,
      refreshDataBlockRequest: true,
    },
    properties: {
      drawer: {
        type: 'void',
        'x-component': 'Action.Container',
        title: '{{ t("Select record") }}',
        'x-component-props': {
          className: 'nb-record-picker-selector',
        },
        'x-decorator': 'AssociateActionProvider',
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'popup:tableSelector:addBlock',
            properties: {},
          },
          footer: {
            'x-component': 'Action.Container.Footer',
            'x-component-props': {},
            properties: {
              actions: {
                type: 'void',
                'x-component': 'ActionBar',
                'x-component-props': {},
                properties: {
                  submit: {
                    title: '{{ t("Submit") }}',
                    'x-action': 'submit',
                    'x-component': 'Action',
                    'x-use-component-props': 'usePickActionProps',
                    'x-toolbar': 'ActionSchemaToolbar',
                    'x-settings': 'actionSettings:submit',
                    'x-component-props': {
                      type: 'primary',
                      htmlType: 'submit',
                    },
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
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
