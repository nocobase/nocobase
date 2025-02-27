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
import { BlockInitializer } from '../../../schema-initializer/items';

export const LinkActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Link") }}',
    'x-action': 'customize:link',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:link',
    'x-component': props?.['x-component'] || 'Action.Link',
    'x-use-component-props': 'useLinkActionProps',
    'x-decorator': 'ACLActionProvider',
  };

  const itemConfig = useSchemaInitializerItem();
  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
