/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { TASK_TYPE_CC } from '../../common/constants';
import { NAMESPACE } from '../locale';

const holder = vi.hoisted(() => {
  class PluginWorkflowClientV2 {}
  class CCInstruction {}

  return {
    CCInstruction,
    PluginWorkflowClientV2,
    registerInstruction: vi.fn(),
    registerModelLoaders: vi.fn(),
    registerTaskType: vi.fn(),
    registerWorkflowCcCollections: vi.fn(),
    registerWorkflowCcModelLoaders: vi.fn(),
  };
});

vi.mock('@nocobase/client-v2', () => ({
  Plugin: class Plugin {
    app: unknown;
    flowEngine: unknown;

    constructor(_options: unknown, app: { flowEngine?: unknown }) {
      this.app = app;
      this.flowEngine = app.flowEngine;
    }
  },
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  PluginWorkflowClientV2: holder.PluginWorkflowClientV2,
  TASK_STATUS: {
    ALL: 'all',
    COMPLETED: 'completed',
    PENDING: 'pending',
  },
  useWorkflowTaskRecord: vi.fn(),
}));

vi.mock('../models/registerModelLoaders', () => ({
  registerWorkflowCcModelLoaders: holder.registerWorkflowCcModelLoaders,
}));

vi.mock('../nodes/cc', () => ({
  default: holder.CCInstruction,
}));

vi.mock('../utils/registerWorkflowCcCollections', () => ({
  registerWorkflowCcCollections: holder.registerWorkflowCcCollections,
}));

import { PluginWorkflowClientV2 } from '@nocobase/plugin-workflow/client-v2';
import { PluginWorkflowCCClientV2 } from '../plugin';

function createPlugin() {
  const workflow = {
    registerInstruction: holder.registerInstruction,
    registerTaskType: holder.registerTaskType,
  };
  const app = {
    flowEngine: {},
    pm: {
      get: vi.fn((key: unknown) => {
        if (key === PluginWorkflowClientV2 || key === 'workflow') {
          return workflow;
        }
        return undefined;
      }),
    },
  };

  return {
    app,
    plugin: new PluginWorkflowCCClientV2({ packageName: 'workflow-cc' } as never, app as never),
    workflow,
  };
}

describe('PluginWorkflowCCClientV2 task type registration', () => {
  it('registers the CC task type with the v1-compatible task center contract', async () => {
    const { plugin, workflow } = createPlugin();

    await plugin.load();

    expect(holder.registerWorkflowCcCollections).toHaveBeenCalledWith({});
    expect(holder.registerWorkflowCcModelLoaders).toHaveBeenCalledWith({});
    expect(workflow.registerInstruction).toHaveBeenCalledWith('cc', holder.CCInstruction);
    expect(workflow.registerTaskType).toHaveBeenCalledWith(
      TASK_TYPE_CC,
      expect.objectContaining({
        action: 'listMine',
        collection: 'workflowCcTasks',
        key: TASK_TYPE_CC,
        title: `{{t("CC to me", { ns: "${NAMESPACE}" })}}`,
        Actions: expect.any(Function),
        Detail: expect.any(Function),
        Item: expect.any(Function),
        getPopupRecord: expect.any(Function),
        useActionParams: expect.any(Function),
      }),
    );

    const taskType = holder.registerTaskType.mock.calls[0][1];
    expect(taskType.useActionParams('pending')).toMatchObject({
      filter: {
        status: 0,
      },
      appends: expect.arrayContaining(['node.config', 'workflow.nodes', 'execution.status']),
      except: ['workflow.options', 'execution.context', 'execution.output'],
    });
    expect(taskType.useActionParams('completed')).toMatchObject({
      filter: {
        status: 1,
      },
    });

    const get = vi.fn();
    const apiClient = {
      resource: vi.fn(() => ({ get })),
    };
    taskType.getPopupRecord(apiClient, { params: { filterByTk: 'cc-task-1' } });

    expect(apiClient.resource).toHaveBeenCalledWith('workflowCcTasks');
    expect(get).toHaveBeenCalledWith({
      filterByTk: 'cc-task-1',
      appends: ['node', 'job', 'workflow', 'workflow.nodes', 'execution', 'execution.jobs'],
    });
  });
});
