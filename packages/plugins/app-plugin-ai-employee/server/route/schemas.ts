import { z } from 'zod';

import { USAGE_BREAKDOWN_DIMENSIONS } from '../service/ai-usage-statistics-service.js';
import {
  MAX_RANGE_HOURS,
  USAGE_GRANULARITIES,
} from '../service/usage-buckets.js';

/** A name or key a resource is addressed by in a path. */
const Name = z.string().trim().min(1).max(255);
/** A user id or an employee username used as a filter: stored as a string column, never blank, never with whitespace. */
const Identifier = z
  .string()
  .regex(
    /^[^\s\p{Cc}]{1,255}$/u,
    'Must be 1 to 255 characters without whitespace.',
  );
const Search = z.string().max(200);
const JsonRecord = z.record(z.string(), z.unknown());

/** A whole number from 1 to `max`, written plainly in a query string: no sign, exponent, fraction or blank. */
function queryInteger(max: number) {
  return z
    .string()
    .regex(/^[1-9]\d*$/, 'Must be a positive whole number.')
    .transform(Number)
    .pipe(z.number().int().max(max));
}

function pageSize(max: number, fallback: number) {
  return queryInteger(max).default(fallback);
}

// ---------------------------------------------------------------------------------------------------------------------
// Employees: /aiEmployees

export const AIEmployeeParams = z.object({ username: Name });

const SkillSettingsInput = z.strictObject({
  enabledSkills: z.array(z.string().trim().min(1)).nullable().optional(),
  enabledTools: z.array(z.string().trim().min(1)).nullable().optional(),
  skills: z.array(z.string()).optional(),
  tools: z
    .array(
      z.strictObject({
        name: z.string().min(1),
        autoCall: z.boolean().optional(),
      }),
    )
    .optional(),
});

const AIEmployeeFields = {
  nickname: z.string().optional(),
  position: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  greeting: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  defaultPrompt: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  knowledgeBasePrompt: z.string().nullable().optional(),
  knowledgeBase: JsonRecord.optional(),
  enableKnowledgeBase: z.boolean().optional(),
  chatSettings: JsonRecord.optional(),
  skillSettings: SkillSettingsInput.optional(),
  modelSettings: JsonRecord.optional(),
  enabled: z.boolean().optional(),
  deprecated: z.boolean().optional(),
  sort: z.number().optional(),
};

export const UpdateAIEmployeeInput = z.strictObject(AIEmployeeFields);
export type UpdateAIEmployeeInput = z.infer<typeof UpdateAIEmployeeInput>;

export const UserPromptInput = z.strictObject({ prompt: z.string() });

// ---------------------------------------------------------------------------------------------------------------------
// Skills and tools: /aiEmployee/skills, /aiEmployee/tools

export const NameParams = z.object({ name: Name });

// ---------------------------------------------------------------------------------------------------------------------
// Models and LLM services: /aiEmployee/models, /aiEmployee/llmProviders, /aiEmployee/llmServices

export const ModelsQuery = z.object({
  type: z.enum(['LLM', 'EMBEDDING']).default('LLM'),
});

export const EnabledModelsInput = z.strictObject({
  mode: z.enum(['provider', 'custom']),
  models: z.array(
    z.strictObject({
      label: z.string().optional(),
      value: z.string().trim().min(1),
    }),
  ),
});
export type EnabledModelsInput = z.infer<typeof EnabledModelsInput>;

export const ProviderModelsQuery = z.object({ q: Search.optional() });

// ---------------------------------------------------------------------------------------------------------------------
// MCP servers: /aiEmployee/mcpServers

export const MCPToolParams = z.object({ name: Name, toolName: Name });

export const MCPToolPermissionInput = z.strictObject({
  permission: z.enum(['ASK', 'ALLOW']),
});

// ---------------------------------------------------------------------------------------------------------------------
// Files: /aiEmployee/files

export const FileParams = z.object({ fileId: z.string().min(1).max(255) });

/** An upload is a multipart form; the content type is required here and its media type checked by the route (415). */
export const UploadHeaders = z.object({
  'content-type': z.string().max(1000).optional(),
});

// ---------------------------------------------------------------------------------------------------------------------
// Usage statistics: /aiEmployee/usage

/** An RFC 3339 time with an explicit offset, read as epoch milliseconds. */
const Time = z.iso
  .datetime({ offset: true })
  .transform((value) => Date.parse(value));
