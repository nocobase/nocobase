/** Conversation actions: the resource layer over agents and their history. */

import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { ConversationTransport } from '../agent/contracts.js';
import type { ConversationStreamTarget } from '../types.js';
import type {
  AgentContext,
  AgentRuntime,
  AgentState,
  AIEmployeeEntity,
  AIMessageInput,
  UserDecision,
} from '@nocobase/ai-employee';
import type { AIManager } from '@nocobase/ai-employee';
import type {
  DatabaseConnection,
  DatabaseManager,
  FilterConditionNode,
  FilterShorthand,
} from '@nocobase/db';
import type { Caching } from '@nocobase/caching';
import type { FileStorage } from '@nocobase/ai-employee';
import type { AIFileEntity } from '../repository/ai-file.js';
import type { AIFileMetadataCreateContext } from '../repository/file-storage/ai-file-metadata-repository.js';
import type { Logger } from '@nocobase/logging';
import type { IdGeneratorService } from '@nocobase/snowflake';
import type {
  Actor,
  ConversationManagementActor,
  Translate,
} from '../types.js';
import {
  AI_API_BASE_PATH,
  ResourceActionError,
  sendStreamError,
} from '../types.js';
import { withAIFilePreviews } from './file-service.js';
import {
  AgentServiceError,
  type AgentRequest,
  type AgentServiceErrorCode,
  type AgentStreamEvent,
} from '../agent/types.js';
import type {
  AIMessageEntity,
  AIToolMessageEntity,
} from '../repository/index.js';
import { AgentSSEAdapter } from '../agent/transport/sse.js';
import { createAgentContext } from '../agent/context.js';
import { EXECUTE_FRONTEND_TOOL_NAME } from '../agent/context/ai-employee/common/frontend-tool-contracts.js';
import { findCurrentFrontendTool } from '../agent/context/ai-employee/frontend-tools.js';
import type { CreateEmployeeOptions } from '../agent/service/agent-service-factory.js';
import type { AIEmployeeSkillSettings } from '../agent/context/ai-employee/options.js';
import type { RepositoryFactory } from '../factory/repository-factory.js';
import type { DocumentLoaders } from '@nocobase/ai-employee';
import type { AIEmployeesManager } from '../manager/ai-employees-manager.js';
import type { AIConversationsManager } from '../manager/ai-conversations-manager.js';
import type { BuiltInManager } from '../manager/built-in-manager.js';
import type { KnowledgeBaseManager } from '../manager/knowledge-base-manager.js';
import type { LLMStreamCachedManager } from '../manager/llm-stream-cached-manager.js';
import type { SubAgentsDispatcher } from '../manager/sub-agents/dispatcher.js';
import type { WorkContextHandler } from '../manager/work-context/index.js';
import type {
  AIConversationEntity,
  AIConversationListFilter,
} from '../repository/ai-conversation.js';
import type { GetAIConversationMessagesResult } from '../manager/ai-conversations-manager.js';
import { requireConversationReadAccess } from './utils.js';

export interface ConversationUserSummary {
  id: string;
  name: string | null;
  username: string | null;
}

export interface ConversationEmployeeSummary {
  username: string;
  nickname: string | null;
  avatar: string | null;
}

/** A conversation row with the names the conversation center displays, read in the same request. */
export type ManagedConversationEntity = Omit<
  AIConversationEntity,
  'aiEmployee'
> & {
  /** `null` when the owning user no longer exists. */
  user: ConversationUserSummary | null;
  aiEmployee: ConversationEmployeeSummary | null;
};

export interface ConversationUsersResult {
  rows: ConversationUserSummary[];
}

