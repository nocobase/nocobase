/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { lazy, Plugin } from '@nocobase/client';

const EnvironmentPage = lazy(() => import('./components/EnvironmentPage'));
import { useGetEnvironmentVariables } from './utils';
export class PluginEnvironmentClient extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('environment', {
      title: this.t('Environment'),
      icon: 'TableOutlined',
      Component: EnvironmentPage,
    });
    this.app.addGlobalVar('environment', useGetEnvironmentVariables);
  }
}

export default PluginEnvironmentClient;
