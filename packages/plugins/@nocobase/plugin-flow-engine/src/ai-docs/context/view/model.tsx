/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client';
import {
  FlowModel,
  FlowModelRenderer,
  useFlowContext,
  useFlowEngine,
  useFlowView,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { Button, Input, Space } from 'antd';
import React, { useMemo } from 'react';

function DialogContent() {
  // 这里的 ctx 是 FlowModelContext
  const ctx = useFlowContext();
  const [value, setValue] = React.useState('');
  const { Header, Footer } = ctx.view;
  return (
    <div>
      <Header title={`Dialog Header - #${ctx.model.uid}`} />
      <div>This is a view opened from the flow context.</div>
      <div>{value}</div>
      <Input
        defaultValue={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <Footer>
        <Button onClick={() => ctx.view.close()}>Close</Button>
      </Footer>
    </div>
  );
}

class TestModel extends FlowModel {
  render() {
    return <DialogContent />;
  }
}

function TestModelRenderer() {
  // 这里的 ctx 是 FlowViewContext
  const ctx = useFlowContext();
  const model = useMemo(() => {
    return ctx.engine.createModel({ use: TestModel }, { delegate: ctx });
  }, [ctx]);
  return <FlowModelRenderer model={model} />;
}

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space>
        <Button
          onClick={() => {
            this.context.viewer.dialog({
              inheritContext: false,
              closeOnEsc: true,
              content: () => <TestModelRenderer />,
            });
          }}
        >
          Open dialog
        </Button>
      </Space>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel, TestModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
