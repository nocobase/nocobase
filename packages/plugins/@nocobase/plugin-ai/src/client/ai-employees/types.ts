/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BubbleProps } from '@ant-design/x';

export type AIEmployee = {
  username: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  greeting?: string;
};

export type Conversation = {
  sessionId: string;
  title: string;
  updatedAt: string;
};

export type AttachmentType = 'image' | 'uiSchema';
export type AttachmentProps = {
  type: AttachmentType;
  title: string;
  content: string;
  description?: string;
};

export type MessageType = 'text' | AttachmentType;
export type Message = BubbleProps & { key?: string | number; role?: string };
export type Action = {
  icon?: React.ReactNode;
  content: string;
  onClick: (content: string) => void;
};

export type SendOptions = {
  sessionId?: string;
  greeting?: boolean;
  aiEmployee?: AIEmployee;
  messages: {
    type: MessageType;
    content: string;
  }[];
};
