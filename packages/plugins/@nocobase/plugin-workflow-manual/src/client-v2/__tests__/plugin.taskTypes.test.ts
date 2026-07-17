/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TASK_STATUS, TASK_TYPE_MANUAL } from '../../common/constants';

const holder = vi.hoisted(() => {
  class PluginWorkflowClientV2 {}

  return {
    PluginWorkflowClientV2,
    registerInstruction: vi.fn(),
    registerTaskType: vi.fn(),
  };
});

vi.mock('@nocobase/client-v2', () => ({
  Plugin: class Plugin {
    app: unknown;

    constructor(_options: unknown, app: unknown) {
      this.app = app;
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
  getWorkflowTaskRecordKey: (record: Record<string, unknown>) => record.id ?? record.uid ?? record.key,
  useWorkflowTaskRecord: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: vi.fn(),
  useFlowEngine: () => ({
    context: {
      t: (key: string) => key,
    },
  }),
}));

import { PluginWorkflowClientV2 } from '@nocobase/plugin-workflow/client-v2';
import PluginWorkflowManualClientV2 from '../plugin';

function createPlugin() {
  const workflow = {
    registerInstruction: holder.registerInstruction,
    registerTaskType: holder.registerTaskType,
  };
  const app = {
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
    plugin: new PluginWorkflowManualClientV2({ packageName: 'workflow-manual' } as never, app as never),
    workflow,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/v/admin/workflow/tasks/manual/pending');
});

describe('PluginWorkflowManualClientV2 task type registration', () => {
  it('registers only the manual task type in the v2 workflow task center', async () => {
    const { plugin, workflow } = createPlugin();

    await plugin.load();

    expect(workflow.registerTaskType).toHaveBeenCalledTimes(1);
    expect(workflow.registerTaskType).toHaveBeenCalledWith(
      TASK_TYPE_MANUAL,
      expect.objectContaining({
        action: 'listMine',
        collection: 'workflowManualTasks',
        key: TASK_TYPE_MANUAL,
        title: '{{t("My manual tasks", { ns: "@nocobase/plugin-workflow-manual" })}}',
        Actions: expect.any(Function),
        Detail: expect.any(Function),
        Item: expect.any(Function),
        useActionParams: expect.any(Function),
      }),
    );
    expect(workflow.registerInstruction).not.toHaveBeenCalled();
  });

  it('keeps the v1 status filters and list projection', async () => {
    const { plugin } = createPlugin();

    await plugin.load();

    const taskType = holder.registerTaskType.mock.calls[0][1];

    expect(taskType.useActionParams('pending')).toEqual({
      filter: {
        status: TASK_STATUS.PENDING,
        'execution.status': 0,
      },
      appends: [
        'node.id',
        'node.title',
        'job.id',
        'job.status',
        'job.result',
        'workflow.id',
        'workflow.title',
        'workflow.enabled',
        'execution.id',
        'execution.status',
      ],
      except: ['node.config', 'workflow.config', 'workflow.options'],
    });
    expect(taskType.useActionParams('completed')).toEqual({
      filter: {
        status: [TASK_STATUS.RESOLVED, TASK_STATUS.ABORTED, TASK_STATUS.REJECTED],
      },
      appends: expect.any(Array),
      except: ['node.config', 'workflow.config', 'workflow.options'],
    });
    expect(taskType).not.toHaveProperty('alwaysShow');
  });
});
