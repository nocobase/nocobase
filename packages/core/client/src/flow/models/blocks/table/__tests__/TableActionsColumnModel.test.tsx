/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, waitFor } from '@nocobase/test/client';
import { App, ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';
import { ActionModel } from '../../../base/ActionModel';
import { TableActionsColumnModel } from '../TableActionsColumnModel';

const capturedDroppableUids: string[] = [];
const capturedRendererProps: any[] = [];
let latestOnDragEnd: ((event: any) => void) | undefined;
const capturedDndProviders: Array<{ persist: boolean }> = [];

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<any>('@nocobase/flow-engine');
  return {
    ...actual,
    DndProvider: ({ children, onDragEnd, persist = true, ...restProps }) => {
      const engine = actual.useFlowEngine();
      const handleDragEnd = (event: any) => {
        if (onDragEnd) {
          onDragEnd(event);
        } else if (event?.over) {
          engine.moveModel(event.active?.id, event.over?.id, { persist });
        }
      };
      latestOnDragEnd = handleDragEnd;
      capturedDndProviders.push({ persist });
      return (
        <div data-test-dnd-provider {...restProps}>
          {children}
        </div>
      );
    },
    Droppable: ({ model, children }) => {
      capturedDroppableUids.push(model.uid);
      return <div data-test-droppable={model.uid}>{children}</div>;
    },
    FlowModelRenderer: (props) => {
      capturedRendererProps.push(props);
      const ActualFlowModelRenderer = actual.FlowModelRenderer;
      return <ActualFlowModelRenderer {...props} />;
    },
  };
});

class TestViewActionModel extends ActionModel {
  defaultProps: any = { type: 'link', title: 'View' };
}

class TestAlwaysActionModel extends ActionModel {
  defaultProps: any = { type: 'link', title: 'Always' };
}

// 在 beforeRender 中，根据 inputArgs（即当前行 record）决定是否隐藏按钮
TestViewActionModel.registerFlow({
  key: 'autoHideByPhone',
  steps: {
    apply: {
      handler(ctx) {
        const rec: any = ctx.inputArgs;
        // 电话为 123456 时隐藏
        ctx.model.setHidden(rec?.phone === '123456');
      },
    },
  },
});

describe('TableActionsColumnModel: pass record via inputArgs to FlowModelRenderer', () => {
  it('cell render: action button hides when record.phone updates to 123456', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableActionsColumnModel, TestViewActionModel });

    // 创建仅包含行内 actions 的列模型
    const actionsCol = engine.createModel<TableActionsColumnModel>({
      use: 'TableActionsColumnModel',
      props: { width: 200, title: 'Actions' },
      subModels: { actions: [{ use: 'TestViewActionModel' }] },
    });

    // 获取列渲染器（TableActionsColumnModel 内部会在单元格内通过 FlowModelRenderer 传递 inputArgs=record）
    const colProps = actionsCol.getColumnProps();

    const record1 = { id: 1, phone: '666666' };
    const record2 = { id: 1, phone: '123456' };

    const { rerender } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>{colProps.render?.(undefined, record1, 0) as any}</App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(
      () => {
        expect(screen.getByText('View')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // 以相同行索引（0）重渲染，内部 fork 复用了同一个 key，并会在 beforeRender 前失效缓存
    rerender(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>{colProps.render?.(undefined, record2, 0) as any}</App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(
      () => {
        expect(screen.queryByText('View')).toBeNull();
      },
      { timeout: 5000 },
    );
  });
});

describe('TableActionsColumnModel: hidden action layout', () => {
  it('does not leave empty slot when first action is hidden by linkage', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableActionsColumnModel, TestViewActionModel, TestAlwaysActionModel });

    const actionsCol = engine.createModel<TableActionsColumnModel>({
      use: 'TableActionsColumnModel',
      props: { width: 200, title: 'Actions' },
      subModels: { actions: [{ use: 'TestViewActionModel' }, { use: 'TestAlwaysActionModel' }] },
    });

    const colProps = actionsCol.getColumnProps();
    const record = { id: 1, phone: '123456' } as any;

    const { container } = render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>{colProps.render?.(undefined, record, 0) as any}</App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('View')).toBeNull();
      expect(screen.getByText('Always')).toBeInTheDocument();
    });

    const [, secondUid] = actionsCol.mapSubModels('actions', (action) => action.uid);
    const wrappers = container.querySelectorAll('[data-test-droppable]');
    expect(wrappers).toHaveLength(0);
    expect(secondUid).toBeTruthy();
  });
});

