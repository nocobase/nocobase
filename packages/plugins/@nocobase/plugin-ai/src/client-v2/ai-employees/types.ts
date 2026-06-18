/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BubbleProps } from '@ant-design/x';
import type { ComponentType } from 'react';
import type { Application } from '@nocobase/client-v2';
import type { FlowEngineContext } from '@nocobase/flow-engine';

export type Selector = {
  onSelect: (options: { uid: string }) => void;
};

export type AIEmployee = {
  username: string;
  nickname?: string;
  position?: string;
  avatar?: string;
  bio?: string;
  greeting?: string;
  userConfig?: {
    prompt?: string;
  };
  skillSettings?: {
    tools?: { name: string; autoCall?: boolean }[];
    skills?: string[];
  };
  chatSettings?: {
    systemPromptMode?: 'default' | 'raw' | 'none';
    enableSkills?: boolean;
    enableTools?: boolean;
    [key: string]: unknown;
  };
  builtIn?: boolean;
  webSearch?: boolean;
  toolsConflict?: boolean;
  category?: string;
  deprecated?: boolean;
  modelSettings?: {
    enabled?: boolean;
    llmService?: string;
    model?: string;
    models?: {
      llmService?: string;
      model?: string;
    }[];
  };
};

export type SkillSettings = {
  toolsVersion?: number;
  skillsVersion?: number;
  tools?: string[];
  skills?: string[];
};

export type Conversation = {
  sessionId: string;
  title: string;
  updatedAt: string;
  aiEmployee: AIEmployee;
  read: boolean;
  options?: {
    modelSettings?: {
      llmService?: string;
      model?: string;
    };
    [key: string]: unknown;
  };
};

export type ContextItem = {
  type: string;
  uid: string;
  title?: string;
  content?: unknown;
};

type ActionParams = {
  item: ContextItem;
  message: Message;
  value?: string;
};

export type ActionOptions = {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  Component?: ComponentType<ActionParams>;
  onClick?: (params: ActionParams) => void;
  responseType: 'text' | string;
};

export type WorkContextOptions = {
  name?: string;
  menu?: {
    icon?: React.ReactNode;
    label?: React.ReactNode;
    Component?: ComponentType<{ onAdd?: (item: Omit<ContextItem, 'type'>) => void }>;
    onClick?: (props: {
      ctx: FlowEngineContext;
      contextItems?: ContextItem[];
      onAdd: (item: Omit<ContextItem, 'type'>) => void;
      onRemove: (uid: string) => void;
    }) => void;
  };
  tag?: {
    Component: ComponentType<{
      item: ContextItem;
    }>;
  };
  chatbox?: {
    Component: ComponentType<{
      item: ContextItem;
    }>;
  };
  actions?: ActionOptions[];
  children?: Record<string, Omit<WorkContextOptions, 'children'>>;
  getContent?: (app: Application, item: ContextItem) => Promise<unknown>;
};

export type ToolCall<T = unknown> = {
  id: string;
  type: string;
  name: string;
  status?: 'success' | 'error';
  invokeStatus: 'init' | 'interrupted' | 'waiting' | 'pending' | 'done' | 'confirmed';
  auto: boolean;
  args: T;
  willInterrupt?: boolean;
  messageId?: string;
  content?: unknown;
  invokeStartTime?: unknown;
  invokeEndTime?: unknown;
  [key: string]: unknown;
};

export type Attachment = {
  filename?: string;
  status?: string;
  response?: {
    data?: Attachment;
  };
  [key: string]: unknown;
};

export type MessageType = 'text' | 'greeting';

export type Message = Omit<BubbleProps, 'content'> & {
  key?: string | number;
  role?: string;
  createdAt?: string | Date;
  content: {
    content: unknown;
    ref?: React.MutableRefObject<unknown>;
    type?: MessageType;
    messageId?: string;
    attachments?: Attachment[];
    workContext?: ContextItem[];
    tool_calls?: ToolCall<unknown>[];
    metadata?: {
      model: string;
      provider: string;
      llmService?: string;
      usage_metadata?: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
      autoCallTools?: string[];
    };
    reference?: {
      title: string;
      url: string;
    }[];
    reasoning?: { status: string; content: string };
    subAgentConversations?: {
      sessionId: string;
      toolCallId?: string;
      status?: 'pending' | 'completed';
      messages: Message[];
    }[];
    from?: 'main-agent' | 'sub-agent';
  };
};

export type TaskMessage = {
  user?: string;
  system?: string;
  attachments?: (Attachment | Attachment[])[];
  workContext?: ContextItem[];
};

export type Task = {
  title?: string;
  message?: TaskMessage;
  autoSend?: boolean;
  skillSettings?: SkillSettings;
  webSearch?: boolean;
  model?: {
    llmService: string;
    model: string;
  } | null;
};

export type TriggerTaskOptions = {
  aiEmployee?: AIEmployee;
  tasks?: Task[];
  auto?: boolean;
};

export type SendOptions = {
  sessionId?: string;
  aiEmployee?: AIEmployee;
  systemMessage?: string;
  messages: {
    type: MessageType;
    content: string;
  }[];
  attachments?: Attachment[];
  workContext: ContextItem[];
  editingMessageId?: string;
  skillSettings?: SkillSettings;
  webSearch?: boolean;
  model?: {
    llmService: string;
    model: string;
  } | null;
};

export type ResendOptions = {
  sessionId: string;
  messageId?: string;
  aiEmployee: AIEmployee;
  important?: string;
};

export type ClearOptions = {
  sender?: boolean;
  systemMessage?: boolean;
  attachments?: boolean;
  contextItems?: boolean;
  taskVariables?: boolean;
  toolModal?: boolean;
  activeTool?: boolean;
  activeMessageId?: boolean;
  skillSettings?: boolean;
};

export type WebSearching = {
  type: string;
  query: string;
};

export type UserDecision = {
  type: 'approve' | 'edit' | 'reject';
  message?: string;
  editedAction?: {
    name: string;
    args: unknown;
  };
};

export interface ChatEditorRef {
  write(document: string): void;
  read(): string;
  run?(): Promise<unknown>;
  buttonGroupHeight?: number;
  snippetEntries: unknown[];
  logs: unknown[];
}
