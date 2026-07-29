import type {
  AIChatMessage,
  AIConversation,
  AIEmployee,
  AIModel,
} from "../providers/types";

export type CreateAIConversationOptions = {
  employee: AIEmployee;
  model: AIModel;
  systemMessage?: string;
  skillSettings?: {
    skills?: string[];
    tools?: string[];
  };
};

export type UpdateToolCallDecisionOptions = {
  sessionId: string;
  messageId: string;
  toolCallId: string;
  userDecision:
    | { type: "approve" }
    | { type: "reject"; message?: string }
    | {
        type: "edit";
        editedAction: { name: string; args: unknown };
      };
};

export type UpdatedToolCall = {
  id: string;
  name: string;
  invokeStatus?: string;
  status?: string;
  auto?: boolean;
  execution?: string;
  willInterrupt?: boolean;
  args?: unknown;
};

export type AIConversationActiveState = "idle" | "streaming" | "invoking";

export interface AIService {
  listEmployees(): Promise<AIEmployee[]>;
  listModels(): Promise<AIModel[]>;
  updateEmployeeUserPrompt(username: string, prompt: string): Promise<void>;
  listConversations(keyword?: string): Promise<AIConversation[]>;
  getConversationMessages(
    sessionId: string,
    options?: { updateRead?: boolean }
  ): Promise<AIChatMessage[]>;
  getConversationActiveState(
    sessionId: string
  ): Promise<AIConversationActiveState | undefined>;
  updateConversationTitle(sessionId: string, title: string): Promise<void>;
  destroyConversation(sessionId: string): Promise<void>;
  uploadFile(
    file: File,
    signal?: AbortSignal
  ): Promise<Record<string, unknown>>;
  createConversation(options: CreateAIConversationOptions): Promise<string>;
  sendMessagesStream(
    body: unknown,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
  resendMessagesStream(
    body: unknown,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
  updateToolCallDecision(
    options: UpdateToolCallDecisionOptions
  ): Promise<{ updated: number; toolCalls: UpdatedToolCall[] }>;
  resumeToolCallStream(
    body: unknown,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
  resumeConversationStream(
    sessionId: string,
    signal?: AbortSignal
  ): Promise<ReadableStream<Uint8Array>>;
}
