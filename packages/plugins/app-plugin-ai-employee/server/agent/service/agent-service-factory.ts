import type { ServiceResolver } from '@nocobase/service-provider';
import {
  databaseManagerToken,
  type DatabaseManager,
  type DatabaseConnection,
} from '@nocobase/db';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import { cachingToken } from '@nocobase/app-server/caching';
import {
  SYSTEM_TOOLS,
  type AgentContext,
  type AgentRuntime,
  type AgentState,
  type AIManager,
  type SkillsEntity,
  type ToolsEntity,
} from '@nocobase/ai-employee';
import type { Caching } from '@nocobase/caching';
import type { Logger } from '@nocobase/logging';
import type { IdGeneratorService } from '@nocobase/snowflake';
import { createAgentService, type AgentService } from './agent-service.js';
import { toConfigurationError } from '../errors.js';
import { createAIEmployeeAgentContextProvider } from '../context/ai-employee/context.js';
import { formatSkillsPrompt } from '../context/ai-employee/prompts.js';
import type { AIEmployeeSkillSettings } from '../context/ai-employee/options.js';
import { FixedAgentContextProvider } from '../context/fixed/context.js';
import { createAgentProviders } from '../providers.js';
import { DefaultChatMessageConverters } from '../message/converters.js';
import {
  CheckpointSaverFactory,
  NativeCollectionSaver,
} from '../checkpoint/index.js';
import type { ConversationPersistence } from '../contracts/persistence.js';
import { DatabaseConversationPersistence } from '../conversation/persistence/database.js';
import { ConversationProvider } from '../conversation/conversation-provider.js';
import { createAgentContext } from '../context.js';
import type { Actor, ModelRef } from '../../types.js';
import type { RepositoryFactory } from '../../factory/repository-factory.js';
import type { ManagerFactory } from '../../factory/manager-factory.js';
import {
  agentServiceFactoryToken,
  aiManagerToken,
  managerFactoryToken,
  repositoryFactoryToken,
} from '../../tokens.js';

export { agentServiceFactoryToken };

export interface CreateEmployeeOptions {
  readonly username: string;
  /** Its session is the conversation the agent runs in. */
  readonly state: AgentState;
  readonly from?: 'main-agent' | 'sub-agent';
  /** Who this agent runs as. There is no implicit root. */
  readonly actor: Actor;
  /** Held on the conversation record; see `conversationAgentOptions()`. */
  readonly systemPrompt?: string;
  readonly skillSettings?: AIEmployeeSkillSettings;
  readonly runtime: AgentRuntime;
}

export interface CreateAgentOptions {
  readonly sessionId: string;
  readonly model?: ModelRef;
  readonly systemPrompt?: string;
  readonly tools?: readonly string[];
  readonly skills?: readonly string[];
  readonly persistence?: ConversationPersistence;
  readonly actor: Actor;
  readonly runtime: AgentRuntime;
  /**
   * Where a paused run is kept. Defaults to the plugin's own tables under the
   * default persistence, and to this process beside a caller's `persistence`.
   */
  readonly checkpointer?: BaseCheckpointSaver;
}

export class AgentServiceFactory {
  private readonly container: ServiceResolver;
  private readonly aiManager: AIManager;
  private readonly repositoryFactory: RepositoryFactory;
  private readonly managerFactory: ManagerFactory;
  private readonly databaseManager: DatabaseManager;
  private readonly databaseConnection: DatabaseConnection;
  private readonly loggerService: Logger;
  private readonly cachingService: Caching;
  private readonly idGenerator: IdGeneratorService;
  private readonly checkpointSaverFactory: CheckpointSaverFactory;

  public constructor(
    container: ServiceResolver | { container: ServiceResolver },
  ) {
    this.container = 'container' in container ? container.container : container;
    this.aiManager = this.container.resolve(aiManagerToken);
    this.repositoryFactory = this.container.resolve(repositoryFactoryToken);
    this.managerFactory = this.container.resolve(managerFactoryToken);
    this.databaseManager = this.container.resolve(databaseManagerToken);
    this.databaseConnection = this.databaseManager.connection();
    this.loggerService = this.container
      .resolve(loggingToken)
      .getLogger('ai-employee');
    this.cachingService = this.container.resolve(cachingToken);
    this.idGenerator = this.container.resolve(idGeneratorToken);
    this.checkpointSaverFactory = new CheckpointSaverFactory(
      this.repositoryFactory,
    );
  }

