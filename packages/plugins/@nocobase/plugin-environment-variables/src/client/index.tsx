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
// Shared `$env` registration, defined once in client-v2 and imported back here
// via the allowed v1 → v2 direction (see the helper's doc comment).
import { registerEnvProperty } from '../client-v2/registerEnvProperty';

export class PluginEnvironmentVariablesClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('environment', {
      title: this.t('Variables and secrets'),
      icon: 'TableOutlined',
      Component: EnvironmentPage,
    });
    // Legacy v1 path: `$env` as a React-context global var, consumed by the v1
    // Formily `Variable.Input` scope (`useGlobalVariable('$env')`). Kept as-is.
    this.app.addGlobalVar('$env', useGetEnvironmentVariables, useGetEnvironmentVariablesCtx);
    this.app.use(EnvironmentVariablesAndSecretsProvider);
    // Also expose `$env` on the flow-engine context (the v2 mechanism), so v2 UI
    // rendered in the v1 runtime — e.g. workflow's config drawer, which mounts
    // detached from the React tree and can't read the React-context global var —
    // can still resolve `$env` via `flowEngine.context.getPropertyMetaTree()`.
    registerEnvProperty(this.app.flowEngine.context, this.app.apiClient, (key) => this.t(key));
  }
}

export default PluginEnvironmentVariablesClient;
