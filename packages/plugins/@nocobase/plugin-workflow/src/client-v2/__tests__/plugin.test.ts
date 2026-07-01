/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PluginWorkflowClientV2, type WorkflowListNoticeMap } from '../plugin';

const holder = vi.hoisted(() => ({
  addMenuItem: vi.fn(),
  addPageTabItem: vi.fn(),
  registerModelLoaders: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  Plugin: class {
    app: unknown;
    flowEngine = {
      registerModelLoaders: holder.registerModelLoaders,
    };
    pluginSettingsManager = {
      addMenuItem: holder.addMenuItem,
      addPageTabItem: holder.addPageTabItem,
    };

    constructor(_options?: unknown, app?: unknown) {
      this.app =
        app ??
        ({
          i18n: {
            t: (key: string) => key,
          },
        } as unknown);
    }
  },
}));

vi.mock('../models/triggerWorkflows', () => ({}));
vi.mock('../nodes/calculation', () => ({ default: class CalculationInstruction {} }));
vi.mock('../nodes/condition', () => ({ default: class ConditionInstruction {} }));
vi.mock('../nodes/multi-conditions', () => ({ default: class MultiConditionsInstruction {} }));
vi.mock('../nodes/end', () => ({ default: class EndInstruction {} }));
vi.mock('../nodes/output', () => ({ default: class OutputInstruction {} }));
vi.mock('../nodes/query', () => ({ default: class QueryInstruction {} }));
vi.mock('../nodes/create', () => ({ default: class CreateInstruction {} }));
vi.mock('../nodes/update', () => ({ default: class UpdateInstruction {} }));
vi.mock('../nodes/destroy', () => ({ default: class DestroyInstruction {} }));
vi.mock('../triggers/collection', () => ({ default: class CollectionTrigger {} }));
vi.mock('../triggers/schedule', () => ({ default: class ScheduleTrigger {} }));

function createPlugin() {
  return new PluginWorkflowClientV2({}, {
    i18n: {
      t: (key: string) => key,
    },
  } as never);
}

function createDeferred<T>() {
  let resolvePromise: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return { promise, resolve: resolvePromise };
}

