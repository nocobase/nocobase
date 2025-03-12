/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ActionInitializerItem } from '../../../schema-initializer/items/ActionInitializerItem';

export const UpdateSubmitActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Submit") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-use-component-props': 'useUpdateActionProps',
    // 'x-designer': 'Action.Designer',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:updateSubmit',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
    },
  };
  return <ActionInitializerItem {...props} schema={schema} />;
};
