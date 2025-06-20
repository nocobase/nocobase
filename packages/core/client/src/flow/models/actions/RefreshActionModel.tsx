/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import { GlobalActionModel } from '../base/ActionModel';

export class RefreshActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: 'Refresh',
    icon: 'ReloadOutlined',
  };
}

RefreshActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    refresh: {
      async handler(ctx, params) {
        const currentResource = ctx.shared?.currentBlockModel?.resource;
        if (!currentResource) {
          ctx.globals.message.error('No resource selected for refresh.');
          return;
        }
        await currentResource.refresh();
      },
    },
  },
});
