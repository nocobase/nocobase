import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, AddSubModelButton } from '@nocobase/flow-engine';
import { Button, Card } from 'antd';
import React from 'react';

class SubModel1 extends FlowModel {
  render() {
    return <Card style={{ marginBottom: 24 }}>{this.props.children}</Card>;
  }
}

SubModel1.registerFlow({
  key: 'myflow',
  auto: true,
  title: '子模型 1',
  steps: {
    step1: {
      title: '步骤 1',
      paramsRequired: true,
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-component-props': {
            placeholder: '请输入标题',
          },
          title: '标题',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
      },
    },
  },
});

class MyModel extends FlowModel {
  // 渲染模型内容
  render() {
    return (
      <div>
        {this.mapSubModels('items', (item) => (
          <FlowModelRenderer model={item} showFlowSettings />
        ))}
        <div />
        <AddSubModelButton
          model={this}
          subModelKey={'items'}
          items={async () => {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return [
              {
                key: 'subModel1',
                label: '子模型 1',
                disabled: true,
                icon: <span>🔧</span>,
                createModelOptions: {
                  use: 'SubModel1',
                  stepParams: {
                    myflow: {
                      step1: {
                        title: '子模型 1',
                      },
                    },
                  },
                },
              },
              {
                key: 'subModel2',
                label: '子模型 2',
                icon: <span>🛠️</span>,
                createModelOptions: {
                  use: 'SubModel1',
                  stepParams: {
                    myflow: {
                      step1: {
                        title: '子模型 2',
                      },
                    },
                  },
                },
              },
              {
                key: 'b-group',
                label: '模型 B 组',
                icon: <span>🛠️</span>,
                children: async () => {
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                  return [
                    {
                      key: 'b1',
                      label: '模型 B1',
                      icon: <span>🛠️</span>,
                      createModelOptions: {
                        use: 'SubModel1',
                        stepParams: {
                          myflow: {
                            step1: {
                              title: '子模型 B1',
                            },
                          },
                        },
                      },
                    },
                    {
                      key: 'b2',
                      label: '模型 B2',
                      icon: <span>🛠️</span>,
                      createModelOptions: {
                        use: 'SubModel1',
                        stepParams: {
                          myflow: {
                            step1: {
                              title: '子模型 B2',
                            },
                          },
                        },
                      },
                    },
                  ];
                },
              },
            ];
          }}
        >
          <Button>添加子模型</Button>
        </AddSubModelButton>
      </div>
    );
  }
}

// 插件类，负责注册模型、仓库，并加载或创建模型实例
class PluginHelloModel extends Plugin {
  async load() {
    // 注册自定义模型
    this.flowEngine.registerModels({ MyModel, SubModel1 });
    // 加载或创建模型实例（如不存在则创建并初始化）
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'MyModel',
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
