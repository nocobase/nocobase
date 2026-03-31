import { Application, FlowModelRepository, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

function useFlowModelById(uid: string) {
  const engine = useFlowEngine();
  const { loading, data } = useRequest(
    () => {
      return engine.loadModel({ uid });
    },
    {
      refreshDeps: [uid],
    },
  );
  return { loading, model: data };
}

function HelloComponent() {
  const { loading, model } = useFlowModelById('hello1');
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!model) {
    return <div>Model not found</div>;
  }
  return (
    <div>
      <FlowModelRenderer model={model} />
    </div>
  );
}

class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloModel.</p>
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HelloModel });
    this.flowEngine.setModelRepository(new FlowModelRepository(this.app));
    const mock = new MockAdapter(this.app.apiClient.axios);

    mock.onGet('/flowModels:findOne').reply(() => {
      return [
        200,
        {
          data: {
            use: 'HelloModel',
            uid: 'hello1',
          },
        },
      ];
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <HelloComponent />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
