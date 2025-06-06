/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Modal } from 'antd';
import { ActionModel } from './actionModel';

export const RefreshActionModel = ActionModel.extends([
  {
    key: 'onClick',
    title: '刷新操作',
    steps: {
      refresh: {
        handler: (ctx, params) => {
          console.log('refresh', ctx, ctx.model, params);
          Modal.success({
            title: '刷新成功',
            content: '数据刷新成功。',
          });
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
          text: '刷新',
        },
      },
    },
  },
]);
