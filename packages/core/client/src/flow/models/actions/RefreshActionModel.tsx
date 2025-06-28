/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import { tval } from '@nocobase/utils/client';
import { GlobalActionModel } from '../base/ActionModel';

export class RefreshActionModel extends GlobalActionModel {
  defaultProps: ButtonProps = {
    title: tval('Refresh'),
    icon: 'ReloadOutlined',
  };
}

RefreshActionModel.define({
  title: tval('Refresh'),
});

RefreshActionModel.registerFlow({
  key: 'handleClick',
  title: tval('Click event'),
  on: {
    eventName: 'click',
  },
  steps: {
    refresh: {
      async handler(ctx, params) {
        const t = ctx.globals.flowEngine.translate;
        const currentResource = ctx.shared?.currentBlockModel?.resource;
        if (!currentResource) {
          ctx.globals.message.error(t('No resource selected for refresh'));
          return;
        }
        currentResource.loading = true;
        await currentResource.refresh();
      },
    },
  },
});
