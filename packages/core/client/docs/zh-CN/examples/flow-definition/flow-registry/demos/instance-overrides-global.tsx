import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, message } from 'antd';
import React from 'react';

// 模型类
class MyModel extends FlowModel {
  render() {
    return (
      <Space>
        <Button type="primary" onClick={() => this.dispatchEvent('click')}>
          触发点击事件
        </Button>
        <div>流数量: {this.getFlows().size}</div>
      </Space>
    );
  }
}

// 注册一个类级（全局）流：key = shared
MyModel.registerFlow({
  key: 'shared',
  title: '类级点击流',
  on: 'click',
  steps: {
    s1: {
      title: '类级步骤',
      handler() {
        message.info('类级 shared 流被触发');
      },
    },
  },
});

// 插件：演示实例流覆盖同名类级流
class PluginInstanceOverridesGlobal extends Plugin {
  async load() {
    this.flowEngine.registerModels({ MyModel });

    const model = this.flowEngine.createModel({ use: 'MyModel', uid: 'override-demo' });

    // 注册一个实例级流，与类级流同 key = shared（实例优先）
    model.registerFlow('shared', {
      title: '实例点击流（覆盖）',
      on: 'click',
      steps: {
        s1: {
          title: '实例步骤',
          handler() {
            message.success('实例 shared 流被触发（覆盖类级）');
          },
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <FlowModelRenderer model={model} />
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginInstanceOverridesGlobal],
});

export default app.getRootComponent();
