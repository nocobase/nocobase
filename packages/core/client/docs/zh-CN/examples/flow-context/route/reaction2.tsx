import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, reaction } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { Outlet } from 'react-router-dom';

class HomeModel extends FlowModel {
  #disposer: () => void | null = null;
  targetRef = React.createRef<HTMLDivElement>();

  onMount() {
    this.#disposer = reaction(
      () => this.context.route, // 观察的字段
      (route, oldRoute) => {
        console.log('route changed:', route, oldRoute);
        if (route?.path === '/posts/:name') {
          this.context.viewer.open({
            type: 'embed',
            // width: 800,
            content: 'This is a embed view1. pathname: ' + route.pathname,
            target: this.targetRef.current,
          });
          this.context.viewer.open({
            type: 'drawer',
            width: 800,
            content: 'This is a embed view1. pathname: ' + route.pathname,
          });
        }
      },
      {
        fireImmediately: true, // 立即执行一次
      },
    );
  }
  onUnmount() {
    if (this.#disposer) {
      this.#disposer(); // 取消 reaction 监听
      this.#disposer = null;
    }
  }
  render() {
    const { route } = this.context;
    return (
      <div>
        <h1>HomeModel - {route.pathname}</h1>
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

        <Outlet />
        <Card>
          <div ref={this.targetRef} />
        </Card>
      </div>
    );
  }
}

class PostModel extends FlowModel {
  render() {
    const { route } = this.context;
    return (
      <div>
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
        <pre>{JSON.stringify(route, null, 2)}</pre>
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
    this.router.add('home.post', {
      path: '/posts/:name',
      element: <FlowModelRenderer model={postModel} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'hash' },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
