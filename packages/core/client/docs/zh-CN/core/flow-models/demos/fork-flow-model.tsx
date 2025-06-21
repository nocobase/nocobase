import { Input } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Space, Button } from 'antd';
import React from 'react';

/**
 * 演示 ForkFlowModel：
 * 1. master 模型 uid = 'shared-uid'，维护共享 stepParams
 * 2. fork1、fork2 具有各自局部 props.title，但点击按钮修改共享 name 后，两处即时同步
 */
class HelloFlowModel extends FlowModel {
  render() {
    const { name, color } = this.getProps();
    return (
      <Card>
        <div style={{ marginTop: 8 }}>name: {name}</div>
        <div style={{ marginTop: 8, color: color || '#333' }}>color: {color}</div>
      </Card>
    );
  }
}

// 一个简单的 flow，用来把 stepParams.name 写入 props.name
HelloFlowModel.registerFlow('setNameFlow', {
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        name: {
          type: 'string',
          title: 'Name',
          'x-component': Input,
        },
      },
      defaultParams: {
        name: 'NocoBase',
      },
      handler(ctx, params) {
        ctx.model.setProps('name', params.name);
      },
    },
  },
});

class PluginForkDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloFlowModel });

    // 创建 master
    const master = this.flowEngine.createModel({
      uid: 'shared-uid',
      use: 'HelloFlowModel',
      stepParams: {
        setNameFlow: {
          step1: { name: 'NocoBase' },
        },
      },
    });

    // 创建两个 fork
    const fork1 = master.createFork({ title: 'Fork A', color: 'red' });
    const fork2 = master.createFork({ title: 'Fork B', color: 'blue' });

    this.router.add('root', {
      path: '/',
      element: (
        <Space>
          <FlowModelRenderer model={ master } showFlowSettings />
          <FlowModelRenderer model={ fork1 } />
          <FlowModelRenderer model={ fork2 } />
        </Space>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginForkDemo],
});

export default app.getRootComponent(); 