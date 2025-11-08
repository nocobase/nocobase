/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const EditTableActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Column Settings") }}',
    'x-action': 'edit-table',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:editTable',
    'x-component': 'EditTable.Action',
    'x-use-component-props': 'useEditTableActionProps',
    'x-component-props': {
      icon: 'SettingOutlined',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
