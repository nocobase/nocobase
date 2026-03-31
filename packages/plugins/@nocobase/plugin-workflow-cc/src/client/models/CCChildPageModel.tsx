/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel } from '@nocobase/client';

export class CCChildPageModel extends ChildPageModel {
  onInit(options) {
    super.onInit(options);
    this.context.defineMethod('aclCheck', () => {
      return true;
    });
    this.context.defineProperty('disableFieldClickToOpen', {
      get: () => true,
    });
  }
}

CCChildPageModel.registerFlow({
  key: 'CCChildPageSettings',
  steps: {
    init: {
      handler(ctx, params) {
        ctx.model.context.defineProperty('collection', {
          get: () => ctx.engine.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName),
          cache: false,
        });
      },
    },
  },
});
