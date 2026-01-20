/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

export function attachOpenViewButton(ctx: FlowCtx) {
  ctx.element.innerHTML = '<button class="js-open-view">Open dialog</button>';
  const button = ctx.element.querySelector('.js-open-view');
  button?.addEventListener('click', () => {
    ctx.runAction('openView', {
      navigation: false,
      mode: 'dialog',
      collectionName: 'users',
      dataSourceKey: 'main',
      filterByTk: 1,
    });
  });
}