  public async createAIEmployee(
    options: CreateEmployeeOptions,
  ): Promise<AgentService> {
    const repositories = this.repositoryFactory;
    const managers = this.managerFactory;
    const sessionId = options.state.sessionId;
    const { actor } = options;
    const employee = await managers.aiEmployeesManager.getEmployee(
      options.username,
    );
    if (!employee)
      throw new Error(`AI employee "${options.username}" not found`);
    // The one field of the state this factory replaces.
    const agentContext = this.createContext(actor, options.runtime, {
      ...options.state,
      model: await managers.aiEmployeesManager
        .resolveModel(employee, options.state.model)
        .catch((error: unknown) => {
          throw toConfigurationError(error);
        }),
    });
    const contextOptions = {
      employee,
      currentConversation: {
        sessionId,
        from: options.from ?? 'main-agent',
        username: String(employee.username ?? ''),
        metadata: { kind: 'ai-employee' },
      },
      agentContext,
      aiEmployeesManager: managers.aiEmployeesManager,
      llmProviderManager: this.aiManager.llmProviderManager,
      toolsManager: this.aiManager.toolsManager,
      skillsManager: this.aiManager.skillsManager,
      builtInManager: managers.builtInManager,
      knowledgeBaseManager: managers.knowledgeBaseManager,
      conversations: repositories.aiConversations,
      employees: repositories.aiEmployees,
      toolMessages: repositories.aiToolMessages,
      usersAiEmployees: repositories.usersAiEmployees,
      systemMessage: options.systemPrompt,
      skillSettings: options.skillSettings,
    };
    const context = createAIEmployeeAgentContextProvider(contextOptions);
    const persistence = new DatabaseConversationPersistence({
      database: this.databaseConnection,
      snowflake: this.idGenerator,
      conversations: repositories.aiConversations,
      messages: repositories.aiMessages,
      toolMessages: repositories.aiToolMessages,
      usageEvents: repositories.aiUsageEvents,
    });
    const conversation = new ConversationProvider({
      sessionId,
      persistence,
      streamCache: managers.llmStreamCachedManager,
      employeesManager: managers.aiEmployeesManager,
      logger: this.loggerService,
    });
    return createAgentService(
      createAgentProviders({
        conversation,
        context,
        container: this.container,
        logger: this.loggerService,
        converters: new DefaultChatMessageConverters({
          employee: contextOptions.employee,
          skillSettings: contextOptions.skillSettings,
          logger: this.loggerService,
          actorId: actor.id,
          collectionRepository:
            repositories.collectionRepository.bind(repositories),
          workContextHandler: managers.workContextHandler,
          fileStorage: managers.fileStorage,
          documentLoaders: managers.documentLoaders,
          caching: this.cachingService,
          getHeader: options.runtime.getHeader,
        }),
        // A sub-agent has none: its pause surfaces to the agent that called it.
        checkpointer:
          options.from === 'sub-agent'
            ? undefined
            : this.checkpointSaverFactory.getDatabaseCheckpointSaver(),
        restoresReleasedThreads: options.from !== 'sub-agent',
      }),
    );
  }

