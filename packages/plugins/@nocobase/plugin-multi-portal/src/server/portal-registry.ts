/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile } from 'node:fs/promises';
import { collectEnabledPortalRegistryItems, type Application, type ExposedPortalRegistryItem } from '@nocobase/server';
import type { HandlerType } from '@nocobase/resourcer';

const REGISTRY_INDEX_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';
const REGISTRY_ITEM_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

type PortalRegistryCollector = (app: Application) => Promise<Map<string, ExposedPortalRegistryItem>>;

export function createPortalRegistryActionHandlers(
  app: Application,
  collectItems: PortalRegistryCollector = collectEnabledPortalRegistryItems,
): { list: HandlerType; get: HandlerType } {
  return {
    list: async (ctx, next) => {
      const items = await collectItems(app);
      ctx.withoutDataWrapping = true;
      ctx.type = 'application/json';
      ctx.set('Cache-Control', 'no-cache');
      ctx.body = {
        $schema: REGISTRY_INDEX_SCHEMA,
        name: 'nocobase',
        homepage: 'https://www.nocobase.com',
        items: [...items.values()].map(({ filePath, file, ...item }) => item),
      };
      await next();
    },
    get: async (ctx, next) => {
      const name = ctx.action?.params?.name;
      if (typeof name !== 'string' || !REGISTRY_ITEM_NAME_PATTERN.test(name)) {
        ctx.throw(400, 'Invalid Portal Registry item name');
        return;
      }

      const items = await collectItems(app);
      const item = items.get(name);
      if (!item) {
        ctx.throw(404, 'Portal Registry item not found');
        return;
      }

      ctx.withoutDataWrapping = true;
      ctx.type = 'application/json';
      ctx.set('Cache-Control', 'no-cache');
      const etag = `"${item.digest}"`;
      ctx.set('ETag', etag);
      if (ctx.get('If-None-Match') === etag) {
        ctx.status = 304;
        await next();
        return;
      }

      const content = await readFile(item.filePath, 'utf8');
      ctx.body = JSON.parse(content) as unknown;
      await next();
    },
  };
}
