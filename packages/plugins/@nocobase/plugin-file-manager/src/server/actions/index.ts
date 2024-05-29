/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions from '@nocobase/actions';
import { createMiddleware, destroyMiddleware } from './attachments';
import * as storageActions from './storages';

export default function ({ app }) {
  app.resourcer.define({
    name: 'storages',
    actions: storageActions,
  });
  app.resourcer.use(createMiddleware, { tag: 'createMiddleware', after: 'auth' });
  app.resourcer.registerActionHandler('upload', actions.create);

  app.resourcer.use(destroyMiddleware);
}
