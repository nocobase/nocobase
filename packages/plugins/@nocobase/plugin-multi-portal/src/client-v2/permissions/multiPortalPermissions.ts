/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';

type Translate = (key: string) => unknown;

interface ACLSettingsUILike {
  addPermissionsTab?: (options: {
    key: string;
    label: string;
    sort?: number;
    componentLoader: () => Promise<unknown>;
  }) => void;
}

interface ACLPluginLike {
  settingsUI?: ACLSettingsUILike;
}

interface ApplicationPluginManagerLike {
  get?: (name: string) => unknown;
}

export function registerMultiPortalPermissionsTab(app: Application, t: Translate) {
  const pluginManager = (app as Application & { pm?: ApplicationPluginManagerLike }).pm;
  if (!pluginManager?.get) {
    return;
  }

  const aclPlugin = (pluginManager.get('acl') || pluginManager.get('@nocobase/plugin-acl')) as
    | ACLPluginLike
    | undefined;

  if (!aclPlugin?.settingsUI?.addPermissionsTab) {
    return;
  }

  aclPlugin.settingsUI.addPermissionsTab({
    key: 'multi-portals',
    label: String(t('Multi-Portal')),
    sort: 22,
    componentLoader: () => import('./MultiPortalPermissionsTab'),
  });
}