describe('PluginWorkflowClientV2 workflow notice providers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps function workflow notice providers compatible', () => {
    const plugin = createPlugin();

    plugin.registerWorkflowNoticeProvider('legacy-function', ({ surface }) =>
      surface === 'workflow-list-row'
        ? {
            key: 'legacy-function',
            message: 'Legacy function notice',
            type: 'warning',
          }
        : undefined,
    );

    expect(plugin.getWorkflowNotices({ surface: 'workflow-list-row', workflow: { id: 1 } })).toEqual([
      {
        key: 'legacy-function',
        message: 'Legacy function notice',
        type: 'warning',
      },
    ]);
  });

  it('supports object providers for synchronous and current-page workflow list notices', async () => {
    const plugin = createPlugin();
    const shouldLoadWorkflowListNotices = vi.fn(({ workflows }) =>
      workflows.some((workflow: Record<string, unknown>) => workflow.type === 'approval'),
    );
    const loadWorkflowListNotices = vi.fn().mockResolvedValue({
      1: [{ key: 'approval-list', message: 'Approval list notice', type: 'warning' }],
    });

    plugin.registerWorkflowNoticeProvider('object-provider', {
      getNotices: ({ surface }) =>
        surface === 'trigger-node-card'
          ? { key: 'trigger-card', message: 'Trigger card notice', type: 'info' }
          : undefined,
      loadWorkflowListNotices,
      shouldLoadWorkflowListNotices,
    });

    expect(plugin.getWorkflowNotices({ surface: 'trigger-node-card', workflow: { id: 1 } })).toEqual([
      { key: 'trigger-card', message: 'Trigger card notice', type: 'info' },
    ]);

    await expect(
      plugin.loadWorkflowListNotices({
        api: {},
        surface: 'workflow-list-row',
        workflows: [{ id: 1, type: 'approval' }],
      }),
    ).resolves.toEqual({
      1: [{ key: 'approval-list', message: 'Approval list notice', type: 'warning' }],
    });
    expect(shouldLoadWorkflowListNotices).toHaveBeenCalledWith(
      expect.objectContaining({
        workflows: [expect.objectContaining({ id: 1, type: 'approval' })],
      }),
    );
    expect(loadWorkflowListNotices).toHaveBeenCalledTimes(1);
  });

  it('skips object provider workflow list loading when the provider predicate returns false', async () => {
    const plugin = createPlugin();
    const loadWorkflowListNotices = vi.fn().mockResolvedValue({
      1: [{ key: 'approval-list', message: 'Approval list notice', type: 'warning' }],
    });

    plugin.registerWorkflowNoticeProvider('object-provider', {
      loadWorkflowListNotices,
      shouldLoadWorkflowListNotices: ({ workflows }) =>
        workflows.some((workflow: Record<string, unknown>) => workflow.type === 'approval'),
    });

    await expect(
      plugin.loadWorkflowListNotices({
        api: {},
        surface: 'workflow-list-row',
        workflows: [{ id: 1, type: 'collection' }],
      }),
    ).resolves.toEqual({});
    expect(loadWorkflowListNotices).not.toHaveBeenCalled();
  });

  it('isolates workflow list notice predicate failures to the provider', async () => {
    const plugin = createPlugin();
    const brokenProviderLoader = vi.fn().mockResolvedValue({
      1: [{ key: 'broken', message: 'Broken provider notice', type: 'warning' }],
    });
    const healthyProviderLoader = vi.fn().mockResolvedValue({
      1: [{ key: 'healthy', message: 'Healthy provider notice', type: 'info' }],
    });

    plugin.registerWorkflowNoticeProvider('broken-provider', {
      loadWorkflowListNotices: brokenProviderLoader,
      shouldLoadWorkflowListNotices: () => {
        throw new Error('predicate failed');
      },
    });
    plugin.registerWorkflowNoticeProvider('healthy-provider', {
      loadWorkflowListNotices: healthyProviderLoader,
    });

    await expect(
      plugin.loadWorkflowListNotices({
        api: {},
        surface: 'workflow-list-row',
        workflows: [{ id: 1, type: 'approval' }],
      }),
    ).resolves.toEqual({
      1: [{ key: 'healthy', message: 'Healthy provider notice', type: 'info' }],
    });
    expect(brokenProviderLoader).not.toHaveBeenCalled();
    expect(healthyProviderLoader).toHaveBeenCalledTimes(1);
  });

  it('merges workflow list notices returned by multiple object providers', async () => {
    const plugin = createPlugin();

    plugin.registerWorkflowNoticeProvider('first-provider', {
      loadWorkflowListNotices: vi.fn().mockResolvedValue({
        1: [{ key: 'first', message: 'First notice', type: 'warning' }],
      }),
    });
    plugin.registerWorkflowNoticeProvider('second-provider', {
      loadWorkflowListNotices: vi.fn().mockResolvedValue({
        1: [{ key: 'second', message: 'Second notice', type: 'info' }],
        2: { key: 'third', message: 'Third notice', type: 'success' },
      }),
    });

    await expect(
      plugin.loadWorkflowListNotices({
        api: {},
        surface: 'workflow-list-row',
        workflows: [
          { id: 1, type: 'approval' },
          { id: 2, type: 'collection' },
        ],
      }),
    ).resolves.toEqual({
      1: [
        { key: 'first', message: 'First notice', type: 'warning' },
        { key: 'second', message: 'Second notice', type: 'info' },
      ],
      2: [{ key: 'third', message: 'Third notice', type: 'success' }],
    });
  });

  it('keeps workflow list notice order stable when providers resolve out of order', async () => {
    const plugin = createPlugin();
    const firstProviderResult = createDeferred<WorkflowListNoticeMap>();

    plugin.registerWorkflowNoticeProvider('first-provider', {
      loadWorkflowListNotices: vi.fn(() => firstProviderResult.promise),
    });
    plugin.registerWorkflowNoticeProvider('second-provider', {
      loadWorkflowListNotices: vi.fn().mockResolvedValue({
        1: [{ key: 'second', message: 'Second notice', type: 'info' }],
      }),
    });

    const loading = plugin.loadWorkflowListNotices({
      api: {},
      surface: 'workflow-list-row',
      workflows: [{ id: 1, type: 'approval' }],
    });

    await Promise.resolve();
    firstProviderResult.resolve({
      1: [{ key: 'first', message: 'First notice', type: 'warning' }],
    });

    await expect(loading).resolves.toEqual({
      1: [
        { key: 'first', message: 'First notice', type: 'warning' },
        { key: 'second', message: 'Second notice', type: 'info' },
      ],
    });
  });
});