const UsageFilter = z.string().max(200).optional();

export const UsageQuery = z.object({
  start: Time.optional(),
  end: Time.optional(),
  /** East-positive minutes, as `-new Date().getTimezoneOffset()` reports. */
  timezoneOffset: z
    .string()
    .regex(/^-?\d{1,4}$/, 'Must be a whole number of minutes.')
    .transform(Number)
    .optional(),
  model: UsageFilter,
  provider: UsageFilter,
  llmService: UsageFilter,
  aiEmployeeUsername: UsageFilter,
  userId: UsageFilter,
  category: UsageFilter,
  from: UsageFilter,
});

export const UsageSummaryQuery = UsageQuery.extend({
  compareShiftHours: queryInteger(MAX_RANGE_HOURS).optional(),
});

export const UsageSeriesQuery = UsageQuery.extend({
  granularity: z.enum([...USAGE_GRANULARITIES, 'auto']).optional(),
});

export const UsageBreakdownQuery = UsageQuery.extend({
  dimension: z.enum(USAGE_BREAKDOWN_DIMENSIONS),
  // The N largest rows by tokens, beside the range totals so the rest shows as a remainder. It ranks rather than pages:
  // there is no next page to ask for, so it is `top` rather than `pageSize`.
  top: queryInteger(50).optional(),
});

// ---------------------------------------------------------------------------------------------------------------------
// Conversations: /aiEmployee/conversations, /aiEmployee/managedConversations, /aiEmployee/conversationOwners

export const ConversationParams = z.object({ sessionId: Name });
export const MessageParams = ConversationParams.extend({ messageId: Name });
/** The conversation center addresses a conversation by its UUID session id only. */
export const ManagedConversationParams = z.object({
  sessionId: z.guid(),
});
export const ToolCallParams = MessageParams.extend({ toolCallId: Name });

export const ConversationsQuery = z.object({ q: Search.optional() });

export const ManagedConversationsQuery = z.object({
  q: Search.optional(),
  userId: Identifier.optional(),
  aiEmployeeUsername: Identifier.optional(),
  page: queryInteger(10000).default(1),
  pageSize: pageSize(100, 20),
});

export const ConversationOwnersQuery = z.object({
  q: Search.optional(),
  userId: Identifier.optional(),
  page: queryInteger(10000).default(1),
  pageSize: pageSize(100, 20),
});

export const MessagesQuery = z.object({
  pageToken: z
    .string()
    .regex(/^\d{1,19}$/, 'Must be the nextPageToken of the previous page.')
    .optional(),
  // Up to 200 rather than 100: the chat opens a conversation by reading its recent history in one request.
  pageSize: pageSize(200, 10),
});

export const CreateConversationInput = z.strictObject({
  aiEmployee: z.strictObject({ username: Name }),
  systemMessage: z.string().optional(),
  skillSettings: JsonRecord.optional(),
  conversationSettings: JsonRecord.optional(),
  modelSettings: JsonRecord.optional(),
  scope: z.string().optional(),
});

export const UpdateConversationInput = z.strictObject({
  title: z.string().trim().min(1).max(255),
});

export const ConversationOptionsInput = z.strictObject({
  systemMessage: z.string().optional(),
  skillSettings: JsonRecord.optional(),
  conversationSettings: JsonRecord.optional(),
  modelSettings: JsonRecord.optional(),
});
export type ConversationOptionsInput = z.infer<typeof ConversationOptionsInput>;

/** What a run is told beyond its messages: which model, whether to search the web, and the page's tools. */
const AgentStateFields = {
  model: z
    .strictObject({ llmService: z.string().min(1), model: z.string().min(1) })
    .optional(),
  webSearch: z.boolean().optional(),
  important: z.string().optional(),
  frontendTools: z.array(JsonRecord).optional(),
  toolCallResults: z
    .array(z.strictObject({ id: z.string(), result: z.unknown() }))
    .optional(),
  timezone: z.string().max(100).optional(),
};
export type AgentStateInput = {
  readonly [Key in keyof typeof AgentStateFields]?: z.infer<
    (typeof AgentStateFields)[Key]
  >;
} & { readonly messageId?: string };

const IncomingMessage = z.strictObject({
  key: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.looseObject({ type: z.string() }),
  attachments: z.array(JsonRecord).optional(),
  workContext: z.array(JsonRecord).optional(),
  metadata: JsonRecord.optional(),
  toolCalls: z.array(JsonRecord).optional(),
});

