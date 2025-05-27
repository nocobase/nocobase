/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel } from './actionModel';

export const UpdateActionModel = ActionModel.extends([
  {
    key: 'onClick',
    title: '更新操作',
    steps: {
      update: {
        handler: (ctx, model, params) => {
          console.log('update', ctx, model, params);
        },
      },
    },
  },
  {
    key: 'default',
    patch: true,
    steps: {
      setText: {
        defaultParams: {
          text: '更新',
        },
      },
    },
  },
]);
