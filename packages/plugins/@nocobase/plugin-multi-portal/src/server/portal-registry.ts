/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { collectEnabledPortalRegistryItems, type Application, type ExposedPortalRegistryItem } from '@nocobase/server';
import type { HandlerType } from '@nocobase/resourcer';

const REGISTRY_INDEX_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';
const REGISTRY_ITEM_SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json';
const REGISTRY_ITEM_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const ALL_REGISTRY_ITEM_NAME = 'all';

type PortalRegistryCollector = (app: Application) => Promise<Map<string, ExposedPortalRegistryItem>>;

export function createPortalRegistryActionHandlers(
  app: Application,
  collectItems: PortalRegistryCollector = collectEnabledPortalRegistryItems,
): { list: HandlerType; get: HandlerType } {
  let itemsPromise: Promise<Map<string, ExposedPortalRegistryItem>> | undefined;
  const getItems = () => {
    if (!itemsPromise) {
      itemsPromise = collectItems(app).catch((error) => {
        itemsPromise = undefined;
        throw error;
      });
    }
    return itemsPromise;
  };

  return {
    list: async (ctx, next) => {
      const items = await getItems();
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

      const items = await getItems();
      if (name === ALL_REGISTRY_ITEM_NAME) {
        const sortedItems = [...items.values()].sort((left, right) => left.name.localeCompare(right.name));
        const dependencies = sortedItems.map((item) => `@nocobase/${item.name}`);
        const digest = createHash('sha256')
          .update(sortedItems.map((item) => `${item.name}:${item.digest}`).join('\n'))
          .digest('hex');
        const etag = `"sha256:${digest}"`;

        ctx.withoutDataWrapping = true;
        ctx.type = 'application/json';
        ctx.set('Cache-Control', 'no-cache');
        ctx.set('ETag', etag);
        if (ctx.get('If-None-Match') === etag) {
          ctx.status = 304;
          await next();
          return;
        }

        ctx.body = {
          $schema: REGISTRY_ITEM_SCHEMA,
          name: ALL_REGISTRY_ITEM_NAME,
          type: 'registry:lib',
          title: 'All enabled NocoBase Portal Registries',
          registryDependencies: dependencies,
          files: [],
        };
        await next();
        return;
      }

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
