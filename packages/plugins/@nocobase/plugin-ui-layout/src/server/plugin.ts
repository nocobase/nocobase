/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import type { ResourcerContext } from '@nocobase/resourcer';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../constants';
import { ensureDefaultUiLayout } from './ensureDefaultUiLayout';

function normalizeLayoutUid(layout: unknown) {
  const uid = Array.isArray(layout) ? layout[0] : layout;

  if (typeof uid === 'string' && uid.trim()) {
    return uid;
  }

  return DEFAULT_ADMIN_UI_LAYOUT.uid;
}

function getDesktopRouteLayoutFilter(layoutUid: string) {
  const currentLayoutFilter = {
    'uiLayouts.uid': layoutUid,
  };

  if (layoutUid !== DEFAULT_ADMIN_UI_LAYOUT.uid) {
    return currentLayoutFilter;
  }

  return {
    $or: [currentLayoutFilter, { 'uiLayouts.id.$notExists': true }],
  };
}

async function addDesktopRouteLayoutFilter(ctx: ResourcerContext, next: () => Promise<void>) {
  const layoutUid = normalizeLayoutUid(ctx.action?.params.layout);

  ctx.action?.mergeParams({
    filter: getDesktopRouteLayoutFilter(layoutUid),
  });

  await next();
}

export class PluginUiLayoutServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.resourceManager.registerPreActionHandler('desktopRoutes:listAccessible', addDesktopRouteLayoutFilter);
  }

  async install() {
    await ensureDefaultUiLayout(this.db);
  }

  async afterEnable() {
    await ensureDefaultUiLayout(this.db);
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginUiLayoutServer;
