/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel } from './actionModel';
import { Modal } from 'antd';

export const DeleteActionModel = ActionModel.extends([
  {
    key: 'onClick',
    title: '删除操作',
    steps: {
      showConfirm: {
        title: '确认弹窗',
        handler: async (ctx, params) => {
          if (params.showConfirm) {
            await new Promise((resolve) => {
              Modal.confirm({
                title: params.title,
                content: params.content,
                onOk: () => resolve(true),
                onCancel: () => {
                  ctx.exit();
                  resolve(false);
                },
              });
            });
          }
        },
        defaultParams: {
          showConfirm: true,
          title: '确定删除吗？',
          content: '删除后无法恢复，请谨慎操作。',
        },
      },
      deleteData: {
        handler: (ctx, params) => {
          console.log('delete', ctx, ctx.model, params);
          Modal.success({
            title: '删除成功',
            content: '数据删除成功。',
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
          text: '删除',
        },
      },
    },
  },
]);