describe('TableActionsColumnModel: drag integration', () => {
  beforeEach(() => {
    capturedDroppableUids.length = 0;
    capturedRendererProps.length = 0;
    capturedDndProviders.length = 0;
    latestOnDragEnd = undefined;
  });

  it('wraps header and each action with Droppable inside DndProvider', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableActionsColumnModel, TestViewActionModel });

    const actionsCol = engine.createModel<TableActionsColumnModel>({
      use: 'TableActionsColumnModel',
      props: { width: 200, title: 'Actions' },
      subModels: { actions: [{ use: 'TestViewActionModel' }, { use: 'TestViewActionModel' }] },
    });

    const colProps = actionsCol.getColumnProps();
    const record = { id: 1, phone: '000000' } as any;

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <>
              {colProps.title as React.ReactNode}
              {colProps.render?.(undefined, record, 0) as any}
            </>
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('View').length).toBe(2);
    });

    expect(capturedDroppableUids).toEqual([actionsCol.uid]);
    expect(capturedDndProviders.length).toBe(1);
    expect(capturedDndProviders[0].persist).toBe(true);
  });

  it('injects drag toolbar item and binds record context on action forks', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableActionsColumnModel, TestViewActionModel });

    const actionsCol = engine.createModel<TableActionsColumnModel>({
      use: 'TableActionsColumnModel',
      props: { width: 200, title: 'Actions' },
      subModels: { actions: [{ use: 'TestViewActionModel' }] },
    });

    const colProps = actionsCol.getColumnProps();
    const record = { id: 1, phone: '000000', name: 'John' } as any;

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>{colProps.render?.(undefined, record, 0) as any}</App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    const rendererProps = capturedRendererProps.at(-1);
    expect(rendererProps).toBeDefined();
    if (!rendererProps) {
      throw new Error('FlowModelRenderer props missing for drag integration test');
    }
    expect(rendererProps.extraToolbarItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'drag-handler', sort: 1 })]),
    );

    const forkModel = rendererProps.model as ActionModel;
    expect((forkModel.context as any).record).toBe(record);
    expect((forkModel.context as any).recordIndex).toBe(0);
  });

  it('uses default moveModel behaviour when drag ends and no custom handler supplied', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableActionsColumnModel, TestViewActionModel });

    const actionsCol = engine.createModel<TableActionsColumnModel>({
      use: 'TableActionsColumnModel',
      props: { width: 200, title: 'Actions' },
      subModels: { actions: [{ use: 'TestViewActionModel' }, { use: 'TestViewActionModel' }] },
    });

    const colProps = actionsCol.getColumnProps();
    const record = { id: 1, phone: '000000' } as any;

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>{colProps.render?.(undefined, record, 0) as any}</App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('View').length).toBeGreaterThan(0);
    });

    const moveModelSpy = vi.spyOn(engine, 'moveModel');
    const [firstUid, secondUid] = actionsCol.mapSubModels('actions', (action) => action.uid);

    expect(latestOnDragEnd).toBeTypeOf('function');
    if (!latestOnDragEnd) {
      throw new Error('DndProvider did not expose onDragEnd handler');
    }

    latestOnDragEnd({ active: { id: firstUid }, over: { id: secondUid } });

    expect(moveModelSpy).toHaveBeenCalledWith(firstUid, secondUid, { persist: true });
  });
});
