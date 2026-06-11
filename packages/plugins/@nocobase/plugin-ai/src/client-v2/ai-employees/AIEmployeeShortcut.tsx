/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Avatar, Popover } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { avatars } from './avatars';
import { AIEmployeeProfileCard } from './ProfileCard';
import type { AIEmployee, Task } from './types';

export const AIEmployeeShortcut: React.FC<{
  aiEmployee: AIEmployee;
  tasks?: Task[];
  size?: number;
  mask?: boolean;
  showNotice?: boolean;
  onClick?: () => void;
  onTaskClick?: (task: Task) => void;
  taskLoadingTitle?: string;
  loadingTaskTitle?: string;
}> = ({ aiEmployee, tasks, size = 52, mask, showNotice, onClick, onTaskClick, taskLoadingTitle, loadingTaskTitle }) => {
  const ctx = useFlowContext();
  const [focus, setFocus] = useState(false);
  const { data: aiEmployees = [], loading } = useRequest(async (): Promise<AIEmployee[]> => {
    const response = await ctx.app.apiClient.resource('aiEmployees').listByUser();
    return response?.data?.data || [];
  });
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

  if (loading || !resolvedAIEmployee) {
    return null;
  }

  return (
    <Popover
      content={
        <AIEmployeeProfileCard
          aiEmployee={resolvedAIEmployee}
          tasks={tasks}
          onTaskClick={onTaskClick}
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
        onClick={onClick}
      >
        <Avatar src={currentAvatar} size={size} shape="circle" />
      </span>
    </Popover>
  );
};
