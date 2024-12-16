/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { MultiAppManagerProvider } from './MultiAppManagerProvider';
// import { AppManager } from './AppManager';
import { lazy } from '@nocobase/client';
const { AppManager } = lazy(() => import('./AppManager'), 'AppManager');

import { NAMESPACE } from '../locale';

export class PluginMultiAppManagerClient extends Plugin {
  async load() {
    this.app.use(MultiAppManagerProvider);

    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Multi-app manager", { ns: "${NAMESPACE}" })}}`,
      icon: 'AppstoreOutlined',
      Component: AppManager,
      aclSnippet: 'pm.multi-app-manager.applications',
    });
  }
}

export default PluginMultiAppManagerClient;
export { formSchema, tableActionColumnSchema } from './settings/schemas/applications';
