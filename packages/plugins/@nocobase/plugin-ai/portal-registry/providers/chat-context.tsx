import { createContext, useContext } from "react";
import type {
  AIChatAttachment,
  AIChatMessage,
  AIConversation,
  AIEmployee,
  AIEmployeeTask,
  AIEmployeeTaskTrigger,
  AIModel,
  AIToolCallDecision,
  AIWorkContextItem,
} from "./types";

export type AIChatContextValue = {
  id: string;
  messages: AIChatMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  error?: Error;
  employees: AIEmployee[];
  models: AIModel[];
  currentEmployee: AIEmployee;
  currentModel: AIModel;
  canSend: boolean;
  activeConversation?: AIConversation;
  activeConversationId: string;
  conversations: AIConversation[];
  conversationsLoading: boolean;
  conversationSearch: string;
  messagesLoading: boolean;
  historyError?: Error;
  interactionError?: Error;
  conversationListOpen: boolean;
  availableTasks: AIEmployeeTask[];
  composerFocusRequest: number;
  draft: string;
  attachments: AIChatAttachment[];
  uploadingAttachments: boolean;
  workContext: AIWorkContextItem[];
  editingMessageId?: string;
  setDraft: (value: string) => void;
  uploadFiles: (files: File[]) => Promise<void>;
  removeAttachment: (uid: string) => void;
  addWorkContext: (item: AIWorkContextItem) => void;
  removeWorkContext: (item: AIWorkContextItem) => void;
  send: () => Promise<void>;
  stop: () => Promise<void>;
  regenerate: () => Promise<void>;
  retryMessage: (message: AIChatMessage) => Promise<void>;
  decideToolCall: (decision: AIToolCallDecision) => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => Promise<void>;
  removeConversation: (conversationId: string) => Promise<void>;
  searchConversations: (keyword: string) => Promise<void>;
  setConversationListOpen: (open: boolean) => void;
  selectEmployee: (username: string) => void;
  selectModel: (model: string) => void;
  startEditingMessage: (message: AIChatMessage) => Promise<void>;
  cancelEditingMessage: () => void;
  saveUserPrompt: (prompt: string) => Promise<void>;
  triggerTask: (options: AIEmployeeTaskTrigger) => Promise<void>;
  runTask: (task: AIEmployeeTask) => void;
  focusComposer: () => void;
};

export type AIChatMessagesContextValue = Pick<AIChatContextValue, "messages">;
export type AIChatStatusContextValue = Pick<
  AIChatContextValue,
  "status" | "error"
>;
export type AIChatBaseContextValue = Omit<
  AIChatContextValue,
  keyof AIChatMessagesContextValue | keyof AIChatStatusContextValue
>;

export const AIChatContext = createContext<AIChatBaseContextValue | null>(null);
export const AIChatMessagesContext =
  createContext<AIChatMessagesContextValue | null>(null);
export const AIChatStatusContext =
  createContext<AIChatStatusContextValue | null>(null);

export function useAIChatBase() {
  const value = useContext(AIChatContext);
  if (!value) throw new Error("useAIChatBase must be used inside AIChatProvider");
  return value;
}

export function useAIChatMessages() {
  const value = useContext(AIChatMessagesContext);
  if (!value) {
    throw new Error("useAIChatMessages must be used inside AIChatProvider");
  }
  return value;
}

export function useAIChatStatus() {
  const value = useContext(AIChatStatusContext);
  if (!value) {
    throw new Error("useAIChatStatus must be used inside AIChatProvider");
  }
  return value;
}

export function useAIChat() {
  return {
    ...useAIChatBase(),
    ...useAIChatMessages(),
    ...useAIChatStatus(),
  };
}
