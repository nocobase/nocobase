import { PlusOutlined } from '@ant-design/icons';
import { observer } from '@formily/reactive-react';
import { Application, MockFlowModelRepository, Plugin } from '@nocobase/client';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModel,
  FlowModelRenderer,
  useFlowEngine,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Avatar, Button, Card, Space } from 'antd';
import React from 'react';

function useLoadOrCreateFlowModel(options) {
  const engine = useFlowEngine();
  const { loading, data } = useRequest(
    async () => {
      let model: HelloModel = await engine.loadModel(options);
      if (!model) {
        model = engine.createModel<HelloModel>(options);
        model.isNewModel = true; // 标记为新模型
      }
      return model;
    },
    {
      refreshDeps: [options.uid],
    },
  );
  return { loading, model: data };
}

const Length = observer((props: any) => {
  const { model } = props;
  return model.hasSubModel('subs') && <span>{model.subModels.subs?.length} items</span>;
});

function HelloComponent(props) {
  const { loading, model } = useLoadOrCreateFlowModel({
    uid: props.uid,
    use: 'HelloModel',
  });
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <FlowModelRenderer model={model} />
      <Length model={model} />
    </div>
  );
}

class HelloModel extends FlowModel {
  isNewModel = false;
  render() {
    return (
      <div>
        <h1>拖拽演示（DND Example）</h1>
        <p>你可以拖动子模型卡片，或点击下方按钮添加/清空子模型。</p>
        <DndProvider>
          <Space>
            {this.mapSubModels('subs', (subModel) => (
              <Droppable key={subModel.uid} model={subModel}>
                <FlowModelRenderer
                  key={subModel.uid}
                  model={subModel}
                  showFlowSettings
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            ))}

            <Space>
              <AddSubModelButton
                model={this}
                subModelKey="subs"
                onSubModelAdded={async (subModel) => {
                  if (this.isNewModel) {
                    await this.save();
                    this.isNewModel = false;
                  }
                }}
                items={[
                  {
                    key: 'sub1',
                    useModel: 'HelloSubModel',
                    label: 'Sub Model 1',
                    createModelOptions: {
                      props: {
                        name: 'name1',
                      },
                    },
                  },
                  {
                    key: 'sub2',
                    useModel: 'HelloSubModel',
                    label: 'Sub Model 2',
                    createModelOptions: {
                      props: {
                        name: 'name2',
                      },
                    },
                  },
                ]}
              >
                <Button type="dashed" style={{ height: 64, width: 64 }} size="large" icon={<PlusOutlined />} />
              </AddSubModelButton>
              <Button
                size="large"
                style={{ height: 64 }}
                onClick={async () => {
                  this.context.engine.modelRepository['clear']();
                  window.location.reload();
                }}
              >
                清空
              </Button>
            </Space>
          </Space>
        </DndProvider>
      </div>
    );
  }
}

class HelloSubModel extends FlowModel {
  render() {
    return (
      <div>
        <Avatar
          shape="square"
          size={64}
          src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${Math.floor(Math.random() * 100)}`}
        >
          {this.props.name}
        </Avatar>
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel, HelloSubModel });
    this.flowEngine.setModelRepository(new MockFlowModelRepository('load-model-test:'));
    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <HelloComponent uid="hello1" />
        </div>
      ),
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
