/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource } from '@nocobase/flow-engine';
import React from 'react';
import { ActionModel } from './ActionModel';

export class BulkDeleteActionModel extends ActionModel {
  title = 'Delete';
}

BulkDeleteActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!ctx.extra.currentResource) {
          return;
        }
        const resource = ctx.extra.currentResource as MultiRecordResource;
        await resource.destroySelectedRows();
      },
    },
  },
});
