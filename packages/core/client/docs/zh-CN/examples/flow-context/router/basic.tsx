/**
 * defaultShowCode: true
 * title: Hello World
 */

/**
 * 示例代码展示如何使用 NocoBase 的插件和模型功能。
 * - 定义了一个简单的 HelloModel，用于渲染一个 "Hello, NocoBase!" 的 UI 块。
 * - 创建了一个插件 PluginHelloModel，注册模型并将其渲染到路由中。
 * - 最后通过 Application 实例加载插件并启动应用。
 */
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

/**
 * HelloModel 是一个简单的 FlowModel。
 * 它定义了一个 render 方法，用于渲染一个包含标题和描述的 UI 块。
 */
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
              this.context.router.navigate('/about');
            }}
          >
            Go to About Page
          </a>
        </p>
      </div>
    );
  }
}

class AboutModel extends FlowModel {
  render() {
    return (
      <div>
        <h1>AboutModel</h1>
        <p>This is the About Page.</p>
        <p>Here you can find more information about this example.</p>
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

/**
 * PluginHelloModel 是一个插件类，用于注册 HelloModel 并将其添加到路由中。
 * - load 方法会在插件加载时执行。
 * - 注册模型到 flowEngine，并创建一个模型实例。
 * - 将模型实例渲染到根路径 '/' 的路由中。
 */
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModels({ HomeModel, AboutModel });

    // 创建 HelloModel 的实例（仅用于示例）
    const homeModel = this.flowEngine.createModel({
      use: 'HomeModel',
    });

    const aboutModel = this.flowEngine.createModel({
      use: 'AboutModel',
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('home', {
      path: '/',
      element: <FlowModelRenderer model={homeModel} />,
    });
    this.router.add('about', {
      path: '/about',
      element: <FlowModelRenderer model={aboutModel} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
