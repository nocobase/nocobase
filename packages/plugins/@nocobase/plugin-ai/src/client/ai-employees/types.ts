/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BubbleProps } from '@ant-design/x';

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

export type AttachmentType = 'image' | 'uiSchema';
export type AttachmentProps = {
  type: AttachmentType;
  title: string;
  content: string;
  description?: string;
};

export type MessageType = 'text' | 'greeting';
export type Message = Omit<BubbleProps, 'content'> & {
  key?: string | number;
  role?: string;
  content: {
    type?: MessageType;
    content: any;
    attachments?: Attachment[];
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
  tasks: Task[];
};

export type Tool = {
  name: string;
  title: string;
  description: string;
  schema?: any;
  children?: Tool[];
};

export type Attachment = any;
