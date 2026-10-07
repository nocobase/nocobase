import type { AIEmployeeSkillSettings } from '@nocobase/ai-employee';
import type {
  ApiErrorStatus,
  ApiFieldViolation,
} from '@nocobase/app-server/router';

export interface Actor {
  readonly id: string | number;
  readonly roles: readonly string[];
  readonly isRoot: boolean;
  readonly locale?: string;
  readonly scope?: string;
}

export interface ConversationManagementActor {
  readonly id: string | number;
  readonly canReadAllConversations?: boolean;
}

export interface SkillsManagementActor {
  readonly id: string | number;
  readonly canReadAllSkills?: boolean;
}

export interface ToolsManagementActor {
  readonly id: string | number;
  readonly canReadAllTools?: boolean;
}

export interface UsageStatisticsActor {
  readonly id: string | number;
  readonly canReadUsageStatistics?: boolean;
}

export interface ManagedToolSummary {
  i18n?: { namespace: string };
  name: string;
  title: string;
  description: string;
  about: string;
  scope: string;
  source: string;
  /** Whether a call runs without asking, unless an employee's own setting says otherwise. */
  defaultPermission: string;
}

export type ManagedToolSchemaValue =
  | string
  | number
  | boolean
  | null
  | ManagedToolSchemaValue[]
  | ManagedToolInputSchema;

export interface ManagedToolInputSchema {
  [key: string]: ManagedToolSchemaValue;
}

export interface ManagedToolDetail extends ManagedToolSummary {
  inputSchema: ManagedToolInputSchema | null;
}

export interface ManagedSkillTool {
  i18n?: { namespace: string };
  name: string;
  title: string;
  description: string;
  about: string;
  available: boolean;
}

export interface ManagedSkillSummary {
  i18n?: { namespace: string };
  name: string;
  title: string;
  description: string;
  about: string;
  scope: string;
  source: string;
  tools: ManagedSkillTool[];
}

export interface ManagedSkillDetail extends ManagedSkillSummary {
  content: string;
}

export interface ModelRef {
  readonly llmService: string;
  readonly model: string;
}

export type Translate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

export const identityTranslate: Translate = (key) => key;

export interface ConversationStreamTarget {
  write(chunk: unknown): void;
  end(chunk?: unknown): void;
  readonly destroyed?: boolean;
  readonly writableEnded?: boolean;
}

/**
 * Where every AI resource other than the employees themselves is served. Employees are at `/api/aiEmployees`; this
 * prefix is what file preview addresses are built from.
 */
export const AI_API_BASE_PATH = '/api/aiEmployee' as const;
export type EnabledModelDto = { label: string; value: string };
export type EnabledModelsConfigDto = {
  mode: 'provider' | 'custom';
  models: EnabledModelDto[];
};
export type LLMServiceDto = {
  name: string;
  title: string;
  provider: string;
  options: Record<string, unknown>;
  enabledModels: EnabledModelsConfigDto;
  enabled: boolean;
  modelOptions?: Record<string, unknown>;
  sort: number;
};
export type ProviderModelListRequest = {
  llmService: string;
  search?: string;
};
export type ProviderModelDto = { id: string };

export type AIEmployeeDefinition = {
  username: string;
  nickname?: string;
  position?: string;
  bio?: string;
  greeting?: string;
  avatar?: string;
  category?: string;
  deprecated?: boolean;
  builtIn?: boolean;
  enabled?: boolean;
  systemPrompt?: string | null;
  chatSettings?: Record<string, unknown>;
  skillSettings?: Partial<AIEmployeeSkillSettings>;
  modelSettings?: {
    enabled?: boolean;
    llmService?: string;
    model?: string;
    models?: ModelRef[];
  };
  tools?: Array<{ name: string; autoCall?: boolean }>;
  skills?: string[];
};

export type AIStreamEvent = Record<string, unknown>;

export type AIEmployeeDto = {
  username: string;
  nickname: string;
  position?: string;
  bio?: string;
  greeting?: string;
  description?: string;
  avatar?: string;
  category?: string;
  deprecated?: boolean;
  builtIn?: boolean;
  userConfig?: { prompt?: string; sort?: number };
  chatSettings?: Record<string, unknown>;
  skillSettings?: Partial<AIEmployeeSkillSettings>;
  modelSettings?: {
    enabled?: boolean;
    llmService?: string;
    model?: string;
    models?: ModelRef[];
  };
};

export type EnabledLLMServiceDto = {
  llmService: string;
  llmServiceTitle: string;
  provider: string;
  providerTitle?: string;
  enabledModels: Array<{ label: string; value: string }>;
  supportWebSearch: boolean;
  webSearchModels?: string[];
  isToolConflict: boolean;
};

export type CreateConversationRequest = {
  aiEmployee: AIEmployeeDto | AIEmployeeDefinition;
  systemMessage?: string;
  skillSettings?: { skills?: string[]; tools?: string[] };
  modelSettings: ModelRef;
  scope?: string;
};

export type IncomingAttachmentRef = {
  id?: string | number;
  uid?: string;
  filename: string;
  size?: number;
  mimetype?: string;
  url?: string;
  preview?: string;
  source?: {
    dataSourceKey?: string;
    collectionName?: string;
    field?: string;
    documentCache?: boolean;
  };
  [key: string]: unknown;
};

