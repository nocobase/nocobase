/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  navigate: vi.fn(),
  dispatchEvent: vi.fn(),
  eventBus: new EventTarget(),
  resources: {
    userWorkflowTasks: {
      listMine: vi.fn(),
    },
  },
  location: { pathname: '/admin/page', search: '', hash: '' },
  stepParams: {} as Record<string, Record<string, unknown>>,
  taskTypes: {
    getKeys: () => [],
    get: (_key: string) => undefined,
  },
  observable: Object.assign(
    vi.fn((value: unknown) => value),
    {
      ref: 'ref',
    },
  ),
}));

vi.mock('@nocobase/client-v2', () => ({
  openViewFlow: {
    key: 'popupSettings',
  },
  ActionModel: class {
    static define = vi.fn();
    static registerFlow = vi.fn();

    context = {
      api: {
        resource: (name: string) =>
          (holder.resources as Record<string, { listMine?: ReturnType<typeof vi.fn> } | undefined>)[name] || {},
      },
      app: {
        eventBus: holder.eventBus,
        pm: {
          get: (name: string) => (name === 'workflow' ? { taskTypes: holder.taskTypes } : undefined),
        },
      },
      isMobileLayout: false,
      location: holder.location,
      router: {
        navigate: holder.navigate,
      },
      t: (key: string) => key,
    };

    dispatchEvent = holder.dispatchEvent;

    onInit() {}

    async afterAddAsSubModel() {}

    onMount() {}

    onUnmount() {}

    getStepParams(flowKey: string, stepKey: string) {
      return holder.stepParams[flowKey]?.[stepKey];
    }

    setStepParams(flowKey: string, stepKey: string, params: unknown) {
      holder.stepParams[flowKey] = {
        ...holder.stepParams[flowKey],
        [stepKey]: params,
      };
    }
  },
}));

vi.mock('@nocobase/flow-engine', () => ({
  define: vi.fn(),
  observable: holder.observable,
  tExpr: (key: string) => key,
}));

import { WorkflowTasksEntryActionModel } from '../WorkflowTasksEntryActionModel';

