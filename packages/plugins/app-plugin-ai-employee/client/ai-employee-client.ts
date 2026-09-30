import { useMemo } from 'react';
import { useApiClient, type ApiClient } from '@nocobase/app-client';

import * as employees from './ai-employee-service.js';
import * as conversations from './conversation-center-service.js';
import * as llmServices from './llm-service-service.js';
import * as mcp from './mcp-service.js';
import * as skills from './skills-management-service.js';
import * as tools from './tools-management-service.js';

/** A service function with its leading `ApiClient` already supplied. */
type Bound<F> = F extends (api: ApiClient, ...args: infer A) => infer R
  ? (...args: A) => R
  : never;

/**
 * The plugin's HTTP actions, bound to one `ApiClient`. Pages take it from `useAIEmployeeClient()`, so every request
 * goes through the application's client — its base URL, credentials and `Accept-Language` — and none can be sent
 * through another by forgetting an argument.
 */
export interface AIEmployeeClient {
  readonly listAIEmployees: Bound<typeof employees.listAIEmployees>;
  readonly getAIEmployee: Bound<typeof employees.getAIEmployee>;
  readonly updateAIEmployee: Bound<typeof employees.updateAIEmployee>;
  readonly listEnabledModels: Bound<typeof employees.listEnabledModels>;
  readonly listEnabledKnowledgeBases: Bound<
    typeof employees.listEnabledKnowledgeBases
  >;
  readonly listAISkills: Bound<typeof employees.listAISkills>;
  readonly listAITools: Bound<typeof employees.listAITools>;
  readonly listManagedConversations: Bound<
    typeof conversations.listManagedConversations
  >;
  readonly getManagedConversationMessages: Bound<
    typeof conversations.getManagedConversationMessages
  >;
  readonly listConversationUsers: Bound<
    typeof conversations.listConversationUsers
  >;
  readonly listConversationEmployees: Bound<
    typeof conversations.listConversationEmployees
  >;
  readonly listLLMServices: Bound<typeof llmServices.listLLMServices>;
  readonly listLLMProviders: Bound<typeof llmServices.listLLMProviders>;
  readonly updateLLMServiceEnabled: Bound<
    typeof llmServices.updateLLMServiceEnabled
  >;
  readonly updateLLMServiceEnabledModels: Bound<
    typeof llmServices.updateLLMServiceEnabledModels
  >;
  readonly listProviderModels: Bound<typeof llmServices.listProviderModels>;
  readonly listMCPServers: Bound<typeof mcp.listMCPServers>;
  readonly listMCPTools: Bound<typeof mcp.listMCPTools>;
  readonly testMCPConnection: Bound<typeof mcp.testMCPConnection>;
  readonly updateMCPServerEnabled: Bound<typeof mcp.updateMCPServerEnabled>;
  readonly updateMCPToolPermission: Bound<typeof mcp.updateMCPToolPermission>;
  readonly listManagedSkills: Bound<typeof skills.listManagedSkills>;
  readonly getManagedSkillDetails: Bound<typeof skills.getManagedSkillDetails>;
  readonly listManagedTools: Bound<typeof tools.listManagedTools>;
  readonly getManagedToolDetails: Bound<typeof tools.getManagedToolDetails>;
}

export function createAIEmployeeClient(api: ApiClient): AIEmployeeClient {
  return {
    listAIEmployees: (...args) => employees.listAIEmployees(api, ...args),
    getAIEmployee: (...args) => employees.getAIEmployee(api, ...args),
    updateAIEmployee: (...args) => employees.updateAIEmployee(api, ...args),
    listEnabledModels: (...args) => employees.listEnabledModels(api, ...args),
    listEnabledKnowledgeBases: (...args) =>
      employees.listEnabledKnowledgeBases(api, ...args),
    listAISkills: (...args) => employees.listAISkills(api, ...args),
    listAITools: (...args) => employees.listAITools(api, ...args),
    listManagedConversations: (...args) =>
      conversations.listManagedConversations(api, ...args),
    getManagedConversationMessages: (...args) =>
      conversations.getManagedConversationMessages(api, ...args),
    listConversationUsers: (...args) =>
      conversations.listConversationUsers(api, ...args),
    listConversationEmployees: (...args) =>
      conversations.listConversationEmployees(api, ...args),
    listLLMServices: () => llmServices.listLLMServices(api),
    listLLMProviders: () => llmServices.listLLMProviders(api),
    updateLLMServiceEnabled: (...args) =>
      llmServices.updateLLMServiceEnabled(api, ...args),
    updateLLMServiceEnabledModels: (...args) =>
      llmServices.updateLLMServiceEnabledModels(api, ...args),
    listProviderModels: (...args) =>
      llmServices.listProviderModels(api, ...args),
    listMCPServers: () => mcp.listMCPServers(api),
    listMCPTools: () => mcp.listMCPTools(api),
    testMCPConnection: (...args) => mcp.testMCPConnection(api, ...args),
    updateMCPServerEnabled: (...args) =>
      mcp.updateMCPServerEnabled(api, ...args),
    updateMCPToolPermission: (...args) =>
      mcp.updateMCPToolPermission(api, ...args),
    listManagedSkills: (...args) => skills.listManagedSkills(api, ...args),
    getManagedSkillDetails: (...args) =>
      skills.getManagedSkillDetails(api, ...args),
    listManagedTools: (...args) => tools.listManagedTools(api, ...args),
    getManagedToolDetails: (...args) =>
      tools.getManagedToolDetails(api, ...args),
  };
}

/**
 * The client bound to the application's `ApiClient`. The container holds a single `ApiClient`, so the returned object
 * keeps its identity across renders and can sit in an effect's dependency list.
 */
export function useAIEmployeeClient(): AIEmployeeClient {
  const api = useApiClient();
  return useMemo(() => createAIEmployeeClient(api), [api]);
}
