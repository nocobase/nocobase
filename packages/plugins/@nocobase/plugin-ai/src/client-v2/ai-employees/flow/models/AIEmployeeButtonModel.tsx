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
import { AIEmployeeShortcut } from '../../AIEmployeeShortcut';
import { useChatBoxActions } from '../../chatbox/hooks/useChatBoxActions';
import type { AIEmployee, ContextItem, Task } from '../../types';

type PersistedTask = Task & {
  prompt?: string;
};

type AIEmployeeButtonModelProps = {
  aiEmployee?: Partial<AIEmployee> & Pick<AIEmployee, 'username'>;
  auto?: boolean;
  context?: {
    workContext?: ContextItem[];
  };
  showNotice?: boolean;
  style?: {
    size?: number;
    mask?: boolean;
  };
  tasks?: PersistedTask[];
};

const normalizeTasks = (tasks: PersistedTask[] | undefined, workContext: ContextItem[] | undefined): Task[] => {
  if (!tasks?.length) {
    return [];
  }

  return tasks.map(({ prompt, ...task }) => {
    const message = task.message || {};
    const nextMessage = {
      ...message,
      ...(message.user || !prompt ? {} : { user: prompt }),
      ...(message.workContext?.length || !workContext?.length ? {} : { workContext }),
    };

    return {
      ...task,
      message: Object.keys(nextMessage).length ? nextMessage : undefined,
    };
  });
};

const AIEmployeeButton: React.FC<{ model: AIEmployeeButtonModel }> = ({ model }) => {
  const { triggerTask } = useChatBoxActions();
  const { aiEmployee, auto, context, showNotice, style, tasks: propTasks } = model.props || {};
  const stepTasks = model.getStepParams('shortcutSettings', 'editTasks')?.tasks as PersistedTask[] | undefined;
  const workContext = context?.workContext;
  const tasks = normalizeTasks(stepTasks || propTasks, workContext);

  if (!aiEmployee?.username) {
    return null;
  }

  const triggerAiEmployee = aiEmployee as AIEmployee;

  return (
    <AIEmployeeShortcut
      aiEmployee={triggerAiEmployee}
      tasks={tasks}
      size={style?.size || 40}
      mask={style?.mask}
      showNotice={showNotice}
      onClick={() => triggerTask({ aiEmployee: triggerAiEmployee, tasks, auto })}
      onTaskClick={(task) => triggerTask({ aiEmployee: triggerAiEmployee, tasks: [task] })}
    />
  );
};

export class AIEmployeeButtonModel extends FlowModel {
  declare props: AIEmployeeButtonModelProps;

  render() {
    return <AIEmployeeButton model={this} />;
  }
}

export default AIEmployeeButtonModel;
