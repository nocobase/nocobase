/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useChatMessages } from './ChatMessagesProvider';
import { usePlugin } from '@nocobase/client';
import { Button } from 'antd';
import { Schema } from '@formily/react';
import PluginAIClient from '../..';
import { useT } from '../../locale';
import { ActionOptions, ContextItem, Message } from '../types';
import { useChatBoxContext } from './ChatBoxContext';

export const Actions: React.FC<{
  message: Message & { messageId: string };
  responseType: string;
  value?: string;
}> = ({ responseType, message, value }) => {
  const t = useT();
  const plugin = usePlugin('ai') as PluginAIClient;
  const { messages, responseLoading } = useChatMessages();
  const currentEmployee = useChatBoxContext('currentEmployee');
  const reversedMessages = [...messages].reverse();
  const lastMessage = reversedMessages.find((msg) => msg.role === currentEmployee.username);
  const actions: (ActionOptions & { context: ContextItem })[] = useMemo(() => {
    const message = reversedMessages.find((msg) => msg.content.workContext?.length > 0);
    if (!message) {
      return [];
    }
    const workContext = message.content.workContext;
    const result = [];
    for (const context of workContext) {
      const options = plugin.aiManager.getWorkContext(context.type);
      if (!options) {
        continue;
      }
      const actions = options.actions;
      if (!actions?.length) {
        continue;
      }
      for (const action of actions) {
        if (action.responseType && action.responseType !== responseType) {
          continue;
        }
        result.push({
          ...action,
          context,
        });
      }
    }
    return result;
  }, [reversedMessages, responseType]);
  if (responseLoading || !actions.length || message.messageId !== lastMessage.key) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '8px',
      }}
    >
      {actions.map((action, index) => {
        const C = action.Component;
        return C ? (
          <C item={action.context} message={message} value={value} />
        ) : (
          <Button
            size="small"
            key={index}
            icon={action.icon}
            onClick={() => action.onClick?.({ item: action.context, message, value })}
          >
            {Schema.compile(action.title, { t })}
          </Button>
        );
      })}
    </div>
  );
};
