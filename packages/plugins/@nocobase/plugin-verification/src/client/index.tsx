/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
// import { VerificationProviders } from './VerificationProviders';
import { lazy } from '@nocobase/client';
const { VerificationProviders } = lazy(() => import('./VerificationProviders'), 'VerificationProviders');
import { NAMESPACE } from './locale';

export class PluginVerificationClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'CheckCircleOutlined',
      title: `{{t("Verification", { ns: "${NAMESPACE}" })}}`,
      Component: VerificationProviders,
      aclSnippet: 'pm.verification.providers',
    });
  }
}

export default PluginVerificationClient;
