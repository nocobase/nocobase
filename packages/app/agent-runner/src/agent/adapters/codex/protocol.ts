/**
 * The subset of the `codex app-server` v2 protocol the adapter uses.
 *
 * Written against Codex CLI 0.158.0 (`codex app-server generate-ts`,
 * 2026-10-01). Messages are JSON-RPC 2.0 without the `jsonrpc` member, one
 * JSON object per line on stdio. Only the fields the adapter reads are
 * declared; everything else passes through untyped.
 */

export type RequestId = string | number;

export interface RpcErrorBody {
  code: number;
  message: string;
  data?: unknown;
}

/** Any message on the wire, in either direction. */
export interface RpcMessage {
  id?: RequestId;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: RpcErrorBody;
}

export type AskForApproval = 'untrusted' | 'on-request' | 'never';

export type SandboxPolicy = {
  type: 'workspaceWrite';
  writableRoots: string[];
  networkAccess: boolean;
  excludeTmpdirEnvVar: boolean;
  excludeSlashTmp: boolean;
};

export interface UserTextInput {
  type: 'text';
  text: string;
  text_elements: [];
}

export interface InitializeResponse {
  userAgent: string;
  codexHome?: string;
  platformOs?: string;
}

export interface ThreadResponse {
  thread: { id: string };
  model: string;
  reasoningEffort?: string | null;
  approvalPolicy?: unknown;
  sandbox?: { type?: string } | null;
}

export type TurnStatus = 'completed' | 'interrupted' | 'failed' | 'inProgress';

export type CodexErrorInfo =
  string | Record<string, { httpStatusCode?: number | null } | undefined>;

export interface TurnError {
  message: string;
  codexErrorInfo: CodexErrorInfo | null;
  additionalDetails: string | null;
}

export interface Turn {
  id: string;
  status: TurnStatus;
  error: TurnError | null;
  durationMs?: number | null;
}

export interface FileUpdateChange {
  path: string;
  kind: { type: 'add' | 'delete' | 'update'; move_path?: string | null };
  diff?: string;
}

export type ThreadItem =
  | {
      type: 'userMessage';
      id: string;
      clientId?: string | null;
      content: unknown[];
    }
  | { type: 'agentMessage'; id: string; text: string; phase?: string | null }
  | { type: 'reasoning'; id: string; summary: string[]; content: string[] }
  | {
      type: 'commandExecution';
      id: string;
      command: string;
      cwd: string;
      status: string;
      aggregatedOutput: string | null;
      exitCode: number | null;
      durationMs: number | null;
    }
  | {
      type: 'fileChange';
      id: string;
      changes: FileUpdateChange[];
      status: string;
    }
  | {
      type: 'mcpToolCall';
      id: string;
      server: string;
      tool: string;
      status: string;
      arguments: unknown;
      result: { content: unknown[] } | null;
      error: { message: string } | null;
    }
  | {
      type: 'dynamicToolCall';
      id: string;
      tool: string;
      arguments: unknown;
      status: string;
      contentItems: unknown[] | null;
      success: boolean | null;
    }
  | {
      type: 'collabAgentToolCall';
      id: string;
      tool: string;
      status: string;
      prompt: string | null;
    }
  | { type: 'webSearch'; id: string; query: string }
  | { type: 'imageView'; id: string; path: string }
  | { type: 'contextCompaction'; id: string }
  | { type: string; id: string };

export interface TokenUsageBreakdown {
  totalTokens: number;
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens?: number;
  outputTokens: number;
  reasoningOutputTokens: number;
}

export interface ThreadTokenUsage {
  total: TokenUsageBreakdown;
  last: TokenUsageBreakdown;
}

export interface CommandApprovalParams {
  threadId: string;
  turnId: string;
  itemId: string;
  approvalId?: string | null;
  reason?: string | null;
  command?: string | null;
  cwd?: string | null;
}

export interface FileChangeApprovalParams {
  threadId: string;
  turnId: string;
  itemId: string;
  reason?: string | null;
  grantRoot?: string | null;
}

export interface PermissionsApprovalParams {
  threadId: string;
  turnId: string;
  itemId: string;
  reason: string | null;
  permissions: unknown;
}

/** Streaming deltas the adapter does not need; it reads completed items. */
export const OPTED_OUT_NOTIFICATIONS: readonly string[] = [
  'item/agentMessage/delta',
  'item/plan/delta',
  'item/reasoning/summaryTextDelta',
  'item/reasoning/summaryPartAdded',
  'item/reasoning/textDelta',
  'item/commandExecution/outputDelta',
  'item/commandExecution/terminalInteraction',
  'item/fileChange/outputDelta',
  'item/fileChange/patchUpdated',
  'item/mcpToolCall/progress',
  'turn/diff/updated',
  'turn/plan/updated',
  'rawResponseItem/completed',
  'rawResponse/completed',
  'account/rateLimits/updated',
  'account/updated',
  'skills/changed',
  'app/list/updated',
  'remoteControl/status/changed',
  'mcpServer/startupStatus/updated',
  'thread/settings/updated',
  'thread/status/changed',
  'thread/queue/changed',
];
