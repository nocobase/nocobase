/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { AIEmployee, Task } from './types';
import { useChatBoxActions } from './chatbox/hooks/useChatBoxActions';
import { AIEmployeeProfileCard } from '../../client-v2';

export const ProfileCard: React.FC<{
  aiEmployee: AIEmployee;
  tasks?: Task[];
  onTaskTriggered?: () => void;
}> = ({ aiEmployee, tasks, onTaskTriggered }) => {
  tasks = tasks?.filter((task) => task.title) || [];

  const { triggerTask } = useChatBoxActions();

  if (!aiEmployee) {
    return null;
  }

  return (
    <AIEmployeeProfileCard
      aiEmployee={aiEmployee}
      tasks={tasks}
      onTaskClick={(task) => {
        onTaskTriggered?.();
        triggerTask({
          aiEmployee,
          tasks: [task as Task],
        });
      }}
    />
  );
};
