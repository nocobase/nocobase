/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { GlobalActionModel } from '../base/ActionModel';

export class RefreshActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Refresh'),
    icon: 'ReloadOutlined',
  };
}

RefreshActionModel.define({
  title: escapeT('Refresh'),
});

RefreshActionModel.registerFlow({
  key: 'refreshSettings',
  title: escapeT('Refresh settings'),
  on: 'click',
  steps: {
    refresh: {
      async handler(ctx, params) {
        const currentResource = ctx.currentBlockModel?.resource;
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
