/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { RecordActionModel } from '../base/ActionModel';

export class ViewActionModel extends RecordActionModel {
  defaultProps: ButtonProps = {
    type: 'link',
    title: 'View',
  };
}

ViewActionModel.registerFlow({
  key: 'handleClick',
  title: '点击事件',
  on: {
    eventName: 'click',
  },
  steps: {
    popup: {
      use: 'popup',
      defaultParams(ctx) {
        return {
          sharedContext: {
            parentExtra: ctx.extra,
            parentShared: ctx.shared,
            parentRecord: ctx.extra?.currentRecord,
            parentBlockModel: ctx.shared?.currentBlockModel,
          },
        };
      },
    },
  },
});
