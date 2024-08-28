/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface Chat {
  id: string;
  userId: string;
  title: string;
  lastMsgId: string;
  unreadMsgCnt: number;
  avatar: string;
  lastMessage: string | Record<string, any>;
  lastMessageTime: string;
  lastviewTime: string;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  receiveTime: string;
  status: 'read' | 'unread';
}

export interface InAppMessageFormValues {
  content: string;
  senderName: string;
  senderId: string;
}

export const InAppMessagesDefinition = {
  name: 'inappMessages',
  fieldNameMap: {
    id: 'id',
    chatId: 'chatId',
    senderId: 'senderId',
    content: 'content',
    status: 'status',
  },
};

export const ChatsDefinition = {
  name: 'inappChats',
  fieldNameMap: {
    id: 'id',
    title: 'title',
    lastMsgId: 'lastMsgId',
  },
};

export const inAppTypeName = 'InApp';
