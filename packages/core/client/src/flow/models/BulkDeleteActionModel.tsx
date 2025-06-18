/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel } from './ActionModel';

export class BulkDeleteActionModel extends ActionModel {}

BulkDeleteActionModel.registerFlow({
  key: 'handleBulkDelete',
  on: {
    eventName: 'onClick',
  },
  title: '删除',
  steps: {
    delete: {
      handler(ctx, params) {
        console.log('Bulk delete action triggered', ctx);
      },
    },
  },
});
