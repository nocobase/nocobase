/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Plugin from '..';

export async function listBasicInfo(context, next) {
  const { storagesCache } = context.app.pm.get(Plugin) as Plugin;
  const result = Array.from(storagesCache.values()).map((item) => ({
    id: item.id,
    title: item.title,
    name: item.name,
    type: item.type,
    rules: item.rules,
    default: item.default,
  }));

  context.body = result;

  next();
}