  public async createAgent(options: CreateAgentOptions): Promise<AgentService> {
    const repositories = this.repositoryFactory;
    const managers = this.managerFactory;
    const { sessionId } = options;
    const persistence =
      options.persistence ??
      new DatabaseConversationPersistence({
        database: this.databaseConnection,
        snowflake: this.idGenerator,
        conversations: repositories.aiConversations,
        messages: repositories.aiMessages,
        toolMessages: repositories.aiToolMessages,
        usageEvents: repositories.aiUsageEvents,
      });
    const { model, resolved } = await this.resolveFixedLLM(options.model);
    const configuredToolNames = new Set(options.tools ?? []);
    const tools = new Map<string, ToolsEntity>();
    if (options.tools?.length) {
      const configuredTools = await Promise.all(
        options.tools.map((name) => this.aiManager.toolsManager.getTools(name)),
      );
      for (const tool of configuredTools) {
        if (tool) tools.set(tool.definition.name, withResolvedAuto(tool));
      }
    }
    let skills: SkillsEntity[] = [];
    if (options.skills?.length) {
      skills = await this.aiManager.skillsManager.getSkills([
        ...options.skills,
      ]);
      for (const skill of skills) {
        for (const name of skill.tools ?? []) configuredToolNames.add(name);
      }
      const skillTools = await Promise.all(
        [...configuredToolNames].map((name) =>
          this.aiManager.toolsManager.getTools(name),
        ),
      );
      for (const tool of skillTools) {
        if (tool) tools.set(tool.definition.name, withResolvedAuto(tool));
      }
      // A Skill's procedure reaches the model only through getSkill, so a fixed
      // agent given Skills gets it too, able to load exactly those Skills.
      const getSkill = await this.aiManager.toolsManager.getTools(
        SYSTEM_TOOLS.GET_SKILL,
      );
      if (getSkill) {
        tools.set(
          getSkill.definition.name,
          withResolvedAuto(withAvailableSkills(getSkill, skills)),
        );
        configuredToolNames.add(getSkill.definition.name);
      }
    }
    const context = new FixedAgentContextProvider({
      sessionId,
      agentContext: this.createContext(options.actor, options.runtime, {
        sessionId,
        model,
      }),
      model,
      provider: resolved.provider,
      providerName: resolved.service.provider,
      llmService: resolved.service.name,
      systemPrompt:
        [options.systemPrompt, formatSkillsPrompt(skills)]
          .filter(Boolean)
          .join('\n\n') || undefined,
      tools,
      activeTools: configuredToolNames,
    });
    const conversation = new ConversationProvider({
      sessionId,
      persistence,
      streamCache: managers.llmStreamCachedManager,
      employeesManager: managers.aiEmployeesManager,
      logger: this.loggerService,
    });
    // Without one, a tool that asks cannot pause the run or resume it. A
    // caller's own persistence keeps the checkpoints beside it, in process,
    // unless the caller says where they go.
    const checkpointer =
      options.checkpointer ??
      (options.persistence
        ? this.checkpointSaverFactory.getMemorySaver()
        : this.checkpointSaverFactory.getDatabaseCheckpointSaver());
    return createAgentService(
      createAgentProviders({
        conversation,
        context,
        container: this.container,
        logger: this.loggerService,
        converters: undefined,
        checkpointer,
        // Only a conversation in the plugin's tables with its checkpoints
        // there is released, so only such an agent replays one.
        restoresReleasedThreads:
          !options.persistence && checkpointer instanceof NativeCollectionSaver,
      }),
    );
  }

  /** A checkpointer in the plugin's own tables, for `createAgent({ checkpointer })`. */
  public getDatabaseCheckpointSaver(): BaseCheckpointSaver {
    return this.checkpointSaverFactory.getDatabaseCheckpointSaver();
  }

  /** A checkpointer in this process, for `createAgent({ checkpointer })`. */
  public getMemorySaver(): BaseCheckpointSaver {
    return this.checkpointSaverFactory.getMemorySaver();
  }

  // A fixed agent resolves its model once, here, so a missing one fails the
  // creation with the error an employee's execution would report.
  private async resolveFixedLLM(requested?: ModelRef) {
    try {
      const model =
        await this.aiManager.llmProviderManager.resolveModel(requested);
      const resolved =
        await this.aiManager.llmProviderManager.getLLMService(model);
      return { model, resolved };
    } catch (error) {
      throw toConfigurationError(error);
    }
  }

  private createContext(
    actor: Actor,
    runtime: AgentRuntime,
    state: AgentState,
  ): AgentContext {
    return createAgentContext({ actor, state, runtime });
  }
}

// A fixed agent has no employee presets, so a tool runs unattended only when it
// declares ALLOW, which is the employee path's fallback for the same tool.
function withResolvedAuto(tool: ToolsEntity): ToolsEntity {
  return { ...tool, auto: tool.defaultPermission === 'ALLOW' };
}

// Binds getSkill to the Skills this agent was created with, whatever context
// the tool is later invoked with.
function withAvailableSkills(
  tool: ToolsEntity,
  skills: readonly SkillsEntity[],
): ToolsEntity {
  return {
    ...tool,
    invoke: (ctx, args, runtime) =>
      tool.invoke(
        { ...(ctx as AgentContext), availableSkills: async () => skills },
        args,
        runtime,
      ),
  };
}
