/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Next } from '@nocobase/actions';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { ResourcerContext } from '@nocobase/resourcer';
import { resolve } from 'path';
import os from 'os';
import { Collection } from '@nocobase/database';
export async function allListAction(ctx: ResourcerContext, next: Next, c: Collection) {
  // ctx.body = dictionaryCollections;
  // ctx.db.getCollection("printTemplate").model.findAll()
  //  await c.model.findAll()
  ctx.body = await c.model.findAll();
  await next();
}
