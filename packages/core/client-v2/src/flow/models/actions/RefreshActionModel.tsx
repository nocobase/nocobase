/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { ActionModel, ActionSceneEnum } from '../base';

export class RefreshActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: tExpr('Refresh'),
    icon: 'ReloadOutlined',
  };
}

RefreshActionModel.define({
  label: tExpr('Refresh'),
  toggleable: true,
});

RefreshActionModel.registerFlow({
  key: 'refreshSettings',
  title: tExpr('Refresh settings'),
  on: 'click',
  steps: {
    refresh: {
      async handler(ctx, params) {
        const currentResource = ctx.blockModel?.resource;
        if (!currentResource) {
          ctx.message.error(ctx.t('No resource selected for refresh'));
          return;
        }
        currentResource.loading = true;
        await currentResource.refresh();
      },
    },
  },
});
