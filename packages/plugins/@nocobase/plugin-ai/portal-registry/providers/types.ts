import type { ChatTransport, UIMessage } from "ai";

export const AI_DRAFT_CONVERSATION_ID = "__draft__";

export type AIConfigurationStatus = "loading" | "ready" | "error";

export type AIEmployee = {
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
  userConfig?: {
    prompt?: string;
  };
  modelSettings?: {
    enabled?: boolean;
    llmService?: string;
    model?: string;
    models?: Array<{
      llmService?: string;
      model?: string;
    }>;
  };
};

export type AIChatAttachmentStatus = "uploading" | "done" | "error";

export type AIChatAttachment = {
  uid: string;
  filename: string;
  status: AIChatAttachmentStatus;
  size?: number;
  mimetype?: string;
  url?: string;
  preview?: string;
  progress?: number;
  error?: string;
  source?: unknown;
  [key: string]: unknown;
};

export type AIModel = {
  value: string;
  label: string;
  llmService?: string;
  llmServiceTitle?: string;
  supportWebSearch?: boolean;
  isToolConflict?: boolean;
  configured?: boolean;
};

export type AIConversation = {
  id: string;
  title: string;
  employeeUsername: string;
  updatedAt: string;
  unread?: boolean;
  model?: {
    llmService?: string;
    model: string;
  };
};

export type AIWorkContextItem = {
  type: string;
  id?: string;
  title?: string;
  content?: unknown;
  [key: string]: unknown;
};

export type AIEmployeeTask = {
  title?: string;
  message?: {
    system?: string;
    user?: string;
    workContext?: AIWorkContextItem[];
  };
  autoSend?: boolean;
  skillSettings?: {
    skills?: string[];
    tools?: string[];
  };
  webSearch?: boolean;
  model?: {
    llmService?: string;
    model: string;
  };
};

export type AIEmployeeTasks = Record<string, AIEmployeeTask[]>;

export type AIEmployeeTaskTrigger = {
  aiEmployee: string | AIEmployee;
  task?: AIEmployeeTask;
  tasks?: AIEmployeeTask[];
  context?: AIWorkContextItem[];
  auto?: boolean;
  open?: boolean;
};

export type AIChatTaskRuntime = {
  systemMessage?: string;
  workContext: AIWorkContextItem[];
  skillSettings?: AIEmployeeTask["skillSettings"];
  webSearch?: boolean;
};

export type AIChatMessageMetadata = {
  createdAt?: string;
  employeeUsername?: string;
  toolApprovals?: Record<string, AIToolCallApproval>;
  serverMessageId?: string;
  editingMessageId?: string;
  attachments?: AIChatAttachment[];
  workContext?: AIWorkContextItem[];
};

export type AIToolCallApproval = {
  required: boolean;
  status?: "pending" | "approved" | "rejected";
};

export type AIToolCallDecision = {
  messageId: string;
  toolCallId: string;
  toolName: string;
  decision: "approve" | "reject" | "edit";
  input?: unknown;
};

export type AIToolCallInvocationContext = {
  sessionId: string;
  messageId: string;
  toolCallId: string;
  toolName: string;
  allowedFrontendToolIds?: string[];
  allowedFormIds?: string[];
  automatic?: boolean;
};

export type AIToolInvoker = (
  input: unknown,
  context: AIToolCallInvocationContext
) => unknown | Promise<unknown>;

export type AIToolInvokerMap = Record<string, AIToolInvoker>;

export type AISubAgentConversation = {
  sessionId: string;
  username: string;
  status: "pending" | "completed";
  messages: AIChatMessage[];
};

export type AIChatDataParts = {
  subAgent: AISubAgentConversation;
};

export type AIChatMessage = UIMessage<AIChatMessageMetadata, AIChatDataParts>;

export type AIChatRequestContext = {
  sessionId?: string;
  employee: AIEmployee;
  model: AIModel;
  task?: AIChatTaskRuntime;
};

export type AITransportFactoryOptions = {
  chatId: string;
  getContext: () => AIChatRequestContext;
  onSessionCreated?: (sessionId: string) => void;
};

export type AITransportFactory = (
  options: AITransportFactoryOptions
) => ChatTransport<AIChatMessage>;
