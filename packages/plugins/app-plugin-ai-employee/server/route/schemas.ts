import { z } from 'zod';

import { AI_EMPLOYEE_RESERVED_USERNAMES } from './reserved-names.js';
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
const I18n = z.strictObject({ namespace: z.string().trim().min(1) });
const Scope = z.enum(['SPECIFIED', 'GENERAL', 'CUSTOM']);
const Introduction = z.strictObject({
  title: z.string().optional(),
  about: z.string().optional(),
});

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

export { AI_EMPLOYEE_RESERVED_USERNAMES };

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

export const CreateAIEmployeeInput = z.strictObject({
  username: Name.refine(
    (username) => !AI_EMPLOYEE_RESERVED_USERNAMES.includes(username),
    `Must not be one of the reserved names: ${AI_EMPLOYEE_RESERVED_USERNAMES.join(', ')}.`,
  ),
  ...AIEmployeeFields,
});
export type CreateAIEmployeeInput = z.infer<typeof CreateAIEmployeeInput>;

export const UpdateAIEmployeeInput = z.strictObject(AIEmployeeFields);
export type UpdateAIEmployeeInput = z.infer<typeof UpdateAIEmployeeInput>;

export const UserPromptInput = z.strictObject({ prompt: z.string() });

// ---------------------------------------------------------------------------------------------------------------------
// Skills and tools: /aiEmployee/skills, /aiEmployee/tools

export const NameParams = z.object({ name: Name });

const SkillFields = {
  scope: Scope.optional(),
  i18n: I18n.optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  tools: z.array(z.string()).optional(),
  from: z.string().optional(),
  introduction: Introduction.optional(),
};

export const CreateSkillInput = z.strictObject({ name: Name, ...SkillFields });
export const UpdateSkillInput = z.strictObject(SkillFields);
export type SkillWriteInput = z.infer<typeof UpdateSkillInput>;

const ToolFields = {
  scope: Scope.optional(),
  i18n: I18n.optional(),
  from: z.enum(['loader', 'workflow', 'mcp']).optional(),
  execution: z.enum(['frontend', 'backend']).optional(),
  defaultPermission: z.enum(['ALLOW', 'ASK']).optional(),
  silence: z.boolean().optional(),
  introduction: Introduction.optional(),
};
const ToolDefinition = {
  description: z.string().optional(),
  schema: JsonRecord.optional(),
};

export const CreateToolInput = z.strictObject({
  ...ToolFields,
  definition: z.strictObject({ name: Name, ...ToolDefinition }),
});
export const UpdateToolInput = z.strictObject({
  ...ToolFields,
  definition: z.strictObject(ToolDefinition).optional(),
});
export type ToolWriteInput = z.infer<typeof UpdateToolInput>;

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

/** A remote server tested before it is saved. A stdio server runs a local command, so only a configured one is tested. */
export const MCPCandidateInput = z.strictObject({
  transport: z.enum(['http', 'sse']),
  url: z.url(),
  headers: z.record(z.string(), z.string()).optional(),
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
