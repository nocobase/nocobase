import * as icons from '@ant-design/icons';
import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  getInstanceFlows() {
    return [...this.flowRegistry.getFlows().values()];
  }
  render() {
    return (
      <div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>Flow count: {this.flowRegistry.getFlows().size}</div>
          {this.getInstanceFlows().map((flow) => (
            <Card
              key={flow.key}
              title={`Flow: ${flow.title}`}
              actions={[
                <Button
                  key="edit"
                  onClick={() => {
                    flow.title = `Edited ${flow.title}`;
                    flow.on = `click:${flow.key}`;
                    flow.save();
                  }}
                >
                  Edit
                </Button>,
                <Button
                  key="remove"
                  onClick={() => {
                    flow.remove();
                  }}
                >
                  Remove(local)
                </Button>,
                <Button
                  key="delete"
                  onClick={() => {
                    flow.destroy();
                  }}
                >
                  Destroy(remote)
                </Button>,
                <Button
                  key="add-step"
                  onClick={() => {
                    const step = flow.addStep(`step_${uid()}`, {
                      title: `New Step ${uid()}`,
                    });
                    step.save();
                  }}
                >
                  Add step
                </Button>,
              ]}
            >
              <pre>{JSON.stringify(flow.serialize(), null, 2)}</pre>
              <div>Steps:</div>
              <ul>
                {flow.mapSteps((step) => (
                  <li key={step.key}>
                    {step.title}{' '}
                    <Space>
                      <a
                        onClick={() => {
                          step.title = `Edited ${step.title}`;
                          step.save();
                        }}
                      >
                        Edit
                      </a>
                      <a
                        onClick={() => {
                          step.remove();
                        }}
                      >
                        Remove
                      </a>
                      <a
                        onClick={() => {
                          step.destroy();
                        }}
                      >
                        Destroy
                      </a>
                    </Space>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <Button
            onClick={() => {
              const key = `f_${uid()}`;
              const flow = this.flowRegistry.addFlow(key, {
                title: key,
                steps: {},
              });
              flow.save();
            }}
          >
            Add Flow
          </Button>
        </Space>
      </div>
    );
  }
}

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 启用 Flow Settings
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ MyModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
      flowRegistry: {
        flow1: {
          title: 'Flow 1',
          steps: {
            step1: { title: 'Step 1' },
            step2: { title: 'Step 2' },
            step3: { title: 'Step 3' },
          },
        },
      },
    });
    // 注册路由，渲染模型
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
