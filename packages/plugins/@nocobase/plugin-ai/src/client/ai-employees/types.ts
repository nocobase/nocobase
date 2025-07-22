/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BubbleProps } from '@ant-design/x';
import { Application } from '@nocobase/client';
import { ComponentType } from 'react';

export type Selector = {
  onSelect?: (ctx: any) => void;
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
};

export type Conversation = {
  sessionId: string;
  title: string;
  updatedAt: string;
  aiEmployee: AIEmployee;
};

export type ContextItem = {
  type: string;
  uid: string;
  title: string;
  content?: string;
};

export type ToolCall<T> = {
  id: string;
  type: string;
  name: string;
  status?: 'success' | 'error';
  invokeStatus: 'init' | 'pending' | 'done' | 'confirmed';
  auto: boolean;
  args: T;
};

export type MessageType = 'text' | 'greeting';
export type Message = Omit<BubbleProps, 'content'> & {
  key?: string | number;
  role?: string;
  content: {
    content: any;
    ref?: React.MutableRefObject<any>;
    type?: MessageType;
    messageId?: string;
    attachments?: Attachment[];
    workContext?: ContextItem[];
    tool_calls?: ToolCall<unknown>[];
    metadata?: {
      model: string;
      provider: string;
      usage_metadata?: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
      autoCallTools?: string[];
    };
  };
};
export type Action = {
  icon?: React.ReactNode;
  content: string;
  onClick: (content: string) => void;
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
};

export type ResendOptions = {
  sessionId: string;
  messageId?: string;
  aiEmployee: AIEmployee;
};

export type Task = {
  title?: string;
  taskDesc?: string;
  message: {
    user?: string;
    system?: string;
    attachments?: Attachment[];
  };
  autoSend?: boolean;
};

export type TriggerTaskOptions = {
  aiEmployee?: AIEmployee;
  tasks?: Task[];
};

export type Tool = {
  group: {
    groupName: string;
    title?: string;
    description?: string;
  };
  tools: {
    name: string;
    title: string;
    description: string;
  }[];
};

export type Attachment = any;

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
  // 'text' or other programing language
  responseType: 'text' | string;
};

export type WorkContextOptions = {
  name?: string;
  menu?: {
    icon?: React.ReactNode;
    label?: React.ReactNode;
    Component?: ComponentType<{
      onAdd: (item: Omit<ContextItem, 'type'>) => void;
    }>;
  };
  tag?: {
    Component: ComponentType<{
      item: ContextItem;
    }>;
  };
  actions?: ActionOptions[];
  children?: Record<string, Omit<WorkContextOptions, 'children'>>;
  getContent?: (app: Application, item: ContextItem) => string;
};
