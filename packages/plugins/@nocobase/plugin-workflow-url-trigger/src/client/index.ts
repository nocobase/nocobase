/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import UrlTrigger from './UrlTrigger';
import ResponseInstruction from './ResponseInstruction';
import { matchUrl } from '../common/matchUrl';

interface TriggerConfig {
  url: string;
  matchMode: string;
  sync: boolean;
}

export default class extends Plugin {
  private unsubscribe: (() => void) | null = null;
  private configs: TriggerConfig[] = [];

  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerTrigger('url', UrlTrigger);
    workflow.registerInstruction('url-response', ResponseInstruction);

    // Fetch URL trigger configs once on load
    this.fetchConfigs();

    // Re-fetch configs when workflows change
    this.app.apiClient.axios.interceptors.response.use((response) => {
      const url = response.config?.url ?? '';
      if (/workflows:(create|update|destroy|enable|disable)/.test(url)) {
        this.fetchConfigs();
      }
      return response;
    });

    // Subscribe to router navigation events
    const trySubscribe = () => {
      const router = this.app.router?.router;
      if (!router || typeof router.subscribe !== 'function') {
        setTimeout(trySubscribe, 500);
        return;
      }

      let lastPathname = router.state?.location?.pathname;

      this.unsubscribe = router.subscribe((state) => {
        const pathname = state.location?.pathname;
        if (!pathname || pathname === lastPathname) {
          return;
        }
        lastPathname = pathname;
        this.handleNavigation(pathname, router);
      });
    };

    trySubscribe();
  }

  private async fetchConfigs() {
    try {
      const res = await this.app.apiClient.request({
        url: 'urlTrigger:configs',
        method: 'get',
      });
      this.configs = res?.data?.data ?? [];
    } catch {
      this.configs = [];
    }
  }

  private handleNavigation(pathname: string, router: any) {
    // Client-side pre-matching: check if any pattern matches
    const hasMatch = this.configs.some((config) => matchUrl(config.url, config.matchMode, pathname));

    if (!hasMatch) {
      return; // No matching trigger — skip backend call entirely
    }

    // Pattern matched — call backend to execute the workflow
    this.app.apiClient
      .request({
        url: 'urlTrigger:check',
        method: 'post',
        data: { path: pathname },
      })
      .then((res) => {
        const result = res?.data?.data ?? res?.data;
        if (!result || result.action === 'passthrough') {
          return;
        }
        if (result.action === 'redirect' && result.url && result.url !== pathname) {
          router.navigate(result.url, { replace: true });
        }
      })
      .catch(() => {
        // Silently fail
      });
  }
}
