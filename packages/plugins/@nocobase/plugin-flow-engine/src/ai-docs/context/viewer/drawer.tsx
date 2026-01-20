/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  buttonRef1 = React.createRef<HTMLButtonElement>();
  buttonRef2 = React.createRef<HTMLButtonElement>();
  render() {
    return (
      <Space>
        <Button
          onClick={() => {
            this.context.viewer.open({
              type: 'drawer',
              // width: 800,
              content: 'This is a view opened from the flow context.',
              closeOnEsc: true,
            });
          }}
        >
          Open Drawer
        </Button>
        <Button
          onClick={() => {
            this.context.viewer.drawer({
              // width: 800,
              content: 'This is a view opened from the flow context.',
              closeOnEsc: true,
            });
          }}
        >
          Open Drawer
        </Button>
      </Space>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel });
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
