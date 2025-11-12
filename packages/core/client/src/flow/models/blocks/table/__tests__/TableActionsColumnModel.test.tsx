/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@nocobase/test/client';
import { App, ConfigProvider } from 'antd';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { ActionModel } from '../../../base/ActionModel';
import { TableActionsColumnModel } from '../TableActionsColumnModel';

class TestViewActionModel extends ActionModel {
  defaultProps: any = { type: 'link', title: 'View' };
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
