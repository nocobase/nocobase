/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AI_EMPLOYEE_TRIGGER_TASK_EVENT, AIManager } from '../manager/ai-manager';
import type { RunJSAIEmployeeTriggerTaskOptions } from '../ai-employees/chatbox/utils';
import type { ContextItem, Task } from '../ai-employees/types';
import type { FrontendToolRegistration } from '../manager/frontend-tool-registry';
import type { LLMProviderOptions, ToolModalProps, ToolOptions } from '../manager/ai-manager';

const ProviderSettingsForm = () => <div />;
const ModelSettingsForm = () => <div />;
const ChatSettingsForm = () => <div />;

function createManager(getModel?: (uid: string, searchInPreviousEngines?: boolean) => unknown) {
  const eventBus = new EventTarget();
  const request = vi.fn();
  const app = {
    apiClient: {
      request,
    },
    eventBus,
    flowEngine: {
      getModel: getModel ?? vi.fn(),
    },
  };

  return {
    manager: new AIManager(app),
    eventBus,
    request,
  };
}

function listenTasks(eventBus: EventTarget) {
  const details: RunJSAIEmployeeTriggerTaskOptions[] = [];
  eventBus.addEventListener(AI_EMPLOYEE_TRIGGER_TASK_EVENT, (event) => {
    details.push((event as CustomEvent<RunJSAIEmployeeTriggerTaskOptions>).detail);
  });
  return details;
}

