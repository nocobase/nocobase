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
import { secondaryConfirmationAction } from '../../actions/secondaryConfirmationAction';

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
    secondaryConfirmationAction,
    refresh: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.resource) {
          ctx.globals.message.error('No resource selected for refresh.');
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel;
        await currentBlockModel.resource.refresh();
      },
    },
  },
});
