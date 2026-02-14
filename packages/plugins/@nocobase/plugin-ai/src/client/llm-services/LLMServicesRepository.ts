/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';

export interface LLMServiceItem {
  llmService: string;
  llmServiceTitle: string;
  provider?: string;
  providerTitle?: string;
  enabledModels: { label: string; value: string }[];
  supportWebSearch?: boolean;
  isToolConflict?: boolean;
}

export class LLMServicesRepository {
  services: LLMServiceItem[] = [];
  loading = false;
  private apiClient: any;
  private loadPromise: Promise<void> | null = null;

  constructor(apiClient: any) {
    this.apiClient = apiClient;
    define(this, {
      services: observable.shallow,
      loading: observable.ref,
    });
  }

  async load() {
    if (this.loadPromise) return this.loadPromise;
    if (this.services.length > 0) return;
    this.loadPromise = this.fetchServices();
    return this.loadPromise;
  }

  async refresh() {
    this.loadPromise = this.fetchServices();
    return this.loadPromise;
  }

  private async fetchServices() {
    this.loading = true;
    try {
      const res = await this.apiClient.resource('ai').listAllEnabledModels();
      const data = res?.data?.data;
      this.services = Array.isArray(data) ? data : [];
    } catch {
      this.services = [];
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }
}
