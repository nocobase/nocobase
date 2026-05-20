/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FlowModel } from '@nocobase/flow-engine';
import { AIEmployeeShortcut } from '../AIEmployeeShortcut';
import type { AIEmployee, Task } from '../types';
import { useChatBoxActions } from '../../../client/ai-employees/chatbox/hooks/useChatBoxActions';
import { useChatMessageActions } from '../../../client/ai-employees/chatbox/hooks/useChatMessageActions';
import { useChat } from '../../../client/ai-employees/chatbox/hooks/useChat';
import { useChatConversationsStore } from '../../../client/ai-employees/chatbox/stores/chat-conversations';
import type {
  AIEmployee as ChatAIEmployee,
  ContextItem as ChatContextItem,
  Task as ChatTask,
} from '../../../client/ai-employees/types';

type AIEmployeeTask = Omit<ChatTask, 'message'> & {
  message?: ChatTask['message'];
};

type AIEmployeeButtonModelProps = {
  aiEmployee?: Pick<AIEmployee, 'username'>;
  auto?: boolean;
  context?: {
    workContext?: ChatContextItem[];
  };
  showNotice?: boolean;
  style?: {
    size?: number;
    mask?: boolean;
  };
  tasks?: AIEmployeeTask[];
};

const AIEmployeeButton: React.FC<AIEmployeeButtonModelProps> = (props) => {
  const { aiEmployee, auto, context, showNotice, style, tasks } = props || {};
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const { triggerTask } = useChatBoxActions();
  const { syncContextAttachments } = useChatMessageActions();

  if (!aiEmployee?.username) {
    return null;
  }

  const handleTrigger = (resolvedAIEmployee: AIEmployee, task?: Task) => {
    const resolvedTasks = task ? [task as AIEmployeeTask] : tasks;
    triggerTask({
      aiEmployee: resolvedAIEmployee as ChatAIEmployee,
      tasks: resolvedTasks as ChatTask[],
      auto,
    });
    if (context?.workContext?.length) {
      chat.addContextItems(context.workContext);
      syncContextAttachments(context.workContext);
    }
  };

  return (
    <AIEmployeeShortcut
      aiEmployee={aiEmployee as AIEmployee}
      tasks={tasks}
      showNotice={showNotice}
      size={style?.size}
      mask={style?.mask}
      onClick={(resolvedAIEmployee) => handleTrigger(resolvedAIEmployee)}
      onTaskClick={(task, resolvedAIEmployee) => handleTrigger(resolvedAIEmployee, task)}
    />
  );
};

export class AIEmployeeButtonModel extends FlowModel {
  public declare props: AIEmployeeButtonModelProps;

  constructor(options: any) {
    super(options);
    this.props = {
      ...this.props,
      style: {
        size: 40,
        mask: false,
        ...this.props?.style,
      },
    };
  }

  render() {
    return <AIEmployeeButton {...this.props} />;
  }
}
