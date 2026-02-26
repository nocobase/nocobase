/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import { ToolsEntry, type ToolsManager } from '@nocobase/client';
import { AIEmployee } from '../ai-employees/types';

export interface LLMServiceItem {
  llmService: string;
  llmServiceTitle: string;
  provider?: string;
  providerTitle?: string;
  enabledModels: { label: string; value: string }[];
  supportWebSearch?: boolean;
  isToolConflict?: boolean;
}

export class AIConfigRepository {
  llmServices = observable.shallow<LLMServiceItem[]>([]);
  llmServicesLoading = false;
  aiEmployees = observable.shallow<AIEmployee[]>([]);
  aiEmployeesLoading = false;
  aiTools = observable.shallow<ToolsEntry[]>([]);
  aiToolsLoading = false;

  private llmServicesLoaded = false;
  private aiEmployeesLoaded = false;
  private aiToolsLoaded = false;
  private llmServicesInFlight: Promise<LLMServiceItem[]> | null = null;
  private aiEmployeesInFlight: Promise<AIEmployee[]> | null = null;
  private aiToolsInFlight: Promise<ToolsEntry[]> | null = null;

  constructor(
    private readonly apiClient: any,
    private readonly options?: { toolsManager?: Pick<ToolsManager, 'listTools'> },
  ) {
    define(this, {
      llmServices: observable.shallow,
      llmServicesLoading: observable.ref,
      aiEmployees: observable.shallow,
      aiEmployeesLoading: observable.ref,
      aiTools: observable.shallow,
      aiToolsLoading: observable.ref,
    });
  }

  async getLLMServices(): Promise<LLMServiceItem[]> {
    if (this.llmServicesInFlight) {
      return this.llmServicesInFlight;
    }
    if (this.llmServicesLoaded) {
      return this.llmServices;
    }
    return this.startRefresh(
      this.llmServicesInFlight,
      (promise) => {
        this.llmServicesInFlight = promise;
      },
      () => this.doRefreshLLMServices(),
      () => this.llmServices,
    );
  }

  async refreshLLMServices(): Promise<LLMServiceItem[]> {
    return this.startRefresh(
      this.llmServicesInFlight,
      (promise) => {
        this.llmServicesInFlight = promise;
      },
      () => this.doRefreshLLMServices(),
      () => this.llmServices,
    );
  }

  async getAIEmployees(): Promise<AIEmployee[]> {
    if (this.aiEmployeesInFlight) {
      return this.aiEmployeesInFlight;
    }
    if (this.aiEmployeesLoaded) {
      return this.aiEmployees;
    }
    return this.startRefresh(
      this.aiEmployeesInFlight,
      (promise) => {
        this.aiEmployeesInFlight = promise;
      },
      () => this.doRefreshAIEmployees(),
      () => this.aiEmployees,
    );
  }

  async refreshAIEmployees(): Promise<AIEmployee[]> {
    return this.startRefresh(
      this.aiEmployeesInFlight,
      (promise) => {
        this.aiEmployeesInFlight = promise;
      },
      () => this.doRefreshAIEmployees(),
      () => this.aiEmployees,
    );
  }

  getAIEmployeesMap(): Record<string, AIEmployee> {
    return this.aiEmployees.reduce<Record<string, AIEmployee>>((acc, aiEmployee) => {
      acc[aiEmployee.username] = aiEmployee;
      return acc;
    }, {});
  }

  async getAITools(): Promise<ToolsEntry[]> {
    if (this.aiToolsInFlight) {
      return this.aiToolsInFlight;
    }
    if (this.aiToolsLoaded) {
      return this.aiTools;
    }
    return this.startRefresh(
      this.aiToolsInFlight,
      (promise) => {
        this.aiToolsInFlight = promise;
      },
      () => this.doRefreshAITools(),
      () => this.aiTools,
    );
  }

  async refreshAITools(): Promise<ToolsEntry[]> {
    return this.startRefresh(
      this.aiToolsInFlight,
      (promise) => {
        this.aiToolsInFlight = promise;
      },
      () => this.doRefreshAITools(),
      () => this.aiTools,
    );
  }

  private startRefresh<T>(
    inFlight: Promise<T> | null,
    setInFlight: (promise: Promise<T> | null) => void,
    refresh: () => Promise<void>,
    getData: () => T,
  ): Promise<T> {
    if (inFlight) {
      return inFlight;
    }
    const promise = refresh()
      .then(() => getData())
      .finally(() => {
        setInFlight(null);
      });
    setInFlight(promise);
    return promise;
  }

  private async doRefreshLLMServices() {
    this.llmServicesLoading = true;
    try {
      const res = await this.apiClient.resource('ai').listAllEnabledModels();
      const data = Array.isArray(res?.data?.data) ? (res.data.data as LLMServiceItem[]) : [];
      this.llmServices.splice(0, this.llmServices.length);
      this.llmServices.push(...data);
      this.llmServicesLoaded = true;
    } catch {
      this.llmServices.splice(0, this.llmServices.length);
      this.llmServicesLoaded = false;
    } finally {
      this.llmServicesLoading = false;
    }
  }

  private async doRefreshAIEmployees() {
    this.aiEmployeesLoading = true;
    try {
      const aiEmployees: AIEmployee[] = await this.apiClient
        .resource('aiEmployees')
        .listByUser()
        .then((res) => res?.data?.data);
      this.aiEmployees.splice(0, this.aiEmployees.length);
      this.aiEmployees.push(...(aiEmployees || []));
      this.aiEmployeesLoaded = true;
    } catch {
      this.aiEmployees.splice(0, this.aiEmployees.length);
      this.aiEmployeesLoaded = false;
    } finally {
      this.aiEmployeesLoading = false;
    }
  }

  private async doRefreshAITools() {
    this.aiToolsLoading = true;
    try {
      let tools: ToolsEntry[] = [];
      if (this.options?.toolsManager) {
        tools = await this.options.toolsManager.listTools();
      } else {
        const { data: res } = await this.apiClient.resource('aiTools').list({});
        tools = Array.isArray(res?.data) ? res.data : [];
      }
      this.aiTools.splice(0, this.aiTools.length);
      this.aiTools.push(...tools);
      this.aiToolsLoaded = true;
    } catch {
      this.aiTools.splice(0, this.aiTools.length);
      this.aiToolsLoaded = false;
    } finally {
      this.aiToolsLoading = false;
    }
  }
}
