/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type Message = {
  role: 'user' | 'system' | 'assistant';
  message?: string;
  content?: {
    type: 'text';
    content?: string;
  }[];
};
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

async function parseMessage(message: Message) {
  switch (message.role) {
    case 'system':
      return new SystemMessage(message.message);
    case 'assistant':
      return new AIMessage(message.message);
    case 'user': {
      if (message.content.length === 1) {
        const msg = message.content[0];
        return new HumanMessage(msg.content);
      }
      const content = [];
      for (const c of message.content) {
        if (c.type === 'text') {
          content.push({
            type: 'text',
            text: c.content,
          });
        }
      }
      return new HumanMessage({
        content,
      });
    }
  }
}

export async function parseMessages() {
  const msgs = [];
  for (const message of this.messages) {
    const msg = await parseMessage(message);
    msgs.push(msg);
  }
  this.messages = msgs;
}
