/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const CreateFilterActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Filter") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-use-component-props': 'useFilterBlockActionProps',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
