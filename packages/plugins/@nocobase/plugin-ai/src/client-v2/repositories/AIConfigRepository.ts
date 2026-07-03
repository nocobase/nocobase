/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@nocobase/flow-engine';
import type { APIClient, SkillsEntry, ToolsEntry, ToolsManager } from '@nocobase/client-v2';
import type { AIEmployee } from '../ai-employees/types';

type APIListResponse = {
  data?: {
    data?: unknown;
  };
};

type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;

export interface LLMServiceItem {
  llmService: string;
  llmServiceTitle: string;
  provider?: string;
  providerTitle?: string;
  enabledModels: { label: string; value: string }[];
  supportWebSearch?: boolean;
  isToolConflict?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isResourceAction(value: unknown): value is ResourceAction {
  return typeof value === 'function';
}

function isAPIListResponse(value: unknown): value is APIListResponse {
  return isRecord(value) && (value.data === undefined || isRecord(value.data));
}

function readArrayData(response: unknown): unknown[] {
  if (!isAPIListResponse(response)) {
    return [];
  }
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

function isModelOption(value: unknown): value is { label: string; value: string } {
  return isRecord(value) && typeof value.label === 'string' && typeof value.value === 'string';
}

function isLLMServiceItem(value: unknown): value is LLMServiceItem {
  return (
    isRecord(value) &&
    typeof value.llmService === 'string' &&
    typeof value.llmServiceTitle === 'string' &&
    Array.isArray(value.enabledModels) &&
    value.enabledModels.every(isModelOption)
  );
}

function isAIEmployee(value: unknown): value is AIEmployee {
  return isRecord(value) && typeof value.username === 'string';
}

function isToolsEntry(value: unknown): value is ToolsEntry {
  return (
    isRecord(value) &&
    isRecord(value.definition) &&
    typeof value.definition.name === 'string' &&
    typeof value.definition.description === 'string'
  );
}

function isSkillsEntry(value: unknown): value is SkillsEntry {
  return isRecord(value) && typeof value.name === 'string' && typeof value.description === 'string';
}

export class AIConfigRepository {
  llmServices = observable.shallow<LLMServiceItem[]>([]);
  llmServicesLoading = false;
  aiEmployees = observable.shallow<AIEmployee[]>([]);
  aiEmployeesLoading = false;
  aiTools = observable.shallow<ToolsEntry[]>([]);
  aiToolsLoading = false;
  aiSkills = observable.shallow<SkillsEntry[]>([]);
  aiSkillsLoading = false;

  private llmServicesLoaded = false;
  private aiEmployeesLoaded = false;
  private aiToolsLoaded = false;
  private aiToolsBySessionId: string | undefined = null;
  private aiSkillsLoaded = false;
  private llmServicesInFlight: Promise<LLMServiceItem[]> | null = null;
  private aiEmployeesInFlight: Promise<AIEmployee[]> | null = null;
  private aiToolsInFlight: Promise<ToolsEntry[]> | null = null;
  private aiSkillsInFlight: Promise<SkillsEntry[]> | null = null;

  constructor(
    private readonly apiClient: Pick<APIClient, 'resource'>,
    private readonly options?: { toolsManager?: Pick<ToolsManager, 'listTools'> },
  ) {
    define(this, {
      llmServices: observable.shallow,
      llmServicesLoading: observable.ref,
      aiEmployees: observable.shallow,
      aiEmployeesLoading: observable.ref,
      aiTools: observable.shallow,
      aiToolsLoading: observable.ref,
      aiSkills: observable.shallow,
      aiSkillsLoading: observable.ref,
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

  async getAITools(sessionId?: string): Promise<ToolsEntry[]> {
    if (this.aiToolsInFlight) {
      return this.aiToolsInFlight;
    }
    if (this.aiToolsLoaded && this.aiToolsBySessionId === sessionId) {
      return this.aiTools;
    }
    return this.startRefresh(
      this.aiToolsInFlight,
      (promise) => {
        this.aiToolsInFlight = promise;
      },
      () => this.doRefreshAITools(sessionId),
      () => this.aiTools,
    );
  }

  async refreshAITools(sessionId?: string): Promise<ToolsEntry[]> {
    return this.startRefresh(
      this.aiToolsInFlight,
      (promise) => {
        this.aiToolsInFlight = promise;
      },
      () => this.doRefreshAITools(sessionId),
      () => this.aiTools,
    );
  }

  async getAISkills(): Promise<SkillsEntry[]> {
    if (this.aiSkillsInFlight) {
      return this.aiSkillsInFlight;
    }
    if (this.aiSkillsLoaded) {
      return this.aiSkills;
    }
    return this.startRefresh(
      this.aiSkillsInFlight,
      (promise) => {
        this.aiSkillsInFlight = promise;
      },
      () => this.doRefreshAISkills(),
      () => this.aiSkills,
    );
  }

  async refreshAISkills(): Promise<SkillsEntry[]> {
    return this.startRefresh(
      this.aiSkillsInFlight,
      (promise) => {
        this.aiSkillsInFlight = promise;
      },
      () => this.doRefreshAISkills(),
      () => this.aiSkills,
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

  private async callResourceAction(
    resourceName: string,
    actionName: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    const resource: Record<string, unknown> = this.apiClient.resource(resourceName);
    const action = resource[actionName];
    if (!isResourceAction(action)) {
      return undefined;
    }
    return action(params);
  }

  private async doRefreshLLMServices() {
    this.llmServicesLoading = true;
    try {
      const res = await this.callResourceAction('ai', 'listAllEnabledModels');
      const data = readArrayData(res).filter(isLLMServiceItem);
      this.llmServices = data;
      this.llmServicesLoaded = true;
    } catch {
      this.llmServices = [];
      this.llmServicesLoaded = false;
    } finally {
      this.llmServicesLoading = false;
    }
  }

  private async doRefreshAIEmployees() {
    this.aiEmployeesLoading = true;
    try {
      const res = await this.callResourceAction('aiEmployees', 'listByUser');
      const aiEmployees = readArrayData(res).filter(isAIEmployee);
      this.aiEmployees = aiEmployees;
      this.aiEmployeesLoaded = true;
    } catch {
      this.aiEmployees = [];
      this.aiEmployeesLoaded = false;
    } finally {
      this.aiEmployeesLoading = false;
    }
  }

  private async doRefreshAITools(sessionId?: string) {
    this.aiToolsLoading = true;
    try {
      let tools: ToolsEntry[] = [];
      if (this.options?.toolsManager) {
        tools = await this.options.toolsManager.listTools({ sessionId });
      } else {
        const res = await this.callResourceAction('aiTools', 'list', { filter: { sessionId } });
        tools = readArrayData(res).filter(isToolsEntry);
      }
      this.aiTools = tools;
      this.aiToolsLoaded = true;
      this.aiToolsBySessionId = sessionId;
    } catch {
      this.aiTools = [];
      this.aiToolsLoaded = false;
      this.aiToolsBySessionId = null;
    } finally {
      this.aiToolsLoading = false;
    }
  }

  private async doRefreshAISkills() {
    this.aiSkillsLoading = true;
    try {
      const res = await this.callResourceAction('aiSkills', 'list', {});
      const data = readArrayData(res).filter(isSkillsEntry);
      this.aiSkills = data;
      this.aiSkillsLoaded = true;
    } catch {
      this.aiSkills = [];
      this.aiSkillsLoaded = false;
    } finally {
      this.aiSkillsLoading = false;
    }
  }
}
