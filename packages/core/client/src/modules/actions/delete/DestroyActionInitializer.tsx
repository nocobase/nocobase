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

export const DestroyActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Delete") }}',
    'x-action': 'destroy',
    'x-acl-action': 'destroy',
    'x-component': 'Action',
    'x-use-component-props': 'useDestroyActionProps',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:delete',
    'x-component-props': {
      icon: 'DeleteOutlined',
      confirm: {
        title: "{{t('Delete record')}}",
        content: "{{t('Are you sure you want to delete it?')}}",
      },
      refreshDataBlockRequest: true,
    },
    'x-action-settings': {
      triggerWorkflows: [],
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
