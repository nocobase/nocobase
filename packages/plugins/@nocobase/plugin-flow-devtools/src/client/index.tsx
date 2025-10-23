/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Plugin } from '@nocobase/client';
import { lazy } from '@nocobase/client';
import { NAMESPACE } from './locale';
import { FlowDevtoolsProvider } from './FlowDevtoolsProvider';

const { FlowLogsPanel } = lazy(() => import('./panel'), 'FlowLogsPanel');

export class PluginFlowDevtoolsClient extends Plugin {
  async load() {
    // 尽早应用本地保存的日志发布选项，避免刷新后早期日志被默认规则丢弃
    try {
      const s = localStorage.getItem('nb.flow.logs.options');
      if (s) {
        const stored = JSON.parse(s);
        if (stored && typeof stored === 'object') {
          const prev = (this.app.flowEngine?.logManager?.options as any) || {};
          const next = Object.assign({}, prev, stored);
          this.app.flowEngine?.logManager?.setOptions?.(next);
        }
      }
    } catch (e) {
      console.warn('FlowDevtools: early apply options (plugin.load) failed', e);
    }
    // Global provider with floating button + drawer
    this.app.use(FlowDevtoolsProvider);
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: this.t('Flow DevTools'),
      icon: 'BugOutlined',
      Component: FlowLogsPanel,
      aclSnippet: 'pm.flow-devtools',
    });
  }
}

export default PluginFlowDevtoolsClient;
