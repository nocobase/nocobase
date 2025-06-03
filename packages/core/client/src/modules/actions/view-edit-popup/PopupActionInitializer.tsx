/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { ACLActionProvider } from '../../../acl/ACLProvider';
import { useSchemaInitializerItem } from '../../../application';
import { ClearCollectionFieldContext } from '../../../data-source/collection-field/CollectionFieldProvider';
import { usePopupUtils } from '../../../schema-component/antd/page/pagePopupUtils';
import { CONTEXT_SCHEMA_KEY } from '../../../schema-component/antd/page/usePopupContextInActionOrAssociationField';
import { BlockInitializer } from '../../../schema-initializer/items';
import { useOpenModeContext } from '../../popup/OpenModeProvider';

export const PopupActionDecorator: FC = (props) => {
  return (
    <ClearCollectionFieldContext>
      <ACLActionProvider>{props.children}</ACLActionProvider>
    </ClearCollectionFieldContext>
  );
};

export const PopupActionInitializer = (props) => {
  const { defaultOpenMode } = useOpenModeContext();
  const { getPopupContext } = usePopupUtils();
  const schema = {
    type: 'void',
    title: '{{ t("Popup") }}',
    'x-action': 'customize:popup',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:popup',
    'x-component': props?.['x-component'] || 'Action.Link',
    'x-component-props': {
      openMode: defaultOpenMode,
      refreshDataBlockRequest: true,
    },
    'x-decorator': 'PopupActionDecorator',
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Popup") }}',
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
                    'x-initializer': props?.['x-initializer'] || 'popup:common:addBlock',
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
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
