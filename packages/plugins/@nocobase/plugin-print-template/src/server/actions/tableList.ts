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
export async function tableListAction(ctx: ResourcerContext, next: Next, dictionaryCollections: any) {
  ctx.body = dictionaryCollections;
}