export interface AllConversationsResult {
  rows: ManagedConversationEntity[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getAIEmployee(
  repositories: RepositoryFactory,
  username: string,
): Promise<AIEmployeeEntity | null> {
  const employee = await repositories.aiEmployees.findOne({
    filter: { username },
  });
  return employee;
}

async function prependCancelledToolContinuation(
  repositories: RepositoryFactory,
  sessionId: string,
  messages: AIMessageInput[],
  toolMessages: AIMessageInput[],
): Promise<void> {
  if (!toolMessages.length) return;
  const continuationMessageId = String(
    toolMessages[0]?.metadata?.sourceMessageId ??
      toolMessages[0]?.metadata?.toolCall?.messageId ??
      '',
  );
  for (let index = toolMessages.length - 1; index >= 0; index--) {
    const toolMessage = toolMessages[index];
    messages.unshift({
      role: toolMessage.role,
      content: toolMessage.content,
      toolCalls: toolMessage.toolCalls,
      attachments: toolMessage.attachments,
      workContext: toolMessage.workContext,
      metadata: toolMessage.metadata,
    });
  }
  if (!continuationMessageId) return;
  const assistantMessage = await repositories.aiMessages.findOne({
    filter: { sessionId, messageId: continuationMessageId },
  });
  if (!assistantMessage) return;
  messages.unshift({
    role: assistantMessage.role,
    content: assistantMessage.content,
    toolCalls: assistantMessage.toolCalls,
    attachments: assistantMessage.attachments,
    workContext: assistantMessage.workContext,
    metadata: assistantMessage.metadata,
  });
}

function isAIEmployeeEnabled(
  employee: AIEmployeeEntity | null | undefined,
): boolean {
  return employee?.enabled !== false;
}

function sendErrorResponse(
  target: ConversationStreamTarget,
  errorMessage: string,
  code?: string,
) {
  sendStreamError(target, errorMessage, undefined, code);
}

/**
 * The HTTP status each agent failure reports. A configuration failure is the
 * server's, not the request's, and retrying it changes nothing.
 */
const AGENT_ERROR_STATUS: Record<AgentServiceErrorCode, number> = {
  CONFIGURATION_ERROR: 503,
  PROVIDER_ERROR: 502,
  MODEL_RESPONSE_ERROR: 502,
  EMPTY_RESPONSE: 502,
  GRAPH_RECURSION_ERROR: 422,
  PERSISTENCE_ERROR: 500,
  ABORTED: 499,
};

function streamTarget(
  transport: ConversationTransport,
): ConversationStreamTarget {
  if (!transport.streamTarget)
    throw new ResourceActionError(500, 'SSE target is required');
  return transport.streamTarget;
}

function loginInCheck(actorId: string | number): void {
  if (!String(actorId)) throw new ResourceActionError(403, 'Forbidden');
}

const isReachParallelLimit = async (
  repositories: RepositoryFactory,
  actorId: string | number,
) => {
  const userId = String(actorId);
  const activeStreamCount = await repositories.aiConversations.count({
    filter: {
      userId,
      llmActiveState: 'streaming',
      updatedAt: {
        $gte: new Date(Date.now() - 10 * 60 * 1000),
      },
    },
  });
  return activeStreamCount > 2;
};

const saveUserMessages = async (
  repositories: RepositoryFactory,
  database: DatabaseConnection,
  snowflake: IdGeneratorService,
  sessionId: string,
  messages: AIMessageInput[],
  messageId?: string,
): Promise<void> => {
  const userMessages = messages.filter((message) => message.role === 'user');
  if (!userMessages.length) {
    return;
  }
  await database.transaction(async (connection) => {
    const repository = repositories.aiMessages;
    if (messageId) {
      const existing = await repository.findOne(
        { filter: { sessionId, messageId } },
        { connection },
      );
      if (existing) {
        await repository.destroy(
          { filter: { sessionId, messageId: { $gte: messageId } } },
          { connection },
        );
      }
    }
    const values: AIMessageEntity[] = userMessages.map((message) => ({
      ...message,
      messageId: String(snowflake.generate()),
      sessionId,
    }));
    await repository.create({ values }, { connection });
  });
};

/** A user id or an employee username: stored as a string column, never blank, and never containing whitespace. */
function requireOptionalIdentifier(value: unknown, name: string): void {
  if (
    value !== undefined &&
    (typeof value !== 'string' || !/^[^\s\p{Cc}]{1,255}$/u.test(value))
  ) {
    throw new ResourceActionError(400, `Invalid ${name}`);
  }
}

function toConversationUserSummary(
  row: ConversationUserSummary,
): ConversationUserSummary {
  return {
    id: String(row.id),
    name: row.name ?? null,
    username: row.username ?? null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeIncomingMessageAttachments(
  translate: Translate,
  messages: AIMessageInput[],
): void {
  for (const message of messages) {
    if (message.attachments == null) {
      continue;
    }
    if (!Array.isArray(message.attachments)) {
      throw new ResourceActionError(400, translate('Invalid attachment'));
    }
    message.attachments = message.attachments.map((attachment) => {
      if (!isRecord(attachment)) {
        throw new ResourceActionError(400, translate('Invalid attachment'));
      }
      const source: Record<string, unknown> = isRecord(attachment.source)
        ? { ...attachment.source }
        : attachment.id != null
          ? { collectionName: 'aiFiles' }
          : (() => {
              throw new ResourceActionError(
                400,
                translate('Invalid attachment'),
              );
            })();
      delete source.trustworthy;
      if (typeof source.collectionName !== 'string' || !source.collectionName) {
        throw new ResourceActionError(400, translate('Invalid attachment'));
      }
      return {
        ...attachment,
        source,
      };
    });
  }
}

/**
 * The configuration a conversation record holds for its agent. `options.tools`
 * is deliberately absent: nothing writes one, and what an employee may use is
 * decided by its own `skillSettings` and the per-conversation filter.
 */
function conversationAgentOptions(
  conversation: AIConversationEntity,
): Pick<CreateEmployeeOptions, 'systemPrompt' | 'skillSettings'> {
  const options = conversation.options;
  return {
    systemPrompt:
      typeof options?.systemMessage === 'string'
        ? options.systemMessage
        : undefined,
    skillSettings: isRecord(options?.skillSettings)
      ? (options.skillSettings as AIEmployeeSkillSettings)
      : undefined,
  };
}

export interface AIConversationServiceOptions {
  readonly ai: AIManager;
  readonly database: DatabaseConnection;
  readonly databaseManager: DatabaseManager;
  readonly authorization?: AppAuthorization;
  readonly logger: Logger;
  readonly caching: Caching;
  readonly fileStorage: FileStorage<AIFileEntity, AIFileMetadataCreateContext>;
  readonly snowflake: IdGeneratorService;
  readonly repositories: RepositoryFactory;
  readonly aiEmployeesManager: AIEmployeesManager;
  readonly aiConversationsManager: AIConversationsManager;
  readonly builtInManager: BuiltInManager;
  readonly llmStreamCachedManager: LLMStreamCachedManager;
  readonly subAgentsDispatcher: SubAgentsDispatcher;
  readonly knowledgeBaseManager: KnowledgeBaseManager;
  readonly workContextHandler: WorkContextHandler;
  readonly documentLoaders: DocumentLoaders;
  readonly agentServiceFactory: import('../agent/service/agent-service-factory.js').AgentServiceFactory;
}

export class AIConversationService {
  private readonly ai: AIManager;
  private readonly database: DatabaseConnection;
  private readonly logger: Logger;
  private readonly snowflake: IdGeneratorService;
  private readonly repositories: RepositoryFactory;
  private readonly aiEmployeesManager: AIEmployeesManager;
  private readonly aiConversationsManager: AIConversationsManager;
  private readonly llmStreamCachedManager: LLMStreamCachedManager;
  private readonly subAgentsDispatcher: SubAgentsDispatcher;
  private readonly agentServiceFactory: import('../agent/service/agent-service-factory.js').AgentServiceFactory;

  public constructor(options: AIConversationServiceOptions) {
    this.ai = options.ai;
    this.database = options.database;
    this.logger = options.logger;
    this.snowflake = options.snowflake;
    this.repositories = options.repositories;
    this.aiEmployeesManager = options.aiEmployeesManager;
    this.aiConversationsManager = options.aiConversationsManager;
    this.llmStreamCachedManager = options.llmStreamCachedManager;
    this.subAgentsDispatcher = options.subAgentsDispatcher;
    this.agentServiceFactory = options.agentServiceFactory;
  }
  private agentRuntime(transport: ConversationTransport): AgentRuntime {
    return {
      logger: this.logger,
      translate: transport.translate,
      getHeader: transport.getHeader,
    };
  }

  private createAgentContext({
    actor,
    state,
    runtime,
  }: {
    actor: Actor;
    state: AgentState;
    runtime: AgentRuntime;
  }): AgentContext {
    return createAgentContext({ actor, state, runtime });
  }

  /** Writes one agent run to the caller's SSE target and the resume cache. */
  private async consumeAgentStream(
    sessionId: string,
    transport: ConversationTransport,
    events: AsyncIterable<AgentStreamEvent>,
  ): Promise<void> {
    const target = streamTarget(transport);
    await new AgentSSEAdapter(
      (chunk) => target.write(chunk),
      (chunk) => this.llmStreamCachedManager.getCached(sessionId).append(chunk),
    ).consume(events);
    target.end();
  }

  /** The status and message one agent failure reports to the caller. */
  private describeFailure(
    error: unknown,
    translate: Translate,
  ): { status: number; message: string; code?: AgentServiceErrorCode } {
    this.logger.error?.(error);
    if (error instanceof ResourceActionError)
      return { status: error.status, message: error.message };
    if (error instanceof AgentServiceError)
      return {
        status: AGENT_ERROR_STATUS[error.code] ?? 500,
        message: error.rootMessage,
        code: error.code,
      };
    if (error instanceof Error) return { status: 500, message: error.message };
    return { status: 500, message: translate('Server unexpected error occur') };
  }

  async getActiveState({
    actorId,
    sessionId,
  }: {
    actorId: string | number;
    sessionId: string;
  }): Promise<{ llmActiveState: string }> {
    const conversation = await this.repositories.aiConversations.findOne({
      filter: { sessionId, userId: actorId },
    });
    return { llmActiveState: conversation?.llmActiveState ?? 'idle' };
  }

  async prependCancelledToolContinuation({
    sessionId,
    messages,
    toolMessages,
  }: {
    sessionId: string;
    messages: AIMessageInput[];
    toolMessages: AIMessageInput[];
  }): Promise<void> {
    await prependCancelledToolContinuation(
      this.repositories,
      sessionId,
      messages,
      toolMessages,
    );
  }

  normalizeIncomingMessageAttachments({
    translate,
    messages,
  }: {
    translate: Translate;
    messages: AIMessageInput[];
  }): void {
    normalizeIncomingMessageAttachments(translate, messages);
  }

  async list({
    actorId,
    scope,
    options = {},
  }: {
    actorId: string | number;
    scope?: string;
    options?: {
      filter?: FilterShorthand<AIConversationEntity>;
      scope?: string;
      keyword?: string;
    };
  }) {
    loginInCheck(actorId);
    const userId = String(actorId);
    const filter = options.filter ?? {};
    const where: FilterShorthand<AIConversationEntity> = {
      ...filter,
      userId,
      from: filter.from ?? 'main-agent',
      category: 'chat',
      ...(typeof scope === 'string' && scope ? { scope } : {}),
    };
    const conditions = Object.entries(where)
      .filter(
        ([field, value]) =>
          value !== undefined && !(options.keyword && field === 'title'),
      )
      .map(([field, value]): FilterConditionNode => ({
        kind: 'condition',
        path: [field],
        operator: '$eq',
        value,
      }));
    return await this.database
      .repository<AIConversationEntity>('aiConversations')
      .findMany({
        filter: (f) =>
          f.and([
            ...conditions,
            ...(options.keyword
              ? [f.string('title').includes(options.keyword)]
              : []),
          ]),
        sort: (s) => s.field('updatedAt').desc(),
      });
  }

  async listAll({
    actor,
    keyword,
    userId,
    aiEmployeeUsername,
    page = 1,
    pageSize = 20,
  }: {
    actor: ConversationManagementActor;
    /** Matches part of the title. */
    keyword?: string;
    userId?: string;
    aiEmployeeUsername?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AllConversationsResult> {
    requireConversationReadAccess(actor);
    const offset = (page - 1) * pageSize;
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 10000 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger(offset)
    ) {
      throw new ResourceActionError(400, 'Invalid pagination');
    }
    if (
      keyword !== undefined &&
      (typeof keyword !== 'string' || keyword.length > 200)
    ) {
      throw new ResourceActionError(400, 'Invalid keyword');
    }
    requireOptionalIdentifier(userId, 'userId');
    requireOptionalIdentifier(aiEmployeeUsername, 'aiEmployeeUsername');
    // Sub-agent sessions are listed through the main conversation that
    // delegated to them: its history embeds each one where it ran.
    const filter: AIConversationListFilter = {
      from: 'main-agent',
      ...(userId === undefined ? {} : { userId }),
      ...(aiEmployeeUsername === undefined ? {} : { aiEmployeeUsername }),
      ...(keyword?.trim() ? { title: { $includes: keyword.trim() } } : {}),
    };
    const [rows, count] = await Promise.all([
      this.repositories.aiConversations.find({
        filter,
        sort: ['-updatedAt', '-sessionId'],
        limit: pageSize,
        offset,
      }),
      this.repositories.aiConversations.count({ filter }),
    ]);
    return {
      rows: await this.withConversationParticipants(rows),
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  /**
   * The owners of main conversations, for choosing whose conversations to list. Nobody who has never talked to an
   * employee is returned, so this reveals no user the conversation list would not show anyway.
   */
  async listConversationUsers({
    actor,
    keyword,
    userId,
    limit = 20,
  }: {
    actor: ConversationManagementActor;
    /** Matches part of the name or the username. */
    keyword?: string;
    /** Resolves one user, such as the one a restored filter names. */
    userId?: string;
    limit?: number;
  }): Promise<ConversationUsersResult> {
    requireConversationReadAccess(actor);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      throw new ResourceActionError(400, 'Invalid limit');
    }
    if (
      keyword !== undefined &&
      (typeof keyword !== 'string' || keyword.length > 200)
    ) {
      throw new ResourceActionError(400, 'Invalid keyword');
    }
    requireOptionalIdentifier(userId, 'userId');
    const search = keyword?.trim();
    let query = this.database.query
      .selectFrom('user')
      .select(['id', 'name', 'username'])
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('aiConversations')
            .select('sessionId')
            .whereRef('aiConversations.userId', '=', 'user.id')
            .where('aiConversations.from', '=', 'main-agent'),
        ),
      );
    if (userId !== undefined) query = query.where('id', '=', userId);
    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'like', `%${search}%`),
          eb('username', 'like', `%${search}%`),
        ]),
      );
    }
    const rows = await query
      .orderBy('name')
      .orderBy('id')
      .limit(limit)
      .execute<ConversationUserSummary>();
    return { rows: rows.map(toConversationUserSummary) };
  }

  /** Two batched reads per page, whatever its length, instead of one per row. */
  private async withConversationParticipants(
    rows: AIConversationEntity[],
  ): Promise<ManagedConversationEntity[]> {
    const userIds = [
      ...new Set(
        rows.flatMap((row) => (row.userId == null ? [] : [String(row.userId)])),
      ),
    ];
    const usernames = [
      ...new Set(
        rows.flatMap((row) =>
          row.aiEmployeeUsername ? [row.aiEmployeeUsername] : [],
        ),
      ),
    ];
    const [users, employees] = await Promise.all([
      userIds.length
        ? this.database.query
            .selectFrom('user')
            .select(['id', 'name', 'username'])
            .where('id', 'in', userIds)
            .execute<ConversationUserSummary>()
        : [],
      usernames.length
        ? this.repositories.aiEmployees.find({
            filter: { username: usernames },
          })
        : [],
    ]);
    const usersById = new Map(
      users.map((user) => [String(user.id), toConversationUserSummary(user)]),
    );
    const employeesByUsername = new Map(
      employees.map((employee) => [
        employee.username,
        {
          username: employee.username,
          nickname: employee.nickname ?? null,
          avatar: employee.avatar ?? null,
        },
      ]),
    );
    return rows.map((row) => ({
      ...row,
      user:
        row.userId == null ? null : (usersById.get(String(row.userId)) ?? null),
      aiEmployee: row.aiEmployeeUsername
        ? (employeesByUsername.get(row.aiEmployeeUsername) ?? null)
        : null,
    }));
  }

  async getAllMessages({
    actor,
    sessionId,
    cursor,
  }: {
    actor: ConversationManagementActor;
    sessionId: string;
    cursor?: string;
  }): Promise<GetAIConversationMessagesResult> {
    requireConversationReadAccess(actor);
    if (
      typeof sessionId !== 'string' ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
        sessionId,
      )
    ) {
      throw new ResourceActionError(400, 'Invalid sessionId');
    }
    if (
      cursor !== undefined &&
      (typeof cursor !== 'string' ||
        !/^\d{1,19}$/.test(cursor) ||
        BigInt(cursor) > 9223372036854775807n)
    ) {
      throw new ResourceActionError(400, 'Invalid cursor');
    }
    try {
      return withAIFilePreviews(
        await this.aiConversationsManager.getAllMessages({
          sessionId,
          cursor,
        }),
        AI_API_BASE_PATH,
      );
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'invalid sessionId') {
        throw new ResourceActionError(404, 'Conversation not found');
      }
      throw error;
    }
  }

  async unreadCount({ actorId }: { actorId: string | number }) {
    const userId = String(actorId);
    const count = await this.repositories.aiConversations.count({
      filter: {
        userId,
        read: false,
        from: 'main-agent',
        category: 'chat',
      },
    });
    return { count };
  }

  async unreadCounts({ actorId }: { actorId: string | number }) {
    const userId = String(actorId);
    const conversationUnreadCount =
      await this.repositories.aiConversations.count({
        filter: { userId, read: false, from: 'main-agent', category: 'chat' },
      });
    return { conversationUnreadCount };
  }

  async create({
    actorId,
    input,
  }: {
    actorId: string | number;
    input: Record<string, any>;
  }) {
    const userId = String(actorId);
    const {
      aiEmployee,
      systemMessage,
      skillSettings,
      conversationSettings,
      modelSettings,
      scope,
    } = input;
    if (!aiEmployee?.username) {
      throw new ResourceActionError(400, 'AI employee is required');
    }
    const normalizedScope = typeof scope === 'string' ? scope : undefined;
    const employee = await getAIEmployee(
      this.repositories,
      aiEmployee.username,
    );
    if (!employee) {
      throw new ResourceActionError(400, 'AI employee not found');
    }
    if (!isAIEmployeeEnabled(employee)) {
      throw new ResourceActionError(400, 'AI employee is disabled');
    }

    try {
      return await this.aiConversationsManager.create({
        userId,
        aiEmployee,
        scope: normalizedScope,
        options: {
          systemMessage,
          skillSettings,
          conversationSettings,
          modelSettings,
        },
      });
    } catch (error: any) {
      if (error.message === 'AI employee not found') {
        throw new ResourceActionError(400, error.message);
      }
      throw error;
    }
  }

  async update({
    actorId,
    sessionId,
    input,
  }: {
    actorId: string | number;
    sessionId: string;
    input: { title?: string };
  }) {
    const userId = String(actorId);
    if (typeof sessionId !== 'string' || !sessionId) {
      throw new ResourceActionError(400, 'invalid sessionId');
    }
    const { title } = input;
    return await this.aiConversationsManager.update({
      userId,
      sessionId,
      title,
    });
  }

  async updateOptions({
    actorId,
    sessionId,
    input,
  }: {
    actorId: string | number;
    sessionId: string;
    input: Record<string, any>;
  }) {
    const userId = String(actorId);
    if (!sessionId) {
      throw new ResourceActionError(400, 'invalid sessionId');
    }
    const {
      systemMessage,
      skillSettings,
      conversationSettings,
      modelSettings,
    } = input;
    if (
      !systemMessage &&
      !skillSettings &&
      !conversationSettings &&
      !modelSettings
    ) {
      throw new ResourceActionError(400, 'invalid options');
    }
    try {
      return await this.aiConversationsManager.update({
        userId,
        sessionId,
        options: {
          systemMessage,
          skillSettings,
          conversationSettings,
          modelSettings,
        },
      });
    } catch (error: any) {
      if (error.message === 'invalid sessionId') {
        throw new ResourceActionError(400, error.message);
      }
      throw error;
    }
  }

  async destroy({
    actorId,
    options,
  }: {
    actorId: string | number;
    options: { sessionId?: string; filter?: Record<string, unknown> };
  }) {
    const userId = String(actorId);
    const filter = isRecord(options.filter) ? options.filter : {};
    const sessionId = options.sessionId;
    const where: Record<string, any> = {
      ...filter,
      userId,
    };
    if (sessionId) where.sessionId = sessionId;
    await this.repositories.aiConversations.destroy({ filter: where });
    return null;
  }

  async getMessages({
    actorId,
    options,
  }: {
    actorId: string | number;
    options: {
      sessionId: string;
      cursor?: string;
      paginate?: boolean;
      updateRead?: boolean;
    };
  }) {
    const userId = String(actorId);
    const { sessionId, cursor } = options;
    if (!sessionId) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const paginate = options.paginate !== false;
    const updateRead = options.updateRead === true;
    try {
      return withAIFilePreviews(
        await this.aiConversationsManager.getMessages({
          userId,
          sessionId,
          cursor,
          paginate,
          updateRead,
        }),
        AI_API_BASE_PATH,
      );
    } catch (error: any) {
      if (error.message === 'invalid sessionId') {
        throw new ResourceActionError(400, 'Invalid request');
      }
      throw error;
    }
  }

  async updateToolArgs({
    actorId,
    input,
  }: {
    actorId: string | number;
    input: Record<string, any>;
  }) {
    const userId = String(actorId);
    const { sessionId, messageId, tool } = input;
    if (!sessionId) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const conversation = await this.aiConversationsManager.getConversation({
      sessionId,
      userId,
    });
    if (!conversation) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const messageRepository = this.repositories.aiMessages;
    const message = await messageRepository.findOne({
      filter: { sessionId, messageId },
    });
    if (!message) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const toolCalls = message.toolCalls || [];
    const index = toolCalls.findIndex(
      (toolCall: { id: string }) => toolCall.id === tool.id,
    );
    if (index === -1) {
      return null;
    }
    toolCalls[index] = { ...toolCalls[index], args: tool.args };
    await messageRepository.update({
      filter: { sessionId, messageId },
      values: { toolCalls },
    });
    return null;
  }

  async sendMessages({
    actor,
    aiEmployee,
    messages: incomingMessages,
    stream = true,
    state,
    transport,
  }: {
    actor: Actor;
    aiEmployee: string;
    messages?: readonly AIMessageInput[];
    stream?: boolean;
    state: AgentState;
    transport: ConversationTransport;
  }) {
    const userId = String(actor.id);
    const { sessionId } = state;
    const { translate } = transport;

    try {
      if (!incomingMessages) {
        throw new ResourceActionError(
          400,
          translate('messages must be an array'),
        );
      }
      // The caller's array is not this action's to mutate, and it mutates twice:
      // attachment normalization and the cancelled-tool continuation.
      const messages = [...incomingMessages];
      normalizeIncomingMessageAttachments(translate, messages);
      const userMessage = messages.find(
        (message: AIMessageInput) => message.role === 'user',
      );
      if (!userMessage) {
        throw new ResourceActionError(
          400,
          translate('user message is required'),
        );
      }

      const conversation = await this.aiConversationsManager.getConversation({
        sessionId,
        userId,
      });
      if (!conversation) {
        throw new ResourceActionError(400, translate('conversation not found'));
      }
      const { systemPrompt, skillSettings } =
        conversationAgentOptions(conversation);

      const employee = await getAIEmployee(this.repositories, aiEmployee);
      if (!employee) {
        throw new ResourceActionError(400, translate('AI employee not found'));
      }

      if (!conversation.title) {
        const textUserMessage = messages.find(
          (message: any) =>
            message.role === 'user' &&
            message.content?.type === 'text' &&
            message.content?.content,
        );
        if (textUserMessage) {
          const content = (textUserMessage.content as { content: string })
            .content;
          const title = content.substring(0, 30);
          await this.repositories.aiConversations.update({
            filter: { sessionId, userId },
            values: { title },
          });
          conversation.title = title;
        }
      }

      if (await isReachParallelLimit(this.repositories, actor.id)) {
        await saveUserMessages(
          this.repositories,
          this.database,
          this.snowflake,
          sessionId,
          messages,
          state.messageId,
        );
        throw new ResourceActionError(
          400,
          translate(
            'There are conversations in progress. Please try again later.',
          ),
        );
      }
      if (conversation.category !== 'chat') {
        throw new ResourceActionError(404, 'conversation not found');
      }
      // Resolved before the agent exists, because the answer decides what its
      // state carries. Both calls are repository work and need no agent.
      const interrupted =
        !state.messageId &&
        (await this.subAgentsDispatcher.isInterrupted(sessionId));
      const userDecisions = interrupted
        ? await this.subAgentsDispatcher.reject(sessionId, actor.id)
        : undefined;
      const agent = await this.agentServiceFactory.createAIEmployee({
        username: employee.username,
        from: 'main-agent',
        actor,
        systemPrompt,
        skillSettings,
        // They answer the sub-agent's pending question, so they are handed
        // over rather than sent to this model.
        state: {
          ...state,
          handoffMessages: userDecisions ? messages : undefined,
        },
        runtime: this.agentRuntime(transport),
      });
      const runStream = (request: AgentRequest) =>
        this.consumeAgentStream(
          sessionId,
          transport,
          request.messageId ? agent.forkStream(request) : agent.stream(request),
        );
      const runInvoke = (request: AgentRequest) =>
        request.messageId ? agent.forkInvoke(request) : agent.invoke(request);
      if (userDecisions) {
        if (stream) {
          await runStream({ userDecisions });
          return undefined;
        }
        return await runInvoke({ userDecisions });
      }
      if (!state.messageId && !interrupted) {
        const toolMessages = await agent.cancelToolCall();
        if (toolMessages?.length) {
          await prependCancelledToolContinuation(
            this.repositories,
            sessionId,
            messages,
            toolMessages,
          );
        }
      }

      const request: AgentRequest = {
        userMessages: messages,
        messageId: state.messageId,
      };
      if (stream) {
        await runStream(request);
        return undefined;
      }
      return await runInvoke(request);
    } catch (err: unknown) {
      const { status, message, code } = this.describeFailure(err, translate);
      if (!stream) {
        throw new ResourceActionError(status, message, { cause: err });
      }
      const target = streamTarget(transport);
      sendErrorResponse(target, message, code);
      if (!target.writableEnded) target.end();
      return undefined;
    }
  }

  async abort({
    actorId,
    input,
  }: {
    actorId: string | number;
    input: { sessionId: string };
  }) {
    const userId = String(actorId);
    const { sessionId } = input;
    if (typeof sessionId !== 'string' || !sessionId) {
      throw new ResourceActionError(400, 'sessionId is required');
    }
    const conversation = await this.aiConversationsManager.getConversation({
      sessionId,
      userId,
    });
    if (!conversation) {
      throw new ResourceActionError(404, 'conversation not found');
    }
    this.aiEmployeesManager.abortConversation(sessionId);
    return null;
  }

  async resumeStream({
    actorId,
    sessionId,
    transport,
  }: {
    actorId: string | number;
    sessionId: string;
    transport: ConversationTransport;
  }) {
    const userId = String(actorId);
    const abortController = new AbortController();
    const abortStream = () => abortController.abort();
    const target = streamTarget(transport);
    const shouldStopStream = () =>
      abortController.signal.aborted ||
      target.destroyed ||
      target.writableEnded;

    transport.abortSignal?.addEventListener('abort', abortStream, {
      once: true,
    });

    try {
      const conversation = await this.aiConversationsManager.getConversation({
        sessionId,
        userId,
      });
      if (shouldStopStream()) {
        return;
      }
      if (!conversation) {
        sendErrorResponse(target, 'conversation not found');
        return;
      }
      const reachLimit = await isReachParallelLimit(this.repositories, actorId);
      if (shouldStopStream()) {
        return;
      }

      let hasChunks = false;
      if (!reachLimit) {
        for await (const chunk of this.llmStreamCachedManager
          .getCached(sessionId)
          .stream({ signal: abortController.signal })) {
          if (shouldStopStream()) {
            break;
          }
          hasChunks = true;
          target.write(chunk);
        }
      }

      if (!hasChunks && !shouldStopStream()) {
        const currentConversation =
          await this.aiConversationsManager.getConversation({
            sessionId,
            userId,
          });
        const llmActiveState = currentConversation?.llmActiveState;
        if (llmActiveState && llmActiveState !== 'idle') {
          target.write(
            `data: ${JSON.stringify({ type: 'chunks_cache_missing', body: { llmActiveState } })}\n\n`,
          );
        }
      }
    } catch (err: any) {
      if (shouldStopStream()) {
        return;
      }
      this.logger.error?.(err);
      sendErrorResponse(target, err.message || 'Resume stream error');
      return;
    } finally {
      transport.abortSignal?.removeEventListener('abort', abortStream);
      if (!shouldStopStream()) {
        target.end();
      }
    }
  }

  async resendMessages({
    actor,
    stream = true,
    state,
    transport,
  }: {
    actor: Actor;
    stream?: boolean;
    state: AgentState;
    transport: ConversationTransport;
  }) {
    const userId = String(actor.id);
    const { sessionId } = state;
    const { translate } = transport;

    try {
      const conversation = await this.aiConversationsManager.getConversation({
        sessionId,
        userId,
      });
      if (!conversation) {
        throw new ResourceActionError(400, translate('conversation not found'));
      }
      const { systemPrompt, skillSettings } =
        conversationAgentOptions(conversation);
      const employee = await getAIEmployee(
        this.repositories,
        conversation.aiEmployeeUsername ?? '',
      );
      if (!employee) {
        throw new ResourceActionError(400, translate('AI employee not found'));
      }

      const resendMessages: AIMessageInput[] = [];
      let { messageId } = state;
      if (messageId) {
        const message = await this.repositories.aiMessages.findOne({
          filter: { sessionId, messageId },
        });
        if (!message) {
          throw new ResourceActionError(400, translate('message not found'));
        }
      } else {
        const message = await this.repositories.aiMessages.findOne({
          filter: { sessionId },
          sort: ['-messageId'],
        });
        if (!message) {
          throw new ResourceActionError(400, translate('message not found'));
        }
        messageId = message.messageId;
        if (['user', 'tool'].includes(message.role)) {
          resendMessages.push({
            role: message.role,
            content: message.content,
            toolCalls: message.toolCalls,
            attachments: message.attachments,
            workContext: message.workContext,
            metadata: message.metadata,
          });
        }
      }

      if (await isReachParallelLimit(this.repositories, actor.id)) {
        throw new ResourceActionError(
          400,
          translate(
            'There are conversations in progress. Please try again later.',
          ),
        );
      }
      if (conversation.category !== 'chat') {
        throw new ResourceActionError(404, 'conversation not found');
      }
      const agent = await this.agentServiceFactory.createAIEmployee({
        username: employee.username,
        from: 'main-agent',
        actor,
        systemPrompt,
        skillSettings,
        state: { ...state, messageId },
        runtime: this.agentRuntime(transport),
      });
      const request: AgentRequest = {
        messageId,
        userMessages: resendMessages.length ? resendMessages : undefined,
      };
      if (stream) {
        await this.consumeAgentStream(
          sessionId,
          transport,
          agent.forkStream(request),
        );
        return undefined;
      }
      return await agent.forkInvoke(request);
    } catch (err: unknown) {
      const { status, message, code } = this.describeFailure(err, translate);
      if (!stream) {
        throw new ResourceActionError(status, message, { cause: err });
      }
      const target = streamTarget(transport);
      sendErrorResponse(target, message, code);
      if (!target.writableEnded) target.end();
      return undefined;
    }
  }

  async updateUserDecision({
    actor,
    messageId,
    toolCallId,
    userDecision,
    state,
    transport,
  }: {
    actor: Actor;
    messageId: string;
    toolCallId: string;
    userDecision: UserDecision;
    state: AgentState;
    transport: ConversationTransport;
  }) {
    const userId = String(actor.id);
    const { sessionId } = state;
    const { translate } = transport;
    const agentContext = this.createAgentContext({
      actor,
      state,
      runtime: this.agentRuntime(transport),
    });
    const conversation = await this.aiConversationsManager.getConversation({
      sessionId,
      userId,
    });
    if (!conversation) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const message = await this.repositories.aiMessages.findOne({
      filter: { sessionId, messageId },
    });
    if (!message) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const messageConversation =
      await this.aiConversationsManager.getConversation({
        sessionId: message.sessionId,
        userId,
      });
    if (!messageConversation) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const toolCalls = message.toolCalls;
    if (!toolCalls?.length) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    const selectedToolCall = toolCalls.find(
      (toolCall: { id?: string }) => toolCall.id === toolCallId,
    );
    if (!selectedToolCall) {
      throw new ResourceActionError(400, 'Invalid request');
    }
    if (selectedToolCall.name === EXECUTE_FRONTEND_TOOL_NAME) {
      const toolId = isRecord(selectedToolCall.args)
        ? selectedToolCall.args.toolId
        : undefined;
      const frontendTool =
        typeof toolId === 'string'
          ? await findCurrentFrontendTool(
              this.repositories.aiConversations,
              toolId,
              {
                sessionId: message.sessionId,
              },
            )
          : undefined;
      if (!frontendTool) {
        throw new ResourceActionError(
          400,
          translate('Frontend tool is unavailable'),
        );
      }
    }

    const updated = await this.repositories.aiToolMessages.update({
      filter: {
        sessionId: message.sessionId,
        messageId: message.messageId,
        toolCallId,
        invokeStatus: 'interrupted',
      },
      values: {
        userDecision,
        invokeStatus: 'waiting',
      },
    });

    const toolCallIds = toolCalls.map((x: any) => x.id);
    const toolMessages = await this.repositories.aiToolMessages.find({
      filter: {
        sessionId: message.sessionId,
        messageId: message.messageId,
        toolCallId: { $in: toolCallIds },
      },
    });
    const toolMessageMap = new Map<string | undefined, AIToolMessageEntity>(
      toolMessages.map((toolMessage: AIToolMessageEntity) => [
        toolMessage.toolCallId,
        toolMessage,
      ]),
    );

    const toolsList = await this.ai.toolsManager.listTools({
      sessionId: message.sessionId,
      ctx: agentContext,
    });
    const toolsMap = new Map<string, any>(
      toolsList.map((t: any) => [t.definition.name, t]),
    );

    for (const toolCall_ of toolCalls) {
      const tools = toolsMap.get(toolCall_.name);
      const toolMessage = toolMessageMap.get(toolCall_.id);
      toolCall_.invokeStatus = toolMessage?.invokeStatus;
      toolCall_.auto = toolMessage?.auto;
      toolCall_.status = toolMessage?.status;
      toolCall_.content = toolMessage?.content;
      toolCall_.userDecision = toolMessage?.userDecision;
      toolCall_.execution = tools?.execution;
      toolCall_.willInterrupt =
        tools?.execution === 'frontend' || toolMessage?.auto === false;
      toolCall_.defaultPermission = tools?.defaultPermission;
    }

    return {
      updated,
      toolCalls,
    };
  }

  async resumeToolCall({
    actor,
    state,
    transport,
  }: {
    actor: Actor;
    state: AgentState;
    transport: ConversationTransport;
  }) {
    const userId = String(actor.id);
    const { sessionId } = state;
    const target = streamTarget(transport);
    try {
      const conversation = await this.aiConversationsManager.getConversation({
        sessionId,
        userId,
      });
      if (!conversation) {
        sendErrorResponse(target, 'conversation not found');
        return;
      }
      const { systemPrompt, skillSettings } =
        conversationAgentOptions(conversation);
      const employee = await getAIEmployee(
        this.repositories,
        conversation.aiEmployeeUsername ?? '',
      );
      if (!employee) {
        sendErrorResponse(target, 'AI employee not found');
        return;
      }

      const message: AIMessageEntity | null = state.messageId
        ? await this.repositories.aiMessages.findOne({
            filter: { sessionId, messageId: state.messageId },
          })
        : await this.repositories.aiMessages.findOne({
            filter: { sessionId },
            sort: ['-messageId'],
          });
      if (!message) {
        sendErrorResponse(target, 'message not found');
        return;
      }
      const messageConversation =
        await this.aiConversationsManager.getConversation({
          sessionId: message.sessionId,
          userId,
        });
      if (!messageConversation) {
        sendErrorResponse(target, 'conversation not found');
        return;
      }
      if (!message.toolCalls?.length) {
        sendErrorResponse(target, 'No tool calls found');
        return;
      }
      const userDecisions = await this.aiConversationsManager.getUserDecisions(
        message.messageId,
      );
      if (conversation.category !== 'chat') {
        throw new ResourceActionError(404, 'conversation not found');
      }
      const agent = await this.agentServiceFactory.createAIEmployee({
        username: employee.username,
        from: 'main-agent',
        actor,
        systemPrompt,
        skillSettings,
        state: { ...state, messageId: message.messageId },
        runtime: this.agentRuntime(transport),
      });
      await this.consumeAgentStream(
        sessionId,
        transport,
        agent.resumeStream({ userDecisions }),
      );
    } catch (err: unknown) {
      // The resumed run is an agent run, so it reports as a send does.
      const { message, code } = this.describeFailure(err, transport.translate);
      sendErrorResponse(target, message || 'Tool call error', code);
      if (!target.writableEnded) target.end();
    }
  }
}
