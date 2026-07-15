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
import { observer, type FlowModelContext, useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { avatars } from './avatars';
import { AIEmployeeProfileCard } from './ProfileCard';
import { useChat } from './chatbox/hooks/useChat';
import { useChatBoxActions } from './chatbox/hooks/useChatBoxActions';
import { useChatMessageActions } from './chatbox/hooks/useChatMessageActions';
import { type ChatBoxRuntime, useResolvedChatBoxRuntime } from './chatbox/stores/runtime';
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
  runtime?: ChatBoxRuntime;
}> = observer(
  ({
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
    runtime,
  }) => {
    const resolvedRuntime = useResolvedChatBoxRuntime(runtime);
    const ctx = useFlowContext<FlowModelContext>();
    const [focus, setFocus] = useState(false);
    const { data: aiEmployees = [], loading } = useRequest(async (): Promise<AIEmployee[]> => {
      const response = await ctx.app.apiClient.resource('aiEmployees').listByUser();
      return response?.data?.data || [];
    });
    const currentConversation = resolvedRuntime.chatConversationModel.currentConversation;
    const chat = useChat(currentConversation, resolvedRuntime);
    const { clear, triggerTask } = useChatBoxActions(resolvedRuntime);
    const { syncContextAttachments } = useChatMessageActions(resolvedRuntime);
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

    const openGlobalChatBox = useCallback(
      async (taskOptions?: Task[]) => {
        if (!resolvedAIEmployee) {
          return;
        }
        const resolvedTasks = taskOptions ?? tasks;
        const shouldClearShortcutContext = resolvedTasks?.length === 1 && auto !== false && resolvedTasks[0]?.autoSend;
        await triggerTask({ aiEmployee: resolvedAIEmployee, tasks: resolvedTasks, auto });
        syncShortcutContext();
        if (shouldClearShortcutContext) {
          clear(undefined, undefined);
        }
      },
      [auto, clear, resolvedAIEmployee, syncShortcutContext, tasks, triggerTask],
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
        syncShortcutContext();
        triggerTask({ aiEmployee: resolvedAIEmployee, tasks: [task] }).catch(console.error);
      },
      [onTaskClick, resolvedAIEmployee, syncShortcutContext, triggerTask],
    );

    const handleClick = useCallback(() => {
      if (onClick) {
        onClick();
        return;
      }
      openGlobalChatBox().catch(console.error);
    }, [onClick, openGlobalChatBox]);

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
  },
);