export const SendMessagesInput = z.strictObject({
  aiEmployee: Name,
  messages: z.array(IncomingMessage),
  /** The message being edited: it and everything after it are replaced. */
  editingMessageId: z.string().optional(),
  // The chat repeats its task's settings with every message. A run uses those the conversation was created with, so
  // these are accepted and not applied; `PUT .../options` is how a conversation's settings change.
  systemMessage: z.string().optional(),
  skillSettings: JsonRecord.optional(),
  messageId: z.string().optional(),
  ...AgentStateFields,
});

export const ResendMessagesInput = z.strictObject({
  messageId: z.string().optional(),
  ...AgentStateFields,
});

export const ResumeToolCallInput = z.strictObject({
  messageId: z.string().optional(),
  ...AgentStateFields,
});

export const UserDecisionInput = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('approve') }),
  z.strictObject({ type: z.literal('reject'), message: z.string().optional() }),
  z.strictObject({
    type: z.literal('edit'),
    editedAction: z.strictObject({
      name: z.string().min(1),
      args: z.unknown(),
    }),
  }),
]);

export const ToolCallArgsInput = z.strictObject({ args: z.unknown() });

// ---------------------------------------------------------------------------------------------------------------------
// Response schemas. They describe what the routes send in the API document at `/api/swagger/docs`; nothing validates a
// response against them. Records read from storage carry `.loose()` objects: a column added later appears in the
// response before it appears here.

/** An RFC 3339 timestamp, documented by its format rather than by the long pattern `z.iso.datetime()` emits. */
const dateTime = () => z.string().meta({ format: 'date-time' });
const count = () => z.number().int().nonnegative();

/** The `meta` of a bounded list, which is read whole rather than paged. */
export const BoundedListMeta = z
  .object({
    total: count().meta({ description: 'How many rows the list holds.' }),
  })
  .meta({ ref: 'AiEmployeeBoundedListMeta' });

/** The `meta` of a list paged by `page` and `pageSize`. */
export const PagedListMeta = z
  .object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: count().meta({
      description: 'How many rows match, across every page.',
    }),
  })
  .meta({ ref: 'AiEmployeePagedListMeta' });

/** The `meta` of a message history page. */
export const MessagePageMeta = z
  .object({
    nextPageToken: z.string().optional().meta({
      description:
        'Pass as `pageToken` to read the next older page; absent on the oldest page.',
    }),
  })
  .meta({ ref: 'AiEmployeeMessagePageMeta' });

const I18nRef = z.object({
  namespace: z.string().meta({
    description:
      'The i18n namespace the title and description are translated in.',
  }),
});

const ToolSettingResponse = z.object({
  name: z.string(),
  autoCall: z
    .boolean()
    .optional()
    .meta({ description: 'Whether a call runs without asking the user.' }),
});

const SkillSettingsResponse = z
  .object({
    skills: z.array(z.string()),
    tools: z.array(ToolSettingResponse),
    enabledSkills: z.array(z.string()).nullable().optional().meta({
      description:
        '`null` or absent inherits the registered and GENERAL skills; `[]` disables every skill.',
    }),
    enabledTools: z.array(z.string()).nullable().optional().meta({
      description:
        '`null` or absent inherits the default tool availability; `[]` disables every tool.',
    }),
  })
  .meta({ ref: 'AiEmployeeSkillSettings' });

export const AIEmployeeResponse = z
  .looseObject({
    username: z.string(),
    nickname: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    greeting: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    about: z.string().nullable().optional(),
    defaultPrompt: z.string().nullable().optional(),
    category: z.string().optional(),
    knowledgeBasePrompt: z.string().nullable().optional(),
    knowledgeBase: z
      .looseObject({
        topK: z.number().optional(),
        score: z.number().optional(),
        knowledgeBaseKeys: z.array(z.string()).optional(),
        retrievalStrategy: z.enum(['always', 'onDemand']).optional(),
      })
      .nullable()
      .optional(),
    enableKnowledgeBase: z.boolean().optional(),
    chatSettings: JsonRecord.nullable().optional(),
    skillSettings: SkillSettingsResponse.nullable().optional(),
    modelSettings: JsonRecord.nullable().optional(),
    dataSourceSettings: JsonRecord.nullable().optional(),
    enabled: z.boolean().optional(),
    builtIn: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    sort: z.number().nullable().optional(),
    missingKnowledgeBaseKeys: z.array(z.string()).optional().meta({
      description:
        'Knowledge bases the employee names that do not exist; present only while the knowledge base feature is enabled.',
    }),
    createdAt: dateTime().nullable().optional(),
    updatedAt: dateTime().nullable().optional(),
  })
  .meta({ ref: 'AiEmployeeEmployee' });

