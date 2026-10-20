import type { Tool, ModelMessage, UIMessage, UIMessageChunk } from 'ai';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { ServiceResolver } from '@nocobase/service-provider';
import type { ZodObject } from 'zod';
import type { ModelRef } from '../../../shared/models.js';
import type { ResolvedPageContext } from '../../../shared/conversations.js';
import type {
  AppUIMessage,
  AppUIToolApprovalInput,
  AppUIMessageMetadata,
  AppUIData,
} from '../../../shared/online-agent.js';
import type { RedisOptions } from 'ioredis';

export type OnlineAgentContext = Readonly<{
  user: { id: string };
  authorization: AuthorizationContext;
  /** Full entry credentials remain in memory and are passed to the business service unchanged. */
  credentials: unknown;
  business?: OnlineAgentJson;
  variable?: OnlineAgentJson;
  systemPrompt?: string;
}>;
export type OnlineAgentToolContext = OnlineAgentContext & {
  /** The executing session, supplied by the runtime rather than model or page input. */
  readonly sessionId: string;
  readonly signal: AbortSignal;
};
export type OnlineAgentScope = {
  agentId?: string;
  systemPromptTemplate?:
    | string
    | {
        variableSchema?: ZodObject;
        template(context: OnlineAgentContext): string;
      };
  context?: { variable?: OnlineAgentJson; systemPrompt?: string };
  tool?: string[];
  model?: string[];
  thinking?: string;
  permissions?: never;
};
export type OnlineAgentScopeProvider = (
  context: OnlineAgentContext,
) => OnlineAgentScope | Promise<OnlineAgentScope>;
export type OnlineAgentOptions = OnlineAgentScope & { scope?: string[] };
export type OnlineAgentConfig = {
  agentId?: string;
  scope: string[];
  systemPrompt: string;
  variable?: OnlineAgentJson;
  tool: string[];
  toolVersions: Record<string, string>;
  model: string[];
  thinking?: string;
};
export type OnlineAgentToolDefinition<
  I,
  O extends OnlineAgentJson,
  C = OnlineAgentToolContext,
> = Tool<I, O, C> & {
  execute: NonNullable<Tool<I, O, C>['execute']>;
  permissions?: never;
  /** Explicit public projections; omitted tools remain private model evidence. */
  public?: {
    input(value: I): OnlineAgentJson;
    output(value: O): OnlineAgentJson;
  };
};
export type OnlineAgentRegisteredTool = {
  version: string;
  resolve(
    resolver?: ServiceResolver,
  ): OnlineAgentToolDefinition<
    unknown,
    OnlineAgentJson,
    OnlineAgentToolContext
  >;
};

export type OnlineAgentBackendKind = 'native' | 'runner';
export type OnlineAgentBoundary = 'http' | undefined;
export type OnlineAgentConfiguration = OnlineAgentConfig & {
  selectedModel: ModelRef | null;
};
export type OnlineAgentInitialConfiguration = {
  config: OnlineAgentConfig;
  hasModel: boolean;
  defaultModel?: ModelRef;
};

export type OnlineAgentSendOptions = {
  attachmentIds?: string[][];
  clientId?: string;
  messageId?: string;
  workContext?: ResolvedPageContext;
  overrides?: OnlineAgentOptions;
  selectedModel?: ModelRef;
};
export type OnlineAgentRealtimeOptions = OnlineAgentOptions & {
  sessionId?: string;
  selectedModel?: ModelRef;
  source?: string;
  title?: string;
  showInChatList?: boolean;
};
export type OnlineAgentJson =
  | null
  | boolean
  | number
  | string
  | OnlineAgentJson[]
  | { [key: string]: OnlineAgentJson };

export type OnlineAgentOutcome = 'completed' | 'cancelled' | 'failed';
export type OnlineAgentResult =
  | { ok: true; data: OnlineAgentJson }
  | { ok: false; reason: 'pending' }
  | { ok: false; reason: 'failed' | 'cancelled'; error: OnlineAgentSafeError };

export type OnlineAgentSafeError = {
  code: 'EXECUTION_FAILED' | 'EXECUTION_CANCELLED' | 'OUTPUT_INVALID';
  message: string;
};

export type NativeApproval = AppUIToolApprovalInput;
export type NativeSnapshot = {
  message: NativeMessage;
};
export type NativeHistoryQuery = {
  ids?: string[];
  before?: number;
  after?: number;
  limit: number;
};
export type NativeHistoryPage = {
  items: AppUIMessage[];
  lastSeq: number;
  hasMore: boolean;
  nextAfter?: number;
};

export type NativeInput = {
  id: string;
  parts: NativeMessage['parts'];
  attachments: string[];
  clientId?: string;
  workContext?: ResolvedPageContext;
  providerOptions?: ModelMessage['providerOptions'];
};

/** The one persisted SDK message: raw tool results and provider/approval evidence stay here. */
export type NativeMessage = UIMessage<
  AppUIMessageMetadata & {
    inputProviderOptions?: ModelMessage['providerOptions'];
    inputFiles?: number[];
  }
>;
export type NativeToolPart = Extract<
  UIMessage['parts'][number],
  { toolCallId: string }
>;
export type NativePublicPart = AppUIMessage['parts'][number];
export type NativeUIChunk = UIMessageChunk<AppUIMessageMetadata, AppUIData>;
/** Plugin-owned connections: the host cache interface does not expose Redis pub/sub. */
export type OnlineAgentRecoveryConfig = {
  redis: RedisOptions;
  namespace: string;
};
export type UIStreamAssociation = {
  streamId: string;
  executionId: string;
  backend: 'native' | 'runner';
};