describe('AIManager v2', () => {
  it('registers LLM providers with provider/model/message components', () => {
    const manager = new AIManager();
    const provider: LLMProviderOptions = {
      components: {
        ProviderSettingsForm,
        ModelSettingsForm,
        MessageRenderer: ({ msg }) => <span>{String(msg)}</span>,
      },
      formatModelLabel: (id) => `Model ${id}`,
    };

    manager.registerLLMProvider('openai', provider);

    expect(manager.llmProviders.get('openai')).toBe(provider);
    expect(manager.llmProviders.get('openai')?.formatModelLabel?.('gpt-4.1')).toBe('Model gpt-4.1');
  });

  it('keeps chat settings entries in insertion order', () => {
    const manager = new AIManager();

    manager.chatSettings.set('messages', {
      title: 'Messages',
      Component: ChatSettingsForm,
    });
    manager.chatSettings.set('structured-output', {
      title: 'Structured output',
      Component: ChatSettingsForm,
    });

    expect(Array.from(manager.chatSettings.keys())).toEqual(['messages', 'structured-output']);
  });

  it('resolves root and child work context registrations', () => {
    const manager = new AIManager();
    const root = {
      name: 'datasource',
      children: {},
    };
    const child = {
      name: 'collection',
    };

    manager.registerWorkContext('datasource', root);
    manager.registerWorkContext('datasource.collection', child);

    expect(manager.getWorkContext('datasource')?.name).toBe('datasource');
    expect(manager.getWorkContext('datasource.collection')?.name).toBe('collection');
    expect(manager.getWorkContext('unknown.child')).toBeNull();
  });

  it('registers, executes, lists, and clears frontend tools by block uid', async () => {
    const manager = new AIManager();
    const execute = vi.fn().mockResolvedValue({ refreshed: true });
    const inputSchema = {
      type: 'object',
      properties: {
        force: { type: 'boolean' },
      },
    };

    const manifest = manager.frontendTools.register('block-1', {
      name: 'refresh_dashboard',
      description: 'Refresh the current dashboard.',
      permission: 'ALLOW',
      inputSchema,
      execute,
    });

    expect(manifest.id).toBe('block-1:refresh_dashboard');
    expect(manifest.permission).toBe('ALLOW');
    expect(manager.frontendTools.list('block-1')).toEqual([manifest]);
    expect(manager.frontendTools.getManifest(manifest.id)).toEqual(manifest);

    inputSchema.properties.force.type = 'string';
    manifest.inputSchema.properties = {};
    const loadedManifest = manager.frontendTools.getManifest(manifest.id);
    (loadedManifest.inputSchema as typeof inputSchema).properties.force.type = 'number';
    expect(manager.frontendTools.getManifest(manifest.id).inputSchema).toEqual({
      type: 'object',
      properties: {
        force: { type: 'boolean' },
      },
    });

    await expect(manager.frontendTools.execute(manifest.id, { force: true })).resolves.toEqual({ refreshed: true });
    expect(execute).toHaveBeenCalledWith({ force: true });

    manager.frontendTools.clear('block-1');
    expect(manager.frontendTools.list('block-1')).toEqual([]);
    expect(() => manager.frontendTools.getManifest(manifest.id)).toThrow('is unavailable');
    await expect(manager.frontendTools.execute(manifest.id, {})).rejects.toThrow('is unavailable');
  });

  it('defaults frontend tool permission to ASK and rejects invalid permissions', () => {
    const manager = new AIManager();
    const manifest = manager.frontendTools.register('block-1', {
      name: 'read_dashboard',
      description: 'Read the current dashboard.',
      execute: vi.fn(),
    });

    expect(manifest.permission).toBe('ASK');
    const invalidRegistration = {
      name: 'invalid_permission',
      description: 'Use an invalid permission.',
      permission: 'DENY',
      execute: vi.fn(),
    } as unknown as FrontendToolRegistration;
    expect(() => manager.frontendTools.register('block-1', invalidRegistration)).toThrow(
      'Frontend tool permission must be ASK or ALLOW',
    );
  });

  it('exports v2 tool-related public types', () => {
    const tool: ToolOptions = {};
    const modalProps: ToolModalProps = { width: 720 };

    expect({ tool, modalProps }).toBeDefined();
  });

  it('queues AI employee tasks until ChatBox is mounted', () => {
    const { manager, eventBus } = createManager();
    const details = listenTasks(eventBus);

    manager.triggerTask({ aiEmployee: 'nathan', tasks: [{ title: 'Draft' }] });

    expect(details).toEqual([]);

    manager.onChatBoxMounted();

    expect(details).toEqual([{ aiEmployee: 'nathan', tasks: [{ title: 'Draft' }] }]);
  });

  it('dispatches AI employee tasks immediately after ChatBox is mounted', () => {
    const { manager, eventBus } = createManager();
    const details = listenTasks(eventBus);

    manager.onChatBoxMounted();
    manager.triggerTask({ aiEmployee: 'nathan', tasks: [{ title: 'Now' }] });

    expect(details).toEqual([{ aiEmployee: 'nathan', tasks: [{ title: 'Now' }] }]);
  });

  it('uploads files through the application API client', async () => {
    const source = { dataSourceKey: 'main', collectionName: 'aiFiles' };
    const { manager, request } = createManager();
    request.mockResolvedValue({
      data: {
        data: {
          id: 1,
          filename: 'report.txt',
          meta: { source },
        },
      },
    });

    await expect(manager.uploadFile(new File(['report'], 'report.txt'))).resolves.toMatchObject({
      id: 1,
      filename: 'report.txt',
      source,
      status: 'done',
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'aiFiles:create',
        method: 'post',
      }),
    );
  });

  it('drops the oldest queued task when the pending AI employee task queue exceeds 20 tasks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { manager, eventBus } = createManager();
    const details = listenTasks(eventBus);

    for (let index = 0; index < 21; index += 1) {
      manager.triggerTask({ aiEmployee: 'nathan', tasks: [{ title: `Task ${index}` }] });
    }
    manager.onChatBoxMounted();

    expect(details).toHaveLength(20);
    expect(details[0].tasks?.[0].title).toBe('Task 1');
    expect(details[19].tasks?.[0].title).toBe('Task 20');
    expect(warn).toHaveBeenCalledWith(
      '[plugin-ai] AI employee task queue exceeded 20 items. The oldest task was dropped.',
    );

    warn.mockRestore();
  });

  it('triggers a model task by reading model AI employee and 0-based task index', () => {
    const task: Task = { title: 'Summarize', chatBoxUid: 'chat-box-1' };
    const getModel = vi.fn(() => ({
      props: {
        aiEmployee: { username: 'nathan' },
        tasks: [{ title: 'Skip' }, task],
      },
    }));
    const { manager, eventBus } = createManager(getModel);
    const details = listenTasks(eventBus);

    manager.onChatBoxMounted();
    manager.triggerModelTask('flow-model-uid', 1, { open: true });

    expect(getModel).toHaveBeenCalledWith('flow-model-uid', true);
    expect(details).toEqual([{ aiEmployee: 'nathan', tasks: [task], chatBoxUid: 'chat-box-1', open: true }]);
  });

  it('appends runtime attachments to the configured model task without mutating it', () => {
    const configuredAttachment = { id: 1, filename: 'configured.txt' };
    const runtimeAttachment = { id: 2, filename: 'runtime.txt' };
    const task: Task = {
      title: 'Summarize',
      message: {
        user: 'Summarize the attachments',
        attachments: [configuredAttachment],
      },
    };
    const getModel = vi.fn(() => ({
      props: {
        aiEmployee: { username: 'nathan' },
        tasks: [task],
      },
    }));
    const { manager, eventBus } = createManager(getModel);
    const details = listenTasks(eventBus);

    manager.onChatBoxMounted();
    manager.triggerModelTask('flow-model-uid', 0, { attachments: [runtimeAttachment] });

    expect(details[0].tasks?.[0].message?.attachments).toEqual([configuredAttachment, runtimeAttachment]);
    expect(task.message?.attachments).toEqual([configuredAttachment]);
  });

  it('warns when model props have no task at the requested index', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const getModel = vi.fn(() => ({
      props: {
        aiEmployee: { username: 'viz' },
      },
    }));
    const { manager, eventBus } = createManager(getModel);
    const details = listenTasks(eventBus);

    manager.onChatBoxMounted();
    manager.triggerModelTask('ai-employee-action-uid', 0, { open: true });

    expect(details).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      '[plugin-ai] Cannot trigger AI employee task because model "ai-employee-action-uid" has no task at index 0.',
    );

    warn.mockRestore();
  });

  it('does not merge model context workContext into the triggered model task message', () => {
    const taskWorkContext: ContextItem = { type: 'flow-model', uid: 'task-context' };
    const modelWorkContext: ContextItem = { type: 'flow-model', uid: 'model-context' };
    const getModel = vi.fn(() => ({
      props: {
        aiEmployee: { username: 'nathan' },
        tasks: [
          {
            title: 'Explain',
            message: {
              user: 'Explain this chart',
              workContext: [taskWorkContext],
            },
          },
        ],
        context: {
          workContext: [modelWorkContext],
        },
      },
    }));
    const { manager, eventBus } = createManager(getModel);
    const details = listenTasks(eventBus);

    manager.onChatBoxMounted();
    manager.triggerModelTask('flow-model-uid', 0);

    expect(details[0].tasks?.[0].message?.workContext).toEqual([taskWorkContext]);
  });
});
