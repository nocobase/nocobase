import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, reaction } from '@nocobase/flow-engine';
import React from 'react';

class HomeModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>HomeModel</h1>
        <p>Welcome to the Home Page!</p>
        <p>This is a simple example of a FlowModel in NocoBase.</p>
        <p>
          <a
            onClick={(e) => {
              e.preventDefault();
              this.context.router.navigate('/posts/slug-1');
            }}
          >
            Go to post-1
          </a>
        </p>
        <p>
          <a
            onClick={(e) => {
              e.preventDefault();
              this.context.router.navigate('/posts/slug-2');
            }}
          >
            Go to post-2
          </a>
        </p>
      </div>
    );
  }
}

class PostModel extends FlowModel {
  render() {
    const { route } = this.context;
    return (
      <div>
        <h1>PostModel - {route.params.name}</h1>
        <p>This is the Post Page.</p>
        <p>Here you can find more information about this example.</p>
        <pre>{JSON.stringify(route, null, 2)}</pre>
        <p>
          <a
            onClick={(e) => {
              e.preventDefault();
              this.context.router.navigate('/');
            }}
          >
            Go back to Home Page
          </a>
        </p>
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HomeModel, PostModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const homeModel = this.flowEngine.createModel({
      use: 'HomeModel',
    });

    const postModel = this.flowEngine.createModel({
      use: 'PostModel',
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('home', {
      path: '/',
      element: <FlowModelRenderer model={homeModel} />,
    });
    this.router.add('post', {
      path: '/posts/:name',
      element: <FlowModelRenderer model={postModel} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
