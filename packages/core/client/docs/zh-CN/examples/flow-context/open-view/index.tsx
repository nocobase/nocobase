/**
 * defaultShowCode: true
 * title: 最小示例
 */

import { Application, Plugin, PluginFlowEngine, MockFlowModelRepository } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, FlowContextSelector, useFlowContext, useFlowView } from '@nocobase/flow-engine';
import { Button, Card, Space, Typography } from 'antd';
import React from 'react';

class OpenViewDemoModel extends FlowModel {
  render() {
    return (
      <Card title="ctx.openView：打开子页面">
        <Space>
          <Button
            onClick={() =>
              this.context.openView('demo-open-view', {
                mode: 'drawer',
                size: 'medium',
                pageModelClass: 'OpenViewContentModel',
                navigation: false,
                defineProperties: {
                  someContext: {
                    value: { name: '演示数据', email: 'demo@example.com' },
                    meta: {
                      title: '新定义上下文',
                      type: 'object',
                      properties: {
                        name: { title: '名称', type: 'string' },
                        email: { title: '邮箱', type: 'string' },
                      },
                    },
                  },
                },
              })
            }
          >
            打开抽屉
          </Button>
        </Space>
      </Card>
    );
  }
}

// 子页面内容模型：在弹窗/抽屉内展示 FlowContextSelector
class OpenViewContentModel extends FlowModel {
  render() {
    return <OpenViewContent />;
  }
}

const OpenViewContent: React.FC = () => {
  const ctx = useFlowContext();
  const view = useFlowView();
  const [value, setValue] = React.useState('');

  return (
    <div style={{ padding: 24 }}>
      <view.Header title={`新定义上下文`} />
      <Space direction="vertical" style={{ width: '100%' }}>
        <FlowContextSelector
          value={value}
          onChange={(val) => setValue(val)}
          metaTree={() => ctx.getPropertyMetaTree()}
          style={{ width: 360 }}
          showSearch
        >
          <Button type="primary">选择上下文变量</Button>
        </FlowContextSelector>
      </Space>
    </div>
  );
};

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ OpenViewDemoModel, OpenViewContentModel });
    // 使用本地 Mock 仓库，避免依赖后端接口，并清理旧数据避免历史配置干扰
    const repo = new MockFlowModelRepository('demo-open-view:');
    await repo.clear();
    this.flowEngine.setModelRepository(repo);

    const model = this.flowEngine.createModel({ use: 'OpenViewDemoModel' });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFlowEngine, PluginDemo],
});
export default app.getRootComponent();