describe('WorkflowTasksEntryActionModel', () => {
  beforeEach(() => {
    holder.navigate.mockClear();
    holder.dispatchEvent.mockClear();
    holder.dispatchEvent.mockResolvedValue(undefined);
    holder.resources.userWorkflowTasks.listMine.mockReset();
    holder.resources.userWorkflowTasks.listMine.mockResolvedValue({ data: [] });
    holder.location = { pathname: '/admin/page', search: '', hash: '' };
    holder.stepParams = {};
    holder.taskTypes = {
      getKeys: () => [],
      get: (_key: string) => undefined,
    };
  });

  it('navigates to the desktop workflow tasks page outside mobile layout', () => {
    const model = new WorkflowTasksEntryActionModel();

    model.onClick({ type: 'click' });

    expect(holder.navigate).toHaveBeenCalledWith('/admin/workflow/tasks');
    expect(holder.dispatchEvent).not.toHaveBeenCalled();
  });

  it('directly navigates to the full embedded route in mobile layout when counts are ready', async () => {
    const taskType = {
      key: 'demo',
      title: 'Demo',
      collection: 'demoTasks',
      Item: () => null,
      Detail: () => null,
    };
    holder.taskTypes = {
      getKeys: () => ['demo'],
      get: (key: string) => (key === 'demo' ? taskType : undefined),
    };
    holder.resources.userWorkflowTasks.listMine.mockResolvedValue({
      data: [{ type: 'demo', stats: { pending: 2, all: 2 } }],
    });
    const model = new WorkflowTasksEntryActionModel();
    model.context.isMobileLayout = true;
    model.uid = 'workflow-entry';

    (model as unknown as { onMount: () => void }).onMount();
    await vi.waitFor(() => expect(model.actionPanelBadge).toEqual({ count: 2, overflowCount: 99 }));
    await model.onClick({ type: 'click' });

    expect(holder.navigate).toHaveBeenCalledWith('/admin/page/view/workflow-entry/tasktype/demo/status/pending');
    expect(holder.dispatchEvent).not.toHaveBeenCalled();
  });

  it('reloads counts before direct mobile navigation when counts are not ready', async () => {
    const taskType = {
      key: 'demo',
      title: 'Demo',
      collection: 'demoTasks',
      Item: () => null,
      Detail: () => null,
    };
    holder.taskTypes = {
      getKeys: () => ['demo'],
      get: (key: string) => (key === 'demo' ? taskType : undefined),
    };
    holder.resources.userWorkflowTasks.listMine.mockResolvedValue({
      data: [{ type: 'demo', stats: { pending: 2, all: 2 } }],
    });
    const model = new WorkflowTasksEntryActionModel();
    model.context.isMobileLayout = true;
    model.uid = 'workflow-entry';

    await model.onClick({ type: 'click' });

    expect(holder.resources.userWorkflowTasks.listMine).toHaveBeenCalledWith({ filter: { type: ['demo'] } });
    expect(holder.navigate).toHaveBeenCalledWith('/admin/page/view/workflow-entry/tasktype/demo/status/pending');
    expect(holder.dispatchEvent).not.toHaveBeenCalled();
  });

  it('preserves current search and hash during direct mobile navigation', async () => {
    const taskType = {
      key: 'demo',
      title: 'Demo',
      collection: 'demoTasks',
      Item: () => null,
      Detail: () => null,
      alwaysShow: true,
    };
    holder.location = { pathname: '/admin/page', search: '?foo=1', hash: '#section' };
    holder.taskTypes = {
      getKeys: () => ['demo'],
      get: (key: string) => (key === 'demo' ? taskType : undefined),
    };
    const model = new WorkflowTasksEntryActionModel();
    model.context.isMobileLayout = true;
    model.context.location = holder.location;
    model.uid = 'workflow-entry';

    await model.onClick({ type: 'click' });

    expect(holder.navigate).toHaveBeenCalledWith(
      '/admin/page/view/workflow-entry/tasktype/demo/status/pending?foo=1#section',
    );
    expect(holder.dispatchEvent).not.toHaveBeenCalled();
  });

  it('keeps the normal openView click flow in mobile layout when no task types exist', async () => {
    const model = new WorkflowTasksEntryActionModel();
    model.context.isMobileLayout = true;

    await model.onClick({ type: 'click' });

    expect(holder.navigate).not.toHaveBeenCalled();
    expect(holder.dispatchEvent).toHaveBeenCalledWith(
      'click',
      expect.objectContaining({
        isMobileLayout: true,
        pageModelClass: 'WorkflowTasksEmbeddedPageModel',
        showFlowSettings: false,
      }),
      expect.objectContaining({
        debounce: true,
      }),
    );
  });

  it('syncs embedded open view step params without flow settings toolbar', async () => {
    const model = new WorkflowTasksEntryActionModel();
    holder.stepParams = {
      popupSettings: {
        openView: {
          mode: 'drawer',
        },
      },
    };

    await model.afterAddAsSubModel();

    expect(holder.stepParams.popupSettings.openView).toEqual({
      mode: 'embed',
      pageModelClass: 'WorkflowTasksEmbeddedPageModel',
      showFlowSettings: false,
    });
  });

  it('updates the action panel badge from initial counts and websocket events', async () => {
    const taskType = {
      key: 'demo',
      title: 'Demo',
      collection: 'demoTasks',
      Item: () => null,
      Detail: () => null,
    };
    holder.taskTypes = {
      getKeys: () => ['demo'],
      get: (key: string) => (key === 'demo' ? taskType : undefined),
    };
    holder.resources.userWorkflowTasks.listMine.mockResolvedValue({
      data: [{ type: 'demo', stats: { pending: 2, all: 2 } }],
    });
    const model = new WorkflowTasksEntryActionModel();

    (model as unknown as { onMount: () => void }).onMount();

    await vi.waitFor(() => expect(model.actionPanelBadge).toEqual({ count: 2, overflowCount: 99 }));

    holder.eventBus.dispatchEvent(
      new CustomEvent('ws:message:workflow:tasks:updated', {
        detail: { type: 'demo', stats: { pending: 5, all: 5 } },
      }),
    );
    expect(model.actionPanelBadge).toEqual({ count: 5, overflowCount: 99 });

    holder.eventBus.dispatchEvent(
      new CustomEvent('ws:message:workflow:tasks:updated', {
        detail: { type: 'demo', stats: { pending: 0, all: 0 } },
      }),
    );
    expect(model.actionPanelBadge).toBeNull();

    (model as unknown as { onUnmount: () => void }).onUnmount();
  });
});
