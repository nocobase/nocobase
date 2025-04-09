/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { EnvironmentVariablesAndSecretsProvider } from './EnvironmentVariablesAndSecretsProvider';
import EnvironmentPage from './components/EnvironmentPage';
import { useGetEnvironmentVariables, useGetEnvironmentVariablesCtx } from './utils';

export class PluginEnvironmentVariablesClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('environment', {
      title: this.t('Variables and secrets'),
      icon: 'TableOutlined',
      Component: EnvironmentPage,
    });
    this.app.addGlobalVar('$env', useGetEnvironmentVariables, useGetEnvironmentVariablesCtx);
    this.app.use(EnvironmentVariablesAndSecretsProvider);
  }
}

export default PluginEnvironmentVariablesClient;
