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
  avatar?: string;
  bio?: string;
  greeting?: string;
  chatSettings?: {
    senderPlaceholder?: string;
    infoForm?: {
      name: string;
      title: string;
      type: string;
    }[];
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

export type MessageType = 'text' | 'greeting' | 'info' | AttachmentType;
export type Message = Omit<BubbleProps, 'content'> & {
  key?: string | number;
  role?: string;
  content: {
    type: MessageType;
    content: any;
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
  messages: {
    type: MessageType;
    content: string;
  }[];
  infoFormValues?: any;
};

export type ResendOptions = {
  sessionId: string;
  messageId?: string;
  aiEmployee: AIEmployee;
};

export type ShortcutOptions = {
  aiEmployee: AIEmployee;
  message: { type: MessageType; content: string };
  infoFormValues: any;
  autoSend: boolean;
};
