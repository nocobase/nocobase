/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Avatar, Popover } from 'antd';
import {
  EMBED_REPLACING_DATA_KEY,
  GLOBAL_EMBED_CONTAINER_ID,
  type FlowModelContext,
  useFlowContext,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { avatars } from './avatars';
import { AIEmployeeProfileCard } from './ProfileCard';
import { ChatBox } from './chatbox/components/ChatBox';
import { useChat } from './chatbox/hooks/useChat';
import { useChatBoxActions } from './chatbox/hooks/useChatBoxActions';
import { useChatMessageActions } from './chatbox/hooks/useChatMessageActions';
import { useChatConversationsStore } from './chatbox/stores/chat-conversations';
import type { AIEmployee, ContextItem, Task } from './types';

type ShortcutAIEmployee = Pick<AIEmployee, 'username'> & Partial<AIEmployee>;

type ShortcutContext = {
  workContext?: ContextItem[];
};

export const AIEmployeeShortcut: React.FC<{
  aiEmployee: ShortcutAIEmployee;
  tasks?: Task[];
  size?: number;
  mask?: boolean;
  showNotice?: boolean;
  context?: ShortcutContext;
  auto?: boolean;
  onClick?: () => void;
  onTaskClick?: (task: Task) => void;
  taskLoadingTitle?: string;
  loadingTaskTitle?: string;
}> = ({
  aiEmployee,
  tasks,
  size = 52,
  mask,
  showNotice,
  context,
  auto,
  onClick,
  onTaskClick,
  taskLoadingTitle,
  loadingTaskTitle,
}) => {
  const ctx = useFlowContext<FlowModelContext>();
  const [focus, setFocus] = useState(false);
  const { data: aiEmployees = [], loading } = useRequest(async (): Promise<AIEmployee[]> => {
    const response = await ctx.app.apiClient.resource('aiEmployees').listByUser();
    return response?.data?.data || [];
  });
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const { triggerTask } = useChatBoxActions();
  const { syncContextAttachments } = useChatMessageActions();
  const resolvedAIEmployee = useMemo(() => {
    return aiEmployees.find((item) => item.username === aiEmployee?.username);
  }, [aiEmployee, aiEmployees]);

  const currentAvatar = useMemo(() => {
    const avatar = resolvedAIEmployee?.avatar;
    if (!avatar) {
      return undefined;
    }
    if (focus || showNotice) {
      return avatars(avatar, {
        mask: undefined,
        flip: true,
      });
    }
    return avatars(avatar, {
      mouth: undefined,
      mask: mask !== false ? ['dark'] : undefined,
    });
  }, [resolvedAIEmployee?.avatar, focus, mask, showNotice]);

  const getShortcutContext = useCallback(() => {
    const workContext = context?.workContext ?? [];
    if (!workContext.length) {
      return workContext;
    }
    const nextWorkContext = workContext.filter((item) => {
      if (item.type !== 'flow-model') {
        return true;
      }
      return Boolean(ctx.engine.getModel(item.uid));
    });
    if (nextWorkContext.every((item) => item.type !== 'flow-model')) {
      const parent = ctx.model.parent;
      if (parent) {
        nextWorkContext.push({
          type: 'flow-model',
          uid: parent.uid,
        });
      }
    }
    return nextWorkContext;
  }, [context?.workContext, ctx.engine, ctx.model.parent]);

  const syncShortcutContext = useCallback(() => {
    const shortcutContext = getShortcutContext();
    if (!shortcutContext.length) {
      return;
    }
    chat.addContextItems(shortcutContext);
    syncContextAttachments(shortcutContext);
  }, [chat, getShortcutContext, syncContextAttachments]);

  const openEmbeddedChatBox = useCallback(
    async (taskOptions?: Task[]) => {
      if (!resolvedAIEmployee) {
        return;
      }
      const target = document.querySelector<HTMLDivElement>(`#${GLOBAL_EMBED_CONTAINER_ID}`);
      const resolvedTasks = taskOptions ?? tasks;
      if (!target) {
        await triggerTask({ aiEmployee: resolvedAIEmployee, tasks: resolvedTasks, auto });
        syncShortcutContext();
        return;
      }
      await triggerTask({ aiEmployee: resolvedAIEmployee, tasks: resolvedTasks, auto, open: false });
      syncShortcutContext();
      ctx.viewer.embed({
        type: 'embed',
        target,
        title: resolvedAIEmployee.nickname,
        styles: {
          body: {
            padding: 0,
            overflow: 'hidden',
          },
        },
        onOpen() {
          target.style.width = '33.3%';
          target.style.maxWidth = '800px';
          target.style.minWidth = '0px';
        },
        onClose() {
          if (target.dataset[EMBED_REPLACING_DATA_KEY] !== '1') {
            target.style.width = 'auto';
            target.style.maxWidth = 'none';
            target.style.minWidth = 'auto';
          }
        },
        content: (view) => (
          <ChatBox
            onClose={() => {
              Promise.resolve(view.close()).catch(console.error);
            }}
          />
        ),
      });
    },
    [auto, ctx.viewer, resolvedAIEmployee, syncShortcutContext, tasks, triggerTask],
  );

  const handleTaskClick = useCallback(
    (task: Task) => {
      if (onTaskClick) {
        onTaskClick(task);
        return;
      }
      if (!resolvedAIEmployee) {
        return;
      }
      openEmbeddedChatBox([task]).catch(console.error);
    },
    [onTaskClick, openEmbeddedChatBox, resolvedAIEmployee],
  );

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    openEmbeddedChatBox().catch(console.error);
  }, [onClick, openEmbeddedChatBox]);

  if (loading || !resolvedAIEmployee) {
    return null;
  }

  return (
    <Popover
      content={
        <AIEmployeeProfileCard
          aiEmployee={resolvedAIEmployee}
          tasks={tasks}
          onTaskClick={handleTaskClick}
          taskLoadingTitle={taskLoadingTitle}
          loadingTaskTitle={loadingTaskTitle}
        />
      }
      placement="bottomRight"
    >
      <span
        style={{ cursor: 'pointer', display: 'inline-block' }}
        onMouseEnter={() => setFocus(true)}
        onMouseLeave={() => setFocus(false)}
        onClick={handleClick}
      >
        <Avatar src={currentAvatar} size={size} shape="circle" />
      </span>
    </Popover>
  );
};
