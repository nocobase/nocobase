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
import { formSchema } from './settings/schemas/applications';
import _merge from 'lodash/merge';
const { AppManager } = lazy(() => import('./AppManager'), 'AppManager');

import { NAMESPACE } from '../locale';

export class PluginMultiAppManagerClient extends Plugin {
  async load() {
    this.app.use(MultiAppManagerProvider);

    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Multi-app manager (deprecated)", { ns: "${NAMESPACE}" })}}`,
      icon: 'AppstoreOutlined',
      Component: AppManager,
      sort: 1000,
      aclSnippet: 'pm.multi-app-manager.applications',
    });
  }

  extendFormSchema(schema: any) {
    _merge(formSchema, schema);
  }
}

export default PluginMultiAppManagerClient;
export { formSchema, tableActionColumnSchema } from './settings/schemas/applications';