export const AIEmployeeRosterEntryResponse = z
  .object({
    username: z.string(),
    nickname: z.string(),
    position: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    greeting: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    category: z.string().optional(),
    builtIn: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    userConfig: z.object({
      prompt: z.string().optional().meta({
        description: "The signed-in user's own prompt for this employee.",
      }),
    }),
    // The skills and tools this employee may use, resolved against what is registered.
    skillSettings: SkillSettingsResponse,
    chatSettings: JsonRecord.nullable().optional(),
    modelSettings: JsonRecord.nullable().optional(),
  })
  .meta({ ref: 'AiEmployeeRosterEntry' });

export const UserPromptResponse = z
  .object({ prompt: z.string() })
  .meta({ ref: 'AiEmployeeUserPrompt' });

const SkillToolResponse = z.object({
  name: z.string(),
  i18n: I18nRef.optional(),
  title: z.string(),
  description: z.string(),
  about: z.string(),
  available: z
    .boolean()
    .meta({ description: 'Whether a tool of this name is registered.' }),
});

const SkillSummaryFields = {
  name: z.string(),
  i18n: I18nRef.optional(),
  title: z.string(),
  description: z.string(),
  about: z.string(),
  scope: z
    .string()
    .meta({ description: '`SPECIFIED`, `GENERAL` or `CUSTOM`.' }),
  source: z
    .string()
    .meta({ description: 'Where the skill came from, such as `loader`.' }),
  tools: z.array(SkillToolResponse),
};

export const SkillSummaryResponse = z
  .object(SkillSummaryFields)
  .meta({ ref: 'AiEmployeeSkillSummary' });
export const SkillResponse = z
  .object({ ...SkillSummaryFields, content: z.string() })
  .meta({ ref: 'AiEmployeeSkill' });

const ToolSummaryFields = {
  name: z.string(),
  i18n: I18nRef.optional(),
  title: z.string(),
  description: z.string(),
  about: z.string(),
  scope: z
    .string()
    .meta({ description: '`SPECIFIED`, `GENERAL` or `CUSTOM`.' }),
  source: z.string().meta({ description: '`loader`, `workflow` or `mcp`.' }),
  defaultPermission: z.string().meta({
    description:
      '`ALLOW` runs a call without asking, `ASK` asks the user first, unless an employee says otherwise.',
  }),
};

export const ToolSummaryResponse = z
  .object(ToolSummaryFields)
  .meta({ ref: 'AiEmployeeToolSummary' });
export const ToolResponse = z
  .object({
    ...ToolSummaryFields,
    inputSchema: JsonRecord.nullable().meta({
      description: "The JSON Schema of the tool's arguments.",
    }),
  })
  .meta({ ref: 'AiEmployeeTool' });

const ModelOption = z.object({ label: z.string(), value: z.string() });

export const ModelGroupResponse = z
  .object({
    llmService: z.string(),
    llmServiceTitle: z.string(),
    provider: z.string(),
    providerTitle: z.string().optional(),
    enabledModels: z.array(ModelOption),
    supportWebSearch: z.boolean(),
    webSearchModels: z.array(z.string()).optional(),
    isToolConflict: z.boolean().meta({
      description:
        'Whether web search and tools cannot be used together on this service.',
    }),
  })
  .meta({ ref: 'AiEmployeeModelGroup' });

export const LLMProviderResponse = z
  .object({
    name: z.string(),
    title: z.string(),
    supportedModel: z.array(z.enum(['LLM', 'EMBEDDING'])),
    supportWebSearch: z.boolean(),
    webSearchModels: z.array(z.string()).optional(),
  })
  .meta({ ref: 'AiEmployeeLLMProvider' });

