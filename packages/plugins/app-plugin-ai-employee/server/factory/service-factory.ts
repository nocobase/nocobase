import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { AIManager } from '@nocobase/ai-employee';
import { databaseManagerToken } from '@nocobase/db';
import { cachingToken } from '@nocobase/app-server/caching';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import type { ServiceContainer } from '@nocobase/service-provider';

import type { AIApplicationConfig } from '../config.js';
import type { AIResourceRegistrar } from '../ai/index.js';
import type { ManagerFactory } from './manager-factory.js';
import { LLMServiceConfigSynchronizer } from '../manager/llm-service-config.js';
import { AI_API_BASE_PATH } from '../types.js';
import { AgentServiceFactory } from '../agent/service/agent-service-factory.js';
import { AIConversationService } from '../service/ai-conversation-service.js';
import { AIEmployeeService } from '../service/ai-employee-service.js';
import { AIMCPServerService } from '../service/ai-mcp-server-service.js';
import { AISkillService } from '../service/ai-skill-service.js';
import { AIToolService } from '../service/ai-tool-service.js';
import { AIFileService } from '../service/file-service.js';
import { AIFileMetadataRepository } from '../repository/file-storage/ai-file-metadata-repository.js';
import { LLMService } from '../service/llm-service.js';
import { ModelService } from '../service/model-service.js';
import { loadResources } from '../service/resource-loader.js';
import {
  agentServiceFactoryToken,
  aiManagerToken,
  managerFactoryToken,
  repositoryFactoryToken,
  serviceFactoryToken,
} from '../tokens.js';
export { serviceFactoryToken };

export interface ServiceFactoryOptions {
  readonly container: ServiceContainer;
}

export interface ServiceFactoryInitialization {
  readonly llmServices?: AIApplicationConfig['llmServices'];
  readonly mcpServers?: AIApplicationConfig['mcpServers'];
  readonly resourceRegistrar: AIResourceRegistrar;
}

/** App-container-scoped owner of all plugin services and mutable collaborators. */
export class ServiceFactory {
  private readonly container: ServiceContainer;
  private initialization: ServiceFactoryInitialization | undefined;
  private readyPromise: Promise<void> | undefined;
  private employeeServiceValue: AIEmployeeService | undefined;
  private modelServiceValue: ModelService | undefined;
  private fileServiceValue: AIFileService | undefined;
  private toolServiceValue: AIToolService | undefined;
  private skillServiceValue: AISkillService | undefined;
  private llmServiceValue: LLMService | undefined;
  private mcpServerServiceValue: AIMCPServerService | undefined;
  private conversationServiceValue: AIConversationService | undefined;
  private synchronizerValue: LLMServiceConfigSynchronizer | undefined;

  public constructor({ container }: ServiceFactoryOptions) {
    this.container = container;
  }

  public configure(options: ServiceFactoryInitialization): void {
    if (this.initialization) {
      throw new Error('AI employee ServiceFactory is already configured');
    }
    this.initialization = options;
  }

  public initialize(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = this.initializeResources();
    }
    return this.readyPromise;
  }

  public ready(): Promise<void> {
    return (
      this.readyPromise ??
      Promise.reject(
        new Error('AI employee ServiceFactory has not been initialized'),
      )
    );
  }

  public get llmServiceConfigSynchronizer(): LLMServiceConfigSynchronizer {
    return (this.synchronizerValue ??= new LLMServiceConfigSynchronizer(
      this.ai.llmServiceManager,
      this.logger,
    ));
  }

  public get employeeService(): AIEmployeeService {
    return (this.employeeServiceValue ??= new AIEmployeeService({
      ai: this.ai,
      repositories: this.repositories,
      database: this.container.resolve(databaseManagerToken).connection(),
    }));
  }

  public get modelService(): ModelService {
    return (this.modelServiceValue ??= new ModelService({ ai: this.ai }));
  }

  public get fileService(): AIFileService {
    return (this.fileServiceValue ??= new AIFileService({
      fileStorage: this.managers.fileStorage,
      fileMetadata: new AIFileMetadataRepository(this.repositories.aiFiles),
      snowflake: this.container.resolve(idGeneratorToken),
      apiBasePath: AI_API_BASE_PATH,
    }));
  }

  public get toolService(): AIToolService {
    return (this.toolServiceValue ??= new AIToolService({ ai: this.ai }));
  }

  public get skillService(): AISkillService {
    return (this.skillServiceValue ??= new AISkillService({ ai: this.ai }));
  }

  public get llmService(): LLMService {
    return (this.llmServiceValue ??= new LLMService({ ai: this.ai }));
  }

  public get mcpServerService(): AIMCPServerService {
    return (this.mcpServerServiceValue ??= new AIMCPServerService({
      ai: this.ai,
    }));
  }

  public get conversationService(): AIConversationService {
    const managers = this.managers;
    const databaseManager = this.container.resolve(databaseManagerToken);
    return (this.conversationServiceValue ??= new AIConversationService({
      ai: this.ai,
      database: databaseManager.connection(),
      databaseManager,
      authorization: this.container.has(authorizationToken)
        ? this.container.resolve(authorizationToken)
        : undefined,
      logger: this.logger,
      caching: this.container.resolve(cachingToken),
      fileStorage: managers.fileStorage,
      snowflake: this.container.resolve(idGeneratorToken),
      repositories: this.repositories,
      aiEmployeesManager: managers.aiEmployeesManager,
      aiConversationsManager: managers.aiConversationsManager,
      builtInManager: managers.builtInManager,
      llmStreamCachedManager: managers.llmStreamCachedManager,
      subAgentsDispatcher: managers.subAgentsDispatcher,
      knowledgeBaseManager: managers.knowledgeBaseManager,
      workContextHandler: managers.workContextHandler,
      documentLoaders: managers.documentLoaders,
      agentServiceFactory: this.resolveAgentServiceFactory(),
    }));
  }

  private async initializeResources(): Promise<void> {
    const initialization = this.requireInitialization();
    await this.ai.employeeManager.switchRepository(
      this.repositories.aiEmployees,
    );
    await this.llmServiceConfigSynchronizer.enqueue(initialization.llmServices);
    // Before the sync, so it reconciles against what an administrator saved.
    await this.ai.mcpServerManager.switchRepository(
      this.repositories.aiMcpClients,
    );
    await this.mcpServerService.syncConfiguredMCPServers(
      initialization.mcpServers,
    );
    await this.ai.llmServiceManager.switchRepository(
      this.repositories.llmServices,
    );
    // The switch keeps every stored model list, so a service that overrides its
    // list has it reapplied against the stored rows, as a config reload does.
    await this.llmServiceConfigSynchronizer.enqueue(initialization.llmServices);
    await loadResources({
      ai: this.ai,
      logger: this.logger,
      resourceRegistrar: initialization.resourceRegistrar,
    });
  }
  private resolveAgentServiceFactory(): AgentServiceFactory {
    return this.container.resolve(agentServiceFactoryToken);
  }

  private requireInitialization(): ServiceFactoryInitialization {
    if (!this.initialization) {
      throw new Error('AI employee ServiceFactory is not configured');
    }
    return this.initialization;
  }

  private get repositories() {
    return this.container.resolve(repositoryFactoryToken);
  }

  private get ai(): AIManager {
    return this.container.resolve(aiManagerToken);
  }

  private get managers(): ManagerFactory {
    return this.container.resolve(managerFactoryToken);
  }

  private get logger() {
    return this.container.resolve(loggingToken).getLogger('ai-employee');
  }
}
