import { createContext, useContext } from 'react';
import type { AIService } from '../services/index.js';
import type { AIChatController } from './chat-controller.js';
import type {
  AIConfigurationStatus,
  AIConversation,
  AIEmployee,
  AIModel,
  AIToolCallInvocationContext,
  AITransportFactory,
} from './types.js';

export type AIProviderValue = {
  configurationStatus: AIConfigurationStatus;
  configurationError?: Error;
  modelConfigurationError?: Error;
  hasEnabledModels: boolean;
  employees: AIEmployee[];
  models: AIModel[];
  globalController: AIChatController;
  createTransport: AITransportFactory;
  uploadFile: AIService['uploadFile'];
  updateEmployeeUserPrompt: (username: string, prompt: string) => Promise<void>;
  listConversations: (keyword?: string) => Promise<AIConversation[]>;
  getConversationMessages: AIService['getConversationMessages'];
  getConversationActiveState: AIService['getConversationActiveState'];
  updateConversationTitle: (sessionId: string, title: string) => Promise<void>;
  destroyConversation: (sessionId: string) => Promise<void>;
  updateToolCallDecision: AIService['updateToolCallDecision'];
  invokeToolCall: (
    toolName: string,
    input: unknown,
    context: AIToolCallInvocationContext,
  ) => Promise<{ handled: boolean; result?: unknown }>;
  canAutoApproveToolCall: (
    toolName: string,
    input: unknown,
    context: AIToolCallInvocationContext,
  ) => boolean;
};

export const AIContext = createContext<AIProviderValue | null>(null);

export function useAI(): AIProviderValue {
  const value = useContext(AIContext);
  if (!value) throw new Error('useAI must be used inside AIProvider');
  return value;
}

export function useGlobalAIChatController(): AIChatController {
  return useAI().globalController;
}