export type IncomingChatMessage = {
  key?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: { type: string; content: unknown };
  attachments?: IncomingAttachmentRef[];
  workContext?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
  toolCalls?: Array<Record<string, unknown>>;
};

export type SendMessagesRequest = {
  sessionId: string;
  aiEmployee: string;
  model: ModelRef;
  systemMessage?: string;
  skillSettings?: { skills?: string[]; tools?: string[] };
  messages: IncomingChatMessage[];
  editingMessageId?: string;
  webSearch?: boolean;
};

export type ResendMessagesRequest = {
  sessionId: string;
  messageId?: string;
  model: ModelRef;
  webSearch?: boolean;
};

export type ToolCallDecision =
  | { type: 'approve' }
  | { type: 'reject'; message?: string }
  | { type: 'edit'; editedAction: { name: string; args: unknown } };

export type UpdateToolCallDecisionRequest = {
  sessionId: string;
  messageId: string;
  toolCallId: string;
  userDecision: ToolCallDecision;
};

export type ResumeToolCallRequest = {
  sessionId: string;
  messageId?: string;
  toolCallIds?: string[];
  toolCallResults?: Array<{ id: string; result: unknown }>;
  model: ModelRef;
  webSearch?: boolean;
};

export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INFRASTRUCTURE_ERROR';

export interface DomainErrorOptions extends ErrorOptions {
  /** What went wrong, in UPPER_SNAKE_CASE; becomes the `reason` of the HTTP error body. */
  readonly reason?: string;
  /** The API status category, when the HTTP status alone does not decide it, such as `FAILED_PRECONDITION`. */
  readonly apiStatus?: ApiErrorStatus;
  /** The invalid fields of an `INVALID_ARGUMENT`, such as a body field naming something that does not exist. */
  readonly fieldViolations?: readonly ApiFieldViolation[];
}

const DEFAULT_REASONS: Record<DomainErrorCode, string> = {
  VALIDATION_ERROR: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'AI_SETTINGS_ACCESS_REQUIRED',
  CONFLICT: 'CONFLICT',
  INFRASTRUCTURE_ERROR: 'INTERNAL_ERROR',
};

/** An error the AI employee services raise for a caller to see. The routes answer it as an `ApiError`. */
export class DomainError extends Error {
  public readonly reason: string;
  public readonly apiStatus: ApiErrorStatus;
  public readonly fieldViolations: readonly ApiFieldViolation[] | undefined;

  public constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly status: number,
    options?: DomainErrorOptions,
  ) {
    super(message, options);
    this.name = 'DomainError';
    this.reason = options?.reason ?? DEFAULT_REASONS[code];
    this.apiStatus = options?.apiStatus ?? apiStatusForHttp(code, status);
    this.fieldViolations = options?.fieldViolations;
  }
}

function apiStatusForHttp(
  code: DomainErrorCode,
  status: number,
): ApiErrorStatus {
  if (code === 'CONFLICT') return 'ALREADY_EXISTS';
  switch (status) {
    case 400:
      return 'INVALID_ARGUMENT';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'ABORTED';
    case 429:
      return 'RESOURCE_EXHAUSTED';
    case 503:
      return 'UNAVAILABLE';
    default:
      return status >= 500 ? 'INTERNAL' : 'FAILED_PRECONDITION';
  }
}

export function validationError(
  message: string,
  reason: string = 'INVALID_REQUEST',
): DomainError {
  return new DomainError('VALIDATION_ERROR', message, 400, { reason });
}

/** The request is valid, but the state of what it names forbids it. */
export function preconditionError(
  message: string,
  reason: string,
): DomainError {
  return new DomainError('VALIDATION_ERROR', message, 400, {
    reason,
    apiStatus: 'FAILED_PRECONDITION',
  });
}

export function notFoundError(
  message: string,
  reason: string = 'NOT_FOUND',
): DomainError {
  return new DomainError('NOT_FOUND', message, 404, { reason });
}

export function forbiddenError(
  message: string,
  reason: string = 'AI_SETTINGS_ACCESS_REQUIRED',
): DomainError {
  return new DomainError('FORBIDDEN', message, 403, { reason });
}

/** A dependency, such as an LLM provider, could not answer; retrying later may succeed. */
export function unavailableError(
  message: string,
  reason: string,
  cause?: unknown,
): DomainError {
  return new DomainError('INFRASTRUCTURE_ERROR', message, 503, {
    reason,
    apiStatus: 'UNAVAILABLE',
    cause,
  });
}

export function infrastructureError(
  message: string,
  cause?: unknown,
): DomainError {
  return new DomainError('INFRASTRUCTURE_ERROR', message, 500, { cause });
}

export function sendStreamError(
  target: ConversationStreamTarget,
  error: Error | string,
  errorName?: string,
  code?: string,
): void {
  const body =
    typeof error === 'string' ? error : error.message || 'Unknown error';
  target.write(
    `data: ${JSON.stringify({ type: 'error', body, errorName, ...(code ? { code } : {}) })}\n\n`,
  );
  target.end();
}

export class ResourceActionError extends DomainError {
  public constructor(
    status: number,
    message: string,
    options?: DomainErrorOptions,
  ) {
    super(
      status === 403
        ? 'FORBIDDEN'
        : status === 404
          ? 'NOT_FOUND'
          : status >= 500
            ? 'INFRASTRUCTURE_ERROR'
            : 'VALIDATION_ERROR',
      message,
      status,
      options,
    );
    this.name = 'ResourceActionError';
  }
}
