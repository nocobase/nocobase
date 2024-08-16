/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface Contact {
  id: string;
  userid: string;
  name: string;
  avatar: string;
  lastMessage: string | Record<string, any>;
  lastMessageTime: string;
  lastviewTime: string;
}

export interface Message {
  id: string;
  userid: string;
  message: string | Record<string, any>;
  time: string;
  type: string;
}

type MessageKeys = keyof Message;

const a: MessageKeys = 'type';
