/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { ToolsOptions, ToolModalProps } from '@nocobase/client-v2';
import type { ComponentType } from 'react';
import type { RunJSAIEmployeeTriggerTaskOptions } from '../ai-employees/chatbox/utils';
import type { Task } from '../ai-employees/types';
import type { WorkContextOptions } from '../ai-employees/types';
import type { AIEmployeeShortcutModel } from '../models/ai-employees/AIEmployeeShortcutModel';
import { FrontendToolRegistry } from './frontend-tool-registry';

export const AI_EMPLOYEE_TRIGGER_TASK_EVENT = 'ai:employee:trigger-task';

export type TriggerModelTaskOptions = Omit<RunJSAIEmployeeTriggerTaskOptions, 'aiEmployee' | 'tasks' | 'chatBoxUid'>;

type AIManagerApp = {
  eventBus: {
    dispatchEvent: (event: Event) => boolean;
  };
  flowEngine: {
    getModel: (uid: string, searchInPreviousEngines?: boolean) => unknown;
  };
};

export type LLMProviderOptions = {
  components: {
    ProviderSettingsForm?: ComponentType;
    ModelSettingsForm?: ComponentType;
    MessageRenderer?: ComponentType<{
      msg: unknown;
    }>;
  };
  formatModelLabel?: (id: string) => string;
};

export type ToolOptions = ToolsOptions;
export type { ToolModalProps };

export class AIManager {
  constructor(private readonly app?: AIManagerApp) {}

  llmProviders = new Registry<LLMProviderOptions>();
  frontendTools = new FrontendToolRegistry();

  chatSettings = new Map<
    string,
    {
      title: string;
      Component: ComponentType;
    }
  >();

  workContext = new Registry<WorkContextOptions>();

  private chatBoxMounted = false;
  private pendingAIEmployeeTasks: RunJSAIEmployeeTriggerTaskOptions[] = [];
  private readonly maxPendingAIEmployeeTasks = 20;

  registerLLMProvider(name: string, options: LLMProviderOptions) {
    this.llmProviders.register(name, options);
  }

  registerWorkContext(name: string, options: WorkContextOptions) {
    const [rootKey, childKey] = name.split('.');
    if (childKey) {
      const root = this.workContext.get(rootKey);
      if (!root?.children) {
        return;
      }
      root.children[childKey] = {
        name: childKey,
        ...options,
      };
      return;
    }
    this.workContext.register(name, {
      name,
      ...options,
    });
  }

  getWorkContext(name: string): WorkContextOptions | null {
    const [rootKey, childKey] = name.split('.');
    if (childKey) {
      const root = this.workContext.get(rootKey);
      if (!root?.children) {
        return null;
      }
      return root.children[childKey];
    }
    return this.workContext.get(name);
  }

  triggerTask(options: RunJSAIEmployeeTriggerTaskOptions): void {
    if (!this.chatBoxMounted) {
      this.pendingAIEmployeeTasks.push(options);
      if (this.pendingAIEmployeeTasks.length > this.maxPendingAIEmployeeTasks) {
        this.pendingAIEmployeeTasks.shift();
        console.warn('[plugin-ai] AI employee task queue exceeded 20 items. The oldest task was dropped.');
      }
      return;
    }
    this.dispatchAIEmployeeTask(options);
  }

  triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void {
    const model = this.app?.flowEngine.getModel(uid, true) as AIEmployeeShortcutModel | undefined;
    if (!model) {
      console.warn(`[plugin-ai] Cannot trigger AI employee task because model "${uid}" was not found.`);
      return;
    }

    const props = model.props;
    const username = props.aiEmployee?.username;
    if (typeof username !== 'string' || !username) {
      console.warn(`[plugin-ai] Cannot trigger AI employee task because model "${uid}" has no AI employee username.`);
      return;
    }

    const task = props.tasks?.[taskIndex];
    if (!isTask(task)) {
      console.warn(
        `[plugin-ai] Cannot trigger AI employee task because model "${uid}" has no task at index ${taskIndex}.`,
      );
      return;
    }

    this.triggerTask({
      ...options,
      aiEmployee: username,
      tasks: [task],
      ...(task.chatBoxUid ? { chatBoxUid: task.chatBoxUid } : {}),
    });
  }

  onChatBoxMounted(): void {
    this.chatBoxMounted = true;
    const pendingTasks = this.pendingAIEmployeeTasks;
    this.pendingAIEmployeeTasks = [];
    pendingTasks.forEach((task) => {
      this.dispatchAIEmployeeTask(task);
    });
  }

  onChatBoxUnmounted(): void {
    this.chatBoxMounted = false;
  }

  private dispatchAIEmployeeTask(options: RunJSAIEmployeeTriggerTaskOptions): void {
    this.app?.eventBus.dispatchEvent(new CustomEvent(AI_EMPLOYEE_TRIGGER_TASK_EVENT, { detail: options }));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTask(value: unknown): value is Task {
  return isRecord(value);
}
