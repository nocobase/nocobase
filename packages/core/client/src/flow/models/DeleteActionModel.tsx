/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { ActionModel } from './ActionModel';

export class DeleteActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'Delete',
  };
}

DeleteActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    secondaryConfirmation: {
      title: '二次确认',
      uiSchema: {
        enable: {
          type: 'boolean',
          title: 'Enable secondary confirmation',
          default: true,
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        },
        title: {
          type: 'string',
          title: 'Title',
          default: 'Delete record',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
        content: {
          type: 'string',
          title: 'Content',
          default: 'Are you sure you want to delete it?',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams(ctx) {
        return {
          enable: true,
          title: 'Delete record',
          content: 'Are you sure you want to delete it?',
        };
      },
      async handler(ctx, params) {
        if (params.enable) {
          const confirmed = await ctx.globals.modal.confirm({
            title: params.title,
            content: params.content,
          });

          if (!confirmed) {
            ctx.exit();
          }
        }
      },
    },
    delete: {
      async handler(ctx, params) {
        if (!ctx.extra.currentResource || !ctx.extra.currentRecord) {
          ctx.globals.message.error('No resource or record selected for deletion.');
          return;
        }
        await ctx.extra.currentResource.destroy(ctx.extra.currentRecord);
        ctx.globals.message.success('Record deleted successfully.');
        await ctx.extra.currentResource.refresh();
      },
    },
    refresh: {
      title: '执行后刷新数据',
      uiSchema: {
        enable: {
          type: 'boolean',
          title: 'Enable refresh',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        },
      },
      defaultParams(ctx) {
        return {
          enable: true,
        };
      },
      async handler(ctx, params) {
        if (params.enable) {
          await ctx.extra.currentResource.refresh();
          ctx.globals.message.success('Data refreshed successfully.');
        }
      },
    },
  },
});