export const LLMServiceResponse = z
  .object({
    name: z.string(),
    title: z.string(),
    provider: z.string(),
    options: JsonRecord.meta({
      description:
        'Provider options from config.yml; secrets such as API keys read `***`.',
    }),
    enabledModels: z.object({
      mode: z.enum(['provider', 'custom']),
      models: z.array(ModelOption),
    }),
    enabled: z.boolean(),
    modelOptions: JsonRecord.optional(),
    sort: z.number(),
  })
  .meta({ ref: 'AiEmployeeLLMService' });

export const ProviderModelResponse = z
  .object({ id: z.string() })
  .meta({ ref: 'AiEmployeeProviderModel' });

export const MCPServerResponse = z
  .looseObject({
    name: z.string(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    enabled: z.boolean(),
    transport: z.enum(['stdio', 'sse', 'http']),
    command: z.string().nullable().optional(),
    args: z.array(z.string()).optional(),
    env: z
      .record(z.string(), z.string())
      .optional()
      .meta({ description: 'Secret values read `***`.' }),
    url: z.string().nullable().optional(),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .meta({ description: 'Secret values read `***`.' }),
    restart: JsonRecord.optional(),
    sort: z.number().nullable().optional(),
    toolPermissions: z.record(z.string(), z.enum(['ASK', 'ALLOW'])).optional(),
  })
  .meta({ ref: 'AiEmployeeMCPServer' });

export const MCPToolResponse = z
  .object({
    name: z.string(),
    title: z.string(),
    description: z.string().optional(),
    serverName: z.string(),
    permission: z.enum(['ASK', 'ALLOW']),
  })
  .meta({ ref: 'AiEmployeeMCPTool' });

export const MCPToolsByServerResponse = z
  .record(z.string(), z.array(MCPToolResponse))
  .meta({
    description: 'The tools of every connected server, keyed by server name.',
  });

export const AIFileResponse = z
  .object({
    id: z.string(),
    filename: z.string(),
    size: z.number().int(),
    mimetype: z.string(),
    extname: z.string(),
    disk: z.string(),
    path: z.string(),
    url: z.string().optional().meta({
      description:
        'Where the file is read back: `/api/aiEmployee/files/{fileId}/preview`.',
    }),
    preview: z.string(),
    source: z.object({ collectionName: z.literal('aiFiles') }),
    data: JsonRecord.meta({
      description: 'The stored file record, to attach to a message as is.',
    }),
  })
  .meta({ ref: 'AiEmployeeFile' });

const UsageTotalsFields = {
  eventCount: count(),
  inputTokens: count(),
  outputTokens: count(),
  totalTokens: count(),
  cachedTokens: count(),
  reasoningTokens: count(),
  toolCallCount: count(),
  autoToolCallCount: count(),
};
const UsageTotals = z
  .object(UsageTotalsFields)
  .meta({ ref: 'AiEmployeeUsageTotals' });
const UsageRange = z
  .object({
    start: dateTime(),
    end: dateTime(),
    timezoneOffsetHours: z
      .number()
      .meta({ description: 'The offset buckets were cut in, east-positive.' }),
  })
  .meta({
    ref: 'AiEmployeeUsageRange',
    description: 'The range the answer covers.',
  });
const UsageOption = z.object({ value: z.string(), label: z.string() });

export const UsageSummaryResponse = z
  .object({
    range: UsageRange,
    totals: UsageTotals,
    // The totals of the same-length window just before `range`, for period-over-period comparison.
    previous: UsageTotals,
    previousRange: z.object({ start: dateTime(), end: dateTime() }),
  })
  .meta({ ref: 'AiEmployeeUsageSummary' });

export const UsageSeriesResponse = z
  .object({
    range: UsageRange,
    granularity: z.enum(USAGE_GRANULARITIES),
    buckets: z.array(z.object({ ...UsageTotalsFields, start: dateTime() })),
  })
  .meta({ ref: 'AiEmployeeUsageSeries' });

export const UsageBreakdownResponse = z
  .object({
    range: UsageRange,
    dimension: z.enum(USAGE_BREAKDOWN_DIMENSIONS),
    rows: z.array(
      z.object({ ...UsageTotalsFields, key: z.string(), label: z.string() }),
    ),
    // The totals of the whole range, so the rows not listed show as a remainder.
    totals: UsageTotals,
  })
  .meta({ ref: 'AiEmployeeUsageBreakdown' });

export const UsageFilterOptionsResponse = z
  .object({
    range: UsageRange,
    models: z.array(UsageOption),
    aiEmployees: z.array(UsageOption),
  })
  .meta({ ref: 'AiEmployeeUsageFilterOptions' });

const ConversationFields = {
  sessionId: z
    .string()
    .meta({ description: 'The UUID that addresses the conversation.' }),
  thread: z.number().int().optional(),
  topicId: z.string().nullable().optional(),
  from: z.string().optional().meta({
    description:
      '`main-agent`, or `sub-agent` for a conversation an employee delegated.',
  }),
  scope: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  aiEmployeeUsername: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  options: JsonRecord.nullable().optional(),
  llmActiveState: z
    .string()
    .nullable()
    .optional()
    .meta({ description: '`idle` unless a run is in progress.' }),
  category: z.string().nullable().optional(),
  read: z.boolean().optional(),
  createdAt: dateTime().nullable().optional(),
  updatedAt: dateTime().nullable().optional(),
};

export const ConversationResponse = z
  .looseObject(ConversationFields)
  .meta({ ref: 'AiEmployeeConversation' });

export const ConversationUserResponse = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
  })
  .meta({ ref: 'AiEmployeeConversationUser' });

