/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { usePlugin } from '@nocobase/client';
import { Button } from 'antd';
import { Schema } from '@formily/react';
import PluginAIClient from '../..';
import { useT } from '../../locale';
import { ActionOptions, ContextItem, Message } from '../types';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatBoxStore } from './stores/chat-box';

export const Actions: React.FC<{
  message: Message & { messageId: string };
  responseType: string;
  value?: string;
}> = ({ responseType, message, value }) => {
  const t = useT();
  const plugin = usePlugin('ai') as PluginAIClient;

  const responseLoading = useChatMessagesStore.use.responseLoading();

  const currentEmployee = useChatBoxStore.use.currentEmployee();

  const lastEmployeeMessageKey = useChatMessagesStore((state) => {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const msg = state.messages[i];
      if (msg.role === currentEmployee?.username) {
        return msg.key;
      }
    }
  });
  const workContext = useChatMessagesStore((state) => {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const workContext = state.messages[i].content.workContext;
      if (workContext?.length) {
        return workContext;
      }
    }
    return null;
  });
  const actions: (ActionOptions & { context: ContextItem })[] = useMemo(() => {
    if (!workContext?.length) {
      return [];
    }
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
  }, [plugin.aiManager, responseType, workContext]);
  if (responseLoading || !actions.length || message.messageId !== lastEmployeeMessageKey) {
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
