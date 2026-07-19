/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Button, Space, theme } from 'antd';
import { useApp } from '@nocobase/client-v2';
import type { AIManager } from '../../../manager/ai-manager';
import { useT } from '../../../locale';
import type { ActionOptions, ContextItem, Message } from '../../types';
import { useChat } from '../hooks/useChat';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';

type AIPluginLike = {
  aiManager?: AIManager;
};

export const Actions: React.FC<{
  message: Message['content'];
  responseType: string;
  value?: string;
}> = ({ responseType, message, value }) => {
  const app = useApp();
  const t = useT();
  const { token } = theme.useToken();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const responseLoading = chat.use.responseLoading();
  const messages = chat.use.messages();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const plugin = app.pm.get('ai') as AIPluginLike | undefined;

  const lastEmployeeMessageKey = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const item = messages[index];
      if (item.role === currentEmployee?.username) {
        return item.content?.messageId || item.key;
      }
    }
    return undefined;
  }, [currentEmployee?.username, messages]);

  const workContext = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const items = messages[index].content?.workContext;
      if (items?.length) {
        return items;
      }
    }
    return null;
  }, [messages]);

  const actions = useMemo(() => {
    if (!workContext?.length || !plugin?.aiManager) {
      return [];
    }
    const result: (ActionOptions & { context: ContextItem })[] = [];
    for (const context of workContext) {
      const options = plugin.aiManager.getWorkContext(context.type);
      if (!options?.actions?.length) {
        continue;
      }
      for (const action of options.actions) {
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
  }, [plugin?.aiManager, responseType, workContext]);

  if (responseLoading || !actions.length || message.messageId !== lastEmployeeMessageKey) {
    return null;
  }

  return (
    <Space wrap style={{ marginTop: token.marginXS }}>
      {actions.map((action, index) => {
        const Component = action.Component;
        const key = `${action.context.type}:${action.context.uid}:${index}`;
        if (Component) {
          return <Component key={key} item={action.context} message={{ content: message }} value={value} />;
        }
        return (
          <Button
            key={key}
            size="small"
            icon={action.icon}
            onClick={() => action.onClick?.({ item: action.context, message: { content: message }, value })}
          >
            {typeof action.title === 'string' ? t(action.title) : action.title}
          </Button>
        );
      })}
    </Space>
  );
};

Actions.displayName = 'Actions';