export const ManagedConversationResponse = z
  .looseObject({
    ...ConversationFields,
    user: ConversationUserResponse.nullable().meta({
      description: '`null` when the owning user no longer exists.',
    }),
    aiEmployee: z
      .object({
        username: z.string(),
        nickname: z.string().nullable(),
        avatar: z.string().nullable(),
      })
      .nullable(),
  })
  .meta({ ref: 'AiEmployeeManagedConversation' });

export const UnreadCountResponse = z
  .object({
    count: count().meta({
      description:
        "How many of the caller's conversations have unread answers.",
    }),
  })
  .meta({ ref: 'AiEmployeeUnreadCount' });

export const ConversationOptionsResponse = z
  .object({
    systemMessage: z.string().optional(),
    skillSettings: JsonRecord.optional(),
    conversationSettings: JsonRecord.optional(),
    modelSettings: JsonRecord.optional(),
  })
  .meta({ ref: 'AiEmployeeConversationOptions' });

export const ToolCallResponse = z
  .looseObject({
    id: z.string(),
    name: z.string(),
    args: z.unknown(),
    invokeStatus: z.string().optional().meta({
      description: 'Such as `interrupted`, `waiting`, `pending` or `done`.',
    }),
    status: z.string().optional(),
    auto: z.boolean().optional(),
    content: z.unknown().optional(),
    execution: z.enum(['frontend', 'backend']).optional(),
    willInterrupt: z
      .boolean()
      .optional()
      .meta({ description: "Whether the call waits for the user's decision." }),
    defaultPermission: z.enum(['ASK', 'ALLOW']).optional(),
  })
  .meta({ ref: 'AiEmployeeToolCall' });

export const UserDecisionResponse = z
  .object({
    updated: count().meta({
      description:
        'How many waiting tool calls took the decision: 1, or 0 when the call was no longer waiting.',
    }),
    toolCalls: z.array(ToolCallResponse).meta({
      description: 'Every tool call of the message, with its current state.',
    }),
  })
  .meta({ ref: 'AiEmployeeUserDecisionResult' });

export const MessageResponse = z
  .object({
    key: z.string().meta({ description: 'The message id.' }),
    role: z
      .string()
      .meta({ description: '`user`, `assistant`, `system` or `tool`.' }),
    createdAt: dateTime().optional(),
    content: z
      .looseObject({
        type: z.string().optional(),
        content: z.unknown(),
        messageId: z.string(),
        metadata: z.unknown().optional(),
        attachments: z.array(JsonRecord).nullable().optional(),
        workContext: z.array(JsonRecord).nullable().optional(),
        tool_calls: z.array(ToolCallResponse).optional(),
        reference: z
          .array(z.object({ title: z.string(), url: z.string() }))
          .optional(),
        reasoning: z.unknown().optional(),
        from: z.enum(['main-agent', 'sub-agent']),
        subAgentConversations: z
          .array(
            z.looseObject({
              sessionId: z.string(),
              toolCallId: z.string().optional(),
              messages: z.array(JsonRecord),
            }),
          )
          .optional()
          .meta({
            description:
              'The conversations this message delegated to other employees, with their messages.',
          }),
      })
      .meta({
        description:
          'The message as the chat renders it; its fields depend on the provider that produced it.',
      }),
  })
  .meta({ ref: 'AiEmployeeMessage' });
