/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
// import { Localization } from './Localization';
import { lazy } from '@nocobase/client';
const { Localization } = lazy(() => import('./Localization'), 'Localization');
import { NAMESPACE } from './locale';

export class PluginLocalizationClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("Localization", { ns: "${NAMESPACE}" })}}`,
      icon: 'GlobalOutlined',
      Component: Localization,
      aclSnippet: 'pm.localization.localization',
    });
  }
}

export default PluginLocalizationClient;
